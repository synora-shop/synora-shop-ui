import { canonicalUrl, db, requireShop } from "@/lib/data/shop";
import { registryBusinessType } from "@/lib/themes/business-type";
import { defaultThemeFor, themesFor } from "@/lib/themes/registry";
import { normaliseHost } from "@/lib/shop-context";
import { LearnMore } from "@/components/admin/panel";
import { ThemeManager } from "@/components/admin/theme-manager";

/**
 * Themes — what the store looks like, and which design it wears.
 *
 * Three sections, drawn in APP themes.ai and measured in the guide beside it:
 * what is live, what this shop owns, and what exists. See docs/PANEL.md §2.
 *
 * No action bar. There is nothing on this screen to filter, sort or create —
 * the actions all belong to a row or a card rather than to the page — and the
 * global design document is explicit that a screen with none draws none.
 *
 * "Opening and closing" used to sit at the bottom of this page and has moved
 * to Preferences → Maintenance, with the rest of the closed-shop machinery.
 * Whether the shop is open is how it behaves, not how it looks.
 */
export default async function ThemePage() {
  const shop = await requireShop();
  const type = registryBusinessType(shop.businessType);

  const [settings, storeUrl, rows] = await Promise.all([
    (await db()).themeSettings.findUnique({
      where: { shopId_businessType: { shopId: shop.id, businessType: shop.businessType } },
      select: { themeKey: true },
    }),
    canonicalUrl(shop.id),
    (await db()).installedTheme.findMany({ orderBy: { installedAt: "desc" } }),
  ]);

  const current = settings?.themeKey ?? defaultThemeFor(type);
  const owned = new Map(rows.map((r) => [r.themeKey, r]));

  // "Sep 5 at 10:35 pm" — the shape the design asks for, and a more useful one
  // than a bare date: two themes added the same afternoon are told apart by the
  // time, and that is exactly when a merchant is trying to tell them apart.
  const when = new Intl.DateTimeFormat("en-GB", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="flex flex-col gap-[var(--gap-lg)]">
      <ThemeManager
        current={current}
        storeHost={normaliseHost(storeUrl.replace(/^https?:\/\//, ""))}
        themes={themesFor(type).map((t) => {
          const row = owned.get(t.key);
          return {
            key: t.key,
            name: t.name,
            description: t.description,
            preview: t.preview,
            latest: t.version,
            version: row?.version,
            installed: Boolean(row),
            addedAt: row ? when.format(row.installedAt).replace(",", " at") : undefined,
            // Each theme can be seen running on the merchant's own content
            // rather than on a stock screenshot, which is the only preview that
            // answers "what would MY shop look like".
            previewUrl: `${storeUrl}?__theme=${t.key}`,
          };
        })}
      />
      <LearnMore about="Themes" />
    </div>
  );
}
