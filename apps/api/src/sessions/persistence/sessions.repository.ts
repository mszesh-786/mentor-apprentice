import { Injectable } from '@nestjs/common';
import {
  BookingStatus,
  Prisma,
  SessionFailureReason,
  SessionStatus,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { MentoringSession } from '../domain/session';

const sessionInclude = {
  booking: {
    include: {
      mentorProfile: { select: { userId: true } },
      apprenticeProfile: { select: { userId: true } },
    },
  },
  summary: true,
} as const;

type SessionRow = Prisma.SessionGetPayload<{ include: typeof sessionInclude }>;

@Injectable()
export class SessionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<MentoringSession | null> {
    const row = await this.prisma.session.findUnique({
      where: { id },
      include: sessionInclude,
    });
    return row ? this.toDomain(row) : null;
  }

  async findByBookingId(bookingId: string): Promise<MentoringSession | null> {
    const row = await this.prisma.session.findUnique({
      where: { bookingId },
      include: sessionInclude,
    });
    return row ? this.toDomain(row) : null;
  }

  async listForUser(
    userId: string,
    options?: { upcoming?: boolean },
  ): Promise<MentoringSession[]> {
    const now = new Date();
    const rows = await this.prisma.session.findMany({
      where: {
        AND: [
          {
            OR: [
              { booking: { mentorProfile: { userId } } },
              { booking: { apprenticeProfile: { userId } } },
            ],
          },
          ...(options?.upcoming === true
            ? [
                {
                  status: {
                    in: [SessionStatus.READY, SessionStatus.IN_PROGRESS],
                  },
                  booking: { endAt: { gte: now } },
                },
              ]
            : options?.upcoming === false
              ? [
                  {
                    OR: [
                      {
                        status: {
                          in: [
                            SessionStatus.COMPLETED,
                            SessionStatus.FAILED,
                            SessionStatus.CANCELLED,
                          ],
                        },
                      },
                      { booking: { endAt: { lt: now } } },
                    ],
                  },
                ]
              : []),
        ],
      },
      include: sessionInclude,
      orderBy: { booking: { startAt: 'asc' } },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async recordJoin(input: {
    sessionId: string;
    asMentor: boolean;
    joinedAt: Date;
  }): Promise<MentoringSession> {
    const existing = await this.prisma.session.findUniqueOrThrow({
      where: { id: input.sessionId },
    });

    const data: Prisma.SessionUpdateInput = {};
    if (input.asMentor && !existing.mentorJoinedAt) {
      data.mentorJoinedAt = input.joinedAt;
    }
    if (!input.asMentor && !existing.apprenticeJoinedAt) {
      data.apprenticeJoinedAt = input.joinedAt;
    }

    if (existing.status === SessionStatus.READY) {
      data.status = SessionStatus.IN_PROGRESS;
      data.startedAt = existing.startedAt ?? input.joinedAt;
    }

    const row = await this.prisma.session.update({
      where: { id: input.sessionId },
      data,
      include: sessionInclude,
    });
    return this.toDomain(row);
  }

  async complete(sessionId: string, endedAt: Date): Promise<MentoringSession> {
    const [, row] = await this.prisma.$transaction([
      this.prisma.booking.update({
        where: { id: await this.requireBookingId(sessionId) },
        data: { status: BookingStatus.COMPLETED },
      }),
      this.prisma.session.update({
        where: { id: sessionId },
        data: {
          status: SessionStatus.COMPLETED,
          endedAt,
        },
        include: sessionInclude,
      }),
    ]);
    return this.toDomain(row);
  }

  async markNoShow(input: {
    sessionId: string;
    absentUserId: string;
    reportedByUserId: string;
    endedAt: Date;
  }): Promise<MentoringSession> {
    const bookingId = await this.requireBookingId(input.sessionId);
    const [, row] = await this.prisma.$transaction([
      this.prisma.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.NO_SHOW },
      }),
      this.prisma.session.update({
        where: { id: input.sessionId },
        data: {
          status: SessionStatus.FAILED,
          failureReason: SessionFailureReason.NO_SHOW,
          absentUserId: input.absentUserId,
          reportedByUserId: input.reportedByUserId,
          endedAt: input.endedAt,
        },
        include: sessionInclude,
      }),
    ]);
    return this.toDomain(row);
  }

  async markTechnicalFailure(input: {
    sessionId: string;
    reportedByUserId: string;
    endedAt: Date;
  }): Promise<MentoringSession> {
    const bookingId = await this.requireBookingId(input.sessionId);
    const [, row] = await this.prisma.$transaction([
      this.prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CANCELLED,
          cancelledByUserId: input.reportedByUserId,
          cancelReason: 'TECHNICAL_FAILURE',
        },
      }),
      this.prisma.session.update({
        where: { id: input.sessionId },
        data: {
          status: SessionStatus.FAILED,
          failureReason: SessionFailureReason.TECHNICAL_FAILURE,
          reportedByUserId: input.reportedByUserId,
          endedAt: input.endedAt,
        },
        include: sessionInclude,
      }),
    ]);
    return this.toDomain(row);
  }

  async cancelForBooking(
    bookingId: string,
    endedAt: Date,
  ): Promise<MentoringSession | null> {
    const existing = await this.prisma.session.findUnique({
      where: { bookingId },
    });
    if (!existing) {
      return null;
    }
    if (
      existing.status === SessionStatus.COMPLETED ||
      existing.status === SessionStatus.FAILED ||
      existing.status === SessionStatus.CANCELLED
    ) {
      return this.findByBookingId(bookingId);
    }

    const row = await this.prisma.session.update({
      where: { bookingId },
      data: {
        status: SessionStatus.CANCELLED,
        endedAt,
      },
      include: sessionInclude,
    });
    return this.toDomain(row);
  }

  async upsertSummary(input: {
    sessionId: string;
    summary: string;
    nextStep?: string | null;
    actorUserId: string;
  }): Promise<MentoringSession> {
    await this.prisma.sessionSummary.upsert({
      where: { sessionId: input.sessionId },
      create: {
        sessionId: input.sessionId,
        summary: input.summary,
        nextStep: input.nextStep ?? null,
        createdByUserId: input.actorUserId,
        updatedByUserId: input.actorUserId,
      },
      update: {
        summary: input.summary,
        nextStep: input.nextStep ?? null,
        updatedByUserId: input.actorUserId,
      },
    });
    const session = await this.findById(input.sessionId);
    if (!session) {
      throw new Error('Session not found after summary upsert');
    }
    return session;
  }

  private async requireBookingId(sessionId: string): Promise<string> {
    const row = await this.prisma.session.findUniqueOrThrow({
      where: { id: sessionId },
      select: { bookingId: true },
    });
    return row.bookingId;
  }

  private toDomain(row: SessionRow): MentoringSession {
    return {
      id: row.id,
      bookingId: row.bookingId,
      status: row.status,
      videoProvider: row.videoProvider,
      externalRoomId: row.externalRoomId,
      joinUrl: row.joinUrl,
      mentorJoinedAt: row.mentorJoinedAt,
      apprenticeJoinedAt: row.apprenticeJoinedAt,
      startedAt: row.startedAt,
      endedAt: row.endedAt,
      failureReason: row.failureReason,
      absentUserId: row.absentUserId,
      reportedByUserId: row.reportedByUserId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      bookingStartAt: row.booking.startAt,
      bookingEndAt: row.booking.endAt,
      bookingStatus: row.booking.status,
      mentorUserId: row.booking.mentorProfile.userId,
      apprenticeUserId: row.booking.apprenticeProfile.userId,
      summary: row.summary
        ? {
            id: row.summary.id,
            sessionId: row.summary.sessionId,
            summary: row.summary.summary,
            nextStep: row.summary.nextStep,
            createdByUserId: row.summary.createdByUserId,
            updatedByUserId: row.summary.updatedByUserId,
            createdAt: row.summary.createdAt,
            updatedAt: row.summary.updatedAt,
          }
        : null,
    };
  }
}
