export function getCurrentMonthRange(today = new Date()): {
  startInclusive: string;
  endExclusive: string;
} {
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1));

  return {
    startInclusive: toISODate(start),
    endExclusive: toISODate(end),
  };
}

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
