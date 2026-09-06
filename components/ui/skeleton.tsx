import { cn } from "@/lib/utils";

/**
 * The shape of something that has not arrived yet.
 *
 * Every admin screen is dynamic, so moving between them waits on the server —
 * and with nothing to show for it, the panel appeared to ignore the click while
 * the old screen sat there. A skeleton is not decoration: it is the difference
 * between "loading" and "broken".
 *
 * It draws the *shape* of what is coming — a bar of rows where rows will be, a
 * grid of tiles where tiles will be — so the page does not jump when the real
 * thing lands.
 *
 * `motion-safe` on the pulse, because a page of throbbing blocks is exactly
 * what someone who has turned animation off has turned it off to avoid.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("motion-safe:animate-pulse rounded-md bg-panel", className)}
    />
  );
}

/** A stand-in for one row in a list. */
export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Skeleton className="h-8 w-8 flex-shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-2.5 w-1/5" />
      </div>
      <Skeleton className="h-3 w-16 flex-shrink-0" />
      <Skeleton className="h-5 w-20 flex-shrink-0 rounded-full" />
      <Skeleton className="h-3 w-20 flex-shrink-0" />
    </div>
  );
}

/**
 * The shape most admin screens take: a bar of controls, then a list.
 *
 * `rows` is deliberately a fixed number rather than the real count, which is
 * not known yet — enough to fill the fold and no more, so the skeleton never
 * suggests more content than arrives.
 */
export function SkeletonList({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-panel p-2">
        <Skeleton className="h-10 w-72 rounded-pill bg-control" />
        <Skeleton className="h-10 w-10 rounded-pill bg-control" />
        <Skeleton className="h-10 w-32 rounded-pill bg-control" />
        <Skeleton className="ml-auto h-10 w-28 rounded-pill bg-control" />
      </div>
      <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
        {Array.from({ length: rows }, (_, i) => <SkeletonRow key={i} />)}
      </div>
    </div>
  );
}
