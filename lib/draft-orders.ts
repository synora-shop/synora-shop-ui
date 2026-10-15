/**
 * Orders made by hand (new admin, 15 October): what a draft holds, what it
 * adds up to, and the summary the customer is sent to confirm. Pure, so the
 * editor, the list and the server all count the same way.
 */

export const DRAFT_CHANNELS = ["WhatsApp", "Phone", "Instagram", "Facebook", "In person", "Other"] as const;

/** The ways a hand order can be paid. A card gateway needs the customer at a checkout, so it is not one. */
export const DRAFT_PAYMENTS = ["COD", "BANK_TRANSFER", "JAZZCASH", "EASYPAISA"] as const;

export type DraftStatus = "OPEN" | "SENT" | "COMPLETED";

/** One line as stored: which size, how many, at what price each. */
export type DraftLine = { variantId: string; quantity: number; price: number };

/** One size the editor can add, as the catalogue gives it. */
export type CatalogueItem = {
  variantId: string;
  productId: string;
  title: string;
  /** "M · Black", or "" for a product with one size. */
  option: string;
  sku: string;
  price: number;
  /** Null when stock is not counted. */
  stock: number | null;
  image: string | null;
};

/** Lines read back from the database, keeping only what makes sense. */
export function readDraftLines(raw: unknown): DraftLine[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((l) => l as Partial<DraftLine>)
    .filter((l) => typeof l.variantId === "string" && Number.isInteger(l.quantity) && (l.quantity as number) > 0 && Number.isInteger(l.price) && (l.price as number) >= 0)
    .map((l) => ({ variantId: l.variantId!, quantity: Math.min(l.quantity!, 999), price: l.price! }))
    .slice(0, 100);
}

export function draftTotals(d: { lines: DraftLine[]; shippingFee: number; discountAmount: number }) {
  const subtotal = d.lines.reduce((n, l) => n + l.price * l.quantity, 0);
  const discount = Math.min(Math.max(0, d.discountAmount), subtotal);
  const shipping = Math.max(0, d.shippingFee);
  return { subtotal, discount, shipping, total: subtotal - discount + shipping };
}

/** "D14", as the list and the messages write a draft. */
export const draftLabel = (n: number) => `D${n}`;

/**
 * The message the customer gets to confirm: what they are buying, what it
 * comes to, where it is going, and how they pay. Written for WhatsApp, read
 * just as well in an email.
 */
export function draftSummary(o: {
  shopName: string;
  name: string;
  items: { title: string; option: string; quantity: number; price: number }[];
  totals: ReturnType<typeof draftTotals>;
  address: string;
  payment: string;
  money: (n: number) => string;
}): string {
  const first = o.name.trim().split(/\s+/)[0];
  const lines = o.items.map((i) => `• ${i.title}${i.option ? ` (${i.option})` : ""} × ${i.quantity}: ${o.money(i.price * i.quantity)}`);
  return [
    `${first ? `Assalam o Alaikum ${first}, h` : "H"}ere is your order from ${o.shopName}:`,
    "",
    ...lines,
    "",
    o.totals.discount > 0 ? `Discount: -${o.money(o.totals.discount)}` : null,
    `Delivery: ${o.totals.shipping === 0 ? "Free" : o.money(o.totals.shipping)}`,
    `Total: ${o.money(o.totals.total)}`,
    "",
    o.address ? `Delivering to: ${o.address}` : null,
    `Payment: ${o.payment}`,
    "",
    "Please reply to confirm and we will send it on its way.",
  ]
    .filter((l) => l !== null)
    .join("\n");
}
