/** One day's hours, as stored. */
export type DayHours = {
  day: number;
  opensAt: string | null;
  closesAt: string | null;
  reopensAt: string | null;
  reclosesAt: string | null;
  closed: boolean;
};

/** 0 = Sunday, matching JavaScript's getDay(), so nothing converts anywhere. */
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * When a shop is open.
 *
 * Ordered Monday first rather than Sunday first: the data is stored in
 * JavaScript's order because that is what every date calculation wants, and
 * displayed in the order a week is read.
 */
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

function range(from: string | null, to: string | null): string | null {
  if (!from || !to) return null;
  return `${from} to ${to}`;
}

/** What one day says, or null when the merchant has not filled it in. */
export function dayLine(hours: DayHours | undefined): string | null {
  if (!hours) return null;
  if (hours.closed) return "Closed";

  const first = range(hours.opensAt, hours.closesAt);
  const second = range(hours.reopensAt, hours.reclosesAt);
  if (!first) return null;
  // A kitchen that shuts between lunch and dinner. Written as two ranges on one
  // line, which is how a door sign says it.
  return second ? `${first}, ${second}` : first;
}

export function OpeningHours({
  heading,
  hours = [],
  note,
}: {
  heading?: string;
  hours?: DayHours[];
  note?: string;
}) {
  const byDay = new Map(hours.map((h) => [h.day, h]));
  const rows = WEEK_ORDER.map((day) => ({ day, line: dayLine(byDay.get(day)) })).filter(
    (row) => row.line !== null
  );

  // Nothing set. Rendering an empty table would look like the shop is never
  // open, which is worse than saying nothing at all.
  if (rows.length === 0) return null;

  const today = new Date().getDay();

  return (
    <div className="mx-auto max-w-md">
      {heading && (
        <h2 className="text-center font-serif text-3xl font-semibold">{heading}</h2>
      )}

      <dl className="mt-8 divide-y divide-border rounded-[var(--radius)] border border-border">
        {rows.map(({ day, line }) => {
          const isToday = day === today;
          return (
            <div
              key={day}
              className={`flex items-baseline justify-between gap-4 px-4 py-2.5 text-sm ${
                isToday ? "bg-subtle font-medium text-ink" : "text-ink-soft"
              }`}
            >
              <dt>
                {DAY_NAMES[day]}
                {/* Marked for a screen reader too — the highlight alone says
                    nothing to someone not looking at it. */}
                {isToday && <span className="sr-only"> (today)</span>}
              </dt>
              <dd className="tabular-nums">{line}</dd>
            </div>
          );
        })}
      </dl>

      {note && <p className="mt-3 text-center text-xs text-ink-faint">{note}</p>}
    </div>
  );
}
