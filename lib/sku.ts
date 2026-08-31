// Generating SKUs, so nobody has to type them.
//
// A SKU is an internal code with exactly one requirement — that it is unique —
// and no requirement at all that a human chose it. Making merchants invent one
// per variant was busywork that also produced the collisions it was meant to
// avoid, because people reach for the same obvious strings.
//
// The shape is TITLE-SIZE-COLOUR: readable enough to recognise on a packing
// slip, derived so it can never disagree with the variant it names.
//
// Client-safe: pure string handling, no Prisma.

/** Strips a string to the letters and digits a code can contain. */
function code(value: string, max: number): string {
  const cleaned = value
    .normalize("NFKD")
    // Drop combining marks so "Café" becomes "CAFE" rather than losing letters.
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "");
  return cleaned.slice(0, max);
}

/**
 * Initials from a multi-word title, so "Silk Lawn Kurta" reads as "SLK".
 *
 * A single word keeps its opening letters instead, because "S" alone tells
 * nobody anything.
 */
function titleCode(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "ITEM";
  if (words.length === 1) return code(words[0], 5) || "ITEM";
  const initials = words.map((w) => code(w, 1)).join("");
  return initials.slice(0, 5) || "ITEM";
}

export type SkuParts = { title: string; size?: string; color?: string };

/** The SKU for one variant, before uniqueness is considered. */
export function buildSku({ title, size, color }: SkuParts): string {
  const parts = [titleCode(title)];
  if (size?.trim()) parts.push(code(size, 4));
  if (color?.trim()) parts.push(code(color, 4));
  return parts.filter(Boolean).join("-");
}

/**
 * A SKU guaranteed not to collide with any already in use.
 *
 * Two variants can legitimately produce the same base — a product with two
 * shades both called "Blue", say — and a SKU is a unique key in the database,
 * so a clash isn't a cosmetic problem but a failed save. Rather than refusing,
 * a numeric suffix is added, which is what a person would do anyway.
 */
export function uniqueSku(parts: SkuParts, taken: Iterable<string>): string {
  const used = new Set(Array.from(taken, (s) => s.toUpperCase()));
  const base = buildSku(parts);
  if (!used.has(base)) return base;

  for (let n = 2; n < 1000; n++) {
    const candidate = `${base}-${n}`;
    if (!used.has(candidate)) return candidate;
  }
  // A thousand identical variants means something is wrong upstream, but a save
  // should still succeed rather than loop forever.
  return `${base}-${Date.now().toString(36).toUpperCase()}`;
}

/**
 * Fills in any missing SKUs across a set of variants, leaving typed ones alone.
 *
 * Deliberately non-destructive: a merchant migrating from another system may
 * have codes that match their warehouse labels, and silently rewriting those
 * would break the thing the SKU exists for.
 */
export function fillSkus<T extends { size: string; color: string; sku: string }>(
  title: string,
  variants: T[]
): T[] {
  const taken = new Set(variants.map((v) => v.sku.trim().toUpperCase()).filter(Boolean));
  return variants.map((variant) => {
    if (variant.sku.trim()) return variant;
    const sku = uniqueSku({ title, size: variant.size, color: variant.color }, taken);
    taken.add(sku.toUpperCase());
    return { ...variant, sku };
  });
}
