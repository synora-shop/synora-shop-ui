"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { LOOM_RULE, LoomButton, LoomCard } from "@/components/loom/primitives";
import { LoomPromises, LoomStepper, LoomTotals } from "@/components/loom/commerce";
import { FREE_DELIVERY_FROM, money } from "@/components/loom/money";
import { T } from "@/components/loom/type";
import { on, route, type LoomCartLine, type LoomContext } from "@/components/loom/contract";
import { tx } from "@/components/loom/text";

export type CartLine = LoomCartLine;

/**
 * The cart. Not in the kit — the collection page turned round: the lines take
 * the three-card width on the left (988) and the summary takes one card's
 * width, 322, on the right, 10 apart, so it lines up with every grid on the
 * site. Each line sits on the section rule: the gallery's 156 thumbnail at
 * radius 24, the name in Body 1 with colour and size under it, the stepper,
 * and the line's price in Body 2 — the card's own name-and-price pairing.
 *
 * The summary is the totals, a delivery note that says how far the cart is
 * from free delivery (a fact, not a nag: the number is the reason), the one
 * solid button, and the Service section's promises.
 *
 * Phone: lines stack with a 104 thumbnail, the summary below them.
 */
export function LoomCart({ data, ctx }: { data: Record<string, unknown>; ctx: LoomContext }) {
  const [lines, setLines] = useState<CartLine[]>(ctx.cart ?? []);
  const subtotal = lines.reduce((n, l) => n + l.price * l.qty, 0);
  const count = lines.reduce((n, l) => n + l.qty, 0);
  const short = FREE_DELIVERY_FROM - subtotal;

  const setQty = (id: string, qty: number) => setLines((ls) => ls.map((l) => (l.id === id ? { ...l, qty } : l)));
  const remove = (id: string) => setLines((ls) => ls.filter((l) => l.id !== id));

  return (
    <section className="px-[calc(16*var(--u))] pb-[calc(40*var(--u))] md:px-[calc(60*var(--u))] md:pb-[calc(120*var(--u))]">
      <header className="flex items-end justify-between gap-[calc(16*var(--u))] pb-[calc(24*var(--u))] md:pb-[calc(32*var(--u))]">
        <h1 data-m="cart-title" className={cn(T.h3, "text-[#121212] md:text-[calc(65*var(--u))] md:leading-[calc(65*var(--u))] md:tracking-[calc(-4*var(--u))]")}>
          {tx(ctx, "cart.heading")}
        </h1>
        <p className={cn(T.body6, "text-[#121212]/80 md:text-[max(calc(18*var(--u)),14.4px)]")} aria-live="polite">
          {count === 1 ? tx(ctx, "cart.itemCountOne") : tx(ctx, "cart.itemCount", { count })}
        </p>
      </header>

      {lines.length === 0 ? (
        <div className={cn("flex flex-col items-start gap-[calc(24*var(--u))] py-[calc(40*var(--u))]", LOOM_RULE)}>
          <p className={cn(T.h4, "text-[#121212]")}>{tx(ctx, "cart.emptyHeading")}</p>
          <LoomButton variant="outline" href={route(ctx, "collection")}>
            {tx(ctx, "cart.continueShopping")}
          </LoomButton>
        </div>
      ) : (
        <div className="flex flex-col gap-[calc(32*var(--u))] md:flex-row md:items-start md:gap-[calc(10*var(--u))]">
          <ul data-m="cart-lines" className="flex min-w-0 flex-1 flex-col md:pr-[calc(50*var(--u))]">
            {lines.map((l) => (
              <li key={l.id} className={cn("flex gap-[calc(16*var(--u))] py-[calc(24*var(--u))] md:gap-[calc(24*var(--u))]", LOOM_RULE)}>
                <LoomCard className="h-[calc(104*var(--u))] w-[calc(104*var(--u))] rounded-[calc(24*var(--u))] md:h-[calc(156*var(--u))] md:w-[calc(156*var(--u))] md:rounded-[calc(24*var(--u))]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={l.src} alt="" className="absolute inset-0 h-full w-full object-cover" />
                </LoomCard>
                <div className="flex min-w-0 flex-1 flex-col justify-between gap-[calc(12*var(--u))]">
                  <div className="flex items-start justify-between gap-[calc(16*var(--u))]">
                    <div className="min-w-0">
                      <a href={l.href} className={cn(T.body3, "block text-[#121212] md:text-[max(calc(24*var(--u)),19.2px)]")}>
                        {l.title}
                      </a>
                      <p className={cn(T.body6, "text-[#121212]/80")}>
                        {l.colour} · {l.size}
                      </p>
                    </div>
                    <p data-m="cart-line-price" className={cn(T.body5, "shrink-0 text-[#121212] md:text-[max(calc(20*var(--u)),16px)]")}>
                      {money(l.price * l.qty, ctx.currency)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-[calc(16*var(--u))]">
                    <LoomStepper ctx={ctx} value={l.qty} onChange={(n) => setQty(l.id, n)} label={`${tx(ctx, "product.quantity")} — ${l.title}`} className="w-[calc(120*var(--u))] md:w-[calc(140*var(--u))]" />
                    <button
                      type="button"
                      onClick={() => remove(l.id)}
                      className={cn(T.single2, "uppercase text-[#121212]/80 underline underline-offset-4")}
                    >
                      {tx(ctx, "cart.remove")}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <aside
            aria-label={tx(ctx, "cart.orderSummary")}
            data-m="cart-summary"
            className="flex flex-col gap-[calc(24*var(--u))] md:sticky md:top-[calc(24*var(--u))] md:w-[calc(322*var(--u))] md:shrink-0"
          >
            {/* Free is known here, so it is said; a charge depends on the
                address, so it waits for checkout — and the note says how far
                off free is, which is the reason the number matters. */}
            <LoomTotals ctx={ctx} subtotal={subtotal} delivery={short > 0 ? null : 0} />
            {short > 0 && on(data, "showFreeDeliveryNote") && (
              <p data-m="cart-note" className={cn(T.body6, "text-[#121212]/80")}>
                {tx(ctx, "cart.freeDeliveryNote", { amount: money(short, ctx.currency) })}
              </p>
            )}
            <LoomButton data-m="cart-checkout" href={route(ctx, "checkout")} className="w-full min-w-0">
              {tx(ctx, "cart.proceedToCheckout")}
            </LoomButton>
            {on(data, "showPromises") && <LoomPromises ctx={ctx} />}
          </aside>
        </div>
      )}
    </section>
  );
}
