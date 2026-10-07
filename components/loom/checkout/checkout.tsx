"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { LOOM_RULE, LoomButton, LoomCard } from "@/components/loom/primitives";
import { LoomChevronDown } from "@/components/loom/icons";
import { LoomField, LoomPromises, LoomTotals } from "@/components/loom/commerce";
import { FREE_DELIVERY_FROM, money } from "@/components/loom/money";
import type { CartLine } from "@/components/loom/cart/cart";
import { T } from "@/components/loom/type";
import { on, route, type LoomContext } from "@/components/loom/contract";
import { tx } from "@/components/loom/text";

/**
 * Checkout. Not in the kit — the blog row's split again, 654 of form, 60,
 * 606 of order, so the thing being filled in is on the side the photograph
 * was and the thing being bought sits where the words were.
 *
 * Four steps, each on the section rule and numbered in Heading 4: contact,
 * where it goes, how fast, how to pay. Fields are the kit's search pill grown
 * to 50 (LoomField). A choice between options is a card at the phone's small
 * radius, 24, outlined `#e3e3e3` and ink when chosen, with the price filter's
 * round marker — one look for "pick one" everywhere on the site.
 *
 * Paying by card goes to the provider's own page. A card number is never
 * typed into this page, which is the platform's rule for payments, so the
 * design does not draw a card form to be filled here.
 *
 * Phone: the order folds into one line at the top — "Order summary, $284"
 * — so the form starts on the first screen, and opens with the kit's chevron.
 */
type Form = Record<"email" | "first" | "last" | "address" | "city" | "postcode" | "phone", string>;
const EMPTY: Form = { email: "", first: "", last: "", address: "", city: "", postcode: "", phone: "" };

