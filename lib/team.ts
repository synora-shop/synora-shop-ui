/**
 * The Synora team, the "master admins" (14 October): SYNORA_TEAM_EMAILS, a
 * Vercel setting, comma separated. Each entry is an address, optionally with
 * the initials its gold avatar shows: `ahad1v@icloud.com=AA`.
 *
 * A setting, not a table, on purpose: being on the team reads every
 * merchant's tickets, so joining it should take a deliberate change in the
 * hosting settings, not a click somebody could be talked into. Empty means
 * nobody, never everybody.
 *
 * No imports, so proxy.ts and auth.ts can use it on every request.
 */
function entries(): [string, string][] {
  return (process.env.SYNORA_TEAM_EMAILS ?? "")
    .split(",")
    .map((raw) => {
      const [email, initials = ""] = raw.split("=");
      return [email.trim().toLowerCase(), initials.trim().toUpperCase().slice(0, 4)] as [string, string];
    })
    .filter(([email]) => email.includes("@"));
}

export function teamEmails(): string[] {
  return entries().map(([email]) => email);
}

/** From a session's email alone, with no database read. */
export function isTeamEmail(email: string | null | undefined): boolean {
  return !!email && teamEmails().includes(email.trim().toLowerCase());
}

/** A master admin's initials as set, or null for anyone else (or none set). */
export function teamInitials(email: string | null | undefined): string | null {
  const e = email?.trim().toLowerCase();
  return entries().find(([x]) => x === e)?.[1] || null;
}
