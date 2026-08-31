// Working out which setting produced a given bit of the rendered page.
//
// This is what lets right-click say "Edit heading" rather than only "Edit this
// section". The obvious implementation would be to tag every element with a
// data attribute as it renders, which means touching every section view and
// remembering to do it in every one written afterwards — a rule that gets
// forgotten exactly once and then silently degrades.
//
// Instead we match backwards. A section's text *is* its settings: whatever a
// heading field holds is what the heading element renders. So given the text
// under the cursor and the section's data, the field can be identified by
// comparing them. Nothing to maintain, and a new section written next year is
// inspectable the day it ships.
//
// The trade-off is honest: matching is a strong guess, not proof. Two fields
// holding identical text are ambiguous, and a view that transforms its value
// (uppercasing, truncating) won't match. Both cases fall back to offering the
// section, which is what right-click did before this existed — so the feature
// can only ever add precision, never take it away.
//
// Client-safe: pure string handling, no Prisma, no DOM.

import type { SettingField } from "@/lib/section-schema";

/** Collapses whitespace and case so rendered text can be compared to a value. */
export function normalise(text: string): string {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

/** Field kinds whose value appears in the page as readable text. */
const TEXTUAL = new Set(["text", "textarea", "richtext"]);

export type FieldMatch = {
  key: string;
  label: string;
  /** "exact" when the text is the whole value; "partial" when it contains it. */
  confidence: "exact" | "partial";
};

/**
 * The setting most likely to have produced this text.
 *
 * Exact matches always beat partial ones, and among equals the longest value
 * wins: if a heading is "Sale" and a body paragraph merely mentions "Sale",
 * the longer field is the one the reader actually clicked into.
 */
export function matchField(
  text: string,
  data: Record<string, unknown>,
  fields: SettingField[]
): FieldMatch | null {
  const target = normalise(text);
  if (!target || target.length < 2) return null;

  let best: (FieldMatch & { length: number }) | null = null;

  for (const field of fields) {
    if (!TEXTUAL.has(field.kind)) continue;
    const raw = data[field.key];
    if (typeof raw !== "string") continue;
    const value = normalise(raw);
    if (!value || value.length < 2) continue;

    let confidence: FieldMatch["confidence"] | null = null;
    if (value === target) confidence = "exact";
    else if (target.includes(value) || value.includes(target)) confidence = "partial";
    if (!confidence) continue;

    const candidate = { key: field.key, label: field.label, confidence, length: value.length };
    if (!best) best = candidate;
    else if (best.confidence === "partial" && confidence === "exact") best = candidate;
    else if (best.confidence === confidence && candidate.length > best.length) best = candidate;
  }

  if (!best) return null;
  return { key: best.key, label: best.label, confidence: best.confidence };
}

// ---------------------------------------------------------------------------
// Global regions
// ---------------------------------------------------------------------------

/**
 * Parts of the page that belong to no section.
 *
 * Right-clicking the header should offer to edit the header, not report that
 * nothing is editable — but the header is theme-level, so the menu has to send
 * the user somewhere else entirely. Each region names the panel and setting
 * group that owns it.
 */
export const GLOBAL_REGIONS = {
  header: {
    label: "Header",
    description: "Logo, navigation and the colours behind them.",
    href: "/admin/theme#group-header-footer",
  },
  footer: {
    label: "Footer",
    description: "Footer columns, tagline and colours.",
    href: "/admin/theme#group-header-footer",
  },
  announcement: {
    label: "Announcement bar",
    description: "The strip above the header.",
    href: "/admin/settings",
  },
  logo: {
    label: "Logo",
    description: "The store's logo image, size and colour.",
    href: "/admin/theme#group-logo-favicon",
  },
  stickyButton: {
    label: "Floating buttons",
    description: "WhatsApp, chat and social buttons.",
    href: "/admin/buttons",
  },
} as const;

export type GlobalRegion = keyof typeof GLOBAL_REGIONS;

/**
 * Which global region an element sits in, given the ancestors' tag names and
 * markers. Returns null inside a section, where the section itself is the
 * better answer.
 */
export function regionFor(markers: string[]): GlobalRegion | null {
  // Ordered most-specific first: the logo is inside the header, and answering
  // "header" for a click on the logo would send the user to the wrong group.
  if (markers.includes("logo")) return "logo";
  if (markers.includes("sticky-button")) return "stickyButton";
  if (markers.includes("announcement")) return "announcement";
  if (markers.includes("header")) return "header";
  if (markers.includes("footer")) return "footer";
  return null;
}
