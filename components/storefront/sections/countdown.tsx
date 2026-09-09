"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * A timer counting down to a moment.
 *
 * Rendered empty on the server and filled in after mount, deliberately. A
 * countdown is the one thing on a storefront that is wrong the instant it is
 * cached: server-rendered, every visitor for the next five minutes is told the
 * same number of seconds remain. So the markup ships with the shape and the
 * browser supplies the numbers.
 *
 * The date is read as the merchant's own local time rather than UTC, because
 * they typed it looking at a clock on their wall.
 */
function parse(input: string): number | null {
  const raw = (input ?? "").trim();
  if (!raw) return null;
  // "YYYY-MM-DD HH:MM" with a space is not a format every browser parses, and
  // Safari is the one that does not. Normalised before it is handed over.
  const ms = Date.parse(raw.replace(" ", "T"));
  return Number.isFinite(ms) ? ms : null;
}

function parts(remaining: number) {
  const s = Math.max(0, Math.floor(remaining / 1000));
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

export function Countdown({
  heading,
  endsAt,
  finishedText = "This has ended.",
  hideWhenFinished = false,
  ctaLabel,
  ctaHref,
}: {
  heading?: string;
  endsAt?: string;
  finishedText?: string;
  hideWhenFinished?: boolean;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  const target = parse(endsAt ?? "");
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (target === null) return;
    setNow(Date.now());
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, [target]);

  // No date set, or one that is not a date. Nothing to count to.
  if (target === null) return null;

  const finished = now !== null && now >= target;
  if (finished && hideWhenFinished) return null;

  const t = parts(target - (now ?? target));
  const boxes: [string, number][] = [
    ["Days", t.days],
    ["Hours", t.hours],
    ["Minutes", t.minutes],
    ["Seconds", t.seconds],
  ];

  return (
    <div className="text-center">
      {heading && <h2 className="font-serif text-3xl font-semibold">{heading}</h2>}

      {finished ? (
        <p className="mt-4 text-ink-soft">{finishedText}</p>
      ) : (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {boxes.map(([label, value]) => (
            <div key={label} className="min-w-[4.5rem] rounded-lg border border-border bg-white px-3 py-2.5">
              <div className="font-serif text-2xl font-semibold tabular-nums text-ink">
                {/* Dashes until the browser knows the time, so the first paint
                    is not a wrong number that visibly corrects itself. */}
                {now === null ? "--" : String(value).padStart(2, "0")}
              </div>
              <div className="text-[11px] uppercase tracking-wider text-ink-faint">{label}</div>
            </div>
          ))}
        </div>
      )}

      {ctaLabel && ctaHref && !finished && (
        <Link
          href={ctaHref}
          className="mt-6 inline-block rounded-full bg-brand-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
