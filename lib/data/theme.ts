import { cache } from "react";
import { headers } from "next/headers";
import { currentShop } from "@/lib/data/shop";
import { cachedForShop } from "@/lib/data/cached";
import { SHOP_PATH_HEADER } from "@/lib/shop-context";
import { THEMES, themeFor } from "@/lib/themes/registry";
import { resolveThemeLayout, type ThemeLayout } from "@/lib/theme-layout";
import { resolveThemeTokens, THEME_TOKEN_DEFAULTS, type ThemeTokens } from "@/lib/theme-tokens";
import { getStoreSettings } from "@/lib/data/settings";

/**
 * A theme to render this one request in, instead of the shop's own.
 *
 * `?__theme=meridian` is how the Themes screen shows a merchant what an
 * *unchosen* theme would look like — on their own products, in a still and in
 * the "View full" tab — without activating it first. The parameter was being
 * put in those links long before anything read it, so both previews showed the
 * theme already in use and the two cards were indistinguishable.
 *
 * Nothing is stored and nothing is shared: it lives in one request's query
 * string, an unknown key is ignored, and reading a header keeps the render
 * dynamic, so no cached page can be left wearing somebody's preview.
 */
async function previewTheme(): Promise<string | null> {
  const path = (await headers()).get(SHOP_PATH_HEADER);
  const query = path?.indexOf("?") ?? -1;
  if (!path || query === -1) return null;
  const key = new URLSearchParams(path.slice(query + 1)).get("__theme");
  return key && key in THEMES ? key : null;
}

/**
 * Everything about this shop's themes, in one cached read.
 *
 * One read, deliberately, and this is a trap worth naming. `cachedForShop` keys
 * its cache on the shop and the *kind* — `["theme", shopId]` — and nothing
 * else. Two calls with that key and different callbacks are the same cache
 * entry: whichever runs first wins, and the second is handed a value of the
 * wrong shape. It was harmless while the tokens and the layout used identical
 * callbacks; the moment one of them asked a different question, the storefront
 * threw `rows.find is not a function` on every request.
 *
 * So there is one callback, it returns both halves, and the two public
 * functions below derive from it.
 */
const themeState = cache(async (shopId: string, businessType: string) => {
  return cachedForShop(shopId, "theme", async (t) => {
    const [settings, installed] = await Promise.all([
      t.themeSettings.findFirst({
        where: { businessType: businessType as never },
        select: { themeKey: true },
      }),
      t.installedTheme.findMany({ select: { themeKey: true, tokens: true, layout: true } }),
    ]);
    return { settings, installed };
  });
});

/**
 * Which theme this request renders, and what the shop changed about it.
 *
 * A preview overrides the live choice for this one request. Nothing is stored,
 * so no cached page can be left wearing somebody's preview — and because the
 * edits are looked up by the *resolved* key, previewing Atlas shows Atlas's own
 * colours rather than the ones set on Aurora.
 */
async function themeForRequest(shopId: string, businessType: string) {
  const [{ settings, installed }, preview] = await Promise.all([
    themeState(shopId, businessType),
    previewTheme(),
  ]);
  const key = preview ?? settings?.themeKey ?? null;
  const edits = key ? (installed.find((r) => r.themeKey === key) ?? null) : null;
  return { key, edits };
}

/**
 * The active theme tokens for an environment.
 *
 * Three layers, weakest first: the platform's defaults, then the chosen
 * theme's, then whatever the merchant has changed *on that theme*. So picking a
 * theme decides everything the merchant has not decided for themselves, and
 * never overrules a colour they set by hand.
 *
 * The middle layer was missing once: `themeKey` was written by the Themes
 * screen and read by nobody, so activating a theme changed the row and nothing
 * else. The third layer used to be per shop rather than per theme, which is why
 * an unpublished theme could not be edited without changing the live one.
 *
 * No row still means "unthemed" — resolveThemeTokens hands back the defaults,
 * which emit no CSS, so a store that has never opened either panel is
 * byte-for-byte what it was before any of this existed.
 */
export const getThemeTokens = cache(async (): Promise<ThemeTokens> => {
  const shop = await currentShop();
  if (!shop) return resolveThemeTokens(undefined);

  const { key, edits } = await themeForRequest(shop.id, shop.businessType);
  if (!key) return resolveThemeTokens(undefined);

  const tokens = resolveThemeTokens({
    ...themeFor(key).tokens,
    ...((edits?.tokens ?? {}) as Record<string, unknown>),
  });

  return withLegacyAccent(tokens);
});

/**
 * The accent a merchant set on Settings, before there was only one place to set
 * it.
 *
 * There were two accent colours: this theme token, and `accentColor` on the
 * shop's settings, edited by a picker on Settings → General. Both meant "the
 * shop's colour", both defaulted to the same value, and which one a merchant
 * actually got depended on something they had no way to know — the storefront
 * emitted the settings one from its own <style>, and the theme's overrode it,
 * but *only once any theme token differed from its default*. So the Settings
 * picker worked on an untouched store and silently stopped the first time the
 * merchant changed a font in the customizer.
 *
 * The picker is gone and the theme's accent is the only one. This is what keeps
 * that from repainting a live shop: where the theme's accent has never been
 * changed and the old settings value has, the old value is what the shop is
 * wearing today, so it is handed back as the theme's accent. Nothing changes
 * colour, and the moment the merchant touches accent in the customizer their
 * choice is written to the theme and this stops applying — the value migrates
 * itself, at the only moment it is safe to.
 *
 * The column stays. Dropping it would take a merchant's colour with it if this
 * ever had to be rolled back, and it costs a string per shop to keep.
 */
async function withLegacyAccent(tokens: ThemeTokens): Promise<ThemeTokens> {
  // Only when the theme itself has no opinion. A theme accent that has been
  // set — by the theme's own design or by the merchant — always wins.
  if (tokens.accent !== THEME_TOKEN_DEFAULTS.accent) return tokens;

  const legacy = (await getStoreSettings())?.accentColor;
  if (!legacy || legacy === THEME_TOKEN_DEFAULTS.accent) return tokens;

  return { ...tokens, accent: legacy };
}

/**
 * How this storefront is arranged, for the request being rendered.
 *
 * The same three layers over the same theme, so previewing one shows its own
 * arrangement *and* its own edits — which is what an unpublished theme being
 * editable means in practice.
 *
 * Its own function rather than a field on the tokens, because almost everything
 * that needs one needs only one: the header does not care about the card, and a
 * page rendering thirty cards should not carry the footer's variant into each.
 */
export const getThemeLayout = cache(async (): Promise<ThemeLayout> => {
  const shop = await currentShop();
  if (!shop) return resolveThemeLayout(undefined);

  const { key, edits } = await themeForRequest(shop.id, shop.businessType);
  if (!key) return resolveThemeLayout(undefined);

  return resolveThemeLayout({
    ...themeFor(key).layout,
    ...((edits?.layout ?? {}) as Record<string, unknown>),
  });
});
