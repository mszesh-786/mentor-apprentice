import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  UserReportResolutionOutcome,
  UserReportStatus,
  UserStatus,
} from '@prisma/client';

export class AdminListUsersQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}

export class AdminListReportsQueryDto {
  @IsOptional()
  @IsEnum(UserReportStatus)
  status?: UserReportStatus;
}

export class ResolveReportDto {
  @IsEnum(UserReportResolutionOutcome)
  outcome!: UserReportResolutionOutcome;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  note?: string;
}

export class AdminUserListItemDto {
  id!: string;
  email!: string;
  displayName!: string | null;
  status!: UserStatus;
  roles!: string[];
  emailVerified!: boolean;
  createdAt!: string;
}

export class AdminUserDetailDto extends AdminUserListItemDto {
  mentorProfileId!: string | null;
  mentorPublicationStatus!: string | null;
  mentorIsBookable!: boolean | null;
  verificationStatus!: string | null;
  openReportsReceived!: number;
}

export class AdminReportListItemDto {
  id!: string;
  reporterUserId!: string;
  reporterDisplayName!: string | null;
  reportedUserId!: string;
  reportedDisplayName!: string | null;
  reason!: string;
  description!: string;
  status!: UserReportStatus;
  createdAt!: string;
  resolvedAt!: string | null;
  resolutionOutcome!: UserReportResolutionOutcome | null;
}

export class AdminReportDetailDto extends AdminReportListItemDto {
  bookingId!: string | null;
  sessionId!: string | null;
  mentorshipId!: string | null;
  resolutionNote!: string | null;
  resolvedByUserId!: string | null;
}
