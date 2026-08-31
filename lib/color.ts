// Tiny, dependency-free hex/HSL conversion — just enough to derive a full
// tint/shade ramp from a single admin-picked accent color (Global Edits >
// Branding), so retinting the site is one color picker instead of six.

type HSL = { h: number; s: number; l: number };

export function hexToHsl(hex: string): HSL | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const int = parseInt(m[1], 16);
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
  else if (max === g) h = ((b - r) / d + 2) * 60;
  else h = ((r - g) / d + 4) * 60;
  return { h, s, l };
}

export function hslToHex({ h, s, l }: HSL): string {
  h = ((h % 360) + 360) % 360;
  s = Math.min(1, Math.max(0, s));
  l = Math.min(1, Math.max(0, l));
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Full brand ramp derived from a single accent color, matching the shape of
 * the hand-picked --color-brand-* scale in app/globals.css so a Global Edit
 * accent color re-tints every button/link consistently, not just the base. */
export function brandRamp(accentHex: string) {
  const hsl = hexToHsl(accentHex);
  if (!hsl) return null;
  const at = (l: number, s?: number) => hslToHex({ h: hsl.h, s: s ?? hsl.s, l });
  return {
    50: at(0.96, Math.min(1, hsl.s * 0.6)),
    100: at(0.9, Math.min(1, hsl.s * 0.6)),
    300: at(0.68),
    500: accentHex,
    600: at(Math.max(0, hsl.l - 0.06)),
    700: at(Math.max(0, hsl.l - 0.12)),
  };
}
