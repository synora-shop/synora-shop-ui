// One rule for every link an admin can type, anywhere in the panel.
//
// The platform goal is "secure links throughout", which in practice means three
// separate jobs:
//
//   1. Refuse insecure transport. A plain http:// link on an https page gets
//      blocked as mixed content by the browser anyway, so accepting one only
//      produces a link that silently doesn't work. We reject it up front and
//      say why.
//   2. Refuse dangerous schemes outright. javascript: and data: URLs in an
//      admin-controlled href are a stored-XSS vector — an admin account that
//      gets compromised shouldn't be able to plant script that runs for every
//      customer.
//   3. Be forgiving about the rest. Someone typing "synoradigitals.com" means
//      https://synoradigitals.com, and internal paths like /shop are both safe and the
//      common case, so neither should be an error.
//
// Client-safe: pure string handling, no Prisma, no next/headers. The admin UI
// uses it for instant feedback and the server actions use it as the real gate —
// client-side validation is a courtesy, never the enforcement.

export type UrlKind = "internal" | "https" | "mailto" | "tel";

export type UrlCheck =
  | { ok: true; href: string; kind: UrlKind; /** set when input was corrected, e.g. bare domain */ normalised?: string }
  | { ok: false; error: string };

export type UrlOptions = {
  /** Treat an empty value as valid (an optional link field). */
  allowEmpty?: boolean;
  /** Permit mailto: and tel: — right for contact buttons, wrong for a menu item. */
  allowContactSchemes?: boolean;
  /** Permit site-relative paths like /shop. */
  allowInternal?: boolean;
};

const DANGEROUS = /^\s*(javascript|data|vbscript|file|blob)\s*:/i;

/** Looks like a domain someone typed without a scheme: "synoradigitals.com", "shop.synoradigitals.com/sale". */
const BARE_DOMAIN = /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/.*)?$/i;

export function validateUrl(raw: string, options: UrlOptions = {}): UrlCheck {
  const { allowEmpty = true, allowContactSchemes = false, allowInternal = true } = options;
  const value = raw.trim();

  if (value === "") {
    return allowEmpty
      ? { ok: true, href: "", kind: "internal" }
      : { ok: false, error: "This link can't be empty." };
  }

  if (DANGEROUS.test(value)) {
    const scheme = value.split(":")[0].trim().toLowerCase();
    return {
      ok: false,
      error: `${scheme}: links aren't allowed, they can run code on your customers' devices.`,
    };
  }

  if (value.startsWith("//")) {
    return {
      ok: false,
      error: "Protocol-relative links (//example.com) aren't allowed. Write the full https:// address.",
    };
  }

  if (value.startsWith("/")) {
    return allowInternal
      ? { ok: true, href: value, kind: "internal" }
      : { ok: false, error: "This field needs a full web address, not a path on this site." };
  }

  if (value.startsWith("#")) {
    return { ok: false, error: "A link to a spot on the same page isn't supported here." };
  }

  const lower = value.toLowerCase();

  if (lower.startsWith("mailto:")) {
    if (!allowContactSchemes) return { ok: false, error: "Email links aren't supported in this field." };
    const address = value.slice("mailto:".length).split("?")[0];
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
      return { ok: false, error: `"${address}" doesn't look like an email address.` };
    }
    return { ok: true, href: value, kind: "mailto" };
  }

  if (lower.startsWith("tel:")) {
    if (!allowContactSchemes) return { ok: false, error: "Phone links aren't supported in this field." };
    const digits = value.slice("tel:".length).replace(/[^\d+]/g, "");
    if (digits.replace(/\D/g, "").length < 6) {
      return { ok: false, error: "That phone number looks too short." };
    }
    return { ok: true, href: `tel:${digits}`, kind: "tel" };
  }

  if (lower.startsWith("http://")) {
    const secure = `https://${value.slice("http://".length)}`;
    return {
      ok: false,
      error: `Insecure link. Use ${secure} instead, browsers block http:// content on a secure site.`,
    };
  }

  if (lower.startsWith("https://")) {
    try {
      const url = new URL(value);
      if (!url.hostname.includes(".")) {
        return { ok: false, error: `"${url.hostname}" doesn't look like a real web address.` };
      }
      return { ok: true, href: url.toString(), kind: "https" };
    } catch {
      return { ok: false, error: "That web address isn't valid." };
    }
  }

  // No scheme at all — assume they meant https rather than making them retype it.
  if (BARE_DOMAIN.test(value)) {
    const upgraded = `https://${value}`;
    try {
      const url = new URL(upgraded);
      return { ok: true, href: url.toString(), kind: "https", normalised: url.toString() };
    } catch {
      /* fall through to the generic error */
    }
  }

  return {
    ok: false,
    error: "That isn't a valid link. Use a full https:// address, or a path on this site like /shop.",
  };
}

/** Convenience for server actions: returns the safe href, or throws with the reason. */
export function requireSecureUrl(raw: string, options: UrlOptions = {}): string {
  const check = validateUrl(raw, options);
  if (!check.ok) throw new Error(check.error);
  return check.href;
}
