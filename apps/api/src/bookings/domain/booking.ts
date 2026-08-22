import { BookingStatus } from '@prisma/client';

export type Booking = {
  id: string;
  mentorProfileId: string;
  apprenticeProfileId: string;
  skillId: string;
  relationshipId: string | null;
  startAt: Date;
  endAt: Date;
  timezoneSnapshot: string;
  status: BookingStatus;
  apprenticeMessage: string | null;
  declineReason: string | null;
  cancelledByUserId: string | null;
  cancelReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
  mentorDisplayName: string | null;
  apprenticeDisplayName: string | null;
  skillName: string;
  mentorUserId: string;
  apprenticeUserId: string;
};
