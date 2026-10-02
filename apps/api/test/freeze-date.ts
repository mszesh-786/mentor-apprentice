/** Fixtures book fixed calendar dates; freeze only `Date` so they never fall into the past. Timers stay real. */
export const FROZEN_NOW = new Date('2026-08-20T00:00:00.000Z');

export function freezeDate(now: Date = FROZEN_NOW): void {
  jest.useFakeTimers({
    now,
    doNotFake: [
      'hrtime',
      'nextTick',
      'performance',
      'queueMicrotask',
      'requestAnimationFrame',
      'cancelAnimationFrame',
      'requestIdleCallback',
      'cancelIdleCallback',
      'setImmediate',
      'clearImmediate',
      'setInterval',
      'clearInterval',
      'setTimeout',
      'clearTimeout',
    ],
  });
}
