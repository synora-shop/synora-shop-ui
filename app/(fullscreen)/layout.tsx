import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { shopSession } from "@/lib/auth-guard";
import { AdminTheme } from "@/components/admin/admin-theme";

/**
 * Admin screens that take the whole window.
 *
 * A route group rather than a folder under app/admin, and that is the entire
 * point: a nested layout in Next adds to its parent, it cannot remove one, so
 * anything filed under app/admin/ inherits the sidebar and topbar no matter
 * what it renders. Sitting here instead, `/admin/customize` still resolves and
 * is still gated by proxy.ts — which matches on the URL, not the file tree —
 * but arrives with none of the admin chrome.
 *
 * That matters for an editor with a preview in it. The customizer's whole job
 * is to show the merchant their storefront as a customer will see it; framing
 * that in a 15rem sidebar and a topbar leaves a shop window's worth of preview
 * inside a letterbox, which is why the section editor read as a toy next to
 * the thing it edits. Shopify's editor takes the window for the same reason.
 *
 * The guards are repeated rather than shared because they have to be: this
 * layout is not a child of the admin one, so nothing it does has run.
 */
export default async function FullscreenLayout({ children }: LayoutProps<"/">) {
  const session = await auth();
  if (!session?.user?.id) redirect("/merchant/login?callbackUrl=/admin");

  const me = await shopSession();
  if (!me) redirect("/merchant/stores");

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-canvas font-sans text-ink">
      <AdminTheme />
      {children}
    </div>
  );
}
