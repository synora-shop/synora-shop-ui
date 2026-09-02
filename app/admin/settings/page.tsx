import { PushNotificationsToggle } from "@/components/admin/push-notifications-toggle";
import { StoreSettingsForm } from "@/components/admin/store-settings-form";
import { GlobalEditsForm } from "@/components/admin/global-edits-form";
import { StoreDefaultsForm } from "@/components/admin/store-defaults-form";
import { PageHeader } from "@/components/ui/primitives";
import { resolveStoreDefaults } from "@/lib/store-defaults";
import { getStoreSettings } from "@/lib/data/settings";
import { BusinessTypeForm } from "@/components/admin/business-type-form";
import { requireShop } from "@/lib/data/shop";
import { shopSession } from "@/lib/auth-guard";
import { roleAtLeast } from "@/lib/roles";
import { domainsForShop } from "@/lib/data/domains";
import { requiredRecords } from "@/lib/domains";
import { canIssueCertificates } from "@/lib/hosting";
import { DomainManager } from "@/components/admin/domain-manager";
import { registryBusinessType } from "@/lib/themes/business-type";
import { toGlobalEdits } from "@/lib/global-edits";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const [settings, shop, me] = await Promise.all([
    getStoreSettings(),
    requireShop(),
    shopSession(),
  ]);

  // Domains used to be a page of its own, which made Settings a group of two in
  // the sidebar for no reason a merchant would recognise: both answer "how does
  // my store present itself to the world". Still gated separately, because a
  // domain change can take a store off the internet where a notification
  // preference cannot.
  const canManageDomains = me ? roleAtLeast(me.role, "ADMIN") : false;
  const domains = canManageDomains && me ? await domainsForShop(me.shop.id) : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="How your store identifies itself, gets paid, and tells you about orders."
      />

      <StoreDefaultsForm initial={resolveStoreDefaults(settings)} />

      <section className="space-y-3">
        <div>
          <h2 className="font-serif text-lg font-semibold">Domains</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Where your store can be found. Your free address always works; add your
            own to use it instead.
          </p>
        </div>
        {canManageDomains ? (
          <DomainManager
            canIssueCertificates={canIssueCertificates()}
            domains={domains.map((d) => ({
              id: d.id,
              hostname: d.hostname,
              status: d.status,
              isPlatform: d.isPlatform,
              isPrimary: d.isPrimary,
              lastError: d.lastError,
              lastCheckedAt: d.lastCheckedAt?.toISOString() ?? null,
              // Computed here rather than in the client component: the DNS
              // targets come from environment variables, which a browser bundle
              // would freeze at build time.
              records: d.isPlatform ? [] : requiredRecords(d.hostname, d.verificationToken),
            }))}
          />
        ) : (
          <p className="rounded-lg border border-border bg-subtle px-3 py-2.5 text-sm text-ink-soft">
            Only an admin can change where your store lives.
          </p>
        )}
      </section>

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
