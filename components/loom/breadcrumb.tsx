import { cn } from "@/lib/utils";
import { T } from "@/components/loom/type";

/**
 * Where this page sits — not in the kit, so drawn in its smallest voice: the
 * utility strip's 13/16 Medium at 50%, the page itself at 80%. Above the page,
 * in the gutter, 24 above and below on desktop and 16 under on the phone.
 */
export function LoomBreadcrumb({ trail, current }: { trail: { label: string; href: string }[]; current: string }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(T.small, "px-[calc(16*var(--u))] pb-[calc(16*var(--u))] text-black/50 md:px-[calc(60*var(--u))] md:py-[calc(24*var(--u))]")}
    >
      <ol className="flex flex-wrap gap-[calc(8*var(--u))]">
        {trail.map((t) => (
          <li key={t.label}>
            <a href={t.href}>{t.label}</a> /
          </li>
        ))}
        <li aria-current="page" className="text-black/80">
          {current}
        </li>
      </ol>
    </nav>
  );
}
