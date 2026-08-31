import { PushNotificationsToggle } from "@/components/admin/push-notifications-toggle";
import { StoreSettingsForm } from "@/components/admin/store-settings-form";
import { GlobalEditsForm } from "@/components/admin/global-edits-form";
import { StoreDefaultsForm } from "@/components/admin/store-defaults-form";
import { PageHeader } from "@/components/ui/primitives";
import { resolveStoreDefaults } from "@/lib/store-defaults";
import { getStoreSettings } from "@/lib/data/settings";
import { BusinessTypeForm } from "@/components/admin/business-type-form";
import { requireShop } from "@/lib/data/shop";
import { registryBusinessType } from "@/lib/themes/business-type";
import { toGlobalEdits } from "@/lib/global-edits";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const [settings, shop] = await Promise.all([getStoreSettings(), requireShop()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="How your store identifies itself, gets paid, and tells you about orders."
      />

      <StoreDefaultsForm initial={resolveStoreDefaults(settings)} />

      <BusinessTypeForm current={registryBusinessType(shop.businessType)} />

      <section className="max-w-xl rounded-xl border border-border bg-surface p-5">
        <h2 className="font-serif text-lg font-semibold">Order Notifications</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Get an instant push notification on this phone or computer whenever a new order comes
          in, no app store required.
        </p>
        <div className="mt-4">
          <PushNotificationsToggle />
        </div>
      </section>

      <StoreSettingsForm settings={settings} />

      <h2 className="mt-10 text-lg font-semibold">Global edits</h2>
      <GlobalEditsForm settings={toGlobalEdits(settings)} />
    </div>
  );
}
