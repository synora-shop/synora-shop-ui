import { redirect } from "next/navigation";
import { shopSession } from "@/lib/auth-guard";
import { canonicalUrl } from "@/lib/data/shop";
import { db } from "@/lib/data/shop";
import { getRegions, visitorCountry } from "@/lib/data/regions";
import { getMenus } from "@/lib/data/menus";
import { overlappingCountries } from "@/lib/region";
import { PageHeader } from "@/components/ui/primitives";
import { RegionManager, type RegionRowView } from "@/components/admin/region-manager";

export const dynamic = "force-dynamic";

export default async function AdminRegionsPage() {
  const me = await shopSession();
  if (!me) redirect("/merchant/login?callbackUrl=/admin/regions");

  const [regions, menus, country, storeUrl] = await Promise.all([
    getRegions(),
    getMenus(),
    visitorCountry(),
    canonicalUrl(me.shop.id),
  ]);

  const rows: RegionRowView[] = regions.map((r) => ({
    id: r.id,
    handle: r.handle,
    isDefault: r.isDefault,
    details: {
      name: r.name,
      countries: r.countries.join(" "),
      isActive: r.isActive,
      headerMenuId: r.headerMenuId,
      footerMenuId: r.footerMenuId,
      announcementText: r.announcementText,
      announcementBgColor: r.announcementBgColor,
    },
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Regions"
        description="Show a different storefront depending on where the visitor is. A region only changes what you give it, everything else stays exactly as the rest of your store."
      />

      <RegionManager
        regions={rows}
        menus={menus.map((m) => ({ id: m.id, name: m.name }))}
        overlaps={overlappingCountries(regions)}
        detectedCountry={country}
        storeUrl={storeUrl}
      />
    </div>
  );
}
