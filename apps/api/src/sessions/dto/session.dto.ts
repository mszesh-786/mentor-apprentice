import {
  SessionFailureReason,
  SessionStatus,
  VideoProvider,
} from '@prisma/client';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpsertSessionSummaryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  summary!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  nextStep?: string;
}

export class SessionSummaryResponseDto {
  id!: string;
  summary!: string;
  nextStep!: string | null;
  createdByUserId!: string;
  updatedByUserId!: string | null;
  createdAt!: string;
  updatedAt!: string;
}

export class SessionResponseDto {
  id!: string;
  bookingId!: string;
  status!: SessionStatus;
  videoProvider!: VideoProvider;
  externalRoomId!: string;
  joinUrl!: string;
  mentorJoinedAt!: string | null;
  apprenticeJoinedAt!: string | null;
  startedAt!: string | null;
  endedAt!: string | null;
  failureReason!: SessionFailureReason | null;
  absentUserId!: string | null;
  reportedByUserId!: string | null;
  bookingStartAt!: string;
  bookingEndAt!: string;
  createdAt!: string;
  updatedAt!: string;
  summary!: SessionSummaryResponseDto | null;
  myFeedbackSubmitted!: boolean;
}

export class JoinSessionResponseDto extends SessionResponseDto {}
