import { MentorshipStatus, SessionStatus, UserStatus } from '@prisma/client';
import { AuthUser } from '../../auth/auth-user';
import { AnalyticsService } from '../../analytics/application/analytics.service';
import {
  ConflictError,
  ForbiddenError,
} from '../../common/errors/domain-error';
import { MentoringSession } from '../../sessions/domain/session';
import { SessionsRepository } from '../../sessions/persistence/sessions.repository';
import { MentorshipRelationship } from '../domain/mentorship';
import { MentorshipsRepository } from '../persistence/mentorships.repository';
import { MentorshipsService } from './mentorships.service';

describe('MentorshipsService', () => {
  const mentor: AuthUser = {
    id: 'mentor-user',
    authProviderId: 'auth-m',
    email: 'm@example.com',
    emailVerified: true,
    displayName: 'Mentor',
    status: UserStatus.ACTIVE,
    roles: [],
  };
  const outsider: AuthUser = {
    id: 'outsider',
    authProviderId: 'auth-o',
    email: 'o@example.com',
    emailVerified: true,
    displayName: 'Out',
    status: UserStatus.ACTIVE,
    roles: [],
  };

  const completedSession: MentoringSession = {
    id: 'session-1',
    bookingId: 'booking-1',
    status: SessionStatus.COMPLETED,
    videoProvider: 'STUB',
    externalRoomId: 'stub',
    joinUrl: 'https://meet.stub.local/rooms/stub',
    mentorJoinedAt: new Date(),
    apprenticeJoinedAt: new Date(),
    startedAt: new Date(),
    endedAt: new Date(),
    failureReason: null,
    absentUserId: null,
    reportedByUserId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    bookingStartAt: new Date(),
    bookingEndAt: new Date(),
    bookingStatus: 'COMPLETED',
    mentorUserId: 'mentor-user',
    apprenticeUserId: 'apprentice-user',
    summary: null,
  };

  const relationship: MentorshipRelationship = {
    id: 'rel-1',
    mentorProfileId: 'mp-1',
    apprenticeProfileId: 'ap-1',
    primarySkillId: 'skill-1',
    primarySkillName: 'Basic Car Maintenance',
    status: MentorshipStatus.ACTIVE,
    startedAt: new Date(),
    pausedAt: null,
    completedAt: null,
    endedAt: null,
    endedByUserId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    mentorUserId: 'mentor-user',
    apprenticeUserId: 'apprentice-user',
    mentorDisplayName: 'Mentor',
    apprenticeDisplayName: 'Apprentice',
    goals: [],
  };

  let mentorshipsRepository: jest.Mocked<
    Pick<
      MentorshipsRepository,
      | 'continueFromCompletedBooking'
      | 'findSessionBookingDetails'
      | 'findById'
      | 'listForUser'
      | 'findActiveForPairSkill'
      | 'updateStatus'
      | 'endActiveBetweenUsers'
      | 'listBookings'
      | 'listSessions'
      | 'upsertActiveGoal'
      | 'setGoalStatus'
    >
  >;
  let sessionsRepository: jest.Mocked<Pick<SessionsRepository, 'findById'>>;
  let analyticsService: jest.Mocked<
    Pick<
      AnalyticsService,
      | 'recordMentorshipContinued'
      | 'recordMentorshipPaused'
      | 'recordMentorshipResumed'
      | 'recordMentorshipCompleted'
      | 'recordMentorshipEnded'
      | 'recordMentorshipGoalUpserted'
    >
  >;
  let service: MentorshipsService;

  beforeEach(() => {
    mentorshipsRepository = {
      continueFromCompletedBooking: jest.fn().mockResolvedValue(relationship),
      findSessionBookingDetails: jest.fn().mockResolvedValue({
        bookingId: 'booking-1',
        mentorProfileId: 'mp-1',
        apprenticeProfileId: 'ap-1',
        skillId: 'skill-1',
        mentorUserId: 'mentor-user',
        apprenticeUserId: 'apprentice-user',
      }),
      findById: jest.fn().mockResolvedValue(relationship),
      listForUser: jest.fn(),
      findActiveForPairSkill: jest.fn(),
      updateStatus: jest.fn(),
      endActiveBetweenUsers: jest.fn(),
      listBookings: jest.fn(),
      listSessions: jest.fn(),
      upsertActiveGoal: jest.fn(),
      setGoalStatus: jest.fn(),
    };
    sessionsRepository = {
      findById: jest.fn().mockResolvedValue(completedSession),
    };
    analyticsService = {
      recordMentorshipContinued: jest.fn(),
      recordMentorshipPaused: jest.fn(),
      recordMentorshipResumed: jest.fn(),
      recordMentorshipCompleted: jest.fn(),
      recordMentorshipEnded: jest.fn(),
      recordMentorshipGoalUpserted: jest.fn(),
    };
    service = new MentorshipsService(
      mentorshipsRepository as unknown as MentorshipsRepository,
      sessionsRepository as unknown as SessionsRepository,
      analyticsService as unknown as AnalyticsService,
    );
  });

  it('rejects continue from non-completed session', async () => {
    sessionsRepository.findById.mockResolvedValue({
      ...completedSession,
      status: SessionStatus.IN_PROGRESS,
    });

    await expect(
      service.continueFromSession(mentor, 'session-1', {}),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('rejects continue by non-participant', async () => {
    await expect(
      service.continueFromSession(outsider, 'session-1', {}),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('continues from completed session', async () => {
    const created = await service.continueFromSession(mentor, 'session-1', {
      title: 'Learn oil changes',
    });
    expect(created.id).toBe('rel-1');
    expect(
      mentorshipsRepository.continueFromCompletedBooking,
    ).toHaveBeenCalled();
  });

  it('forbids outsider viewing relationship', async () => {
    await expect(service.getById(outsider, 'rel-1')).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });
});
