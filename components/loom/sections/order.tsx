import { cn } from "@/lib/utils";
import { LOOM_RULE, LoomButton, LoomCard } from "@/components/loom/primitives";
import { LoomTotals } from "@/components/loom/commerce";
import { money } from "@/components/loom/money";
import { LoomPhoneIcon } from "@/components/loom/icons";
import { str, on, type LoomContext } from "@/components/loom/contract";
import { T } from "@/components/loom/type";
import { LoomPageHeading, PAGE_SECTION } from "@/components/loom/sections/page-heading";

const STAGES = ["Ordered", "Packed", "On its way", "Delivered"];

/**
 * One order — not in the kit.
 *
 * The heading is where the order has got to, in Heading 1, because "On its
 * way" is the answer to the question somebody opens this page with; the order
 * number is the eyebrow over it. Under it, four stages on the section rule:
 * done ones a filled ink dot, the current one ringed in the kit's Blue (the
 * colour the account list gives "On its way"), the rest an outline — each with
 * a word and a date, never a dot alone. On the phone the stages stand in a
 * column so each keeps a whole line.
 *
 * Then the blog split again: what was ordered on the left, 654; on the right,
 * 606, the totals, then where it is going and how it was paid as two cards at
 * radius 24, outlined #e3e3e3 like the checkout's choices. Help comes last:
 * the Service section's phone glyph in its 80px ink circle, a line, a button.
 */
