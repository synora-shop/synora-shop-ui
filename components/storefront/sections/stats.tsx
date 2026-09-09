import { COLS_CLASS } from "./grid-classes";

type Stat = { value?: string; label?: string };

/**
 * A few figures, stated plainly.
 *
 * The value is text, not a number, because "12,000+" and "4.9★" and "Since
 * 2019" are all things a merchant wants here and none of them survive being
 * parsed as a number.
 */
export function Stats({
  heading,
  stats,
  columns = 3,
}: {
  heading?: string;
  stats?: Stat[];
  columns?: number;
}) {
  const shown = (stats ?? []).filter((s) => s.value?.trim());
  if (shown.length === 0) return null;

  return (
    <div>
      {heading && <h2 className="mb-8 text-center font-serif text-3xl font-semibold">{heading}</h2>}
      <div className={`grid gap-8 text-center ${COLS_CLASS[columns] ?? COLS_CLASS[3]}`}>
        {shown.map((stat, i) => (
          <div key={i}>
            <p className="font-serif text-4xl font-semibold text-ink">{stat.value}</p>
            {stat.label && <p className="mt-1 text-sm text-ink-soft">{stat.label}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
