"use client";

import { createContext, useContext, useMemo } from "react";
import { formatMoney, symbolFor } from "@/lib/money";
import { STORE_DEFAULTS } from "@/lib/store-defaults";

/**
 * The currency this store trades in, for the components that draw money.
 *
 * A context rather than a prop threaded through every list, because it is one
 * value that never changes while anybody is looking at it, and the alternative
 * was passing `currency` through the product list, the order list, the bin,
 * the cart, the checkout and the discount manager — six components that have
 * nothing else in common.
 *
 * Both layouts provide it: the admin from the shop's settings, the storefront
 * from the same. The default only applies to a component rendered outside
 * either, which in practice means a test.
 */
const CurrencyContext = createContext<string>(STORE_DEFAULTS.currency);

export function CurrencyProvider({
  currency,
  children,
}: {
  currency: string;
  children: React.ReactNode;
}) {
  return <CurrencyContext.Provider value={currency}>{children}</CurrencyContext.Provider>;
}

/** The store's currency code, e.g. "PKR". */
export function useCurrency(): string {
  return useContext(CurrencyContext);
}

/**
 * A formatter bound to this store's currency.
 *
 * `const money = useMoney()` then `money(4500)`, which reads the same at every
 * call site as the hard-coded formatter it replaced.
 */
export function useMoney(): (amount: number) => string {
  const currency = useCurrency();
  return useMemo(() => (amount: number) => formatMoney(amount, currency), [currency]);
}

/** The symbol alone, for a field label or a prefix. */
export function useCurrencySymbol(): string {
  return symbolFor(useCurrency());
}
