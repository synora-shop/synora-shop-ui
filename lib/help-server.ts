import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Who is asking, for the help desk (14 October). Server only.
 *
 * A merchant is a signed-in account holder: a session with a user id and no
 * customerId (shoppers sign in to one shop with a code and have no business
 * here). Their name and email come from the database rather than the token,
 * so a changed name shows at once.
 */
export async function merchantUser() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id || session.user.customerId) return null;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      memberships: { where: { acceptedAt: { not: null } }, select: { shop: { select: { id: true, name: true, subdomain: true } } } },
    },
  });
  if (!user) return null;
  return { id: user.id, name: user.name, email: user.email, shops: user.memberships.map((m) => m.shop) };
}

/**
 * The Synora team: the addresses in SYNORA_TEAM_EMAILS (comma separated).
 *
 * A setting, not a table, on purpose: being on the team reads every
 * merchant's tickets, so joining it should take a deliberate change in the
 * hosting settings, not a click somebody could be talked into. Empty means
 * nobody, never everybody.
 */
export function teamEmails(): string[] {
  return (process.env.SYNORA_TEAM_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function synoraTeamMember() {
  const me = await merchantUser();
  if (!me || !teamEmails().includes(me.email.toLowerCase())) return null;
  return me;
}

/**
 * For the console's pages and actions. Anyone else gets a plain 404: the
 * console's existence is not advertised to people who cannot use it.
 */
export async function requireSynoraTeam() {
  const me = await synoraTeamMember();
  if (!me) notFound();
  return me;
}
