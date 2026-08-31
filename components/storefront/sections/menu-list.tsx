import Image from "next/image";

/** One dish. A product, read rather than shopped. */
export type MenuDish = {
  id: string;
  title: string;
  description: string;
  price: string | null;
  image: string | null;
  dietary: string[];
};

export type MenuGroup = {
  id: string;
  name: string;
  dishes: MenuDish[];
};

/**
 * Short marks rather than words.
 *
 * A menu is read while deciding, often on a phone, and "Vegetarian ·
 * Gluten free · Spicy" under every second dish is noise. These are the
 * abbreviations menus have used for decades, with the full word in a title
 * attribute for anyone who does not know them or is using a screen reader.
 */
const DIETARY: Record<string, { short: string; full: string }> = {
  VEGETARIAN: { short: "V", full: "Vegetarian" },
  VEGAN: { short: "VG", full: "Vegan" },
  GLUTEN_FREE: { short: "GF", full: "Gluten free" },
  DAIRY_FREE: { short: "DF", full: "Dairy free" },
  NUT_FREE: { short: "NF", full: "Nut free" },
  HALAL: { short: "H", full: "Halal" },
  SPICY: { short: "★", full: "Spicy" },
};

/**
 * A menu: dishes grouped by course, priced, with nothing to click.
 *
 * Deliberately not the product grid. A product grid exists to sell one thing at
 * a time — a card, an image, a button. A menu is a list you read top to bottom
 * while deciding, so it is dense, ordered by course, and has no buy button even
 * though every dish here is a product that could have one. A restaurant that
 * does take orders online still wants this on its front page.
 */
export function MenuList({
  heading,
  groups = [],
  showImages = false,
  showDescriptions = true,
}: {
  heading?: string;
  groups?: MenuGroup[];
  showImages?: boolean;
  showDescriptions?: boolean;
}) {
  const filled = groups.filter((group) => group.dishes.length > 0);

  if (filled.length === 0) {
    return (
      <div className="mx-auto max-w-3xl text-center">
        {heading && <h2 className="font-serif text-3xl font-semibold">{heading}</h2>}
        <p className="mt-3 text-sm text-ink-soft">Nothing on the menu yet.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {heading && (
        <h2 className="text-center font-serif text-3xl font-semibold">{heading}</h2>
      )}

      <div className="mt-10 space-y-12">
        {filled.map((group) => (
          <section key={group.id}>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-soft">
              {group.name}
            </h3>

            <ul className="mt-5 space-y-5">
              {group.dishes.map((dish) => (
                <li key={dish.id} className="flex gap-4">
                  {showImages && dish.image && (
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-[var(--radius)] bg-subtle">
                      <Image src={dish.image} alt="" fill sizes="64px" className="object-cover" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    {/* The dotted leader is what makes a list of prices read as
                        a menu. It is a border rather than a row of full stops so
                        it stays put at any width. */}
                    <div className="flex items-baseline gap-2">
                      <span className="font-medium text-ink">{dish.title}</span>

                      {dish.dietary.length > 0 && (
                        <span className="flex gap-1 text-[11px] text-ink-faint">
                          {dish.dietary.map((flag) => {
                            const mark = DIETARY[flag];
                            if (!mark) return null;
                            return (
                              <abbr
                                key={flag}
                                title={mark.full}
                                className="no-underline"
                                aria-label={mark.full}
                              >
                                {mark.short}
                              </abbr>
                            );
                          })}
                        </span>
                      )}

                      <span
                        aria-hidden
                        className="min-w-6 flex-1 translate-y-[-0.25rem] border-b border-dotted border-border"
                      />

                      {dish.price && (
                        <span className="flex-shrink-0 tabular-nums text-ink">{dish.price}</span>
                      )}
                    </div>

                    {showDescriptions && dish.description && (
                      <p className="mt-1 text-sm leading-snug text-ink-soft">{dish.description}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
