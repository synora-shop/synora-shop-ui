/**
 * Money and the free-delivery line — plain values, usable on the server and
 * in the browser alike. (They lived in commerce.tsx, which runs in the
 * browser; a server-drawn page calling them failed outright.)
 */

import { formatMoney } from "@/lib/money";

/**
 * Money in the shop's own currency, by the platform's own formatter — "Rs
 * 5,500" — once the platform has said which currency that is. The reference
 * build has no shop, so it prints the kit's "$125".
 */
export const money = (n: number, currency?: string) => (currency ? formatMoney(n, currency) : `$${n.toLocaleString("en-US")}`);

/** Free delivery from $200 — the threshold the cart and checkout both use. */
export const FREE_DELIVERY_FROM = 200;
