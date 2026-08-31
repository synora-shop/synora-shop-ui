import { cache } from "react";
import { currentShop } from "@/lib/data/shop";
import { cachedForShop } from "@/lib/data/cached";
import { resolveThemeTokens, type ThemeTokens } from "@/lib/theme-tokens";

/**
 * The active theme tokens for an environment.
 *
 * No row means "unthemed" — resolveThemeTokens hands back the defaults, which
 * emit no CSS at all, so a store that has never opened the Theme panel is
 * byte-for-byte what it was before this feature existed.
 */
export const getThemeTokens = cache(async (): Promise<ThemeTokens> => {
  const shop = await currentShop();
  if (!shop) return resolveThemeTokens(undefined);
  const tokens = await cachedForShop(shop.id, "theme", async (t) => {
    const row = await t.themeSettings.findFirst({});
    return row?.tokens ?? null;
  });
  return resolveThemeTokens(tokens ?? undefined);
});
