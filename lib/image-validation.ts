import { sanitizeSvg } from "@/lib/icon-validation";

// Validation for the images merchants upload against products, categories and
// homepage sections.
//
// Fonts and icons have had signature checks and size limits since they were
// added. This path — by far the most used of the three — had neither: the only
// filter was `file.type.startsWith("image/")` in the browser, which is a hint
// from the client and nothing more. Anything at all could be stored, at any
// size, and served publicly from the platform's own blob domain.
//
// The rule here is the same one the other two use: believe the bytes, not the
// name and not the browser.

/** Photographs, so more room than an icon gets, and still not unbounded. */
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB

export type ImageFormat = "jpeg" | "png" | "gif" | "webp" | "avif" | "svg";

type Signature = { format: Exclude<ImageFormat, "svg">; bytes: number[]; offset?: number };

/**
 * Leading bytes that identify each format.
 *
 * WebP and AVIF are container formats: the first four bytes are a length or a
 * RIFF marker, and the identifying string sits further in — hence the offset.
 */
const SIGNATURES: Signature[] = [
  { format: "jpeg", bytes: [0xff, 0xd8, 0xff] },
  { format: "png", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { format: "gif", bytes: [0x47, 0x49, 0x46, 0x38] }, // GIF8
  { format: "webp", bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 }, // "WEBP" after RIFF____
  { format: "avif", bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 }, // "ftyp" box
];

export function detectImageFormat(bytes: Uint8Array): ImageFormat | null {
  for (const { format, bytes: signature, offset = 0 } of SIGNATURES) {
    if (signature.every((b, i) => bytes[offset + i] === b)) return format;
  }

  // SVG is text, so there is no signature to match — only a root element to
  // find. Checked last and within the first bytes only, so a binary file that
  // happens to contain "<svg" later on cannot claim to be one.
  const head = new TextDecoder("utf-8", { fatal: false })
    .decode(bytes.slice(0, 1024))
    .toLowerCase();
  if (/<\s*svg[\s>]/.test(head)) return "svg";

  return null;
}

export type ImageValidation =
  | { ok: true; format: ImageFormat; bytes: Uint8Array }
  | { ok: false; error: string };

/**
 * Checks an uploaded image and returns the bytes that should actually be stored.
 *
 * The returned bytes matter for SVG: it is a document format that can carry
 * script and remote references, so what gets stored is the sanitised version
 * rather than what arrived. For every other format the bytes pass through
 * untouched.
 */
export function validateImageFile(bytes: Uint8Array, filename: string): ImageValidation {
  if (bytes.length === 0) return { ok: false, error: "That file is empty." };
  if (bytes.length > MAX_IMAGE_BYTES) {
    return {
      ok: false,
      error: `Images need to be under ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)} MB. That one is ${(
        bytes.length /
        1024 /
        1024
      ).toFixed(1)} MB.`,
    };
  }

  const format = detectImageFormat(bytes);
  if (!format) {
    // Deliberately says what it looked at. "Invalid file" leaves someone
    // renaming things at random to find out what is wrong.
    return {
      ok: false,
      error: `"${filename}" doesn't look like an image. JPEG, PNG, GIF, WebP, AVIF and SVG are supported.`,
    };
  }

  if (format === "svg") {
    const cleaned = sanitizeSvg(new TextDecoder().decode(bytes));
    if (!/<\s*svg/i.test(cleaned)) {
      return { ok: false, error: "That SVG had nothing left in it once scripts were removed." };
    }
    return { ok: true, format, bytes: new TextEncoder().encode(cleaned) };
  }

  return { ok: true, format, bytes };
}

/**
 * A storage key that cannot be steered by the uploaded filename.
 *
 * The name used to be interpolated straight into the blob path, so the
 * merchant controlled part of a public URL on the platform's domain. The
 * extension comes from the detected format rather than from the name, so a
 * file cannot be stored as something it isn't.
 */
export function imageStorageKey(folder: string, format: ImageFormat): string {
  const extension = format === "jpeg" ? "jpg" : format;
  const random = Math.random().toString(36).slice(2, 10);
  return `${folder}/${Date.now()}-${random}.${extension}`;
}
