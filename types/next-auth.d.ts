import type { DefaultSession } from "next-auth";
import type { ShopMembership } from "@/auth";

// A signed-in person is a merchant or staff member, not a shopper — shoppers
// are Customer rows scoped to one shop and never touch this session. What they
// may do is per-shop, so the session carries memberships rather than a single
// global role.

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      /** Shops this person may administer. Empty for a shopper. */
      shops: ShopMembership[];
      /** Set only for a shopper session. */
      customerId?: string;
      customerShopId?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    /** sessionsValidFrom at the moment this session was minted. */
    issuedFor?: number;
    customerId?: string;
    customerShopId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    shops: ShopMembership[];
    customerId?: string;
    customerShopId?: string;
    issuedFor?: number;
    /** When the session was last checked against the database. */
    revalidatedAt?: number;
  }
}
