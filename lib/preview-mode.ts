/**
 * Live preview inside the customizer.
 *
 * The customizer shows the storefront in an iframe and streams unsaved edits
 * into it over postMessage, which needs a client component holding the section
 * list in state. A customer gets none of that — they get server-rendered HTML
 * and no preview JavaScript at all.
 *
 * So something has to say which of the two a request is. It used to be the
 * path: the whole store had a second copy at /test, and that copy was always in
 * preview mode. That is gone, and the signal is now a query parameter the
 * customizer puts on its own iframe and the page reads straight off its own
 * searchParams — no header, no middleware, nothing to keep in sync.
 *
 * Nothing is gated on it. Preview renders the same sections from the same
 * database rows as the live page; the only difference is that it also listens
 * for edits that only the customizer sends. Someone who types the parameter
 * themselves sees their own storefront, slightly heavier.
 */

/** Query parameter the customizer's iframe carries. */
export const PREVIEW_PARAM = "__preview";

/** The iframe URL for a storefront path. */
export function previewUrl(path: string): string {
  const base = path || "/";
  return `${base}${base.includes("?") ? "&" : "?"}${PREVIEW_PARAM}=1`;
}

/** Whether a page's searchParams ask for preview mode. */
export function isPreview(searchParams: Record<string, string | string[] | undefined>): boolean {
  return searchParams[PREVIEW_PARAM] !== undefined;
}
