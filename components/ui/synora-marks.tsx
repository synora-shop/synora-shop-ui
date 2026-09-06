import { cn } from "@/lib/utils";

/**
 * The marks and glyphs drawn for this product, as shipped in Assestz/SVG.
 *
 * The wordmark used to be built here out of HTML — a span of text and a
 * coloured chip — which put it in whatever interface font the browser had and
 * made the lockup approximate. This is the drawn one: real outlines, the real
 * typeface, the real spacing.
 *
 * All of them take `currentColor`, so a mark inherits the colour of whatever it
 * sits in rather than carrying the #333 the source files were saved with. That
 * is what lets the same file work on the grey panel, in a dark menu, and on a
 * coloured button without a second copy.
 *
 * @see components/admin/nav-icons.tsx for the six sidebar glyphs.
 */

type MarkProps = { className?: string; title?: string };

/**
 * "synora app".
 *
 * One path: the word, and the chip with "app" knocked out of it. Knocked out
 * rather than painted, so whatever is behind the mark shows through the
 * letters — which is why it needs no second colour and works on any ground.
 */
export function SynoraAppMark({ className, title = "synora app" }: MarkProps) {
  return (
    <svg
      viewBox="0 0 154.98 26.69"
      role="img"
      aria-label={title}
      fill="currentColor"
      // Sized by height; the width follows the artwork's own proportion.
      className={cn("h-[18px] w-auto", className)}
    >
      <g id="Layer_1-2" data-name="Layer 1"> <path d="M53.67,4.89c-4.24,0-7.79,3.05-7.79,7.51s3.55,7.63,7.79,7.63,7.83-3.16,7.83-7.63-3.59-7.51-7.83-7.51ZM53.67,16.75c-2.24,0-3.98-1.7-3.98-4.35s1.74-4.24,3.98-4.24,4.01,1.6,4.01,4.24-1.76,4.35-4.01,4.35ZM25.03,5.35h3.73l-5.46,14.22v2.33c0,2.47-.91,3.36-3.39,3.36h-4.3v-3.1h4.07v-2.59l-5.52-14.22h3.81l3.5,9.59,3.56-9.59ZM44.18,10.87v8.7h-3.73v-7.68c0-2.56-1.17-3.61-2.96-3.61-2.25,0-3.64,1.56-3.64,4.24v7.05h-3.73V5.35h3.73v2.56c1.08-1.96,2.7-3.02,5.01-3.02,3.58,0,5.32,2.16,5.32,5.97ZM13.94,15.19c0,3.39-2.96,4.86-6.88,4.86-4.67,0-7.05-2.16-7.05-5.43h3.56c0,1.39.94,2.67,3.39,2.67,2.08,0,3.1-.8,3.1-1.85,0-3.13-9.59-.11-9.59-5.83,0-3.04,2.56-4.72,6.4-4.72,4.15,0,6.83,1.96,6.83,5.06h-3.67c0-1.48-1.37-2.28-3.13-2.28-1.56,0-2.59.63-2.59,1.59,0,2.93,9.64-.14,9.64,5.92ZM150.1,0h-45.12c-2.69,0-4.88,2.18-4.88,4.88v16.93c0,2.69,2.19,4.88,4.88,4.88h45.12c2.7,0,4.88-2.19,4.88-4.88V4.88c0-2.7-2.18-4.88-4.88-4.88ZM118.98,18.58h-1.96v-1.56c-1.09,1.25-2.66,1.94-4.54,1.94-3.82,0-6.6-2.91-6.6-6.91s2.71-6.8,6.6-6.8c1.9,0,3.46.65,4.54,1.87v-1.5h1.96v12.96ZM128.13,18.96c-1.87,0-3.45-.69-4.54-1.95v6.3h-1.98V5.62h1.98v1.5c1.08-1.22,2.64-1.87,4.54-1.87,3.89,0,6.6,2.8,6.6,6.8s-2.77,6.91-6.6,6.91ZM142.61,18.96c-1.88,0-3.45-.69-4.54-1.94v6.29h-1.98V5.62h1.98v1.5c1.08-1.22,2.63-1.87,4.54-1.87,3.88,0,6.6,2.8,6.6,6.8s-2.78,6.91-6.6,6.91ZM147.2,12.05c0,3.27-2.32,4.97-4.61,4.97-2.66,0-4.52-2.04-4.52-4.97s1.81-4.87,4.52-4.87,4.61,2,4.61,4.87ZM132.72,12.05c0,3.27-2.32,4.97-4.61,4.97-2.66,0-4.52-2.04-4.52-4.97s1.82-4.87,4.52-4.87,4.61,2,4.61,4.87ZM117.02,12.05c0,2.93-1.86,4.97-4.52,4.97-2.29,0-4.61-1.7-4.61-4.97,0-2.87,1.89-4.87,4.61-4.87s4.52,1.96,4.52,4.87ZM86.22,7.42c-1.03-1.59-2.71-2.53-4.93-2.53-3.89,0-6.68,3.02-6.68,7.54s2.79,7.6,6.68,7.6c2.22,0,3.9-.97,4.93-2.59v2.13h3.61V5.35h-3.61v2.07ZM82.2,16.75c-2.27,0-3.78-1.67-3.78-4.35s1.51-4.24,3.78-4.24,3.99,1.57,3.99,4.24-1.68,4.35-3.99,4.35ZM66.19,5.35h8.14v3.1h-7.2v11.12h-3.73v-11.38c0-2.08.74-2.84,2.79-2.84Z"/> </g>
    </svg>
  );
}

