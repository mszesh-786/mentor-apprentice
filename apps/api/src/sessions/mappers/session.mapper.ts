import { MentoringSession } from '../domain/session';
import { SessionResponseDto } from '../dto/session.dto';

export function toSessionResponse(
  session: MentoringSession,
): SessionResponseDto {
  return {
    id: session.id,
    bookingId: session.bookingId,
    status: session.status,
    videoProvider: session.videoProvider,
    externalRoomId: session.externalRoomId,
    joinUrl: session.joinUrl,
    mentorJoinedAt: session.mentorJoinedAt?.toISOString() ?? null,
    apprenticeJoinedAt: session.apprenticeJoinedAt?.toISOString() ?? null,
    startedAt: session.startedAt?.toISOString() ?? null,
    endedAt: session.endedAt?.toISOString() ?? null,
    failureReason: session.failureReason,
    absentUserId: session.absentUserId,
    reportedByUserId: session.reportedByUserId,
    bookingStartAt: session.bookingStartAt.toISOString(),
    bookingEndAt: session.bookingEndAt.toISOString(),
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    summary: session.summary
      ? {
          id: session.summary.id,
          summary: session.summary.summary,
          nextStep: session.summary.nextStep,
          createdByUserId: session.summary.createdByUserId,
          updatedByUserId: session.summary.updatedByUserId,
          createdAt: session.summary.createdAt.toISOString(),
          updatedAt: session.summary.updatedAt.toISOString(),
        }
      : null,
  };
}
