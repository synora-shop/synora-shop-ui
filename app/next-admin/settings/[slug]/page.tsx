import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Page } from "@/components/next-admin/ui";
import { Act } from "@/components/next-admin/act";
import { SettingsNav } from "@/components/next-admin/settings-bits";
import { BODY } from "@/components/next-admin/settings-body";
import { A, STORE_SETTINGS } from "@/components/next-admin/nav";

/** One settings section at a time (third design): the list stays put, the section fills the right. */
export function generateStaticParams() {
  return STORE_SETTINGS.map((s) => ({ slug: s.slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: STORE_SETTINGS.find((s) => s.slug === slug)?.label ?? "Settings" };
}

export default async function SettingsSection({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const i = STORE_SETTINGS.findIndex((s) => s.slug === slug);
  if (i < 0) notFound();
  const s = STORE_SETTINGS[i];
  const prev = STORE_SETTINGS[i - 1];
  const next = STORE_SETTINGS[i + 1];
  return (
    <Page title={s.label} crumbs={[{ label: "Settings", href: `${A}/settings` }]} sub={s.blurb} actions={<Act kind="primary" msg={`${s.label} saved`}>Save</Act>}>
      <div className="grid gap-4 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <SettingsNav />
        <div className="flex min-w-0 max-w-3xl flex-col gap-2.5">
          {BODY[s.slug]}
          <nav aria-label="Other settings" className="mt-1 flex justify-between gap-3 text-[12.5px]">
            {prev ? <Link href={`${A}/settings/${prev.slug}`} className="inline-flex items-center gap-1.5 text-[#71717a] hover:text-[#18181b]"><ArrowLeft className="h-3.5 w-3.5" /> {prev.label}</Link> : <span />}
            {next && <Link href={`${A}/settings/${next.slug}`} className="inline-flex items-center gap-1.5 text-[#71717a] hover:text-[#18181b]">{next.label} <ArrowRight className="h-3.5 w-3.5" /></Link>}
          </nav>
        </div>
      </div>
    </Page>
  );
}
