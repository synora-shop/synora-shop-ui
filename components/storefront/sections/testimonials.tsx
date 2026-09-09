import { Star } from "lucide-react";
import { COLS_CLASS } from "./grid-classes";

type Quote = { quote?: string; name?: string; rating?: number; image?: string };

/** What customers said, in their own words. */
export function Testimonials({
  heading,
  quotes,
  columns = 3,
  showRating = true,
}: {
  heading?: string;
  quotes?: Quote[];
  columns?: number;
  showRating?: boolean;
}) {
  const shown = (quotes ?? []).filter((q) => q.quote?.trim());
  if (shown.length === 0) return null;

  return (
    <div>
      {heading && <h2 className="mb-8 text-center font-serif text-3xl font-semibold">{heading}</h2>}
      <div className={`grid gap-5 ${COLS_CLASS[columns] ?? COLS_CLASS[3]}`}>
        {shown.map((q, i) => (
          <figure key={i} className="flex h-full flex-col rounded-lg border border-border bg-white p-5">
            {showRating && (q.rating ?? 0) > 0 && (
              <div className="mb-3 flex gap-0.5" aria-label={`${q.rating} out of 5`}>
                {Array.from({ length: Math.min(5, q.rating ?? 0) }, (_, s) => (
                  <Star key={s} className="h-3.5 w-3.5 fill-amber text-amber" aria-hidden />
                ))}
              </div>
            )}
            <blockquote className="flex-1 whitespace-pre-line text-sm leading-relaxed text-ink">
              {q.quote}
            </blockquote>
            {q.name && (
              <figcaption className="mt-4 flex items-center gap-2.5 border-t border-border pt-3">
                {q.image && (
                  // eslint-disable-next-line @next/next/no-img-element -- merchant URL of unknown size
                  <img src={q.image} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
                )}
                <span className="text-xs font-medium text-ink-soft">{q.name}</span>
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </div>
  );
}
