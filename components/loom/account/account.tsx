"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { LOOM_RULE, LoomButton, LoomCard, LoomSwipeRow } from "@/components/loom/primitives";
import { LoomField, LoomSelectField } from "@/components/loom/commerce";
import { useRouter } from "next/navigation";
import { isValidPakistaniPhone } from "@/lib/validation";
import { kitAddAddress, kitDeleteAddress, kitSignOut } from "@/lib/themes/kit-actions";
import { money } from "@/components/loom/money";
import { T } from "@/components/loom/type";
import { fill, route, str, type LoomContext, type LoomCustomer } from "@/components/loom/contract";
import { tx } from "@/components/loom/text";

/**
 * The account, signed in. Not in the kit — the collection page's frame: a
 * column one card wide (322) for where you are, then the 10px gutter, then
 * the content, everything under the page heading on the section rule.
 *
 * Where you are is the Trending chips, stacked: the chosen one filled with ink
 * as the chosen chip is everywhere. On the phone they are the same chips in a
 * row to swipe, as they are on the home page.
 *
 * An order's state is a word with a dot, never the dot alone — "On its way"
 * in the kit's Blue, "Delivered" in ink. Colour helps; the word says it.
 */
const TABS = [
  { id: "orders", key: "account.orders" },
  { id: "addresses", key: "account.addresses" },
  { id: "details", key: "account.details" },
] as const;
type Tab = (typeof TABS)[number]["id"];

const CHIP =
  "flex h-[max(calc(50*var(--u)),40px)] shrink-0 items-center whitespace-nowrap rounded-[200px] px-[calc(19*var(--u))] text-[max(calc(14*var(--u)),11.2px)] font-medium uppercase leading-[max(calc(24*var(--u)),19.2px)] tracking-[calc(1*var(--u))]";

export function LoomAccount({ data, ctx }: { data: Record<string, unknown>; ctx: LoomContext }) {
  // Loom has no saved-pieces tab (Kite does); its wishlist is a page of its own.
  const [tab, setTab] = useState<Tab>(ctx.accountTab === "saved" || !ctx.accountTab ? "orders" : ctx.accountTab);
  const me = ctx.customer;
  if (!me) return null;

  return (
    <section className="px-[calc(16*var(--u))] pb-[calc(40*var(--u))] md:px-[calc(60*var(--u))] md:pb-[calc(120*var(--u))]">
      <header className="flex flex-col gap-[calc(8*var(--u))] pb-[calc(24*var(--u))] md:pb-[calc(32*var(--u))]">
        <p className={cn(T.single2, "uppercase text-[#121212]/80")}>{tx(ctx, "account.eyebrow")}</p>
        <h1 data-m="account-title" className={cn(T.h3, "text-[#121212] md:text-[calc(65*var(--u))] md:leading-[calc(65*var(--u))] md:tracking-[calc(-4*var(--u))]")}>
          {fill(str(data, "greeting"), { name: me.firstName })}
        </h1>
      </header>

      <div className={cn("flex flex-col gap-[calc(24*var(--u))] pt-[calc(24*var(--u))] md:flex-row md:gap-[calc(10*var(--u))] md:pt-[calc(32*var(--u))]", LOOM_RULE)}>
        <nav aria-label={tx(ctx, "account.eyebrow")} className="md:w-[calc(322*var(--u))] md:shrink-0">
          <LoomSwipeRow className="gap-[calc(8*var(--u))] md:flex-col md:items-start md:gap-[calc(10*var(--u))]">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                aria-current={t.id === tab ? "page" : undefined}
                onClick={() => setTab(t.id)}
                className={cn(CHIP, t.id === tab ? "bg-[#121212] text-white" : "border border-[#dddddd] text-[#121212]/80")}
              >
                {tx(ctx, t.key)}
              </button>
            ))}
            {ctx.live ? (
              <button type="button" onClick={() => void kitSignOut(route(ctx, "home"))} className={cn(CHIP, "text-[#121212]/80 underline underline-offset-4")}>
                {tx(ctx, "account.signOut")}
              </button>
            ) : (
              <a href={route(ctx, "signIn")} className={cn(CHIP, "text-[#121212]/80 underline underline-offset-4")}>
                {tx(ctx, "account.signOut")}
              </a>
            )}
          </LoomSwipeRow>
        </nav>

        <div data-m="account-content" className="min-w-0 flex-1 md:pl-[calc(50*var(--u))]">
          {tab === "orders" && <Orders me={me} ctx={ctx} />}
          {tab === "addresses" && <Addresses me={me} ctx={ctx} />}
          {tab === "details" && <Details me={me} ctx={ctx} />}
        </div>
      </div>
    </section>
  );
}

