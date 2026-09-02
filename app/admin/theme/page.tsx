import { canonicalUrl, db, requireShop } from "@/lib/data/shop";
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

  const [settings, storeUrl] = await Promise.all([
    (await db()).themeSettings.findUnique({
      where: { shopId_businessType: { shopId: shop.id, businessType: shop.businessType } },
      select: { themeKey: true },
    }),
    canonicalUrl(shop.id),
  ]);

  const current = settings?.themeKey ?? defaultThemeFor(type);

  return (
    <div className="space-y-5">
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
    </div>
  );
}
