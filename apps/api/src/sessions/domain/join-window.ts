export function getJoinWindowConfig(): {
  openMinutesBefore: number;
  closeMinutesAfterEnd: number;
} {
  const openMinutesBefore = Number(
    process.env.SESSION_JOIN_OPEN_MINUTES_BEFORE ?? '15',
  );
  const closeMinutesAfterEnd = Number(
    process.env.SESSION_JOIN_CLOSE_MINUTES_AFTER_END ?? '30',
  );
  return {
    openMinutesBefore: Number.isFinite(openMinutesBefore)
      ? openMinutesBefore
      : 15,
    closeMinutesAfterEnd: Number.isFinite(closeMinutesAfterEnd)
      ? closeMinutesAfterEnd
      : 30,
  };
}

export function isWithinJoinWindow(
  now: Date,
  bookingStartAt: Date,
  bookingEndAt: Date,
  config = getJoinWindowConfig(),
): boolean {
  const openAt = new Date(
    bookingStartAt.getTime() - config.openMinutesBefore * 60_000,
  );
  const closeAt = new Date(
    bookingEndAt.getTime() + config.closeMinutesAfterEnd * 60_000,
  );
  return now >= openAt && now <= closeAt;
}

export function isNoShowEligible(
  now: Date,
  bookingStartAt: Date,
  bookingEndAt: Date,
  config = getJoinWindowConfig(),
): boolean {
  const openAt = new Date(
    bookingStartAt.getTime() - config.openMinutesBefore * 60_000,
  );
  const closeAt = new Date(
    bookingEndAt.getTime() + config.closeMinutesAfterEnd * 60_000,
  );
  return now >= openAt && now <= closeAt;
}
