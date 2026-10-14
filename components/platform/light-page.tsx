import type { ReactNode } from "react";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { PlatformFooter } from "@/components/platform/platform-footer";
import { SiteHeader } from "@/components/platform/site-header";
import { SectionTabBar, type HelpSection } from "@/components/platform/help-switch";
import type { SearchItem } from "@/components/platform/help-search";

/**
 * The frame of the site's help pages (docs, help, release notes): the site
 * header with this page's link lit, a white page, the light footer, and on a
 * phone the tab bar along the bottom. `data-lp-light` is what makes the shared
 * dark header and footer stand aside (app/globals.css), as on the front page.
 * `search` adds entries of the page's own to the search (the release notes
 * add theirs).
 */
export function LightPage({ children, section, search = [] }: { children: ReactNode; section?: HelpSection; search?: SearchItem[] }) {
  return (
    <div data-lp-light className={`bg-white text-[#0d0d50] ${section ? "pb-24 md:pb-0" : ""}`}>
      <SiteHeader active={section} search={search} />
      {children}
      <PlatformFooter tone="light" />
      {section && <SectionTabBar active={section} />}
    </div>
  );
}

/**
 * The top of a help page (14 October): a band in the page's own colour,
 * short enough that the content starts in the first screen. The title and one
 * line on the left; on the right whatever helps first on that page (search,
 * your numbers); under it, anything that belongs to the whole page.
 * `narrow` lines it up with a narrower page body (the release notes).
 */
const BAND: Record<HelpSection, { bg: string; chip: string; label: string }> = {
  docs: { bg: "bg-[linear-gradient(115deg,#ececff_0%,#f3f1ff_50%,#eef5ff_100%)]", chip: "bg-[#6666ff] text-white", label: "text-[#4b4bea]" },
  support: { bg: "bg-[linear-gradient(115deg,#e2f7ec_0%,#eefaf4_50%,#eef6ff_100%)]", chip: "bg-[#1f9d68] text-white", label: "text-[#16704a]" },
  "release-notes": { bg: "bg-[linear-gradient(115deg,#e3f1ff_0%,#eef6ff_50%,#f2f0ff_100%)]", chip: "bg-[#2f86cf] text-white", label: "text-[#1b5d97]" },
};

export function PageBand({
  section,
  icon: Icon,
  label,
  title,
  lead,
  aside,
  children,
  narrow = false,
}: {
  narrow?: boolean;
  section: HelpSection;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  title: ReactNode;
  lead: string;
  aside?: ReactNode;
  children?: ReactNode;
}) {
  const b = BAND[section];
  return (
    <section className={`relative isolate overflow-hidden border-b border-[#0d0d50]/[0.06] px-5 pb-9 pt-28 sm:pt-32 ${b.bg}`}>
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(rgba(13,13,80,0.07)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:linear-gradient(90deg,transparent,#000_40%,#000_70%,transparent)]" />
      <div className={`mx-auto grid items-end gap-7 lg:grid-cols-[minmax(0,1fr)_auto] ${narrow ? "max-w-[62rem]" : "max-w-[78rem]"}`}>
        <div className="min-w-0">
          <p className={`flex items-center gap-2.5 text-[13px] font-bold uppercase tracking-[0.12em] ${b.label}`}>
            <span className={`grid h-8 w-8 place-items-center rounded-xl ${b.chip}`}>
              <Icon className="h-4 w-4" />
            </span>
            {label}
          </p>
          <h1 className="mt-4 text-[2.2rem] font-semibold leading-[1.05] tracking-[-0.04em] sm:text-[2.9rem]">{title}</h1>
          <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-[#0d0d50]/65">{lead}</p>
        </div>
        {aside && <div className="min-w-0 lg:w-[24rem]">{aside}</div>}
      </div>
      {children && <div className={`mx-auto mt-7 ${narrow ? "max-w-[62rem]" : "max-w-[78rem]"}`}>{children}</div>}
    </section>
  );
}

/**
 * What is broken right now (14 October), in amber so it cannot be mistaken
 * for anything else on the page. `full` lists every issue with what to do
 * instead (the help page); otherwise one line that leads there.
 */
export function KnownIssuesStrip({ issues, full = false }: { issues: [string, string][]; full?: boolean }) {
  if (issues.length === 0) return null;
  if (!full) {
    return (
      <div className="border-b border-[#f0b45c]/30 bg-[#fff7ea] px-5">
        <Link href="/support#known-issues" className="mx-auto flex max-w-[78rem] items-center gap-3 py-3 text-[14.5px] text-[#6b3d00]">
          <TriangleAlert className="h-4 w-4 shrink-0 text-[#d97706]" />
          <span className="font-bold">Known issue{issues.length > 1 ? `s (${issues.length})` : ""}:</span>
          <span className="min-w-0 flex-1 truncate">{issues[0][0]}</span>
          <span className="hidden shrink-0 font-semibold underline-offset-4 hover:underline sm:inline">What to do instead</span>
        </Link>
      </div>
    );
  }
  return (
    <section id="known-issues" aria-labelledby="known-issues-title" className="scroll-mt-28 border-b border-[#f0b45c]/30 bg-[#fff7ea] px-5 py-6">
      <div className="mx-auto flex max-w-[78rem] flex-col gap-4 lg:flex-row lg:items-start lg:gap-8">
        <div className="flex shrink-0 items-center gap-3 lg:w-56 lg:flex-col lg:items-start lg:gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f59e0b] text-white">
            <TriangleAlert className="h-5 w-5" />
          </span>
          <div>
            <h2 id="known-issues-title" className="text-[17px] font-bold text-[#5a3300]">Known issues right now</h2>
            <p className="text-[13.5px] text-[#6b3d00]/75">Already on our list. No need to report these.</p>
          </div>
        </div>
        <ul className="grid flex-1 gap-3 md:grid-cols-2">
          {issues.map(([t, d]) => (
            <li key={t} className="rounded-2xl bg-white p-4 ring-1 ring-[#f0b45c]/35">
              <p className="text-[15.5px] font-semibold leading-snug text-[#0d0d50]">{t}</p>
              <p className="mt-1.5 text-[15px] leading-relaxed text-[#0d0d50]/75">
                <span className="font-semibold text-[#b45309]">Instead: </span>
                {d}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
