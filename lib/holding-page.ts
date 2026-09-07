import type { ClosedReason } from "@/lib/maintenance";

/**
 * What a customer is told when the store is not open to them.
 *
 * Five reasons a storefront can be shut, and only two of them are the
 * merchant's to explain:
 *
 *   maintenance — the merchant flicked the switch. Theirs.
 *   paused      — the merchant shut the doors. Theirs.
 *   closed      — the store is finished. Ours: someone waiting on an order
 *                 needs to be told to get in touch, not to check back later,
 *                 and that is not a message to leave to whoever wrote the
 *                 holding page eighteen months earlier.
 *   suspended   — we shut it. Obviously ours.
 *   blocked     — this visitor's country is not served. Ours, and it is not
 *                 "we're closed" at all; the store is open to everyone else.
 *
 * Pausing and maintenance share one page on purpose. They are two switches but
 * one moment from a customer's side — the shop is shut and someone is working
 * on it — and a merchant asked to write the same notice twice writes one of
 * them and lets the other go stale. Which is exactly what happened: the two
 * showed different wording, and nothing on either screen said the other
 * existed.
 *
 * Client-safe: plain values and pure functions, no Prisma, no next/headers.
 */

export type HoldingPage = {
  /** Empty means "use ours". Never stored pre-filled — see the migration. */
  heading: string;
  message: string;
  /** Empty falls back to the theme's logo. */
  logoUrl: string;
  showLogo: boolean;
  /** Whether to offer to tell visitors when the store opens again. */
  signups: boolean;
};

export const HOLDING_PAGE_DEFAULTS: HoldingPage = {
  heading: "",
  message: "",
  logoUrl: "",
  showLogo: true,
  signups: false,
};

/**
 * The same defaults under their column names, for the settings row a shop that
 * has never saved does not have.
 *
 * Two shapes because they answer to two different things: HoldingPage is what
 * the form works in, and this is what StoreSettings looks like. Keeping one
 * shape would mean either column names in the form or form names in the
 * database, and the second of those is how a column ends up called `heading`.
 *
 * Must mirror the @default(...) on each column. If they drift, a shop with no
 * settings row renders a different holding page from an identical shop that
 * has pressed save once — which is the kind of difference nobody thinks to
 * look for.
 */
export const HOLDING_PAGE_COLUMN_DEFAULTS = {
  /** Whether the holding page is showing. Lives here now, not with the
      visibility settings — see the note on Visibility in lib/visibility.ts. */
  maintenanceMode: false,
  maintenanceHeading: "",
  maintenanceMessage: "",
  maintenanceLogoUrl: "",
  maintenanceShowLogo: true,
  maintenanceSignups: false,
};

/** Mirrors the @default(...) on each column in StoreSettings. */
export function toHoldingPage(row: Record<string, unknown>): HoldingPage {
  return {
    heading: typeof row.maintenanceHeading === "string" ? row.maintenanceHeading : "",
    message: typeof row.maintenanceMessage === "string" ? row.maintenanceMessage : "",
    logoUrl: typeof row.maintenanceLogoUrl === "string" ? row.maintenanceLogoUrl : "",
    // Absent means shown, not hidden: a shop whose row predates this column
    // should look branded, which is what every existing shop expects.
    showLogo: row.maintenanceShowLogo !== false,
    signups: row.maintenanceSignups === true,
  };
}

/** The reasons a merchant may write the words for. */
export const MERCHANT_WRITABLE: ReadonlySet<ClosedReason> = new Set(["maintenance", "paused"]);

/**
 * The words we supply, per reason.
 *
 * These are the fallback for the two the merchant may edit, and the whole
 * answer for the three they may not.
 */
export const DEFAULT_WORDS: Record<ClosedReason, { heading: string; message: string }> = {
  maintenance: {
    heading: "We'll be right back",
    message:
      "This store is having some quick updates. Please check back shortly, thank you for your patience.",
  },
  paused: {
    heading: "We're not taking orders right now",
    message: "This store has paused sales for a little while. Everything will be here when it reopens.",
  },
  closed: {
    heading: "This store has closed",
    message:
      "It's no longer taking orders. If you're waiting on an order, contact the store directly and they'll be able to help.",
  },
  suspended: {
    heading: "This store is unavailable",
    message: "It isn't accepting orders at the moment. Please try again later.",
  },
  blocked: {
    heading: "Not available here",
    message: "This store does not currently serve customers in your country.",
  },
};

export type ResolvedHolding = {
  heading: string;
  message: string;
  /** Null when there is nothing to show or the merchant turned it off. */
  logoUrl: string | null;
  /** Whether to render the "tell me when you reopen" form. */
  offerSignup: boolean;
};

/**
 * What the page actually renders, given why it is shut and what the merchant
 * wrote.
 *
 * Falls back per field, not per page. A merchant who wrote a heading and left
 * the message empty gets their heading and our message, rather than losing
 * their heading because the pair was incomplete.
 *
 * The signup form is offered only for the two reasons that mean "back later".
 * Offering to tell someone when a permanently closed store reopens is a
 * promise nobody can keep, and on the blocked page it would be worse — the
 * store is open, it simply will not serve them, and there is no event to wait
 * for.
 */
export function resolveHolding(
  reason: ClosedReason,
  page: HoldingPage,
  themeLogoUrl: string
): ResolvedHolding {
  const ours = DEFAULT_WORDS[reason];
  const mine = MERCHANT_WRITABLE.has(reason);

  const logo = page.logoUrl.trim() || themeLogoUrl.trim();

  return {
    heading: (mine && page.heading.trim()) || ours.heading,
    message: (mine && page.message.trim()) || ours.message,
    logoUrl: mine && page.showLogo && logo ? logo : null,
    offerSignup: mine && page.signups,
  };
}

/** The most a merchant may write, so the page cannot be turned into a blog. */
export const HEADING_MAX = 80;
export const MESSAGE_MAX = 400;

/** Why a heading can't be used, or null if it can. */
export function headingProblem(value: string): string | null {
  if (value.length > HEADING_MAX) return `Keep the heading under ${HEADING_MAX} characters.`;
  return null;
}

/** Why a message can't be used, or null if it can. */
export function messageProblem(value: string): string | null {
  if (value.length > MESSAGE_MAX) return `Keep the message under ${MESSAGE_MAX} characters.`;
  return null;
}

/**
 * Whether an address is worth storing.
 *
 * Deliberately loose. This is a holding page, not a checkout: the only cost of
 * accepting something odd is one row the merchant deletes, and the cost of
 * refusing something valid is a customer who wanted to hear from them and was
 * told their address was wrong. So it checks the shape and nothing more.
 */
export function emailProblem(value: string): string | null {
  const email = value.trim();
  if (!email) return "Enter your email address.";
  if (email.length > 254) return "That address is too long.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "That doesn't look like an email address.";
  return null;
}

/** Addresses are stored lowercase, so the same person cannot sign up twice. */
export function normaliseEmail(value: string): string {
  return value.trim().toLowerCase();
}
