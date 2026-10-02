import { BadRequestException, Injectable } from '@nestjs/common';
import { BookingStatus, SessionStatus, UserStatus } from '@prisma/client';
import { AuthUser } from '../../auth/auth-user';
import { AnalyticsService } from '../../analytics/application/analytics.service';
import { NotificationsService } from '../../notifications/application/notifications.service';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../common/errors/domain-error';
import { MentoringSession } from '../domain/session';
import { isNoShowEligible, isWithinJoinWindow } from '../domain/join-window';
import { UpsertSessionSummaryDto } from '../dto/session.dto';
import { SessionsRepository } from '../persistence/sessions.repository';

@Injectable()
export class SessionsService {
  constructor(
    private readonly sessionsRepository: SessionsRepository,
    private readonly analyticsService: AnalyticsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getById(user: AuthUser, sessionId: string): Promise<MentoringSession> {
    const session = await this.requireSession(sessionId);
    this.assertParticipant(user, session);
    return session;
  }

  async getByBookingId(
    user: AuthUser,
    bookingId: string,
  ): Promise<MentoringSession> {
    const session = await this.sessionsRepository.findByBookingId(bookingId);
    if (!session) {
      throw new NotFoundError('Session not found');
    }
    this.assertParticipant(user, session);
    return session;
  }

  async listMine(
    user: AuthUser,
    options?: { upcoming?: boolean },
  ): Promise<MentoringSession[]> {
    this.assertActive(user);
    return this.sessionsRepository.listForUser(user.id, options);
  }

  async join(user: AuthUser, sessionId: string): Promise<MentoringSession> {
    this.assertActive(user);
    const session = await this.requireSession(sessionId);
    this.assertParticipant(user, session);

    if (session.bookingStatus !== BookingStatus.ACCEPTED) {
      throw new ConflictError('Booking is not active for joining');
    }
    if (
      session.status !== SessionStatus.READY &&
      session.status !== SessionStatus.IN_PROGRESS
    ) {
      throw new ConflictError('Session cannot be joined');
    }

    const now = new Date();
    if (
      !isWithinJoinWindow(now, session.bookingStartAt, session.bookingEndAt)
    ) {
      throw new BadRequestException('Outside session join window');
    }

    const asMentor = session.mentorUserId === user.id;
    const updated = await this.sessionsRepository.recordJoin({
      sessionId: session.id,
      asMentor,
      joinedAt: now,
    });

    await this.analyticsService.recordSessionJoined(user.id, {
      sessionId: updated.id,
      bookingId: updated.bookingId,
    });

    return updated;
  }

  async complete(user: AuthUser, sessionId: string): Promise<MentoringSession> {
    this.assertActive(user);
    const session = await this.requireSession(sessionId);
    this.assertParticipant(user, session);

    if (
      session.status !== SessionStatus.READY &&
      session.status !== SessionStatus.IN_PROGRESS
    ) {
      throw new ConflictError('Session cannot be completed');
    }
    if (session.bookingStatus !== BookingStatus.ACCEPTED) {
      throw new ConflictError('Booking is not active');
    }
    if (!session.mentorJoinedAt || !session.apprenticeJoinedAt) {
      throw new ConflictError(
        'Both participants must attend before completing',
      );
    }

    const completed = await this.sessionsRepository.complete(
      session.id,
      new Date(),
    );

    await this.analyticsService.recordSessionCompleted(user.id, {
      sessionId: completed.id,
      bookingId: completed.bookingId,
    });

    await this.notificationsService.notifyFeedbackRequested({
      userId: completed.mentorUserId,
      sessionId: completed.id,
    });
    await this.notificationsService.notifyFeedbackRequested({
      userId: completed.apprenticeUserId,
      sessionId: completed.id,
    });

    return completed;
  }

  async reportNoShow(
    user: AuthUser,
    sessionId: string,
  ): Promise<MentoringSession> {
    this.assertActive(user);
    const session = await this.requireSession(sessionId);
    this.assertParticipant(user, session);

    if (
      session.status !== SessionStatus.READY &&
      session.status !== SessionStatus.IN_PROGRESS
    ) {
      throw new ConflictError('Session cannot be marked no-show');
    }
    if (session.bookingStatus !== BookingStatus.ACCEPTED) {
      throw new ConflictError('Booking is not active');
    }

    const now = new Date();
    if (!isNoShowEligible(now, session.bookingStartAt, session.bookingEndAt)) {
      throw new BadRequestException('No-show not allowed outside join window');
    }

    if (session.mentorJoinedAt && session.apprenticeJoinedAt) {
      throw new ConflictError(
        'Both participants attended; cannot mark no-show',
      );
    }

    const reporterIsMentor = session.mentorUserId === user.id;
    const mentorAbsent = !session.mentorJoinedAt;
    const apprenticeAbsent = !session.apprenticeJoinedAt;

    let absentUserId: string;
    if (mentorAbsent && apprenticeAbsent) {
      // Reporter claims the other party is absent (self may also not have joined)
      absentUserId = reporterIsMentor
        ? session.apprenticeUserId
        : session.mentorUserId;
    } else if (mentorAbsent) {
      absentUserId = session.mentorUserId;
    } else {
      absentUserId = session.apprenticeUserId;
    }

    const updated = await this.sessionsRepository.markNoShow({
      sessionId: session.id,
      absentUserId,
      reportedByUserId: user.id,
      endedAt: now,
    });

    await this.analyticsService.recordSessionNoShow(user.id, {
      sessionId: updated.id,
      bookingId: updated.bookingId,
      absentUserId,
    });

    return updated;
  }

  async reportTechnicalFailure(
    user: AuthUser,
    sessionId: string,
  ): Promise<MentoringSession> {
    this.assertActive(user);
    const session = await this.requireSession(sessionId);
    this.assertParticipant(user, session);

    if (
      session.status !== SessionStatus.READY &&
      session.status !== SessionStatus.IN_PROGRESS
    ) {
      throw new ConflictError('Session cannot be marked failed');
    }
    if (session.bookingStatus !== BookingStatus.ACCEPTED) {
      throw new ConflictError('Booking is not active');
    }

    const updated = await this.sessionsRepository.markTechnicalFailure({
      sessionId: session.id,
      reportedByUserId: user.id,
      endedAt: new Date(),
    });

    await this.analyticsService.recordSessionTechFailure(user.id, {
      sessionId: updated.id,
      bookingId: updated.bookingId,
    });

    return updated;
  }

  async upsertSummary(
    user: AuthUser,
    sessionId: string,
    dto: UpsertSessionSummaryDto,
  ): Promise<MentoringSession> {
    this.assertActive(user);
    const session = await this.requireSession(sessionId);
    this.assertParticipant(user, session);

    if (session.mentorUserId !== user.id) {
      throw new ForbiddenError('Only the mentor may edit the session summary');
    }
    if (session.status !== SessionStatus.COMPLETED) {
      throw new ConflictError('Summary allowed only after completion');
    }

    return this.sessionsRepository.upsertSummary({
      sessionId: session.id,
      summary: dto.summary,
      nextStep: dto.nextStep,
      actorUserId: user.id,
    });
  }

  async cancelForBooking(bookingId: string): Promise<void> {
    const cancelled = await this.sessionsRepository.cancelForBooking(
      bookingId,
      new Date(),
    );
    if (cancelled) {
      await this.analyticsService.recordSessionCancelled(null, {
        sessionId: cancelled.id,
        bookingId,
      });
    }
  }

  private async requireSession(sessionId: string): Promise<MentoringSession> {
    const session = await this.sessionsRepository.findById(sessionId);
    if (!session) {
      throw new NotFoundError('Session not found');
    }
    return session;
  }

  private assertParticipant(user: AuthUser, session: MentoringSession): void {
    if (
      session.mentorUserId !== user.id &&
      session.apprenticeUserId !== user.id
    ) {
      throw new ForbiddenError('Not a participant of this session');
    }
  }

  private assertActive(user: AuthUser): void {
    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenError('Account is not active');
    }
  }
}
