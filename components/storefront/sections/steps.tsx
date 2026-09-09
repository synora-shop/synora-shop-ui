type Step = { title?: string; text?: string };

/**
 * Numbered steps in order.
 *
 * The number is drawn rather than being a list marker, because the whole point
 * of this section is that the order is the content — a merchant explaining a
 * made-to-order process needs "1, 2, 3" to be as loud as the words.
 */
export function Steps({
  heading,
  steps,
  direction = "row",
}: {
  heading?: string;
  steps?: Step[];
  direction?: string;
}) {
  const shown = (steps ?? []).filter((s) => s.title?.trim() || s.text?.trim());
  if (shown.length === 0) return null;
  const across = direction !== "column";

  return (
    <div>
      {heading && <h2 className="mb-10 text-center font-serif text-3xl font-semibold">{heading}</h2>}
      <ol className={across ? "grid gap-8 sm:grid-cols-2 lg:grid-cols-4" : "mx-auto max-w-2xl space-y-6"}>
        {shown.map((step, i) => (
          <li key={i} className={across ? "" : "flex gap-4"}>
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500 font-serif text-sm font-semibold text-white ${
                across ? "mb-3" : ""
              }`}
            >
              {i + 1}
            </span>
            <div>
              {step.title && <h3 className="font-medium text-ink">{step.title}</h3>}
              {step.text && (
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink-soft">{step.text}</p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
