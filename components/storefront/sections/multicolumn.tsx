import Link from "next/link";
import { COLS_CLASS } from "./grid-classes";

type Column = { image?: string; title?: string; text?: string; ctaLabel?: string; ctaHref?: string };

/** Columns of picture, heading and text. The workhorse content section. */
export function Multicolumn({
  heading,
  columnsList,
  columns = 3,
  align = "center",
}: {
  heading?: string;
  columnsList?: Column[];
  columns?: number;
  align?: string;
}) {
  const shown = (columnsList ?? []).filter((c) => c.title?.trim() || c.text?.trim() || c.image);
  if (shown.length === 0) return null;
  const centred = align !== "left";

  return (
    <div>
      {heading && <h2 className="mb-10 text-center font-serif text-3xl font-semibold">{heading}</h2>}
      <div className={`grid gap-8 ${COLS_CLASS[columns] ?? COLS_CLASS[3]}`}>
        {shown.map((column, i) => (
          <div key={i} className={`flex flex-col gap-2 ${centred ? "items-center text-center" : "items-start"}`}>
            {column.image && (
              // eslint-disable-next-line @next/next/no-img-element -- merchant URL of unknown size
              <img src={column.image} alt="" loading="lazy" className="mb-1 h-12 w-12 object-contain" />
            )}
            {column.title && <h3 className="font-medium text-ink">{column.title}</h3>}
            {column.text && (
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink-soft">{column.text}</p>
            )}
            {column.ctaLabel && column.ctaHref && (
              <Link href={column.ctaHref} className="mt-1 text-sm font-medium text-brand-600 underline-scribble">
                {column.ctaLabel}
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
