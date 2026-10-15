import { PushNotificationsToggle } from "@/components/admin/push-notifications-toggle";
import { StoreSettingsForm } from "@/components/admin/store-settings-form";
import { Fieldset, PageHeader } from "@/components/ui/primitives";
import { resolveStoreDefaults } from "@/lib/store-defaults";
import { getStoreSettings } from "@/lib/data/settings";
import { SettingsFrame } from "@/components/admin/settings-frame";

export const dynamic = "force-dynamic";

/**
 * Settings — General.
 *
 * What is left after two moves. The facts a business is described by — its
 * name, its currency, what it sells — went to Home, because they answer "what
 * is this business" rather than "how does it behave". The payment details went
 * to Payments, where they sit under the switch that decides whether the method
 * is offered at all.
 *
 * What remains is how a customer reaches you, what shipping costs, how you hear
 * about an order, and the site-wide behaviour toggles — which are last because
 * they are the only part a merchant can safely never open.
 */
export default async function AdminSettingsPage() {
  const settings = await getStoreSettings();
  const defaults = resolveStoreDefaults(settings);

  return (
    <SettingsFrame>
    <div className="space-y-5">
      <PageHeader
        title="Checkout and delivery"
        description="How customers reach you, what delivery costs, and the alerts you get when an order comes in."
      />

      <StoreSettingsForm settings={settings} currency={defaults.currency} />

      <Fieldset
        title="Order notifications"
        description="An instant push notification on this phone or computer whenever a new order comes in. No app store required, and it is per device — turn it on again on anything else you want alerted."
      >
        <PushNotificationsToggle />
      </Fieldset>
    </div>
    </SettingsFrame>
  );
}
