/**
 * What this kind of business calls its own things.
 *
 * A restaurant's dishes really are products and its courses really are
 * categories — the screens, the database and the storefront are identical, and
 * only the word changes. That makes the words worth centralising and dangerous
 * to scatter: the sidebar learned to say "Dishes" while the dashboard beside it
 * still said "Products" and offered "Add product", so the admin disagreed with
 * itself on the first screen a merchant sees.
 *
 * Adding a business type means adding a column here, and anything that reads a
 * word gets it. Anything not overridden falls back to the ecommerce wording,
 * which is what the product has always said.
 *
 * Client-safe: pure data.
 */
import type { BusinessType } from "@/lib/themes/registry";

type Term =
  | "product"
  | "products"
  | "addProduct"
  | "category"
  | "categories"
  | "lowStock";

const BASE: Record<Term, string> = {
  product: "Product",
  products: "Products",
  addProduct: "Add product",
  category: "Category",
  categories: "Categories",
  lowStock: "Low stock",
};

const OVERRIDES: Partial<Record<BusinessType, Partial<Record<Term, string>>>> = {
  restaurant: {
    product: "Dish",
    products: "Dishes",
    addProduct: "Add dish",
    category: "Course",
    categories: "Courses",
    lowStock: "Running low",
  },
  // A blog sells nothing, so these words never reach a screen it can see. Left
  // empty rather than invented: a wrong word is worse than the plain one.
  blog: {},
};

/** The word this business uses. */
export function wordFor(businessType: BusinessType, term: Term): string {
  return OVERRIDES[businessType]?.[term] ?? BASE[term];
}

/** Every term, for a caller that needs several. */
export function vocabularyFor(businessType: BusinessType): Record<Term, string> {
  return { ...BASE, ...(OVERRIDES[businessType] ?? {}) };
}
