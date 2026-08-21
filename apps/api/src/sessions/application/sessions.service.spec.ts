import { BookingStatus, SessionStatus, UserStatus } from '@prisma/client';
import { AuthUser } from '../../auth/auth-user';
import { AnalyticsService } from '../../analytics/application/analytics.service';
import {
  ConflictError,
  ForbiddenError,
} from '../../common/errors/domain-error';
import { MentoringSession } from '../domain/session';
import { SessionsRepository } from '../persistence/sessions.repository';
import { SessionsService } from './sessions.service';

describe('SessionsService', () => {
  const mentor: AuthUser = {
    id: 'mentor-user',
    authProviderId: 'auth-m',
    email: 'm@example.com',
    emailVerified: true,
    displayName: 'Mentor',
    status: UserStatus.ACTIVE,
    roles: [],
  };
  const apprentice: AuthUser = {
    id: 'apprentice-user',
    authProviderId: 'auth-a',
    email: 'a@example.com',
    emailVerified: true,
    displayName: 'Apprentice',
    status: UserStatus.ACTIVE,
    roles: [],
  };

  const baseSession: MentoringSession = {
    id: 'session-1',
    bookingId: 'booking-1',
    status: SessionStatus.READY,
    videoProvider: 'STUB',
    externalRoomId: 'stub-booking-1',
    joinUrl: 'https://meet.stub.local/rooms/stub-booking-1',
    mentorJoinedAt: null,
    apprenticeJoinedAt: null,
    startedAt: null,
    endedAt: null,
    failureReason: null,
    absentUserId: null,
    reportedByUserId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    bookingStartAt: new Date(Date.now() - 5 * 60_000),
    bookingEndAt: new Date(Date.now() + 25 * 60_000),
    bookingStatus: BookingStatus.ACCEPTED,
    mentorUserId: 'mentor-user',
    apprenticeUserId: 'apprentice-user',
    summary: null,
  };

  let sessionsRepository: jest.Mocked<
    Pick<
      SessionsRepository,
      | 'findById'
      | 'findByBookingId'
      | 'listForUser'
      | 'recordJoin'
      | 'complete'
      | 'markNoShow'
      | 'markTechnicalFailure'
      | 'cancelForBooking'
      | 'upsertSummary'
    >
  >;
  let analyticsService: jest.Mocked<
    Pick<
      AnalyticsService,
      | 'recordSessionJoined'
      | 'recordSessionCompleted'
      | 'recordSessionNoShow'
      | 'recordSessionTechFailure'
      | 'recordSessionCancelled'
    >
  >;
  let service: SessionsService;

  beforeEach(() => {
    process.env.SESSION_JOIN_OPEN_MINUTES_BEFORE = '60';
    process.env.SESSION_JOIN_CLOSE_MINUTES_AFTER_END = '60';
    sessionsRepository = {
      findById: jest.fn().mockResolvedValue(baseSession),
      findByBookingId: jest.fn(),
      listForUser: jest.fn(),
      recordJoin: jest.fn(),
      complete: jest.fn(),
      markNoShow: jest.fn(),
      markTechnicalFailure: jest.fn(),
      cancelForBooking: jest.fn(),
      upsertSummary: jest.fn(),
    };
    analyticsService = {
      recordSessionJoined: jest.fn(),
      recordSessionCompleted: jest.fn(),
      recordSessionNoShow: jest.fn(),
      recordSessionTechFailure: jest.fn(),
      recordSessionCancelled: jest.fn(),
    };
    service = new SessionsService(
      sessionsRepository as unknown as SessionsRepository,
      analyticsService as unknown as AnalyticsService,
    );
  });

  it('records mentor join and moves toward in progress', async () => {
    sessionsRepository.recordJoin.mockResolvedValue({
      ...baseSession,
      status: SessionStatus.IN_PROGRESS,
      mentorJoinedAt: new Date(),
      startedAt: new Date(),
    });

    const joined = await service.join(mentor, 'session-1');
    expect(joined.status).toBe(SessionStatus.IN_PROGRESS);
    expect(analyticsService.recordSessionJoined).toHaveBeenCalled();
  });

  it('rejects complete until both attended', async () => {
    sessionsRepository.findById.mockResolvedValue({
      ...baseSession,
      status: SessionStatus.IN_PROGRESS,
      mentorJoinedAt: new Date(),
      apprenticeJoinedAt: null,
    });

    await expect(service.complete(mentor, 'session-1')).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it('completes when both attended and syncs booking', async () => {
    sessionsRepository.findById.mockResolvedValue({
      ...baseSession,
      status: SessionStatus.IN_PROGRESS,
      mentorJoinedAt: new Date(),
      apprenticeJoinedAt: new Date(),
    });
    sessionsRepository.complete.mockResolvedValue({
      ...baseSession,
      status: SessionStatus.COMPLETED,
      mentorJoinedAt: new Date(),
      apprenticeJoinedAt: new Date(),
      endedAt: new Date(),
    });

    const completed = await service.complete(apprentice, 'session-1');
    expect(completed.status).toBe(SessionStatus.COMPLETED);
  });

  it('records absent user on no-show', async () => {
    sessionsRepository.findById.mockResolvedValue({
      ...baseSession,
      mentorJoinedAt: new Date(),
      apprenticeJoinedAt: null,
    });
    sessionsRepository.markNoShow.mockResolvedValue({
      ...baseSession,
      status: SessionStatus.FAILED,
      failureReason: 'NO_SHOW',
      absentUserId: 'apprentice-user',
      mentorJoinedAt: new Date(),
    });

    const result = await service.reportNoShow(mentor, 'session-1');
    expect(sessionsRepository.markNoShow).toHaveBeenCalledWith(
      expect.objectContaining({ absentUserId: 'apprentice-user' }),
    );
    expect(result.absentUserId).toBe('apprentice-user');
  });

  it('forbids apprentice from editing summary', async () => {
    sessionsRepository.findById.mockResolvedValue({
      ...baseSession,
      status: SessionStatus.COMPLETED,
    });

    await expect(
      service.upsertSummary(apprentice, 'session-1', {
        summary: 'Great session',
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
