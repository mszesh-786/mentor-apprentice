import { isWithinJoinWindow } from './join-window';

describe('join-window', () => {
  const start = new Date('2026-08-24T07:00:00.000Z');
  const end = new Date('2026-08-24T07:30:00.000Z');
  const config = { openMinutesBefore: 15, closeMinutesAfterEnd: 30 };

  it('opens 15 minutes before start', () => {
    expect(
      isWithinJoinWindow(
        new Date('2026-08-24T06:45:00.000Z'),
        start,
        end,
        config,
      ),
    ).toBe(true);
    expect(
      isWithinJoinWindow(
        new Date('2026-08-24T06:44:00.000Z'),
        start,
        end,
        config,
      ),
    ).toBe(false);
  });

  it('closes 30 minutes after end', () => {
    expect(
      isWithinJoinWindow(
        new Date('2026-08-24T08:00:00.000Z'),
        start,
        end,
        config,
      ),
    ).toBe(true);
    expect(
      isWithinJoinWindow(
        new Date('2026-08-24T08:01:00.000Z'),
        start,
        end,
        config,
      ),
    ).toBe(false);
  });
});
