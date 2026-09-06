import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { shopSession } from "@/lib/auth-guard";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar, type Alert } from "@/components/admin/admin-topbar";
import { AdminNavBar } from "@/components/admin/admin-navbar";
import { EditorBar } from "@/components/admin/editor-bar";
import { RefreshButton } from "@/components/admin/refresh-button";
import { getStoreSettings } from "@/lib/data/settings";
import { canonicalUrl, currentShop, db } from "@/lib/data/shop";
import { registryBusinessType } from "@/lib/themes/business-type";
import type { BusinessType } from "@/lib/admin-nav";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  // Defense in depth — proxy.ts already gates /admin/*, this re-checks
  // server-side. It asks about membership of *this* shop, not admin-ness in
  // general: owning one store must not open the door to another.
  // Two different failures with two different fixes. No session means sign in.
  // A session with no shop resolved means they are on the platform's own host and
  // have not said which store they mean — sending them to the login page there
  // would be a loop, because they are already signed in.
  const session = await auth();
  if (!session?.user?.id) redirect("/merchant/login?callbackUrl=/admin");

  const me = await shopSession();
  if (!me) redirect("/merchant/stores");

  // The sidebar shows what this kind of business needs. A blog has no orders,
  // a shop has no opening hours, and offering either is a door to nowhere.
  const shop = await currentShop();

  // A shop that has never been welcomed goes there first. The welcome flow has
  // its own layout, so this cannot loop: /admin/welcome never renders this one.
  if (shop && !shop.onboardedAt) redirect("/admin/welcome");
  const settings = await getStoreSettings();

  const type = registryBusinessType(shop?.businessType);
  const schemaType = (shop?.businessType ?? "ECOMMERCE") as BusinessType;

  return (
    // data-business-type no longer repaints anything — the panel is one palette
    // now, whatever the trade. It stays because screens read it to choose their
    // words: a restaurant's products are dishes.
    <div
      data-business-type={type}
      className="admin-shell min-h-screen bg-shell font-sans text-ink"
    >
      <div className="flex">
        {/* The sidebar starts at the very top of the window, beside the heading
            bar rather than under it — one column of six, full height, its own
            thing. That is APP.ai's arrangement. */}
        <AdminSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopbar
            storeName={me.shop.name}
            isLive={!settings.maintenanceMode}
            userEmail={me.email}
            storeUrl={await canonicalUrl(me.shop.id)}
            registryType={type}
            hasOtherStores={(session.user.shops?.length ?? 0) > 1}
            alerts={await pendingWork(schemaType)}
          />

          {/* The four bars of the drawing, in order: navigation, then whatever
              the page puts in its action bar, then the content container. pb-24
              leaves room for the floating save bar on editable screens. */}
          <main className="gutter-fluid min-w-0 flex-1 space-y-2.5 pb-20">
            <AdminNavBar />
            {/* Discard and Save for whatever screen is open. Draws nothing on a
                screen with nothing to save, so a list page keeps its own action
                bar and a form page gets one without building it. */}
            <EditorBar />
            <div className="rounded-2xl bg-panel p-3 sm:p-4">{children}</div>
          </main>
        </div>
      </div>
      <RefreshButton />
    </div>
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

  const enquiries = await prisma.enquiry.count({ where: { status: "NEW" } });
  if (enquiries > 0) {
    alerts.push({
      label: `${enquiries} new ${enquiries === 1 ? "enquiry" : "enquiries"}`,
      href: "/admin/enquiries",
    });
  }

  // A blog has no orders, and counting them would be a query for a number that
  // is always zero.
  if (businessType !== "BLOG") {
    const orders = await prisma.order.count({
      where: { orderStatus: "PENDING", deletedAt: null },
    });
    if (orders > 0) {
      alerts.push({
        label: `${orders} ${orders === 1 ? "order" : "orders"} awaiting fulfilment`,
        href: "/admin/orders",
      });
    }
  }

  return alerts;
}
