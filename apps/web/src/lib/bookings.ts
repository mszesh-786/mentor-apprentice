import type { Booking } from '@/api/types'

/** Accepted/confirmed bookings that have not ended yet, soonest first. */
export function upcomingBookings(
  bookings: Booking[] | undefined,
  now = new Date(),
) {
  return (bookings ?? [])
    .filter(
      (booking) =>
        (booking.status === 'ACCEPTED' || booking.status === 'CONFIRMED') &&
        new Date(booking.endAt) >= now,
    )
    .sort((a, b) => a.startAt.localeCompare(b.startAt))
}

export function bookingsWithStatus(
  bookings: Booking[] | undefined,
  status: Booking['status'],
) {
  return (bookings ?? [])
    .filter((booking) => booking.status === status)
    .sort((a, b) => a.startAt.localeCompare(b.startAt))
}
