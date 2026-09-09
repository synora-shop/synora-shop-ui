type Milestone = { date?: string; title?: string; text?: string };

/** Dated milestones down the page, on a single rule. */
export function Timeline({ heading, events }: { heading?: string; events?: Milestone[] }) {
  const shown = (events ?? []).filter((e) => e.title?.trim() || e.date?.trim());
  if (shown.length === 0) return null;

  return (
    <div className="mx-auto max-w-2xl">
      {heading && <h2 className="mb-10 text-center font-serif text-3xl font-semibold">{heading}</h2>}
      <ol className="relative border-l border-border pl-8">
        {shown.map((event, i) => (
          <li key={i} className="relative pb-8 last:pb-0">
            {/* Sits on the rule rather than beside it: -2.06rem is the padding
                less half the dot, which is what puts its centre on the line. */}
            <span className="absolute -left-[2.06rem] top-1.5 h-2.5 w-2.5 rounded-full bg-brand-500 ring-4 ring-canvas" />
            {event.date && (
              <p className="text-xs font-medium uppercase tracking-wider text-brand-600">{event.date}</p>
            )}
            {event.title && <h3 className="mt-1 font-medium text-ink">{event.title}</h3>}
            {event.text && (
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink-soft">{event.text}</p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
