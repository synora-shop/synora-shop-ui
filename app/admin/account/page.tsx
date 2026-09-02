import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { shopSession } from "@/lib/auth-guard";
import { ROLE_RANK, roleAtLeast } from "@/lib/roles";
import { PageHeader } from "@/components/ui/primitives";
import { AccountSecurity } from "@/components/admin/account-security";
import { StaffManager } from "@/components/admin/staff-manager";

export const dynamic = "force-dynamic";

/**
 * The account: you, and everyone else who works here.
 *
 * One page rather than two. "Your account" and "People" were a sidebar group of
 * two, and the split asked a merchant to decide whether "who can sign in" was a
 * question about themselves or about the shop — which it is both of.
 *
 * The two halves are still gated differently. Anyone may change their own
 * password; only an admin sees who else has access, because that list is a map
 * of the store's weak points.
 */
export default async function AccountPage() {
  const me = await shopSession();
  if (!me) redirect("/merchant/login?callbackUrl=/admin/account");

  const user = await prisma.user.findUnique({
    where: { id: me.userId },
    select: { email: true, name: true, emailVerifiedAt: true },
  });
  if (!user) redirect("/merchant/login");

  const canManagePeople = roleAtLeast(me.role, "ADMIN");

  const [memberships, invites] = canManagePeople
    ? await Promise.all([
        prisma.membership.findMany({
          where: { shopId: me.shop.id },
          include: { user: { select: { id: true, name: true, email: true, emailVerifiedAt: true } } },
          orderBy: { invitedAt: "asc" },
        }),
        prisma.staffInvite.findMany({
          where: {
            shopId: me.shop.id,
            acceptedAt: null,
            revokedAt: null,
            expiresAt: { gt: new Date() },
          },
          orderBy: { createdAt: "desc" },
        }),
      ])
    : [[], []];

  // Owner first, then down the ranks, then alphabetically — the order the page
  // talks about them in. Sorted here rather than in the query because Prisma
  // orders an enum by its declaration order, which is not this one.
  const members = memberships
    .map((m) => ({
      membershipId: m.id,
      userId: m.user.id,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      emailVerified: m.user.emailVerifiedAt !== null,
      acceptedAt: m.acceptedAt?.toISOString() ?? null,
    }))
    .sort((a, b) => ROLE_RANK[b.role] - ROLE_RANK[a.role] || a.email.localeCompare(b.email));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Account"
        description={`Signed in as ${user.email}. These settings follow you across every store you work on.`}
      />
      <AccountSecurity email={user.email} emailVerified={user.emailVerifiedAt !== null} />

      {canManagePeople && (
        <section className="space-y-3">
          <div>
            <h2 className="font-serif text-lg font-semibold">People</h2>
            <p className="mt-1 text-sm text-ink-soft">
              Who can work on {me.shop.name}, and what they can reach.
            </p>
          </div>
          <StaffManager
            members={members}
            invites={invites.map((i) => ({
              id: i.id,
              email: i.email,
              role: i.role,
              expiresAt: i.expiresAt.toISOString(),
            }))}
            me={{ userId: me.userId, role: me.role }}
          />
        </section>
      )}
    </div>
  );
}
