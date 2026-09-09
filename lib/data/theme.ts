import { cache } from "react";
import { headers } from "next/headers";
import { currentShop } from "@/lib/data/shop";
import { cachedForShop } from "@/lib/data/cached";
import { SHOP_PATH_HEADER } from "@/lib/shop-context";
import { THEMES, themeFor } from "@/lib/themes/registry";
import { resolveThemeLayout, type ThemeLayout } from "@/lib/theme-layout";
import { resolveThemeTokens, type ThemeTokens } from "@/lib/theme-tokens";

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
 * The active theme tokens for an environment.
 *
 * Three layers, weakest first: the platform's defaults, then the chosen
 * theme's, then whatever the merchant has changed in the customizer. So
 * picking a theme decides everything the merchant has not decided for
 * themselves, and never overrules a colour they set by hand.
 *
 * The middle layer was missing. `themeKey` was written by the Themes screen
 * and read by nobody, so activating Meridian changed the row and nothing else:
 * the screen said "only the layout changes" and then nothing changed at all.
 *
 * No row still means "unthemed" — resolveThemeTokens hands back the defaults,
 * which emit no CSS, so a store that has never opened either panel is
 * byte-for-byte what it was before any of this existed.
 */
export const getThemeTokens = cache(async (): Promise<ThemeTokens> => {
  const shop = await currentShop();
  if (!shop) return resolveThemeTokens(undefined);

  const [row, preview] = await Promise.all([
    // Keyed by business type, and read that way. It used to be findFirst({}),
    // which took whichever row came back first: a shop that had been a
    // restaurant and became a shop was served the restaurant theme's colours
    // on its storefront, because that was the row that existed.
    cachedForShop(shop.id, "theme", async (t) => {
      const found = await t.themeSettings.findFirst({
        where: { businessType: shop.businessType },
      });
      return found
        ? { themeKey: found.themeKey, tokens: found.tokens, layout: found.layout }
        : null;
    }),
    previewTheme(),
  ]);

  const key = preview ?? row?.themeKey;
  if (!key && !row) return resolveThemeTokens(undefined);

  // Merchant last: a value they set by hand outranks the theme it came from.
  return resolveThemeTokens({
    ...themeFor(key).tokens,
    ...((row?.tokens ?? {}) as Record<string, unknown>),
  });
});

/**
 * How this storefront is arranged, for the request being rendered.
 *
 * The same three layers as `getThemeTokens`, over the same row, and the same
 * `?__theme=` preview — so the Themes screen shows a merchant an unchosen
 * theme's *structure* as well as its colours, which is the whole point of a
 * theme being more than a palette.
 *
 * Its own function rather than a field on the tokens, because almost everything
 * that needs one needs only one: the header does not care about the card, and a
 * page rendering thirty cards should not carry the footer's variant into each.
 */
export const getThemeLayout = cache(async (): Promise<ThemeLayout> => {
  const shop = await currentShop();
  if (!shop) return resolveThemeLayout(undefined);

  const [row, preview] = await Promise.all([
    cachedForShop(shop.id, "theme", async (t) => {
      const found = await t.themeSettings.findFirst({
        where: { businessType: shop.businessType },
      });
      return found
        ? { themeKey: found.themeKey, tokens: found.tokens, layout: found.layout }
        : null;
    }),
    previewTheme(),
  ]);

  const key = preview ?? row?.themeKey;

  // A previewed theme shows its own arrangement, not the merchant's overrides
  // of a different theme. Choosing a header on Aurora should not silently
  // follow you into a preview of Atlas — the preview would then be of neither.
  const merchant = preview ? {} : ((row?.layout ?? {}) as Record<string, unknown>);

  return resolveThemeLayout({ ...themeFor(key).layout, ...merchant });
});
