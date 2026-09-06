/**
 * The arithmetic behind the analytics screen.
 *
 * Kept apart from both the database and the drawing, because this is the part
 * that can be quietly wrong. A chart that renders beautifully off a bad bucket
 * is worse than no chart: it is a number a merchant will act on.
 *
 * Three things here are easy to get wrong and are handled deliberately:
 *
 *   Gaps.      A day with no orders is a zero, not a missing point. Skip it and
 *              the line runs straight from Monday to Friday and implies trade
 *              on days there was none.
 *   Time zone. Days are cut in the *shop's* zone, not the server's. A shop in
 *              Karachi reading a UTC day boundary sees five hours of this
 *              morning's sales filed under yesterday.
 *   Zero.      A change from nothing is not "infinity percent" and not "100%".
 *              It has no percentage, and this says so rather than printing one.
 *
 * Client-safe: pure functions over plain values. No Prisma, no next/headers.
 */

export type RangeKey = "7d" | "30d" | "90d" | "365d";

export const RANGES: readonly { value: RangeKey; label: string; days: number }[] = [
  { value: "7d", label: "Last 7 days", days: 7 },
  { value: "30d", label: "Last 30 days", days: 30 },
  { value: "90d", label: "Last 90 days", days: 90 },
  { value: "365d", label: "Last 12 months", days: 365 },
];

export type SearchParams = Record<string, string | string[] | undefined>;

/** The chosen window, or thirty days. */
export function readRange(searchParams: SearchParams): (typeof RANGES)[number] {
  const raw = searchParams.range;
  const asked = Array.isArray(raw) ? raw[0] : raw;
  return RANGES.find((r) => r.value === asked) ?? RANGES[1];
}

/**
 * The calendar day a moment falls on, in a given zone, as "YYYY-MM-DD".
 *
 * Via Intl rather than by subtracting an offset, because offsets change: a
 * fixed +05:00 is right for Karachi and wrong for anywhere that keeps daylight
 * saving, and wrong twice a year rather than never.
 */
export function dayKey(at: Date, timeZone: string): string {
  try {
    // en-CA renders ISO-shaped dates, which sort correctly as strings.
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(at);
  } catch {
    // An unknown zone must not take the whole screen down with it.
    return at.toISOString().slice(0, 10);
  }
}

/** Every day from `from` to `to` inclusive, as keys, in the shop's zone. */
export function daySpan(from: Date, to: Date, timeZone: string): string[] {
  const out: string[] = [];
  const cursor = new Date(from.getTime());
  // Walked in UTC days and formatted in the shop's zone: stepping 24 hours can
  // land twice on the same local day across a DST change, so duplicates are
  // dropped rather than assumed impossible.
  while (cursor.getTime() <= to.getTime()) {
    const key = dayKey(cursor, timeZone);
    if (out[out.length - 1] !== key) out.push(key);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  const last = dayKey(to, timeZone);
  if (out[out.length - 1] !== last) out.push(last);
  return out;
}

export type Point = { day: string; value: number };

/**
 * Rows totalled per day across the whole window, gaps filled with zero.
 *
 * The fill is the point. Charting only the days that have rows draws a line
 * that skips the quiet ones, and a reader cannot tell a flat week from a week
 * with no data.
 */
export function seriesByDay(
  rows: readonly { createdAt: Date; value: number }[],
  from: Date,
  to: Date,
  timeZone: string
): Point[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const key = dayKey(row.createdAt, timeZone);
    totals.set(key, (totals.get(key) ?? 0) + row.value);
  }
  return daySpan(from, to, timeZone).map((day) => ({ day, value: totals.get(day) ?? 0 }));
}

/**
 * How this window compares with the one before it.
 *
 * `null` means there is nothing to compare against — the previous window was
 * empty. That is not a 100% rise and not a 0% one; it is a question the data
 * cannot answer, and printing a number there is inventing one.
 */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

/** The largest few, biggest first, with everything else folded into a total. */
export function topBy<T>(
  rows: readonly T[],
  label: (row: T) => string,
  value: (row: T) => number,
  limit = 5
): { label: string; value: number }[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const key = label(row);
    totals.set(key, (totals.get(key) ?? 0) + value(row));
  }
  return [...totals.entries()]
    .map(([l, v]) => ({ label: l, value: v }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

/** Sum of a field, for a window that may be empty. */
export function sum(rows: readonly number[]): number {
  return rows.reduce((a, b) => a + b, 0);
}

/**
 * Where the money went, in the order an order moves through.
 *
 * Cancelled is not a stage — it is a way out of the sequence — so it is
 * reported beside the funnel rather than inside it, where it would read as the
 * final step every order arrives at.
 */
export const FULFILMENT_STAGES = ["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"] as const;
export type Stage = (typeof FULFILMENT_STAGES)[number];

export function funnel(counts: Record<string, number>): { stage: Stage; count: number }[] {
  return FULFILMENT_STAGES.map((stage) => ({ stage, count: counts[stage] ?? 0 }));
}

/** A y-axis that ends on a round number, so the ticks read cleanly. */
export function niceCeiling(max: number): number {
  if (max <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(max));
  for (const step of [1, 2, 2.5, 5, 10]) {
    const candidate = step * magnitude;
    if (candidate >= max) return candidate;
  }
  return 10 * magnitude;
}
