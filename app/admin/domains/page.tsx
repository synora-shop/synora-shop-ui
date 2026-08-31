import { redirect } from "next/navigation";
import { roleAtLeast } from "@/lib/roles";
import { shopSession } from "@/lib/auth-guard";
import { domainsForShop } from "@/lib/data/domains";
import { requiredRecords } from "@/lib/domains";
import { canIssueCertificates } from "@/lib/hosting";
import { PageHeader } from "@/components/ui/primitives";
import { AccessDenied } from "@/components/admin/access-denied";
import { DomainManager } from "@/components/admin/domain-manager";

export const dynamic = "force-dynamic";

export default async function DomainsPage() {
  const me = await shopSession();
  if (!me) redirect("/merchant/login?callbackUrl=/admin/domains");

  // A domain change can take a store off the internet or send its traffic
  // somewhere else, which puts it with staff and billing rather than with
  // editing a product.
  if (!roleAtLeast(me.role, "ADMIN")) {
    return <AccessDenied needs="ADMIN" have={me.role} what="change where your store lives" />;
  }

  const domains = await domainsForShop(me.shop.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Domains"
        description="Where your store can be found. Your free address always works; add your own to use it instead."
      />
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
          // Computed here rather than in the client component: the DNS targets
          // come from environment variables, which a browser bundle would
          // freeze at build time.
          records: d.isPlatform ? [] : requiredRecords(d.hostname, d.verificationToken),
        }))}
      />
    </div>
  );
}
