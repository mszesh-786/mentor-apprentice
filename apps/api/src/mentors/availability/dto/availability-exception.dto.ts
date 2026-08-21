import { AvailabilityExceptionType } from '@prisma/client';
import { IsOptional, Matches, ValidateIf } from 'class-validator';

export class CreateAvailabilityExceptionDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date!: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  startTime?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  endTime?: string | null;
}

export class AvailabilityExceptionResponseDto {
  id!: string;
  date!: string;
  startTime!: string | null;
  endTime!: string | null;
  type!: AvailabilityExceptionType;
  createdAt!: string;
  updatedAt!: string;
}
