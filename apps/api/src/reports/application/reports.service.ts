import { BadRequestException, Injectable } from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { AuthUser } from '../../auth/auth-user';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../common/errors/domain-error';
import { UsersService } from '../../users/users.service';
import { ParticipantContext } from '../domain/report';
import { CreateUserReportDto } from '../dto/report.dto';
import { ReportsRepository } from '../persistence/reports.repository';

@Injectable()
export class ReportsService {
  constructor(
    private readonly reportsRepository: ReportsRepository,
    private readonly usersService: UsersService,
  ) {}

  async listMine(user: AuthUser) {
    this.assertActive(user);
    return this.reportsRepository.listForReporter(user.id);
  }

  async submit(user: AuthUser, dto: CreateUserReportDto) {
    this.assertActive(user);

    if (user.id === dto.reportedUserId) {
      throw new BadRequestException('Cannot report yourself');
    }

    const reported = await this.usersService.findById(dto.reportedUserId);
    if (!reported) {
      throw new NotFoundError('User not found');
    }

    const contextCount = [
      dto.bookingId,
      dto.sessionId,
      dto.mentorshipId,
    ].filter(Boolean).length;
    if (contextCount > 1) {
      throw new BadRequestException(
        'Provide at most one of bookingId, sessionId, or mentorshipId',
      );
    }

    let bookingId: string | null = dto.bookingId ?? null;
    let sessionId: string | null = dto.sessionId ?? null;
    let mentorshipId: string | null = dto.mentorshipId ?? null;

    if (sessionId) {
      const context = await this.requireSessionContext(user.id, sessionId);
      this.assertReportedCounterpart(context, user.id, dto.reportedUserId);
      bookingId = context.bookingId ?? null;
    } else if (bookingId) {
      const context = await this.requireBookingContext(user.id, bookingId);
      this.assertReportedCounterpart(context, user.id, dto.reportedUserId);
    } else if (mentorshipId) {
      const context = await this.requireMentorshipContext(user.id, mentorshipId);
      this.assertReportedCounterpart(context, user.id, dto.reportedUserId);
    } else {
      const hasInteraction = await this.reportsRepository.hasInteractionBetween(
        user.id,
        dto.reportedUserId,
      );
      if (!hasInteraction) {
        throw new ForbiddenError(
          'You can only report users you have interacted with on the platform',
        );
      }
    }

    const existing = await this.reportsRepository.findOpenReport(
      user.id,
      dto.reportedUserId,
    );
    if (existing) {
      throw new ConflictError('An open report already exists for this user');
    }

    return this.reportsRepository.create({
      reporterUserId: user.id,
      reportedUserId: dto.reportedUserId,
      bookingId,
      sessionId,
      mentorshipId,
      reason: dto.reason,
      description: dto.description.trim(),
    });
  }

  private assertActive(user: AuthUser): void {
    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenError('Account is not active');
    }
  }

  private async requireBookingContext(
    userId: string,
    bookingId: string,
  ): Promise<ParticipantContext> {
    const context = await this.reportsRepository.findBookingContext(bookingId);
    if (!context || !this.isParticipant(context, userId)) {
      throw new NotFoundError('Booking not found');
    }
    return context;
  }

  private async requireSessionContext(
    userId: string,
    sessionId: string,
  ): Promise<ParticipantContext> {
    const context = await this.reportsRepository.findSessionContext(sessionId);
    if (!context || !this.isParticipant(context, userId)) {
      throw new NotFoundError('Session not found');
    }
    return context;
  }

  private async requireMentorshipContext(
    userId: string,
    mentorshipId: string,
  ): Promise<ParticipantContext> {
    const context =
      await this.reportsRepository.findMentorshipContext(mentorshipId);
    if (!context || !this.isParticipant(context, userId)) {
      throw new NotFoundError('Mentorship not found');
    }
    return context;
  }

  private isParticipant(context: ParticipantContext, userId: string): boolean {
    return (
      context.mentorUserId === userId || context.apprenticeUserId === userId
    );
  }

  private assertReportedCounterpart(
    context: ParticipantContext,
    reporterUserId: string,
    reportedUserId: string,
  ): void {
    const counterpart =
      context.mentorUserId === reporterUserId
        ? context.apprenticeUserId
        : context.mentorUserId;
    if (counterpart !== reportedUserId) {
      throw new BadRequestException(
        'Reported user must be the other participant in the provided context',
      );
    }
  }
}
