import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { shopSession } from "@/lib/auth-guard";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar, type Alert } from "@/components/admin/admin-topbar";
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

  const isLive = !settings.maintenanceMode;
  const badges = Object.fromEntries(alerts.map((a) => [a.href, a.count]));

  return (
    // data-business-type no longer repaints anything; screens read it to
    // choose their words. Every client component that draws money reads the
    // currency from the provider rather than through six unrelated props.
    //
    // New admin (15 October): a black rail on the left, and beside it one
    // sheet that is the only thing that scrolls. The window itself stays one
    // screen tall, so the rail and the top bar never leave it however long a
    // list gets, and the top bar and the save bar stick to the top of the
    // sheet while its content moves under them.
    <CurrencyProvider currency={resolveStoreDefaults(settings).currency}>
      <div data-business-type={type} className="admin-shell flex h-screen overflow-hidden bg-[#0a0a0a] font-sans text-ink">
        <AdminSidebar
          storeName={settings.storeName || me.shop.name}
          statusLabel={statusLabel(me.shop.status, isLive)}
          isLive={isLive && me.shop.status !== "PAUSED" && me.shop.status !== "CLOSED"}
          badges={badges}
          hasOtherStores={(session.user.shops?.length ?? 0) > 1}
        />
        <div className="min-w-0 flex-1 lg:py-2 lg:pr-2">
          <div className="relative h-full overflow-y-auto overscroll-contain bg-canvas lg:rounded-[1.25rem]">
            <AdminTopbar
              storeName={me.shop.name}
              isLive={isLive}
              userEmail={me.email}
              storeUrl={storeUrl}
              registryType={type}
              storeStatus={me.shop.status}
              hasOtherStores={(session.user.shops?.length ?? 0) > 1}
              alerts={alerts.map(({ label, href }) => ({ label, href }))}
            />
            <EditorBar />
            <main className="mx-auto flex max-w-[76rem] flex-col gap-5 p-4 sm:p-6 lg:p-8">{children}</main>
          </div>
        </div>
        <RefreshButton />
      </div>
    </CurrencyProvider>
  );
}

/** The few words under the store's name in the rail. */
function statusLabel(status: string, live: boolean): string {
  if (status === "CLOSED") return "Closed";
  if (status === "PAUSED") return "Paused: customers see your holding page";
  if (status === "SUSPENDED") return "Suspended";
  if (status === "PAST_DUE") return "Open · payment overdue";
  if (!live) return "Hidden: holding page on";
  return status === "TRIAL" ? "Open · free trial" : "Open";
}

/**
 * What is waiting on the merchant, for the bell in the top bar.
 *
 * Two counts and no more. A notification centre that lists everything that has
 * ever happened is a second inbox nobody reads; the bell is only worth having
 * if a dot on it means something needs doing today.
 */
async function pendingWork(businessType: BusinessType): Promise<(Alert & { count: number })[]> {
  const prisma = await db();
  const alerts: (Alert & { count: number })[] = [];

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
      count: enquiries,
    });
  }

  if (orders > 0) {
    alerts.push({
      label: `${orders} ${orders === 1 ? "order" : "orders"} awaiting fulfilment`,
      href: "/admin/orders",
      count: orders,
    });
  }

  return alerts;
}
