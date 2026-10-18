"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpCircle, Copy, Eye, MoreHorizontal, Paintbrush, PenLine, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/next-admin/bits";
import { Status, btn } from "@/components/next-admin/ui";
import { A } from "@/components/next-admin/nav";
import { THEME_COPIES } from "@/lib/new-admin/sample";

/**
 * Themes (third design): the live copy as one wide panel, the library as a
 * list of rows with their versions, and the Theme Store as two more rows.
 * A shop owns copies, not themes; publishing swaps, with Undo.
 */
export function Themes() {
  const toast = useToast();
  const [copies, setCopies] = useState(THEME_COPIES);
  const [menu, setMenu] = useState<string | null>(null);
  const live = copies.find((c) => c.live)!;
  const rest = copies.filter((c) => !c.live);
  const act = (id: string, what: string) => {
    setMenu(null);
    const before = copies;
    const c = copies.find((x) => x.id === id)!;
    if (what === "publish") { setCopies(copies.map((x) => ({ ...x, live: x.id === id }))); toast(`${c.name} is live`, () => setCopies(before)); }
    else if (what === "update") { setCopies(copies.map((x) => (x.id === id ? { ...x, version: x.latest } : x))); toast(`${c.name} updated to ${c.latest}. Your edits kept.`, () => setCopies(before)); }
    else if (what === "duplicate") { setCopies([...copies, { ...c, id: `${c.id}d`, name: `${c.name} (copy)`, live: false, added: "Just now" }]); toast(`Copied ${c.name}`, () => setCopies(before)); }
    else if (what === "delete") { setCopies(copies.filter((x) => x.id !== id)); toast(`${c.name} deleted`, () => setCopies(before)); }
    else toast(`${what} ${c.name}`);
  };
  return (
    <>
      <section className="grid overflow-hidden rounded-[8px] border border-[#e4e4e7] bg-white md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <Image src={live.image} alt={`${live.name}, live`} width={1440} height={1000} className="aspect-[16/10] w-full border-[#e4e4e7] bg-[#f4f4f5] object-cover object-top md:border-r" />
        <div className="flex flex-col justify-center gap-1.5 p-4">
          <Status tone="good">Live on zohralawn.pk</Status>
          <h2 className="text-[18px] font-semibold tracking-[-0.01em]">{live.name}</h2>
          <p className="text-[12.5px] text-[#71717a]">{live.theme} · version {live.version} · added {live.added}</p>
          {live.version !== live.latest && (
            <button type="button" onClick={() => act(live.id, "update")} className="mt-1 inline-flex items-center gap-1.5 self-start text-[12.5px] font-medium text-[#4f46e5] hover:underline"><ArrowUpCircle className="h-3.5 w-3.5" /> Update to {live.latest}, keeping your edits</button>
          )}
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button type="button" onClick={() => toast("Opening the customiser")} className={btn("primary")}><Paintbrush /> Customise</button>
            <button type="button" onClick={() => toast("Opening your store")} className={btn()}><Eye /> View</button>
            <Link href={`${A}/online-store/look#type`} className={btn()}>Colours and type</Link>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[8px] border border-[#e4e4e7] bg-white">
        <div className="flex h-10 items-center justify-between border-b border-[#f0f0f2] px-4">
          <h2 className="text-[13px] font-semibold">Your library <span className="font-normal text-[#a1a1aa]">{rest.length}</span></h2>
          <span className="text-[12px] text-[#71717a]">Try changes on a copy. Customers only see the live one.</span>
        </div>
        <ul className="divide-y divide-[#f0f0f2]">
          {rest.map((c) => (
            <li key={c.id} className="relative flex h-14 items-center gap-3 px-3">
              <Image src={c.image} alt="" width={160} height={100} className="h-10 w-16 shrink-0 rounded-[4px] bg-[#f4f4f5] object-cover object-top" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium">{c.name}</span>
                <span className="block text-[12px] text-[#71717a]">{c.theme} {c.version} · added {c.added}{c.version !== c.latest && <span className="text-[#4f46e5]"> · update to {c.latest} available</span>}</span>
              </span>
              <button type="button" onClick={() => act(c.id, "Customising")} className={btn("ghost", true)}>Customise</button>
              <button type="button" onClick={() => act(c.id, "publish")} className={btn("secondary", true)}>Publish</button>
              <button type="button" aria-label={`More for ${c.name}`} onClick={() => setMenu(menu === c.id ? null : c.id)} className="grid h-7 w-7 place-items-center rounded-[6px] text-[#71717a] hover:bg-[#f4f4f5]"><MoreHorizontal className="h-4 w-4" /></button>
              {menu === c.id && (
                <div className="absolute right-3 top-12 z-10 w-44 overflow-hidden rounded-[8px] bg-white p-1 shadow-[0_20px_50px_-18px_rgba(0,0,0,0.4)] ring-1 ring-black/10">
                  {([["Preview", Eye, "Previewing"], ["Rename", PenLine, "Renaming"], ["Duplicate", Copy, "duplicate"], ...(c.version !== c.latest ? [["Update", ArrowUpCircle, "update"]] : []), ["Delete", Trash2, "delete"]] as [string, typeof Eye, string][]).map(([l, I, w]) => (
                    <button key={l} type="button" onClick={() => act(c.id, w)} className={`flex h-8 w-full items-center gap-2 rounded-[6px] px-2.5 text-[13px] hover:bg-[#f4f4f5] ${l === "Delete" ? "text-[#b91c1c]" : ""}`}><I className="h-3.5 w-3.5" /> {l}</button>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="overflow-hidden rounded-[8px] border border-[#e4e4e7] bg-white">
        <div className="flex h-10 items-center justify-between border-b border-[#f0f0f2] px-4">
          <h2 className="text-[13px] font-semibold">Theme Store <span className="font-normal text-[#71717a]">· every theme is included</span></h2>
          <a href="/theme-store" className="text-[12.5px] font-medium text-[#4f46e5] hover:underline">See them all</a>
        </div>
        <ul className="divide-y divide-[#f0f0f2]">
          {[["Kite", "Dark and editorial, for a fashion label", "/platform/theme-kite.jpg"], ["Loom", "Clean and roomy, a safe first choice", "/platform/theme-loom.jpg"]].map(([n, d, img]) => (
            <li key={n} className="flex h-14 items-center gap-3 px-3">
              <Image src={img} alt="" width={160} height={100} className="h-10 w-16 shrink-0 rounded-[4px] bg-[#f4f4f5] object-cover object-top" />
              <span className="min-w-0 flex-1"><span className="block text-[13px] font-medium">{n}</span><span className="block truncate text-[12px] text-[#71717a]">{d}</span></span>
              <button type="button" onClick={() => toast(`A copy of ${n} added to your library`)} className={btn("secondary", true)}><Plus /> Add to library</button>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
