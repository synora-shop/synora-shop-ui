import Image from "next/image";
import { FileText, Film, Type, Upload } from "lucide-react";
import { Button, PageHeader } from "@/components/new-admin/ui";
import { PRODUCTS } from "@/lib/new-admin/sample";

export const metadata = { title: "Files" };

export default function FilesPage() {
  const others = [
    { icon: Type, name: "Nastaliq-Display.woff2", meta: "Font · 84 KB" },
    { icon: Film, name: "eid-lookbook.mp4", meta: "Video · 12 MB" },
    { icon: FileText, name: "size-guide.pdf", meta: "PDF · 220 KB" },
  ];
  return (
    <>
      <PageHeader icon="content" tone="mint" title="Files" sub="Pictures, fonts, videos and documents you use across the store." actions={<Button primary><Upload className="h-4 w-4" /> Upload files</Button>} />
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex rounded-[10px] bg-white p-0.5 text-[13px] font-semibold ring-1 ring-[#0a0a0a]/10">{["All", "Pictures", "Fonts", "Videos", "Not used anywhere"].map((t, i) => <span key={t} className={`rounded-lg px-3 py-1.5 ${i === 0 ? "bg-[#0a0a0a] text-white" : "text-[#0a0a0a]/55"}`}>{t}</span>)}</span>
        <span className="ml-auto text-[13px] text-[#0a0a0a]/50">412 MB of 5 GB used</span>
      </div>
      <div className="rounded-2xl border-2 border-dashed border-[#0a0a0a]/12 bg-white/60 px-6 py-8 text-center">
        <p className="text-[14.5px] font-semibold">Drop files here to upload</p>
        <p className="text-[13px] text-[#0a0a0a]/50">Pictures, fonts, videos and PDFs. Pictures are resized and sharpened for phones automatically.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {PRODUCTS.slice(0, 7).map((p) => (
          <figure key={p.slug} className="overflow-hidden rounded-xl bg-white ring-1 ring-[#0a0a0a]/[0.07]">
            <Image src={p.image} alt="" width={240} height={240} className="aspect-square w-full bg-[#f0f0f0] object-cover" />
            <figcaption className="truncate px-3 py-2 text-[12.5px] text-[#0a0a0a]/60">{p.slug}-front.png</figcaption>
          </figure>
        ))}
        {others.map(({ icon: Icon, name, meta }) => (
          <figure key={name} className="flex flex-col overflow-hidden rounded-xl bg-white ring-1 ring-[#0a0a0a]/[0.07]">
            <span className="grid aspect-square place-items-center bg-[#f5f5f5] text-[#0a0a0a]/40"><Icon className="h-8 w-8" /></span>
            <figcaption className="px-3 py-2"><span className="block truncate text-[12.5px] font-medium">{name}</span><span className="text-[11.5px] text-[#0a0a0a]/50">{meta}</span></figcaption>
          </figure>
        ))}
      </div>
    </>
  );
}
