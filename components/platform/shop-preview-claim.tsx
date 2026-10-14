"use client";

import { useState } from "react";
import { ArrowRight, Check, Lock, ShoppingBag } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { subdomainProblem, suggestSubdomain } from "@/lib/shop-context";

/**
 * The front page's last ask, made into a preview: type a shop's name and the
 * shop starts to exist beside the field — the address bar shows the free
 * address it would get, the header carries the name, the banner welcomes
 * people to it.
 *
 * The address follows sign-up's own rules (suggestSubdomain, subdomainProblem
 * in lib/shop-context.ts), so a reserved or too-short name is refused here as
 * it would be there. Whether a name is taken needs the database, so this does
 * not say "available" — sign-up says yes or no. The products in the picture
 * are a sample, and say so.
 */
const pkr = (n: number) => formatMoney(n, "PKR");
const SAMPLE: [string, string, number][] = [
  ["/platform/loom-1.jpg", "High Top", 8900],
  ["/platform/loom-2.jpg", "Runner", 6500],
  ["/platform/loom-3.jpg", "Court", 5200],
];

export function ShopPreviewClaim({ platformDomain, signupHref }: { platformDomain: string; signupHref: string }) {
  const [name, setName] = useState("");
  const shown = name.trim() || "Your shop";
  const sub = suggestSubdomain(name);
  const problem = name.trim() ? (sub ? subdomainProblem(sub) : "Use at least three letters or numbers.") : null;
  const ok = !!sub && !problem;

  return (
    <div className="grid grid-cols-1 items-center gap-12 text-left lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14">
      {/* The ask. */}
      <div className="min-w-0">
        <h2 className="text-[2.6rem] font-semibold leading-[1.0] tracking-[-0.045em] text-white sm:text-[4.2rem]">Your shop could be open before dinner.</h2>
        <p className="mt-5 max-w-md text-[1.05rem] leading-relaxed text-white/85">Type its name. Watch it start to exist.</p>

        <form
          onSubmit={(e) => {
            // Sign-up has no field to fill from here yet, so this opens it; the name is typed there once more.
            e.preventDefault();
            window.location.assign(signupHref);
          }}
          className="mt-8 flex flex-col gap-2 rounded-[22px] border border-white/50 bg-white/25 p-2 backdrop-blur-xl sm:flex-row sm:items-center sm:rounded-full"
        >
          <label htmlFor="lp-shop-name" className="sr-only">
            Your shop&rsquo;s name
          </label>
          <input
            id="lp-shop-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your shop’s name"
            autoComplete="organization"
            maxLength={40}
            className="h-12 min-w-0 flex-1 bg-transparent px-4 text-base text-white outline-none placeholder:text-white/85 sm:px-5"
          />
          <button type="submit" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-[#0d0d50] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#6666ff]">
            Create my shop
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
        <p aria-live="polite" className="mt-4 min-h-[1.5em] text-[13px] font-medium text-white">
          {problem ? (
            <span className="rounded-full bg-[#0d0d50]/55 px-3 py-1">{problem}</span>
          ) : ok ? (
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4" /> That address works. You can connect your own domain later.
            </span>
          ) : (
            "No card to start. Your free address works the moment you sign up."
          )}
        </p>
      </div>

      {/* The shop, starting to exist. */}
      <div aria-hidden className="relative min-w-0">
        <div className="absolute -inset-10 -z-10 bg-[radial-gradient(closest-side,rgba(255,255,255,0.35),rgba(255,255,255,0))]" />
        <div className="overflow-hidden rounded-[22px] bg-white shadow-[0_40px_90px_-30px_rgba(13,13,80,0.55)] ring-1 ring-white/60">
          {/* The address bar. */}
          <div className="flex items-center gap-3 border-b border-[#0d0d50]/[0.06] bg-[#f6f6fb] px-4 py-3">
            <span className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff8a80]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#ffd27a]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#7fdcab]" />
            </span>
            <span className="flex min-w-0 flex-1 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 font-mono text-[11.5px] text-[#0d0d50]/70 ring-1 ring-[#0d0d50]/[0.06]">
              <Lock className={`h-3 w-3 shrink-0 ${ok ? "text-[#3aa57a]" : "text-[#0d0d50]/35"}`} />
              <span className="truncate">
                <span className={ok ? "font-semibold text-[#6666ff]" : ""}>{sub || "yourshop"}</span>.{platformDomain}
              </span>
            </span>
          </div>

          {/* The shop. */}
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="truncate text-[17px] font-bold tracking-tight text-[#0d0d50]">{shown}</span>
              <span className="flex items-center gap-4 text-[11.5px] text-[#0d0d50]/55">
                <span className="hidden sm:inline">Shop</span>
                <span className="hidden sm:inline">About</span>
                <ShoppingBag className="h-4 w-4 text-[#0d0d50]" />
              </span>
            </div>
            <div className="relative mt-4 overflow-hidden rounded-[16px] bg-[linear-gradient(120deg,#b7b9ff_0%,#c8e7ff_55%,#b8efd6_100%)] px-5 py-7">
              <div className="absolute inset-0 bg-[radial-gradient(rgba(13,13,80,0.08)_1px,transparent_1px)] bg-[size:14px_14px]" />
              <p className="relative text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0d0d50]/55">Now open</p>
              <p className="relative mt-1 break-words text-[22px] leading-tight font-semibold tracking-[-0.02em] text-[#0d0d50] sm:text-[26px]">Welcome to {shown}</p>
              <span className="relative mt-3 inline-flex rounded-full bg-[#0d0d50] px-3.5 py-1.5 text-[11px] font-semibold text-white">Shop now</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2.5">
              {SAMPLE.map(([src, t, p]) => (
                <div key={t}>
                  <div className="aspect-square overflow-hidden rounded-[12px] bg-[#f1f1f1]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </div>
                  <p className="mt-1.5 text-[11px] font-semibold text-[#0d0d50]">{t}</p>
                  <p className="text-[10.5px] text-[#0d0d50]/55">{pkr(p)}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-center text-[10px] text-[#0d0d50]/35">Sample products. Yours go here.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
