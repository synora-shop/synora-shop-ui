import type { SectionSchema, SettingField } from "@/lib/section-schema";

/**
 * Settings for the main section of the product, collection, cart, checkout
 * and account pages — Shopify's "main product", "main collection" and so on.
 *
 * What each says comes from three places, and only one is here: the product,
 * collection or customer says its own facts; the shared interface words
 * ("Add to cart", "Subtotal") are Site text (components/loom/text.ts); and
 * these settings decide what this section shows and the words that belong to
 * this section alone.
 */
const flag = (key: string, label: string, info: string, def = true): SettingField => ({ key, kind: "checkbox", label, info, default: def });

export const productSchema: SectionSchema = {
  type: "LOOM_PRODUCT",
  label: "Product",
  description: "The product's photographs, and its name, price, options and Add to cart.",
  category: "Commerce",
  singleton: true,
  fields: [
    flag("showEyebrow", "Show the category above the name", "The small capitals over the product's name."),
    flag("showThumbnails", "Show thumbnails", "The four small photographs under the large one, on desktop. On the phone the photographs are always a row to swipe."),
    flag("showPromises", "Show the promises", "The three one-line promises under Add to cart. Their words are in Site text."),
    { key: "shippingHeading", kind: "text", label: "Delivery heading", info: "A fold-out row under the product's own details, the same on every product. Leave empty to show none.", default: "Shipping & Returns" },
    { key: "shippingText", kind: "textarea", label: "Delivery text", info: "What opens under that heading.", default: "Ships in one to two working days, wrapped the way we would want to receive it. Not the right fit? Send it back within 30 days and we refund it in full." },
  ],
};

export const collectionSchema: SectionSchema = {
  type: "LOOM_COLLECTION",
  label: "Collection",
  description: "A collection's products, its category menu, filters and sort.",
  category: "Commerce",
  singleton: true,
  fields: [
    flag("showDescription", "Show the description", "The collection's own line of copy beside its name."),
    { key: "categoriesMenu", kind: "menu", label: "Category menu", info: "Any menu built under Menus — each link is a chip above the products. Choose none to show no chips.", default: "trending-chips" },
    { key: "activeCategory", kind: "text", label: "Chip shown as chosen", info: "The name of the chip drawn filled — usually this collection's.", default: "Shoes" },
    flag("showFilters", "Show filters", "Colour, size and price — a column beside the products, a sheet on the phone."),
  ],
};

export const cartSchema: SectionSchema = {
  type: "LOOM_CART",
  label: "Cart",
  description: "The lines in the cart, and the summary with Checkout.",
  category: "Commerce",
  singleton: true,
  fields: [
    flag("showFreeDeliveryNote", "Say how far off free delivery is", "“$16 more and delivery is free.” Only while the cart is under the free-delivery amount."),
    flag("showPromises", "Show the promises", "The three one-line promises under Checkout."),
  ],
};

export const checkoutSchema: SectionSchema = {
  type: "LOOM_CHECKOUT",
  label: "Checkout",
  description: "Contact, address, delivery and payment, beside the order.",
  category: "Commerce",
  singleton: true,
  fields: [flag("showPromises", "Show the promises", "The three one-line promises under the order's total.")],
};

export const accountSchema: SectionSchema = {
  type: "LOOM_ACCOUNT",
  label: "Account",
  description: "A signed-in customer's orders, addresses and details.",
  category: "Commerce",
  singleton: true,
  fields: [{ key: "greeting", kind: "text", label: "Greeting", info: "The heading. Use {name} for the customer's first name.", default: "Hello, {name}" }],
};

export const signInSchema: SectionSchema = {
  type: "LOOM_SIGN_IN",
  label: "Sign in",
  description: "Sign in, and create an account. Its words are in Site text.",
  category: "Commerce",
  singleton: true,
  fields: [],
};
