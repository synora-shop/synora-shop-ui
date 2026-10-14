"use client";

import { useEffect, useRef, useState } from "react";
import { Globe, HelpCircle, Package, ReceiptText, Rocket, Tag, TriangleAlert, Users, Wallet, type LucideIcon } from "lucide-react";

/**
 * The documentation's index, which follows the reader: the section being read
 * is lit, on the side list on wide screens and on a sticky strip of chips on
 * phones (which also slides the lit chip into view).
 *
 * "Being read" is the last section whose top has passed just under the fixed
 * header; at the very bottom of the page it is the last section, which may be
 * too short to ever reach that line. Icons are looked up here by section id,
 * because a server page cannot hand a component to a client one.
 */
const ICONS: Record<string, LucideIcon> = {
  "getting-started": Rocket,
  products: Package,
  orders: ReceiptText,
  payments: Wallet,
  domains: Globe,
  team: Users,
  discounts: Tag,
  "known-issues": TriangleAlert,
  answers: HelpCircle,
};

const LINE = 150;

export function DocsNav({ items }: { items: { id: string; title: string }[] }) {
  const [active, setActive] = useState(items[0]?.id);
  const strip = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      let current = items[0]?.id;
      for (const { id } of items) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= LINE) current = id;
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = items[items.length - 1]?.id;
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [items]);

  // Keep the lit chip in view on the phone strip, without moving the page.
  useEffect(() => {
    const box = strip.current;
    const chip = box?.querySelector<HTMLElement>(`[data-id="${active}"]`);
    if (box && chip) box.scrollTo({ left: chip.offsetLeft - 16, behavior: "smooth" });
  }, [active]);

  return (
    <>
      {/* Wide screens: the side list. */}
      <nav aria-label="On this page" className="hidden lg:block">
        <div className="sticky top-28">
          <p className="mb-3 pl-4 text-[11px] font-bold uppercase tracking-[0.12em] text-[#0d0d50]/40">On this page</p>
          <ul className="flex flex-col gap-0.5 border-l border-[#0d0d50]/10">
            {items.map(({ id, title }) => {
              const Icon = ICONS[id] ?? HelpCircle;
              const on = id === active;
              return (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    aria-current={on ? "location" : undefined}
                    className={`-ml-px flex items-center gap-2.5 rounded-r-xl border-l-2 py-2 pl-4 pr-3 text-[14.5px] font-medium transition-colors ${
                      on ? "border-[#6666ff] bg-[#6666ff]/[0.07] text-[#4b4bea]" : "border-transparent text-[#0d0d50]/55 hover:border-[#0d0d50]/25 hover:text-[#0d0d50]"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {title}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Phones and tablets: a strip of chips under the header. */}
      <nav aria-label="On this page" className="sticky top-[76px] z-30 -mx-5 min-w-0 bg-white/90 py-3 backdrop-blur-md sm:top-[84px] lg:hidden">
        <div ref={strip} className="flex gap-2 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map(({ id, title }) => {
            const on = id === active;
            return (
              <a
                key={id}
                data-id={id}
                href={`#${id}`}
                aria-current={on ? "location" : undefined}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${on ? "bg-[#6666ff] text-white" : "bg-[#f2f2ff] text-[#0d0d50]/70"}`}
              >
                {title}
              </a>
            );
          })}
        </div>
      </nav>
    </>
  );
}
