"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { KitLink } from "@/lib/themes/kit";
import { kt } from "@/components/kite/type";

/**
 * The phone's menu: what the header's glyph opens. The file draws the glyph
 * and not the panel, so this is the plainest thing in Kite's own terms
 * (decided 8 October, to replace when a design exists): the ground, the same
 * links as the desktop's menu in the same SF Pro Light 16 capitals — a link
 * with links under it lists them, indented 16 — and a close in the glyph's
 * place. Nothing in it is new type, colour or measure.
 */
export function KiteMenuPanel({ items, icon }: { items: KitLink[]; icon: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = "";
    };
  }, [open]);
  const link = cn(kt("sans", 16).className, "uppercase");
  return (
    <>
      <button
        type="button"
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="absolute left-[calc(16*var(--u))] top-[calc(24.5*var(--u))] h-[calc(20*var(--u))] w-[calc(20*var(--u))] md:hidden"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={icon} alt="" className="h-full w-full object-contain" />
      </button>
      {open ? (
        <div role="dialog" aria-modal="true" aria-label="Menu" className="fixed inset-0 z-50 bg-[#040404] md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute left-[calc(16*var(--u))] top-[calc(24.5*var(--u))] h-[calc(20*var(--u))] w-[calc(20*var(--u))] text-[#f4f3f1]"
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1} className="h-full w-full">
              <path d="M4 4 16 16M16 4 4 16" />
            </svg>
          </button>
          <nav aria-label="Main" className="flex flex-col gap-[calc(32*var(--u))] px-[calc(16*var(--u))] pt-[calc(107*var(--u))]">
            {items.map((l) => (
              <div key={l.id} className="flex flex-col gap-[calc(16*var(--u))]">
                <a href={l.href} {...kt("sans", 16)} className={link} onClick={() => setOpen(false)}>
                  {l.label}
                </a>
                {l.children?.map((c) => (
                  <a key={c.id} href={c.href} {...kt("sans", 16)} className={cn(link, "pl-[calc(16*var(--u))] opacity-80")} onClick={() => setOpen(false)}>
                    {c.label}
                  </a>
                ))}
              </div>
            ))}
          </nav>
        </div>
      ) : null}
    </>
  );
}
