import { PageHeader } from "@/components/ui/primitives";
import { getStoreSettings } from "@/lib/data/settings";
import { toHoldingPage } from "@/lib/holding-page";
import { toBrandMarks, pickLogo } from "@/lib/brand-marks";
import { currentShop, db } from "@/lib/data/shop";
import { MaintenanceEditor } from "@/components/admin/maintenance-editor";

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
 * Under Your App rather than Preferences because that is what it is — a page
 * on the storefront, sitting beside Pages and Themes, and the only one a
 * merchant cannot reach through the customizer.
 */
export default async function MaintenancePage() {
  const shop = await currentShop();
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
    <div className="space-y-4">
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
    </div>
  );
}
