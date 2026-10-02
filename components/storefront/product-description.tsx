import { sanitizeProductHtml } from "@/lib/product-html";

/**
 * A product's description, whichever form it arrived in.
 *
 * The only place a product description is written into the page, and that is
 * the point: `dangerouslySetInnerHTML` appears here once, next to the
 * sanitiser, rather than at each of the places a description is shown. A
 * reviewer has one function to be sure about, and `check:csv` asserts there is
 * no second one.
 *
 * Sanitised here even though the import already sanitised what it stored.
 * Rows exist that were written before any of this did, a merchant can edit the
 * field from the admin, and a future write path that forgets the call would
 * otherwise put raw markup straight onto a public storefront. The cost of
 * doing it twice is a parse of a short string on a server-rendered page; the
 * cost of doing it once is deciding, every time anything new writes to this
 * column, whether that path remembered.
 *
 * Server component: the sanitiser needs Node, and this never needs to be
 * interactive.
 */
export function ProductDescription({
  html,
  text,
  className,
}: {
  html: string | null | undefined;
  text: string;
  className?: string;
}) {
  const safe = sanitizeProductHtml(html);

  // Nothing survived sanitising, or there was never any markup: the plain
  // column, rendered as text, exactly as it always was.
  if (!safe) {
    return <p className={className}>{text}</p>;
  }

  return (
    <div
      // `prose-product` carries the typography for tags the merchant wrote —
      // a bare <ul> inside a Tailwind reset has no bullets and no indent, so
      // an imported description would otherwise render as a run of lines.
      className={`prose-product ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
