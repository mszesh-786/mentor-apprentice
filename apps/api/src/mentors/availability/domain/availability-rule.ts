import { AvailabilityRuleStatus, DayOfWeek } from '@prisma/client';

export type AvailabilityRule = {
  id: string;
  mentorProfileId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  timezone: string;
  status: AvailabilityRuleStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type AvailabilityRuleInput = {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  timezone?: string;
};
