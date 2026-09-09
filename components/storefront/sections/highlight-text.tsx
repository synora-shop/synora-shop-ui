import Link from "next/link";

const SIZE: Record<string, string> = {
  medium: "text-2xl sm:text-3xl",
  large: "text-3xl sm:text-5xl",
  huge: "text-4xl sm:text-6xl",
};

/** One line, set large. */
export function HighlightText({
  text,
  size = "large",
  align = "center",
  ctaLabel,
  ctaHref,
}: {
  text?: string;
  size?: string;
  align?: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  const words = (text ?? "").trim();
  if (!words) return null;
  const centred = align !== "left";

  return (
    <div className={centred ? "text-center" : ""}>
      <p
        className={`mx-auto max-w-4xl whitespace-pre-line font-serif font-semibold leading-tight text-ink ${
          SIZE[size] ?? SIZE.large
        } ${centred ? "" : "mx-0"}`}
      >
        {words}
      </p>
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="mt-6 inline-block rounded-full bg-brand-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
