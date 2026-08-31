import Link from "next/link";
import { ImagePlaceholder } from "@/components/storefront/image-placeholder";
import Image from "next/image";
import { cn } from "@/lib/utils";

export type CategoryTile = { id: string; name: string; slug: string; image: string | null };

// Literal class strings so Tailwind's scanner can see them (a template literal
// built from the `columns` setting would be stripped from the CSS bundle).
const COLUMN_CLASS: Record<number, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
  5: "sm:grid-cols-5",
  6: "sm:grid-cols-6",
};

/**
 * Presentation only — takes its categories as a prop.
 *
 * Split out from the data-fetching wrapper below so the customizer's live
 * preview (which re-renders on the client as you type) can use the exact same
 * markup as the real storefront instead of a lookalike that could drift.
 */
export function CategoryGridView({
  heading,
  columns = 4,
  categories,
}: {
  heading?: string;
  columns?: number;
  categories: CategoryTile[];
}) {
  if (categories.length === 0) return null;

  return (
    <>
      <h2 className="text-center font-serif text-3xl font-semibold">{heading || "Shop by Category"}</h2>
      <div className={cn("mt-10 grid grid-cols-2 gap-4", COLUMN_CLASS[columns] ?? COLUMN_CLASS[4])}>
        {categories.map((cat, i) => (
          <Link
            key={cat.id}
            href={`/collections/${cat.slug}`}
            className="group relative flex aspect-[3/4] flex-col items-center justify-end overflow-hidden rounded-lg bg-brand-100 p-4 text-center"
          >
            {cat.image ? (
              <Image
                src={cat.image}
                alt={cat.name}
                fill
                sizes="(min-width: 1024px) 25vw, 50vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              // A tile with no photo was a flat block of brand colour with the
              // name floating on it, which looks like an image that failed
              // rather than one nobody has added.
              <ImagePlaceholder
                kind="collection"
                variant={i}
                className="absolute inset-0 h-full w-full"
              />
            )}
            <span className="relative z-10 rounded-full bg-white/90 px-4 py-1 font-serif text-lg font-medium text-brand-700">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
