import {
  UserReportReason,
  UserReportStatus,
} from '@prisma/client';

export type UserReport = {
  id: string;
  reporterUserId: string;
  reportedUserId: string;
  reportedDisplayName: string | null;
  bookingId: string | null;
  sessionId: string | null;
  mentorshipId: string | null;
  reason: UserReportReason;
  description: string;
  status: UserReportStatus;
  createdAt: Date;
  resolvedAt: Date | null;
};

export type ParticipantContext = {
  mentorUserId: string;
  apprenticeUserId: string;
  bookingId?: string;
};
