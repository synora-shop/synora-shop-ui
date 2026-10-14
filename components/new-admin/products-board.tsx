"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { Download, FileSpreadsheet, LayoutGrid, List, Plus, Trash2, Upload, X } from "lucide-react";
import { Pill, pkr, td } from "@/components/new-admin/ui";
import { PlainTh, SortNote, SortTh, thead, useSort } from "@/components/new-admin/sort";
import { useToast } from "@/components/new-admin/shell";
import type { Product } from "@/lib/new-admin/sample";

/**
 * The catalogue (preview): rows for a shelf of spare parts, tiles for a rail
 * of dresses, and the merchant picks (remembered). Ticked products can be
 * made active, sent back to draft, or put in the Bin, each with Undo. Import
 * reads a Shopify product file and shows the plan before it writes anything.
 */
const read = () => {
  try {
    return localStorage.getItem("na-view") === "tiles";
  } catch {
    return false;
  }
};
const sub = (on: () => void) => {
  window.addEventListener("na-view", on);
  return () => window.removeEventListener("na-view", on);
};

export function ProductsBoard({ products: start, actions = true }: { products: Product[]; actions?: boolean }) {
  const toast = useToast();
  const tiles = useSyncExternalStore(sub, read, () => false);
  const setTiles = (t: boolean) => {
    try {
      localStorage.setItem("na-view", t ? "tiles" : "rows");
    } catch {}
    window.dispatchEvent(new Event("na-view"));
  };
  const [rows, setRows] = useState(start);
  const [view, setView] = useState("All");
  const [picked, setPicked] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [importing, setImporting] = useState(false);

  const shown = rows.filter((p) => {
    const v = view === "All" || (view === "Active" && p.status === "Active") || (view === "Drafts" && p.status === "Draft") || (view === "Running low" && p.stock !== null && p.stock > 0 && p.stock < 10) || (view === "Sold out" && p.stock === 0);
    return v && (!q || p.name.toLowerCase().includes(q.toLowerCase()));
  });
  const { sorted, sort, click, reset } = useSort(shown, {
    product: (p) => p.name, status: (p) => p.status, stock: (p) => p.stock ?? -1, collection: (p) => p.collection, price: (p) => p.price,
  });
  const apply = (fn: (p: Product) => Product | null, msg: string) => {
    const before = rows;
    const ids = picked;
    setRows(rows.flatMap((p) => (ids.includes(p.slug) ? (fn(p) ? [fn(p)!] : []) : [p])));
    setPicked([]);
    toast(`${ids.length} product${ids.length > 1 ? "s" : ""} ${msg}`, () => setRows(before));
  };
  const toggle = (s: string) => setPicked(picked.includes(s) ? picked.filter((x) => x !== s) : [...picked, s]);

  return (
    <>
      {actions && (
        <div className="-mt-2 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={() => setImporting(true)} className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-white px-3.5 text-[13.5px] font-semibold ring-1 ring-[#0a0a0a]/12 hover:bg-[#f5f5f5]"><Upload className="h-4 w-4" /> Import</button>
          <button type="button" onClick={() => toast("12 products exported as a Shopify file")} className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-white px-3.5 text-[13.5px] font-semibold ring-1 ring-[#0a0a0a]/12 hover:bg-[#f5f5f5]"><Download className="h-4 w-4" /> Export</button>
          <Link href="/new-admin/products/zohra" className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-[#0a0a0a] px-3.5 text-[13.5px] font-semibold text-white"><Plus className="h-4 w-4" /> Add product</Link>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-[#0a0a0a]/[0.07]">
        <div className="flex flex-col gap-2 border-b border-[#0a0a0a]/[0.06] px-3 py-2.5 sm:flex-row sm:items-center">
          <div className="flex gap-1 overflow-x-auto">
            {["All", "Active", "Drafts", "Running low", "Sold out"].map((v) => (
              <button key={v} type="button" onClick={() => setView(v)} className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-semibold ${view === v ? "bg-[#f0f0f0]" : "text-[#0a0a0a]/55 hover:text-[#0a0a0a]"}`}>{v}</button>
            ))}
          </div>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" className="h-9 flex-1 rounded-[10px] bg-[#f5f5f5] px-3 text-[13.5px] outline-none placeholder:text-[#0a0a0a]/40 sm:ml-2" />
          <SortNote sort={sort} reset={reset} labels={{ product: "Name", status: "Status", stock: "Stock", collection: "Collection", price: "Price" }} numeric={["stock", "price"]} />
          {tiles && (
            <select aria-label="Sort tiles" value={sort ? `${sort.key}` : ""} onChange={(e) => e.target.value ? click(e.target.value) : reset()} className="h-9 rounded-[10px] bg-[#f5f5f5] px-2.5 text-[13px] font-semibold outline-none">
              <option value="">Sort: as added</option>
              <option value="product">Name</option>
              <option value="price">Price</option>
              <option value="stock">Stock</option>
              <option value="collection">Collection</option>
            </select>
          )}
          {tiles && sort && (
            <button type="button" onClick={() => click(sort.key)} aria-label={sort.desc ? "High to low; click for low to high" : "Low to high; click for high to low"} className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#f5f5f5] text-[15px] font-semibold">{sort.desc ? "↓" : "↑"}</button>
          )}
          <div className="flex rounded-[10px] bg-[#f0f0f0] p-0.5">
            <button type="button" aria-label="Rows" aria-pressed={!tiles} onClick={() => setTiles(false)} className={`grid h-8 w-8 place-items-center rounded-lg ${!tiles ? "bg-white shadow-sm" : "text-[#0a0a0a]/45"}`}><List className="h-4 w-4" /></button>
            <button type="button" aria-label="Tiles" aria-pressed={tiles} onClick={() => setTiles(true)} className={`grid h-8 w-8 place-items-center rounded-lg ${tiles ? "bg-white shadow-sm" : "text-[#0a0a0a]/45"}`}><LayoutGrid className="h-4 w-4" /></button>
          </div>
        </div>

        {tiles ? (
          <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-3 lg:grid-cols-4">
            {sorted.map((p) => (
              <article key={p.slug} className={`group relative overflow-hidden rounded-xl ring-1 ${picked.includes(p.slug) ? "ring-2 ring-[#0a0a0a]" : "ring-[#0a0a0a]/[0.07]"}`}>
                <input type="checkbox" aria-label={`Select ${p.name}`} checked={picked.includes(p.slug)} onChange={() => toggle(p.slug)} className="absolute left-2.5 top-2.5 z-10 h-4 w-4 accent-[#0a0a0a]" />
                <Link href={`/new-admin/products/${p.slug}`}>
                  <Image src={p.image} alt="" width={300} height={380} className="aspect-[4/5] w-full bg-[#f0f0f0] object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
                  <div className="p-3">
                    <p className="truncate text-[13.5px] font-semibold">{p.name}</p>
                    <p className="mt-0.5 flex items-center justify-between text-[12.5px] text-[#0a0a0a]/55">
                      {pkr(p.price)}
                      <span className={p.stock === 0 ? "font-semibold text-[#a3330c]" : p.stock !== null && p.stock < 10 ? "font-semibold text-[#b45309]" : ""}>{p.stock === null ? "Not tracked" : p.stock === 0 ? "Sold out" : `${p.stock} left`}</span>
                    </p>
                  </div>
                </Link>
                {p.status === "Draft" && <span className="absolute right-2.5 top-2.5"><Pill tone="off">Draft</Pill></span>}
              </article>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className={thead}>
                <tr>
                  <PlainTh className="w-10"><input type="checkbox" aria-label="Select all" checked={shown.length > 0 && shown.every((p) => picked.includes(p.slug))} onChange={(e) => setPicked(e.target.checked ? shown.map((p) => p.slug) : [])} className="h-4 w-4 accent-white" /></PlainTh>
                  <SortTh k="product" label="Product" sort={sort} onSort={click} />
                  <SortTh k="status" label="Status" sort={sort} onSort={click} />
                  <SortTh k="stock" label="Stock" sort={sort} onSort={click} />
                  <SortTh k="collection" label="Collection" sort={sort} onSort={click} />
                  <SortTh k="price" label="Price" sort={sort} onSort={click} align="right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0a0a0a]/[0.06]">
                {sorted.map((p) => (
                  <tr key={p.slug} className={picked.includes(p.slug) ? "bg-[#f5f5ff]" : "hover:bg-[#fafafa]"}>
                    <td className={td}><input type="checkbox" aria-label={`Select ${p.name}`} checked={picked.includes(p.slug)} onChange={() => toggle(p.slug)} className="h-4 w-4 accent-[#0a0a0a]" /></td>
                    <td className={td}>
                      <Link href={`/new-admin/products/${p.slug}`} className="flex items-center gap-3">
                        <Image src={p.image} alt="" width={44} height={44} className="h-11 w-11 rounded-lg bg-[#f0f0f0] object-cover" />
                        <span className="font-medium underline-offset-4 hover:underline">{p.name}</span>
                      </Link>
                    </td>
                    <td className={td}>{p.status === "Active" ? <Pill tone="good">Active</Pill> : <Pill tone="off">Draft</Pill>}</td>
                    <td className={td}>
                      {p.stock === null ? <span className="text-[#0a0a0a]/45">Not tracked</span> : (
                        <span><b className={`font-semibold ${p.stock === 0 ? "text-[#a3330c]" : p.stock < 10 ? "text-[#b45309]" : ""}`}>{p.stock === 0 ? "Sold out" : `${p.stock} in stock`}</b><span className="text-[#0a0a0a]/50"> · {p.variants} sizes</span></span>
                      )}
                    </td>
                    <td className={`${td} text-[#0a0a0a]/70`}>{p.collection}</td>
                    <td className={`${td} text-right font-semibold tabular-nums`}>{pkr(p.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {shown.length === 0 && <p className="px-4 py-12 text-center text-[14px] text-[#0a0a0a]/50">Nothing here.</p>}
      </section>

      {picked.length > 0 && (
        <div className="fixed inset-x-3 bottom-5 z-40 mx-auto flex max-w-xl flex-wrap items-center gap-2 rounded-2xl bg-[#0a0a0a] p-2 pl-4 text-white shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)] lg:left-[16rem]">
          <span className="mr-auto text-[13.5px] font-semibold">{picked.length} selected</span>
          <button type="button" onClick={() => apply((p) => ({ ...p, status: "Active" }), "made active")} className="rounded-xl px-3 py-2 text-[13px] font-semibold hover:bg-white/10">Make active</button>
          <button type="button" onClick={() => apply((p) => ({ ...p, status: "Draft" }), "moved to drafts")} className="rounded-xl px-3 py-2 text-[13px] font-semibold hover:bg-white/10">Move to draft</button>
          <button type="button" onClick={() => apply(() => null, "moved to the Bin")} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-semibold text-[#ffb4a1] hover:bg-white/10"><Trash2 className="h-4 w-4" /> Delete</button>
          <button type="button" aria-label="Clear selection" onClick={() => setPicked([])} className="grid h-9 w-9 place-items-center rounded-xl hover:bg-white/10"><X className="h-4 w-4" /></button>
        </div>
      )}

      {importing && <ImportDialog onClose={() => setImporting(false)} onDone={() => { setImporting(false); toast("10 products added, 2 updated"); }} />}
    </>
  );
}

function ImportDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/30 px-3 backdrop-blur-[2px]" onMouseDown={onClose}>
      <div role="dialog" aria-label="Import products" onMouseDown={(e) => e.stopPropagation()} className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-[0_40px_100px_-30px_rgba(0,0,0,0.6)]">
        <p className="flex items-center justify-between border-b border-[#0a0a0a]/[0.07] px-5 py-4 text-[15px] font-semibold">Import products <button type="button" aria-label="Close" onClick={onClose}><X className="h-5 w-5 text-[#0a0a0a]/45" /></button></p>
        {step === 1 ? (
          <button type="button" onClick={() => setStep(2)} className="m-5 flex w-[calc(100%-2.5rem)] flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-[#0a0a0a]/15 px-6 py-10 text-center hover:border-[#0a0a0a]/35">
            <FileSpreadsheet className="h-8 w-8 text-[#0a0a0a]/40" />
            <span className="text-[15px] font-semibold">Drop a product file, or choose one</span>
            <span className="text-[13px] text-[#0a0a0a]/55">A Shopify export works as it is. Nothing changes until you confirm.</span>
          </button>
        ) : (
          <div className="p-5">
            <p className="text-[14px] font-semibold">products_export.csv · what will happen</p>
            <ul className="mt-3 flex flex-col gap-2 text-[14px]">
              <li className="flex justify-between rounded-xl bg-[#effcf6] px-4 py-2.5"><span>New products</span><b>10</b></li>
              <li className="flex justify-between rounded-xl bg-[#eef6ff] px-4 py-2.5"><span>Updated (same web address)</span><b>2</b></li>
              <li className="flex justify-between rounded-xl bg-[#fff6e8] px-4 py-2.5"><span>Skipped: no price on row 14</span><b>1</b></li>
            </ul>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setStep(1)} className="rounded-[10px] px-4 py-2 text-[13.5px] font-semibold ring-1 ring-[#0a0a0a]/12">Back</button>
              <button type="button" onClick={onDone} className="rounded-[10px] bg-[#0a0a0a] px-4 py-2 text-[13.5px] font-semibold text-white">Import 12 products</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
