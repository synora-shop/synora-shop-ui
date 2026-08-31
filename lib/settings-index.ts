// A searchable index of everything an admin can change.
//
// The customizer grew past the point where you can find a setting by
// remembering which panel it lives in: there are two admin areas, six tools and
// roughly forty individual controls, most of them inside one long scrolling
// column. Knowing a feature exists is a different problem from knowing where it
// is, and until now nothing solved either.
//
// This is built from the same schemas that generate the UI — THEME_GROUPS and
// SECTION_SCHEMAS — rather than a hand-written list, so a setting cannot be
// added without becoming findable. That property is the whole point; a search
// index maintained by hand would drift the first time someone was in a hurry.
//
// Client-safe: pure data, no Prisma, no next/headers.

import { THEME_GROUPS } from "@/lib/theme-schema";
import { SECTION_SCHEMAS, STYLE_FIELDS } from "@/lib/section-schema";

export type SettingEntry = {
  /** Stable id, unique across panels. */
  id: string;
  /** What the control is called in the UI. */
  label: string;
  /** The help text, so searching for what something *does* finds it too. */
  info: string;
  /** Breadcrumb, outermost first: ["Theme", "Logo"]. */
  path: string[];
  /** Where to go. Includes the hash the target panel scrolls to. */
  href: string;
  /** Extra words worth matching that don't appear in the label. */
  keywords: string[];
};

/** Anchor id for a control, shared by the index and the panels that render it. */
export function settingAnchor(key: string): string {
  return `setting-${key}`;
}

/** Anchor id for a group heading. */
export function groupAnchor(title: string): string {
  return `group-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

/**
 * Tools that are whole pages rather than individual settings.
 *
 * Hand-listed because they have no schema to derive from, and kept short: the
 * settings inside them come from the schemas below.
 */
const TOOLS: SettingEntry[] = [
  { id: "tool-online-store", label: "Online store", info: "Your live shop, the themes you have uploaded, and every way to change how the store looks.", path: ["Online store"], href: "/admin/online-store", keywords: ["design", "look", "theme", "themes", "storefront", "preview", "live", "shop front"] },
  { id: "tool-customizer", label: "Customize", info: "Lay out pages section by section with a live preview.", path: ["Online store"], href: "/admin/customize", keywords: ["sections", "layout", "homepage", "pages", "drag"] },
  { id: "tool-theme", label: "Colours & type", info: "Colours, typography, logo, favicon and shape for the whole store.", path: ["Online store"], href: "/admin/theme", keywords: ["design", "style", "branding", "look"] },
  { id: "tool-fonts", label: "Fonts", info: "Upload your own primary and secondary fonts.", path: ["Online store"], href: "/admin/fonts", keywords: ["typeface", "woff", "otf", "ttf", "upload", "typography"] },
  { id: "tool-buttons", label: "Sticky buttons", info: "Floating WhatsApp, Instagram and chat buttons, and where they appear.", path: ["Online store"], href: "/admin/buttons", keywords: ["whatsapp", "chat", "instagram", "floating", "contact", "bubble"] },
  { id: "tool-redirects", label: "Links & redirects", info: "Keep old addresses working, and find menu links that lead nowhere.", path: ["Online store"], href: "/admin/redirects", keywords: ["404", "broken", "url", "moved", "seo"] },
  { id: "tool-products", label: "Products", info: "Your catalog: prices, images, stock and descriptions.", path: ["Admin"], href: "/admin/products", keywords: ["catalog", "items", "stock", "price", "inventory"] },
  { id: "tool-categories", label: "Categories", info: "Collections that group your products.", path: ["Admin"], href: "/admin/categories", keywords: ["collections", "groups", "taxonomy"] },
  { id: "tool-bin", label: "Bin", info: "Deleted products, recoverable before they're gone for good.", path: ["Admin"], href: "/admin/bin", keywords: ["trash", "deleted", "restore", "recover"] },
  { id: "tool-pages", label: "Pages", info: "Custom pages like About or Size Guide.", path: ["Admin"], href: "/admin/pages", keywords: ["about", "faq", "content", "custom page"] },
  { id: "tool-menus", label: "Menus", info: "What appears in the header and footer navigation.", path: ["Admin"], href: "/admin/menus", keywords: ["navigation", "nav", "header", "footer", "links"] },
  { id: "tool-site-text", label: "Site Text", info: "Wording of buttons and labels across the store.", path: ["Admin"], href: "/admin/site-text", keywords: ["copy", "wording", "labels", "translate", "strings"] },
  { id: "tool-metafields", label: "Custom fields", info: "Extra information on products, categories and pages that your theme can read. Shopify calls these metafields.", path: ["Admin"], href: "/admin/metafields", keywords: ["metafield", "metafields", "custom", "extra", "attribute", "specification", "care", "size guide"] },
  { id: "tool-orders", label: "Orders", info: "Customer orders and their status.", path: ["Admin"], href: "/admin/orders", keywords: ["sales", "purchases", "customers"] },
  { id: "tool-settings", label: "Settings", info: "Store-wide settings like contact details and payment methods.", path: ["Admin"], href: "/admin/settings", keywords: ["store", "config", "whatsapp", "payment", "shipping"] },
];

function themeEntries(): SettingEntry[] {
  return THEME_GROUPS.flatMap((group) =>
    group.fields.map((field) => ({
      id: `theme-${field.key}`,
      label: field.label,
      info: field.info,
      path: ["Theme", group.title],
      href: `/admin/theme#${settingAnchor(field.key)}`,
      // The group name is worth matching on: someone searching "header" should
      // reach the header settings even though no label contains that word.
      keywords: [group.title],
    }))
  );
}

