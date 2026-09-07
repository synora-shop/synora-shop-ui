/**
 * A shop's marks: its logos and its favicon.
 *
 * These belong to the business, not to the storefront it happens to be
 * wearing. That is the change. They used to live in the theme's tokens, which
 * are stored per business type, so a merchant who switched from a shop to a
 * restaurant and back found their logo gone twice — the same company, the same
 * mark, and two empty header slots because the *storefront* had changed.
 * Identity does not change when the shopfront does.
 *
 * They are also the reason Home exists. A theme reads these; it does not own
 * them, and nothing else in the panel may set them. One place to change a
 * logo, and every screen and every theme reads that one place.
 *
 * Four slots, on two axes:
 *
 *                     light background      dark background
 *   wide (desktop)    logoUrl               logoDarkUrl
 *   compact (phone)   logoCompactUrl        logoCompactDarkUrl
 *
 * Only the first is ever needed. The other three are overrides, and every
 * lookup falls back along a defined path until it finds something — so a theme
 * may ask for any combination and is never handed nothing. See pickLogo.
 *
 * Client-safe: plain values and pure functions, no Prisma, no next/headers.
 */

export type BrandMarks = {
  /** The wordmark. Used everywhere unless something more specific is set. */
  logoUrl: string;
  /** For a dark header, footer or hero, where the main mark would disappear. */
  logoDarkUrl: string;
  /** A monogram or icon, for widths where a wordmark would be unreadable. */
  logoCompactUrl: string;
  /** That monogram, on a dark background. */
  logoCompactDarkUrl: string;
  /** The browser tab icon. See FAVICON_FORMATS — not every image works here. */
  faviconUrl: string;
};

/** Mirrors the @default(...) on each column in StoreSettings. */
export const BRAND_MARKS_DEFAULTS: BrandMarks = {
  logoUrl: "",
  logoDarkUrl: "",
  logoCompactUrl: "",
  logoCompactDarkUrl: "",
  faviconUrl: "",
};

/** Reads a settings row into the shape this screen and the storefront use. */
export function toBrandMarks(row: Record<string, unknown>): BrandMarks {
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  return {
    logoUrl: str(row.logoUrl),
    logoDarkUrl: str(row.logoDarkUrl),
    logoCompactUrl: str(row.logoCompactUrl),
    logoCompactDarkUrl: str(row.logoCompactDarkUrl),
    faviconUrl: str(row.faviconUrl),
  };
}

export type LogoRequest = {
  /** The mark will sit on a dark background. */
  dark?: boolean;
  /** There is not room for a wordmark. */
  compact?: boolean;
};

/**
 * The best mark for a place, given what the merchant has actually uploaded.
 *
 * The fallback order is the whole point, and it is chosen rather than obvious.
 * Asked for a compact mark on a dark background, it prefers, in order:
 *
 *   1. the compact dark mark — exactly what was asked for
 *   2. the compact mark — right shape, wrong colour
 *   3. the dark mark — right colour, wrong shape
 *   4. the main mark
 *
 * Shape beats colour at step 2 because a wordmark that does not fit is
 * illegible, while a mark in the wrong tone is merely wrong — and most logos
 * are legible on both. Reverse those two and a phone with a dark header shows
 * a wide wordmark crushed to nothing, which is worse than showing a dark
 * monogram slightly low in contrast.
 *
 * Returns "" when nothing is uploaded at all, which callers read as "use the
 * store's name instead". A logo slot is never filled with the platform's own
 * artwork: a merchant's customers should not see our mark on their shop.
 */
export function pickLogo(marks: BrandMarks, request: LogoRequest = {}): string {
  const { dark = false, compact = false } = request;

  const order: (keyof BrandMarks)[] =
    compact && dark
      ? ["logoCompactDarkUrl", "logoCompactUrl", "logoDarkUrl", "logoUrl"]
      : compact
        ? ["logoCompactUrl", "logoUrl"]
        : dark
          ? ["logoDarkUrl", "logoUrl"]
          : ["logoUrl"];

  for (const key of order) {
    const value = marks[key]?.trim();
    if (value) return value;
  }
  return "";
}

/** Whether this shop has any mark at all, for screens that offer to add one. */
export function hasAnyLogo(marks: BrandMarks): boolean {
  return pickLogo(marks) !== "" || pickLogo(marks, { compact: true }) !== "";
}

/* -------------------------------------------------------------------------- */
/* The favicon                                                                */
/* -------------------------------------------------------------------------- */

/**
 * What a browser will actually put on a tab.
 *
 * Narrower than the image field's `image/*`, and deliberately so. A favicon is
 * not decoration on a page — it is fetched by the browser chrome, which
 * supports far less than the page does. WebP and AVIF are the traps: both
 * render perfectly in the upload preview, and Safari draws neither on a tab,
 * so the merchant sees their icon in the panel and a blank square in their own
 * browser and has no way to work out why.
 *
 * SVG is listed first because it is the only one that stays sharp at every
 * size a browser asks for.
 */
export const FAVICON_FORMATS = [".svg", ".png", ".ico"] as const;

/** For the file picker's `accept`, so the wrong file is hard to choose. */
export const FAVICON_ACCEPT = "image/svg+xml,image/png,image/x-icon,image/vnd.microsoft.icon,.ico";

/** Said on the screen, so the rule is visible before the upload fails. */
export const FAVICON_FORMATS_LABEL = "SVG, PNG or ICO";

/**
 * Why this file cannot be a favicon, or null if it can.
 *
 * Judged on the extension, which is what the browser goes on too — it asks for
 * the URL in the icon link and trusts what comes back. A data: URL is refused
 * outright rather than sniffed: nothing in this product produces one, and a
 * hand-edited value is the only way to get here with it.
 */
export function faviconProblem(url: string): string | null {
  const value = url.trim();
  if (!value) return null;

  let path: string;
  try {
    // Relative uploads are the normal case; the base is only there so a
    // relative URL parses at all, and is never used.
    path = new URL(value, "https://example.invalid").pathname.toLowerCase();
  } catch {
    return "That doesn't look like an image address.";
  }

  if (!FAVICON_FORMATS.some((ext) => path.endsWith(ext))) {
    return `A favicon has to be ${FAVICON_FORMATS_LABEL}. Other formats upload fine and then don't appear on the tab.`;
  }
  return null;
}

/**
 * The MIME type to declare for a favicon URL.
 *
 * Next puts this in the `<link rel="icon" type="...">`. Getting it wrong is not
 * fatal — browsers sniff — but an ICO announced as PNG is one more thing for
 * someone to find while debugging a blank tab.
 */
export function faviconType(url: string): string | undefined {
  const path = url.trim().toLowerCase();
  if (path.endsWith(".svg")) return "image/svg+xml";
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".ico")) return "image/x-icon";
  return undefined;
}
