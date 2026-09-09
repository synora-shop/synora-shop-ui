import { COLS_CLASS } from "./grid-classes";
import { ImagePlaceholder } from "@/components/storefront/image-placeholder";

type Person = { image?: string; name?: string; role?: string; text?: string };

/** The people behind the shop. */
export function Team({
  heading,
  people,
  columns = 3,
  shape = "round",
}: {
  heading?: string;
  people?: Person[];
  columns?: number;
  shape?: string;
}) {
  const shown = (people ?? []).filter((p) => p.name?.trim());
  if (shown.length === 0) return null;
  const round = shape !== "square";

  return (
    <div>
      {heading && <h2 className="mb-10 text-center font-serif text-3xl font-semibold">{heading}</h2>}
      <div className={`grid gap-8 ${COLS_CLASS[columns] ?? COLS_CLASS[3]}`}>
        {shown.map((person, i) => (
          <div key={i} className="flex flex-col items-center text-center">
            <div
              className={`relative overflow-hidden bg-subtle ${
                round ? "h-28 w-28 rounded-full" : "aspect-square w-full rounded-lg"
              }`}
            >
              {person.image ? (
                // eslint-disable-next-line @next/next/no-img-element -- merchant URL of unknown size
                <img src={person.image} alt={person.name ?? ""} loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <ImagePlaceholder kind="image" variant={i} className="absolute inset-0 h-full w-full" />
              )}
            </div>
            <p className="mt-3 font-medium text-ink">{person.name}</p>
            {person.role && <p className="text-xs uppercase tracking-wider text-brand-600">{person.role}</p>}
            {person.text && (
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-soft">{person.text}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
