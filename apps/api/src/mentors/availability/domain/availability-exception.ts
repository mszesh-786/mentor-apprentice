import { AvailabilityExceptionType } from '@prisma/client';

export type AvailabilityException = {
  id: string;
  mentorProfileId: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  type: AvailabilityExceptionType;
  createdAt: Date;
  updatedAt: Date;
};

export type AvailabilityExceptionInput = {
  date: string;
  startTime?: string | null;
  endTime?: string | null;
};
