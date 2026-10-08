"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { on, route, type KiteContext } from "@/components/kite/contract";
import { kt } from "@/components/kite/type";
import { kiteMoney } from "@/components/kite/money";
import { ktx } from "@/components/kite/text";
import { useKitCart } from "@/lib/themes/kit-actions";
import { KITE_RULE, KiteButton, KiteHeading, KiteLine, KitePage, KiteTextLink, KiteTitle } from "@/components/kite/ui";
import type { KitCartLine } from "@/lib/themes/kit";

/**
 * The bag — not in the file; Kite's own parts (decided 8 October). The
 * header's glyph is a bag, so the page is one.
 *
 * Desktop: the lines at the left, 1248 wide; at the right, 384 (the account's
 * field width) beside them, the summary. Each line on the half-ink rule: the
 * photograph 160x200, the name and price in SF Pro Light 20 capitals, colour
 * and size at 80%, the count between − and +, REMOVE underlined at half ink.
 * Phone: the lines stack, the summary under them.
 */
export function KiteCart({ data, ctx }: { data: Record<string, unknown>; ctx: KiteContext }) {
  // A real shop's bag is the platform's; the reference build plays with its sample lines.
  const real = useKitCart();
  const [demo, setDemo] = useState<KitCartLine[]>(ctx.cart ?? []);
  const live = !!ctx.live && !(real.ready && real.lines.length === 0 && !!ctx.cart?.length);
  const lines = live ? real.lines.map((l) => ({ ...l, href: (ctx.base ?? "") + l.href })) : demo;
  const ready = live ? real.ready : true;
  const setQty = (id: string, qty: number) => (live ? real.setQty(id, qty) : setDemo((ls) => ls.map((l) => (l.id === id ? { ...l, qty } : l))));
  const remove = (id: string) => (live ? real.remove(id) : setDemo((ls) => ls.filter((l) => l.id !== id)));

  const subtotal = lines.reduce((n, l) => n + l.price * l.qty, 0);
  const count = lines.reduce((n, l) => n + l.qty, 0);
  const threshold = ctx.checkout ? ctx.checkout.freeShippingFrom : null;
  const short = threshold === null ? 0 : threshold - subtotal;
  const delivery = ctx.checkout ? (short > 0 || threshold === null ? ctx.checkout.shippingFee : 0) : null;
  const t20 = kt("sans", 16, 20);
  const t16 = kt("sans", 14, 16);

  return (
    <KitePage k="cart">
      <header className="flex items-end justify-between gap-[calc(16*var(--u))] pb-[calc(32*var(--u))]">
        <KiteTitle>{ktx(ctx, "cart.heading")}</KiteTitle>
        <p {...t16} className={cn(t16.className, "uppercase opacity-80")} aria-live="polite">
          {ready && lines.length ? (count === 1 ? ktx(ctx, "cart.itemCountOne") : ktx(ctx, "cart.itemCount", { count })) : null}
        </p>
      </header>

      {!ready ? null : lines.length === 0 ? (
        <div className="flex flex-col items-start gap-[calc(24*var(--u))] py-[calc(32*var(--u))] shadow-[inset_0_1px_0_rgba(244,243,241,0.5)]">
          <KiteHeading as="p">{ktx(ctx, "cart.emptyHeading")}</KiteHeading>
          <KiteButton variant="outline" href={route(ctx, "collection")}>
            {ktx(ctx, "cart.continueShopping")}
          </KiteButton>
        </div>
      ) : (
        <div className="flex flex-col gap-[calc(48*var(--u))] md:flex-row md:items-start md:gap-[calc(32*var(--u))]">
          <ul className="flex flex-col shadow-[inset_0_1px_0_rgba(244,243,241,0.5)] md:w-[calc(1248*var(--u))] md:shrink-0">
            {lines.map((l) => (
              <li key={l.id} className={cn("flex gap-[calc(16*var(--u))] py-[calc(24*var(--u))] md:gap-[calc(32*var(--u))]", KITE_RULE)}>
                <a href={l.href} className="relative block h-[calc(150*var(--u))] w-[calc(120*var(--u))] shrink-0 overflow-hidden md:h-[calc(200*var(--u))] md:w-[calc(160*var(--u))]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={l.src} alt="" className="absolute inset-0 h-full w-full object-cover" />
                </a>
                <div className="flex min-w-0 flex-1 flex-col justify-between gap-[calc(16*var(--u))]">
                  <div className="flex items-start justify-between gap-[calc(16*var(--u))]">
                    <div className="min-w-0">
                      <a href={l.href} {...t20} className={cn(t20.className, "block uppercase")}>{l.title}</a>
                      {[l.colour, l.size].filter(Boolean).length ? (
                        <p {...t16} className={cn(t16.className, "uppercase opacity-80")}>{[l.colour, l.size].filter(Boolean).join(" · ")}</p>
                      ) : null}
                    </div>
                    <p {...t20} className={cn(t20.className, "shrink-0 uppercase")}>{kiteMoney(l.price * l.qty, ctx.currency)}</p>
                  </div>
                  <div className="flex items-center justify-between gap-[calc(16*var(--u))]">
                    <div className="flex items-center gap-[calc(16*var(--u))]" role="group" aria-label={ktx(ctx, "product.quantity")}>
                      <button type="button" aria-label={ktx(ctx, "product.oneFewer")} disabled={l.qty <= 1} onClick={() => setQty(l.id, l.qty - 1)} {...t20} className={cn(t20.className, "flex h-[44px] w-[32px] items-center justify-center disabled:opacity-30")}>−</button>
                      <span {...t20} aria-live="polite">{l.qty}</span>
                      <button type="button" aria-label={ktx(ctx, "product.oneMore")} disabled={live && l.qty >= real.stockOf(l.id)} onClick={() => setQty(l.id, l.qty + 1)} {...t20} className={cn(t20.className, "flex h-[44px] w-[32px] items-center justify-center disabled:opacity-30")}>+</button>
                    </div>
                    <KiteTextLink onClick={() => remove(l.id)}>{ktx(ctx, "cart.remove")}</KiteTextLink>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <aside aria-label={ktx(ctx, "cart.orderSummary")} className="flex flex-col gap-[calc(24*var(--u))] md:sticky md:top-[calc(32*var(--u))] md:w-[calc(384*var(--u))]">
            <KiteHeading>{ktx(ctx, "cart.orderSummary")}</KiteHeading>
            <div className="shadow-[inset_0_1px_0_rgba(244,243,241,0.5)]">
              <KiteLine label={ktx(ctx, "checkout.subtotal")} value={kiteMoney(subtotal, ctx.currency)} />
              <KiteLine label={ktx(ctx, "checkout.shipping")} value={delivery === null ? ktx(ctx, "checkout.shippingLater") : delivery === 0 ? ktx(ctx, "checkout.freeShipping") : kiteMoney(delivery, ctx.currency)} />
              <KiteLine strong label={ktx(ctx, "checkout.total")} value={kiteMoney(subtotal + (delivery ?? 0), ctx.currency)} />
            </div>
            {on(data, "showFreeDeliveryNote") && threshold !== null && short > 0 ? (
              <p {...t16} className={cn(t16.className, "opacity-80")}>{ktx(ctx, "cart.freeDeliveryNote", { amount: kiteMoney(short, ctx.currency) })}</p>
            ) : null}
            <KiteButton href={route(ctx, "checkout")} className="w-full">{ktx(ctx, "cart.proceedToCheckout")}</KiteButton>
            <KiteTextLink href={route(ctx, "collection")} className="self-center">{ktx(ctx, "cart.continueShopping")}</KiteTextLink>
          </aside>
        </div>
      )}
    </KitePage>
  );
}
