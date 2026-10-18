"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Download, FileSpreadsheet, LayoutGrid, List, Plus, Trash2, Upload, X } from "lucide-react";
import { BulkBar, SearchBox, SortTh, Tabs, barBtn, check, useSort, useToast } from "@/components/next-admin/bits";
import { SEL, Status, T, Thumb, btn, pkr } from "@/components/next-admin/ui";
import { A } from "@/components/next-admin/nav";
import type { Product } from "@/lib/new-admin/sample";

/**
 * The catalogue (third design): views as counted tabs, one 40px row a
 * product, or tiles when pictures matter more than numbers. Ticked rows can
 * be made active, sent back to draft, or put in the Bin, each with Undo.
 */
const VIEWS = ["All", "Active", "Drafts", "Running low", "Sold out"];
const inView = (v: string, p: Product) =>
  v === "All" || (v === "Active" && p.status === "Active") || (v === "Drafts" && p.status === "Draft") || (v === "Running low" && p.stock !== null && p.stock > 0 && p.stock < 10) || (v === "Sold out" && p.stock === 0);

export function ProductsBoard({ products }: { products: Product[] }) {
  const toast = useToast();
  const [rows, setRows] = useState(products);
  const [view, setView] = useState("All");
  const [tiles, setTiles] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const shown = rows.filter((p) => inView(view, p) && (!q || p.name.toLowerCase().includes(q.toLowerCase())));
  const { sorted, sort, click } = useSort(shown, { product: (p) => p.name, status: (p) => p.status, stock: (p) => p.stock ?? -1, collection: (p) => p.collection, price: (p) => p.price });
  const apply = (fn: (p: Product) => Product | null, msg: string) => {
    const before = rows;
    const ids = picked;
    setRows(rows.flatMap((p) => (ids.includes(p.slug) ? (fn(p) ? [fn(p)!] : []) : [p])));
    setPicked([]);
    toast(`${ids.length} product${ids.length > 1 ? "s" : ""} ${msg}`, () => setRows(before));
  };
  const toggle = (s: string) => setPicked(picked.includes(s) ? picked.filter((x) => x !== s) : [...picked, s]);
  const stock = (p: Product) =>
    p.stock === null ? <span className={T.muted}>Not tracked</span> : p.stock === 0 ? <Status tone="bad">Sold out</Status> : p.stock < 10 ? <Status tone="wait">{p.stock} left</Status> : <span>{p.stock} in stock</span>;

  return (
    <>
      <section className="overflow-hidden rounded-[16px] border border-[#ebebeb] bg-white">
        <div className="flex flex-wrap items-center gap-x-3 border-b border-[#ebebeb] px-3">
          <Tabs items={VIEWS} value={view} onChange={setView} counts={Object.fromEntries(VIEWS.map((v) => [v, rows.filter((p) => inView(v, p)).length]))} />
          <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-1.5 py-1.5">
            <SearchBox value={q} onChange={setQ} placeholder="Search products" />
            <div role="radiogroup" aria-label="Show as" className="flex h-8 items-center gap-0.5 rounded-[10px] p-0.5 ring-1 ring-inset ring-[#dddddd]">
              <button type="button" role="radio" aria-checked={!tiles} aria-label="Rows" onClick={() => setTiles(false)} className={`grid h-7 w-7 place-items-center rounded-[8px] ${!tiles ? SEL : "text-[#737373]"}`}><List className="h-4 w-4" /></button>
              <button type="button" role="radio" aria-checked={tiles} aria-label="Tiles" onClick={() => setTiles(true)} className={`grid h-7 w-7 place-items-center rounded-[8px] ${tiles ? SEL : "text-[#737373]"}`}><LayoutGrid className="h-4 w-4" /></button>
            </div>
          </div>
        </div>

        {tiles ? (
          <div className="grid grid-cols-2 gap-2.5 p-3 sm:grid-cols-4 lg:grid-cols-6">
            {sorted.map((p) => {
              const on = picked.includes(p.slug);
              return (
                <article key={p.slug} className={`group relative overflow-hidden rounded-[10px] ${on ? "ring-2 ring-[#6666ff]" : "ring-1 ring-[#ebebeb]"}`}>
                  <input type="checkbox" aria-label={`Select ${p.name}`} checked={on} onChange={() => toggle(p.slug)} className={`${check} absolute left-2 top-2 z-10`} />
                  <Link href={`${A}/products/${p.slug}`}>
                    <Image src={p.image} alt="" width={240} height={300} className="aspect-[4/5] w-full bg-[#f3f3f3] object-cover" />
                    <div className="px-2.5 py-2">
                      <p className="truncate text-[12.5px] font-medium">{p.name}</p>
                      <p className="mt-0.5 flex items-center justify-between text-[12px] tabular-nums text-[#737373]">{pkr(p.price)} {stock(p)}</p>
                    </div>
                  </Link>
                  {p.status === "Draft" && <span className="absolute right-2 top-2 rounded-[6px] bg-white/95 px-1.5 py-0.5 text-[11px] font-medium text-[#555555]">Draft</span>}
                </article>
              );
            })}
          </div>
        ) : (
          <>
          <ul className="divide-y divide-[#f1f1f1] sm:hidden">
            {sorted.map((p) => (
              <li key={p.slug}>
                <Link href={`${A}/products/${p.slug}`} className="flex items-center gap-2.5 px-3 py-2 active:bg-[#fafafa]">
                  <Thumb src={p.image} size={36} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium">{p.name}</span>
                    <span className="mt-0.5 flex items-center gap-2 text-[12px]">{p.status === "Active" ? <Status tone="good">Active</Status> : <Status tone="off">Draft</Status>}{stock(p)}</span>
                  </span>
                  <b className="text-[13px] font-semibold tabular-nums">{pkr(p.price)}</b>
                </Link>
              </li>
            ))}
          </ul>
          <div className={`${T.wrap} max-sm:hidden`}>
            <table className={`${T.table} min-w-[720px]`}>
              <thead>
                <tr>
                  <th className={`${T.th} w-9`}><input type="checkbox" aria-label="Select all" checked={shown.length > 0 && shown.every((p) => picked.includes(p.slug))} onChange={(e) => setPicked(e.target.checked ? shown.map((p) => p.slug) : [])} className={check} /></th>
                  <SortTh k="product" label="Product" sort={sort} onSort={click} />
                  <SortTh k="status" label="Status" sort={sort} onSort={click} />
                  <SortTh k="stock" label="Stock" sort={sort} onSort={click} />
                  <SortTh k="collection" label="Collection" sort={sort} onSort={click} />
                  <SortTh k="price" label="Price" sort={sort} onSort={click} right />
                </tr>
              </thead>
              <tbody>
                {sorted.map((p) => {
                  const on = picked.includes(p.slug);
                  return (
                    <tr key={p.slug} className={on ? "bg-[#f5f5ff]" : T.tr}>
                      <td className={T.td}><input type="checkbox" aria-label={`Select ${p.name}`} checked={on} onChange={() => toggle(p.slug)} className={check} /></td>
                      <td className={`${T.td} max-w-[22rem]`}>
                        <Link href={`${A}/products/${p.slug}`} className="flex items-center gap-2.5 hover:underline">
                          <Thumb src={p.image} />
                          <span className="truncate font-medium">{p.name}</span>
                        </Link>
                      </td>
                      <td className={T.td}>{p.status === "Active" ? <Status tone="good">Active</Status> : <Status tone="off">Draft</Status>}</td>
                      <td className={T.td}>{stock(p)} <span className="text-[12px] text-[#a3a3a3]">· {p.variants} size{p.variants > 1 ? "s" : ""}</span></td>
                      <td className={`${T.td} ${T.muted}`}>{p.collection}</td>
                      <td className={`${T.td} text-right font-semibold tabular-nums`}>{pkr(p.price)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </>
        )}
        {shown.length === 0 && <p className="px-4 py-10 text-center text-[13px] text-[#737373]">Nothing here.</p>}
      </section>

      <BulkBar count={picked.length} noun="product" onClear={() => setPicked([])}>
        <button type="button" onClick={() => apply((p) => ({ ...p, status: "Active" }), "made active")} className={barBtn}>Make active</button>
        <button type="button" onClick={() => apply((p) => ({ ...p, status: "Draft" }), "moved to drafts")} className={barBtn}>Move to draft</button>
        <button type="button" onClick={() => apply(() => null, "moved to the Bin")} className={`${barBtn} text-[#fca5a5]`}><Trash2 /> Delete</button>
      </BulkBar>

    </>
  );
}

/** Import, Export and Add, in the page's own heading. */
export function ProductActions() {
  const toast = useToast();
  const [importing, setImporting] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setImporting(true)} className={btn()}><Download /> Import</button>
      <button type="button" onClick={() => toast("12 products exported as a Shopify file")} className={btn()}><Upload /> Export</button>
      <Link href={`${A}/products/zohra`} className={btn("primary")}><Plus /> Add product</Link>
      {importing && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/25 px-3" onMouseDown={() => setImporting(false)}>
          <div role="dialog" aria-label="Import products" onMouseDown={(e) => e.stopPropagation()} className="w-full max-w-md overflow-hidden rounded-[16px] bg-white shadow-[0_30px_80px_-24px_rgba(0,0,0,0.55)]">
            <p className="flex h-11 items-center justify-between border-b border-[#f1f1f1] px-4 text-[13px] font-semibold">Import products <button type="button" aria-label="Close" onClick={() => setImporting(false)}><X className="h-4 w-4 text-[#a3a3a3]" /></button></p>
            <div className="p-4">
              <div className="flex items-center gap-3 rounded-[10px] bg-[#fafafa] p-3 ring-1 ring-inset ring-[#ebebeb]">
                <FileSpreadsheet className="h-6 w-6 text-[#16a34a]" />
                <span className="min-w-0 flex-1"><span className="block text-[13px] font-medium">products_export.csv</span><span className="text-[12px] text-[#737373]">From Shopify · 12 products, 41 sizes</span></span>
              </div>
              <ul className="mt-3 flex flex-col gap-1 text-[12.5px] text-[#3a3a3a]">
                <li>10 new products will be added</li>
                <li>2 match products you have, by their address, and will be updated</li>
                <li>Pictures are copied from Shopify as they import</li>
              </ul>
              <div className="mt-4 flex justify-end gap-1.5">
                <button type="button" onClick={() => setImporting(false)} className={btn()}>Cancel</button>
                <button type="button" onClick={() => { setImporting(false); toast("10 products added, 2 updated"); }} className={btn("primary")}>Import 12 products</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
