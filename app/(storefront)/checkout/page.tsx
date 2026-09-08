import type { Metadata } from "next";
import { currentCustomer } from "@/lib/data/customer";
import { db } from "@/lib/data/shop";
import { Container } from "@/components/ui/container";
import { CheckoutForm } from "@/components/storefront/checkout-form";
import { getStoreSettings } from "@/lib/data/settings";
import { getSiteText, text } from "@/lib/site-text";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { guardStorefront } from "@/lib/maintenance";
import { checkoutMethods } from "@/lib/payment-methods";
import { offerableGateways } from "@/lib/payments/offer";
import { releaseExpiredForShop } from "@/lib/payments/reservations";
import { resolveStoreDefaults } from "@/lib/store-defaults";
import { shopSession } from "@/lib/auth-guard";
import { currentShopId } from "@/lib/data/shop";

export const metadata: Metadata = { title: "Checkout" };
// Bank/JazzCash/EasyPaisa details can change in the admin panel — never serve a stale snapshot.
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  await guardStorefront();
  const [settings, siteText] = await Promise.all([getStoreSettings(), getSiteText()]);
  const session = await auth();

  // Pre-fill the form for a signed-in shopper from their account and most
  // recent saved address, so they don't retype it every order.
  const me = await currentCustomer();
  const user = me
    ? await (await db()).customer.findFirst({
        where: { id: me.id },
        include: { addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }], take: 1 } },
      })
    : null;
  const address = user?.addresses[0];

  // What this shop accepts, worked out here rather than in the browser.
  //
  // A gateway may only be offered when it is connected, switched on, live, and
  // priced in a currency it settles — and, while it is still in test mode, only
  // to the shop's own staff, which is how the go-live test is done without a
  // shopper ever meeting a payment that takes pretend money.
  const shopId = await currentShopId();
  const staff = await shopSession();
  const gateways = await offerableGateways(
    shopId,
    resolveStoreDefaults(settings).currency,
    !!staff && staff.shop.id === shopId
  );
  const methods = checkoutMethods(settings.enabledPaymentMethods, settings, gateways);

  // Stock held by payments nobody finished. Given back before this page prices
  // anything, so a shopper is not told the last one is gone because somebody
  // walked away from a payment page half an hour ago.
  await releaseExpiredForShop(shopId).catch(() => {});

  const initialValues = user
    ? {
        name: user.name,
        email: user.email,
        phone: address?.phone ?? user.phone ?? undefined,
        line1: address?.line1,
        line2: address?.line2 ?? undefined,
        city: address?.city,
        postalCode: address?.postalCode ?? undefined,
      }
    : undefined;

  return (
    <Container className="py-12">
      <h1 className="font-serif text-3xl font-semibold text-ink">Checkout</h1>
      <div className="mt-8">
        <CheckoutForm
          settings={settings}
          methods={methods}
          initialValues={initialValues}
          placeOrderLabel={text(siteText, "checkout.placeOrder")}
          placingOrderLabel={text(siteText, "checkout.placingOrder")}
          labels={{
            contactShippingLegend: text(siteText, "checkout.contactShippingLegend"),
            paymentMethodLegend: text(siteText, "checkout.paymentMethodLegend"),
            paymentInstructionsNote: text(siteText, "checkout.paymentInstructionsNote"),
            orderSummary: text(siteText, "checkout.orderSummary"),
            subtotal: text(siteText, "checkout.subtotal"),
            shipping: text(siteText, "checkout.shipping"),
            total: text(siteText, "checkout.total"),
            freeShipping: text(siteText, "checkout.freeShipping"),
            emailError: text(siteText, "checkout.emailError"),
            phoneError: text(siteText, "checkout.phoneError"),
            genericError: text(siteText, "checkout.genericError"),
          }}
        />
      </div>
    </Container>
  );
}
