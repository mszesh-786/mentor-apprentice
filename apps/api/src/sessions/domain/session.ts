import {
  SessionFailureReason,
  SessionStatus,
  VideoProvider,
} from '@prisma/client';

export type SessionSummary = {
  id: string;
  sessionId: string;
  summary: string;
  nextStep: string | null;
  createdByUserId: string;
  updatedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type MentoringSession = {
  id: string;
  bookingId: string;
  status: SessionStatus;
  videoProvider: VideoProvider;
  externalRoomId: string;
  joinUrl: string;
  mentorJoinedAt: Date | null;
  apprenticeJoinedAt: Date | null;
  startedAt: Date | null;
  endedAt: Date | null;
  failureReason: SessionFailureReason | null;
  absentUserId: string | null;
  reportedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
  bookingStartAt: Date;
  bookingEndAt: Date;
  bookingStatus: string;
  mentorUserId: string;
  apprenticeUserId: string;
  summary: SessionSummary | null;
};
