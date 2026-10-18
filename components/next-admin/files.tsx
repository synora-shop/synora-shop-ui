"use client";

import Image from "next/image";
import { useState } from "react";
import { FileText, Film, Type } from "lucide-react";
import { Tabs, useToast } from "@/components/next-admin/bits";
import { PRODUCTS } from "@/lib/new-admin/sample";

/** Files (third design): a dense grid under counted tabs, with the drop zone as a slim strip. */
const OTHERS = [
  { icon: Type, name: "Nastaliq-Display.woff2", meta: "Font · 84 KB", kind: "Fonts" },
  { icon: Film, name: "eid-lookbook.mp4", meta: "Video · 12 MB", kind: "Videos" },
  { icon: FileText, name: "size-guide.pdf", meta: "PDF · 220 KB", kind: "Documents" },
];
export function Files() {
  const toast = useToast();
  const [tab, setTab] = useState("All");
  const pics = PRODUCTS.slice(0, 9).map((p) => ({ src: p.image, name: `${p.slug}-front.png`, described: p.slug.length % 3 !== 0 }));
  const showPics = tab === "All" || tab === "Pictures" || tab === "Not described";
  return (
    <section className="overflow-hidden rounded-[16px] border border-[#ebebeb] bg-white">
      <div className="flex flex-wrap items-center gap-x-3 border-b border-[#ebebeb] px-3">
        <Tabs items={["All", "Pictures", "Fonts", "Videos", "Documents", "Not described"]} value={tab} onChange={setTab} counts={{ All: 12, Pictures: 9, Fonts: 1, Videos: 1, Documents: 1, "Not described": pics.filter((p) => !p.described).length }} />
        <span className="ml-auto py-2 text-[12px] text-[#737373]">412 MB of 5 GB used</span>
      </div>
      <div className="m-3 rounded-[10px] border border-dashed border-[#dddddd] px-4 py-3 text-center text-[12.5px] text-[#737373]">
        <b className="font-medium text-[#0a0a0a]">Drop files here</b> · pictures, fonts, videos and PDFs. Pictures are resized and sharpened for phones automatically.
      </div>
      <div className="grid grid-cols-3 gap-2 px-3 pb-3 sm:grid-cols-5 lg:grid-cols-8">
        {showPics && pics.filter((p) => tab !== "Not described" || !p.described).map((p) => (
          <figure key={p.name} className="overflow-hidden rounded-[10px] ring-1 ring-[#ebebeb]">
            <Image src={p.src} alt="" width={200} height={200} className="aspect-square w-full bg-[#f3f3f3] object-cover" />
            <figcaption className="px-2 py-1.5">
              <span className="block truncate text-[11.5px] text-[#555555]">{p.name}</span>
              <span className="flex items-center justify-between text-[11px]">
                {p.described ? <span className="text-[#a3a3a3]">Described</span> : <span className="font-medium text-[#b45309]">No description</span>}
                <button type="button" onClick={() => { navigator.clipboard?.writeText(`https://zohralawn.pk/files/${p.name}`).catch(() => {}); toast("Link copied"); }} className="font-medium text-[#4b4bea] hover:underline">Copy link</button>
              </span>
            </figcaption>
          </figure>
        ))}
        {OTHERS.filter((o) => tab === "All" || tab === o.kind).map(({ icon: Icon, name, meta }) => (
          <figure key={name} className="overflow-hidden rounded-[10px] ring-1 ring-[#ebebeb]">
            <span className="grid aspect-square place-items-center bg-[#fafafa] text-[#a3a3a3]"><Icon className="h-6 w-6" /></span>
            <figcaption className="px-2 py-1.5"><span className="block truncate text-[11.5px] font-medium">{name}</span><span className="text-[11px] text-[#a3a3a3]">{meta}</span></figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
