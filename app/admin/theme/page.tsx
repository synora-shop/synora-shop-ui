import { canonicalUrl, db, requireShop } from "@/lib/data/shop";
import { shopSession } from "@/lib/auth-guard";
import { roleAtLeast } from "@/lib/roles";
import { RETENTION_DAYS } from "@/lib/store-lifecycle";
import { getStoreSettings } from "@/lib/data/settings";
import { StoreLifecycle } from "@/components/admin/store-lifecycle";
import { StoreStatusBar } from "@/components/admin/store-status-bar";
import { registryBusinessType } from "@/lib/themes/business-type";
import { defaultThemeFor, themesFor } from "@/lib/themes/registry";
import { PageHeader } from "@/components/ui/primitives";
import { ThemeGallery } from "@/components/admin/theme-gallery";

/**
 * Theme: what the store looks like, and how to change it.
 *
 * This page used to be called Design and did three jobs badly — it picked a
 * theme, edited every colour and typeface, and embedded a second copy of the
 * live customizer underneath. The colours moved to the customizer, where a
 * merchant can see what they are doing; what is left is the one question this
 * page should answer, which is which theme the store wears.
 */
export default async function ThemePage() {
  const shop = await requireShop();
  const type = registryBusinessType(shop.businessType);

  const [settings, storeUrl, me, storeSettings] = await Promise.all([
    (await db()).themeSettings.findUnique({
      where: { shopId_businessType: { shopId: shop.id, businessType: shop.businessType } },
      select: { themeKey: true },
    }),
    canonicalUrl(shop.id),
    shopSession(),
    getStoreSettings(),
  ]);

  const current = settings?.themeKey ?? defaultThemeFor(type);

  const canOpenAndClose = me ? roleAtLeast(me.role, "ADMIN") : false;

  return (
    <div className="space-y-5">
      {/* Whether customers can see the shop, pinned to the top of the page that
          is about how the shop looks. Sticky because it is the one fact that
          changes what everything below means: a theme you are admiring is not
          live if the store is closed. */}
      <StoreStatusBar
        status={shop.status}
        maintenance={storeSettings.maintenanceMode}
        storeUrl={storeUrl}
      />

      <PageHeader
        title="Theme"
        description="How your store looks to a customer."
      />
      <ThemeGallery
        current={current}
        storeUrl={storeUrl}
        themes={themesFor(type).map((t) => ({
          key: t.key,
          name: t.name,
          description: t.description,
          // Each theme can be seen running on the merchant's own content
          // rather than on a stock screenshot, which is the only preview that
          // answers "what would MY shop look like".
          previewUrl: `${storeUrl}?__theme=${t.key}`,
        }))}
      />

      {canOpenAndClose && me && (
        <section id="opening-and-closing" className="space-y-3 border-t border-border pt-5">
          <div>
            <h2 className="text-sm font-semibold">Opening and closing</h2>
            <p className="mt-0.5 text-xs text-ink-soft">
              Whether you are open for business, and what customers see when you
              are not.
            </p>
          </div>
          <StoreLifecycle
            status={me.shop.status}
            storeName={me.shop.name}
            isOwner={me.role === "OWNER"}
            retentionDays={RETENTION_DAYS}
          />
        </section>
      )}
    </div>
  );
}
