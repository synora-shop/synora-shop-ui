import { CartPageClient } from "@/components/storefront/cart-page-client";
import { getSiteText, text } from "@/lib/site-text";
import { guardStorefront } from "@/lib/maintenance";
import { getKitForRequest } from "@/lib/data/theme";
import { kitBaseContext, kitCheckoutTerms } from "@/lib/data/kit-context";
import { KitPage } from "@/components/storefront/kit-page";
import { isPreview } from "@/lib/preview-mode";

export const dynamic = "force-dynamic";

export default async function CartPage(props: PageProps<"/cart">) {

  await guardStorefront();

  // A theme with its own sections draws its cart template, on the platform's
  // cart, with the shop's own shipping fee and free-delivery threshold.
  const live = await getKitForRequest();
  if (live) {
    const ctx = { ...(await kitBaseContext()), checkout: await kitCheckoutTerms() };
    return <KitPage kit={live.kit} templates={live.templates} name="cart" ctx={ctx} preview={isPreview(await props.searchParams)} />;
  }

  const siteText = await getSiteText();

  return (
    <CartPageClient
      labels={{
        emptyHeading: text(siteText, "cart.emptyHeading"),
        continueShopping: text(siteText, "cart.continueShopping"),
        heading: text(siteText, "cart.heading"),
        orderSummary: text(siteText, "checkout.orderSummary"),
        subtotal: text(siteText, "checkout.subtotal"),
        shippingNote: text(siteText, "cart.shippingNote"),
        proceedToCheckout: text(siteText, "cart.proceedToCheckout"),
      }}
    />
  );
}
