import { PushNotificationsToggle } from "@/components/admin/push-notifications-toggle";
import { StoreSettingsForm } from "@/components/admin/store-settings-form";
import { GlobalEditsForm } from "@/components/admin/global-edits-form";
import { Fieldset, PageHeader, SectionDivider } from "@/components/ui/primitives";
import { resolveStoreDefaults } from "@/lib/store-defaults";
import { getStoreSettings } from "@/lib/data/settings";
import { toGlobalEdits } from "@/lib/global-edits";

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
    <div className="space-y-2.5">
      <PageHeader
        title="Settings"
        description="How customers reach you, what shipping costs, and how your storefront behaves."
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
