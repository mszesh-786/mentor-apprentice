import { AvailabilityRuleStatus, DayOfWeek } from '@prisma/client';

export class AvailabilityRuleResponseDto {
  id!: string;
  dayOfWeek!: DayOfWeek;
  startTime!: string;
  endTime!: string;
  timezone!: string;
  status!: AvailabilityRuleStatus;
  createdAt!: string;
  updatedAt!: string;
}
