import { Injectable } from '@nestjs/common';
import {
  MentorshipGoalStatus,
  MentorshipStatus,
  SessionStatus,
  UserStatus,
} from '@prisma/client';
import { AuthUser } from '../../auth/auth-user';
import { AnalyticsService } from '../../analytics/application/analytics.service';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../common/errors/domain-error';
import { SessionsRepository } from '../../sessions/persistence/sessions.repository';
import { MentorshipRelationship } from '../domain/mentorship';
import {
  ContinueMentorshipDto,
  UpsertMentorshipGoalDto,
} from '../dto/mentorship.dto';
import { MentorshipsRepository } from '../persistence/mentorships.repository';

@Injectable()
export class MentorshipsService {
  constructor(
    private readonly mentorshipsRepository: MentorshipsRepository,
    private readonly sessionsRepository: SessionsRepository,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async continueFromSession(
    user: AuthUser,
    sessionId: string,
    dto: ContinueMentorshipDto,
  ): Promise<MentorshipRelationship> {
    this.assertActive(user);
    const session = await this.sessionsRepository.findById(sessionId);
    if (!session) {
      throw new NotFoundError('Session not found');
    }
    this.assertSessionParticipant(user, session);

    if (session.status !== SessionStatus.COMPLETED) {
      throw new ConflictError('Can only continue after a completed session');
    }

    const detailed = await this.requireSessionWithProfiles(sessionId);

    const relationship =
      await this.mentorshipsRepository.continueFromCompletedBooking({
        mentorProfileId: detailed.mentorProfileId,
        apprenticeProfileId: detailed.apprenticeProfileId,
        primarySkillId: detailed.skillId,
        bookingId: detailed.bookingId,
        actorUserId: user.id,
        goalTitle: dto.title,
        goalDescription: dto.description,
      });

    await this.analyticsService.recordMentorshipContinued(user.id, {
      mentorshipId: relationship.id,
      sessionId,
      bookingId: detailed.bookingId,
    });

    return relationship;
  }

  async listMine(
    user: AuthUser,
    status?: MentorshipStatus,
  ): Promise<MentorshipRelationship[]> {
    this.assertActive(user);
    return this.mentorshipsRepository.listForUser(user.id, status);
  }

  async getById(
    user: AuthUser,
    mentorshipId: string,
  ): Promise<MentorshipRelationship> {
    const relationship = await this.requireRelationship(mentorshipId);
    this.assertParticipant(user, relationship);
    return relationship;
  }

  async listBookings(user: AuthUser, mentorshipId: string) {
    const relationship = await this.requireRelationship(mentorshipId);
    this.assertParticipant(user, relationship);
    return this.mentorshipsRepository.listBookings(mentorshipId);
  }

  async listSessions(user: AuthUser, mentorshipId: string) {
    const relationship = await this.requireRelationship(mentorshipId);
    this.assertParticipant(user, relationship);
    return this.mentorshipsRepository.listSessions(mentorshipId);
  }

  async pause(
    user: AuthUser,
    mentorshipId: string,
  ): Promise<MentorshipRelationship> {
    this.assertActive(user);
    const relationship = await this.requireRelationship(mentorshipId);
    this.assertParticipant(user, relationship);
    if (relationship.status !== MentorshipStatus.ACTIVE) {
      throw new ConflictError('Only ACTIVE relationships can be paused');
    }
    const updated = await this.mentorshipsRepository.updateStatus(
      mentorshipId,
      {
        status: MentorshipStatus.PAUSED,
        pausedAt: new Date(),
      },
    );
    await this.analyticsService.recordMentorshipPaused(user.id, {
      mentorshipId,
    });
    return updated;
  }

  async resume(
    user: AuthUser,
    mentorshipId: string,
  ): Promise<MentorshipRelationship> {
    this.assertActive(user);
    const relationship = await this.requireRelationship(mentorshipId);
    this.assertParticipant(user, relationship);
    if (relationship.status !== MentorshipStatus.PAUSED) {
      throw new ConflictError('Only PAUSED relationships can be resumed');
    }

    const existingActive =
      await this.mentorshipsRepository.findActiveForPairSkill(
        relationship.mentorProfileId,
        relationship.apprenticeProfileId,
        relationship.primarySkillId,
      );
    if (existingActive && existingActive.id !== relationship.id) {
      throw new ConflictError(
        'An ACTIVE relationship already exists for this pair and skill',
      );
    }

    const updated = await this.mentorshipsRepository.updateStatus(
      mentorshipId,
      {
        status: MentorshipStatus.ACTIVE,
        pausedAt: null,
      },
    );
    await this.analyticsService.recordMentorshipResumed(user.id, {
      mentorshipId,
    });
    return updated;
  }

  async complete(
    user: AuthUser,
    mentorshipId: string,
  ): Promise<MentorshipRelationship> {
    this.assertActive(user);
    const relationship = await this.requireRelationship(mentorshipId);
    this.assertParticipant(user, relationship);
    if (
      relationship.status !== MentorshipStatus.ACTIVE &&
      relationship.status !== MentorshipStatus.PAUSED
    ) {
      throw new ConflictError('Relationship cannot be completed');
    }
    const updated = await this.mentorshipsRepository.updateStatus(
      mentorshipId,
      {
        status: MentorshipStatus.COMPLETED,
        completedAt: new Date(),
      },
    );
    await this.analyticsService.recordMentorshipCompleted(user.id, {
      mentorshipId,
    });
    return updated;
  }

  async end(
    user: AuthUser,
    mentorshipId: string,
  ): Promise<MentorshipRelationship> {
    this.assertActive(user);
    const relationship = await this.requireRelationship(mentorshipId);
    this.assertParticipant(user, relationship);
    if (
      relationship.status === MentorshipStatus.ENDED ||
      relationship.status === MentorshipStatus.COMPLETED
    ) {
      throw new ConflictError('Relationship is already closed');
    }
    const updated = await this.mentorshipsRepository.updateStatus(
      mentorshipId,
      {
        status: MentorshipStatus.ENDED,
        endedAt: new Date(),
        endedByUserId: user.id,
      },
    );
    await this.analyticsService.recordMentorshipEnded(user.id, {
      mentorshipId,
    });
    return updated;
  }

  async upsertGoal(
    user: AuthUser,
    mentorshipId: string,
    dto: UpsertMentorshipGoalDto,
  ): Promise<MentorshipRelationship> {
    this.assertActive(user);
    const relationship = await this.requireRelationship(mentorshipId);
    this.assertParticipant(user, relationship);
    if (
      relationship.status !== MentorshipStatus.ACTIVE &&
      relationship.status !== MentorshipStatus.PAUSED
    ) {
      throw new ConflictError('Cannot update goals on a closed relationship');
    }
    const updated = await this.mentorshipsRepository.upsertActiveGoal({
      relationshipId: mentorshipId,
      title: dto.title,
      description: dto.description,
      actorUserId: user.id,
    });
    await this.analyticsService.recordMentorshipGoalUpserted(user.id, {
      mentorshipId,
    });
    return updated;
  }

  async achieveGoal(
    user: AuthUser,
    mentorshipId: string,
    goalId: string,
  ): Promise<MentorshipRelationship> {
    this.assertActive(user);
    const relationship = await this.requireRelationship(mentorshipId);
    this.assertParticipant(user, relationship);
    try {
      return await this.mentorshipsRepository.setGoalStatus(
        goalId,
        mentorshipId,
        MentorshipGoalStatus.ACHIEVED,
      );
    } catch (error) {
      if (error instanceof Error && error.message === 'GOAL_NOT_FOUND') {
        throw new NotFoundError('Goal not found');
      }
      throw error;
    }
  }

  async cancelGoal(
    user: AuthUser,
    mentorshipId: string,
    goalId: string,
  ): Promise<MentorshipRelationship> {
    this.assertActive(user);
    const relationship = await this.requireRelationship(mentorshipId);
    this.assertParticipant(user, relationship);
    try {
      return await this.mentorshipsRepository.setGoalStatus(
        goalId,
        mentorshipId,
        MentorshipGoalStatus.CANCELLED,
      );
    } catch (error) {
      if (error instanceof Error && error.message === 'GOAL_NOT_FOUND') {
        throw new NotFoundError('Goal not found');
      }
      throw error;
    }
  }

  async findActiveForPairSkill(
    mentorProfileId: string,
    apprenticeProfileId: string,
    primarySkillId: string,
  ): Promise<MentorshipRelationship | null> {
    return this.mentorshipsRepository.findActiveForPairSkill(
      mentorProfileId,
      apprenticeProfileId,
      primarySkillId,
    );
  }

  async endActiveBetweenUsers(
    userIdA: string,
    userIdB: string,
    endedByUserId: string,
  ): Promise<void> {
    await this.mentorshipsRepository.endActiveBetweenUsers(
      userIdA,
      userIdB,
      endedByUserId,
    );
  }

  private async requireRelationship(
    mentorshipId: string,
  ): Promise<MentorshipRelationship> {
    const relationship =
      await this.mentorshipsRepository.findById(mentorshipId);
    if (!relationship) {
      throw new NotFoundError('Mentorship not found');
    }
    return relationship;
  }

  private async requireSessionWithProfiles(sessionId: string): Promise<{
    bookingId: string;
    mentorProfileId: string;
    apprenticeProfileId: string;
    skillId: string;
    mentorUserId: string;
    apprenticeUserId: string;
  }> {
    const details =
      await this.mentorshipsRepository.findSessionBookingDetails(sessionId);
    if (!details) {
      throw new NotFoundError('Session booking not found');
    }
    return details;
  }

  private assertParticipant(
    user: AuthUser,
    relationship: MentorshipRelationship,
  ): void {
    if (
      relationship.mentorUserId !== user.id &&
      relationship.apprenticeUserId !== user.id
    ) {
      throw new ForbiddenError('Not a participant of this mentorship');
    }
  }

  private assertSessionParticipant(
    user: AuthUser,
    session: { mentorUserId: string; apprenticeUserId: string },
  ): void {
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
