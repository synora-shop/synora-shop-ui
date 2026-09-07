import { shopSession } from "@/lib/auth-guard";
import { roleAtLeast } from "@/lib/roles";
import { domainsForShop } from "@/lib/data/domains";
import { requiredRecords } from "@/lib/domains";
import { canIssueCertificates } from "@/lib/hosting";
import { DomainManager } from "@/components/admin/domain-manager";
import { PageHeader } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

/**
 * Where the store can be found.
 *
 * A screen of its own again, as a tab under Settings. It spent a while folded
 * into the Settings page because the old sidebar could not afford a second
 * entry for it without another level of nesting; the navigation bar can, and
 * a domain change is different enough in weight from a notification preference
 * to deserve its own address.
 *
 * Gated separately from the rest of Settings: a domain change can take a store
 * off the internet, where a notification preference cannot.
 */
export default async function DomainsPage() {
  const me = await shopSession();
  const canManage = me ? roleAtLeast(me.role, "ADMIN") : false;
  const domains = canManage && me ? await domainsForShop(me.shop.id) : [];

  return (
    <div className="space-y-2.5">
      <PageHeader
        title="Domains"
        description="Your free address always works. Add your own to use it instead."
      />
      {canManage ? (
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
    </div>
  );
}
