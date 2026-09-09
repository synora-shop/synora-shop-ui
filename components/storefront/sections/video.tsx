import Link from "next/link";
import { ImagePlaceholder } from "@/components/storefront/image-placeholder";

const HEIGHT: Record<string, string> = {
  small: "aspect-[21/9]",
  medium: "aspect-video",
  large: "aspect-[4/3] sm:aspect-[21/9] sm:min-h-[560px]",
};

/**
 * A video, from a link the merchant pasted.
 *
 * Three kinds of link have to work, because a merchant will paste whichever
 * they have: a YouTube page, a Vimeo page, or a direct file. The first two
 * become an embed, the third a real `<video>`. Anything else renders the cover
 * image alone rather than an error — a section that shows a photo is a worse
 * page, and a section that shows a broken frame is a broken shop.
 *
 * Nothing autoplays with sound. An unexpected voice on a storefront is the
 * fastest way to lose the tab.
 */
function embedUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = url.searchParams.get("v");
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (host === "youtu.be") {
      const id = url.pathname.slice(1);
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (host === "vimeo.com") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
    }
    return null;
  } catch {
    return null;
  }
}

const isFile = (raw: string) => /\.(mp4|webm|ogg)(\?|$)/i.test(raw);

export function VideoSection({
  url,
  poster,
  heading,
  body,
  height = "medium",
  overlayOpacity = 30,
  ctaLabel,
  ctaHref,
}: {
  url?: string;
  poster?: string;
  heading?: string;
  body?: string;
  height?: string;
  overlayOpacity?: number;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  const src = (url ?? "").trim();
  const embed = src ? embedUrl(src) : null;
  const file = src && isFile(src) ? src : null;

  // Nothing to show at all — not even a poster — so the section stays out of
  // the page rather than leaving a coloured rectangle in it.
  if (!embed && !file && !poster) return null;

  const hasWords = !!(heading || body || (ctaLabel && ctaHref));

  return (
    <div className={`relative overflow-hidden rounded-lg bg-ink ${HEIGHT[height] ?? HEIGHT.medium}`}>
      {embed ? (
        <iframe
          src={embed}
          title={heading || "Video"}
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      ) : file ? (
        <video
          src={file}
          poster={poster || undefined}
          controls
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : poster ? (
        // eslint-disable-next-line @next/next/no-img-element -- a merchant-pasted URL, not a known-size asset
        <img src={poster} alt={heading || ""} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <ImagePlaceholder kind="product" variant={3} className="absolute inset-0 h-full w-full" />
      )}

      {/* Words only over a still. Laying a heading over a playing embed covers
          its controls, and a customer who cannot press pause is stuck. */}
      {hasWords && !embed && !file && (
        <>
          <div className="absolute inset-0 bg-black" style={{ opacity: (overlayOpacity ?? 30) / 100 }} />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-white">
            {heading && <h2 className="font-serif text-3xl font-semibold sm:text-4xl">{heading}</h2>}
            {body && <p className="max-w-xl whitespace-pre-line text-sm text-white/90">{body}</p>}
            {ctaLabel && ctaHref && (
              <Link
                href={ctaHref}
                className="mt-1 rounded-full bg-white px-6 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-white/90"
              >
                {ctaLabel}
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  );
}
