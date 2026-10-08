"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { on, str, type KiteContext } from "@/components/kite/contract";
import { kt } from "@/components/kite/type";
import { kiteMoney } from "@/components/kite/money";
import { useKitCart } from "@/lib/themes/kit-actions";

/** The file's plus: two 10.5 strokes in an 18 square. Open, the upright goes. */
function Plus({ open }: { open: boolean }) {
  return (
    <svg aria-hidden viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth={1} className="h-[calc(18*var(--u))] w-[calc(18*var(--u))] shrink-0">
      <path d={open ? "M3.75 9h10.5" : "M3.75 9h10.5M9 3.75v10.5"} />
    </svg>
  );
}

/** "350" in "limited to **350** pieces" — the file's one Semibold run. */
function Bolded({ text }: { text: string }) {
  return (
    <>
      {text.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? <strong key={i} className="font-semibold">{part}</strong> : part))}
    </>
  );
}

/**
 * The product — "Product Page" and "Mobile | Product Page" in the file.
 *
 * Desktop (the 966 under the header): three views 200x179, 32 apart, at
 * 32,0; the main photograph 1099x600 at 264,0 — a crop window, the photo
 * drawn 1099 square and 349.8 up; at 1363,0 a column 365 wide, its contents
 * 32 in: the maker in Meddon 16 after "by", the name in the serif 36; the
 * words (SF Pro Light 14); the price; the colour between two half-ink rules
 * (its value in the serif); the sizes spread evenly; the note (12, its number
 * Semibold); the light button and the underlined favourite, 16 apart; 64
 * below, DETAILS and SHIPPING, each 51 high under a half-ink rule with the
 * file's plus. Beside that column, from 32,665: "Style with" in Khand 32 and
 * three pieces 350 wide, each named and priced on a black band laid over the
 * photograph's foot.
 *
 * Phone (the 849 under the header): the name at 16,0; at 16,104 the main
 * photograph 408x264, the three views 125.33x80 16 apart, the note at 14,
 * the colour, DETAILS and SHIPPING; the button at 16,743. The file draws no
 * price, sizes or words on the phone, and none are shown there.
 *
 * Not drawn, so in Kite's own terms (decided 8 October): a chosen size is
 * underlined; an open row's plus loses its upright and its words follow in
 * 14; choosing a view shows it as the main photograph.
 */
