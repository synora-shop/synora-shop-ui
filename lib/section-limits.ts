import { DEFAULT_SECTION_STYLE, STYLE_KEY, type SectionSchema, type SettingField } from "@/lib/section-schema";

/**
 * What a save may store for one section — checked on the server, which is
 * the only place a check holds.
 *
 * Before this a section's settings were stored as sent: a text setting could
 * hold a megabyte, a colour an object, a slideshow ten thousand slides, and a
 * platform page any key at all, declared or not. Every storefront visitor
 * then downloads whatever is stored. Now:
 *
 *   - only the settings the section declares are kept, and only those sent
 *     (a missing one is still filled from its default when the page draws,
 *     so a section that gains a setting needs no data migration);
 *   - each kind holds what it says: a string of a sane length, a number
 *     inside its range, an option that exists, a real true/false;
 *   - blocks stop at the section's own maximum, or fifty;
 *   - a whole page stops at PAGE_LIMIT_BYTES.
 *
 * A value of the wrong *type* can only come from a tampered request, so it
 * falls back to the default quietly. A string that is too *long* can come
 * from a merchant pasting an essay, so it is refused with the setting's name.
 */

const LENGTH: Partial<Record<SettingField["kind"], number>> = {
  text: 500,
  textarea: 5_000,
  richtext: 50_000,
  url: 2_048,
  image: 2_048,
  logo: 2_048,
  favicon: 2_048,
  color: 32,
  "contrast-text": 32,
  collection: 64,
  product: 64,
  menu: 64,
  select: 64,
};

/** The most blocks a section may hold when its schema sets no maximum. */
const BLOCK_LIMIT = 50;

/** The most one page's sections may weigh, as stored JSON. */
export const PAGE_LIMIT_BYTES = 512 * 1024;

export class LimitError extends Error {}

function limitField(field: SettingField, value: unknown, where: string): unknown {
  switch (field.kind) {
    case "checkbox":
      return value === true;
    case "range":
    case "number": {
      const n = typeof value === "number" ? value : Number(value);
      if (!Number.isFinite(n)) return field.default;
      const lo = typeof field.min === "number" ? field.min : -1e9;
      const hi = typeof field.max === "number" ? field.max : 1e9;
      return Math.min(hi, Math.max(lo, n));
    }
    case "select":
      return typeof value === "string" && (!field.options || field.options.some((o) => o.value === value)) ? value : field.default;
    default: {
      if (typeof value !== "string") return field.default;
      const max = LENGTH[field.kind] ?? 2_048;
      if (value.length > max) {
        throw new LimitError(`${where}${field.label}: keep it under ${max.toLocaleString("en")} characters (it has ${value.length.toLocaleString("en")}).`);
      }
      return value;
    }
  }
}

function limitFields(fields: SettingField[], raw: Record<string, unknown>, where: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const field of fields) {
    if (field.key in raw) out[field.key] = limitField(field, raw[field.key], where);
  }
  return out;
}

/** One section's settings, as they may be stored. Throws LimitError with a readable reason. */
export function limitSectionData(schema: SectionSchema, stored: unknown): Record<string, unknown> {
  const raw = stored && typeof stored === "object" && !Array.isArray(stored) ? (stored as Record<string, unknown>) : {};
  const where = `${schema.label}, `;
  const out = limitFields(schema.fields, raw, where);

  if (schema.blocks && schema.blocks.key in raw) {
    const blocks = Array.isArray(raw[schema.blocks.key]) ? (raw[schema.blocks.key] as unknown[]) : [];
    const max = schema.blocks.max ?? BLOCK_LIMIT;
    if (blocks.length > max) throw new LimitError(`${where}up to ${max} ${schema.blocks.label.toLowerCase()}s.`);
    out[schema.blocks.key] = blocks.map((b, i) =>
      limitFields(schema.blocks!.fields, b && typeof b === "object" ? (b as Record<string, unknown>) : {}, `${where}${schema.blocks!.label} ${i + 1} · `)
    );
  }

  // The section's own padding, background and width: the known keys only,
  // each the type its default is.
  if (raw[STYLE_KEY] && typeof raw[STYLE_KEY] === "object") {
    const style = raw[STYLE_KEY] as Record<string, unknown>;
    const kept: Record<string, unknown> = {};
    for (const [key, fallback] of Object.entries(DEFAULT_SECTION_STYLE)) {
      const v = style[key];
      if (v === undefined) continue;
      if (typeof fallback === "number") kept[key] = typeof v === "number" && Number.isFinite(v) ? Math.min(400, Math.max(0, v)) : fallback;
      else kept[key] = typeof v === "string" && v.length <= 32 ? v : fallback;
    }
    out[STYLE_KEY] = kept;
  }
  return out;
}

/** Refuses a page whose sections together are too heavy to serve. */
export function limitPage(sections: unknown[]): void {
  const bytes = Buffer.byteLength(JSON.stringify(sections));
  if (bytes > PAGE_LIMIT_BYTES) {
    throw new LimitError(
      `This page is too large to save (${Math.round(bytes / 1024)} KB of settings; the most is ${PAGE_LIMIT_BYTES / 1024} KB). Remove some sections or shorten long text.`
    );
  }
}
