import type { Metadata } from "next";
import { listReleaseNotes } from "@/lib/release-notes-data";
import { ReleaseEditor } from "@/components/synora/release-editor";

export const metadata: Metadata = { title: "Patch notes" };

/** Publishing the patch notes merchants read at /release-notes (14 October). */
export default async function SynoraReleaseNotesPage() {
  const notes = await listReleaseNotes();
  return (
    <>
      <h1 className="text-[2rem] font-semibold tracking-[-0.035em]">Patch notes</h1>
      <p className="mb-7 mt-1 text-[16px] text-[#0d0d50]/55">What merchants read at /release-notes. Write it for the person running the shop.</p>
      <ReleaseEditor notes={notes} />
    </>
  );
}
