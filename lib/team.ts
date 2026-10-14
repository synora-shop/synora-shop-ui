/**
 * The Synora team, the "master admins" (14 October): the addresses in
 * SYNORA_TEAM_EMAILS (comma separated, a Vercel setting).
 *
 * A setting, not a table, on purpose: being on the team reads every
 * merchant's tickets, so joining it should take a deliberate change in the
 * hosting settings, not a click somebody could be talked into. Empty means
 * nobody, never everybody.
 *
 * No imports, so proxy.ts can use it on every request.
 */
export function teamEmails(): string[] {
  return (process.env.SYNORA_TEAM_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** From a session's email alone, with no database read. */
export function isTeamEmail(email: string | null | undefined): boolean {
  return !!email && teamEmails().includes(email.trim().toLowerCase());
}
