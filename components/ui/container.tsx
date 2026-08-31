import { cn } from "@/lib/utils";

export function Container({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  // max-width comes from a CSS variable so the Theme panel's "Content width"
  // token applies everywhere at once; it falls back to the original 80rem when
  // no theme is set.
  return (
    <div
      style={{ maxWidth: "var(--shp-container, 80rem)" }}
      className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", className)}
    >
      {children}
    </div>
  );
}
