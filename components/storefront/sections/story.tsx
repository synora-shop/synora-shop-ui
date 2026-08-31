import Link from "next/link";

// Spacing, background and width come from SectionFrame (the shared style
// settings every section gets) — this renders content only.
export function Story({
  heading,
  body,
  ctaLabel,
  ctaHref,
}: {
  heading?: string;
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  if (!heading && !body) return null;
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      {heading && <h2 className="font-serif text-3xl font-semibold">{heading}</h2>}
      {body && <p className="max-w-xl whitespace-pre-line text-ink-soft">{body}</p>}
      {ctaLabel && ctaHref && (
        <Link href={ctaHref} className="text-sm font-medium text-brand-600 underline-scribble">
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