/**
 * Section settings, deduplicated by label.
 *
 * Many sections share a setting name — nearly all of them have a "Heading" —
 * and listing each separately would bury everything else under near-identical
 * rows. One entry per distinct label, carrying the sections it belongs to, is
 * both shorter and more useful: what you want to know is which section to open.
 */
function sectionEntries(): SettingEntry[] {
  const byLabel = new Map<string, { field: { key: string; label: string; info: string }; sections: string[] }>();

  const record = (field: { key: string; label: string; info: string }, sectionLabel: string) => {
    const existing = byLabel.get(field.label);
    if (existing) {
      if (!existing.sections.includes(sectionLabel)) existing.sections.push(sectionLabel);
    } else {
      byLabel.set(field.label, { field, sections: [sectionLabel] });
    }
  };

  for (const schema of Object.values(SECTION_SCHEMAS)) {
    for (const field of schema.fields) record(field, schema.label);
    // A section has at most one repeatable block (slides, logos, columns).
    for (const field of schema.blocks?.fields ?? []) record(field, schema.label);
  }
  for (const field of STYLE_FIELDS) record(field, "every section");

  return [...byLabel.values()].map(({ field, sections }) => ({
    id: `section-${field.key}-${field.label.toLowerCase().replace(/\W+/g, "-")}`,
    label: field.label,
    info: field.info,
    path: ["Customizer", sections.length > 2 ? `${sections.length} sections` : sections.join(", ")],
    href: "/admin/customize",
    keywords: sections,
  }));
}

/** Every findable thing, built once at module load. */
export const SETTINGS_INDEX: SettingEntry[] = [...TOOLS, ...themeEntries(), ...sectionEntries()];

/**
 * Words that mean the same thing to someone looking for a setting.
 *
 * Two kinds of miss motivated this. Spelling: the UI says "colour" and half the
 * world types "color", which is a spelling difference, not a failure to find
 * anything. And vocabulary: people search for the verb they intend — "upload",
 * "change", "delete" — where the label names the noun. Neither is the searcher
 * getting it wrong, so neither should return nothing.
 *
 * Each group is symmetric: matching any member matches them all.
 */
const SYNONYMS: string[][] = [
  ["colour", "color", "colours", "colors", "tint", "shade"],
  ["image", "picture", "photo", "img", "graphic", "artwork"],
  ["upload", "add", "change", "replace", "import", "swap", "new"],
  ["font", "fonts", "typeface", "type", "lettering"],
  ["menu", "menus", "nav", "navigation", "links"],
  ["delete", "remove", "trash", "bin", "deleted"],
  ["background", "bg", "backdrop"],
  ["button", "btn", "buttons", "cta"],
  ["text", "copy", "wording", "label", "labels", "words"],
  ["size", "height", "width", "big", "small", "scale"],
  ["logo", "wordmark", "brand mark", "branding"],
  ["redirect", "redirects", "404", "broken", "moved"],
  ["product", "products", "item", "items", "catalog", "catalogue"],
  ["category", "categories", "collection", "collections"],
  ["whatsapp", "chat", "message", "contact"],
];

/** Every word that should be treated as equivalent to this one, including it. */
function expand(term: string): string[] {
  const group = SYNONYMS.find((g) => g.includes(term));
  return group ?? [term];
}

/**
 * Ranked search over the index.
 *
 * Scored rather than filtered so that typing "logo" puts the logo controls
 * above a section that merely mentions logos in its help text. Matching runs
 * over label, breadcrumb, help text and keywords, in that order of weight —
 * people search for what a thing *does* as often as for its name.
 */
export function searchSettings(query: string, limit = 12): SettingEntry[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const terms = q.split(/\s+/);

  const scored: { entry: SettingEntry; score: number }[] = [];

  for (const entry of SETTINGS_INDEX) {
    const label = entry.label.toLowerCase();
    const path = entry.path.join(" ").toLowerCase();
    const info = entry.info.toLowerCase();
    const keywords = entry.keywords.join(" ").toLowerCase();

    let score = 0;
    let matchedAll = true;

    for (const term of terms) {
      // The word as typed scores full marks; a synonym scores slightly less, so
      // an exact label match still outranks a synonym match on another entry.
      let termScore = 0;
      for (const [n, word] of expand(term).entries()) {
        const penalty = n === 0 ? 0 : 5;
        let s = 0;
        if (label === word) s = 100;
        else if (label.startsWith(word)) s = 60;
        else if (label.includes(word)) s = 40;
        else if (keywords.includes(word)) s = 30;
        else if (path.includes(word)) s = 20;
        else if (info.includes(word)) s = 10;
        if (s > 0) termScore = Math.max(termScore, s - penalty);
      }

      if (termScore === 0) matchedAll = false;
      score += termScore;
    }

    if (matchedAll && score > 0) scored.push({ entry, score });
  }

  return scored
    .sort((a, b) => b.score - a.score || a.entry.label.localeCompare(b.entry.label))
    .slice(0, limit)
    .map((s) => s.entry);
}
