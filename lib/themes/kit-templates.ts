import type { KitSectionEntry, KitTemplate, TemplateName } from "@/lib/themes/kit";
import { TEMPLATE_NAMES } from "@/lib/themes/kit";
import { resolveSchemaData } from "@/lib/section-schema";
import type { ThemeKit } from "@/lib/themes/kits";

/**
 * A theme copy's templates: what it stored, else the kit's default.
 *
 * Pure — no database — so the storefront, the customizer and the checks all
 * resolve a template by the same rules.
 */

/** The most sections one template may hold. A page with forty is a page nobody scrolls. */
export const MAX_SECTIONS = 40;

export function isTemplateName(name: string): name is TemplateName {
  return (TEMPLATE_NAMES as readonly string[]).includes(name);
}

/**
 * The template a copy draws for `name`: its own stored edit when that edit is
 * still valid against the kit, otherwise the kit's default. An edit made under
 * an older kit that no longer validates falls back rather than breaking the
 * page — the merchant's work is kept in the row, and the page still draws.
 */
export function templateFor(kit: ThemeKit, stored: unknown, name: TemplateName): KitTemplate {
  const all = (stored ?? {}) as Record<string, unknown>;
  const own = all[name];
  if (own) {
    const checked = checkTemplate(kit, name, own);
    if (checked.ok) return checked.template;
  }
  return kit.templates[name];
}

/**
 * Validate and normalise a template a merchant saved. Everything the
 * customizer sends is checked here, on the server, before it is stored:
 *
 *   - only section types this kit has;
 *   - every id a short unique string;
 *   - settings filled through the section's own schema, so unknown keys are
 *     dropped and nothing but declared settings is ever stored;
 *   - a singleton section at most once;
 *   - the template's main section — a singleton in the kit's default for it,
 *     like the product page's product — present: it can be moved, not removed.
 */
export function checkTemplate(
  kit: ThemeKit,
  name: TemplateName,
  input: unknown
): { ok: true; template: KitTemplate } | { ok: false; error: string } {
  const raw = input as { sections?: unknown };
  if (!raw || !Array.isArray(raw.sections)) return { ok: false, error: "A template is a list of sections." };
  if (raw.sections.length > MAX_SECTIONS) return { ok: false, error: `At most ${MAX_SECTIONS} sections on one page.` };

  const seenIds = new Set<string>();
  const seenSingletons = new Set<string>();
  const sections: KitSectionEntry[] = [];
  for (const s of raw.sections as Record<string, unknown>[]) {
    const type = typeof s?.type === "string" ? s.type : "";
    const def = kit.sections[type];
    if (!def) return { ok: false, error: `“${type}” is not a section this theme has.` };
    const id = typeof s.id === "string" ? s.id : "";
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(id) || seenIds.has(id)) return { ok: false, error: "Every section needs its own id." };
    seenIds.add(id);
    if (def.schema.singleton) {
      if (seenSingletons.has(type)) return { ok: false, error: `${def.schema.label} can only be on a page once.` };
      seenSingletons.add(type);
    }
    const data = resolveSchemaData(def.schema, s.data);
    sections.push({ id, type, visible: s.visible !== false, data });
  }

  for (const type of requiredTypes(kit, name)) {
    const present = sections.find((s) => s.type === type);
    if (!present) return { ok: false, error: `${kit.sections[type].schema.label} cannot be removed from this page.` };
    if (present.visible === false) return { ok: false, error: `${kit.sections[type].schema.label} cannot be hidden on this page.` };
  }
  return { ok: true, template: { name: kit.templates[name].name, sections } };
}

/** The section types a template must keep, shown: the singletons its default carries — its main section. */
export function requiredTypes(kit: ThemeKit, name: TemplateName): string[] {
  return kit.templates[name].sections.map((s) => s.type).filter((t) => kit.sections[t]?.schema.singleton);
}
