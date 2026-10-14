"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, Search, X } from "lucide-react";
import { SECTIONS } from "@/components/platform/sections";

/**
 * The header's menu on a phone (14 October), where the section links do not
 * fit: Docs, Help, Release notes and search, in a sheet under the header.
 */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open]);
  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="grid h-10 w-10 place-items-center rounded-full text-[#0d0d50] hover:bg-[#f2f2ff]"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      {open && (
        <div className="absolute inset-x-0 top-[calc(100%+8px)] rounded-[1.4rem] bg-white p-2 shadow-[0_30px_80px_-24px_rgba(13,13,80,0.45)] ring-1 ring-[#0d0d50]/10">
          {SECTIONS.map(({ id, href, label, icon: Icon, dot }) => (
            <Link key={id} href={href} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-3 text-[16px] font-semibold text-[#0d0d50] hover:bg-[#f6f6ff]">
              <span className={`h-2 w-2 rounded-full ${dot}`} />
              <Icon className="h-5 w-5 text-[#0d0d50]/50" />
              {label}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              window.dispatchEvent(new Event("synora:search"));
            }}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[16px] font-semibold text-[#0d0d50] hover:bg-[#f6f6ff]"
          >
            <span className="h-2 w-2 rounded-full bg-transparent" />
            <Search className="h-5 w-5 text-[#0d0d50]/50" /> Search
          </button>
        </div>
      )}
    </div>
  );
}
