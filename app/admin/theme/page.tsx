import { canonicalUrl, db, requireShop } from "@/lib/data/shop";
import { registryBusinessType } from "@/lib/themes/business-type";
import { defaultThemeFor, themeFor, themesFor } from "@/lib/themes/registry";
import { normaliseHost } from "@/lib/shop-context";
import { LearnMore } from "@/components/admin/panel";
import { ThemeManager } from "@/components/admin/theme-manager";

/**
 * Themes — what the store looks like, and which design it wears.
 *
 * Three sections, drawn in APP themes.ai and measured in the guide beside it:
 * what is live, what this shop owns, and what exists. See docs/PANEL.md §2.
 *
 * **A shop owns copies, not themes.** Add makes a copy every time, so the
 * library can hold KITE twice — two sets of edits, two versions, two Added
 * dates — and either can be activated. Everything on this screen is therefore
 * addressed by copy id, never by theme key: two copies of KITE are both KITE.
 *
 * No action bar. There is nothing here to filter, sort or create — every action
 * belongs to a row or a card rather than to the page — and the global design
 * document is explicit that a screen with none draws none.
 *
 * "Opening and closing" used to sit at the bottom of this page and has moved to
 * Preferences → Maintenance with the rest of the closed-shop machinery.
 */
export default async function ThemePage() {
  const shop = await requireShop();
  const type = registryBusinessType(shop.businessType);

  const [settings, storeUrl, rows] = await Promise.all([
    (await db()).themeSettings.findUnique({
      where: { shopId_businessType: { shopId: shop.id, businessType: shop.businessType } },
      select: { themeKey: true, installedThemeId: true },
    }),
    canonicalUrl(shop.id),
    // Newest first, which is the order the design draws them in — and not
    // "live first". Where a copy sits in the list is when it was added; which
    // one is live is said by the row itself.
    (await db()).installedTheme.findMany({ orderBy: { installedAt: "desc" } }),
  ]);

  const liveKey = settings?.themeKey ?? defaultThemeFor(type);
  const liveId = settings?.installedThemeId ?? null;

  // "Sep 5 at 10:35 pm" — the shape the design asks for, and a more useful one
  // than a bare date. Two copies of the same theme added the same afternoon are
  // told apart by the time, and that is exactly when a merchant is trying to
  // tell them apart.
  const when = new Intl.DateTimeFormat("en-GB", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const available = themesFor(type);
  const offered = new Set(available.map((t) => t.key));

  return (
    <div className="flex flex-col gap-[var(--gap-lg)]">
      <ThemeManager
        liveId={liveId}
        liveKey={liveKey}
        storeHost={normaliseHost(storeUrl.replace(/^https?:\/\//, ""))}
        // Every copy this shop holds. A copy of a theme that has since been
        // retired from the registry is kept in the list rather than hidden —
        // the merchant still has it, and a row that quietly vanishes is worse
        // than one that says the design is no longer offered.
        copies={rows
          .filter((r) => offered.has(r.themeKey))
          .map((r) => ({
            id: r.id,
            themeKey: r.themeKey,
            name: themeFor(r.themeKey).name,
            preview: themeFor(r.themeKey).preview,
            version: r.version,
            latest: themeFor(r.themeKey).version,
            addedAt: when.format(r.installedAt).replace(",", " at"),
            // The shop wearing this exact copy — its edits included, which is
            // the only preview that answers "what would MY shop look like".
            previewUrl: `${storeUrl}?__theme=${r.id}`,
          }))}
        // The store offers every theme, always — including ones already in the
        // library. Add is not "own this", it is "give me another copy", and a
        // merchant who wants a second KITE to experiment on gets it here.
        store={available.map((t) => ({
          key: t.key,
          name: t.name,
          description: t.description,
          preview: t.preview,
          latest: t.version,
          owned: rows.filter((r) => r.themeKey === t.key).length,
          previewUrl: `${storeUrl}?__theme=${t.key}`,
        }))}
      />
      <LearnMore about="Themes" />
    </div>
  );
}
