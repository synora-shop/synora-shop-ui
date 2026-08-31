import { CartPageClient } from "@/components/storefront/cart-page-client";
import { getSiteText, text } from "@/lib/site-text";
import { guardStorefront } from "@/lib/maintenance";

export const dynamic = "force-dynamic";

export default async function CartPage() {

  await guardStorefront();
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
