import { BookingStatus } from '@prisma/client';

export type Booking = {
  id: string;
  mentorProfileId: string;
  apprenticeProfileId: string;
  skillId: string;
  startAt: Date;
  endAt: Date;
  timezoneSnapshot: string;
  status: BookingStatus;
  apprenticeMessage: string | null;
  declineReason: string | null;
  cancelledByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
  mentorDisplayName: string | null;
  apprenticeDisplayName: string | null;
  skillName: string;
  mentorUserId: string;
  apprenticeUserId: string;
};
