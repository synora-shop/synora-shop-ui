import Link from "next/link";
import { Crown } from "lucide-react";

/**
 * "Master dashboard", the way only a Synora master admin sees it (14 October):
 * gold text on frosted glass, with the same passing sheen as the gold avatar
 * (".av-shine", app/globals.css). In the header it is a pill; in the footer,
 * a link in the same voice.
 */
export const GOLD_TEXT = "bg-[linear-gradient(100deg,#8a5a12_0%,#d9a521_35%,#f4d377_50%,#c08a1c_65%,#8a5a12_100%)] bg-clip-text text-transparent";

export function MasterDashboardPill({ compact = false, onClick }: { compact?: boolean; onClick?: () => void }) {
  return (
    <Link
      href="/synora"
      onClick={onClick}
      aria-label="Master dashboard"
      className="av-shine relative inline-flex h-10 shrink-0 items-center gap-1.5 overflow-hidden whitespace-nowrap rounded-full bg-[linear-gradient(135deg,rgba(255,243,200,0.85),rgba(245,215,130,0.45))] px-3.5 text-[13.5px] font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_6px_18px_-8px_rgba(170,120,20,0.55)] ring-1 ring-[#d9a521]/45 backdrop-blur-md transition-shadow hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_24px_-8px_rgba(170,120,20,0.7)]"
    >
      <Crown className="h-4 w-4 text-[#b8811f]" strokeWidth={2.4} />
      {!compact && <span className={GOLD_TEXT}>Master dashboard</span>}
    </Link>
  );
}

export function MasterDashboardLink({ className = "" }: { className?: string }) {
  return (
    <Link href="/synora" className={`inline-flex items-center gap-1.5 text-sm font-bold ${className}`}>
      <span className="grid h-5 w-5 place-items-center rounded-full bg-[linear-gradient(135deg,#fff3c8,#e6b84a)] ring-1 ring-[#d9a521]/50 backdrop-blur">
        <Crown className="h-3 w-3 text-[#8a5a12]" strokeWidth={2.5} />
      </span>
      <span className={GOLD_TEXT}>Master dashboard</span>
    </Link>
  );
}
