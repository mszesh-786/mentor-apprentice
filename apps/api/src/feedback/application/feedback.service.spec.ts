import { BadRequestException } from '@nestjs/common';
import { Role, SessionFeedbackRole, SessionStatus, UserStatus } from '@prisma/client';
import { AuthUser } from '../../auth/auth-user';
import { FeedbackService } from './feedback.service';
import { FeedbackRepository } from '../persistence/feedback.repository';

describe('FeedbackService', () => {
  const activeUser: AuthUser = {
    id: 'user-1',
    authProviderId: 'sub-1',
    email: 'user@example.com',
    displayName: 'User',
    roles: [Role.APPRENTICE],
    emailVerified: true,
    status: UserStatus.ACTIVE,
  };

  let repository: jest.Mocked<FeedbackRepository>;
  let service: FeedbackService;

  beforeEach(() => {
    repository = {
      findSessionParticipantContext: jest.fn(),
      findSessionFeedback: jest.fn(),
      hasSubmitted: jest.fn(),
      findSubmittedSessionIds: jest.fn(),
      createSessionFeedback: jest.fn(),
      createProductFeedback: jest.fn(),
    } as unknown as jest.Mocked<FeedbackRepository>;
    service = new FeedbackService(repository);
  });

  it('submits apprentice feedback for completed session', async () => {
    repository.findSessionParticipantContext.mockResolvedValue({
      sessionId: 'session-1',
      status: SessionStatus.COMPLETED,
      mentorUserId: 'mentor-1',
      apprenticeUserId: activeUser.id,
    });
    repository.findSessionFeedback.mockResolvedValue(null);
    repository.createSessionFeedback.mockResolvedValue({
      id: 'feedback-1',
      sessionId: 'session-1',
      authorUserId: activeUser.id,
      role: SessionFeedbackRole.APPRENTICE,
      wasUseful: true,
      explanationsClear: true,
      progressMade: true,
      wouldBookAgain: true,
      apprenticeRespectful: null,
      learningGoalClear: null,
      wouldMentorAgain: null,
      comment: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.submitSessionFeedback(activeUser, 'session-1', {
      wasUseful: true,
      explanationsClear: true,
      progressMade: true,
      wouldBookAgain: true,
    });

    expect(result.role).toBe(SessionFeedbackRole.APPRENTICE);
    expect(repository.createSessionFeedback).toHaveBeenCalledWith(
      expect.objectContaining({
        role: SessionFeedbackRole.APPRENTICE,
        wasUseful: true,
      }),
    );
  });

  it('rejects apprentice feedback with missing fields', async () => {
    repository.findSessionParticipantContext.mockResolvedValue({
      sessionId: 'session-1',
      status: SessionStatus.COMPLETED,
      mentorUserId: 'mentor-1',
      apprenticeUserId: activeUser.id,
    });
    repository.findSessionFeedback.mockResolvedValue(null);

    await expect(
      service.submitSessionFeedback(activeUser, 'session-1', {
        wasUseful: true,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
