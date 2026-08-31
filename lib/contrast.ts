// WCAG contrast maths — the single rule behind every colour setting.
//
// Two of the requested behaviours pulled in opposite directions: header and
// footer colours were meant to pick their text colour automatically, while the
// page background was meant to offer a restricted list to choose from. Rather
// than shipping two different behaviours for the same problem, everything uses
// one rule:
//
//   1. Suggest the most readable text colour for whatever background is picked.
//   2. Let that be overridden, but only from options that actually pass.
//   3. Refuse to save anything below WCAG AA.
//
// AA is 4.5:1 for body text and 3:1 for large text. AAA (7:1) is reported but
// never required — insisting on it would rule out most brand palettes,
// including this store's own maroon on canvas.
//
// Client-safe: pure maths, no Prisma, no next/headers.

import { hexToHsl, hslToHex } from "@/lib/color";

export const AA_NORMAL = 4.5;
export const AA_LARGE = 3;
export const AAA_NORMAL = 7;

export type ContrastLevel = "AAA" | "AA" | "AA Large" | "Fail";

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  const int = parseInt(match[1], 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

/** WCAG relative luminance: sRGB channels linearised, then weighted. */
export function relativeLuminance(hex: string): number {
  const rgb = parseHex(hex);
  if (!rgb) return 0;
  const channel = (value: number) => {
    const c = value / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

/** Contrast ratio between two colours, 1 (identical) to 21 (black on white). */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

export function contrastLevel(ratio: number): ContrastLevel {
  if (ratio >= AAA_NORMAL) return "AAA";
  if (ratio >= AA_NORMAL) return "AA";
  if (ratio >= AA_LARGE) return "AA Large";
  return "Fail";
}

/** One decimal place, the way contrast ratios are conventionally written. */
export function formatRatio(ratio: number): string {
  return `${ratio.toFixed(1)}:1`;
}

export function passesAA(background: string, text: string): boolean {
  return contrastRatio(background, text) >= AA_NORMAL;
}

/**
 * The most readable of a set of candidate text colours for a background.
 *
 * Used to fill in "auto" text colours, and to build the restricted list an
 * override can be chosen from.
 */
export function bestTextColor(background: string, candidates: string[]): string {
  let best = candidates[0] ?? "#000000";
  let bestRatio = -1;
  for (const candidate of candidates) {
    const ratio = contrastRatio(background, candidate);
    if (ratio > bestRatio) {
      bestRatio = ratio;
      best = candidate;
    }
  }
  return best;
}

/** The text colours offered anywhere a background is chosen. */
export const TEXT_CANDIDATES = [
  "#ffffff",
  "#f8f5f1", // brand canvas
  "#221a1a", // brand ink
  "#000000",
];

/** Candidates that actually pass AA on this background, best first. */
export function readableTextOptions(background: string): { color: string; ratio: number }[] {
  return TEXT_CANDIDATES.map((color) => ({ color, ratio: contrastRatio(background, color) }))
    .filter((option) => option.ratio >= AA_NORMAL)
    .sort((a, b) => b.ratio - a.ratio);
}

/** Auto text colour for a background — the readable extreme, light or dark. */
export function autoTextColor(background: string): string {
  return bestTextColor(background, ["#ffffff", "#221a1a"]);
}

/**
 * Nudges a colour's lightness until it clears `minRatio` against `against`.
 *
 * This is what makes the admin re-skin safe to actually work inside: the brand
 * colour still drives the panel, but a colour that would leave text unreadable
 * gets walked toward whichever end restores contrast, rather than being
 * rejected or applied as-is.
 *
 * Returns the original colour if it already passes, or if no amount of
 * lightening or darkening gets there (a mid-grey against mid-grey).
 */
export function clampForContrast(color: string, against: string, minRatio = AA_NORMAL): string {
  if (contrastRatio(color, against) >= minRatio) return color;

  const hsl = hexToHsl(color);
  if (!hsl) return color;

  const targetIsDark = relativeLuminance(against) < 0.5;
  // Move away from the thing we need contrast with: lighter against dark, darker against light.
  const step = targetIsDark ? 0.02 : -0.02;

  let lightness = hsl.l;
  for (let i = 0; i < 50; i++) {
    lightness = Math.min(1, Math.max(0, lightness + step));
    const candidate = hslToHex({ ...hsl, l: lightness });
    if (contrastRatio(candidate, against) >= minRatio) return candidate;
    if (lightness === 0 || lightness === 1) break;
  }
  return color;
}

/** A very light tint of a colour — the ground an admin panel can safely sit on. */
export function tint(color: string, lightness: number): string {
  const hsl = hexToHsl(color);
  if (!hsl) return color;
  // Saturation pulled right down as well: a light tint at full saturation reads
  // as a colour wash rather than a neutral surface.
  return hslToHex({ h: hsl.h, s: Math.min(hsl.s, 0.18), l: lightness });
}
