import Image from "next/image";
import { PLATFORM_ROOT_DOMAIN } from "@/lib/shop-context";

/**
 * A picture in a storefront section, optimised where it can be.
 *
 * Every section took its image with a bare `<img>`, each with an
 * eslint-disable saying "arbitrary URL". That reason is real — a merchant may
 * paste a link from anywhere, and `next/image` answers 400 for a host that is
 * not in `remotePatterns`, which would be a broken photograph on a live
 * storefront rather than an unoptimised one.
 *
 * But it was applied to every image rather than to the ones it describes. An
 * image *uploaded* through the admin lands in Vercel Blob, which is already an
 * allowed host, and that is the common case — so most storefront photography
 * was being served at full size, in its original format, with no cache
 * headers, to protect the minority that is pasted from elsewhere.
 *
 * The decision belongs to the URL, not to the component. A host we optimise
 * goes through next/image; anything else is served as it was given, which is
 * exactly what happened before and is the honest fallback.
 *
 * `sizes` matters here and is easy to get wrong: without it next/image
 * generates the widest candidate for a `fill` image, which is worse than not
 * optimising at all. Each caller passes what the section actually occupies.
 */

/** Hosts next/image is configured to fetch and re-encode — see next.config.ts. */
function optimisable(url: string): boolean {
  // A relative path is ours, always.
  if (url.startsWith("/")) return true;
  let host: string;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    host = parsed.hostname.toLowerCase();
  } catch {
    return false;
  }
  return (
    host === "picsum.photos" ||
    host.endsWith(".public.blob.vercel-storage.com") ||
    host === PLATFORM_ROOT_DOMAIN ||
    host.endsWith(`.${PLATFORM_ROOT_DOMAIN}`)
  );
}

export function SectionImage({
  src,
  alt,
  className,
  sizes = "100vw",
  priority = false,
  width,
  height,
}: {
  /** Optional, because several sections let a merchant leave one blank. */
  src: string | null | undefined;
  alt: string;
  className?: string;
  /** What this image actually occupies, so the right width is generated. */
  sizes?: string;
  /** True only for an image above the fold — a hero, never a thumbnail. */
  priority?: boolean;
  /**
   * For an image drawn at a fixed size — a logo, an avatar.
   *
   * Without these it fills its parent, which needs that parent to be
   * positioned and sized. A 48px logo has neither, and `fill` on one would
   * stretch it across whatever box happened to contain it.
   */
  width?: number;
  height?: number;
}) {
  // A section a merchant has not finished filling in. The raw tag rendered a
  // broken image for this; nothing is the better answer.
  if (!src) return null;

  if (!optimisable(src)) {
    // Given to us from somewhere we do not re-encode. Served as it is, which
    // is what every section did for all of them until now.
    // eslint-disable-next-line @next/next/no-img-element -- a host outside remotePatterns; next/image would 400 rather than degrade
    return <img src={src} alt={alt} className={className} loading={priority ? "eager" : "lazy"} />;
  }

  if (width && height) {
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className={className}
      />
    );
  }

  return (
    <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={className} />
  );
}