export function LoomCheckout({ data, ctx }: { data: Record<string, unknown>; ctx: LoomContext }) {
  const lines: CartLine[] = ctx.cart ?? [];
  const subtotal = lines.reduce((n, l) => n + l.price * l.qty, 0);
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Partial<Form>>({});
  const [speed, setSpeed] = useState<"standard" | "express">("standard");
  const [pay, setPay] = useState<"card" | "cod">("card");
  const [placed, setPlaced] = useState<string | null>(null);

  const standard = subtotal >= FREE_DELIVERY_FROM ? 0 : 10;
  const delivery = speed === "express" ? 15 : standard;

  const field = (k: keyof Form) => ({
    value: form[k],
    error: errors[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [k]: e.target.value }));
      if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Partial<Form> = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = tx(ctx, "checkout.emailError");
    for (const [k, msg] of [
      ["first", tx(ctx, "checkout.firstNameError")],
      ["last", tx(ctx, "checkout.lastNameError")],
      ["address", tx(ctx, "checkout.addressError")],
      ["city", tx(ctx, "checkout.cityError")],
      ["postcode", tx(ctx, "checkout.postcodeError")],
      ["phone", tx(ctx, "checkout.phoneError")],
    ] as const) {
      if (!form[k].trim()) next[k] = msg;
    }
    setErrors(next);
    if (Object.keys(next).length) {
      // Take the customer to the first thing to fix rather than leaving them
      // to scroll for a red line.
      requestAnimationFrame(() => (document.querySelector("[aria-invalid=true]") as HTMLElement | null)?.focus());
      return;
    }
    setPlaced(`LM-${10000 + Math.floor(subtotal * 7 + delivery * 13)}`);
    window.scrollTo({ top: 0 });
  };

  if (placed) {
    return (
      <section className="px-[calc(16*var(--u))] pb-[calc(80*var(--u))] md:px-[calc(60*var(--u))] md:pb-[calc(120*var(--u))]">
        <div className="flex flex-col gap-[calc(24*var(--u))] md:w-[calc(654*var(--u))]">
          <p className={cn(T.single2, "uppercase text-[#121212]/80")}>{tx(ctx, "checkout.orderNumber", { id: placed })}</p>
          <h1 data-m="checkout-thanks" className={cn(T.h3, "text-[#121212] md:text-[calc(65*var(--u))] md:leading-[calc(65*var(--u))] md:tracking-[calc(-4*var(--u))]")}>
            {tx(ctx, "checkout.thanks", { name: form.first })}
          </h1>
          <p className={cn(T.body6, "text-[#121212]/80 md:text-[max(calc(18*var(--u)),14.4px)]")}>
            {tx(ctx, "checkout.thanksText", {
              email: form.email,
              when: tx(ctx, speed === "express" ? "checkout.whenExpress" : "checkout.whenStandard"),
            })}
          </p>
          <LoomButton variant="outline" href={route(ctx, "collection")}>
            {tx(ctx, "cart.continueShopping")}
          </LoomButton>
        </div>
      </section>
    );
  }

  return (
    <section className="px-[calc(16*var(--u))] pb-[calc(40*var(--u))] md:px-[calc(60*var(--u))] md:pb-[calc(120*var(--u))]">
      {/* Phone: the order, folded. */}
      <details className={cn("group mb-[calc(24*var(--u))] md:hidden", "border-y border-black/10")}>
        <summary className={cn(T.body3, "flex cursor-pointer list-none items-center justify-between py-[calc(16*var(--u))] text-[#121212] [&::-webkit-details-marker]:hidden")}>
          <span className="flex items-center gap-[calc(8*var(--u))]">
            {tx(ctx, "cart.orderSummary")}
            <LoomChevronDown className="h-[max(calc(24*var(--u)),19px)] w-[max(calc(24*var(--u)),19px)] transition-transform group-open:rotate-180" />
          </span>
          <span>{money(subtotal + delivery, ctx.currency)}</span>
        </summary>
        <div className="pb-[calc(24*var(--u))]">
          <Summary ctx={ctx} showPromises={on(data, "showPromises")} lines={lines} subtotal={subtotal} delivery={delivery} />
        </div>
      </details>

      <div className="flex flex-col gap-[calc(40*var(--u))] md:flex-row md:items-start md:gap-[calc(60*var(--u))]">
        <form noValidate onSubmit={submit} data-m="checkout-form" className="flex flex-col gap-[calc(40*var(--u))] md:w-[calc(654*var(--u))] md:shrink-0">
          <h1 className={cn(T.h3, "text-[#121212] md:text-[calc(65*var(--u))] md:leading-[calc(65*var(--u))] md:tracking-[calc(-4*var(--u))]")}>{tx(ctx, "checkout.heading")}</h1>

          <Step n={1} title={tx(ctx, "checkout.stepContact")}>
            <LoomField label={tx(ctx, "checkout.email")} type="email" autoComplete="email" inputMode="email" {...field("email")} />
          </Step>

          <Step n={2} title={tx(ctx, "checkout.stepAddress")}>
            <div className="grid grid-cols-1 gap-[calc(16*var(--u))] md:grid-cols-2 md:gap-[calc(20*var(--u))]">
              <LoomField label={tx(ctx, "checkout.firstName")} autoComplete="given-name" {...field("first")} />
              <LoomField label={tx(ctx, "checkout.lastName")} autoComplete="family-name" {...field("last")} />
              <LoomField label={tx(ctx, "checkout.address")} autoComplete="street-address" className="md:col-span-2" {...field("address")} />
              <LoomField label={tx(ctx, "checkout.city")} autoComplete="address-level2" {...field("city")} />
              <LoomField label={tx(ctx, "checkout.postcode")} autoComplete="postal-code" {...field("postcode")} />
              <LoomField label={tx(ctx, "checkout.phone")} type="tel" autoComplete="tel" inputMode="tel" className="md:col-span-2" {...field("phone")} />
            </div>
          </Step>

          <Step n={3} title={tx(ctx, "checkout.stepSpeed")}>
            <Choices
              name="speed"
              value={speed}
              onChange={(v) => setSpeed(v as typeof speed)}
              options={[
                { value: "standard", title: tx(ctx, "checkout.standard"), note: tx(ctx, "checkout.standardNote"), price: standard === 0 ? tx(ctx, "checkout.freeShipping") : money(standard, ctx.currency) },
                { value: "express", title: tx(ctx, "checkout.express"), note: tx(ctx, "checkout.expressNote"), price: money(15, ctx.currency) },
              ]}
            />
          </Step>

          <Step n={4} title={tx(ctx, "checkout.stepPayment")}>
            <Choices
              name="pay"
              value={pay}
              onChange={(v) => setPay(v as typeof pay)}
              options={[
                { value: "card", title: tx(ctx, "checkout.card"), note: tx(ctx, "checkout.cardNote") },
                { value: "cod", title: tx(ctx, "checkout.cod"), note: tx(ctx, "checkout.codNote") },
              ]}
            />
          </Step>

          <div className="flex flex-col gap-[calc(16*var(--u))]">
            <LoomButton type="submit" data-m="checkout-place" className="w-full min-w-0">
              {tx(ctx, pay === "card" ? "checkout.continueToPayment" : "checkout.placeOrder", { amount: money(subtotal + delivery, ctx.currency) })}
            </LoomButton>
            <p className={cn(T.body6, "text-center text-[#121212]/80")}>
              {tx(ctx, pay === "card" ? "checkout.nothingChargedCard" : "checkout.nothingCharged")}
            </p>
          </div>
        </form>

        {/* Desktop: the order, beside the form, where the blog's words sit. */}
        <aside aria-label={tx(ctx, "checkout.orderSummary")} className="hidden md:sticky md:top-[calc(24*var(--u))] md:block md:w-[calc(606*var(--u))] md:shrink-0">
          <h2 className={cn(T.h4, "pb-[calc(24*var(--u))] text-[#121212]")}>{tx(ctx, "checkout.orderSummary")}</h2>
          <Summary ctx={ctx} showPromises={on(data, "showPromises")} lines={lines} subtotal={subtotal} delivery={delivery} />
        </aside>
      </div>
    </section>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <fieldset className={cn("flex flex-col gap-[calc(24*var(--u))] pt-[calc(32*var(--u))]", LOOM_RULE)}>
      <legend className={cn(T.h4, "float-left w-full text-[#121212]")}>
        <span className="text-[#121212]/50">{n}.</span> {title}
      </legend>
      {children}
    </fieldset>
  );
}

