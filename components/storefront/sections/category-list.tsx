import Link from "next/link";
import type { CategoryTile } from "./category-grid";

/**
 * Categories as plain text links.
 *
 * The quiet counterpart to the category grid: no photos, no tiles, just the
 * names. A shop with forty categories cannot show forty photographs, and a shop
 * whose categories have no photographs should not show forty grey rectangles.
 */
export function CategoryList({
  heading,
  categories,
  align = "center",
  showCount = false,
}: {
  heading?: string;
  categories: CategoryTile[];
  align?: string;
  showCount?: boolean;
}) {
  if (categories.length === 0) return null;
  const centred = align !== "left";

  return (
    <div className={centred ? "text-center" : ""}>
      {heading && <h2 className="mb-6 font-serif text-3xl font-semibold">{heading}</h2>}
      <ul className={`flex flex-wrap gap-x-6 gap-y-3 ${centred ? "justify-center" : ""}`}>
        {categories.map((category) => (
          <li key={category.id}>
            <Link
              href={`/collections/${category.slug}`}
              className="text-sm font-medium text-ink transition-colors hover:text-brand-600"
            >
              {category.name}
              {showCount && category.productCount != null && (
                <span className="ml-1.5 text-xs text-ink-faint">{category.productCount}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
