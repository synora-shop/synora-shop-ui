import { redirect } from "next/navigation";
import { roleAtLeast } from "@/lib/roles";
import { shopSession } from "@/lib/auth-guard";
import { listDiscounts } from "@/lib/data/discounts";
import { discountState } from "@/lib/discounts";
import { AccessDenied } from "@/components/admin/access-denied";
import { DiscountManager } from "@/components/admin/discount-manager";

export const dynamic = "force-dynamic";

export default async function DiscountsPage() {
  const me = await shopSession();
  if (!me) redirect("/merchant/login?callbackUrl=/admin/discounts");

  // Discounts move money, so they sit with settings and staff rather than with
  // day-to-day catalogue work.
  if (!roleAtLeast(me.role, "ADMIN")) {
    return <AccessDenied needs="ADMIN" have={me.role} what="create discount codes" />;
  }

  const discounts = await listDiscounts();
  const now = new Date();

  return (
    <div className="space-y-4">
      <DiscountManager
        title="Discounts"
        description="Codes customers enter at checkout, priced on the server so none can give away more than it should."
        discounts={discounts.map((d) => ({
          id: d.id,
          code: d.code,
          type: d.type,
          value: d.value,
          minSubtotal: d.minSubtotal,
          usageLimit: d.usageLimit,
          perCustomerLimit: d.perCustomerLimit,
          usageCount: d.usageCount,
          isActive: d.isActive,
          startsAt: d.startsAt?.toISOString() ?? null,
          endsAt: d.endsAt?.toISOString() ?? null,
          state: discountState(d, now),
        }))}
      />
    </div>
  );
}