export function KiteProduct({ data, ctx }: { data: Record<string, unknown>; ctx: KiteContext }) {
  const p = ctx.product;
  const cart = useKitCart();
  const [main, setMain] = useState(0);
  const [size, setSize] = useState<string | null>(null);
  const [open, setOpen] = useState<"details" | "shipping" | null>(null);
  const [said, setSaid] = useState<string | null>(null);
  if (!p) return null;
  const photos = p.photos;
  const views = photos.slice(1, 4);
  const colour = p.colours[0]?.label ?? "";
  const pieces = ctx.products.slice(0, 3);

  const add = () => {
    if (!ctx.live) return setSaid(null);
    if (p.sizes.length && !size) return setSaid("Choose a size.");
    setSaid(cart.add(p, { colour, size: size ?? undefined }, 1) ? "Added to your bag." : "That one is not available.");
  };

  const t16 = kt("sans", 16);
  const rows = (
    <>
      {[
        { key: "details" as const, label: str(data, "detailsLabel"), body: p.details.map((d) => `${d.title}\n${d.body}`).join("\n\n") || p.description },
        { key: "shipping" as const, label: str(data, "shippingLabel"), body: str(data, "shippingText") },
      ].map((r, i) => (
        <div key={r.key}>
          <button
            type="button"
            aria-expanded={open === r.key}
            onClick={() => setOpen(open === r.key ? null : r.key)}
            // Half-ink rule over each row — over DETAILS on the desktop only,
            // where the file draws it (the phone's sits under the colour).
            // Written out whole: Tailwind only builds classes it can read.
            className={cn(
              "flex h-[calc(51*var(--u))] w-full items-start justify-between pt-[calc(16*var(--u))] text-left",
              i === 0 ? "md:shadow-[inset_0_1px_0_rgba(244,243,241,0.5)]" : "shadow-[inset_0_1px_0_rgba(244,243,241,0.5)]"
            )}
          >
            <span {...t16} className={cn(t16.className, "uppercase")}>{r.label}</span>
            <Plus open={open === r.key} />
          </button>
          {open === r.key && r.body ? (
            <p {...kt("sans", 14)} className={cn(kt("sans", 14).className, "whitespace-pre-line pb-[calc(16*var(--u))]")}>{r.body}</p>
          ) : null}
        </div>
      ))}
    </>
  );
  const colourRow = (
    <div className="flex h-[calc(56*var(--u))] items-start justify-between pt-[calc(16*var(--u))] shadow-[inset_0_1px_0_rgba(244,243,241,0.5),inset_0_-1px_0_rgba(244,243,241,0.5)]">
      <span {...t16} className={cn(t16.className, "uppercase")}>{str(data, "colourLabel")}</span>
      <span {...kt("serif", 16)} className={cn(kt("serif", 16).className, "uppercase")}>{colour}</span>
    </div>
  );
  const bag = (
    <div className="flex flex-col items-center gap-[calc(16*var(--u))]">
      <button type="button" onClick={add} className="flex h-[calc(39*var(--u))] w-full items-center justify-center bg-[#f4f3f1] text-[#040404]">
        <span {...t16}>{str(data, "addLabel")}</span>
      </button>
      <button type="button" {...t16} className={cn(t16.className, "underline")}>{str(data, "favouriteLabel")}</button>
      {said ? <p role="status" {...kt("sans", 14)}>{said}</p> : null}
    </div>
  );

  return (
    <section data-k="product" className="relative h-[calc(849*var(--u))] md:h-[calc(966*var(--u))]">
      {/* The name: the column's top on the desktop, the page's on the phone. */}
      <div className="absolute left-[calc(16*var(--u))] top-0 w-[calc(301*var(--u))] md:left-[calc(1395*var(--u))] md:top-[calc(32*var(--u))]">
        {p.vendor ? (
          <p {...kt("script", 16)} className={cn(kt("script", 16).className, "whitespace-nowrap")}>
            {str(data, "byLabel")} {p.vendor}
          </p>
        ) : null}
        <h1 {...kt("serif", 36)} className={cn(kt("serif", 36).className, "whitespace-nowrap uppercase")}>{p.title}</h1>
      </div>

      {/* Photographs. */}
      <div className="absolute left-[calc(16*var(--u))] top-[calc(104*var(--u))] w-[calc(408*var(--u))] md:left-[calc(264*var(--u))] md:top-0 md:w-[calc(1099*var(--u))]">
        <div className="relative h-[calc(264*var(--u))] overflow-hidden md:h-[calc(600*var(--u))]">
          {photos[main] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photos[main].src}
              alt={photos[main].alt}
              className={cn("absolute inset-x-0 w-full", main === 0 ? "top-0 h-full object-cover md:top-[calc(-349.8*var(--u))] md:h-[calc(1099*var(--u))]" : "top-0 h-full object-cover")}
            />
          ) : null}
        </div>
      </div>
      <div className="absolute left-[calc(16*var(--u))] top-[calc(384*var(--u))] flex gap-[calc(16*var(--u))] md:left-[calc(32*var(--u))] md:top-0 md:flex-col md:gap-[calc(32*var(--u))]">
        {views.map((v, i) => (
          <button
            key={v.src}
            type="button"
            aria-label={v.alt}
            aria-pressed={main === i + 1}
            onClick={() => setMain(main === i + 1 ? 0 : i + 1)}
            className="relative h-[calc(80*var(--u))] w-[calc(125.33*var(--u))] overflow-hidden md:h-[calc(179*var(--u))] md:w-[calc(200*var(--u))]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={v.src} alt="" className="absolute inset-0 h-full w-full object-cover" />
          </button>
        ))}
      </div>

      {/* Desktop column, under the name: words, price, colour, sizes, note, bag, rows. */}
      <div className="absolute left-[calc(1395*var(--u))] top-[calc(184*var(--u))] hidden w-[calc(301*var(--u))] md:block">
        <p {...kt("sans", 14)}>{p.description}</p>
      </div>
      <div className="absolute left-[calc(1395*var(--u))] top-[calc(316*var(--u))] hidden w-[calc(301*var(--u))] md:block">
        <div className="flex h-[calc(51*var(--u))] items-start pt-[calc(16*var(--u))]">
          <span {...t16} className={cn(t16.className, "uppercase")}>{ctx.live ? kiteMoney(p.amount, ctx.currency) : p.price}</span>
        </div>
        {colourRow}
      </div>
      <div className="absolute left-[calc(1395*var(--u))] top-[calc(487*var(--u))] hidden w-[calc(301*var(--u))] justify-evenly md:flex" role="radiogroup" aria-label="Size">
        {p.sizes.map((s) => (
          <button
            key={s.label}
            type="button"
            role="radio"
            aria-checked={size === s.label}
            disabled={s.soldOut}
            onClick={() => setSize(s.label)}
            {...t16}
            className={cn(t16.className, size === s.label && "underline", s.soldOut && "opacity-40")}
          >
            {s.label}
          </button>
        ))}
      </div>
      {str(data, "note") ? (
        <p
          {...kt("sans", 14, 12)}
          className={cn(kt("sans", 14, 12).className, "absolute left-[calc(16*var(--u))] top-[calc(500*var(--u))] w-[calc(408*var(--u))] md:left-[calc(1395*var(--u))] md:top-[calc(570*var(--u))] md:w-[calc(301*var(--u))]")}
        >
          <Bolded text={str(data, "note")} />
        </p>
      ) : null}
      <div className="absolute left-[calc(1395*var(--u))] top-[calc(648*var(--u))] hidden w-[calc(301*var(--u))] flex-col gap-[calc(64*var(--u))] md:flex">
        {bag}
        <div>{rows}</div>
      </div>

      {/* Phone: colour and the rows under the note; the bag at 743. */}
      <div className="absolute left-[calc(16*var(--u))] top-[calc(533*var(--u))] w-[calc(408*var(--u))] md:hidden">
        {colourRow}
        {rows}
      </div>
      <div className="absolute left-[calc(16*var(--u))] top-[calc(743*var(--u))] w-[calc(408*var(--u))] md:hidden">{bag}</div>

      {/* Desktop: "Style with", beside the column. */}
      {on(data, "showStyleWith") && pieces.length ? (
        <div className="absolute left-[calc(32*var(--u))] top-[calc(665*var(--u))] hidden w-[calc(1114*var(--u))] flex-col gap-[calc(32*var(--u))] md:flex">
          <h2 {...kt("khand", 32)}>{str(data, "styleHeading")}</h2>
          <div className="flex gap-[calc(32*var(--u))]">
            {pieces.map((x) => (
              <a key={x.id} href={x.href} className="relative block h-[calc(204.1*var(--u))] w-[calc(350*var(--u))] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={x.src} alt={x.title} className="absolute inset-0 h-full w-full object-cover" />
                <span className="absolute inset-x-0 top-[calc(148*var(--u))] flex h-[calc(56*var(--u))] items-start justify-between bg-black px-[calc(16*var(--u))] pt-[calc(16*var(--u))]">
                  <span {...kt("sans", 20)} className={cn(kt("sans", 20).className, "uppercase")}>{x.title}</span>
                  <span {...kt("sans", 20)} className={cn(kt("sans", 20).className, "uppercase")}>{kiteMoney(x.price, ctx.currency)}</span>
                </span>
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
