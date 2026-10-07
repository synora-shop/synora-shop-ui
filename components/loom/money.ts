/**
 * Money and the free-delivery line — plain values, usable on the server and
 * in the browser alike. (They lived in commerce.tsx, which runs in the
 * browser; a server-drawn page calling them failed outright.)
 */

/** Money, the way the kit prints it: "$125". */
export const money = (n: number) => `$${n.toLocaleString("en-US")}`;

/** Free delivery from $200 — the threshold the cart and checkout both use. */
export const FREE_DELIVERY_FROM = 200;