export function LoomOrderView({ data, ctx }: { data: Record<string, unknown>; ctx: LoomContext }) {
  const o = ctx.order;
  if (!o) return null;
  const subtotal = o.lines.reduce((n, l) => n + l.price * l.qty, 0);

  return (
    <section className={PAGE_SECTION}>
      <a href="/loom/account" className={cn(T.small, "mb-[calc(16*var(--u))] inline-block text-black/50 underline underline-offset-4 md:mb-[calc(24*var(--u))]")}>
        ← {str(data, "backLabel")}
      </a>
      <LoomPageHeading
        m="order-title"
        eyebrow={`Order ${o.id} · ${o.placed}`}
        title={STAGES[o.stage]}
        aside={o.stage < 3 ? `Arriving ${o.arriving}, ${o.speed.toLowerCase()}.` : `Delivered ${o.dates[3]}.`}
      />

      {on(data, "showProgress") && (
        <ol
          data-m="order-progress"
          className={cn("flex flex-col gap-[calc(16*var(--u))] pt-[calc(24*var(--u))] md:flex-row md:gap-[calc(10*var(--u))] md:pt-[calc(32*var(--u))]", LOOM_RULE)}
        >
          {STAGES.map((s, i) => {
            const state = i < o.stage ? "done" : i === o.stage ? "now" : "later";
            return (
              <li key={s} aria-current={state === "now" ? "step" : undefined} className="flex items-center gap-[calc(12*var(--u))] md:flex-1 md:flex-col md:items-start">
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-[max(calc(14*var(--u)),12px)] w-[max(calc(14*var(--u)),12px)] shrink-0 rounded-full",
                    state === "done" && "bg-[#121212]",
                    state === "now" && "bg-[#233c6b] shadow-[0_0_0_4px_#ffffff,0_0_0_5px_#233c6b]",
                    state === "later" && "border border-[#121212]/30"
                  )}
                />
                <span className="flex flex-col">
                  <span className={cn(T.single2, "uppercase", state === "later" ? "text-[#121212]/50" : "text-[#121212]")}>{s}</span>
                  <span className={cn(T.body6, "text-[#121212]/80")}>
                    {state === "later" ? `Expected ${o.dates[i]}` : o.dates[i]}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      )}

      <div className="flex flex-wrap gap-[calc(10*var(--u))] pt-[calc(32*var(--u))]">
        {o.tracking && o.stage < 3 && (
          <LoomButton href="#" className="min-w-[calc(220*var(--u))]">
            {str(data, "trackLabel")}
          </LoomButton>
        )}
        {str(data, "buyAgainLabel") && (
          <LoomButton variant="outline" href="/loom/cart" className="min-w-[calc(220*var(--u))]">
            {str(data, "buyAgainLabel")}
          </LoomButton>
        )}
      </div>

      <div className="flex flex-col gap-[calc(40*var(--u))] pt-[calc(40*var(--u))] md:flex-row md:items-start md:gap-[calc(60*var(--u))] md:pt-[calc(60*var(--u))]">
        <div className="flex flex-col md:w-[calc(654*var(--u))] md:shrink-0">
          <h2 className={cn(T.h4, "pb-[calc(16*var(--u))] text-[#121212]")}>{str(data, "itemsHeading")}</h2>
          <ul data-m="order-lines">
            {o.lines.map((l) => (
              <li key={l.id} className={cn("flex gap-[calc(16*var(--u))] py-[calc(24*var(--u))] md:gap-[calc(24*var(--u))]", LOOM_RULE)}>
                <LoomCard className="h-[calc(104*var(--u))] w-[calc(104*var(--u))] rounded-[calc(24*var(--u))] md:h-[calc(156*var(--u))] md:w-[calc(156*var(--u))]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={l.src} alt="" className="absolute inset-0 h-full w-full object-cover" />
                </LoomCard>
                <div className="flex min-w-0 flex-1 items-start justify-between gap-[calc(16*var(--u))]">
                  <div className="min-w-0">
                    <a href={l.href} className={cn(T.body3, "block text-[#121212] md:text-[max(calc(24*var(--u)),19.2px)]")}>
                      {l.title}
                    </a>
                    <p className={cn(T.body6, "text-[#121212]/80")}>
                      {l.colour} · {l.size} · × {l.qty}
                    </p>
                  </div>
                  <p className={cn(T.body5, "shrink-0 text-[#121212] md:text-[max(calc(20*var(--u)),16px)]")}>{money(l.price * l.qty)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-[calc(24*var(--u))] md:w-[calc(606*var(--u))] md:shrink-0">
          <LoomTotals subtotal={subtotal} delivery={o.delivery} />
          <div className="grid grid-cols-1 gap-[calc(10*var(--u))] md:grid-cols-2">
            <Card heading={str(data, "addressHeading")} lines={o.address} />
            <Card heading={str(data, "paymentHeading")} lines={[o.payment, o.speed]} />
          </div>
        </div>
      </div>

      {on(data, "showHelp") && (
        <div className={cn("mt-[calc(40*var(--u))] flex flex-col gap-[calc(24*var(--u))] pt-[calc(40*var(--u))] md:mt-[calc(60*var(--u))] md:flex-row md:items-center md:gap-[calc(32*var(--u))]", LOOM_RULE)}>
          <span className="flex h-[calc(80*var(--u))] w-[calc(80*var(--u))] shrink-0 items-center justify-center rounded-full bg-[#121212]">
            <LoomPhoneIcon className="h-[calc(32*var(--u))] w-[calc(32*var(--u))] text-white" />
          </span>
          <div className="flex flex-1 flex-col gap-[calc(4*var(--u))]">
            <p className={cn(T.h5, "text-[#121212] md:text-[calc(30*var(--u))] md:leading-[calc(40*var(--u))]")}>{str(data, "helpHeading")}</p>
            <p className={cn(T.body6, "text-[#121212]/80 md:max-w-[calc(654*var(--u))] md:text-[max(calc(18*var(--u)),14.4px)]")}>{str(data, "helpText")}</p>
          </div>
          <LoomButton variant="outline" href={str(data, "helpButtonLink")} className="min-w-[calc(220*var(--u))] md:self-center">
            {str(data, "helpButtonLabel")}
          </LoomButton>
        </div>
      )}
    </section>
  );
}

function Card({ heading, lines }: { heading: string; lines: string[] }) {
  return (
    <div className="flex flex-col gap-[calc(12*var(--u))] rounded-[calc(24*var(--u))] border border-[#e3e3e3] p-[calc(24*var(--u))]">
      <p className={cn(T.single2, "uppercase text-[#121212]/80")}>{heading}</p>
      <address className={cn(T.body6, "not-italic text-[#121212]")}>
        {lines.map((l) => (
          <span key={l} className="block">
            {l}
          </span>
        ))}
      </address>
    </div>
  );
}
