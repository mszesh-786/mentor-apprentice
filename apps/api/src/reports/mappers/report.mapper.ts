import { UserReport } from '../domain/report';
import { UserReportResponseDto } from '../dto/report.dto';

export function toUserReportResponse(report: UserReport): UserReportResponseDto {
  return {
    id: report.id,
    reportedUserId: report.reportedUserId,
    reportedDisplayName: report.reportedDisplayName,
    bookingId: report.bookingId,
    sessionId: report.sessionId,
    mentorshipId: report.mentorshipId,
    reason: report.reason,
    description: report.description,
    status: report.status,
    createdAt: report.createdAt.toISOString(),
    resolvedAt: report.resolvedAt?.toISOString() ?? null,
  };
}
