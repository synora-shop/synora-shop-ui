import Link from "next/link";
import { COLS_CLASS, SHAPE_CLASS } from "./grid-classes";

type Photo = { image?: string; caption?: string; href?: string };

/** A grid of photos, each optionally a link. */
export function Gallery({
  heading,
  columns = 3,
  shape = "square",
  images,
}: {
  heading?: string;
  columns?: number;
  shape?: string;
  images?: Photo[];
}) {
  const shown = (images ?? []).filter((i) => i.image);
  if (shown.length === 0) return null;

  return (
    <div>
      {heading && <h2 className="mb-8 text-center font-serif text-3xl font-semibold">{heading}</h2>}
      <div className={`grid grid-cols-2 gap-3 ${COLS_CLASS[columns] ?? COLS_CLASS[3]}`}>
        {shown.map((photo, i) => {
          const figure = (
            <figure>
              <div className={`overflow-hidden rounded-lg bg-subtle ${SHAPE_CLASS[shape] ?? SHAPE_CLASS.square}`}>
                {/* eslint-disable-next-line @next/next/no-img-element -- merchant URL of unknown size */}
                <img
                  src={photo.image}
                  alt={photo.caption ?? ""}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
              {photo.caption && (
                <figcaption className="mt-2 text-center text-xs text-ink-soft">{photo.caption}</figcaption>
              )}
            </figure>
          );
          return photo.href ? (
            <Link key={i} href={photo.href} className="block">
              {figure}
            </Link>
          ) : (
            <div key={i}>{figure}</div>
          );
        })}
      </div>
    </div>
  );
}
