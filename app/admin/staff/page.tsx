import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { shopSession } from "@/lib/auth-guard";
import { ROLE_RANK, roleAtLeast } from "@/lib/roles";
import { PageHeader } from "@/components/ui/primitives";
import { AccessDenied } from "@/components/admin/access-denied";
import { StaffManager } from "@/components/admin/staff-manager";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const me = await shopSession();
  if (!me) redirect("/merchant/login?callbackUrl=/admin/staff");

  // Managing people is an admin job. Staff and viewers don't see the team list
  // at all — who else has access, and at what level, is a map of the store's
  // weak points. Checked by rendering rather than by throwing: see
  // components/admin/access-denied.tsx.
  if (!roleAtLeast(me.role, "ADMIN")) {
    return <AccessDenied needs="ADMIN" have={me.role} what="manage who works here" />;
  }

  const [memberships, invites] = await Promise.all([
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
  ]);

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
        title="People"
        description={`Who can work on ${me.shop.name}, and what they can reach.`}
      />
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
    </div>
  );
}
