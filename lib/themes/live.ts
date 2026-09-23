/**
 * Which copy of a theme a shop is actually wearing.
 *
 * `ThemeSettings.installedThemeId` names it. That column was added on 22
 * September, when a shop became able to hold the same theme more than once and
 * the theme key stopped being able to say which design was live — and every
 * reader was switched to it in the same change.
 *
 * **That was the bug.** A null in that column does not mean "this shop has no
 * copy". It means nobody has recorded which copy, which is true of every shop
 * whose ThemeSettings row predates the migration, every shop the migration's
 * backfill could not match, and every shop with no ThemeSettings row for its
 * current business type at all. Reading it as "no copy" gave those shops the
 * theme's own defaults with their own edits dropped, and made the customizer
 * refuse to save: it had nothing to write to.
 *
 * So the id is preferred and the theme key is the fallback, which is exactly
 * what every reader did before the column existed. A shop cannot end up worse
 * off than it was, whatever is or is not in that column.
 *
 * Client-safe: pure array work, no Prisma.
 */
export type ThemeCopyRef = { id: string; themeKey: string };
export type LiveThemeSettings = { themeKey: string; installedThemeId: string | null } | null;

export function liveCopyOf<T extends ThemeCopyRef>(
  copies: readonly T[],
  settings: LiveThemeSettings
): T | null {
  if (!settings) return null;

  // Named outright. The only answer when a shop holds two copies of one theme,
  // because both of them match the key.
  if (settings.installedThemeId) {
    const named = copies.find((c) => c.id === settings.installedThemeId);
    if (named) return named;
    // A dangling id — the copy was deleted out from under the row. Fall
    // through rather than return nothing: the shop is still wearing that
    // theme, and one of its other copies is a better answer than none.
  }

  // The oldest copy of the theme the storefront is rendering. Oldest rather
  // than any, so this is stable between requests and matches what the
  // migration's backfill chose.
  return copies.find((c) => c.themeKey === settings.themeKey) ?? null;
}
