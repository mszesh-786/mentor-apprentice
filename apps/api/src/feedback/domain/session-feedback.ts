import { ProductFeedbackCategory, SessionFeedbackRole } from '@prisma/client';

export type SessionFeedbackRecord = {
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
};

export type ProductFeedbackRecord = {
  id: string;
  userId: string;
  category: ProductFeedbackCategory;
  message: string;
  pageContext: string | null;
  createdAt: Date;
};

export type SessionParticipantContext = {
  sessionId: string;
  status: string;
  mentorUserId: string;
  apprenticeUserId: string;
};
