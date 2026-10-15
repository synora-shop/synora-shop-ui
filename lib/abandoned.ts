/**
 * Abandoned checkouts, the parts that are not the database (new admin, 15
 * October): how a started checkout is described on the screen and in a
 * reminder. Shared by the page, its action and the checks.
 */
export type DraftLineView = { title: string; qty: number; price: number; productId?: string; variantId?: string };

/** A checkout is abandoned once nothing has happened on it for this long. */
export const QUIET_FOR_MS = 30 * 60 * 1000;

/** How far they got, in the words the screen uses for "Most left at". */
export const STEP_LABEL: Record<string, string> = {
  contact: "Contact details",
  address: "Delivery address",
  delivery: "Delivery charges",
  payment: "Payment",
};

/** "0300 ●●●● 412": enough to recognise, not enough to copy off a screen. */
export function maskPhone(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.length < 7) return phone;
  return `${d.slice(0, 4)} ●●●● ${d.slice(-3)}`;
}

/** A Pakistani number in the form wa.me wants (92…), or null. */
export function whatsappNumber(phone: string): string | null {
  const d = phone.replace(/\D/g, "");
  if (d.length < 10) return null;
  if (d.startsWith("92")) return d;
  if (d.startsWith("0")) return `92${d.slice(1)}`;
  if (d.length === 10) return `92${d}`;
  return d;
}

/** "Zohra 3-piece, Kajal kurta" or "Gulnaar lawn ×2". */
export function cartSummary(lines: DraftLineView[]): string {
  return lines.map((l) => `${l.title}${l.qty > 1 ? ` ×${l.qty}` : ""}`).join(", ");
}

export function reminderText(shopName: string, name: string, lines: DraftLineView[], storeUrl: string): string {
  const hello = name ? `Assalam o Alaikum ${name.split(" ")[0]},` : "Assalam o Alaikum,";
  return `${hello} this is ${shopName}. You were checking out with ${cartSummary(lines) || "a few things"} and stopped. It is all still here if you want it: ${storeUrl}`;
}

/** The two moments the screen counts from: quiet since, and a week ago. */
export function abandonedWindow(now: Date = new Date()) {
  return {
    quietSince: new Date(now.getTime() - QUIET_FOR_MS),
    weekAgo: new Date(now.getTime() - 7 * 86_400_000),
  };
}
