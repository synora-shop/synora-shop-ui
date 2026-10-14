import type { Metadata } from "next";
import { RequestList } from "@/components/synora/request-list";

export const metadata: Metadata = { title: "Tickets" };

/** Tickets received from /help (14 October). */
export default async function SynoraTicketsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status, q } = await searchParams;
  return (
    <>
      <h1 className="text-[2rem] font-semibold tracking-[-0.035em]">Tickets</h1>
      <p className="mb-7 mt-1 text-[16px] text-[#0d0d50]/55">Problems merchants reported. Oldest waiting first.</p>
      <RequestList kind="TICKET" status={status} q={q} base="/synora/tickets" />
    </>
  );
}
