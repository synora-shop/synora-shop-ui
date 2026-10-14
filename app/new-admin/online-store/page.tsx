import Image from "next/image";
import { Button, PageHeader, Pill } from "@/components/new-admin/ui";

export const metadata = { title: "Themes" };

export default function ThemesPage() {
  return (
    <>
      <PageHeader icon="app" tone="sky" title="Themes" sub="How your store looks. Try a theme in private before it goes live." actions={<Button>Visit the Theme Store</Button>} />
      <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-[#0a0a0a]/[0.07] lg:grid lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Image src="/platform/theme-loom.jpg" alt="Your live theme, Loom" width={1440} height={1000} className="h-full w-full bg-[#f0f0f0] object-cover" />
        <div className="flex flex-col justify-center gap-3 p-6">
          <Pill tone="good">Live</Pill>
          <h2 className="text-[22px] font-semibold tracking-[-0.02em]">Loom</h2>
          <p className="text-[14px] text-[#0a0a0a]/60">Clean and roomy, with large imagery. Last edited today.</p>
          <div className="mt-2 flex gap-2"><Button primary>Customise</Button><Button>Preview</Button></div>
        </div>
      </section>
      <h2 className="mt-2 text-[15px] font-semibold">In your library</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <article className="flex gap-4 rounded-2xl bg-white p-4 ring-1 ring-[#0a0a0a]/[0.07]">
          <Image src="/platform/theme-kite.jpg" alt="" width={1440} height={1000} className="h-24 w-36 rounded-lg object-cover" />
          <div className="flex flex-col justify-center gap-1.5"><p className="font-semibold">Kite</p><p className="text-[13px] text-[#0a0a0a]/55">Added 9 Oct · not live</p><span className="text-[13px] font-semibold text-[#4b4bea]">Customise · Publish</span></div>
        </article>
      </div>
    </>
  );
}
