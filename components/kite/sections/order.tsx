import { cn } from "@/lib/utils";
import { on, route, str, type KiteContext } from "@/components/kite/contract";
import { kt } from "@/components/kite/type";
import { kiteMoney } from "@/components/kite/money";
import { ktx } from "@/components/kite/text";
import { KITE_RULE, KITE_RULE_TOP, KiteButton, KiteHeading, KiteLine, KitePage, KiteTextLink, KiteTitle } from "@/components/kite/ui";
import { KiteOrderLookup } from "@/components/kite/sections/order-lookup";
import { WHOLE, isFilePhoto } from "@/components/kite/assets";

const STAGES = ["orderStatus.ordered", "orderStatus.packed", "orderStatus.shipped", "orderStatus.delivered"] as const;

/**
 * One order — not in the file; Kite's own parts (decided 8 October).
 *
 * Where it has got to is the title, in the account's serif, because that is
 * what somebody opens the page to learn; the order's number and date over it.
 * Four stages on the half-ink rule, each a word in capitals — the current one
 * in the ink and underlined, the rest at half. Then what was ordered at the
 * left in the bag's lines and, at the right in 384, the totals and where it
 * is going and how it was paid.
 */
export function KiteOrderView({ data, ctx }: { data: Record<string, unknown>; ctx: KiteContext }) {
  const o = ctx.order;
  if (!o) return ctx.orderLookup ? <KiteOrderLookup ctx={ctx} id={ctx.orderLookup.id} /> : null;
  const subtotal = o.lines.reduce((n, l) => n + l.price * l.qty, 0);
  const t = kt("sans", 14, 16);
  const v = kt("sans", 16, 20);
  return (
    <KitePage k="order">
      <KiteTextLink href={route(ctx, "account")} className="mb-[calc(24*var(--u))] inline-block">← {str(data, "backLabel")}</KiteTextLink>
      <p {...t} className={cn(t.className, "uppercase opacity-80")}>{ktx(ctx, "order.eyebrow", { id: o.id, date: o.placed })}</p>
      <KiteTitle className="pb-[calc(16*var(--u))]">
        {o.thanks ? ktx(ctx, "order.thanks", { name: o.thanks }) : ktx(ctx, o.cancelled ? "orderStatus.cancelled" : STAGES[o.stage])}
      </KiteTitle>
      {o.thanks ? <p {...v} className={cn(v.className, "pb-[calc(16*var(--u))] md:w-[calc(800*var(--u))]")}>{ktx(ctx, "order.thanksText")}</p> : null}
      {o.cancelled ? <p {...v} className={cn(v.className, "pb-[calc(16*var(--u))]")}>{ktx(ctx, "order.cancelledText")}</p> : null}
      {o.notice ? <p {...v} className={cn(v.className, "pb-[calc(16*var(--u))] opacity-80")}>{o.notice}</p> : null}

      {on(data, "showProgress") && !o.cancelled ? (
        <ol className={cn("flex flex-col gap-[calc(16*var(--u))] py-[calc(24*var(--u))] md:flex-row md:gap-[calc(32*var(--u))]", KITE_RULE_TOP, KITE_RULE)}>
          {STAGES.map((s, i) => {
            const state = i < o.stage ? "done" : i === o.stage ? "now" : "later";
            return (
              <li key={s} aria-current={state === "now" ? "step" : undefined} className="flex flex-col md:flex-1">
                <span {...v} className={cn(v.className, "uppercase", state === "now" && "underline underline-offset-4", state === "later" && "opacity-50")}>{ktx(ctx, s)}</span>
                {o.dates[i] ? <span {...t} className={cn(t.className, "opacity-80")}>{state === "later" ? ktx(ctx, "order.expected", { date: o.dates[i] ?? "" }) : o.dates[i]}</span> : null}
              </li>
            );
          })}
        </ol>
      ) : null}

      {o.tracking && o.stage < 3 && !o.cancelled ? <KiteButton href={o.tracking} className="mt-[calc(24*var(--u))] md:w-[calc(384*var(--u))]">{ktx(ctx, "orderStatus.shipped")}</KiteButton> : null}

      <div className="flex flex-col gap-[calc(48*var(--u))] pt-[calc(48*var(--u))] md:flex-row md:items-start md:justify-between">
        <div className="md:w-[calc(1248*var(--u))]">
          <KiteHeading className="pb-[calc(16*var(--u))]">{str(data, "itemsHeading")}</KiteHeading>
          <ul className="shadow-[inset_0_1px_0_rgba(244,243,241,0.5)]">
            {o.lines.map((l) => (
              <li key={l.id} className={cn("flex gap-[calc(16*var(--u))] py-[calc(24*var(--u))] md:gap-[calc(32*var(--u))]", KITE_RULE)}>
                <span className="relative block h-[calc(150*var(--u))] w-[calc(120*var(--u))] shrink-0 overflow-hidden md:h-[calc(200*var(--u))] md:w-[calc(160*var(--u))]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={l.src} alt="" className={cn("absolute inset-0 h-full w-full", isFilePhoto(l.src) ? "object-cover" : WHOLE)} />
                </span>
                <div className="flex min-w-0 flex-1 items-start justify-between gap-[calc(16*var(--u))]">
                  <div className="min-w-0">
                    {l.href ? <a href={l.href} {...v} className={cn(v.className, "block uppercase")}>{l.title}</a> : <p {...v} className={cn(v.className, "uppercase")}>{l.title}</p>}
                    <p {...t} className={cn(t.className, "opacity-80")}>{[l.colour, l.size, `× ${l.qty}`].filter(Boolean).join(" · ")}</p>
                  </div>
                  <p {...v} className={cn(v.className, "shrink-0 uppercase")}>{kiteMoney(l.price * l.qty, ctx.currency)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-[calc(32*var(--u))] md:w-[calc(384*var(--u))]">
          <div className="shadow-[inset_0_1px_0_rgba(244,243,241,0.5)]">
            <KiteLine label={ktx(ctx, "checkout.subtotal")} value={kiteMoney(subtotal, ctx.currency)} />
            {o.discount ? <KiteLine label={ktx(ctx, "checkout.discount")} value={`− ${kiteMoney(o.discount.saving, ctx.currency)}`} /> : null}
            <KiteLine label={ktx(ctx, "checkout.shipping")} value={o.delivery === 0 ? ktx(ctx, "checkout.freeShipping") : kiteMoney(o.delivery, ctx.currency)} />
            <KiteLine strong label={ktx(ctx, "checkout.total")} value={kiteMoney(Math.max(0, subtotal + o.delivery - (o.discount?.saving ?? 0)), ctx.currency)} />
          </div>
          {o.address ? (
            <div className="flex flex-col gap-[calc(8*var(--u))]">
              <p {...t} className={cn(t.className, "uppercase opacity-80")}>{str(data, "addressHeading")}</p>
              <address {...v} className={cn(v.className, "not-italic")}>{o.address.map((x) => <span key={x} className="block">{x}</span>)}</address>
            </div>
          ) : null}
          <div className="flex flex-col gap-[calc(8*var(--u))]">
            <p {...t} className={cn(t.className, "uppercase opacity-80")}>{str(data, "paymentHeading")}</p>
            <p {...v}>{[o.payment, o.speed].filter(Boolean).join(" · ")}</p>
          </div>
        </div>
      </div>
    </KitePage>
  );
}
