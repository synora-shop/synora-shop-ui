"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Keeps the figures current without a reload.
 *
 * Off by default, and deliberately. Most of this screen is orders and revenue,
 * which do not move minute to minute; polling them is work nobody asked for. It
 * earns its place for the live visitor count, which is the one figure that is
 * wrong the moment it is drawn.
 *
 * router.refresh() re-runs the server components and swaps the result in, so
 * the page does not flash and whatever the merchant had hovered or scrolled to
 * stays where it was.
 */
export function LiveToggle({ seconds = 30 }: { seconds?: number }) {
  const router = useRouter();
  const [on, setOn] = useState(false);
  const [ago, setAgo] = useState(0);

  useEffect(() => {
    if (!on) return;
    const tick = setInterval(() => setAgo((a) => a + 1), 1000);
    const refresh = setInterval(() => {
      router.refresh();
      setAgo(0);
    }, seconds * 1000);
    return () => {
      clearInterval(tick);
      clearInterval(refresh);
    };
  }, [on, seconds, router]);

  return (
    <button
      type="button"
      onClick={() => { setOn((v) => !v); setAgo(0); }}
      aria-pressed={on}
      className={cn(
        "flex h-10 items-center gap-1.5 rounded-pill border px-3 text-xs transition-colors",
        on ? "border-transparent bg-brand-500 text-white" : "border-control-line bg-control text-control-ink hover:text-ink"
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", on ? "animate-pulse bg-white" : "bg-control-soft")} aria-hidden />
      {on ? `Live · ${ago}s ago` : "Live off"}
    </button>
  );
}