const STATE_WORD = {
  ordered: "orderStatus.ordered",
  packed: "orderStatus.packed",
  shipped: "orderStatus.shipped",
  delivered: "orderStatus.delivered",
  cancelled: "orderStatus.cancelled",
} as const;

function Orders({ me, ctx }: { me: LoomCustomer; ctx: LoomContext }) {
  if (me.orders.length === 0) return <p className={cn(T.body3, "text-[#121212]/80")}>{tx(ctx, "account.noOrders")}</p>;
  return (
    <ul className="flex flex-col">
      {me.orders.map((o, i) => (
        <li
          key={o.id}
          className={cn(
            "flex flex-col gap-[calc(16*var(--u))] py-[calc(24*var(--u))] md:flex-row md:items-center md:gap-[calc(24*var(--u))]",
            i === 0 ? "pt-0" : LOOM_RULE
          )}
        >
          {/* Room for two photographs whether there are one or two, so the
              order's name starts at the same place on every row. */}
          <div className="flex gap-[calc(8*var(--u))] md:w-[calc(168*var(--u))] md:shrink-0">
            {o.items.map((it) => (
              <LoomCard key={it.title + it.src} className="h-[calc(80*var(--u))] w-[calc(80*var(--u))] rounded-[calc(24*var(--u))]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.src} alt={it.title} className="absolute inset-0 h-full w-full object-cover" />
              </LoomCard>
            ))}
          </div>
          <div className="min-w-0 flex-1">
            <p className={cn(T.body3, "text-[#121212]")}>{tx(ctx, "account.order", { id: o.id })}</p>
            <p className={cn(T.body6, "text-[#121212]/80")}>
              {o.date} · {o.items.length === 1 ? tx(ctx, "cart.itemCountOne") : tx(ctx, "cart.itemCount", { count: o.items.length })} · {money(o.total, ctx.currency)}
            </p>
          </div>
          <div className="flex items-center justify-between gap-[calc(24*var(--u))] md:justify-end">
            <p className={cn(T.body6, "flex items-center gap-[calc(8*var(--u))] text-[#121212]")}>
              <span
                aria-hidden="true"
                className={cn(
                  "h-[max(calc(8*var(--u)),7px)] w-[max(calc(8*var(--u)),7px)] rounded-full",
                  o.state === "shipped" ? "bg-[#233c6b]" : o.state === "cancelled" ? "border border-[#121212]/40" : "bg-[#121212]"
                )}
              />
              {tx(ctx, STATE_WORD[o.state])}
            </p>
            <LoomButton variant="outlineLight" href={o.href} className="min-w-[calc(100*var(--u))]">
              {tx(ctx, "account.view")}
            </LoomButton>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Addresses({ me, ctx }: { me: LoomCustomer; ctx: LoomContext }) {
  const live = !!ctx.live;
  const router = useRouter();
  const [list, setList] = useState(me.addresses);
  const [adding, setAdding] = useState(false);
  // A real shop's list comes back from the server after every change.
  const shown = live ? me.addresses : list;
  const remove = (id: string) =>
    live ? void kitDeleteAddress(id).then(() => router.refresh()) : setList((l) => l.filter((x) => x.id !== id));
  return (
    <div className="flex flex-col gap-[calc(24*var(--u))]">
      {shown.length === 0 && !adding && <p className={cn(T.body3, "text-[#121212]/80")}>{tx(ctx, "account.noAddresses")}</p>}
      <div className="grid grid-cols-1 gap-[calc(10*var(--u))] md:grid-cols-2">
        {shown.map((a) => (
          <div key={a.id} className="flex flex-col gap-[calc(16*var(--u))] rounded-[calc(24*var(--u))] border border-[#e3e3e3] p-[calc(24*var(--u))]">
            <div className="flex items-center justify-between gap-[calc(16*var(--u))]">
              <p className={cn(T.body3, "text-[#121212]")}>{a.label}</p>
              {a.main && <p className={cn(T.single2, "uppercase text-[#121212]/80")}>{tx(ctx, "account.main")}</p>}
            </div>
            <address className={cn(T.body6, "not-italic text-[#121212]/80")}>
              {a.lines.map((l) => (
                <span key={l} className="block">
                  {l}
                </span>
              ))}
            </address>
            <div className="flex gap-[calc(24*var(--u))]">
              {/* A real shop can add and remove an address; changing one is not offered yet. */}
              {!live && (
                <button type="button" className={cn(T.single2, "uppercase text-[#121212] underline underline-offset-4")}>
                  {tx(ctx, "account.edit")}
                </button>
              )}
              {live && (
                <button type="button" onClick={() => remove(a.id)} className={cn(T.single2, "uppercase text-[#121212]/80 underline underline-offset-4")}>
                  {tx(ctx, "account.removeAddressButton")}
                </button>
              )}
              {!a.main && !live && (
                <>
                  <button
                    type="button"
                    onClick={() => setList((l) => l.map((x) => ({ ...x, main: x.id === a.id })))}
                    className={cn(T.single2, "uppercase text-[#121212] underline underline-offset-4")}
                  >
                    {tx(ctx, "account.makeMain")}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(a.id)}
                    className={cn(T.single2, "uppercase text-[#121212]/80 underline underline-offset-4")}
                  >
                    {tx(ctx, "account.removeAddressButton")}
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      {live && adding ? (
        <NewAddress ctx={ctx} onDone={() => setAdding(false)} />
      ) : (
        <LoomButton variant="outline" onClick={() => setAdding(true)}>
          {tx(ctx, "account.addAddress")}
        </LoomButton>
      )}
    </div>
  );
}

/** A new address, on a real shop: the checkout's own fields and city list. */
function NewAddress({ ctx, onDone }: { ctx: LoomContext; onDone: () => void }) {
  const router = useRouter();
  const [v, setV] = useState({ label: "", line1: "", city: "", postcode: "", phone: "" });
  const [errors, setErrors] = useState<Partial<typeof v>>({});
  const [busy, setBusy] = useState(false);
  const bind = (k: keyof typeof v) => ({
    value: v[k],
    error: errors[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setV((x) => ({ ...x, [k]: e.target.value }));
      if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
    },
  });
  return (
    <form
      noValidate
      data-m="account-new-address"
      onSubmit={(e) => {
        e.preventDefault();
        const next: Partial<typeof v> = {};
        if (!v.line1.trim()) next.line1 = tx(ctx, "checkout.addressError");
        if (!v.city) next.city = tx(ctx, "checkout.cityError");
        if (!isValidPakistaniPhone(v.phone)) next.phone = tx(ctx, "checkout.phoneError");
        setErrors(next);
        if (Object.keys(next).length) return;
        setBusy(true);
        void kitAddAddress({ ...v, label: v.label.trim() || tx(ctx, "account.addressLabelHint") }).then(() => {
          router.refresh();
          onDone();
        });
      }}
      className="grid grid-cols-1 gap-[calc(16*var(--u))] rounded-[calc(24*var(--u))] border border-[#e3e3e3] p-[calc(24*var(--u))] md:grid-cols-2 md:gap-[calc(20*var(--u))]"
    >
      <LoomField label={tx(ctx, "account.addressLabel")} placeholder={tx(ctx, "account.addressLabelHint")} className="md:col-span-2" {...bind("label")} />
      <LoomField label={tx(ctx, "checkout.address")} autoComplete="street-address" className="md:col-span-2" {...bind("line1")} />
      <LoomSelectField
        label={tx(ctx, "checkout.city")}
        autoComplete="address-level2"
        options={ctx.checkout?.cities ?? []}
        placeholder={tx(ctx, "checkout.cityPlaceholder")}
        value={v.city}
        error={errors.city}
        onChange={(e) => {
          setV((x) => ({ ...x, city: e.target.value }));
          if (errors.city) setErrors((x) => ({ ...x, city: undefined }));
        }}
      />
      <LoomField label={tx(ctx, "checkout.postcode")} autoComplete="postal-code" {...bind("postcode")} />
      <LoomField label={tx(ctx, "checkout.phone")} type="tel" autoComplete="tel" inputMode="tel" className="md:col-span-2" {...bind("phone")} />
      <div className="flex flex-wrap gap-[calc(10*var(--u))] md:col-span-2">
        <LoomButton type="submit" disabled={busy}>
          {tx(ctx, "account.saveAddress")}
        </LoomButton>
        <LoomButton type="button" variant="outline" onClick={onDone}>
          {tx(ctx, "account.cancel")}
        </LoomButton>
      </div>
    </form>
  );
}

function Details({ me, ctx }: { me: LoomCustomer; ctx: LoomContext }) {
  const [saved, setSaved] = useState(false);
  // The platform has no way yet for a customer to change these, so a real
  // shop shows them as they stand rather than a Save that saves nothing.
  if (ctx.live) {
    return (
      <div className="flex flex-col gap-[calc(20*var(--u))] md:w-[calc(654*var(--u))]">
        <div className="grid grid-cols-1 gap-[calc(16*var(--u))] md:grid-cols-2 md:gap-[calc(20*var(--u))]">
          <LoomField label={tx(ctx, "checkout.firstName")} defaultValue={me.firstName} readOnly />
          <LoomField label={tx(ctx, "checkout.lastName")} defaultValue={me.lastName} readOnly />
          <LoomField label={tx(ctx, "checkout.email")} defaultValue={me.email} readOnly className="md:col-span-2" />
          <LoomField label={tx(ctx, "checkout.phone")} defaultValue={me.phone} readOnly className="md:col-span-2" />
        </div>
        <p className={cn(T.body6, "text-[#121212]/80")}>{tx(ctx, "account.detailsNote")}</p>
      </div>
    );
  }
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setSaved(true);
      }}
      onChange={() => setSaved(false)}
      className="flex flex-col gap-[calc(20*var(--u))] md:w-[calc(654*var(--u))]"
    >
      <div className="grid grid-cols-1 gap-[calc(16*var(--u))] md:grid-cols-2 md:gap-[calc(20*var(--u))]">
        <LoomField label={tx(ctx, "checkout.firstName")} defaultValue={me.firstName} autoComplete="given-name" />
        <LoomField label={tx(ctx, "checkout.lastName")} defaultValue={me.lastName} autoComplete="family-name" />
        <LoomField label={tx(ctx, "checkout.email")} type="email" defaultValue={me.email} autoComplete="email" className="md:col-span-2" />
        <LoomField label={tx(ctx, "checkout.phone")} type="tel" defaultValue={me.phone} autoComplete="tel" className="md:col-span-2" />
      </div>
      <div className="flex flex-wrap items-center gap-[calc(16*var(--u))]">
        <LoomButton type="submit">{tx(ctx, "account.saveDetails")}</LoomButton>
        {saved && (
          <p role="status" className={cn(T.body6, "text-[#121212]/80")}>
            {tx(ctx, "account.saved")}
          </p>
        )}
      </div>
    </form>
  );
}
