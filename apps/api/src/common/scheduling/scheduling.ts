import { DayOfWeek } from '@prisma/client';

const weekdayToDayOfWeek: Record<string, DayOfWeek> = {
  Monday: DayOfWeek.MONDAY,
  Tuesday: DayOfWeek.TUESDAY,
  Wednesday: DayOfWeek.WEDNESDAY,
  Thursday: DayOfWeek.THURSDAY,
  Friday: DayOfWeek.FRIDAY,
  Saturday: DayOfWeek.SATURDAY,
  Sunday: DayOfWeek.SUNDAY,
};

export const ALLOWED_DURATIONS_MINUTES = [15, 30, 60, 90] as const;
export type AllowedDurationMinutes = (typeof ALLOWED_DURATIONS_MINUTES)[number];

export function isAllowedDuration(
  minutes: number,
): minutes is AllowedDurationMinutes {
  return (ALLOWED_DURATIONS_MINUTES as readonly number[]).includes(minutes);
}

export function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function overlapsRange(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
): boolean {
  return startA < endB && startB < endA;
}

export function getZonedParts(
  instant: Date,
  timeZone: string,
): { date: string; dayOfWeek: DayOfWeek; time: string; minutes: number } {
  const dateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const weekdayFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'long',
  });
  const timeFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const date = dateFormatter.format(instant);
  const weekday = weekdayFormatter.format(instant);
  const dayOfWeek = weekdayToDayOfWeek[weekday];
  if (!dayOfWeek) {
    throw new Error(`Unable to resolve day of week for ${weekday}`);
  }

  const time = timeFormatter.format(instant);
  return {
    date,
    dayOfWeek,
    time,
    minutes: toMinutes(time),
  };
}

export type WeeklyRule = {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  timezone: string;
};

export type DateException = {
  date: string;
  startTime: string | null;
  endTime: string | null;
};

export function fitsWeeklyAvailability(
  startAt: Date,
  endAt: Date,
  rules: WeeklyRule[],
  timezone: string,
): boolean {
  const start = getZonedParts(startAt, timezone);
  const end = getZonedParts(endAt, timezone);

  if (start.date !== end.date) {
    return false;
  }

  return rules.some(
    (rule) =>
      rule.dayOfWeek === start.dayOfWeek &&
      toMinutes(rule.startTime) <= start.minutes &&
      toMinutes(rule.endTime) >= end.minutes,
  );
}

export function isBlockedByException(
  startAt: Date,
  endAt: Date,
  exceptions: DateException[],
  timezone: string,
): boolean {
  const start = getZonedParts(startAt, timezone);
  const end = getZonedParts(endAt, timezone);

  return exceptions.some((exception) => {
    if (exception.date !== start.date) {
      return false;
    }
    if (!exception.startTime || !exception.endTime) {
      return true;
    }
    const blockStart = toMinutes(exception.startTime);
    const blockEnd = toMinutes(exception.endTime);
    return start.minutes < blockEnd && end.minutes > blockStart;
  });
}

export function generateSlots(input: {
  from: Date;
  to: Date;
  durationMinutes: number;
  rules: WeeklyRule[];
  exceptions: DateException[];
  timezone: string;
  reserved: Array<{ startAt: Date; endAt: Date }>;
}): Array<{ startAt: string; endAt: string }> {
  const slots: Array<{ startAt: string; endAt: string }> = [];
  const cursor = new Date(input.from);
  cursor.setUTCSeconds(0, 0);

  while (cursor < input.to) {
    const end = new Date(cursor.getTime() + input.durationMinutes * 60_000);
    if (
      end <= input.to &&
      fitsWeeklyAvailability(cursor, end, input.rules, input.timezone) &&
      !isBlockedByException(cursor, end, input.exceptions, input.timezone) &&
      !input.reserved.some((booking) =>
        overlapsRange(cursor, end, booking.startAt, booking.endAt),
      )
    ) {
      slots.push({
        startAt: cursor.toISOString(),
        endAt: end.toISOString(),
      });
    }
    cursor.setUTCMinutes(cursor.getUTCMinutes() + 15);
  }

  return slots;
}
