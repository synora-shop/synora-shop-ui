import { currentShop } from "@/lib/data/shop";
import { cachedForShop } from "@/lib/data/cached";

// Every admin-editable UI string, with its current (English) copy as the
// fallback — this is what ships even if the SiteText table is empty, so
// landing this infrastructure changes nothing visually until an admin
// actually edits a value in /admin/site-text. Grouped for the admin UI.
export const SITE_TEXT_DEFAULTS: Record<string, { value: string; group: string }> = {
  "footer.tagline": {
    group: "Header & Footer",
    value:
      "Contemporary Pakistani women's fashion, lawn, formal and unstitched collections crafted for everyday elegance.",
  },
  "contact.heading": { group: "Contact Page", value: "Contact Us" },
  "contact.body": {
    group: "Contact Page",
    value: "Have a question about an order, sizing, or our collections? We'd love to hear from you.",
  },
  "contact.whatsappButton": { group: "Contact Page", value: "Chat on WhatsApp" },
  "contact.emailIntro": { group: "Contact Page", value: "or email us at" },
  "product.addToCart": { group: "Product Page", value: "Add to Cart" },
  "product.addedToCart": { group: "Product Page", value: "Added to Cart" },
  "product.buyNow": { group: "Product Page", value: "Buy Now" },
  "product.orderViaWhatsApp": { group: "Product Page", value: "Order via WhatsApp" },
  "checkout.placeOrder": { group: "Cart & Checkout", value: "Place Order" },
  "checkout.placingOrder": { group: "Cart & Checkout", value: "Placing order…" },
  "checkout.contactShippingLegend": { group: "Cart & Checkout", value: "Contact & Shipping" },
  "checkout.paymentMethodLegend": { group: "Cart & Checkout", value: "Payment Method" },
  "checkout.paymentInstructionsNote": {
    group: "Cart & Checkout",
    value: "Please send your payment screenshot via WhatsApp with your order ID once placed.",
  },
  "checkout.orderSummary": { group: "Cart & Checkout", value: "Order Summary" },
  "checkout.subtotal": { group: "Cart & Checkout", value: "Subtotal" },
  "checkout.shipping": { group: "Cart & Checkout", value: "Shipping" },
  "checkout.total": { group: "Cart & Checkout", value: "Total" },
  "checkout.freeShipping": { group: "Cart & Checkout", value: "Free" },
  "checkout.emailError": { group: "Cart & Checkout", value: "Please enter a valid email address." },
  "checkout.phoneError": {
    group: "Cart & Checkout",
    value: "Please enter a valid Pakistani phone number, e.g. 03XXXXXXXXX.",
  },
  "checkout.genericError": { group: "Cart & Checkout", value: "Something went wrong" },
  "cart.emptyHeading": { group: "Cart & Checkout", value: "Your cart is empty" },
  "cart.continueShopping": { group: "Cart & Checkout", value: "Continue Shopping" },
  "cart.heading": { group: "Cart & Checkout", value: "Your Cart" },
  "cart.shippingNote": { group: "Cart & Checkout", value: "Shipping calculated at checkout." },
  "cart.proceedToCheckout": { group: "Cart & Checkout", value: "Proceed to Checkout" },
  "shop.heading": { group: "Shop & Filters", value: "Shop All" },
  "shop.emptyState": { group: "Shop & Filters", value: "No products match your filters." },
  "collections.emptyState": { group: "Shop & Filters", value: "No products in this collection yet." },
  "filters.searchPlaceholder": { group: "Shop & Filters", value: "Search products…" },
  "filters.filtersButton": { group: "Shop & Filters", value: "Filters" },
  "filters.sizeLabel": { group: "Shop & Filters", value: "Size" },
  "filters.colorLabel": { group: "Shop & Filters", value: "Color" },
  "filters.clearAll": { group: "Shop & Filters", value: "Clear all" },
  "product.saleBadge": { group: "Shop & Filters", value: "Sale" },
  "account.orderHistoryLink": { group: "Account", value: "Order History" },
  "account.savedAddressesLink": { group: "Account", value: "Saved Addresses" },
  "account.signOut": { group: "Account", value: "Sign Out" },
  "account.signInHeading": { group: "Account", value: "Sign In" },
  "account.signInButton": { group: "Account", value: "Sign In" },
  "account.signingIn": { group: "Account", value: "Signing in…" },
  "account.invalidCredentials": { group: "Account", value: "Invalid email or password." },
  "account.noAccountPrompt": { group: "Account", value: "Don't have an account?" },
  "account.createOneLink": { group: "Account", value: "Create one" },
  "account.createAccountHeading": { group: "Account", value: "Create Account" },
  "account.createAccountButton": { group: "Account", value: "Create Account" },
  "account.creatingAccount": { group: "Account", value: "Creating account…" },
  "account.registerGenericError": { group: "Account", value: "Something went wrong" },
  "account.haveAccountPrompt": { group: "Account", value: "Already have an account?" },
  "account.signInLink": { group: "Account", value: "Sign in" },
  "account.orderHistoryHeading": { group: "Account", value: "Order History" },
  "account.noOrdersYet": { group: "Account", value: "You haven't placed any orders yet." },
  "account.startShopping": { group: "Account", value: "Start shopping" },
  "account.savedAddressesHeading": { group: "Account", value: "Saved Addresses" },
  "account.noAddressesYet": { group: "Account", value: "No saved addresses yet." },
  "account.addNewAddressHeading": { group: "Account", value: "Add New Address" },
  "account.saveAddressButton": { group: "Account", value: "Save Address" },
  "account.removeAddressButton": { group: "Account", value: "Remove" },
  "orderStatus.pending": { group: "Account", value: "Pending" },
  "orderStatus.confirmed": { group: "Account", value: "Confirmed" },
  "orderStatus.packed": { group: "Account", value: "Packed" },
  "orderStatus.shipped": { group: "Account", value: "Shipped" },
  "orderStatus.delivered": { group: "Account", value: "Delivered" },
  "orderStatus.cancelled": { group: "Account", value: "Cancelled" },
};

export type SiteTextKey = keyof typeof SITE_TEXT_DEFAULTS;

/** Resolved { key: value } map — DB overrides merged on top of the defaults above. */
export async function getSiteText(): Promise<Record<string, string>> {
  const defaultsOnly = () =>
    Object.fromEntries(Object.entries(SITE_TEXT_DEFAULTS).map(([k, v]) => [k, v.value]));

  const shop = await currentShop();
  if (!shop) return defaultsOnly();

  const rows = await cachedForShop(shop.id, "site-text", (t) => t.siteText.findMany({}));
  const overrides = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const defaults = Object.fromEntries(Object.entries(SITE_TEXT_DEFAULTS).map(([k, v]) => [k, v.value]));
  return { ...defaults, ...overrides };
}

/** Look up one key from an already-resolved map, falling back to its default if somehow absent. */
export function text(map: Record<string, string>, key: SiteTextKey): string {
  return map[key] ?? SITE_TEXT_DEFAULTS[key]?.value ?? key;
}