/** The circled i, for "what does this mean?". */
export function InfoIcon({ className, title }: MarkProps) {
  return (
    <svg
      viewBox="0 0 20.37 20.37"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      fill="currentColor"
      className={cn("h-4 w-4 flex-shrink-0", className)}
    >
      <g id="Layer_1-2" data-name="Layer 1"> <path d="M10.19,0C4.56,0,0,4.56,0,10.19s4.56,10.19,10.19,10.19,10.19-4.56,10.19-10.19S15.81,0,10.19,0ZM10.19,1.85c4.6,0,8.33,3.73,8.33,8.33s-3.73,8.33-8.33,8.33S1.85,14.79,1.85,10.19,5.58,1.85,10.19,1.85ZM10.19,5.09c-.77,0-1.39.62-1.39,1.39s.62,1.39,1.39,1.39,1.39-.62,1.39-1.39-.62-1.39-1.39-1.39ZM10.19,9.26c-.51,0-.93.41-.93.93v4.63c0,.51.41.93.93.93s.93-.41.93-.93v-4.63c0-.51-.41-.93-.93-.93Z"/> </g>
    </svg>
  );
}

/** The box-and-arrow that means "this opens somewhere else". */
export function ExternalLinkIcon({ className, title }: MarkProps) {
  return (
    <svg
      viewBox="0 0 19.44 19.44"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      fill="currentColor"
      className={cn("h-3.5 w-3.5 flex-shrink-0", className)}
    >
      <g id="Layer_1-2" data-name="Layer 1"> <path d="M12.96,0c-.51,0-.93.41-.93.93s.41.93.93.93h3.32l-7.68,7.68c-.36.36-.36.95,0,1.31.18.18.42.27.65.27s.47-.09.65-.27l7.68-7.68v3.32c0,.51.41.93.93.93s.93-.41.93-.93V.93c0-.51-.41-.93-.93-.93h-5.56ZM2.78.93C1.25.93,0,2.17,0,3.7v12.96c0,1.53,1.25,2.78,2.78,2.78h12.96c1.53,0,2.78-1.25,2.78-2.78v-5.56c0-.51-.41-.93-.93-.93s-.93.41-.93.93v5.56c0,.51-.42.93-.93.93H2.78c-.51,0-.93-.42-.93-.93V3.7c0-.51.42-.93.93-.93h5.56c.51,0,.93-.41.93-.93s-.41-.93-.93-.93H2.78Z"/> </g>
    </svg>
  );
}
