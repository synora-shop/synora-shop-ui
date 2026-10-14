import type { Metadata } from "next";
import { RequestList } from "@/components/synora/request-list";

export const metadata: Metadata = { title: "Suggestions" };

/** Suggestions received from /help (14 October). */
export default async function SynoraSuggestionsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status, q } = await searchParams;
  return (
    <>
      <h1 className="text-[2rem] font-semibold tracking-[-0.035em]">Suggestions</h1>
      <p className="mb-7 mt-1 text-[16px] text-[#0d0d50]/55">Ideas merchants sent. Move them along and they hear about it.</p>
      <RequestList kind="SUGGESTION" status={status} q={q} base="/synora/suggestions" />
    </>
  );
}
