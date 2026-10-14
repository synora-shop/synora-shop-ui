import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireSynoraTeam } from "@/lib/help-server";
import { SynoraAppMark } from "@/components/ui/synora-marks";
import { ConsoleNav } from "@/components/synora/console-nav";
import { ConsoleAccount } from "@/components/synora/console-account";
import { teamInitials } from "@/lib/team";
import { initialsOf } from "@/lib/initials";

export const metadata: Metadata = { title: { default: "Synora console", template: "%s · Synora console" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * The Synora console (14 October): where the Synora team reads and answers
 * tickets and suggestions from /help and publishes the release notes.
 *
 * Not a merchant's panel and not styled like one: it is ours. Only the
 * addresses in SYNORA_TEAM_EMAILS get in (lib/help-server.ts); everyone else,
 * signed in or not, gets a 404, so nobody learns it is here.
 */
export default async function SynoraConsoleLayout({ children }: { children: React.ReactNode }) {
  const me = await requireSynoraTeam();
  const initials = teamInitials(me.email) || initialsOf(me.name, me.email);
  const [tickets, suggestions] = await Promise.all([
    prisma.helpRequest.count({ where: { kind: "TICKET", status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.helpRequest.count({ where: { kind: "SUGGESTION", status: { in: ["OPEN", "UNDER_REVIEW"] } } }),
  ]);

  return (
    <div className="min-h-dvh bg-[#f6f6fb] font-sans text-[#0d0d50] lg:grid lg:grid-cols-[16.5rem_minmax(0,1fr)]">
      <aside className="border-b border-[#0d0d50]/[0.06] bg-white px-4 py-4 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
        <div className="mb-4 flex items-center justify-between gap-3 lg:mb-8 lg:block">
          <div className="flex items-center gap-3 lg:block">
            <Link href="/synora/tickets" className="flex items-center gap-2.5">
              <SynoraAppMark />
            </Link>
            <p className="rounded-full bg-[#0d0d50] px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#f2cf72] lg:mt-3 lg:inline-block">Master admin</p>
          </div>
          <div className="lg:hidden">
            <ConsoleAccount name={me.name} email={me.email} initials={initials} compact />
          </div>
        </div>
        <ConsoleNav counts={{ tickets, suggestions }} />
        <div className="mt-auto hidden flex-col gap-4 pt-5 lg:flex">
          <div className="flex flex-col gap-1.5 px-1 text-[13px] font-medium text-[#0d0d50]/60">
            <Link href="/" className="inline-flex items-center gap-1.5 hover:text-[#0d0d50]">
              Synora App front page <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <Link href="/help" className="inline-flex items-center gap-1.5 hover:text-[#0d0d50]">
              Merchants&rsquo; help page <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <Link href="/release-notes" className="inline-flex items-center gap-1.5 hover:text-[#0d0d50]">
              Public release notes <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
          <ConsoleAccount name={me.name} email={me.email} initials={initials} />
        </div>
      </aside>
      <main className="min-w-0 px-4 py-6 sm:px-8 lg:px-10 lg:py-10">{children}</main>
    </div>
  );
}
