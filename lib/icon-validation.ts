// Validation and sanitising for admin-uploaded button icons (SVG or PNG).
//
// SVG is the interesting one: it is a document format, not just an image, and
// can carry <script>, event handlers and external references. Two independent
// defences are used, so a mistake in either alone isn't enough:
//
//   1. Sanitising (here). Script elements, event-handler attributes,
//      javascript: URLs, and anything that can fetch remotely (<foreignObject>,
//      <use href>, <image>) are stripped before the file is ever stored.
//   2. Rendering. Uploaded icons are rendered with <img src="…">, and browsers
//      do not execute script in an SVG loaded that way — even if something got
//      past step 1.
//
// PNG is checked by signature so a renamed file can't slip through.

export const MAX_ICON_BYTES = 512 * 1024; // 512 KB
/** A logo is artwork rather than a glyph, so it gets more room than an icon. */
export const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2 MB

export type IconFormat = "svg" | "png";

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function isPng(bytes: Uint8Array): boolean {
  return PNG_SIGNATURE.every((b, i) => bytes[i] === b);
}

/**
 * Strips everything scriptable or network-fetching from an SVG document.
 *
 * Deliberately an allowlist-shaped removal rather than a parser: the file is
 * also served via <img>, so this is the belt to that braces, and being
 * over-aggressive here only costs an unusual icon feature.
 */
export function sanitizeSvg(source: string): string {
  return (
    source
      // Script and anything that can pull in or run remote content.
      .replace(/<\s*script[\s\S]*?<\s*\/\s*script\s*>/gi, "")
      .replace(/<\s*script[^>]*\/\s*>/gi, "")
      .replace(/<\s*foreignObject[\s\S]*?<\s*\/\s*foreignObject\s*>/gi, "")
      .replace(/<\s*(iframe|embed|object|audio|video|image|use|set|animate)\b[^>]*>/gi, "")
      // Inline event handlers: onclick=, onload=, …
      .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
      .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
      .replace(/\son\w+\s*=\s*[^\s>]+/gi, "")
      // javascript:/data: URLs in href/xlink:href/src.
      .replace(/(href|xlink:href|src)\s*=\s*"(?:\s*)(javascript|data):[^"]*"/gi, "")
      .replace(/(href|xlink:href|src)\s*=\s*'(?:\s*)(javascript|data):[^']*'/gi, "")
      // <style> can carry url() fetches and behaviours.
      .replace(/<\s*style[\s\S]*?<\s*\/\s*style\s*>/gi, "")
      .trim()
  );
}

/**
 * Whether a stored asset URL is safe to put in an <img src> or a CSS url().
 *
 * Uploaded artwork is referenced from `mask-image: url(…)` when it is being
 * recoloured, which makes the stored URL a CSS injection surface as much as a
 * link: a value carrying `)` or a quote could close the function and add
 * declarations of its own. Rather than escaping, only two shapes are accepted —
 * a site-relative path, or an https URL — and neither may contain the
 * characters that would let it break out.
 *
 * Returns the URL unchanged when it is safe, or null when it is not, so callers
 * fall back to the built-in artwork instead of emitting something doubtful.
 */
export function safeAssetUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (!value) return null;
  // Anything that could terminate a url(), an attribute, or a CSS rule.
  if (/["'()\\<>\s;{}]/.test(value)) return null;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  if (/^https:\/\/[a-z0-9.-]+\/[^\s]*$/i.test(value)) return value;
  return null;
}

export type IconValidationResult =
  | { ok: true; format: "png"; bytes: Uint8Array }
  | { ok: true; format: "svg"; text: string }
  | { ok: false; error: string };

export type ArtworkOptions = {
  /** Size ceiling in bytes. Defaults to the icon limit. */
  maxBytes?: number;
  /** What the file is, for the message when it's too big — "Icons", "Logos". */
  label?: string;
};

export function validateIconFile(
  bytes: Uint8Array,
  fileName: string,
  options: ArtworkOptions = {}
): IconValidationResult {
  const { maxBytes = MAX_ICON_BYTES, label = "Icons" } = options;
  if (bytes.length === 0) return { ok: false, error: "That file is empty." };
  if (bytes.length > maxBytes) {
    const mb = maxBytes / (1024 * 1024);
    const limit = mb >= 1 ? `${mb} MB` : `${Math.round(maxBytes / 1024)} KB`;
    return { ok: false, error: `${label} must be under ${limit}.` };
  }

  if (isPng(bytes)) return { ok: true, format: "png", bytes };

  // SVG is text; decode and confirm it really contains an <svg> root before
  // trusting the extension.
  const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  if (/<\s*svg[\s>]/i.test(text)) {
    const clean = sanitizeSvg(text);
    if (!/<\s*svg[\s>]/i.test(clean)) {
      return { ok: false, error: "That SVG couldn't be cleaned safely, try exporting it again." };
    }
    return { ok: true, format: "svg", text: clean };
  }

  return {
    ok: false,
    error: `"${fileName}" isn't an SVG or PNG. The file's contents are checked, so renaming another file type won't work.`,
  };
}
