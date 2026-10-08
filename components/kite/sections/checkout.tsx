"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { route, type KiteContext } from "@/components/kite/contract";
import { kt } from "@/components/kite/type";
import { kiteMoney } from "@/components/kite/money";
import { ktx } from "@/components/kite/text";
import { isValidPakistaniPhone } from "@/lib/validation";
import { kitPlaceOrder, kitPreviewDiscount, useKitCart } from "@/lib/themes/kit-actions";
import { KITE_RULE, KITE_RULE_TOP, KiteButton, KiteField, KiteHeading, KiteLine, KitePage, KiteSelect, KiteTextLink, KiteTitle } from "@/components/kite/ui";
import type { KitCartLine } from "@/lib/themes/kit";
import { WHOLE, isFilePhoto } from "@/components/kite/assets";

/**
 * Checkout — not in the file; Kite's own parts (decided 8 October).
 *
 * The form in the account's right-hand column width, 800, at the left; the
 * order beside it in the bag's 384. Four steps on the half-ink rule, each
 * numbered as the home page numbers its sections (Nº) over a Khand heading.
 * A choice is a row on the rule with a square marker, filled when chosen.
 *
 * Every rule the order API holds is held here too — the same fields, the
 * shop's own cities, delivery charge and ways to pay; a card payment leaves
 * for the provider's page, never typed here. The reference build places a
 * pretend order.
 */
type Form = Record<"email" | "first" | "last" | "address" | "city" | "postcode" | "phone", string>;
const EMPTY: Form = { email: "", first: "", last: "", address: "", city: "", postcode: "", phone: "" };

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  const t = kt("sans", 14, 16);
  return (
    <fieldset className={cn("flex flex-col gap-[calc(24*var(--u))] pt-[calc(24*var(--u))]", KITE_RULE_TOP)}>
      <legend className="float-left flex w-full flex-col gap-[calc(4*var(--u))]">
        <span {...t} className={cn(t.className, "opacity-50")}>Nº00{n}</span>
        <KiteHeading as="p">{title}</KiteHeading>
      </legend>
      {children}
    </fieldset>
  );
}

