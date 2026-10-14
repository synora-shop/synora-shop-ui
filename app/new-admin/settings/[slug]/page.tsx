import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ICONS, TONE } from "@/components/new-admin/ui";
import { BODY } from "@/components/new-admin/settings-body";
import { SETTINGS } from "@/lib/new-admin/sample";

/**
 * One settings section at a time (preview), as Shopify does it: the list on
 * the left stays put, the chosen section fills the right, and the foot of
 * each section leads to the one before and after.
 */
export function generateStaticParams() {
  return SETTINGS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: SETTINGS.find((s) => s.slug === slug)?.label ?? "Settings" };
}

export default async function SettingsSection({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const i = SETTINGS.findIndex((s) => s.slug === slug);
  if (i < 0) notFound();
  const s = SETTINGS[i];
  const prev = SETTINGS[i - 1];
  const next = SETTINGS[i + 1];
  const Icon = ICONS[s.icon];
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3.5">
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${TONE[s.tone].chip}`}><Icon className="h-5 w-5" /></span>
        <div>
          <p className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-[#0a0a0a]/40">{s.group}</p>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em]">{s.label}</h1>
          <p className="text-[14px] text-[#0a0a0a]/55">{s.blurb}</p>
        </div>
      </div>
      <div className="flex flex-col gap-3">{BODY[s.slug]}</div>
      <nav aria-label="Other settings" className="mt-2 grid grid-cols-2 gap-3 border-t border-[#0a0a0a]/[0.07] pt-5">
        {prev ? (
          <Link href={`/new-admin/settings/${prev.slug}`} className="group flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13.5px] hover:bg-white">
            <ArrowLeft className="h-4 w-4 text-[#0a0a0a]/40 transition-transform group-hover:-translate-x-0.5" />
            <span><span className="block text-[11.5px] text-[#0a0a0a]/45">Before</span><span className="font-semibold">{prev.label}</span></span>
          </Link>
        ) : <span />}
        {next && (
          <Link href={`/new-admin/settings/${next.slug}`} className="group flex items-center justify-end gap-2 rounded-xl px-3 py-2.5 text-right text-[13.5px] hover:bg-white">
            <span><span className="block text-[11.5px] text-[#0a0a0a]/45">Next</span><span className="font-semibold">{next.label}</span></span>
            <ArrowRight className="h-4 w-4 text-[#0a0a0a]/40 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </nav>
    </div>
  );
}
