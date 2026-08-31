import { cache } from "react";
import { currentShop } from "@/lib/data/shop";
import { cachedForShop } from "@/lib/data/cached";
import type { CustomFont } from "@/lib/theme-tokens";

/**
 * Every uploaded font. Shared across environments — the asset library is not
 * per-environment, only which font a theme selects is.
 */
export const getFontAssets = cache(async (): Promise<CustomFont[]> => {
  const shop = await currentShop();
  if (!shop) return [];
  return cachedForShop(shop.id, "fonts", (t) =>
    t.fontAsset.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, url: true, format: true },
    })
  );
});
