"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { currentShopId } from "@/lib/data/shop";

/**
 * A shopper's sign-in, for a theme kit's sign-in page.
 *
 * Run on the server so the shop is the one this request is for — read from
 * the address, as every storefront query is — and never one the browser
 * names. The "customer" provider (auth.ts) holds a shopper to exactly one
 * shop; "credentials" is the merchant's, and signs no shopper in.
 */
export async function kitCustomerSignIn(email: string, password: string): Promise<boolean> {
  try {
    await signIn("customer", { email, password, shopId: await currentShopId(), redirect: false });
    return true;
  } catch (err) {
    if (err instanceof AuthError) return false;
    throw err;
  }
}
