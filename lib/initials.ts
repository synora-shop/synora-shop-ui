/**
 * Initials for an avatar (14 October): the first letters of the first two
 * words of a name ("Ayesha Khan" → "AK"), the first two letters of a single
 * word, or of the email when there is no name. Pure; safe in the browser.
 */
export function initialsOf(name?: string | null, email?: string | null): string {
  const words = (name ?? "").trim().split(/\s+/).filter((w) => /[a-z0-9]/i.test(w));
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  const one = words[0] ?? (email ?? "").split("@")[0] ?? "";
  return (one.replace(/[^a-z0-9]/gi, "").slice(0, 2) || "?").toUpperCase();
}
