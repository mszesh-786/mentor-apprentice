import {
  BadRequestException,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import {
  AvailabilityRuleStatus,
  BookingStatus,
  ExpertiseStatus,
  PublicationStatus,
  Role,
  UserStatus,
  VerificationStatus,
} from '@prisma/client';
import { AuthUser } from '../../auth/auth-user';
import { AnalyticsService } from '../../analytics/application/analytics.service';
import { NotificationsService } from '../../notifications/application/notifications.service';
import { ApprenticesRepository } from '../../apprentices/persistence/apprentices.repository';
import { BlocksService } from '../../blocks/application/blocks.service';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../common/errors/domain-error';
import {
  fitsWeeklyAvailability,
  generateSlots,
  getZonedParts,
  isAllowedDuration,
  isBlockedByException,
} from '../../common/scheduling/scheduling';
import { AvailabilityService } from '../../mentors/availability/application/availability.service';
import { MentorsRepository } from '../../mentors/persistence/mentors.repository';
import { MentorshipsService } from '../../mentorships/application/mentorships.service';
import { SessionsService } from '../../sessions/application/sessions.service';
import { SkillsService } from '../../skills/application/skills.service';
import { UsersService } from '../../users/users.service';
import { VerificationService } from '../../verification/application/verification.service';
import { Booking } from '../domain/booking';
import { CreateBookingDto } from '../dto/booking.dto';
import { BookingsRepository } from '../persistence/bookings.repository';

@Injectable()
export class BookingsService {
  constructor(
    private readonly bookingsRepository: BookingsRepository,
    private readonly mentorsRepository: MentorsRepository,
    private readonly apprenticesRepository: ApprenticesRepository,
    private readonly availabilityService: AvailabilityService,
    private readonly skillsService: SkillsService,
    private readonly usersService: UsersService,
    private readonly verificationService: VerificationService,
    @Inject(forwardRef(() => BlocksService))
    private readonly blocksService: BlocksService,
    private readonly analyticsService: AnalyticsService,
    private readonly notificationsService: NotificationsService,
    @Inject(forwardRef(() => SessionsService))
    private readonly sessionsService: SessionsService,
    @Inject(forwardRef(() => MentorshipsService))
    private readonly mentorshipsService: MentorshipsService,
  ) {}

  async create(user: AuthUser, dto: CreateBookingDto): Promise<Booking> {
    this.assertActive(user);
    this.assertEmailVerified(user);
    if (!user.roles.includes(Role.APPRENTICE)) {
      throw new ForbiddenError('Apprentice role required');
    }
    if (!isAllowedDuration(dto.durationMinutes)) {
      throw new BadRequestException('Invalid durationMinutes');
    }

    const apprentice = await this.apprenticesRepository.findByUserId(user.id);
    if (!apprentice) {
      throw new NotFoundError('Apprentice profile not found');
    }

    const mentor = await this.mentorsRepository.findById(dto.mentorProfileId);
    if (!mentor) {
      throw new NotFoundError('Mentor not found');
    }
    if (mentor.userId === user.id) {
      throw new BadRequestException('Cannot book yourself');
    }

    await this.assertBookableMentor(user.id, mentor.userId, mentor);

    const skill = await this.skillsService.assertActiveSkill(dto.skillId);
    const hasExpertise = mentor.expertise.some(
      (entry) =>
        entry.skillId === skill.id && entry.status === ExpertiseStatus.ACTIVE,
    );
    if (!hasExpertise) {
      throw new BadRequestException('Mentor does not offer this skill');
    }

    const startAt = new Date(dto.startAt);
    if (Number.isNaN(startAt.getTime())) {
      throw new BadRequestException('Invalid startAt');
    }
    const endAt = new Date(startAt.getTime() + dto.durationMinutes * 60_000);
    if (startAt >= endAt) {
      throw new BadRequestException('startAt must be before endAt');
    }
    if (startAt.getTime() < Date.now() - 60_000) {
      throw new BadRequestException('Cannot book in the past');
    }

    const timezone = mentor.timezone ?? 'UTC';
    await this.assertSlotAvailable(mentor.id, startAt, endAt, timezone);

    const activeMentorship =
      await this.mentorshipsService.findActiveForPairSkill(
        mentor.id,
        apprentice.id,
        skill.id,
      );

    const booking = await this.bookingsRepository.create({
      mentorProfileId: mentor.id,
      apprenticeProfileId: apprentice.id,
      skillId: skill.id,
      startAt,
      endAt,
      timezoneSnapshot: timezone,
      apprenticeMessage: dto.apprenticeMessage,
      relationshipId: activeMentorship?.id,
    });

    await this.analyticsService.recordBookingRequested(user.id, {
      bookingId: booking.id,
      mentorProfileId: mentor.id,
      skillId: skill.id,
    });

    await this.notificationsService.notifyBookingRequested({
      mentorUserId: mentor.userId,
      bookingId: booking.id,
      apprenticeDisplayName: booking.apprenticeDisplayName,
    });

    return booking;
  }

  async accept(user: AuthUser, bookingId: string): Promise<Booking> {
    this.assertActive(user);
    const booking = await this.requireBooking(bookingId);
    if (booking.mentorUserId !== user.id) {
      throw new ForbiddenError('Only the mentor may accept this booking');
    }
    if (booking.status !== BookingStatus.REQUESTED) {
      throw new ConflictError('Booking is not pending');
    }

    const reserved = await this.bookingsRepository.findReservedOverlapping(
      booking.mentorProfileId,
      booking.startAt,
      booking.endAt,
    );
    if (reserved.length > 0) {
      throw new ConflictError('Time slot is already reserved');
    }

    const conflicts = await this.bookingsRepository.findRequestedOverlapping(
      booking.mentorProfileId,
      booking.startAt,
      booking.endAt,
      booking.id,
    );

    try {
      const accepted = await this.bookingsRepository.acceptWithConflictDecline(
        booking.id,
        conflicts.map((item) => item.id),
      );

      await this.analyticsService.recordBookingAccepted(user.id, {
        bookingId: accepted.id,
      });

      await this.notificationsService.notifyBookingAccepted({
        apprenticeUserId: accepted.apprenticeUserId,
        bookingId: accepted.id,
        mentorDisplayName: accepted.mentorDisplayName,
      });

      return accepted;
    } catch (error) {
      if (error instanceof Error && error.message === 'BOOKING_NOT_PENDING') {
        throw new ConflictError('Booking is not pending');
      }
      if (error instanceof Error && error.message === 'BOOKING_SLOT_RESERVED') {
        throw new ConflictError('Time slot is already reserved');
      }
      throw error;
    }
  }

  async decline(user: AuthUser, bookingId: string): Promise<Booking> {
    this.assertActive(user);
    const booking = await this.requireBooking(bookingId);
    if (booking.mentorUserId !== user.id) {
      throw new ForbiddenError('Only the mentor may decline this booking');
    }
    if (booking.status !== BookingStatus.REQUESTED) {
      throw new ConflictError('Booking is not pending');
    }

    const declined = await this.bookingsRepository.updateStatus(booking.id, {
      status: BookingStatus.DECLINED,
      declineReason: 'MENTOR_DECLINED',
    });

    await this.analyticsService.recordBookingDeclined(user.id, {
      bookingId: declined.id,
    });

    await this.notificationsService.notifyBookingDeclined({
      apprenticeUserId: declined.apprenticeUserId,
      bookingId: declined.id,
      mentorDisplayName: declined.mentorDisplayName,
    });

    return declined;
  }

  async cancelOpenBetweenUsers(
    actorUserId: string,
    userAId: string,
    userBId: string,
  ): Promise<void> {
    const open = await this.bookingsRepository.findOpenBetweenUsers(
      userAId,
      userBId,
    );
    for (const booking of open) {
      await this.bookingsRepository.updateStatus(booking.id, {
        status: BookingStatus.CANCELLED,
        cancelledByUserId: actorUserId,
        cancelReason: 'USER_BLOCKED',
      });
      if (booking.status === BookingStatus.ACCEPTED) {
        await this.sessionsService.cancelForBooking(booking.id);
      }
      await this.analyticsService.recordBookingCancelled(actorUserId, {
        bookingId: booking.id,
      });
      const recipientUserId =
        booking.mentorUserId === actorUserId
          ? booking.apprenticeUserId
          : booking.mentorUserId;
      await this.notificationsService.notifyBookingCancelled({
        recipientUserId,
        bookingId: booking.id,
        cancelReason: 'USER_BLOCKED',
      });
    }
  }

  async cancel(user: AuthUser, bookingId: string): Promise<Booking> {
    this.assertActive(user);
    const booking = await this.requireBooking(bookingId);
    const isMentor = booking.mentorUserId === user.id;
    const isApprentice = booking.apprenticeUserId === user.id;
    if (!isMentor && !isApprentice) {
      throw new ForbiddenError('Not a participant of this booking');
    }

    if (
      booking.status !== BookingStatus.REQUESTED &&
      booking.status !== BookingStatus.ACCEPTED
    ) {
      throw new ConflictError('Booking cannot be cancelled');
    }

    if (isMentor && booking.status === BookingStatus.REQUESTED) {
      throw new BadRequestException(
        'Mentor should decline pending requests instead of cancelling',
      );
    }

    const cancelled = await this.bookingsRepository.updateStatus(booking.id, {
      status: BookingStatus.CANCELLED,
      cancelledByUserId: user.id,
      cancelReason: 'USER_CANCELLED',
    });

    if (booking.status === BookingStatus.ACCEPTED) {
      await this.sessionsService.cancelForBooking(cancelled.id);
    }

    await this.analyticsService.recordBookingCancelled(user.id, {
      bookingId: cancelled.id,
    });

    const recipientUserId = isMentor
      ? booking.apprenticeUserId
      : booking.mentorUserId;
    await this.notificationsService.notifyBookingCancelled({
      recipientUserId,
      bookingId: cancelled.id,
      cancelReason: cancelled.cancelReason,
    });

    return cancelled;
  }

  async getById(user: AuthUser, bookingId: string): Promise<Booking> {
    const booking = await this.requireBooking(bookingId);
    if (
      booking.mentorUserId !== user.id &&
      booking.apprenticeUserId !== user.id
    ) {
      throw new ForbiddenError('Not a participant of this booking');
    }
    return booking;
  }

  async listMine(
    user: AuthUser,
    options?: { upcoming?: boolean },
  ): Promise<Booking[]> {
    this.assertActive(user);
    const isMentor = user.roles.includes(Role.MENTOR);
    const isApprentice = user.roles.includes(Role.APPRENTICE);

    if (isMentor && !isApprentice) {
      return this.bookingsRepository.listForMentorUser(user.id, options);
    }
    if (isApprentice && !isMentor) {
      return this.bookingsRepository.listForApprenticeUser(user.id, options);
    }

    const [mentorBookings, apprenticeBookings] = await Promise.all([
      this.bookingsRepository.listForMentorUser(user.id, options),
      this.bookingsRepository.listForApprenticeUser(user.id, options),
    ]);
    const byId = new Map<string, Booking>();
    for (const booking of [...mentorBookings, ...apprenticeBookings]) {
      byId.set(booking.id, booking);
    }
    return [...byId.values()].sort(
      (left, right) => left.startAt.getTime() - right.startAt.getTime(),
    );
  }

  async listSlots(
    viewer: AuthUser,
    mentorProfileId: string,
    input: { from: string; to: string; durationMinutes: number },
  ): Promise<Array<{ startAt: string; endAt: string }>> {
    this.assertActive(viewer);
    if (!isAllowedDuration(input.durationMinutes)) {
      throw new BadRequestException('Invalid durationMinutes');
    }

    const mentor = await this.mentorsRepository.findById(mentorProfileId);
    if (!mentor) {
      throw new NotFoundError('Mentor not found');
    }
    await this.assertBookableMentor(viewer.id, mentor.userId, mentor);

    const from = new Date(input.from);
    const to = new Date(input.to);
    if (
      Number.isNaN(from.getTime()) ||
      Number.isNaN(to.getTime()) ||
      from >= to
    ) {
      throw new BadRequestException('Invalid from/to range');
    }

    const timezone = mentor.timezone ?? 'UTC';
    const rules = (
      await this.availabilityService.getActiveRulesForMentor(mentor.id)
    ).map((rule) => ({
      dayOfWeek: rule.dayOfWeek,
      startTime: rule.startTime,
      endTime: rule.endTime,
      timezone: rule.timezone,
    }));

    const fromParts = getZonedParts(from, timezone);
    const toParts = getZonedParts(to, timezone);
    const exceptions = (
      await this.availabilityService.getExceptionsInRange(
        mentor.id,
        fromParts.date,
        toParts.date,
      )
    ).map((exception) => ({
      date: exception.date,
      startTime: exception.startTime,
      endTime: exception.endTime,
    }));

    const reserved = await this.bookingsRepository.findReservedOverlapping(
      mentor.id,
      from,
      to,
    );

    return generateSlots({
      from,
      to,
      durationMinutes: input.durationMinutes,
      rules,
      exceptions,
      timezone,
      reserved: reserved.map((booking) => ({
        startAt: booking.startAt,
        endAt: booking.endAt,
      })),
    });
  }

  private async assertSlotAvailable(
    mentorProfileId: string,
    startAt: Date,
    endAt: Date,
    timezone: string,
  ): Promise<void> {
    const rules = (
      await this.availabilityService.getActiveRulesForMentor(mentorProfileId)
    ).filter((rule) => rule.status === AvailabilityRuleStatus.ACTIVE);

    if (
      !fitsWeeklyAvailability(
        startAt,
        endAt,
        rules.map((rule) => ({
          dayOfWeek: rule.dayOfWeek,
          startTime: rule.startTime,
          endTime: rule.endTime,
          timezone: rule.timezone,
        })),
        timezone,
      )
    ) {
      throw new BadRequestException(
        'Requested time is outside mentor availability',
      );
    }

    const startParts = getZonedParts(startAt, timezone);
    const exceptions = await this.availabilityService.getExceptionsInRange(
      mentorProfileId,
      startParts.date,
      startParts.date,
    );
    if (
      isBlockedByException(
        startAt,
        endAt,
        exceptions.map((exception) => ({
          date: exception.date,
          startTime: exception.startTime,
          endTime: exception.endTime,
        })),
        timezone,
      )
    ) {
      throw new BadRequestException(
        'Requested time is blocked by a mentor unavailability exception',
      );
    }

    const reserved = await this.bookingsRepository.findReservedOverlapping(
      mentorProfileId,
      startAt,
      endAt,
    );
    if (reserved.length > 0) {
      throw new ConflictError('Requested time overlaps a reserved booking');
    }
  }

  private async assertBookableMentor(
    viewerUserId: string,
    mentorUserId: string,
    mentor: {
      id: string;
      publicationStatus: PublicationStatus;
      expertise: Array<{ status: ExpertiseStatus }>;
    },
  ): Promise<void> {
    const excluded = await this.blocksService.getExcludedUserIds(viewerUserId);
    if (excluded.includes(mentorUserId)) {
      throw new NotFoundError('Mentor not found');
    }

    const mentorUser = await this.usersService.findById(mentorUserId);
    if (!mentorUser || mentorUser.status !== UserStatus.ACTIVE) {
      throw new NotFoundError('Mentor not found');
    }

    if (mentor.publicationStatus !== PublicationStatus.PUBLISHED) {
      throw new NotFoundError('Mentor not found');
    }

    const identity =
      await this.verificationService.getIdentityStatus(mentorUserId);
    if (identity !== VerificationStatus.VERIFIED) {
      throw new NotFoundError('Mentor not found');
    }

    const hasAvailability =
      await this.availabilityService.hasActiveAvailability(mentor.id);
    const hasExpertise = mentor.expertise.some(
      (entry) => entry.status === ExpertiseStatus.ACTIVE,
    );
    if (!hasAvailability || !hasExpertise) {
      throw new NotFoundError('Mentor not found');
    }
  }

  private async requireBooking(bookingId: string): Promise<Booking> {
    const booking = await this.bookingsRepository.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }
    return booking;
  }

  private assertActive(user: AuthUser): void {
    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenError('Account is not active');
    }
  }

  private assertEmailVerified(user: AuthUser): void {
    if (!user.emailVerified) {
      throw new ForbiddenError('Email verification is required before booking');
    }
  }
}
