import type { LoomContext, LoomCustomer, LoomOrder } from "@/components/loom/contract";
import type { LoomProductPage } from "@/components/loom/sections/product";
import { DEMO_MENUS } from "@/components/loom/demo-menus";
import { DEMO_LINES } from "@/components/loom/cart/lines";
import { SHOES } from "@/components/loom/catalogue";

/**
 * The demo shop's data — what the platform hands every page when Loom is
 * ported (its menus, products, the customer, the cart). Sections only ever
 * read it from the context; nothing here is reached for directly.
 */

const HIGH_TOP = "/loom/7150a0e902536ab1a554d315fc11f4ef6f9c1302.png";

export const DEMO_PRODUCT: LoomProductPage = {
  id: "skate-hi",
  eyebrow: "Shoes",
  title: "Skateboard Shoe",
  price: "$125",
  description:
    "A high-top made for the board and worn everywhere else. Full-grain leather that softens with every wear, a padded collar that holds the ankle, and a rubber sole that grips without getting in the way.",
  colours: [
    { label: "Red Pastel", color: "#e25f5f" },
    { label: "Clean White", color: "#ffffff" },
    { label: "Navy Blue", color: "#233c6b" },
  ],
  sizes: [{ label: "US 7" }, { label: "US 8" }, { label: "US 9" }, { label: "US 10" }, { label: "US 11" }, { label: "US 12", soldOut: true }],
  slug: "skateboard-shoe",
  amount: 125,
  // The demo's variants: three colours in six sizes, the twelve sold out.
  variants: ["Red Pastel", "Clean White", "Navy Blue"].flatMap((color) =>
    ["US 7", "US 8", "US 9", "US 10", "US 11", "US 12"].map((size) => ({
      id: `demo-${color}-${size}`.toLowerCase().replace(/\s+/g, "-"),
      color,
      size,
      stock: size === "US 12" ? 0 : 5,
    }))
  ),
  // The product's own details. Delivery and returns are the same on every
  // product, so they are the product section's setting, not the product's.
  details: [
    {
      title: "Details",
      body: "Full-grain leather upper. Padded collar and tongue. Vulcanised rubber sole. Flat cotton laces, with a spare pair in the box.",
    },
  ],
  // The kit has one photograph per product, so the views are crops of it.
  photos: [
    { src: HIGH_TOP, at: "42% 50%", zoom: 1, alt: "Skateboard Shoe, both shoes" },
    { src: HIGH_TOP, at: "22% 72%", zoom: 1.9, alt: "The sole" },
    { src: HIGH_TOP, at: "50% 33%", zoom: 2.2, alt: "The collar and wing logo" },
    { src: HIGH_TOP, at: "78% 74%", zoom: 2.1, alt: "The toe" },
  ],
};

export const DEMO_COLLECTION = {
  title: "Shoes",
  description: "Everyday pairs and the ones you save for the weekend — from the board to the court.",
};

export const DEMO_ORDER: LoomOrder = {
  id: "LM-12476",
  placed: "4 October 2026",
  stage: 2,
  dates: ["4 October", "5 October", "6 October", "9 October"],
  arriving: "Thursday 9 October",
  lines: [
    { id: "skate-hi", title: "Skateboard Shoe", src: "/loom/7150a0e902536ab1a554d315fc11f4ef6f9c1302.png", colour: "Red Pastel", size: "US 9", qty: 1, price: 125, href: "/loom/product" },
    { id: "sport", title: "Sportwear Shoe", src: "/loom/f8ae4065476b2a224ae85cd40fd6b1c7d34bc9ae.png", colour: "Clean White", size: "US 10", qty: 1, price: 159, href: "#" },
  ],
  delivery: 0,
  speed: "Standard delivery",
  address: ["Samantha William", "12 Court Lane", "Lahore 54000", "0300 1234567"],
  payment: "Card, paid 4 October",
  tracking: "LMX 2049 8812",
};

export const DEMO_CUSTOMER: LoomCustomer = {
  firstName: "Samantha",
  lastName: "William",
  email: "sam@example.com",
  phone: "0300 1234567",
  orders: [
    {
      id: "LM-12476",
      date: "4 October 2026",
      state: "shipped",
      total: 284,
      href: "/loom/account/order",
      items: [
        { title: "Skateboard Shoe", src: "/loom/7150a0e902536ab1a554d315fc11f4ef6f9c1302.png" },
        { title: "Sportwear Shoe", src: "/loom/f8ae4065476b2a224ae85cd40fd6b1c7d34bc9ae.png" },
      ],
    },
    {
      id: "LM-11902",
      date: "12 September 2026",
      state: "delivered",
      total: 225,
      href: "#",
      items: [{ title: "Casual Shoe", src: "/loom/5a88e5962507976b1988e6d9a08599fcba5247bd.png" }],
    },
    {
      id: "LM-10317",
      date: "28 July 2026",
      state: "delivered",
      total: 250,
      href: "#",
      items: [
        { title: "Basket Shoe", src: "/loom/6202a986df950869c406241f2f48f416d0807241.png" },
        { title: "Skateboard Shoe", src: "/loom/0b42775b5c482fd10ff96fad137ae5ca5aa7a561.png" },
      ],
    },
  ],
  addresses: [
    { id: "home", label: "Home", lines: ["Samantha William", "12 Court Lane", "Lahore 54000", "0300 1234567"], main: true },
    { id: "work", label: "Work", lines: ["Samantha William", "4th Floor, 88 Mall Road", "Lahore 54000"], main: false },
  ],
};

/** Where the reference build serves each of the shop's pages. */
export const DEMO_ROUTES: LoomContext["routes"] = {
  home: "/loom",
  collection: "/loom/collection",
  search: "/loom/search",
  cart: "/loom/cart",
  checkout: "/loom/checkout",
  account: "/loom/account",
  signIn: "/loom/account/sign-in",
  wishlist: "/loom/wishlist",
};

/** Everything a demo page hands its sections. */
export function demoContext(extra: Partial<LoomContext> = {}): LoomContext {
  return {
    menus: DEMO_MENUS,
    routes: DEMO_ROUTES,
    // The kit draws the Casual Shoe hearted.
    wishlist: [{ id: "casual", title: "Casual Shoe", price: 225, src: "/loom/5a88e5962507976b1988e6d9a08599fcba5247bd.png", href: "#" }],
    products: SHOES,
    product: DEMO_PRODUCT,
    collection: DEMO_COLLECTION,
    order: DEMO_ORDER,
    customer: DEMO_CUSTOMER,
    cart: DEMO_LINES,
    ...extra,
  };
}
