import { BookingStatus } from '@prisma/client';
import {
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ALLOWED_DURATIONS_MINUTES } from '../../common/scheduling/scheduling';

export class CreateBookingDto {
  @IsString()
  mentorProfileId!: string;

  @IsString()
  skillId!: string;

  @IsISO8601()
  startAt!: string;

  @IsIn([...ALLOWED_DURATIONS_MINUTES])
  durationMinutes!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  apprenticeMessage?: string;
}

export class BookingResponseDto {
  id!: string;
  mentorProfileId!: string;
  apprenticeProfileId!: string;
  skillId!: string;
  skillName!: string;
  relationshipId!: string | null;
  mentorDisplayName!: string | null;
  apprenticeDisplayName!: string | null;
  startAt!: string;
  endAt!: string;
  timezoneSnapshot!: string;
  status!: BookingStatus;
  apprenticeMessage!: string | null;
  declineReason!: string | null;
  createdAt!: string;
  updatedAt!: string;
}

export class AvailabilitySlotResponseDto {
  startAt!: string;
  endAt!: string;
}
