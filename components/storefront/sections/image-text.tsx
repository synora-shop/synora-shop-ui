import { StoreLink as Link } from "@/components/storefront/store-link";
import { SectionImage } from "@/components/storefront/section-image";
import { cn } from "@/lib/utils";

export function ImageText({
  image,
  heading,
  body,
  imagePosition = "left",
  ctaLabel,
  ctaHref,
}: {
  image?: string;
  heading?: string;
  body?: string;
  imagePosition?: "left" | "right";
  ctaLabel?: string;
  ctaHref?: string;
}) {
  if (!heading && !body && !image) return null;
  return (
    <div
      className={cn(
        "grid items-center gap-10 md:grid-cols-2",
        imagePosition === "right" && "md:[&>*:first-child]:order-2"
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-subtle">
        {image && (
          <SectionImage
      src={image}
      alt=""
      className="h-full w-full object-cover"
      sizes="(min-width: 1024px) 50vw, 100vw"
    />
        )}
      </div>
      <div className="space-y-4">
        {heading && <h2 className="font-serif text-3xl font-semibold">{heading}</h2>}
        {body && <p className="whitespace-pre-line text-ink-soft">{body}</p>}
        {ctaLabel && ctaHref && (
          <Link
            href={ctaHref}
            className="inline-flex items-center rounded-full bg-brand-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600 active:bg-brand-700"
          >
            {ctaLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
