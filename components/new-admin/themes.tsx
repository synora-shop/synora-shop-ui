"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpCircle, Copy, Eye, MoreHorizontal, Paintbrush, PenLine, Plus, Trash2, Upload } from "lucide-react";
import { Pill } from "@/components/new-admin/ui";
import { useToast } from "@/components/new-admin/shell";
import { THEME_COPIES } from "@/lib/new-admin/sample";

/**
 * Themes (preview), as Synora's themes actually work: a shop owns copies, not
 * themes. The live copy on top, every copy below it (Loom twice is allowed,
 * two sets of edits), each with its version and an Update when a newer one
 * ships; the Theme Store along the bottom. Publishing swaps, with Undo.
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
    if (what === "publish") {
      setCopies(copies.map((x) => ({ ...x, live: x.id === id })));
      toast(`${c.name} is live`, () => setCopies(before));
    } else if (what === "update") {
      setCopies(copies.map((x) => (x.id === id ? { ...x, version: x.latest } : x)));
      toast(`${c.name} updated to ${c.latest}. Your edits kept.`, () => setCopies(before));
    } else if (what === "duplicate") {
      setCopies([...copies, { ...c, id: `${c.id}d`, name: `${c.name} (copy)`, live: false, added: "Just now" }]);
      toast(`Copied ${c.name}`, () => setCopies(before));
    } else if (what === "delete") {
      setCopies(copies.filter((x) => x.id !== id));
      toast(`${c.name} deleted`, () => setCopies(before));
    } else toast(`${what} ${c.name}`);
  };

  return (
    <>
      <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-[#0a0a0a]/[0.07] lg:grid lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="relative bg-[#0a0a0a] p-3">
          <div className="overflow-hidden rounded-xl">
            <Image src={live.image} alt={`${live.name}, live`} width={1440} height={1000} className="w-full object-cover" />
          </div>
        </div>
        <div className="flex flex-col justify-center gap-3 p-6 sm:p-8">
          <Pill tone="good">Live on zohralawn.pk</Pill>
          <h2 className="text-[26px] font-semibold tracking-[-0.02em]">{live.name}</h2>
          <p className="text-[14px] text-[#0a0a0a]/55">{live.theme} · version {live.version} · added {live.added}</p>
          {live.version !== live.latest && (
            <button type="button" onClick={() => act(live.id, "update")} className="inline-flex items-center gap-2 self-start rounded-[10px] bg-[#ecebff] px-3 py-2 text-[13px] font-semibold text-[#4b4bea]">
              <ArrowUpCircle className="h-4 w-4" /> Update to {live.latest}, keeping your edits
            </button>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" onClick={() => toast("Opening the customiser")} className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-[#0a0a0a] px-4 text-[13.5px] font-semibold text-white"><Paintbrush className="h-4 w-4" /> Customise</button>
            <button type="button" onClick={() => toast("Opening your store")} className="inline-flex h-10 items-center gap-2 rounded-[10px] px-4 text-[13.5px] font-semibold ring-1 ring-[#0a0a0a]/12"><Eye className="h-4 w-4" /> View</button>
            <Link href="/new-admin/online-store/look#type" className="inline-flex h-10 items-center gap-2 rounded-[10px] px-4 text-[13.5px] font-semibold ring-1 ring-[#0a0a0a]/12 hover:bg-[#f5f5f5]">Colours and type</Link>
          </div>
        </div>
      </section>

      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-semibold">Your library <span className="text-[#0a0a0a]/40">{rest.length}</span></h2>
        <span className="text-[13px] text-[#0a0a0a]/50">Try changes on a copy. Customers only ever see the live one.</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {rest.map((c) => (
          <article key={c.id} className="relative flex gap-4 rounded-2xl bg-white p-3.5 ring-1 ring-[#0a0a0a]/[0.07]">
            <Image src={c.image} alt="" width={1440} height={1000} className="h-24 w-36 shrink-0 rounded-lg object-cover" />
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
              <p className="truncate text-[15px] font-semibold">{c.name}</p>
              <p className="text-[12.5px] text-[#0a0a0a]/50">{c.theme} {c.version} · added {c.added}</p>
              {c.version !== c.latest && <span className="text-[12.5px] font-semibold text-[#4b4bea]">Update to {c.latest} available</span>}
              <div className="mt-1 flex gap-1.5">
                <button type="button" onClick={() => act(c.id, "publish")} className="rounded-[9px] bg-[#0a0a0a] px-3 py-1.5 text-[12.5px] font-semibold text-white">Publish</button>
                <button type="button" onClick={() => act(c.id, "Customising")} className="rounded-[9px] px-3 py-1.5 text-[12.5px] font-semibold ring-1 ring-[#0a0a0a]/12">Customise</button>
              </div>
            </div>
            <button type="button" aria-label={`More for ${c.name}`} onClick={() => setMenu(menu === c.id ? null : c.id)} className="grid h-8 w-8 place-items-center self-start rounded-lg hover:bg-[#f0f0f0]"><MoreHorizontal className="h-4 w-4" /></button>
            {menu === c.id && (
              <div className="absolute right-3 top-12 z-10 w-48 overflow-hidden rounded-xl bg-white p-1 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.35)] ring-1 ring-[#0a0a0a]/10">
                {([["Preview", Eye, "Previewing"], ["Rename", PenLine, "Renaming"], ["Duplicate", Copy, "duplicate"], ...(c.version !== c.latest ? [["Update", ArrowUpCircle, "update"]] : []), ["Delete", Trash2, "delete"]] as [string, typeof Eye, string][]).map(([l, I, w]) => (
                  <button key={l} type="button" onClick={() => act(c.id, w)} className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] hover:bg-[#f5f5f5] ${l === "Delete" ? "text-[#a3330c]" : ""}`}><I className="h-4 w-4" /> {l}</button>
                ))}
              </div>
            )}
          </article>
        ))}
        <a href="/theme-store" className="flex min-h-[8rem] flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-[#0a0a0a]/12 text-center hover:border-[#0a0a0a]/30">
          <Plus className="h-5 w-5 text-[#0a0a0a]/45" />
          <span className="text-[14px] font-semibold">Add a theme</span>
          <span className="text-[12.5px] text-[#0a0a0a]/50">From the Theme Store, all included</span>
        </a>
      </div>

      <section className="rounded-2xl bg-[#0a0a0a] p-6 text-white">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#b7b9ff]">Theme Store</p>
            <p className="mt-1 text-[20px] font-semibold">Every theme is included.</p>
          </div>
          <a href="/theme-store" className="text-[13.5px] font-semibold text-white/75 hover:text-white">See them all</a>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[["Kite", "Dark and editorial, for a fashion label", "/platform/theme-kite.jpg"], ["Loom", "Clean and roomy, a safe first choice", "/platform/theme-loom.jpg"]].map(([n, d, img]) => (
            <div key={n} className="flex items-center gap-4 rounded-xl bg-white/[0.06] p-3">
              <Image src={img} alt="" width={1440} height={1000} className="h-16 w-24 rounded-lg object-cover" />
              <div className="min-w-0 flex-1"><p className="font-semibold">{n}</p><p className="truncate text-[12.5px] text-white/55">{d}</p></div>
              <button type="button" onClick={() => toast(`A copy of ${n} added to your library`)} className="inline-flex items-center gap-1 rounded-[9px] bg-white px-3 py-1.5 text-[12.5px] font-semibold text-[#0a0a0a]"><Upload className="h-3.5 w-3.5 rotate-180" /> Add</button>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
