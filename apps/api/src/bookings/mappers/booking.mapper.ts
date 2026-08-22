import { Booking } from '../domain/booking';
import { BookingResponseDto } from '../dto/booking.dto';

export function toBookingResponse(booking: Booking): BookingResponseDto {
  return {
    id: booking.id,
    mentorProfileId: booking.mentorProfileId,
    apprenticeProfileId: booking.apprenticeProfileId,
    skillId: booking.skillId,
    skillName: booking.skillName,
    relationshipId: booking.relationshipId,
    mentorDisplayName: booking.mentorDisplayName,
    apprenticeDisplayName: booking.apprenticeDisplayName,
    startAt: booking.startAt.toISOString(),
    endAt: booking.endAt.toISOString(),
    timezoneSnapshot: booking.timezoneSnapshot,
    status: booking.status,
    apprenticeMessage: booking.apprenticeMessage,
    declineReason: booking.declineReason,
    createdAt: booking.createdAt.toISOString(),
    updatedAt: booking.updatedAt.toISOString(),
  };
}
