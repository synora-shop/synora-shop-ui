/**
 * Metafields: the types we accept, and how a stored string becomes a value.
 *
 * Shopify stores every metafield as text and declares its type separately,
 * and copying that is not laziness — it is the only thing that makes "1"
 * unambiguous. As a string it prints as `1`; as an integer a theme can do
 * arithmetic on it; as a boolean it decides an `{% if %}`. Nothing about the
 * characters says which was meant, so the type is recorded and the cast
 * happens on the way out.
 *
 * Client-safe: pure data and pure functions, no imports.
 */

/** What a metafield can be attached to. */
export const OWNER_TYPES = ["product", "collection", "page", "shop"] as const;
export type OwnerType = (typeof OWNER_TYPES)[number];

/**
 * The subset of Shopify's type system we implement.
 *
 * Deliberately small. Every entry here is a type a theme can actually do
 * something useful with; the reference types (`product_reference` and friends)
 * are left out until there is somewhere for a reference to resolve *to*,
 * because a type that silently yields nothing is worse than one that is
 * honestly absent.
 */
export const METAFIELD_TYPES = [
  "single_line_text_field",
  "multi_line_text_field",
  "number_integer",
  "number_decimal",
  "boolean",
  "json",
  "url",
  "color",
  "date",
] as const;
export type MetafieldType = (typeof METAFIELD_TYPES)[number];

export const TYPE_LABELS: Record<MetafieldType, string> = {
  single_line_text_field: "Text",
  multi_line_text_field: "Text (multiple lines)",
  number_integer: "Whole number",
  number_decimal: "Decimal number",
  boolean: "True or false",
  json: "JSON",
  url: "URL",
  color: "Colour",
  date: "Date",
};

export function isMetafieldType(value: unknown): value is MetafieldType {
  return typeof value === "string" && (METAFIELD_TYPES as readonly string[]).includes(value);
}

export function isOwnerType(value: unknown): value is OwnerType {
  return typeof value === "string" && (OWNER_TYPES as readonly string[]).includes(value);
}

/**
 * Namespaces and keys are Shopify's two-part name, so an app's fields can
 * never collide with a merchant's. Restricted to what Shopify allows, because
 * these end up as Liquid property lookups: `product.metafields.custom.material`
 * only resolves if both halves are valid identifiers.
 */
const NAME = /^[a-zA-Z0-9_-]{1,64}$/;

export function nameProblem(namespace: string, key: string): string | null {
  if (!NAME.test(namespace)) {
    return "A namespace can use letters, numbers, dashes and underscores, up to 64 characters.";
  }
  if (!NAME.test(key)) {
    return "A key can use letters, numbers, dashes and underscores, up to 64 characters.";
  }
  return null;
}

/** Whether a value is usable as the given type — the message says why not. */
export function valueProblem(type: MetafieldType, value: string): string | null {
  switch (type) {
    case "number_integer":
      return /^-?\d+$/.test(value.trim()) ? null : "That needs to be a whole number.";
    case "number_decimal":
      return Number.isFinite(Number(value.trim())) && value.trim() !== ""
        ? null
        : "That needs to be a number.";
    case "boolean":
      return value === "true" || value === "false" ? null : "That needs to be true or false.";
    case "json":
      try {
        JSON.parse(value);
        return null;
      } catch {
        return "That isn't valid JSON.";
      }
    case "url":
      // Relative URLs are legitimate here — a size guide often lives on the
      // same store — so only an absolute one is checked for a safe scheme.
      if (value.startsWith("/")) return null;
      try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:"
          ? null
          : "A URL needs to start with http:// or https://";
      } catch {
        return "That isn't a valid web address.";
      }
    case "color":
      return /^#[0-9a-fA-F]{3,8}$/.test(value.trim()) ? null : "That needs to be a hex colour, like #336699.";
    case "date":
      return /^\d{4}-\d{2}-\d{2}$/.test(value.trim()) && !Number.isNaN(Date.parse(value))
        ? null
        : "That needs to be a date, as YYYY-MM-DD.";
    default:
      return value.length > 100_000 ? "That value is too long." : null;
  }
}

/** The stored text, as the type says it should be read. */
export function castValue(type: MetafieldType, value: string): unknown {
  switch (type) {
    case "number_integer": {
      const n = Number.parseInt(value, 10);
      return Number.isFinite(n) ? n : 0;
    }
    case "number_decimal": {
      const n = Number(value);
      return Number.isFinite(n) ? n : 0;
    }
    case "boolean":
      return value === "true";
    case "json":
      try {
        return JSON.parse(value) as unknown;
      } catch {
        // A theme iterating over what it was told is JSON should get an empty
        // object rather than a string it will index into and print undefined.
        return {};
      }
    default:
      return value;
  }
}
