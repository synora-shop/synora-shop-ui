import Link from "next/link";

type Tile = { image?: string; label?: string; href?: string };

/**
 * A few images at different sizes, each a door into the shop.
 *
 * The arrangement is a grid rather than absolute positions, so it reflows on a
 * phone into a plain stack instead of collapsing into overlap — which is what
 * a collage built out of percentages does at 390px.
 */
export function Collage({
  heading,
  layout = "leftLarge",
  tiles,
}: {
  heading?: string;
  layout?: string;
  tiles?: Tile[];
}) {
  const shown = (tiles ?? []).filter((t) => t.image);
  if (shown.length === 0) return null;

  /** Which tile, if any, takes two columns and two rows. */
  const largeIndex = layout === "leftLarge" ? 0 : layout === "rightLarge" ? shown.length - 1 : -1;

  return (
    <div>
      {heading && <h2 className="mb-8 text-center font-serif text-3xl font-semibold">{heading}</h2>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:grid-rows-2">
        {shown.map((tile, i) => {
          const large = i === largeIndex;
          const inner = (
            <div
              className={`group relative h-full overflow-hidden rounded-lg bg-subtle ${
                large ? "aspect-square sm:aspect-auto" : "aspect-square"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- merchant URL of unknown size */}
              <img
                src={tile.image}
                alt={tile.label ?? ""}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {tile.label && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                  <span className="absolute bottom-3 left-3 text-sm font-medium text-white sm:text-base">
                    {tile.label}
                  </span>
                </>
              )}
            </div>
          );
          const span = large ? "sm:col-span-2 sm:row-span-2" : "";
          return tile.href ? (
            <Link key={i} href={tile.href} className={span}>
              {inner}
            </Link>
          ) : (
            <div key={i} className={span}>
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}
