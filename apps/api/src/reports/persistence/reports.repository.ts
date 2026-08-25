import { Injectable } from '@nestjs/common';
import { UserReportReason, UserReportStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ParticipantContext, UserReport } from '../domain/report';

const participantBookingInclude = {
  mentorProfile: { select: { userId: true } },
  apprenticeProfile: { select: { userId: true } },
} as const;

const participantSessionInclude = {
  booking: { include: participantBookingInclude },
} as const;

const participantMentorshipInclude = {
  mentorProfile: { select: { userId: true } },
  apprenticeProfile: { select: { userId: true } },
} as const;

@Injectable()
export class ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBookingContext(bookingId: string): Promise<ParticipantContext | null> {
    const row = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: participantBookingInclude,
    });
    if (!row) return null;
    return {
      mentorUserId: row.mentorProfile.userId,
      apprenticeUserId: row.apprenticeProfile.userId,
      bookingId: row.id,
    };
  }

  async findSessionContext(sessionId: string): Promise<ParticipantContext | null> {
    const row = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: participantSessionInclude,
    });
    if (!row) return null;
    return {
      mentorUserId: row.booking.mentorProfile.userId,
      apprenticeUserId: row.booking.apprenticeProfile.userId,
      bookingId: row.bookingId,
    };
  }

  async findMentorshipContext(
    mentorshipId: string,
  ): Promise<ParticipantContext | null> {
    const row = await this.prisma.mentorshipRelationship.findUnique({
      where: { id: mentorshipId },
      include: participantMentorshipInclude,
    });
    if (!row) return null;
    return {
      mentorUserId: row.mentorProfile.userId,
      apprenticeUserId: row.apprenticeProfile.userId,
    };
  }

  async hasInteractionBetween(userAId: string, userBId: string): Promise<boolean> {
    const booking = await this.prisma.booking.findFirst({
      where: {
        OR: [
          {
            mentorProfile: { userId: userAId },
            apprenticeProfile: { userId: userBId },
          },
          {
            mentorProfile: { userId: userBId },
            apprenticeProfile: { userId: userAId },
          },
        ],
      },
      select: { id: true },
    });
    if (booking) return true;

    const mentorship = await this.prisma.mentorshipRelationship.findFirst({
      where: {
        OR: [
          {
            mentorProfile: { userId: userAId },
            apprenticeProfile: { userId: userBId },
          },
          {
            mentorProfile: { userId: userBId },
            apprenticeProfile: { userId: userAId },
          },
        ],
      },
      select: { id: true },
    });
    return mentorship !== null;
  }

  async findOpenReport(
    reporterUserId: string,
    reportedUserId: string,
  ): Promise<UserReport | null> {
    const row = await this.prisma.userReport.findFirst({
      where: {
        reporterUserId,
        reportedUserId,
        status: UserReportStatus.OPEN,
      },
      include: {
        reported: { select: { displayName: true } },
      },
    });
    return row ? this.toDomain(row) : null;
  }

  async create(input: {
    reporterUserId: string;
    reportedUserId: string;
    bookingId?: string | null;
    sessionId?: string | null;
    mentorshipId?: string | null;
    reason: UserReportReason;
    description: string;
  }): Promise<UserReport> {
    const row = await this.prisma.userReport.create({
      data: {
        reporterUserId: input.reporterUserId,
        reportedUserId: input.reportedUserId,
        bookingId: input.bookingId ?? null,
        sessionId: input.sessionId ?? null,
        mentorshipId: input.mentorshipId ?? null,
        reason: input.reason,
        description: input.description,
      },
      include: {
        reported: { select: { displayName: true } },
      },
    });
    return this.toDomain(row);
  }

  async listForReporter(reporterUserId: string): Promise<UserReport[]> {
    const rows = await this.prisma.userReport.findMany({
      where: { reporterUserId },
      include: {
        reported: { select: { displayName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  private toDomain(row: {
    id: string;
    reporterUserId: string;
    reportedUserId: string;
    bookingId: string | null;
    sessionId: string | null;
    mentorshipId: string | null;
    reason: UserReportReason;
    description: string;
    status: UserReportStatus;
    createdAt: Date;
    resolvedAt: Date | null;
    reported: { displayName: string | null };
  }): UserReport {
    return {
      id: row.id,
      reporterUserId: row.reporterUserId,
      reportedUserId: row.reportedUserId,
      reportedDisplayName: row.reported.displayName,
      bookingId: row.bookingId,
      sessionId: row.sessionId,
      mentorshipId: row.mentorshipId,
      reason: row.reason,
      description: row.description,
      status: row.status,
      createdAt: row.createdAt,
      resolvedAt: row.resolvedAt,
    };
  }
}
