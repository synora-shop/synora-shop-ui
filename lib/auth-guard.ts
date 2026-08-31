import { auth } from "@/auth";
import { currentShop, type CurrentShop } from "@/lib/data/shop";
import { ROLE_RANK, roleAtLeast, type MemberRole } from "@/lib/roles";

// "May this person do this, here?"
//
// The old question was `session.user.role === "ADMIN"`, which asked whether
// someone was an admin *anywhere*. On a platform with more than one shop that
// is not a meaningful question: being the owner of your own store must not let
// you touch somebody else's. Every check now names the shop it is about.

// The ranking itself lives in lib/roles.ts, which has no imports, so client
// components can share it without pulling the database in behind it.
export type { MemberRole };
export { roleAtLeast };

export class NotAuthorised extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotAuthorised";
  }
}

export type ShopSession = {
  shop: CurrentShop;
  userId: string;
  email: string;
  role: MemberRole;
};

/**
 * The signed-in user's standing in the shop this request is for.
 *
 * Returns null rather than throwing, for callers that want to render something
 * different instead of failing — a "you don't have access" page reads better
 * than an error boundary.
 */
export async function shopSession(): Promise<ShopSession | null> {
  // currentShop, not requireShop: this function promises to return null rather
  // than throw, and requireShop calls notFound(). While it used the latter, a
  // signed-in merchant on the platform's own host who had not yet chosen a store
  // got a 404 from /admin instead of being sent to choose one.
  const [session, shop] = await Promise.all([auth(), currentShop()]);
  const userId = session?.user?.id;
  if (!userId || !shop) return null;

  const membership = session.user.shops?.find((s) => s.shopId === shop.id);
  if (!membership) return null;

  return {
    shop,
    userId,
    email: session.user.email ?? "",
    role: membership.role,
  };
}

/**
 * Demands at least `min` in the current shop, or throws.
 *
 * The default is STAFF because most actions are day-to-day work. Settings and
 * staff management should ask for ADMIN; billing and deletion for OWNER.
 */
export async function requireRole(min: MemberRole = "STAFF"): Promise<ShopSession> {
  const s = await shopSession();
  if (!s) {
    throw new NotAuthorised("Sign in to the shop you're trying to change.");
  }
  if (ROLE_RANK[s.role] < ROLE_RANK[min]) {
    throw new NotAuthorised(
      `This needs ${min.toLowerCase()} access. You have ${s.role.toLowerCase()} access to ${s.shop.name}.`
    );
  }
  return s;
}
