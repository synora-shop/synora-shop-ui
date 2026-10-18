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
    <section className="overflow-hidden rounded-[8px] border border-[#e4e4e7] bg-white">
      <div className="flex flex-wrap items-center gap-x-3 border-b border-[#e4e4e7] px-3">
        <Tabs items={["All", "Pictures", "Fonts", "Videos", "Documents", "Not described"]} value={tab} onChange={setTab} counts={{ All: 12, Pictures: 9, Fonts: 1, Videos: 1, Documents: 1, "Not described": pics.filter((p) => !p.described).length }} />
        <span className="ml-auto py-2 text-[12px] text-[#71717a]">412 MB of 5 GB used</span>
      </div>
      <div className="m-3 rounded-[6px] border border-dashed border-[#d4d4d8] px-4 py-3 text-center text-[12.5px] text-[#71717a]">
        <b className="font-medium text-[#18181b]">Drop files here</b> · pictures, fonts, videos and PDFs. Pictures are resized and sharpened for phones automatically.
      </div>
      <div className="grid grid-cols-3 gap-2 px-3 pb-3 sm:grid-cols-5 lg:grid-cols-8">
        {showPics && pics.filter((p) => tab !== "Not described" || !p.described).map((p) => (
          <figure key={p.name} className="overflow-hidden rounded-[6px] ring-1 ring-[#e4e4e7]">
            <Image src={p.src} alt="" width={200} height={200} className="aspect-square w-full bg-[#f4f4f5] object-cover" />
            <figcaption className="px-2 py-1.5">
              <span className="block truncate text-[11.5px] text-[#52525b]">{p.name}</span>
              <span className="flex items-center justify-between text-[11px]">
                {p.described ? <span className="text-[#a1a1aa]">Described</span> : <span className="font-medium text-[#b45309]">No description</span>}
                <button type="button" onClick={() => { navigator.clipboard?.writeText(`https://zohralawn.pk/files/${p.name}`).catch(() => {}); toast("Link copied"); }} className="font-medium text-[#4f46e5] hover:underline">Copy link</button>
              </span>
            </figcaption>
          </figure>
        ))}
        {OTHERS.filter((o) => tab === "All" || tab === o.kind).map(({ icon: Icon, name, meta }) => (
          <figure key={name} className="overflow-hidden rounded-[6px] ring-1 ring-[#e4e4e7]">
            <span className="grid aspect-square place-items-center bg-[#fafafa] text-[#a1a1aa]"><Icon className="h-6 w-6" /></span>
            <figcaption className="px-2 py-1.5"><span className="block truncate text-[11.5px] font-medium">{name}</span><span className="text-[11px] text-[#a1a1aa]">{meta}</span></figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
