"use client";

import type { KiteContext } from "@/components/kite/contract";
import { useKitCart } from "@/lib/themes/kit-actions";

/**
 * The bag's count — "Group 1000001751" in the file: a 16 circle in #9c240c
 * over the bag's top right (10 in, 8 up), the number in the ink. The file's
 * number is a drawn glyph; here it is the cart's, set at 10. On a real shop
 * the platform's cart; in the reference build, the demo cart. Not shown when
 * the bag is empty, and desktop only — the phone screens draw none.
 */
export function KiteBagCount({ ctx }: { ctx: KiteContext }) {
  const cart = useKitCart();
  const n = ctx.live ? (cart.ready ? cart.lines.reduce((s, l) => s + l.qty, 0) : 0) : (ctx.cart ?? []).reduce((s, l) => s + l.qty, 0);
  if (!n) return null;
  return (
    <span
      data-exact
      aria-label={`${n} in the bag`}
      className="absolute left-[calc(10*var(--u))] top-[calc(-8*var(--u))] hidden h-[calc(16*var(--u))] w-[calc(16*var(--u))] items-center justify-center rounded-full bg-[#9c240c] text-[calc(10*var(--u))] leading-none text-[#f4f3f1] md:flex"
    >
      {n > 9 ? "9+" : n}
    </span>
  );
}
