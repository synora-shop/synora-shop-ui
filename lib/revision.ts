import "server-only";
import { createHash } from "node:crypto";

/**
 * A fingerprint of what an editor was given, so its save can tell whether
 * somebody else saved in between.
 *
 * Two people — or one person in two tabs — open the same page, both edit,
 * both save. Without this the second save silently replaces the first: no
 * error, no warning, and the first person's work is simply gone. With it the
 * second save is refused and told why.
 *
 * Computed on the server from the stored value both when the editor opens and
 * when it saves, so the two always agree on how the value is written out — a
 * fingerprint the browser computed would depend on key order it cannot see.
 */
export function revisionOf(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value ?? null)).digest("hex").slice(0, 24);
}

/** What a save says when the page changed under it. */
export const STALE_SAVE =
  "This page was saved somewhere else since you opened it — another tab, or someone else. Reload to see that version; your changes here are kept until you leave.";
