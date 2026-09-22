import { PageHeader } from "@/components/ui/primitives";
import { getStoreSettings } from "@/lib/data/settings";
import { toHoldingPage } from "@/lib/holding-page";
import { toBrandMarks, pickLogo } from "@/lib/brand-marks";
import { currentShop, db } from "@/lib/data/shop";
import { MaintenanceEditor } from "@/components/admin/maintenance-editor";
import { StoreLifecycle } from "@/components/admin/store-lifecycle";
import { LearnMore } from "@/components/admin/panel";
import { SectionDivider } from "@/components/ui/primitives";
import { shopSession } from "@/lib/auth-guard";
import { roleAtLeast } from "@/lib/roles";
import { RETENTION_DAYS } from "@/lib/store-lifecycle";

export const dynamic = "force-dynamic";

/**
 * Your App — Maintenance.
 *
 * The switch that takes a store offline, and the page customers see when it
 * is. They were in different places: the switch was one toggle at the top of
 * Preferences → Visibility, and the page was words hard-coded in the
 * storefront that no merchant could reach. A merchant who closed for the
 * afternoon had no idea what their customers were being shown.
 *
 * Under Preferences since 22 September. It sat under Your App, on the argument
 * that it is a page on the storefront sitting beside Pages and Themes — which
 * is true and is the weaker argument. Whether the shop is open is how it
 * *behaves*, and Visibility, the tab above this one, is already that question.
 *
 * Opening and closing came with it, off the bottom of the Themes screen. The
 * design gives Themes three sections and none of them is this; and a switch
 * that closes the shop belongs next to the page customers see when it is shut,
 * not under a gallery of designs.
 */
export default async function MaintenancePage() {
  const shop = await currentShop();
  const me = await shopSession();
  const [settings, signups] = await Promise.all([
    getStoreSettings(),
    // Newest first: a merchant opening this after reopening wants to see who
    // has been waiting longest at the bottom, not to page to them.
    (await db()).reopenSignup.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, createdAt: true, notifiedAt: true },
      // A cap rather than paging. Someone with more than this many waiting has
      // outgrown reading them on screen and wants the export.
      take: 500,
    }),
  ]);

  return (
    <div className="space-y-2.5">
      <PageHeader
        title="Maintenance"
        description="Close your store to customers, and write what they see while it is shut."
      />
      <MaintenanceEditor
        initial={toHoldingPage(settings)}
        maintenanceMode={settings.maintenanceMode === true}
        storePaused={shop?.status === "PAUSED"}
        storeName={settings.storeName}
        themeLogoUrl={pickLogo(toBrandMarks(settings))}
        signups={signups.map((s) => ({
          id: s.id,
          email: s.email,
          createdAt: s.createdAt.toISOString(),
          notified: s.notifiedAt !== null,
        }))}
      />

      {/* Opening, closing and closing for good. Only an admin sees it: the
          rest of this screen is words on a page, and this is the shop's own
          existence. */}
      {me && roleAtLeast(me.role, "ADMIN") && (
        <section id="opening-and-closing" className="space-y-2.5 pt-2">
          <SectionDivider
            title="Opening and closing"
            description="Whether you are open for business, and what happens if you stop."
          />
          <StoreLifecycle
            status={me.shop.status}
            storeName={me.shop.name}
            isOwner={me.role === "OWNER"}
            retentionDays={RETENTION_DAYS}
          />
        </section>
      )}

      <LearnMore about="Maintenance" />
    </div>
  );
}
