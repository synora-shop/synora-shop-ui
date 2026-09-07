import { PageHeader } from "@/components/ui/primitives";
import { StoreDefaultsForm } from "@/components/admin/store-defaults-form";
import { BusinessTypeForm } from "@/components/admin/business-type-form";
import { resolveStoreDefaults } from "@/lib/store-defaults";
import { getStoreSettings } from "@/lib/data/settings";
import { requireShop } from "@/lib/data/shop";
import { registryBusinessType } from "@/lib/themes/business-type";

export const dynamic = "force-dynamic";

/**
 * Home — Store defaults.
 *
 * The facts everything else is expressed in: what the store charges in, where
 * it trades from, what a kilogram means here, and what "today" is when an order
 * is stamped. A merchant sets these once and rarely opens the screen again.
 *
 * Under Home rather than Settings, where it used to live, because it is the
 * same subject as the name and the address: what this business *is*, as opposed
 * to how it behaves or how it gets paid. Settings keeps the things a merchant
 * comes back to.
 *
 * The store's name is not here. It is the first field on Home, and it is the
 * same column — having it on both screens meant two places editing one value.
 */
export default async function StoreDefaultsPage() {
  const [settings, shop] = await Promise.all([getStoreSettings(), requireShop()]);

  return (
    <div className="space-y-2.5">
      <PageHeader
        title="Store defaults"
        description="What your store charges in, where it trades from, and what kind of business it is."
      />

      <StoreDefaultsForm initial={resolveStoreDefaults(settings)} />

      {/* What the shop sells decides which screens exist at all, so it belongs
          with the other facts about the business rather than among the
          behaviour toggles it used to sit under. */}
      <BusinessTypeForm current={registryBusinessType(shop.businessType)} status={shop.status} />
    </div>
  );
}
