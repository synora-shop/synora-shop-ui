import type { LoomContext } from "@/components/loom/contract";

/**
 * Loom's interface words — "Add to cart", "Subtotal", "Remove" — as Site text.
 *
 * Shopify keeps these out of section settings, in the theme's default content,
 * because the same words appear on many pages and are changed once. This
 * platform has the same thing: lib/site-text.ts, the SiteText table, the Site
 * text screen. Loom uses it: where a key already exists there it is used here
 * by the same name ("product.addToCart", "checkout.subtotal"), so a shop's
 * existing edits carry over; the rest follow the same naming and join it when
 * Loom is ported.
 *
 * These values are Loom's *defaults* — the kit's voice, sentence case. The
 * order the words resolve in is the order the theme's colours do: the
 * platform's default, then the theme's, then the shop's own edit, which wins.
 *
 * `{count}`, `{amount}` and the like are filled by `tx`.
 */
export const LOOM_TEXT = {
  // Product
  "product.addToCart": "Add to cart",
  "product.addedToCart": "Added to cart",
  "product.unavailable": "Not available in that size",
  "product.colourLabel": "Colour",
  "product.sizeLabel": "Size",
  "product.soldOut": "{size}, sold out",
  "product.addToWishlist": "Add to wishlist",
  "product.removeFromWishlist": "Remove from wishlist",
  "product.photographs": "Product photographs",
  "product.quantity": "Quantity",
  "product.oneFewer": "One fewer",
  "product.oneMore": "One more",

  // The three promises, wherever they are shown
  "promise.care": "Packed with care, like a birthday gift",
  "promise.help": "Questions answered, any time you ask",
  "promise.returns": "Free returns within 30 days",

  // Totals
  "checkout.subtotal": "Subtotal",
  "checkout.shipping": "Delivery",
  "checkout.total": "Total",
  "checkout.freeShipping": "Free",
  "checkout.discount": "Discount",
  "checkout.discountCode": "Discount code",
  "checkout.apply": "Apply",
  "checkout.removeDiscount": "Remove",
  "checkout.cityPlaceholder": "Choose your city",
  "checkout.delivery": "Delivery",
  "checkout.stepDelivery": "Delivery",
  "checkout.deliveryNote": "To the address above",
  "checkout.emptyCart": "There is nothing in your cart to check out.",
  "checkout.shippingLater": "Worked out at checkout",

  // Cart
  "cart.heading": "Your cart",
  "cart.itemCount": "{count} items",
  "cart.itemCountOne": "1 item",
  "cart.remove": "Remove",
  "cart.emptyHeading": "Your cart is empty — for now.",
  "cart.continueShopping": "Continue shopping",
  "cart.proceedToCheckout": "Checkout",
  "cart.freeDeliveryNote": "{amount} more and delivery is free.",
  "cart.orderSummary": "Order summary",

  // Collection and filters
  "collections.count": "{count} products",
  "collections.countOne": "1 product",
  "collections.emptyState": "Nothing matches all of that.",
  "collections.showing": "Showing {shown} of {total}",
  "collections.showMore": "Show more",
  "filters.heading": "Filter",
  "filters.filtersButton": "Filter",
  "filters.colorLabel": "Colour",
  "filters.sizeLabel": "Size",
  "filters.priceLabel": "Price",
  "filters.clearAll": "Clear all",
  "filters.clear": "Clear",
  "filters.clearFilters": "Clear filters",
  "filters.showResults": "Show {count} products",
  "filters.showResultsOne": "Show 1 product",
  "filters.close": "Close filters",
  "filters.sortBy": "Sort by",
  "sort.featured": "Featured",
  "sort.newest": "Newest",
  "sort.priceLow": "Lowest price",
  "sort.priceHigh": "Highest price",

  // Checkout
  "checkout.heading": "Checkout",
  "checkout.backToCart": "Back to cart",
  "checkout.stepContact": "Contact",
  "checkout.stepAddress": "Where it goes",
  "checkout.stepSpeed": "How fast",
  "checkout.stepPayment": "How to pay",
  "checkout.email": "Email",
  "checkout.firstName": "First name",
  "checkout.lastName": "Last name",
  "checkout.address": "Address",
  "checkout.city": "City",
  "checkout.postcode": "Postcode",
  "checkout.phone": "Phone",
  "checkout.emailError": "An email address we can send the receipt to.",
  "checkout.firstNameError": "Your first name.",
  "checkout.lastNameError": "Your last name.",
  "checkout.addressError": "The street and number.",
  "checkout.cityError": "The town or city.",
  "checkout.postcodeError": "The postcode.",
  "checkout.phoneError": "A number the courier can ring.",
  "checkout.standard": "Standard",
  "checkout.standardNote": "Three to five working days",
  "checkout.express": "Express",
  "checkout.expressNote": "One to two working days",
  "checkout.card": "Card",
  "checkout.cardNote": "You will pay on the card provider's own secure page",
  "checkout.cod": "Cash on delivery",
  "checkout.codNote": "Pay the courier when it arrives",
  "checkout.continueToPayment": "Continue to payment · {amount}",
  "checkout.placeOrder": "Place order · {amount}",
  "checkout.nothingCharged": "Nothing is charged until you confirm.",
  "checkout.nothingChargedCard": "Nothing is charged until you confirm on the payment page.",
  "checkout.orderSummary": "Your order",
  "checkout.orderNumber": "Order {id}",
  "checkout.thanks": "Thank you, {name}.",
  "checkout.thanksText": "We have your order and a receipt is on its way to {email}. We will write again when it leaves us — {when}.",
  "checkout.whenStandard": "usually within three to five working days",
  "checkout.whenExpress": "express, so in a day or two",

  // Account
  "account.eyebrow": "Your account",
  "account.orders": "Orders",
  "account.addresses": "Addresses",
  "account.details": "Details",
  "account.signOut": "Sign out",
  "account.order": "Order {id}",
  "account.view": "View",
  "account.main": "Main",
  "account.edit": "Edit",
  "account.makeMain": "Make main",
  "account.removeAddressButton": "Remove",
  "account.addAddress": "Add an address",
  "account.noOrders": "No orders yet. When you order, it will be here.",
  "account.noAddresses": "No addresses saved yet.",
  "account.addressLabel": "Call it",
  "account.addressLabelHint": "Home",
  "account.saveAddress": "Save address",
  "account.cancel": "Cancel",
  "account.detailsNote": "To change these, get in touch with us.",
  "account.saveDetails": "Save changes",
  "account.saved": "Saved.",
  "orderStatus.ordered": "Ordered",
  "orderStatus.packed": "Packed",
  "orderStatus.shipped": "On its way",
  "orderStatus.delivered": "Delivered",
  "orderStatus.cancelled": "Cancelled",
  "order.eyebrow": "Order {id} · {date}",
  "order.arriving": "Arriving {date}, {speed}.",
  "order.arrivingOn": "Arriving {date}.",
  "order.deliveredOn": "Delivered {date}.",
  "order.cancelledText": "This order was cancelled. If you were charged, it will come back to you.",
  "order.thanks": "Thank you, {name}!",
  "order.thanksText": "Your order is in. We have sent the details to your email — keep it to come back to this page.",
  "order.lookupHeading": "Find your order",
  "order.lookupText": "To see order {id}, give the email or phone number it was placed with.",
  "order.lookupNumber": "Order number",
  "order.lookupContact": "Email or phone",
  "order.lookupButton": "Show my order",
  "order.lookupError": "No order matches that number and email or phone.",
  "order.expected": "Expected {date}",

  // Sign in
  "account.signInHeading": "Sign in",
  "account.signInText": "New here or back again, it is the same: we email you a code. No password to remember.",
  "account.email": "Email",
  "account.sendCode": "Email me a code",
  "account.codeSent": "We sent a 6-digit code to {email}. It works for 10 minutes.",
  "account.code": "Code",
  "account.signInButton": "Sign in",
  "account.differentEmail": "Use a different email",
  "account.sendAgain": "Send a new code",
  "account.codeResent": "A code is on its way",
  "account.emailError": "That does not look like an email address.",
  "account.codeError": "Enter the 6-digit code from the email.",
} as const;

export type LoomTextKey = keyof typeof LOOM_TEXT;

/**
 * One interface word, from the shop's Site text if it has its own, else
 * Loom's default; `{tokens}` filled from `vars`.
 */
export function tx(ctx: Pick<LoomContext, "text">, key: LoomTextKey, vars: Record<string, string | number> = {}) {
  const raw = ctx.text?.[key] ?? LOOM_TEXT[key];
  return raw.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}
