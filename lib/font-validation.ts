// Validation for admin-uploaded font files.
//
// WHAT THIS ACTUALLY CHECKS — worth being precise, because "is this file safe"
// is easy to overstate:
//
//   ✓ It is really a font. The file's first four bytes are matched against the
//     signatures defined by the OpenType/WOFF specs, so renaming `payload.exe`
//     to `payload.woff2` is rejected — the extension is never trusted.
//   ✓ It isn't truncated or obviously corrupt. WOFF and WOFF2 both record their
//     total length in the header; if that disagrees with the bytes received,
//     the file is damaged and gets rejected.
//   ✓ It's a sane size. Anything over MAX_FONT_BYTES is refused before it
//     reaches storage.
//
//   ✗ It is NOT an antivirus scan. Nothing here can tell you a structurally
//     valid font doesn't exploit a font-parsing bug. Real assurance needs an
//     actual malware scanner (ClamAV, VirusTotal, a cloud AV API) — see
//     FONT_SECURITY_NOTE, which the upload UI shows verbatim so the limitation
//     is stated where it matters rather than buried here.
//
// The practical mitigation is that only a signed-in ADMIN can upload at all,
// and browsers parse web fonts in a sandbox.

export const MAX_FONT_BYTES = 2 * 1024 * 1024; // 2 MB

export const FONT_SECURITY_NOTE =
  "Uploads are checked to confirm they're genuinely font files (not just renamed) and aren't corrupt. That's a format check, not a virus scan, only upload fonts from a source you trust.";

export type FontFormat = "woff2" | "woff" | "ttf" | "otf";

/** CSS `format()` value for an @font-face src. */
export const CSS_FONT_FORMAT: Record<FontFormat, string> = {
  woff2: "woff2",
  woff: "woff",
  ttf: "truetype",
  otf: "opentype",
};

export const ACCEPTED_FONT_EXTENSIONS = [".woff2", ".woff", ".ttf", ".otf"] as const;

function ascii(bytes: Uint8Array, start: number, length: number): string {
  return String.fromCharCode(...bytes.slice(start, start + length));
}

function uint32(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0
  );
}

/**
 * Identifies the font format from the file's leading bytes, or null if these
 * aren't the bytes of any font format we accept.
 */
export function detectFontFormat(bytes: Uint8Array): FontFormat | null {
  if (bytes.length < 4) return null;

  const tag = ascii(bytes, 0, 4);
  if (tag === "wOF2") return "woff2";
  if (tag === "wOFF") return "woff";
  // 'OTTO' marks CFF (PostScript) outlines — an OpenType font.
  if (tag === "OTTO") return "otf";
  // TrueType: version 1.0 as a fixed-point number, or the legacy 'true' tag.
  if (uint32(bytes, 0) === 0x00010000 || tag === "true" || tag === "ttcf") return "ttf";
  return null;
}

export type FontValidationResult =
  | { ok: true; format: FontFormat }
  | { ok: false; error: string };

export function validateFontFile(bytes: Uint8Array, fileName: string): FontValidationResult {
  if (bytes.length === 0) return { ok: false, error: "That file is empty." };

  if (bytes.length > MAX_FONT_BYTES) {
    const mb = (bytes.length / 1024 / 1024).toFixed(1);
    return { ok: false, error: `That font is ${mb} MB, the limit is 2 MB. WOFF2 is usually far smaller.` };
  }

  const format = detectFontFormat(bytes);
  if (!format) {
    return {
      ok: false,
      error:
        "That isn't a font file. Only .woff2, .woff, .ttf and .otf are accepted, and the file's own contents are checked, renaming another file type won't work.",
    };
  }

  // Extension should agree with the real contents; a mismatch usually means the
  // wrong file was picked, and it would also break the CSS format() hint.
  const lower = fileName.toLowerCase();
  const claimed = ACCEPTED_FONT_EXTENSIONS.find((ext) => lower.endsWith(ext));
  if (claimed && claimed.slice(1) !== format) {
    return {
      ok: false,
      error: `This file is named "${claimed}" but its contents are a ${format.toUpperCase()} font. Rename it correctly and try again.`,
    };
  }

  // WOFF/WOFF2 store total length at byte 8 — a mismatch means a truncated or
  // otherwise damaged download.
  if ((format === "woff" || format === "woff2") && bytes.length >= 12) {
    const declared = uint32(bytes, 8);
    if (declared !== bytes.length) {
      return {
        ok: false,
        error: "That font looks corrupt, its header says it should be a different size than the file actually is.",
      };
    }
  }

  return { ok: true, format };
}
