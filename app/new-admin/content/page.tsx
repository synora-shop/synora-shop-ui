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
