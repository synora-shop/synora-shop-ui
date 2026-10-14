import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { appUrl } from "@/lib/shop-context";
import { listReleaseNotes } from "@/lib/release-notes-data";
import { Highlight, LightPage, LightPageHero } from "@/components/platform/light-page";
import { ReleaseTimeline } from "@/components/platform/release-timeline";
import { SearchBar } from "@/components/platform/help-search";

export const metadata: Metadata = {
  title: "Release notes",
  description: "What changed in Synora App, when, and what it means for a shop that is already open.",
  alternates: { canonical: appUrl("/release-notes") },
  robots: { index: false, follow: true },
};

/** Read per request: a note the team publishes shows the moment it is saved. */
export const dynamic = "force-dynamic";

/**
 * Release notes (14 October): every update and what it fixed, written for
 * the person running the shop. Published by the Synora team from the console
 * (/synora/patch-notes); the newest goes on top. One of three help pages.
 */
export default async function ReleaseNotesPage() {
  const notes = await listReleaseNotes();
  const search = notes.flatMap((n) => n.changes.map((c) => ({ group: "Release notes" as const, title: n.title, text: `${c.kind}: ${c.text}`, href: `/release-notes#${n.id}` })));

  return (
    <LightPage section="release-notes" search={search}>
      <LightPageHero
        pill={notes[0] ? `Latest: ${notes[0].dateLabel}` : "Release notes"}
        title={
          <>
            What&rsquo;s new in
            <br />
            <Highlight>Synora App.</Highlight>
          </>
        }
        lead="Every update, what it fixed, and what it means for a shop that is already open. Written for the person running the shop."
      >
        <SearchBar placeholder="Search updates, docs and answers" />
      </LightPageHero>

      <div className="mx-auto max-w-[78rem] px-5 pb-24">
        {notes.length > 0 ? <ReleaseTimeline notes={notes} /> : <p className="py-16 text-center text-[17px] text-[#0d0d50]/60">The first notes are on their way.</p>}

        <div className="mt-4 flex flex-col items-start justify-between gap-4 rounded-[2rem] bg-[#0d0d50] p-7 text-white sm:flex-row sm:items-center sm:p-9">
          <div>
            <p className="text-xl font-semibold tracking-[-0.02em]">Something not working, or an idea?</p>
            <p className="mt-1 text-[15px] text-white/60">Tell the team, and follow it from your help page.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/help?kind=suggestion#ask" className="inline-flex h-11 items-center rounded-full border border-white/20 px-5 text-sm font-semibold transition-colors hover:bg-white/10">
              Suggest an idea
            </Link>
            <Link href="/help?kind=ticket#ask" className="inline-flex h-11 items-center gap-2 rounded-full bg-[#6666ff] px-5 text-sm font-semibold transition-colors hover:bg-[#5a5af5]">
              Report a problem <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </LightPage>
  );
}
