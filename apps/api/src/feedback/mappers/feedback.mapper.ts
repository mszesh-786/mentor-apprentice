import {
  ProductFeedbackRecord,
  SessionFeedbackRecord,
} from '../domain/session-feedback';
import {
  ProductFeedbackResponseDto,
  SessionFeedbackResponseDto,
} from '../dto/feedback.dto';

export function toSessionFeedbackResponse(
  feedback: SessionFeedbackRecord,
): SessionFeedbackResponseDto {
  return {
    id: feedback.id,
    sessionId: feedback.sessionId,
    authorUserId: feedback.authorUserId,
    role: feedback.role,
    wasUseful: feedback.wasUseful,
    explanationsClear: feedback.explanationsClear,
    progressMade: feedback.progressMade,
    wouldBookAgain: feedback.wouldBookAgain,
    apprenticeRespectful: feedback.apprenticeRespectful,
    learningGoalClear: feedback.learningGoalClear,
    wouldMentorAgain: feedback.wouldMentorAgain,
    comment: feedback.comment,
    createdAt: feedback.createdAt.toISOString(),
    updatedAt: feedback.updatedAt.toISOString(),
  };
}

export function toProductFeedbackResponse(
  feedback: ProductFeedbackRecord,
): ProductFeedbackResponseDto {
  return {
    id: feedback.id,
    category: feedback.category,
    message: feedback.message,
    pageContext: feedback.pageContext,
    createdAt: feedback.createdAt.toISOString(),
  };
}
