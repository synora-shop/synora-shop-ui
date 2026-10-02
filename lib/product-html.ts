// Product descriptions that arrived as HTML, made safe to render.
//
// Shopify's product description is an HTML field, and a merchant moving here
// exports it as markup: `<p>Soft <strong>cotton</strong> tee</p>`. This
// platform stored that string and rendered it as text, so every imported
// product printed its own tags at the customer. That is the bug this file
// exists for.
//
// The fix is not `dangerouslySetInnerHTML` on the stored string. That string
// came out of a CSV a merchant uploaded, it is rendered on a public storefront,
// and on a multi-tenant platform a script in it is one shop attacking its own
// customers — with our domain in the address bar.
//
// Why a library rather than the regex approach used for uploaded SVGs in
// lib/icon-validation.ts: that one is explicitly "the belt to that braces",
// because an SVG is also served through <img>, where a browser will not run
// script even if the strip missed something. There is no equivalent second
// defence for HTML written into a page. Matching tags with regular expressions
// is the documented way to ship an XSS — mutation XSS, comment and CDATA
// tricks, and malformed nesting all defeat it — so this uses a real parser
// (sanitize-html, on htmlparser2) with an allowlist.
//
// Sanitised twice, on the way in and on the way out. Writing clean HTML to the
// database is not enough on its own: rows exist that were written before this
// file did, and a future import path that forgets to call it would otherwise
// put raw markup straight onto a storefront.
//
// Server only. sanitize-html needs Node, and the only places this is called —
// CSV import and the product page — are both server-side.

import sanitizeHtml from "sanitize-html";

/**
 * What a product description is allowed to be.
 *
 * Chosen from what Shopify descriptions actually contain: paragraphs,
 * emphasis, lists, a heading or two, links, line breaks, tables for size
 * guides, and images. Deliberately absent:
 *
 *   * `<script>`, `<style>`, `<iframe>`, `<object>`, `<embed>`, `<form>` —
 *     script execution, and anything that embeds a third party's page.
 *   * every `on*` handler, which the allowlist excludes by construction
 *     rather than by removal.
 *   * `<h1>`, because the product's own name is the page's one h1 and a
 *     description that declares a second breaks the heading outline.
 */
const ALLOWED_TAGS = [
  "p", "br", "hr",
  "strong", "b", "em", "i", "u", "s", "sub", "sup", "small", "mark",
  "ul", "ol", "li",
  "h2", "h3", "h4", "h5", "h6",
  "blockquote", "a", "img",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption",
  "span", "div",
];

export const PRODUCT_HTML_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: {
    a: ["href", "title"],
    img: ["src", "alt", "title", "width", "height", "loading"],
    th: ["colspan", "rowspan", "scope"],
    td: ["colspan", "rowspan"],
    // No class and no style anywhere. A description must not be able to
    // restyle the page around it, and `style` is also a script vector in
    // older engines (`expression()`, `url(javascript:…)`).
  },
  // http(s) and mailto/tel only: `javascript:` and `data:` are the two that
  // turn a link or an image into an execution path.
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: { img: ["http", "https"] },
  // A link out of a merchant's description is a link to a stranger's site.
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "nofollow ugc noopener", target: "_blank" }),
  },
  // Comments can carry conditional-comment payloads and confuse naive
  // downstream parsers; nothing legitimate needs them here.
  allowedScriptHostnames: [],
  allowVulnerableTags: false,
  disallowedTagsMode: "discard",
};

/**
 * The safe form of a description that arrived as HTML.
 *
 * Returns "" for anything empty, so a caller can test the result rather than
 * having to test the input first.
 */
export function sanitizeProductHtml(input: string | null | undefined): string {
  if (!input) return "";
  return sanitizeHtml(input, PRODUCT_HTML_OPTIONS).trim();
}

/**
 * Whether a string from a CSV is markup rather than prose.
 *
 * A Shopify export is HTML; a description typed into this platform's own admin
 * is plain text. Both arrive in the same column, and treating plain text as
 * HTML would silently eat a `<` someone typed on purpose — "sizes < 10" is a
 * real sentence. So the import keeps plain text plain and only promotes to the
 * HTML field when the value actually contains a tag we would render.
 */
const TAG = new RegExp(`<\\s*/?\\s*(${ALLOWED_TAGS.join("|")})(\\s|/?>)`, "i");

export function looksLikeHtml(input: string | null | undefined): boolean {
  return !!input && TAG.test(input);
}

/**
 * Plain text for a description, whichever form it arrived in.
 *
 * Used for the meta description and anywhere else that must not contain
 * markup — places where the value is handed to something that will escape it
 * again.
 *
 * The decode step is not optional, and it is easy to leave out. Stripping tags
 * *escapes* the remaining text rather than decoding it, so "Soft cotton &
 * linen" comes back as `Soft cotton &amp; linen`. Handed to Next's metadata
 * API, which escapes what it is given, that reaches the page as
 * `&amp;amp;` and a search result reading "cotton &amp; linen". Five entities
 * is the whole set the sanitiser produces, so decoding them is exact rather
 * than a general-purpose entity parser.
 */
const ESCAPED: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

export function productHtmlToText(input: string | null | undefined): string {
  if (!input) return "";
  const stripped = sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} });
  return stripped
    // &amp; last would turn "&amp;lt;" into "<". Decoding &amp; first is also
    // wrong for the same reason in the other direction, so the whole set is
    // replaced in one pass and no output is re-scanned.
    .replace(/&(?:amp|lt|gt|quot|#39);/g, (m) => ESCAPED[m] ?? m)
    .replace(/\s+/g, " ")
    .trim();
}
