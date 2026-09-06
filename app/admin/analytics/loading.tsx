import { Skeleton } from "@/components/ui/skeleton";

/**
 * Analytics is tiles and charts, not a list, so the shared skeleton would draw
 * the wrong shape and the page would jump when the real thing landed.
 */
export default function AnalyticsLoading() {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-panel p-2">
        <Skeleton className="h-10 w-64 rounded-pill bg-control" />
        <Skeleton className="h-10 w-44 rounded-pill bg-control" />
        <Skeleton className="ml-auto h-10 w-28 rounded-pill bg-control" />
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="space-y-2 rounded-xl border border-control-line bg-control p-3">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-2.5 w-20" />
          </div>
        ))}
      </div>

      <div className="grid gap-2.5 lg:grid-cols-2">
        {Array.from({ length: 2 }, (_, i) => (
          <div key={i} className="space-y-3 rounded-xl border border-border bg-surface p-4">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-40 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
