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

const RELATIVE_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 365 * 86_400],
  ['month', 30 * 86_400],
  ['week', 7 * 86_400],
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
]

export function formatTimeAgo(iso: string, now = new Date()) {
  const seconds = (new Date(iso).getTime() - now.getTime()) / 1000
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
  for (const [unit, size] of RELATIVE_UNITS) {
    if (Math.abs(seconds) >= size) {
      return formatter.format(Math.round(seconds / size), unit)
    }
  }
  return formatter.format(0, 'minute')
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
