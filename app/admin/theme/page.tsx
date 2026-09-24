import { canonicalUrl, db, requireShop } from "@/lib/data/shop";
import { registryBusinessType } from "@/lib/themes/business-type";
import { defaultThemeFor, themeFor, themesFor } from "@/lib/themes/registry";
import { appUrl, normaliseHost } from "@/lib/shop-context";
import { DEMO_SLUGS, demoSubdomain, demoSubdomainForTheme, themeStorePath } from "@/lib/themes/demo";
import { prisma } from "@/lib/prisma";
import { liveCopyOf } from "@/lib/themes/live";
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

  const [settings, storeUrl, rows, seededDemos] = await Promise.all([
    (await db()).themeSettings.findUnique({
      where: { shopId_businessType: { shopId: shop.id, businessType: shop.businessType } },
      select: { themeKey: true, installedThemeId: true },
    }),
    canonicalUrl(shop.id),
    // Newest first, which is the order the design draws them in — and not
    // "live first". Where a copy sits in the list is when it was added; which
    // one is live is said by the row itself.
    (await db()).installedTheme.findMany({ orderBy: { installedAt: "desc" } }),
    // Which demos actually exist in this database.
    //
    // A theme's demo is a real Shop, and a real Shop has to be seeded — so
    // there is always an environment where the code is deployed and the data
    // is not: a fresh local database, a preview branch, and production in the
    // minutes between a deploy and `scripts/seed-theme-store.ts`. Sending a
    // merchant to a 404 in that window is worse than sending them where Preview
    // used to go, so this asks rather than assumes.
    //
    // Bare `prisma`: these shops are ours, not this tenant's, so the scoped
    // client cannot see them. One indexed lookup on a unique column, in the
    // same wave as everything else on the screen.
    prisma.shop.findMany({
      where: { subdomain: { in: DEMO_SLUGS.map(demoSubdomain) } },
      select: { subdomain: true },
    }),
  ]);
  const haveDemo = new Set(seededDemos.map((s) => s.subdomain));

  const liveKey = settings?.themeKey ?? defaultThemeFor(type);
  // Same fallback as everywhere else: with a bare `?? null` no row was marked
  // Active on any shop whose settings row predates the column.
  //
  // On a copy sorted oldest-first, deliberately. `rows` is newest-first
  // because that is the order the design draws the list in, and the fallback
  // picks the *first* match — so handing it this list would mark the newest
  // copy Active here and render the oldest one on the storefront.
  const oldestFirst = [...rows].sort(
    (a, b) => a.installedAt.getTime() - b.installedAt.getTime()
  );
  const liveId = liveCopyOf(oldestFirst, settings)?.id ?? null;

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
        // The shop's own live address, for the Active Theme section — and with
        // no `?__theme=` on it. Overriding the live theme with itself renders
        // the same page while implying it is a preview, and on a shop running a
        // theme it holds no copy of, the fallback used to hand that section a
        // *store* link, so "your storefront" pointed at somebody's demo.
        storeUrl={storeUrl}
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
        store={available.map((t) => {
          // The theme's own demo, on our servers, with our goods in it — the
          // same page for everyone on the internet. Not this shop wearing the
          // theme, which is what it used to be and which judged the design
          // through the merchant's own photography: four products and a lot of
          // white, and the theme read as empty. See docs/THEMES.md §5b.
          //
          // Absolute, because the admin may be on the application host or on
          // the shop's own address and the demo is only ever on ours.
          const sub = demoSubdomainForTheme(t.key);
          const demo = sub && haveDemo.has(sub) ? themeStorePath(t.key) : null;
          return {
            key: t.key,
            name: t.name,
            description: t.description,
            preview: t.preview,
            latest: t.version,
            plate: t.plate,
            // No demo — unseeded, or a theme with no published slug — falls
            // back to what Preview did before the theme store existed: this
            // shop wearing the theme. A worse answer to the question, and a
            // far better one than a 404.
            previewUrl: demo ? appUrl(demo) : `${storeUrl}?__theme=${t.key}`,
          };
        })}
      />
      <LearnMore about="Themes" />
    </div>
  );
}
