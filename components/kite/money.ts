import { formatMoney } from "@/lib/money";

/**
 * A price as Kite writes it: the shop's currency on a real shop, the file's
 * own "$875" in the reference build, which has no shop and no currency.
 */
export const kiteMoney = (n: number, currency?: string) => (currency ? formatMoney(n, currency) : `$${n.toLocaleString("en-US")}`);
