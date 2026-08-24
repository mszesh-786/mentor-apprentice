export function formatWhen(iso: string, timeZone?: string | null) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: timeZone ?? undefined,
    }).format(new Date(iso))
  } catch {
    return new Date(iso).toLocaleString()
  }
}

/** Join opens 15 min before start; closes 30 min after end (API defaults). */
export function isWithinDefaultJoinWindow(
  bookingStartAt: string,
  bookingEndAt: string,
  now = new Date(),
) {
  const openAt = new Date(new Date(bookingStartAt).getTime() - 15 * 60_000)
  const closeAt = new Date(new Date(bookingEndAt).getTime() + 30 * 60_000)
  return now >= openAt && now <= closeAt
}
