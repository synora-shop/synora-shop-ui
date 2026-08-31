import { ThemePanel } from "@/components/customizer/theme-panel";
import { ThemePicker } from "@/components/admin/theme-picker";
import { getThemeTokens } from "@/lib/data/theme";
import { db, requireShop } from "@/lib/data/shop";
import { registryBusinessType } from "@/lib/themes/business-type";
import { defaultThemeFor } from "@/lib/themes/registry";

export const dynamic = "force-dynamic";

export default async function ThemePageRoute() {
  const shop = await requireShop();
  const [tokens, settings] = await Promise.all([
    getThemeTokens(),
    (await db()).themeSettings.findFirst({ select: { themeKey: true } }),
  ]);

  const businessType = registryBusinessType(shop.businessType);

  return (
    <div className="space-y-10">
      <ThemePicker
        businessType={businessType}
        // The default for *this* business type, not the platform's. Falling
        // back to Aurora meant a restaurant saw none of its own designs marked
        // as in use, which reads as no design chosen when one is in force.
        current={settings?.themeKey ?? defaultThemeFor(businessType)}
      />
      <ThemePanel initialTokens={tokens} />
    </div>
  );
}
