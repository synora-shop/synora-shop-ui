/**
 * Kite's type, as the file sets it.
 *
 * Every text in the file is one of six families at a size, with Figma's Auto
 * line height and no tracking — so a style here is a family and a size (one
 * for the phone, one for the desktop), and the line height comes from the
 * table below: Figma's own figures, read out of each text's laid-out lines,
 * kept because the stand-in fonts' natural line heights are not Apple's.
 *
 * Sizes are design pixels, scaled by `--u`. Up to 24px a size never drops
 * under 80% of itself nor under 11px — the same floor Loom keeps — so a
 * desktop design shown on a small laptop stays readable.
 */
export type KiteFamily = "sans" | "serif" | "khand" | "script" | "poppins" | "acme";

/** Figma's line height for a family at a size, in design pixels. */
const LINE: Record<KiteFamily, { ratio: number; at?: Record<number, number> }> = {
  sans: { ratio: 1.1932, at: { 8: 10, 12: 14.32, 14: 17, 15: 18, 16: 19.09, 20: 24, 32: 38.19 } },
  serif: { ratio: 1.5 },
  khand: { ratio: 1.531, at: { 20: 31, 24: 37, 32: 49, 128: 196 } },
  script: { ratio: 2.1082, at: { 16: 34, 32: 67.45, 40: 84.32, 48: 101.18, 64: 135, 96: 202.36 } },
  poppins: { ratio: 1.5 },
  acme: { ratio: 1.2708 },
};

export const lineHeight = (f: KiteFamily, size: number) => LINE[f].at?.[size] ?? +(size * LINE[f].ratio).toFixed(2);
const floor = (size: number) => (size <= 24 ? Math.max(11, size * 0.8) : 0);

/**
 * Props for a text element: `<p {...kt("sans", 16, 20)}>`. The second size is
 * the desktop's; one size means both. Merge a className with `cn(kt(...).className, …)`.
 */
export function kt(f: KiteFamily, phone: number, desktop: number = phone, { exact = false }: { exact?: boolean } = {}) {
  return {
    className: `kt kt-${f}`,
    style: {
      "--sm": phone,
      "--sd": desktop,
      "--lm": lineHeight(f, phone),
      "--ld": lineHeight(f, desktop),
      // `exact`: no floor — for words the file prints small on purpose, as
      // part of a photograph, where growing them would change the picture.
      "--fm": `${exact ? 0 : floor(phone)}px`,
      "--fd": `${exact ? 0 : floor(desktop)}px`,
    } as React.CSSProperties,
  };
}

/** The rules behind kt(), written once into the frame. */
export const KITE_TYPE_CSS = `
.kt{--s:var(--sm);--l:var(--lm);--f:var(--fm);font-size:max(calc(var(--s)*var(--u)),var(--f));line-height:max(calc(var(--l)*var(--u)),calc(var(--f)*var(--l)/var(--s)));letter-spacing:0}
@media (min-width:768px){.kt{--s:var(--sd);--l:var(--ld);--f:var(--fd)}}
.kt-sans{font-family:var(--kite-sans);font-weight:300}
.kt-serif{font-family:var(--kite-serif);font-weight:400}
.kt-khand{font-family:var(--kite-khand);font-weight:300}
.kt-script{font-family:var(--kite-script);font-weight:400}
.kt-poppins{font-family:var(--kite-poppins);font-weight:400}
.kt-acme{font-family:var(--kite-acme);font-weight:400}
`;

/** The file's two colours. */
export const KC = { ground: "#040404", ink: "#f4f3f1" } as const;
