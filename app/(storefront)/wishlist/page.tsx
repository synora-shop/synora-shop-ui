import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { guardStorefront } from "@/lib/maintenance";
import { getKitForRequest } from "@/lib/data/theme";
import { kitBaseContext } from "@/lib/data/kit-context";
import { KitPage } from "@/components/storefront/kit-page";
import { isPreview } from "@/lib/preview-mode";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Wishlist", robots: { index: false } };

/**
 * The wishlist — a page only a theme with its own sections has. The
 * platform's own storefront has no hearts, so for it this address is not a
 * page at all.
 */
export default async function WishlistPage(props: PageProps<"/wishlist">) {
  await guardStorefront();
  const live = await getKitForRequest();
  if (!live) notFound();
  return <KitPage kit={live.kit} templates={live.templates} name="wishlist" ctx={await kitBaseContext()} preview={isPreview(await props.searchParams)} />;
}
