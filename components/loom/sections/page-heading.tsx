import { cn } from "@/lib/utils";
import { T } from "@/components/loom/type";

/**
 * The heading every page the kit does not draw opens with: an optional
 * eyebrow in Single text 2, the title in Heading 1 (Heading 3 on the phone),
 * an optional aside at the right — a count, a line of copy. The collection,
 * the cart and the account set theirs the same way.
 */
export function LoomPageHeading({
  eyebrow,
  title,
  aside,
  m,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  aside?: React.ReactNode;
  m?: string;
}) {
  return (
    <header className="flex flex-col gap-[calc(16*var(--u))] pb-[calc(24*var(--u))] md:flex-row md:items-end md:justify-between md:pb-[calc(32*var(--u))]">
      <div className="flex flex-col gap-[calc(8*var(--u))]">
        {eyebrow ? <p className={cn(T.single2, "uppercase text-[#121212]/80")}>{eyebrow}</p> : null}
        <h1 data-m={m} className={cn(T.h3, "text-[#121212] md:text-[calc(65*var(--u))] md:leading-[calc(65*var(--u))] md:tracking-[calc(-4*var(--u))]")}>
          {title}
        </h1>
      </div>
      {aside ? <div className={cn(T.body6, "text-[#121212]/80 md:max-w-[calc(411*var(--u))] md:text-[max(calc(18*var(--u)),14.4px)]")}>{aside}</div> : null}
    </header>
  );
}

/** The gutter and foot every such page's main section has. */
export const PAGE_SECTION = "px-[calc(16*var(--u))] pb-[calc(40*var(--u))] md:px-[calc(60*var(--u))] md:pb-[calc(120*var(--u))]";
