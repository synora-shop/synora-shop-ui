"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import { ImagePlus, Plus, Sparkles, Trash2 } from "lucide-react";
import { Pill, pkr, td, th } from "@/components/new-admin/ui";
import { Toggle } from "@/components/new-admin/bits";
import { useToast } from "@/components/new-admin/shell";
import type { Product } from "@/lib/new-admin/sample";

/**
 * A product, editable (preview). Any change brings up the bar along the top
 * of the screen, Discard or Save, as Shopify does, so nothing is lost by a
 * stray click and nothing is saved by surprise.
 *
 * "How it is sold" is Synora's own: normal, bulk (price hidden, a range, or
 * quantity breaks, with a minimum), or made to order (the questions to ask).
 * Only the chosen way's fields show, so the common case stays short.
 */
type Kind = "Normal" | "Bulk" | "Made to order";
/** The store currency's symbol, from the formatter rather than typed in. */
const CUR = pkr(0).replace(/[\d.,\s]/g, "");

function Box({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-[#0a0a0a]/[0.08]">
      <div className="flex items-center justify-between border-b border-[#0a0a0a]/[0.06] px-5 py-3">
        <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#0a0a0a]/45">{title}</p>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}
function Input({ label, value, onChange, hint, area = false, prefix }: { label: string; value: string; onChange: (v: string) => void; hint?: string; area?: boolean; prefix?: string }) {
  const cls = "w-full rounded-[10px] bg-white px-3.5 text-[14.5px] outline-none ring-1 ring-[#0a0a0a]/15 focus:ring-2 focus:ring-[#0a0a0a]";
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-semibold">{label}</span>
      {area ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={4} className={`${cls} py-2.5 leading-relaxed`} />
      ) : (
        <span className="relative block">
          {prefix && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] text-[#0a0a0a]/45">{prefix}</span>}
          <input value={value} onChange={(e) => onChange(e.target.value)} className={`${cls} h-10 ${prefix ? "pl-10" : ""}`} />
        </span>
      )}
      {hint && <span className="mt-1 block text-[12.5px] text-[#0a0a0a]/50">{hint}</span>}
    </label>
  );
}

export function ProductEditor({ p, photos }: { p: Product; photos: string[] }) {
  const toast = useToast();
  const first = { title: p.name, desc: "Three-piece embroidered lawn with a printed chiffon dupatta and dyed cotton trousers. Unstitched: 3 m shirt, 2.5 m dupatta, 2.5 m trousers.", price: String(p.price), compare: String(Math.round((p.price * 1.2) / 100) * 100), kind: "Normal" as Kind, active: p.status === "Active" };
  const [f, setF] = useState(first);
  const [saved, setSaved] = useState(first);
  const [shown, setShown] = useState<"Hidden" | "Range" | "Tiered">("Tiered");
  const [autoSku, setAutoSku] = useState(true);
  const dirty = JSON.stringify(f) !== JSON.stringify(saved);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF({ ...f, [k]: v });
  const sizes = ["S", "M", "L", "XL"].slice(0, p.variants);
  const skuBase = f.title.split(/\s+/)[0].toUpperCase().replace(/[^A-Z]/g, "");

  return (
    <>
      {dirty && (
        <div className="sticky top-[53px] z-20 -mx-4 -mt-2 flex items-center gap-3 bg-[#0a0a0a] px-4 py-2.5 text-white sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <span className="mr-auto text-[13.5px] font-semibold">Unsaved changes</span>
          <button type="button" onClick={() => setF(saved)} className="rounded-[10px] px-3.5 py-1.5 text-[13px] font-semibold ring-1 ring-white/25 hover:bg-white/10">Discard</button>
          <button type="button" onClick={() => { setSaved(f); toast("Product saved"); }} className="rounded-[10px] bg-white px-3.5 py-1.5 text-[13px] font-semibold text-[#0a0a0a]">Save</button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2.5">
        <h1 className="text-[24px] font-semibold tracking-[-0.02em]">{f.title || "Untitled product"}</h1>
        {f.active ? <Pill tone="good">Active</Pill> : <Pill tone="off">Draft</Pill>}
        <Pill tone="info">{f.kind}</Pill>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-5">
          <Box title="The product">
            <div className="flex flex-col gap-4">
              <Input label="Title" value={f.title} onChange={(v) => set("title", v)} />
              <Input label="Description" area value={f.desc} onChange={(v) => set("desc", v)} />
            </div>
          </Box>

          <Box title="Photos" action={<span className="text-[12.5px] font-semibold text-[#0a0a0a]/45">{photos.length} of 10 · drag to reorder</span>}>
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
              {photos.map((src, i) => (
                <div key={src} className={`relative ${i === 0 ? "col-span-2 row-span-2" : ""}`}>
                  <Image src={src} alt="" width={240} height={300} className={`w-full rounded-xl bg-[#f0f0f0] object-cover ${i === 0 ? "aspect-[3/4]" : "aspect-square"}`} />
                  {i === 0 && <span className="absolute left-2 top-2 rounded-md bg-white/90 px-1.5 py-0.5 text-[11px] font-semibold">Main</span>}
                </div>
              ))}
              <span className="grid aspect-square place-items-center rounded-xl border-2 border-dashed border-[#0a0a0a]/15 text-[#0a0a0a]/40"><ImagePlus className="h-5 w-5" /></span>
            </div>
          </Box>

          <Box title="How it is sold">
            <div role="radiogroup" aria-label="How it is sold" className="grid gap-2 sm:grid-cols-3">
              {([
                ["Normal", "A price, sizes and stock"],
                ["Bulk", "By quantity, for shops and events"],
                ["Made to order", "Made to the customer's details"],
              ] as [Kind, string][]).map(([k, hint]) => (
                <button key={k} type="button" role="radio" aria-checked={f.kind === k} onClick={() => set("kind", k)} className={`rounded-xl p-3.5 text-left ring-1 transition-all ${f.kind === k ? "bg-[#0a0a0a] text-white ring-[#0a0a0a]" : "ring-[#0a0a0a]/12 hover:ring-[#0a0a0a]/30"}`}>
                  <span className="block text-[14px] font-semibold">{k}</span>
                  <span className={`block text-[12.5px] ${f.kind === k ? "text-white/60" : "text-[#0a0a0a]/50"}`}>{hint}</span>
                </button>
              ))}
            </div>

            {f.kind === "Normal" && (
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <Input label="Price" prefix={CUR} value={f.price} onChange={(v) => set("price", v)} />
                <Input label="Compare-at price" prefix={CUR} value={f.compare} onChange={(v) => set("compare", v)} hint="Shown struck through" />
                <Input label="Cost per item" prefix={CUR} value={String(Math.round((p.price * 0.45) / 50) * 50)} onChange={() => {}} hint="Margin 55%, only you see this" />
              </div>
            )}
            {f.kind === "Bulk" && (
              <div className="mt-4 flex flex-col gap-4">
                <div className="flex flex-wrap gap-1.5">
                  {(["Hidden", "Range", "Tiered"] as const).map((s) => (
                    <button key={s} type="button" onClick={() => setShown(s)} className={`rounded-full px-3 py-1.5 text-[13px] font-semibold ${shown === s ? "bg-[#0a0a0a] text-white" : "ring-1 ring-[#0a0a0a]/12"}`}>
                      {{ Hidden: "Price on request", Range: "A price range", Tiered: "Quantity breaks" }[s]}
                    </button>
                  ))}
                </div>
                {shown === "Tiered" && (
                  <table className="w-full overflow-hidden rounded-xl ring-1 ring-[#0a0a0a]/[0.08]">
                    <thead className="bg-[#fafafa]"><tr><th className={th}>From</th><th className={th}>Price each</th><th className={th} /></tr></thead>
                    <tbody className="divide-y divide-[#0a0a0a]/[0.06]">
                      {[[10, 7900], [50, 7200], [100, 6400]].map(([q, pr]) => (
                        <tr key={q}><td className={td}>{q} pieces</td><td className={`${td} font-semibold`}>{pkr(pr)}</td><td className={`${td} text-right`}><Trash2 className="ml-auto h-4 w-4 text-[#0a0a0a]/30" /></td></tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {shown === "Range" && <p className="rounded-xl bg-[#f5f5f5] px-4 py-3 text-[14px]">Shown as <b>{pkr(6400)} to {pkr(7900)}</b> each</p>}
                {shown === "Hidden" && <p className="rounded-xl bg-[#f5f5f5] px-4 py-3 text-[14px]">Shown as <b>Price on request</b>, with an enquiry form</p>}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Minimum order" value="10 pieces" onChange={() => {}} />
                  <Input label="Enquiries go to" value="Enquiries inbox and orders@zohralawn.pk" onChange={() => {}} />
                </div>
              </div>
            )}
            {f.kind === "Made to order" && (
              <div className="mt-4 flex flex-col gap-2">
                <p className="text-[13px] font-semibold">What you need from the customer</p>
                {[["Chest (inches)", "Number"], ["Length (inches)", "Number"], ["Colour", "Choice: maroon, emerald, ivory"], ["Anything else", "Text"]].map(([l, t]) => (
                  <div key={l} className="flex items-center justify-between rounded-xl px-4 py-2.5 ring-1 ring-[#0a0a0a]/10"><span className="text-[14px] font-medium">{l}</span><span className="text-[12.5px] text-[#0a0a0a]/50">{t}</span></div>
                ))}
                <span className="inline-flex items-center gap-1.5 self-start px-1 py-1 text-[13px] font-semibold"><Plus className="h-4 w-4" /> Add a question</span>
              </div>
            )}
          </Box>

          {f.kind === "Normal" && (
            <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-[#0a0a0a]/[0.08]">
              <div className="flex items-center justify-between border-b border-[#0a0a0a]/[0.06] px-5 py-3">
                <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#0a0a0a]/45">Sizes and stock</p>
                <label className="flex items-center gap-2 text-[12.5px] font-semibold text-[#0a0a0a]/60"><Sparkles className="h-3.5 w-3.5 text-[#6666ff]" /> Make SKUs for me <Toggle on={autoSku} label="Generate SKUs" /></label>
              </div>
              <table className="w-full">
                <thead className="bg-[#fafafa]"><tr><th className={th}>Size</th><th className={th}>SKU</th><th className={`${th} text-right`}>In stock</th></tr></thead>
                <tbody className="divide-y divide-[#0a0a0a]/[0.06]">
                  {sizes.map((s, i) => {
                    const left = p.stock === null ? null : Math.max(0, Math.round((p.stock / p.variants) * [1.2, 1, 0.9, 0.7][i]));
                    return (
                      <tr key={s}>
                        <td className={`${td} font-semibold`}>{s}</td>
                        <td className={`${td} font-mono text-[12.5px] text-[#0a0a0a]/55`} onClick={() => setAutoSku(false)}>{skuBase}-{s}</td>
                        <td className={`${td} text-right`}>
                          <span className={`inline-block min-w-[3rem] rounded-lg px-2.5 py-1 text-center font-semibold tabular-nums ring-1 ${left === 0 ? "text-[#a3330c] ring-[#a3330c]/25" : left !== null && left < 4 ? "text-[#b45309] ring-[#b45309]/25" : "ring-[#0a0a0a]/12"}`}>{left ?? "∞"}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          )}

          <Box title="How search shows it">
            <p className="text-[12.5px] text-[#0a0a0a]/55">zohralawn.pk › products › {p.slug}</p>
            <p className="mt-0.5 text-[17px] text-[#1a0dab]">{f.title} · Zohra Lawn</p>
            <p className="mt-1 text-[13.5px] text-[#0a0a0a]/65">{f.desc.slice(0, 150)}</p>
          </Box>
        </div>

        <div className="flex flex-col gap-5">
          <Box title="Status">
            <div className="flex items-center justify-between">
              <span><span className="block text-[14.5px] font-semibold">{f.active ? "Active" : "Draft"}</span><span className="block text-[13px] text-[#0a0a0a]/55">{f.active ? "Customers can buy it" : "Only you can see it"}</span></span>
              <button type="button" role="switch" aria-checked={f.active} aria-label="Active" onClick={() => set("active", !f.active)} className={`relative h-6 w-10 rounded-full ${f.active ? "bg-[#0a0a0a]" : "bg-[#0a0a0a]/15"}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[left] ${f.active ? "left-[18px]" : "left-0.5"}`} />
              </button>
            </div>
          </Box>
          <Box title="Filed under">
            <div className="flex flex-col gap-3">
              <Input label="Collections" value={p.collection} onChange={() => {}} />
              <Input label="Tags" value="lawn, embroidered, summer" onChange={() => {}} />
            </div>
          </Box>
          <Box title="Custom fields">
            <div className="flex flex-col gap-3">
              <Input label="Fabric" value="Lawn, 80 count" onChange={() => {}} />
              <Input label="Care" value="Hand wash cold, dry in shade" onChange={() => {}} />
            </div>
          </Box>
        </div>
      </div>
    </>
  );
}
