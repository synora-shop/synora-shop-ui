import { PushNotificationsToggle } from "@/components/admin/push-notifications-toggle";
import { StoreSettingsForm } from "@/components/admin/store-settings-form";
import { GlobalEditsForm } from "@/components/admin/global-edits-form";
import { StoreDefaultsForm } from "@/components/admin/store-defaults-form";
import { Fieldset, PageHeader, SectionDivider } from "@/components/ui/primitives";
import { resolveStoreDefaults } from "@/lib/store-defaults";
import { getStoreSettings } from "@/lib/data/settings";
import { BusinessTypeForm } from "@/components/admin/business-type-form";
import { requireShop } from "@/lib/data/shop";
import { registryBusinessType } from "@/lib/themes/business-type";
import { toGlobalEdits } from "@/lib/global-edits";

export const dynamic = "force-dynamic";

/**
 * Settings, in three passes.
 *
 * "Your store" is the handful of facts everything else is expressed in — its
 * name, its currency, what it sells. "Getting paid and getting in touch" is
 * what a customer needs from you. "Global edits" is behaviour, and it is last
 * because it is the only part a merchant can safely never open.
 */
export default async function AdminSettingsPage() {
  const [settings, shop] = await Promise.all([getStoreSettings(), requireShop()]);
  const defaults = resolveStoreDefaults(settings);

  return (
    <div className="space-y-2.5">
      <PageHeader
        title="Settings"
        description="How your store identifies itself, gets paid, and tells you about orders."
      />

      <StoreDefaultsForm initial={defaults} />

      <BusinessTypeForm current={registryBusinessType(shop.businessType)} />

      <SectionDivider
        title="Customers"
        description="What a shopper sees when they want to reach you or pay you."
      />

      <StoreSettingsForm settings={settings} currency={defaults.currency} />

      <Fieldset
        title="Order notifications"
        description="An instant push notification on this phone or computer whenever a new order comes in. No app store required, and it is per device — turn it on again on anything else you want alerted."
      >
        <PushNotificationsToggle />
      </Fieldset>

      <SectionDivider
        title="Global edits"
        description="Site-wide behaviour. Every edit here applies live across the whole storefront, including products and pages you add later."
      />

      <GlobalEditsForm settings={toGlobalEdits(settings)} />
    </div>
  );
}
