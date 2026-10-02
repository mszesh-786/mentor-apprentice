import { Injectable } from '@nestjs/common';
import { MentorshipGoalStatus, MentorshipStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { MentorshipGoal, MentorshipRelationship } from '../domain/mentorship';

const relationshipInclude = {
  mentorProfile: {
    include: { user: { select: { id: true, displayName: true } } },
  },
  apprenticeProfile: {
    include: { user: { select: { id: true, displayName: true } } },
  },
  primarySkill: { select: { id: true, name: true } },
  goals: { orderBy: { createdAt: 'asc' as const } },
} as const;

type RelationshipRow = Prisma.MentorshipRelationshipGetPayload<{
  include: typeof relationshipInclude;
}>;

@Injectable()
export class MentorshipsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<MentorshipRelationship | null> {
    const row = await this.prisma.mentorshipRelationship.findUnique({
      where: { id },
      include: relationshipInclude,
    });
    return row ? this.toDomain(row) : null;
  }

  async findActiveForPairSkill(
    mentorProfileId: string,
    apprenticeProfileId: string,
    primarySkillId: string,
  ): Promise<MentorshipRelationship | null> {
    const row = await this.prisma.mentorshipRelationship.findFirst({
      where: {
        mentorProfileId,
        apprenticeProfileId,
        primarySkillId,
        status: MentorshipStatus.ACTIVE,
      },
      include: relationshipInclude,
    });
    return row ? this.toDomain(row) : null;
  }

  async listForUser(
    userId: string,
    status?: MentorshipStatus,
  ): Promise<MentorshipRelationship[]> {
    const rows = await this.prisma.mentorshipRelationship.findMany({
      where: {
        AND: [
          {
            OR: [
              { mentorProfile: { userId } },
              { apprenticeProfile: { userId } },
            ],
          },
          ...(status ? [{ status }] : []),
        ],
      },
      include: relationshipInclude,
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async continueFromCompletedBooking(input: {
    mentorProfileId: string;
    apprenticeProfileId: string;
    primarySkillId: string;
    bookingId: string;
    actorUserId: string;
    goalTitle?: string;
    goalDescription?: string;
  }): Promise<MentorshipRelationship> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.mentorshipRelationship.findFirst({
        where: {
          mentorProfileId: input.mentorProfileId,
          apprenticeProfileId: input.apprenticeProfileId,
          primarySkillId: input.primarySkillId,
          status: MentorshipStatus.ACTIVE,
        },
        include: relationshipInclude,
      });

      if (existing) {
        await tx.booking.update({
          where: { id: input.bookingId },
          data: { relationshipId: existing.id },
        });
        return this.toDomain(existing);
      }

      const created = await tx.mentorshipRelationship.create({
        data: {
          mentorProfileId: input.mentorProfileId,
          apprenticeProfileId: input.apprenticeProfileId,
          primarySkillId: input.primarySkillId,
          status: MentorshipStatus.ACTIVE,
          ...(input.goalTitle
            ? {
                goals: {
                  create: {
                    title: input.goalTitle,
                    description: input.goalDescription ?? null,
                    status: MentorshipGoalStatus.ACTIVE,
                    createdByUserId: input.actorUserId,
                  },
                },
              }
            : {}),
        },
        include: relationshipInclude,
      });

      await tx.booking.update({
        where: { id: input.bookingId },
        data: { relationshipId: created.id },
      });

      return this.toDomain(created);
    });
  }

  async updateStatus(
    id: string,
    data: {
      status: MentorshipStatus;
      pausedAt?: Date | null;
      completedAt?: Date | null;
      endedAt?: Date | null;
      endedByUserId?: string | null;
    },
  ): Promise<MentorshipRelationship> {
    const row = await this.prisma.mentorshipRelationship.update({
      where: { id },
      data,
      include: relationshipInclude,
    });
    return this.toDomain(row);
  }

  async endActiveBetweenUsers(
    userIdA: string,
    userIdB: string,
    endedByUserId: string,
  ): Promise<number> {
    const now = new Date();
    const result = await this.prisma.mentorshipRelationship.updateMany({
      where: {
        status: MentorshipStatus.ACTIVE,
        OR: [
          {
            mentorProfile: { userId: userIdA },
            apprenticeProfile: { userId: userIdB },
          },
          {
            mentorProfile: { userId: userIdB },
            apprenticeProfile: { userId: userIdA },
          },
        ],
      },
      data: {
        status: MentorshipStatus.ENDED,
        endedAt: now,
        endedByUserId,
      },
    });
    return result.count;
  }

  async listBookings(relationshipId: string) {
    return this.prisma.booking.findMany({
      where: { relationshipId },
      orderBy: { startAt: 'asc' },
      select: {
        id: true,
        status: true,
        startAt: true,
        endAt: true,
        skillId: true,
      },
    });
  }

  async listSessions(relationshipId: string) {
    return this.prisma.session.findMany({
      where: { booking: { relationshipId } },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        bookingId: true,
        status: true,
        startedAt: true,
        endedAt: true,
      },
    });
  }

  async findSessionBookingDetails(sessionId: string): Promise<{
    bookingId: string;
    mentorProfileId: string;
    apprenticeProfileId: string;
    skillId: string;
    mentorUserId: string;
    apprenticeUserId: string;
  } | null> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        booking: {
          include: {
            mentorProfile: { select: { id: true, userId: true } },
            apprenticeProfile: { select: { id: true, userId: true } },
          },
        },
      },
    });
    if (!session) {
      return null;
    }
    return {
      bookingId: session.bookingId,
      mentorProfileId: session.booking.mentorProfileId,
      apprenticeProfileId: session.booking.apprenticeProfileId,
      skillId: session.booking.skillId,
      mentorUserId: session.booking.mentorProfile.userId,
      apprenticeUserId: session.booking.apprenticeProfile.userId,
    };
  }

  async upsertActiveGoal(input: {
    relationshipId: string;
    title: string;
    description?: string | null;
    actorUserId: string;
  }): Promise<MentorshipRelationship> {
    await this.prisma.$transaction(async (tx) => {
      await tx.mentorshipGoal.updateMany({
        where: {
          relationshipId: input.relationshipId,
          status: MentorshipGoalStatus.ACTIVE,
        },
        data: { status: MentorshipGoalStatus.CANCELLED },
      });
      await tx.mentorshipGoal.create({
        data: {
          relationshipId: input.relationshipId,
          title: input.title,
          description: input.description ?? null,
          status: MentorshipGoalStatus.ACTIVE,
          createdByUserId: input.actorUserId,
        },
      });
    });
    const relationship = await this.findById(input.relationshipId);
    if (!relationship) {
      throw new Error('Relationship missing after goal upsert');
    }
    return relationship;
  }

  async setGoalStatus(
    goalId: string,
    relationshipId: string,
    status: MentorshipGoalStatus,
  ): Promise<MentorshipRelationship> {
    const goal = await this.prisma.mentorshipGoal.findUnique({
      where: { id: goalId },
    });
    if (!goal || goal.relationshipId !== relationshipId) {
      throw new Error('GOAL_NOT_FOUND');
    }
    await this.prisma.mentorshipGoal.update({
      where: { id: goalId },
      data: {
        status,
        completedAt:
          status === MentorshipGoalStatus.ACHIEVED ? new Date() : null,
      },
    });
    const relationship = await this.findById(relationshipId);
    if (!relationship) {
      throw new Error('Relationship missing after goal update');
    }
    return relationship;
  }

  private toDomain(row: RelationshipRow): MentorshipRelationship {
    return {
      id: row.id,
      mentorProfileId: row.mentorProfileId,
      apprenticeProfileId: row.apprenticeProfileId,
      primarySkillId: row.primarySkillId,
      primarySkillName: row.primarySkill.name,
      status: row.status,
      startedAt: row.startedAt,
      pausedAt: row.pausedAt,
      completedAt: row.completedAt,
      endedAt: row.endedAt,
      endedByUserId: row.endedByUserId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      mentorUserId: row.mentorProfile.user.id,
      apprenticeUserId: row.apprenticeProfile.user.id,
      mentorDisplayName: row.mentorProfile.user.displayName,
      apprenticeDisplayName: row.apprenticeProfile.user.displayName,
      goals: row.goals.map((goal): MentorshipGoal => ({
        id: goal.id,
        relationshipId: goal.relationshipId,
        title: goal.title,
        description: goal.description,
        status: goal.status,
        createdByUserId: goal.createdByUserId,
        createdAt: goal.createdAt,
        updatedAt: goal.updatedAt,
        completedAt: goal.completedAt,
      })),
    };
  }
}
