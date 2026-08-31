import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { shopSession } from "@/lib/auth-guard";
import { PageHeader } from "@/components/ui/primitives";
import { AccountSecurity } from "@/components/admin/account-security";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  // No role check: this is the signed-in person's own account, not the shop's.
  // A viewer has as much right to change their own password as the owner does.
  const me = await shopSession();
  if (!me) redirect("/merchant/login?callbackUrl=/admin/account");

  const user = await prisma.user.findUnique({
    where: { id: me.userId },
    select: { email: true, name: true, emailVerifiedAt: true },
  });
  if (!user) redirect("/merchant/login");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Your account"
        description={`Signed in as ${user.email}. These settings follow you across every store you work on.`}
      />
      <AccountSecurity email={user.email} emailVerified={user.emailVerifiedAt !== null} />
    </div>
  );
}
