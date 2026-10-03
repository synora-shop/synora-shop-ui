import { StoreLink as Link } from "@/components/storefront/store-link";
import { SectionImage } from "@/components/storefront/section-image";

type Tile = {
  image?: string;
  label?: string;
  href?: string;
  title?: string;
  body?: string;
  ctaLabel?: string;
};

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
                large
                  ? tile.title
                    ? "aspect-[4/5] sm:aspect-auto sm:min-h-[520px]"
                    : "aspect-square sm:aspect-auto"
                  : "aspect-square"
              }`}
            >
              <SectionImage
      src={tile.image}
      alt={tile.label ?? ""}
      className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      sizes="(min-width: 1024px) 50vw, 100vw"
    />
              {/* A headline turns the tile into the page's opening statement:
                  the words move to the top, the wash covers the whole tile so
                  a sentence stays readable over a busy photograph, and the
                  button appears. Without one it is the small corner label it
                  has always been, so no existing collage changes. */}
              {tile.title ? (
                <>
                  <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/35 to-transparent" />
                  <div className="absolute inset-0 flex flex-col items-start justify-start gap-3 p-6 text-white sm:p-10">
                    <h3 className="max-w-[12ch] text-balance font-serif text-3xl leading-[1.05] sm:text-5xl lg:text-6xl">
                      {tile.title}
                    </h3>
                    {tile.body && (
                      <p className="max-w-[34ch] text-sm opacity-80 sm:text-base">{tile.body}</p>
                    )}
                    {tile.ctaLabel && tile.href && (
                      // A span, not a link. The whole tile is already an
                      // anchor when it has an href, and an anchor inside an
                      // anchor is invalid HTML that browsers repair by
                      // splitting the outer one — so the tile would stop being
                      // clickable everywhere except the button.
                      <span className="mt-2 inline-flex items-center justify-center rounded-pill bg-ink px-7 py-3 text-xs font-medium uppercase tracking-[0.08em] text-canvas transition-opacity group-hover:opacity-90">
                        {tile.ctaLabel}
                      </span>
                    )}
                  </div>
                </>
              ) : (
                tile.label && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                    <span className="absolute bottom-3 left-3 text-sm font-medium text-white sm:text-base">
                      {tile.label}
                    </span>
                  </>
                )
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
