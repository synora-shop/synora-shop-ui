"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import { Copy, Eye, ImagePlus, Plus, Sparkles, Trash2 } from "lucide-react";
import { Cards, Seg, Toggle, useToast } from "@/components/next-admin/bits";
import { Page, Panel, Status, T, btn, pkr } from "@/components/next-admin/ui";
import { A } from "@/components/next-admin/nav";
import type { Product } from "@/lib/new-admin/sample";

/**
 * A product, editable (third design). Any change turns the heading's actions
 * into Discard and Save, in place, so nothing is lost by a stray click and
 * nothing is saved by surprise. "How it is sold" is Synora's own: normal,
 * bulk, or made to order, and only the chosen way's fields show.
 */
type Kind = "Normal" | "Bulk" | "Made to order";
const CUR = pkr(0).replace(/[\d.,\s]/g, "");

function In({ label, value, onChange, hint, area = false, prefix }: { label: string; value: string; onChange: (v: string) => void; hint?: ReactNode; area?: boolean; prefix?: string }) {
  const cls = "w-full rounded-[10px] border border-[#dddddd] bg-white px-2.5 text-[13px] outline-none focus:border-[#6666ff] focus:ring-2 focus:ring-[#6666ff]/20";
  return (
    <label className="block">
      <span className="mb-1 block text-[12.5px] font-medium text-[#3a3a3a]">{label}</span>
      {area ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={4} className={`${cls} py-2 leading-relaxed`} />
      ) : (
        <span className="relative block">
          {prefix && <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[12.5px] text-[#a3a3a3]">{prefix}</span>}
          <input value={value} onChange={(e) => onChange(e.target.value)} className={`${cls} h-8 ${prefix ? "pl-9" : ""}`} />
        </span>
      )}
      {hint && <span className="mt-1 block text-[12px] text-[#737373]">{hint}</span>}
    </label>
  );
}

export function ProductEditor({ p, photos }: { p: Product; photos: string[] }) {
  const toast = useToast();
  const first = { title: p.name, desc: "Three-piece embroidered lawn with a printed chiffon dupatta and dyed cotton trousers. Unstitched: 3 m shirt, 2.5 m dupatta, 2.5 m trousers.", price: String(p.price), compare: String(Math.round((p.price * 1.2) / 100) * 100), kind: "Normal" as Kind, active: p.status === "Active" };
  const [f, setF] = useState(first);
  const [saved, setSaved] = useState(first);
  const [shown, setShown] = useState("Quantity breaks");
  const [autoSku, setAutoSku] = useState(true);
  const dirty = JSON.stringify(f) !== JSON.stringify(saved);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF({ ...f, [k]: v });
  const sizes = ["S", "M", "L", "XL"].slice(0, p.variants);
  const skuBase = f.title.split(/\s+/)[0].toUpperCase().replace(/[^A-Z]/g, "");
  const cost = Math.round((p.price * 0.45) / 50) * 50;

  return (
    <Page
      title={f.title || "Untitled product"}
      crumbs={[{ label: "Products", href: `${A}/products` }]}
      meta={<>{f.active ? <Status tone="good">Active</Status> : <Status tone="off">Draft</Status>}<span className="text-[12px] text-[#737373]">{f.kind}</span></>}
      actions={
        dirty ? (
          <>
            <span className="mr-1 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#b45309]"><span className="h-1.5 w-1.5 rounded-full bg-[#f59e0b]" /> Unsaved changes</span>
            <button type="button" onClick={() => setF(saved)} className={btn()}>Discard</button>
            <button type="button" onClick={() => { setSaved(f); toast("Product saved"); }} className={btn("primary")}>Save</button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => toast("Opening it in your store")} className={btn()}><Eye /> View</button>
            <button type="button" onClick={() => toast(`Copied ${f.title}`)} className={btn()}><Copy /> Duplicate</button>
          </>
        )
      }
    >
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex min-w-0 flex-col gap-3">
          <Panel title="The product">
            <div className="flex flex-col gap-3">
              <In label="Title" value={f.title} onChange={(v) => set("title", v)} />
              <In label="Description" area value={f.desc} onChange={(v) => set("desc", v)} />
            </div>
          </Panel>

          <Panel title="Photos" action={<span className="text-[#737373]">{photos.length} of 10 · drag to reorder</span>}>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {photos.map((src, i) => (
                <div key={src} className={`relative ${i === 0 ? "col-span-2 row-span-2" : ""}`}>
                  <Image src={src} alt="" width={240} height={300} className="aspect-square w-full rounded-[10px] bg-[#f3f3f3] object-cover" />
                  {i === 0 && <span className="absolute left-1.5 top-1.5 rounded-[6px] bg-white/95 px-1.5 py-0.5 text-[11px] font-medium">Main</span>}
                </div>
              ))}
              <button type="button" aria-label="Add photos" className="grid aspect-square place-items-center rounded-[10px] border border-dashed border-[#dddddd] text-[#a3a3a3] hover:border-[#6666ff] hover:text-[#6666ff]"><ImagePlus className="h-4 w-4" /></button>
            </div>
          </Panel>

          <Panel title="How it is sold">
            <Cards
              label="How it is sold"
              value={f.kind}
              onChange={(k) => set("kind", k)}
              options={[
                { id: "Normal", label: "Normal", hint: "A price, sizes and stock" },
                { id: "Bulk", label: "Bulk", hint: "By quantity, for shops and events" },
                { id: "Made to order", label: "Made to order", hint: "Made to the customer's details" },
              ]}
            />
            {f.kind === "Normal" && (
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <In label="Price" prefix={CUR} value={f.price} onChange={(v) => set("price", v)} />
                <In label="Compare-at price" prefix={CUR} value={f.compare} onChange={(v) => set("compare", v)} hint="Shown struck through" />
                <In label="Cost per item" prefix={CUR} value={String(cost)} onChange={() => {}} hint="Margin 55%, only you see this" />
              </div>
            )}
            {f.kind === "Bulk" && (
              <div className="mt-3 flex flex-col gap-3">
                <Seg label="How the price shows" items={["Price on request", "A price range", "Quantity breaks"]} value={shown} onChange={setShown} />
                {shown === "Quantity breaks" && (
                  <table className={`${T.table} overflow-hidden rounded-[10px] ring-1 ring-[#ebebeb]`}>
                    <thead><tr><th className={T.th}>From</th><th className={T.th}>Price each</th><th className={`${T.th} w-10`} /></tr></thead>
                    <tbody>
                      {[[10, 7900], [50, 7200], [100, 6400]].map(([q, pr]) => (
                        <tr key={q}><td className={T.td}>{q} pieces</td><td className={`${T.td} font-semibold tabular-nums`}>{pkr(pr)}</td><td className={T.td}><Trash2 className="h-3.5 w-3.5 text-[#a3a3a3]" /></td></tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {shown === "A price range" && <p className="rounded-[10px] bg-[#fafafa] px-3 py-2 text-[13px]">Shown as <b>{pkr(6400)} to {pkr(7900)}</b> each</p>}
                {shown === "Price on request" && <p className="rounded-[10px] bg-[#fafafa] px-3 py-2 text-[13px]">Shown as <b>Price on request</b>, with an enquiry form</p>}
                <div className="grid gap-3 sm:grid-cols-2">
                  <In label="Minimum order" value="10 pieces" onChange={() => {}} />
                  <In label="Enquiries go to" value="Enquiries inbox and orders@zohralawn.pk" onChange={() => {}} />
                </div>
              </div>
            )}
            {f.kind === "Made to order" && (
              <div className="mt-3">
                <p className="mb-1.5 text-[12.5px] font-medium text-[#3a3a3a]">What you need from the customer</p>
                <ul className="divide-y divide-[#f1f1f1] rounded-[10px] ring-1 ring-[#ebebeb]">
                  {[["Chest (inches)", "Number"], ["Length (inches)", "Number"], ["Colour", "Choice: maroon, emerald, ivory"], ["Anything else", "Text"]].map(([l, t]) => (
                    <li key={l} className="flex h-9 items-center justify-between px-3 text-[13px]"><span className="font-medium">{l}</span><span className="text-[12px] text-[#737373]">{t}</span></li>
                  ))}
                </ul>
                <button type="button" className={`${btn("ghost", true)} mt-1.5`}><Plus /> Add a question</button>
              </div>
            )}
          </Panel>

          {f.kind === "Normal" && (
            <Panel title="Sizes and stock" flush action={<label className="flex items-center gap-2 text-[#555555]"><Sparkles className="h-3.5 w-3.5 text-[#6666ff]" /> Make SKUs for me <Toggle on={autoSku} label="Generate SKUs" onChange={setAutoSku} /></label>}>
              <table className={T.table}>
                <thead><tr><th className={T.th}>Size</th><th className={T.th}>SKU</th><th className={`${T.th} text-right`}>In stock</th></tr></thead>
                <tbody>
                  {sizes.map((s, i) => {
                    const left = p.stock === null ? null : Math.max(0, Math.round((p.stock / p.variants) * [1.2, 1, 0.9, 0.7][i]));
                    return (
                      <tr key={s}>
                        <td className={`${T.td} font-medium`}>{s}</td>
                        <td className={`${T.td} font-mono text-[12px] text-[#737373]`}>{autoSku ? `${skuBase}-${s}` : <input defaultValue={`${skuBase}-${s}`} className="h-7 rounded-[10px] px-2 font-mono text-[12px] ring-1 ring-inset ring-[#dddddd]" />}</td>
                        <td className={`${T.td} text-right`}>
                          <input defaultValue={left ?? "∞"} aria-label={`In stock, size ${s}`} className={`h-7 w-16 rounded-[10px] px-2 text-right text-[13px] font-semibold tabular-nums outline-none ring-1 ring-inset focus:ring-[#6666ff] ${left === 0 ? "text-[#b91c1c] ring-[#fecaca]" : left !== null && left < 4 ? "text-[#b45309] ring-[#fde68a]" : "ring-[#ebebeb]"}`} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Panel>
          )}

          <Panel title="How search shows it">
            <p className="text-[12px] text-[#737373]">zohralawn.pk › products › {p.slug}</p>
            <p className="mt-0.5 text-[15px] text-[#1a0dab]">{f.title} · Zohra Lawn</p>
            <p className="mt-0.5 text-[12.5px] text-[#555555]">{f.desc.slice(0, 150)}</p>
          </Panel>
        </div>

        <div className="flex flex-col gap-3">
          <Panel title="Status">
            <div className="flex items-center justify-between gap-3">
              <span><span className="block text-[13px] font-medium">{f.active ? "Active" : "Draft"}</span><span className="block text-[12px] text-[#737373]">{f.active ? "Customers can buy it" : "Only you can see it"}</span></span>
              <button type="button" role="switch" aria-checked={f.active} aria-label="Active" onClick={() => set("active", !f.active)} className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${f.active ? "bg-[#6666ff]" : "bg-[#dddddd]"}`}>
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-[left] ${f.active ? "left-[18px]" : "left-0.5"}`} />
              </button>
            </div>
          </Panel>
          <Panel title="Filed under">
            <div className="flex flex-col gap-3">
              <In label="Collections" value={p.collection} onChange={() => {}} />
              <In label="Tags" value="lawn, embroidered, summer" onChange={() => {}} />
            </div>
          </Panel>
          <Panel title="Custom fields">
            <div className="flex flex-col gap-3">
              <In label="Fabric" value="Lawn, 80 count" onChange={() => {}} />
              <In label="Care" value="Hand wash cold, dry in shade" onChange={() => {}} />
            </div>
          </Panel>
          <button type="button" onClick={() => toast(`${f.title} moved to the Bin`)} className={`${btn("ghost")} justify-start text-[#b91c1c] hover:bg-[#fef2f2] hover:text-[#b91c1c]`}><Trash2 /> Delete product</button>
        </div>
      </div>
    </Page>
  );
}