function Choices({
  name,
  value,
  onChange,
  options,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; title: string; note: string; price?: string }[];
}) {
  return (
    <div role="radiogroup" aria-label={name} className="flex flex-col gap-[calc(10*var(--u))]">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex items-center gap-[calc(16*var(--u))] rounded-[calc(24*var(--u))] border px-[calc(20*var(--u))] py-[calc(16*var(--u))] text-left",
              on ? "border-[#121212]" : "border-[#e3e3e3]"
            )}
          >
            <span className="flex h-[max(calc(20*var(--u)),18px)] w-[max(calc(20*var(--u)),18px)] shrink-0 items-center justify-center rounded-full border border-[#121212]">
              {on && <span className="h-[50%] w-[50%] rounded-full bg-[#121212]" />}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className={cn(T.body3, "text-[#121212]")}>{o.title}</span>
              <span className={cn(T.body6, "text-[#121212]/80")}>{o.note}</span>
            </span>
            {o.price && <span className={cn(T.body5, "shrink-0 text-[#121212]")}>{o.price}</span>}
          </button>
        );
      })}
    </div>
  );
}

/**
 * The order: each line with an 80 thumbnail at radius 24, its count in an ink
 * circle on the corner — the card's favourite button, carrying a number —
 * then the totals and the promises.
 */
function Summary({
  lines,
  subtotal,
  delivery,
  ctx,
  showPromises,
}: {
  lines: CartLine[];
  subtotal: number;
  delivery: number;
  ctx: LoomContext;
  showPromises: boolean;
}) {
  return (
    <div className="flex flex-col gap-[calc(24*var(--u))]">
      <ul className="flex flex-col gap-[calc(16*var(--u))]">
        {lines.map((l) => (
          <li key={l.id} className="flex items-center gap-[calc(16*var(--u))]">
            <div className="relative shrink-0">
              <LoomCard className="h-[calc(80*var(--u))] w-[calc(80*var(--u))] rounded-[calc(24*var(--u))]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={l.src} alt="" className="absolute inset-0 h-full w-full object-cover" />
              </LoomCard>
              <span
                aria-label={`${l.qty} of`}
                className={cn(T.small, "absolute -right-[calc(6*var(--u))] -top-[calc(6*var(--u))] flex h-[max(calc(24*var(--u)),20px)] min-w-[max(calc(24*var(--u)),20px)] items-center justify-center rounded-full bg-[#121212] px-[4px] text-white")}
              >
                {l.qty}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className={cn(T.body3, "text-[#121212]")}>{l.title}</p>
              <p className={cn(T.body6, "text-[#121212]/80")}>
                {l.colour} · {l.size}
              </p>
            </div>
            <p className={cn(T.body5, "shrink-0 text-[#121212]")}>{money(l.price * l.qty, ctx.currency)}</p>
          </li>
        ))}
      </ul>
      <LoomTotals ctx={ctx} subtotal={subtotal} delivery={delivery} />
      {showPromises && <LoomPromises ctx={ctx} />}
    </div>
  );
}
