"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { LOOM_RULE, LoomButton, LoomCard, LoomSwipeRow } from "@/components/loom/primitives";
import { LoomField, money } from "@/components/loom/commerce";
import { T } from "@/components/loom/type";

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
type Order = {
  id: string;
  date: string;
  state: "On its way" | "Delivered";
  total: number;
  items: { title: string; src: string }[];
};

const ORDERS: Order[] = [
  {
    id: "LM-12476",
    date: "4 October 2026",
    state: "On its way",
    total: 284,
    items: [
      { title: "Skateboard Shoe", src: "/loom/7150a0e902536ab1a554d315fc11f4ef6f9c1302.png" },
      { title: "Sportwear Shoe", src: "/loom/f8ae4065476b2a224ae85cd40fd6b1c7d34bc9ae.png" },
    ],
  },
  {
    id: "LM-11902",
    date: "12 September 2026",
    state: "Delivered",
    total: 225,
    items: [{ title: "Casual Shoe", src: "/loom/5a88e5962507976b1988e6d9a08599fcba5247bd.png" }],
  },
  {
    id: "LM-10317",
    date: "28 July 2026",
    state: "Delivered",
    total: 250,
    items: [
      { title: "Basket Shoe", src: "/loom/6202a986df950869c406241f2f48f416d0807241.png" },
      { title: "Skateboard Shoe", src: "/loom/0b42775b5c482fd10ff96fad137ae5ca5aa7a561.png" },
    ],
  },
];

const TABS = ["Orders", "Addresses", "Details"] as const;
type Tab = (typeof TABS)[number];

const CHIP =
  "flex h-[max(calc(50*var(--u)),40px)] shrink-0 items-center whitespace-nowrap rounded-[200px] px-[calc(19*var(--u))] text-[max(calc(14*var(--u)),11.2px)] font-medium uppercase leading-[max(calc(24*var(--u)),19.2px)] tracking-[calc(1*var(--u))]";

export function LoomAccount() {
  const [tab, setTab] = useState<Tab>("Orders");

  return (
    <section className="px-[calc(16*var(--u))] pb-[calc(40*var(--u))] md:px-[calc(60*var(--u))] md:pb-[calc(120*var(--u))]">
      <header className="flex flex-col gap-[calc(8*var(--u))] pb-[calc(24*var(--u))] md:pb-[calc(32*var(--u))]">
        <p className={cn(T.single2, "uppercase text-[#121212]/80")}>Your account</p>
        <h1 data-m="account-title" className={cn(T.h3, "text-[#121212] md:text-[calc(65*var(--u))] md:leading-[calc(65*var(--u))] md:tracking-[calc(-4*var(--u))]")}>
          Hello, Samantha
        </h1>
      </header>

      <div className={cn("flex flex-col gap-[calc(24*var(--u))] pt-[calc(24*var(--u))] md:flex-row md:gap-[calc(10*var(--u))] md:pt-[calc(32*var(--u))]", LOOM_RULE)}>
        <nav aria-label="Account" className="md:w-[calc(322*var(--u))] md:shrink-0">
          <LoomSwipeRow className="gap-[calc(8*var(--u))] md:flex-col md:items-start md:gap-[calc(10*var(--u))]">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                aria-current={t === tab ? "page" : undefined}
                onClick={() => setTab(t)}
                className={cn(CHIP, t === tab ? "bg-[#121212] text-white" : "border border-[#dddddd] text-[#121212]/80")}
              >
                {t}
              </button>
            ))}
            <a href="/loom/account/sign-in" className={cn(CHIP, "text-[#121212]/80 underline underline-offset-4")}>
              Sign out
            </a>
          </LoomSwipeRow>
        </nav>

        <div data-m="account-content" className="min-w-0 flex-1 md:pl-[calc(50*var(--u))]">
          {tab === "Orders" && <Orders />}
          {tab === "Addresses" && <Addresses />}
          {tab === "Details" && <Details />}
        </div>
      </div>
    </section>
  );
}

