import { redirect } from "next/navigation";
import { roleAtLeast } from "@/lib/roles";
import { shopSession } from "@/lib/auth-guard";
import { RETENTION_DAYS } from "@/lib/store-lifecycle";
import { PageHeader } from "@/components/ui/primitives";
import { AccessDenied } from "@/components/admin/access-denied";
import { StoreLifecycle } from "@/components/admin/store-lifecycle";

export const dynamic = "force-dynamic";

export default async function StorePage() {
  const me = await shopSession();
  if (!me) redirect("/merchant/login?callbackUrl=/admin/store");

  if (!roleAtLeast(me.role, "ADMIN")) {
    return <AccessDenied needs="ADMIN" have={me.role} what="open and close the store" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Store status"
        description="Whether you're open for business, and what customers see when you're not."
      />
      <StoreLifecycle
        status={me.shop.status}
        storeName={me.shop.name}
        isOwner={me.role === "OWNER"}
        retentionDays={RETENTION_DAYS}
      />
    </div>
  );
}
