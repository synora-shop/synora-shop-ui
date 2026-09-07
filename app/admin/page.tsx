import { db, requireShop } from "@/lib/data/shop";
import { getStoreSettings } from "@/lib/data/settings";
import { toBrandMarks } from "@/lib/brand-marks";
import { PageHeader } from "@/components/ui/primitives";
import { StoreIdentityForm } from "@/components/admin/store-identity-form";

/**
 * Home: what this shop is called, what it looks like, and where it is.
 *
 * Also the one place a logo may be changed. The marks used to live in the
 * theme's tokens, which are per business type, so switching type lost them —
 * see lib/brand-marks.ts. They are the shop's now, and a theme reads them.
 *
 * The landing page, replacing the dashboard that used to sit here. The figures
 * moved to Analytics, which is what they always were — a merchant opening the
 * panel for the first time needs to say what their shop is before there is
 * anything to count.
 *
 * The four fields come from three tables. See app/admin/identity-actions.ts;
 * the merchant should not have to know that, and does not.
 */
export default async function AdminHomePage() {
  const shop = await requireShop();
  const scoped = await db();

  const [settings, location, liveCustomDomain] = await Promise.all([
    getStoreSettings(),
    scoped.location.findFirst({
      where: { isPrimary: true },
      select: { address: true, city: true, phone: true },
    }),
    // Whether this shop has an address of its own that customers use. It
    // changes what the rename question means: with a custom domain live, moving
    // the free address is housekeeping; without one, it is the storefront's
    // public URL.
    scoped.domain.findFirst({
      where: { isPlatform: false, status: { in: ["VERIFIED", "ACTIVE"] } },
      select: { hostname: true, isPrimary: true },
      orderBy: { isPrimary: "desc" },
    }),
  ]);

  return (
    <div className="space-y-2.5">
      <PageHeader
        title="Home"
        description="Your store's name, its logos and where to find you. Logos are set here and nowhere else — every theme reads them from this screen."
      />
      <StoreIdentityForm
        customDomain={
          liveCustomDomain
            ? { hostname: liveCustomDomain.hostname, isPrimary: liveCustomDomain.isPrimary }
            : null
        }
        initial={{
          storeName: settings.storeName,
          subdomain: shop.subdomain,
          marks: toBrandMarks(settings),
          address: location?.address ?? "",
          city: location?.city ?? "",
          phone: location?.phone ?? "",
          contactEmail: settings.contactEmail ?? "",
        }}
      />
    </div>
  );
}
