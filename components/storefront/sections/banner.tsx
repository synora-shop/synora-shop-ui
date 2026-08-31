import Link from "next/link";
import { cn } from "@/lib/utils";

// The background image and overlay are absolutely positioned against
// SectionFrame's `relative` wrapper, so this section still gets the shared
// spacing/width settings instead of hard-coding its own shell.
export function Banner({
  image,
  headline,
  ctaLabel,
  ctaHref,
  textAlign = "center",
}: {
  image?: string;
  headline?: string;
  ctaLabel?: string;
  ctaHref?: string;
  textAlign?: "left" | "center" | "right";
}) {
  if (!headline && !image) return null;
  const align =
    textAlign === "left" ? "items-start text-left" : textAlign === "right" ? "items-end text-right" : "items-center text-center";

  return (
    <>
      {image && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- admin-uploaded banner image, arbitrary URL */}
          <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/30" />
        </>
      )}
      <div className={cn("relative z-10 flex min-h-[28vh] flex-col justify-center gap-4", align)}>
        {headline && (
          <h2
            className={cn(
              "max-w-2xl font-serif text-3xl font-semibold sm:text-4xl",
              image ? "text-white" : "text-ink",
              textAlign === "center" && "mx-auto"
            )}
          >
            {headline}
          </h2>
        )}
        {ctaLabel && ctaHref && (
          <Link
            href={ctaHref}
            className="inline-flex w-fit items-center rounded-full bg-brand-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600 active:bg-brand-700"
          >
            {ctaLabel}
          </Link>
        )}
      </div>
    </>
  );
}
