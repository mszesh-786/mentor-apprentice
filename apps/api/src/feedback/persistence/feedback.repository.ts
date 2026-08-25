import { Injectable } from '@nestjs/common';
import {
  ProductFeedbackCategory,
  SessionFeedbackRole,
  SessionStatus,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  ProductFeedbackRecord,
  SessionFeedbackRecord,
  SessionParticipantContext,
} from '../domain/session-feedback';

const sessionParticipantInclude = {
  booking: {
    include: {
      mentorProfile: { select: { userId: true } },
      apprenticeProfile: { select: { userId: true } },
    },
  },
} as const;

@Injectable()
export class FeedbackRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findSessionParticipantContext(
    sessionId: string,
  ): Promise<SessionParticipantContext | null> {
    const row = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: sessionParticipantInclude,
    });
    if (!row) return null;
    return {
      sessionId: row.id,
      status: row.status,
      mentorUserId: row.booking.mentorProfile.userId,
      apprenticeUserId: row.booking.apprenticeProfile.userId,
    };
  }

  async findSessionFeedback(
    sessionId: string,
    authorUserId: string,
  ): Promise<SessionFeedbackRecord | null> {
    const row = await this.prisma.sessionFeedback.findUnique({
      where: {
        sessionId_authorUserId: { sessionId, authorUserId },
      },
    });
    return row ? this.toSessionFeedback(row) : null;
  }

  async hasSubmitted(sessionId: string, authorUserId: string): Promise<boolean> {
    const row = await this.prisma.sessionFeedback.findUnique({
      where: {
        sessionId_authorUserId: { sessionId, authorUserId },
      },
      select: { id: true },
    });
    return Boolean(row);
  }

  async findSubmittedSessionIds(
    authorUserId: string,
    sessionIds: string[],
  ): Promise<Set<string>> {
    if (sessionIds.length === 0) return new Set();
    const rows = await this.prisma.sessionFeedback.findMany({
      where: {
        authorUserId,
        sessionId: { in: sessionIds },
      },
      select: { sessionId: true },
    });
    return new Set(rows.map((row) => row.sessionId));
  }

  async createSessionFeedback(input: {
    sessionId: string;
    authorUserId: string;
    role: SessionFeedbackRole;
    wasUseful?: boolean;
    explanationsClear?: boolean;
    progressMade?: boolean;
    wouldBookAgain?: boolean;
    apprenticeRespectful?: boolean;
    learningGoalClear?: boolean;
    wouldMentorAgain?: boolean;
    comment?: string | null;
  }): Promise<SessionFeedbackRecord> {
    const row = await this.prisma.sessionFeedback.create({
      data: {
        sessionId: input.sessionId,
        authorUserId: input.authorUserId,
        role: input.role,
        wasUseful: input.wasUseful ?? null,
        explanationsClear: input.explanationsClear ?? null,
        progressMade: input.progressMade ?? null,
        wouldBookAgain: input.wouldBookAgain ?? null,
        apprenticeRespectful: input.apprenticeRespectful ?? null,
        learningGoalClear: input.learningGoalClear ?? null,
        wouldMentorAgain: input.wouldMentorAgain ?? null,
        comment: input.comment ?? null,
      },
    });
    return this.toSessionFeedback(row);
  }

  async createProductFeedback(input: {
    userId: string;
    category: ProductFeedbackCategory;
    message: string;
    pageContext?: string | null;
  }): Promise<ProductFeedbackRecord> {
    const row = await this.prisma.productFeedback.create({
      data: {
        userId: input.userId,
        category: input.category,
        message: input.message,
        pageContext: input.pageContext ?? null,
      },
    });
    return {
      id: row.id,
      userId: row.userId,
      category: row.category,
      message: row.message,
      pageContext: row.pageContext,
      createdAt: row.createdAt,
    };
  }

  private toSessionFeedback(row: {
    id: string;
    sessionId: string;
    authorUserId: string;
    role: SessionFeedbackRole;
    wasUseful: boolean | null;
    explanationsClear: boolean | null;
    progressMade: boolean | null;
    wouldBookAgain: boolean | null;
    apprenticeRespectful: boolean | null;
    learningGoalClear: boolean | null;
    wouldMentorAgain: boolean | null;
    comment: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): SessionFeedbackRecord {
    return {
      id: row.id,
      sessionId: row.sessionId,
      authorUserId: row.authorUserId,
      role: row.role,
      wasUseful: row.wasUseful,
      explanationsClear: row.explanationsClear,
      progressMade: row.progressMade,
      wouldBookAgain: row.wouldBookAgain,
      apprenticeRespectful: row.apprenticeRespectful,
      learningGoalClear: row.learningGoalClear,
      wouldMentorAgain: row.wouldMentorAgain,
      comment: row.comment,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
