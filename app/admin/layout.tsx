import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { shopSession } from "@/lib/auth-guard";
import { AdminPhoneBar, AdminSheet, AdminSidebar, type Alert } from "@/components/admin/admin-sidebar";
import { AdminKeys } from "@/components/admin/admin-topbar";
import { EditorBar } from "@/components/admin/editor-bar";
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
    // 18 October (from /next-admin): a black rail on the left, and beside it
    // one rounded sheet that holds still while only its content scrolls. No
    // top bar: each screen's heading sticks to the top of the sheet, and the
    // save bar floats at its foot when there is something to save.
    <CurrencyProvider currency={resolveStoreDefaults(settings).currency}>
      <div data-business-type={type} className="admin-shell min-h-dvh bg-[#0a0a0a] font-sans text-ink">
        <AdminSidebar
          storeName={settings.storeName || me.shop.name}
          statusLabel={statusLabel(me.shop.status, isLive)}
          isLive={isLive && me.shop.status !== "PAUSED" && me.shop.status !== "CLOSED"}
          badges={badges}
          hasOtherStores={(session.user.shops?.length ?? 0) > 1}
          userEmail={me.email}
          storeUrl={storeUrl}
          registryType={type}
          storeStatus={me.shop.status}
          alerts={alerts.map(({ label, href }) => ({ label, href }))}
        />
        <AdminPhoneBar />
        <AdminKeys />
        <AdminSheet>
          <div className="mx-auto flex w-full max-w-[96rem] flex-col gap-4 px-4 pb-14 sm:px-6">{children}</div>
          <EditorBar />
        </AdminSheet>
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
