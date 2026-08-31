import { cache } from "react";
import { auth } from "@/auth";
import { db } from "@/lib/data/shop";

// The shopper this request belongs to, if any.
//
// Deliberately separate from the merchant session in lib/auth-guard.ts. They
// are different kinds of principal: a merchant signs in to the platform and may
// act in several shops, while a shopper signs in to *one* shop and exists only
// there. Conflating them is what the User/Customer split undid, and reading
// them through one helper would quietly put it back.

export type CurrentCustomer = {
  id: string;
  name: string;
  email: string;
};

/**
 * The signed-in shopper, or null.
 *
 * Null is the ordinary case: most storefront traffic is not signed in, and
 * every caller has something sensible to render for a guest.
 */
export const currentCustomer = cache(async (): Promise<CurrentCustomer | null> => {
  const session = await auth();
  const customerId = session?.user?.customerId;
  if (!customerId) return null;

  // Read through the scoped client, so a session minted on one shop cannot
  // resolve a customer on another even if the id were tampered with.
  const customer = await (await db()).customer.findFirst({
    where: { id: customerId },
    select: { id: true, name: true, email: true },
  });
  return customer ?? null;
});
