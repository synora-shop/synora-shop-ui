"use client";

import { cn } from "@/lib/utils";
import { route, str, type KiteContext } from "@/components/kite/contract";
import { kt } from "@/components/kite/type";
import { kiteMoney } from "@/components/kite/money";
import { useWishlist } from "@/components/loom/wishlist";
import { KitePieceCard } from "@/components/kite/piece-card";
import { KiteButton, KiteHeading, KitePage, KiteTextLink, KiteTitle } from "@/components/kite/ui";

/**
 * Saved items — what "Add to favourites" keeps, in this browser (the same
 * list every theme on the platform keeps; see components/loom/wishlist.tsx).
 * Not a page in the file, whose account draws saved pieces as its "Saved
 * items" tab: the same card, 292 wide, here four to a row with REMOVE under
 * each. Empty, it says so and offers the way back.
 */
export function KiteWishlist({ data, ctx }: { data: Record<string, unknown>; ctx: KiteContext }) {
  const list = useWishlist(ctx.wishlist ?? []);
  const t = kt("sans", 14, 20);
  return (
    <KitePage k="wishlist">
      <KiteTitle className="pb-[calc(32*var(--u))]">{str(data, "heading")}</KiteTitle>
      {list.items.length === 0 ? (
        <div className="flex flex-col items-start gap-[calc(16*var(--u))] py-[calc(32*var(--u))] shadow-[inset_0_1px_0_rgba(244,243,241,0.5)]">
          <KiteHeading as="p">{str(data, "emptyHeading")}</KiteHeading>
          <p {...t} className={cn(t.className)}>{str(data, "emptyText")}</p>
          <KiteButton variant="outline" href={route(ctx, "collection")} className="mt-[calc(8*var(--u))]">{str(data, "emptyButtonLabel")}</KiteButton>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-[calc(48*var(--u))] md:grid-cols-4 md:gap-x-[calc(32*var(--u))] md:gap-y-[calc(64*var(--u))]">
          {list.items.map((p) => (
            <li key={p.id} className="flex flex-col gap-[calc(16*var(--u))]">
              <KitePieceCard product={{ ...p, colours: [], sizes: [], age: 0, priceText: kiteMoney(p.price, ctx.currency) }} photoHeight={490} addLabel={str(data, "addLabel")} />
              <KiteTextLink onClick={() => list.remove(p.id)} className="self-start">{str(data, "removeLabel")}</KiteTextLink>
            </li>
          ))}
        </ul>
      )}
    </KitePage>
  );
}
