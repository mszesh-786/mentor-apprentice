import { DayOfWeek } from '@prisma/client';
import {
  fitsWeeklyAvailability,
  generateSlots,
  isAllowedDuration,
  isBlockedByException,
  overlapsRange,
} from './scheduling';

describe('scheduling', () => {
  it('allows only 15/30/60/90 durations', () => {
    expect(isAllowedDuration(15)).toBe(true);
    expect(isAllowedDuration(45)).toBe(false);
  });

  it('detects overlapping ranges', () => {
    expect(
      overlapsRange(
        new Date('2026-08-24T07:00:00.000Z'),
        new Date('2026-08-24T07:30:00.000Z'),
        new Date('2026-08-24T07:15:00.000Z'),
        new Date('2026-08-24T07:45:00.000Z'),
      ),
    ).toBe(true);
  });

  it('fits weekly availability in mentor timezone', () => {
    const rules = [
      {
        dayOfWeek: DayOfWeek.MONDAY,
        startTime: '10:00',
        endTime: '13:00',
        timezone: 'Europe/Helsinki',
      },
    ];
    // Monday 10:00 Helsinki in Aug = 07:00 UTC
    expect(
      fitsWeeklyAvailability(
        new Date('2026-08-24T07:00:00.000Z'),
        new Date('2026-08-24T07:30:00.000Z'),
        rules,
        'Europe/Helsinki',
      ),
    ).toBe(true);
    expect(
      fitsWeeklyAvailability(
        new Date('2026-08-24T06:00:00.000Z'),
        new Date('2026-08-24T06:30:00.000Z'),
        rules,
        'Europe/Helsinki',
      ),
    ).toBe(false);
  });

  it('blocks full-day and partial exceptions', () => {
    expect(
      isBlockedByException(
        new Date('2026-08-24T07:00:00.000Z'),
        new Date('2026-08-24T07:30:00.000Z'),
        [{ date: '2026-08-24', startTime: null, endTime: null }],
        'Europe/Helsinki',
      ),
    ).toBe(true);

    expect(
      isBlockedByException(
        new Date('2026-08-24T07:00:00.000Z'),
        new Date('2026-08-24T07:30:00.000Z'),
        [{ date: '2026-08-24', startTime: '10:00', endTime: '11:00' }],
        'Europe/Helsinki',
      ),
    ).toBe(true);

    expect(
      isBlockedByException(
        new Date('2026-08-24T09:00:00.000Z'),
        new Date('2026-08-24T09:30:00.000Z'),
        [{ date: '2026-08-24', startTime: '10:00', endTime: '11:00' }],
        'Europe/Helsinki',
      ),
    ).toBe(false);
  });

  it('generates slots skipping reserved and exceptions', () => {
    const slots = generateSlots({
      from: new Date('2026-08-24T07:00:00.000Z'),
      to: new Date('2026-08-24T08:00:00.000Z'),
      durationMinutes: 30,
      rules: [
        {
          dayOfWeek: DayOfWeek.MONDAY,
          startTime: '10:00',
          endTime: '13:00',
          timezone: 'Europe/Helsinki',
        },
      ],
      exceptions: [
        { date: '2026-08-24', startTime: '10:30', endTime: '11:00' },
      ],
      timezone: 'Europe/Helsinki',
      reserved: [
        {
          startAt: new Date('2026-08-24T07:00:00.000Z'),
          endAt: new Date('2026-08-24T07:30:00.000Z'),
        },
      ],
    });

    expect(slots).toEqual([]);
  });
});
