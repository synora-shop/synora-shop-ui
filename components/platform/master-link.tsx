import Link from "next/link";

/**
 * "Master dashboard" (14 October), shown only to Synora master admins: a
 * plain link like its neighbours, told apart by one small gold dot, the same
 * gold as a master admin's initials (components/platform/account-avatar.tsx).
 */
const Dot = () => <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#e3b94f]" />;

/** In the header, beside Dashboard. `short` says "Master" where room is tight. */
export function MasterDashboardLink({ short = false, onClick, className = "" }: { short?: boolean; onClick?: () => void; className?: string }) {
  return (
    <Link
      href="/synora"
      onClick={onClick}
      className={`inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-3.5 text-[13.5px] font-semibold text-[#0d0d50]/75 transition-colors hover:bg-[#f4f4fa] hover:text-[#0d0d50] ${className}`}
    >
      <Dot />
      {short ? "Master" : "Master dashboard"}
    </Link>
  );
}

/** In the footer, in the footer's own link style. */
export function MasterDashboardFooterLink({ className }: { className: string }) {
  return (
    <Link href="/synora" className={`inline-flex items-center gap-2 ${className}`}>
      Master dashboard <Dot />
    </Link>
  );
}

export { Dot as MasterDot };
