import { MentorshipGoalStatus, MentorshipStatus } from '@prisma/client';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ContinueMentorshipDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

export class UpsertMentorshipGoalDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

export class MentorshipGoalResponseDto {
  id!: string;
  title!: string;
  description!: string | null;
  status!: MentorshipGoalStatus;
  createdByUserId!: string;
  createdAt!: string;
  updatedAt!: string;
  completedAt!: string | null;
}

export class MentorshipResponseDto {
  id!: string;
  mentorProfileId!: string;
  apprenticeProfileId!: string;
  primarySkillId!: string;
  primarySkillName!: string;
  status!: MentorshipStatus;
  startedAt!: string;
  pausedAt!: string | null;
  completedAt!: string | null;
  endedAt!: string | null;
  endedByUserId!: string | null;
  mentorUserId!: string;
  apprenticeUserId!: string;
  mentorDisplayName!: string | null;
  apprenticeDisplayName!: string | null;
  createdAt!: string;
  updatedAt!: string;
  goals!: MentorshipGoalResponseDto[];
}