function Choices({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: { value: string; title: string; note: string; price?: string }[]; label: string }) {
  const a = kt("sans", 16, 20);
  const b = kt("sans", 14, 16);
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-col shadow-[inset_0_1px_0_rgba(244,243,241,0.5)]">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button key={o.value} type="button" role="radio" aria-checked={on} onClick={() => onChange(o.value)} className={cn("flex items-center gap-[calc(16*var(--u))] py-[calc(16*var(--u))] text-left", KITE_RULE)}>
            <span className="flex h-[16px] w-[16px] shrink-0 items-center justify-center shadow-[inset_0_0_0_1px_#f4f3f1]">{on ? <span className="h-[8px] w-[8px] bg-[#f4f3f1]" /> : null}</span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span {...a} className={cn(a.className, "uppercase")}>{o.title}</span>
              <span {...b} className={cn(b.className, "opacity-80")}>{o.note}</span>
            </span>
            {o.price ? <span {...a} className={cn(a.className, "shrink-0 uppercase")}>{o.price}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

export function KiteCheckout({ ctx }: { data: Record<string, unknown>; ctx: KiteContext }) {
  const terms = ctx.checkout;
  const cart = useKitCart();
  // In the customizer an empty bag shows sample lines, and placing the order only pretends.
  const sampled = !!ctx.live && cart.ready && cart.lines.length === 0 && !!ctx.cart?.length;
  const live = !!ctx.live && !sampled;
  const router = useRouter();
  const lines: KitCartLine[] = live ? cart.lines : (ctx.cart ?? []);
  const subtotal = lines.reduce((n, l) => n + l.price * l.qty, 0);
  const start = terms?.initial;
  const [form, setForm] = useState<Form>(start ? { email: start.email, first: start.firstName, last: start.lastName, address: start.line1, city: start.city, postcode: start.postcode, phone: start.phone } : EMPTY);
  const [errors, setErrors] = useState<Partial<Form>>({});
  const [pay, setPay] = useState<string>(terms ? (terms.methods[0]?.value ?? "") : "cod");
  const [placed, setPlaced] = useState<string | null>(null);
  const [discount, setDiscount] = useState<{ code: string; saving: number } | null>(null);
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // The shop's one delivery charge, free over its threshold; nothing in the reference build.
  const delivery = terms ? (terms.freeShippingFrom !== null && subtotal >= terms.freeShippingFrom ? 0 : terms.shippingFee) : 0;
  const total = Math.max(0, subtotal + delivery - (discount?.saving ?? 0));
  const method = terms?.methods.find((m) => m.value === pay);
  const leavesForProvider = terms ? !!method?.redirects : pay === "card";
  const t = kt("sans", 14, 16);
  const v = kt("sans", 16, 20);

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
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = ktx(ctx, "checkout.emailError");
    for (const [k, msg] of [
      ["first", ktx(ctx, "checkout.firstNameError")],
      ["last", ktx(ctx, "checkout.lastNameError")],
      ["address", ktx(ctx, "checkout.addressError")],
      ["city", ktx(ctx, "checkout.cityError")],
      ["phone", ktx(ctx, "checkout.phoneError")],
    ] as const) {
      if (!form[k].trim()) next[k] = msg;
    }
    // The same phone rule the order API holds to — said here, before the trip.
    if (terms && form.phone.trim() && !isValidPakistaniPhone(form.phone)) next.phone = ktx(ctx, "checkout.phoneError");
    setErrors(next);
    if (Object.keys(next).length) {
      requestAnimationFrame(() => (document.querySelector("[aria-invalid=true]") as HTMLElement | null)?.focus());
      return;
    }
    if (!live) {
      setPlaced(`KT-${10000 + Math.floor(subtotal * 7)}`);
      window.scrollTo({ top: 0 });
      return;
    }
    setSubmitting(true);
    setServerError(null);
    void kitPlaceOrder({
      customerName: `${form.first} ${form.last}`.trim(),
      customerEmail: form.email.trim(),
      customerPhone: form.phone.trim(),
      shippingLine1: form.address.trim(),
      shippingCity: form.city,
      shippingPostalCode: form.postcode.trim(),
      paymentMethod: pay,
      discountCode: discount?.code,
      items: cart.orderItems(),
    }, ctx.base ?? "").then((result) => {
      if (!result.ok) {
        setServerError(result.error);
        setSubmitting(false);
        return;
      }
      cart.clear();
      // A card payment has already left for the provider's page.
      if (!result.leaving) router.push(`${ctx.base ?? ""}/order-confirmation/${result.orderId}?key=${result.accessKey}&placed=1`);
    });
  };

  if (placed) {
    return (
      <KitePage k="checkout">
        <div className="flex flex-col items-start gap-[calc(24*var(--u))] md:w-[calc(800*var(--u))]">
          <p {...t} className={cn(t.className, "uppercase opacity-80")}>{ktx(ctx, "checkout.orderNumber", { id: placed })}</p>
          <KiteTitle>{ktx(ctx, "checkout.thanks", { name: form.first })}</KiteTitle>
          <p {...v}>{ktx(ctx, "checkout.thanksText", { email: form.email, when: ktx(ctx, "checkout.whenStandard") })}</p>
          <KiteButton variant="outline" href={route(ctx, "collection")}>{ktx(ctx, "cart.continueShopping")}</KiteButton>
        </div>
      </KitePage>
    );
  }

  if (live && (!cart.ready || lines.length === 0)) {
    return (
      <KitePage k="checkout">
        {cart.ready ? (
          <div className="flex flex-col items-start gap-[calc(24*var(--u))]">
            <KiteHeading as="p">{ktx(ctx, "checkout.emptyCart")}</KiteHeading>
            <KiteButton variant="outline" href={route(ctx, "collection")}>{ktx(ctx, "cart.continueShopping")}</KiteButton>
          </div>
        ) : null}
      </KitePage>
    );
  }

  return (
    <KitePage k="checkout">
      <div className="flex flex-col gap-[calc(48*var(--u))] md:flex-row md:items-start md:justify-between">
        <form noValidate onSubmit={submit} className="flex flex-col gap-[calc(48*var(--u))] md:w-[calc(800*var(--u))] md:shrink-0">
          <div className="flex items-end justify-between gap-[calc(16*var(--u))]">
            <KiteTitle>{ktx(ctx, "checkout.heading")}</KiteTitle>
            <KiteTextLink href={route(ctx, "cart")}>{ktx(ctx, "checkout.backToCart")}</KiteTextLink>
          </div>

          <Step n={1} title={ktx(ctx, "checkout.stepContact")}>
            <KiteField label={ktx(ctx, "checkout.email")} type="email" autoComplete="email" inputMode="email" {...field("email")} />
          </Step>

          <Step n={2} title={ktx(ctx, "checkout.stepAddress")}>
            <div className="grid grid-cols-1 gap-[calc(32*var(--u))] md:grid-cols-2">
              <KiteField label={ktx(ctx, "checkout.firstName")} autoComplete="given-name" {...field("first")} />
              <KiteField label={ktx(ctx, "checkout.lastName")} autoComplete="family-name" {...field("last")} />
              <KiteField label={ktx(ctx, "checkout.address")} autoComplete="street-address" className="md:col-span-2" {...field("address")} />
              {terms ? (
                <KiteSelect label={ktx(ctx, "checkout.city")} options={terms.cities} placeholder={ktx(ctx, "checkout.cityPlaceholder")} value={form.city} error={errors.city} onChange={(c) => { setForm((f) => ({ ...f, city: c })); if (errors.city) setErrors((x) => ({ ...x, city: undefined })); }} />
              ) : (
                <KiteField label={ktx(ctx, "checkout.city")} autoComplete="address-level2" {...field("city")} />
              )}
              <KiteField label={ktx(ctx, "checkout.postcode")} autoComplete="postal-code" {...field("postcode")} />
              <KiteField label={ktx(ctx, "checkout.phone")} type="tel" autoComplete="tel" inputMode="tel" className="md:col-span-2" {...field("phone")} />
            </div>
          </Step>

          <Step n={3} title={ktx(ctx, "checkout.stepDelivery")}>
            <div className={cn("flex items-center justify-between gap-[calc(16*var(--u))] py-[calc(16*var(--u))]", KITE_RULE_TOP, KITE_RULE)}>
              <span className="flex flex-col">
                <span {...v} className={cn(v.className, "uppercase")}>{ktx(ctx, "checkout.delivery")}</span>
                <span {...t} className={cn(t.className, "opacity-80")}>{ktx(ctx, "checkout.deliveryNote")}</span>
              </span>
              <span {...v} className={cn(v.className, "uppercase")}>{delivery === 0 ? ktx(ctx, "checkout.freeShipping") : kiteMoney(delivery, ctx.currency)}</span>
            </div>
          </Step>

          <Step n={4} title={ktx(ctx, "checkout.stepPayment")}>
            <Choices
              label={ktx(ctx, "checkout.stepPayment")}
              value={pay}
              onChange={setPay}
              options={
                terms
                  ? terms.methods.map((m) => ({ value: m.value, title: m.label, note: m.hint }))
                  : [
                      { value: "cod", title: ktx(ctx, "checkout.cod"), note: ktx(ctx, "checkout.codNote") },
                      { value: "card", title: ktx(ctx, "checkout.card"), note: ktx(ctx, "checkout.cardNote") },
                    ]
              }
            />
            {terms && method?.instructions ? <p {...t} className={cn(t.className, "whitespace-pre-line opacity-80")}>{method.instructions}</p> : null}
          </Step>

          <div className="flex flex-col gap-[calc(16*var(--u))]">
            {serverError ? <p role="alert" {...t} className={cn(t.className, "text-[#e2735f]")}>{serverError}</p> : null}
            <KiteButton type="submit" disabled={submitting} className="w-full">
              {ktx(ctx, leavesForProvider ? "checkout.continueToPayment" : "checkout.placeOrder", { amount: kiteMoney(total, ctx.currency) })}
            </KiteButton>
            <p {...t} className={cn(t.className, "text-center opacity-80")}>{ktx(ctx, leavesForProvider ? "checkout.nothingChargedCard" : "checkout.nothingCharged")}</p>
          </div>
        </form>

        <aside aria-label={ktx(ctx, "checkout.orderSummary")} className="flex flex-col gap-[calc(24*var(--u))] md:sticky md:top-[calc(32*var(--u))] md:w-[calc(384*var(--u))]">
          <KiteHeading>{ktx(ctx, "checkout.orderSummary")}</KiteHeading>
          <ul className="flex flex-col gap-[calc(16*var(--u))]">
            {lines.map((l) => (
              <li key={l.id} className="flex items-center gap-[calc(16*var(--u))]">
                <span className="relative block h-[calc(100*var(--u))] w-[calc(80*var(--u))] shrink-0 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={l.src} alt="" className={cn("absolute inset-0 h-full w-full", isFilePhoto(l.src) ? "object-cover" : WHOLE)} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span {...v} className={cn(v.className, "uppercase")}>{l.title}</span>
                  <span {...t} className={cn(t.className, "opacity-80")}>{[l.colour, l.size, `× ${l.qty}`].filter(Boolean).join(" · ")}</span>
                </span>
                <span {...v} className={cn(v.className, "shrink-0 uppercase")}>{kiteMoney(l.price * l.qty, ctx.currency)}</span>
              </li>
            ))}
          </ul>
          {live ? (
            discount ? (
              <KiteTextLink onClick={() => setDiscount(null)} className="self-start">{ktx(ctx, "checkout.removeDiscount")} {discount.code}</KiteTextLink>
            ) : (
              <div className="flex flex-col gap-[calc(8*var(--u))]">
                <div className="flex items-end gap-[calc(16*var(--u))]">
                  <KiteField label={ktx(ctx, "checkout.discountCode")} value={codeInput} onChange={(e) => setCodeInput(e.target.value)} className="flex-1" />
                  <KiteButton variant="outline" disabled={!codeInput.trim()} onClick={async () => {
                    setCodeError(null);
                    const r = await kitPreviewDiscount(codeInput.trim(), cart.orderItems().map((i) => ({ variantId: i.variantId, quantity: i.quantity })));
                    if (!r.ok) return setCodeError(r.error);
                    setDiscount({ code: r.code, saving: r.saving });
                    setCodeInput("");
                  }}>{ktx(ctx, "checkout.apply")}</KiteButton>
                </div>
                {codeError ? <p role="alert" {...t} className={cn(t.className, "text-[#e2735f]")}>{codeError}</p> : null}
              </div>
            )
          ) : null}
          <div className="shadow-[inset_0_1px_0_rgba(244,243,241,0.5)]">
            <KiteLine label={ktx(ctx, "checkout.subtotal")} value={kiteMoney(subtotal, ctx.currency)} />
            {discount ? <KiteLine label={ktx(ctx, "checkout.discount")} value={`− ${kiteMoney(discount.saving, ctx.currency)}`} /> : null}
            <KiteLine label={ktx(ctx, "checkout.shipping")} value={delivery === 0 ? ktx(ctx, "checkout.freeShipping") : kiteMoney(delivery, ctx.currency)} />
            <KiteLine strong label={ktx(ctx, "checkout.total")} value={kiteMoney(total, ctx.currency)} />
          </div>
        </aside>
      </div>
    </KitePage>
  );
}
