import { timingSafeEqual } from "node:crypto";

/**
 * Who may see an order's page, and how much of it — Shopify's order status
 * page, lighter (decided 8 October; see docs/QUEUE.md).
 *
 *   full    the signed-in customer who placed it: everything.
 *   link    whoever holds the order's link, with its secret key: the order,
 *           read-only, with the address cut to city and postcode and the phone
 *           and email left out — a link gets forwarded.
 *   none    anyone else, however they came by the short id: they are asked
 *           for the order's email or phone (lookUpOrder, rate-limited), and a
 *           match sends them to the link.
 *
 * The short id is for reading out over WhatsApp. It opens nothing by itself:
 * five characters is a number someone can count through.
 */
export type OrderAccess = "full" | "link" | "none";

/** Compare without telling, by how long it took, how much of a guess was right. */
export function keyMatches(given: unknown, actual: string): boolean {
  if (typeof given !== "string" || given.length !== actual.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(actual));
}

export function orderAccess(
  order: { customerId: string | null; accessKey: string },
  given: { key: unknown; customerId: string | null }
): OrderAccess {
  if (given.customerId && order.customerId === given.customerId) return "full";
  if (keyMatches(given.key, order.accessKey)) return "link";
  return "none";
}

/** An order's page, with its key. `base` is the storefront's prefix ("" on a real shop). */
export function orderLink(base: string, id: string, accessKey: string, extra = ""): string {
  return `${base}/order-confirmation/${id}?key=${accessKey}${extra}`;
}

/** Whether an email or phone someone typed is the one on the order. Phones compare by their last ten digits. */
export function contactMatches(typed: string, order: { customerEmail: string; customerPhone: string }): boolean {
  const t = typed.trim().toLowerCase();
  if (!t) return false;
  if (t.includes("@")) return t === order.customerEmail.trim().toLowerCase();
  const digits = (s: string) => s.replace(/\D/g, "").slice(-10);
  return digits(t).length === 10 && digits(t) === digits(order.customerPhone);
}
