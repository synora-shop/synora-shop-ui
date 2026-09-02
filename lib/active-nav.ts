/**
 * Which navigation link the current page belongs to.
 *
 * The obvious rule — "this link is active if the path equals it or starts with
 * it" — marks several links at once, because one href is often a prefix of
 * another. /admin is a prefix of every page in the panel, so Home lit up on all
 * of them, and /admin/settings lit up too: two highlighted links, and two
 * elements claiming aria-current="page", which is invalid and tells a screen
 * reader the wrong thing.
 *
 * The rule that works is the longest match. Every href that the path equals or
 * sits under is a candidate, and the most specific one wins — so /admin/settings
 * beats /admin, and /admin only wins when the path really is /admin.
 *
 * Client-safe: pure, no imports.
 */

/** Whether a path sits at or under an href. */
function covers(href: string, pathname: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * The one href that should read as active, or null when none applies.
 *
 * Pass every href the navigation offers; the winner is the longest that covers
 * the current path. Comparing against this by equality is what keeps exactly
 * one link lit.
 */
export function activeHref(hrefs: readonly string[], pathname: string): string | null {
  let best: string | null = null;
  for (const href of hrefs) {
    if (!covers(href, pathname)) continue;
    if (best === null || href.length > best.length) best = href;
  }
  return best;
}
