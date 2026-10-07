import type { CartLine } from "@/components/loom/cart/cart";

/** The demo cart: two lines, so every part of the cart and checkout has something to show. */
export const DEMO_LINES: CartLine[] = [
  { id: "skate-hi", title: "Skateboard Shoe", price: 125, src: "/loom/7150a0e902536ab1a554d315fc11f4ef6f9c1302.png", colour: "Red Pastel", size: "US 9", qty: 1, href: "/loom/product" },
  { id: "sport", title: "Sportwear Shoe", price: 159, src: "/loom/f8ae4065476b2a224ae85cd40fd6b1c7d34bc9ae.png", colour: "Clean White", size: "US 10", qty: 1, href: "#" },
];
