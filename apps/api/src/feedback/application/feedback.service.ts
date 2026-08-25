import { BadRequestException, Injectable } from '@nestjs/common';
import { SessionFeedbackRole, SessionStatus, UserStatus } from '@prisma/client';
import { AuthUser } from '../../auth/auth-user';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../common/errors/domain-error';
import { SubmitProductFeedbackDto, SubmitSessionFeedbackDto } from '../dto/feedback.dto';
import { FeedbackRepository } from '../persistence/feedback.repository';

@Injectable()
export class FeedbackService {
  constructor(private readonly feedbackRepository: FeedbackRepository) {}

  async getMySessionFeedback(user: AuthUser, sessionId: string) {
    this.assertActive(user);
    const context = await this.requireParticipantContext(user, sessionId);
    const feedback = await this.feedbackRepository.findSessionFeedback(
      context.sessionId,
      user.id,
    );
    if (!feedback) {
      throw new NotFoundError('Feedback not found');
    }
    return feedback;
  }

  async submitSessionFeedback(
    user: AuthUser,
    sessionId: string,
    dto: SubmitSessionFeedbackDto,
  ) {
    this.assertActive(user);
    const context = await this.requireParticipantContext(user, sessionId);

    if (context.status !== SessionStatus.COMPLETED) {
      throw new BadRequestException(
        'Feedback is only allowed for completed sessions',
      );
    }

    const existing = await this.feedbackRepository.findSessionFeedback(
      context.sessionId,
      user.id,
    );
    if (existing) {
      throw new ConflictError('Feedback already submitted for this session');
    }

    const asMentor = context.mentorUserId === user.id;
    const role = asMentor
      ? SessionFeedbackRole.MENTOR
      : SessionFeedbackRole.APPRENTICE;

    if (asMentor) {
      this.assertMentorFields(dto);
      return this.feedbackRepository.createSessionFeedback({
        sessionId: context.sessionId,
        authorUserId: user.id,
        role,
        apprenticeRespectful: dto.apprenticeRespectful,
        learningGoalClear: dto.learningGoalClear,
        wouldMentorAgain: dto.wouldMentorAgain,
        comment: dto.comment?.trim() || null,
      });
    }

    this.assertApprenticeFields(dto);
    return this.feedbackRepository.createSessionFeedback({
      sessionId: context.sessionId,
      authorUserId: user.id,
      role,
      wasUseful: dto.wasUseful,
      explanationsClear: dto.explanationsClear,
      progressMade: dto.progressMade,
      wouldBookAgain: dto.wouldBookAgain,
      comment: dto.comment?.trim() || null,
    });
  }

  async submitProductFeedback(user: AuthUser, dto: SubmitProductFeedbackDto) {
    this.assertActive(user);
    return this.feedbackRepository.createProductFeedback({
      userId: user.id,
      category: dto.category,
      message: dto.message.trim(),
      pageContext: dto.pageContext?.trim() || null,
    });
  }

  async hasSubmitted(userId: string, sessionId: string): Promise<boolean> {
    return this.feedbackRepository.hasSubmitted(sessionId, userId);
  }

  async findSubmittedSessionIds(
    userId: string,
    sessionIds: string[],
  ): Promise<Set<string>> {
    return this.feedbackRepository.findSubmittedSessionIds(userId, sessionIds);
  }

  private assertActive(user: AuthUser): void {
    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenError('Account is not active');
    }
  }

  private async requireParticipantContext(user: AuthUser, sessionId: string) {
    const context =
      await this.feedbackRepository.findSessionParticipantContext(sessionId);
    if (!context) {
      throw new NotFoundError('Session not found');
    }
    if (
      context.mentorUserId !== user.id &&
      context.apprenticeUserId !== user.id
    ) {
      throw new NotFoundError('Session not found');
    }
    return context;
  }

  private assertApprenticeFields(dto: SubmitSessionFeedbackDto): void {
    const missing =
      dto.wasUseful === undefined ||
      dto.explanationsClear === undefined ||
      dto.progressMade === undefined ||
      dto.wouldBookAgain === undefined;
    if (missing) {
      throw new BadRequestException('Apprentice feedback requires all ratings');
    }
  }

  private assertMentorFields(dto: SubmitSessionFeedbackDto): void {
    const missing =
      dto.apprenticeRespectful === undefined ||
      dto.learningGoalClear === undefined ||
      dto.wouldMentorAgain === undefined;
    if (missing) {
      throw new BadRequestException('Mentor feedback requires all ratings');
    }
  }
}
