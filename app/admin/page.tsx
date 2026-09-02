import { db, requireShop } from "@/lib/data/shop";
import { getStoreSettings } from "@/lib/data/settings";
import { resolveThemeTokens } from "@/lib/theme-tokens";
import { PageHeader } from "@/components/ui/primitives";
import { StoreIdentityForm } from "@/components/admin/store-identity-form";

/**
 * Home: what this shop is called, what it looks like, and where it is.
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

  const [settings, theme, location] = await Promise.all([
    getStoreSettings(),
    scoped.themeSettings.findUnique({
      where: { shopId_businessType: { shopId: shop.id, businessType: shop.businessType } },
      select: { tokens: true },
    }),
    scoped.location.findFirst({
      where: { isPrimary: true },
      select: { address: true, city: true, phone: true },
    }),
  ]);

  const tokens = resolveThemeTokens((theme?.tokens as object) ?? {});

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="Home"
        description="Your store's name, logo and where to find you."
      />
      <StoreIdentityForm
        initial={{
          storeName: settings.storeName,
          logoUrl: tokens.logoUrl ?? "",
          address: location?.address ?? "",
          city: location?.city ?? "",
          phone: location?.phone ?? "",
          contactEmail: settings.contactEmail ?? "",
        }}
      />
    </div>
  );
}
