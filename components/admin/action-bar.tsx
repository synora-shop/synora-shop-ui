import { cn } from "@/lib/utils";

/**
 * The row of things you can *do* to the list below it.
 *
 * Creating, deleting, importing, exporting, filtering, sorting, choosing how
 * the rows are drawn and how many of them fit on a page — and, on a screen that
 * can be edited, Discard and Save. One place for all of it, on every screen, so
 * a merchant never has to work out where this particular page keeps its buttons.
 *
 * A plain container by design. It takes whatever a page needs; anything meant
 * for the right-hand end carries `ml-auto`, which is the only convention.
 */
export function ActionBar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-2xl bg-panel p-2.5",
        className
      )}
    >
      {children}
    </div>
  );
}
