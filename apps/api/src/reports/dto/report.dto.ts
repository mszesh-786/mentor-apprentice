import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { UserReportReason } from '@prisma/client';

export class CreateUserReportDto {
  @IsString()
  reportedUserId!: string;

  @IsEnum(UserReportReason)
  reason!: UserReportReason;

  @IsString()
  @MinLength(20)
  @MaxLength(4000)
  description!: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsString()
  bookingId?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsString()
  sessionId?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsString()
  mentorshipId?: string;
}

export class UserReportResponseDto {
  id!: string;
  reportedUserId!: string;
  reportedDisplayName!: string | null;
  bookingId!: string | null;
  sessionId!: string | null;
  mentorshipId!: string | null;
  reason!: UserReportReason;
  description!: string;
  status!: string;
  createdAt!: string;
  resolvedAt!: string | null;
}
