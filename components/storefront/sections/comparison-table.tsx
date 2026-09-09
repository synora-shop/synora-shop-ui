type Row = { label?: string; a?: string; b?: string; c?: string; d?: string };

/**
 * A table comparing options side by side.
 *
 * The first row is the column headings, which is the one thing a merchant has
 * to know and the one thing the schema says twice. It reads oddly as a rule
 * until you try the alternative: separate heading fields on the section mean
 * the headings and the rows can drift out of step, and a four-column table with
 * three headings is worse than a convention.
 *
 * Only as many columns as are actually filled in are rendered, so a two-way
 * comparison is a two-column table rather than four with half of them blank.
 */
export function ComparisonTable({
  heading,
  body,
  rows,
  highlightColumn = 0,
}: {
  heading?: string;
  body?: string;
  rows?: Row[];
  highlightColumn?: number;
}) {
  const all = (rows ?? []).filter((r) => r.label?.trim() || r.a?.trim() || r.b?.trim());
  if (all.length < 2) return null;

  const [head, ...rest] = all;
  const keys = ["a", "b", "c", "d"] as const;
  // A column exists if any row has something in it, heading included.
  const used = keys.filter((k) => all.some((r) => r[k]?.trim()));
  if (used.length === 0) return null;

  const cell = "px-3 py-3 text-sm";
  const highlightAt = used.findIndex((_, i) => i + 1 === highlightColumn);

  return (
    <div className="mx-auto max-w-4xl">
      {heading && <h2 className="text-center font-serif text-3xl font-semibold">{heading}</h2>}
      {body && <p className="mt-2 text-center text-ink-soft">{body}</p>}

      {/* Its own scroller: a wide table must not push the whole page sideways. */}
      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[32rem] border-collapse overflow-hidden rounded-lg border border-border bg-white">
          <thead>
            <tr className="bg-subtle">
              <th scope="col" className={`${cell} text-left font-medium text-ink`}>
                {head.label ?? ""}
              </th>
              {used.map((k, i) => (
                <th
                  key={k}
                  scope="col"
                  className={`${cell} text-left font-medium ${
                    i === highlightAt ? "bg-brand-50 text-brand-700" : "text-ink"
                  }`}
                >
                  {head[k] ?? ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rest.map((row, r) => (
              <tr key={r}>
                <th scope="row" className={`${cell} text-left font-medium text-ink`}>
                  {row.label ?? ""}
                </th>
                {used.map((k, i) => (
                  <td
                    key={k}
                    className={`${cell} text-ink-soft ${i === highlightAt ? "bg-brand-50/60" : ""}`}
                  >
                    {row[k] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
