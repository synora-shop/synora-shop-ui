import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { shopSession } from "@/lib/auth-guard";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { RefreshButton } from "@/components/admin/refresh-button";
import { AdminTheme } from "@/components/admin/admin-theme";
import { getStoreSettings } from "@/lib/data/settings";
import { canonicalUrl, currentShop } from "@/lib/data/shop";
import { registryBusinessType } from "@/lib/themes/business-type";

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

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink lg:flex">
      <AdminTheme />
      <AdminSidebar businessType={shop?.businessType ?? "ECOMMERCE"} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar
          storeName={me.shop.name}
          isLive={!settings.maintenanceMode}
          userName={me.email}
          userEmail={me.email}
          storeUrl={await canonicalUrl(me.shop.id)}
          businessType={registryBusinessType(shop?.businessType)}
          hasOtherStores={(session.user.shops?.length ?? 0) > 1}
        />
        {/* pb-24 leaves room for the sticky save bar, which floats over the
            bottom of the viewport on every page that can be edited. */}
        <main className="gutter-fluid min-w-0 flex-1 pb-24 pt-6">{children}</main>
      </div>
      <RefreshButton />
    </div>
  );
}