function Orders() {
  return (
    <ul className="flex flex-col">
      {ORDERS.map((o, i) => (
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
            <p className={cn(T.body3, "text-[#121212]")}>Order {o.id}</p>
            <p className={cn(T.body6, "text-[#121212]/80")}>
              {o.date} · {o.items.length} {o.items.length === 1 ? "item" : "items"} · {money(o.total)}
            </p>
          </div>
          <div className="flex items-center justify-between gap-[calc(24*var(--u))] md:justify-end">
            <p className={cn(T.body6, "flex items-center gap-[calc(8*var(--u))] text-[#121212]")}>
              <span
                aria-hidden="true"
                className={cn("h-[max(calc(8*var(--u)),7px)] w-[max(calc(8*var(--u)),7px)] rounded-full", o.state === "On its way" ? "bg-[#233c6b]" : "bg-[#121212]")}
              />
              {o.state}
            </p>
            <LoomButton variant="outlineLight" className="min-w-[calc(100*var(--u))]">
              View
            </LoomButton>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Addresses() {
  const [list, setList] = useState([
    { id: "home", label: "Home", lines: ["Samantha William", "12 Court Lane", "Lahore 54000", "0300 1234567"], main: true },
    { id: "work", label: "Work", lines: ["Samantha William", "4th Floor, 88 Mall Road", "Lahore 54000"], main: false },
  ]);
  return (
    <div className="flex flex-col gap-[calc(24*var(--u))]">
      <div className="grid grid-cols-1 gap-[calc(10*var(--u))] md:grid-cols-2">
        {list.map((a) => (
          <div key={a.id} className="flex flex-col gap-[calc(16*var(--u))] rounded-[calc(24*var(--u))] border border-[#e3e3e3] p-[calc(24*var(--u))]">
            <div className="flex items-center justify-between gap-[calc(16*var(--u))]">
              <p className={cn(T.body3, "text-[#121212]")}>{a.label}</p>
              {a.main && <p className={cn(T.single2, "uppercase text-[#121212]/80")}>Main</p>}
            </div>
            <address className={cn(T.body6, "not-italic text-[#121212]/80")}>
              {a.lines.map((l) => (
                <span key={l} className="block">
                  {l}
                </span>
              ))}
            </address>
            <div className="flex gap-[calc(24*var(--u))]">
              <button type="button" className={cn(T.single2, "uppercase text-[#121212] underline underline-offset-4")}>
                Edit
              </button>
              {!a.main && (
                <>
                  <button
                    type="button"
                    onClick={() => setList((l) => l.map((x) => ({ ...x, main: x.id === a.id })))}
                    className={cn(T.single2, "uppercase text-[#121212] underline underline-offset-4")}
                  >
                    Make main
                  </button>
                  <button
                    type="button"
                    onClick={() => setList((l) => l.filter((x) => x.id !== a.id))}
                    className={cn(T.single2, "uppercase text-[#121212]/80 underline underline-offset-4")}
                  >
                    Remove
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      <LoomButton variant="outline">Add an address</LoomButton>
    </div>
  );
}

function Details() {
  const [saved, setSaved] = useState(false);
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
        <LoomField label="First name" defaultValue="Samantha" autoComplete="given-name" />
        <LoomField label="Last name" defaultValue="William" autoComplete="family-name" />
        <LoomField label="Email" type="email" defaultValue="sam@example.com" autoComplete="email" className="md:col-span-2" />
        <LoomField label="Phone" type="tel" defaultValue="0300 1234567" autoComplete="tel" className="md:col-span-2" />
      </div>
      <div className="flex flex-wrap items-center gap-[calc(16*var(--u))]">
        <LoomButton type="submit">Save changes</LoomButton>
        {saved && (
          <p role="status" className={cn(T.body6, "text-[#121212]/80")}>
            Saved.
          </p>
        )}
      </div>
    </form>
  );
}
