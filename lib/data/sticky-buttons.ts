import { cache } from "react";
import { currentShop } from "@/lib/data/shop";
import { cachedForShop } from "@/lib/data/cached";
import type { StickyButtonRow } from "@/lib/sticky-buttons";

export const getStickyButtons = cache(async (): Promise<StickyButtonRow[]> => {
  const shop = await currentShop();
  if (!shop) return [];
  return cachedForShop(shop.id, "buttons", (t) =>
    t.stickyButton.findMany({
    orderBy: { order: "asc" },
    select: {
      id: true,
      kind: true,
      label: true,
      value: true,
      message: true,
      scope: true,
      iconKind: true,
      iconValue: true,
      color: true,
      order: true,
      isVisible: true,
    },
    })
  );
});
