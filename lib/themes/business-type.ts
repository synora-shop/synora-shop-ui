/**
 * Moving between the two spellings of a business type.
 *
 * It exists twice for good reasons and neither is going away: the database
 * stores `ECOMMERCE` because that is how Prisma writes an enum, and the theme
 * registry uses `ecommerce` because that is what a theme declares and what
 * reads well in a URL. The conversion is here so it is written once rather than
 * inline at every boundary, where one of them would eventually be wrong.
 *
 * Client-safe: pure, no imports beyond types.
 */
import { BUSINESS_TYPES, type BusinessType } from "@/lib/themes/registry";

/** How the database spells it. */
export type StoredBusinessType = "ECOMMERCE" | "BLOG" | "RESTAURANT";

/** Whether an arbitrary string is a business type this platform knows. */
export function isBusinessType(value: string): value is BusinessType {
  return (BUSINESS_TYPES as readonly string[]).includes(value);
}

/** `"ecommerce"` to `"ECOMMERCE"`. */
export function storedBusinessType(value: BusinessType): StoredBusinessType {
  return value.toUpperCase() as StoredBusinessType;
}

/**
 * `"ECOMMERCE"` to `"ecommerce"`.
 *
 * Falls back rather than throwing: a value the database holds and the registry
 * has not heard of should leave a merchant on the default type, not on an error
 * page they cannot act on.
 */
export function registryBusinessType(value: string | null | undefined): BusinessType {
  const lower = String(value ?? "").toLowerCase();
  return isBusinessType(lower) ? lower : "ecommerce";
}
