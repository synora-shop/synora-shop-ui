import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { shopSession } from "@/lib/auth-guard";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar, type Alert } from "@/components/admin/admin-topbar";
import { AdminNavbar } from "@/components/admin/admin-navbar";
import { EditorBar } from "@/components/admin/editor-bar";
import { RefreshButton } from "@/components/admin/refresh-button";
import { getStoreSettings } from "@/lib/data/settings";
import { canonicalUrl, currentShop, db } from "@/lib/data/shop";
import { registryBusinessType } from "@/lib/themes/business-type";
import { CurrencyProvider } from "@/components/ui/currency";
import { resolveStoreDefaults } from "@/lib/store-defaults";
import type { BusinessType } from "@/lib/admin-nav";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  // Defense in depth — proxy.ts already gates /admin/*, this re-checks
  // server-side. It asks about membership of *this* shop, not admin-ness in
  // general: owning one store must not open the door to another.
  // Two different failures with two different fixes. No session means sign in.
  // A session with no shop resolved means they are on the platform's own host and
  // have not said which store they mean — sending them to the login page there
  // would be a loop, because they are already signed in.
  // Three questions that do not depend on each other, asked together.
  //
  // They were asked one after another, and so was everything below — seven
  // round trips to the database in a row on *every* admin page, each waiting
  // for the one before it for no reason. The guards still run in order; only
  // the waiting is shared.
  const [session, me, shop] = await Promise.all([auth(), shopSession(), currentShop()]);

  if (!session?.user?.id) redirect("/merchant/login?callbackUrl=/admin");
  if (!me) redirect("/merchant/stores");

  // A shop that has never been welcomed goes there first. The welcome flow has
  // its own layout, so this cannot loop: /admin/welcome never renders this one.
  if (shop && !shop.onboardedAt) redirect("/admin/welcome");

  const type = registryBusinessType(shop?.businessType);
  const schemaType = (shop?.businessType ?? "ECOMMERCE") as BusinessType;

  // The second and last wave. These need a shop, so they cannot join the first
  // — but they do not need each other.
  const [settings, storeUrl, alerts] = await Promise.all([
    getStoreSettings(),
    canonicalUrl(me.shop.id),
    pendingWork(schemaType),
  ]);

  return (
    // data-business-type no longer repaints anything — the panel is one palette
    // now, whatever the trade. It stays because screens read it to choose their
    // words: a restaurant's products are dishes.
    // Every client component that draws money reads the currency from here
    // rather than being handed it through six unrelated props.
    // The window itself does not scroll, and that is the whole layout.
    //
    // The global design document is explicit: the header, the sidebar, the
    // navigation bar and the action bar all stay put, and scrolling happens
    // inside the main container. So the shell is exactly one screen tall and
    // clips, and the one box below that is allowed to overflow is the content.
    //
    // It is not a preference. A merchant halfway down four hundred products
    // still needs the tabs and the actions for that screen, and a page that
    // scrolls as a whole takes both off the top of the window precisely when
    // they are most wanted.
    <CurrencyProvider currency={resolveStoreDefaults(settings).currency}>
    <div
      data-business-type={type}
      className="admin-shell flex h-screen flex-col overflow-hidden bg-shell font-sans text-ink"
    >
      {/* Full width, above the sidebar as well as the content. */}
      <AdminTopbar
        storeName={me.shop.name}
        isLive={!settings.maintenanceMode}
        userEmail={me.email}
        storeUrl={await canonicalUrl(me.shop.id)}
        registryType={type}
        storeStatus={me.shop.status}
        hasOtherStores={(session.user.shops?.length ?? 0) > 1}
        alerts={await pendingWork(schemaType)}
      />

      {/* The background, as a block that tucks under the header.
        *
        * The global design document says the background *overlaps* the header,
        * the way it does on synoradigitals.com, and the design file draws it:
        * the grey does not meet the indigo in a straight seam, it curves away
        * from it, and the indigo fills the corners behind the curve. It was a
        * flat edge here, which is the difference between the two screens that
        * reads first and is hardest to name.
        *
        * Pulled up by its own radius so the corners sit against the indigo,
        * and the header is that much taller to have something behind them.
        *
        * The white glow belongs to this block, not to the header — it is the
        * *background* that glows, and what it lands on is the header above it.
        * Putting it here rather than inside the bar is what makes that true
        * rather than merely look true.
        *
        * 30px from every edge of the screen, and 30px between the sidebar and
        * the column beside it — one margin where two meet, never both. */}
      <div className="relative -mt-[var(--radius-page)] flex min-h-0 flex-1 gap-[var(--gap-lg)] rounded-t-[var(--radius-page)] bg-shell p-[var(--gap-lg)] shadow-glow-page max-lg:p-4">
        <AdminSidebar />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-[var(--gap-sm)]">
          {/* The bars of the drawing, in order. The navigation bar carries no
              bottom margin of its own: the action buttons beneath it bring
              15px, and two margins meeting are one margin. */}
          <AdminNavbar />

          {/* The action bar. No container of its own — it is buttons side by
              side, each carrying its own — so on a screen with nothing to
              filter, sort or create it draws nothing at all and costs no
              height. Themes is one of those. */}
          <EditorBar />

          {/* The main container, and the only thing on the screen that
              scrolls. */}
          <div className="min-h-0 flex-1 overflow-y-auto rounded-[var(--radius-container)] bg-panel p-[var(--gap-lg)] shadow-container max-lg:p-4">
            {children}
          </div>
        </div>
      </div>
      <RefreshButton />
    </div>
    </CurrencyProvider>
  );
}

/**
 * What is waiting on the merchant, for the bell in the top bar.
 *
 * Two counts and no more. A notification centre that lists everything that has
 * ever happened is a second inbox nobody reads; the bell is only worth having
 * if a dot on it means something needs doing today.
 */
async function pendingWork(businessType: BusinessType): Promise<Alert[]> {
  const prisma = await db();
  const alerts: Alert[] = [];

  // Both counts at once. A blog has no orders, and counting them would be a
  // query for a number that is always zero — so that one is skipped rather
  // than asked and discarded.
  const [enquiries, orders] = await Promise.all([
    prisma.enquiry.count({ where: { status: "NEW" } }),
    businessType === "BLOG"
      ? Promise.resolve(0)
      : prisma.order.count({ where: { orderStatus: "PENDING", deletedAt: null } }),
  ]);

  if (enquiries > 0) {
    alerts.push({
      label: `${enquiries} new ${enquiries === 1 ? "enquiry" : "enquiries"}`,
      href: "/admin/enquiries",
    });
  }

  if (orders > 0) {
    alerts.push({
      label: `${orders} ${orders === 1 ? "order" : "orders"} awaiting fulfilment`,
      href: "/admin/orders",
    });
  }

  return alerts;
}
