/**
 * What the access levels are, and what they mean.
 *
 * Deliberately free of imports — no prisma, no auth, nothing that reaches a
 * database. Both the server guards and the client components that render role
 * pickers need this vocabulary, and a client component that imports it must not
 * end up with a Postgres driver in its bundle.
 *
 * It is also the one place the ranking is written down. It used to be declared
 * separately in lib/auth-guard.ts and in the staff actions, which is two copies
 * of the rule that decides who may do what to whom.
 */

export type MemberRole = "OWNER" | "ADMIN" | "STAFF" | "VIEWER";

/**
 * Ranked so a check can ask for a minimum rather than enumerate roles.
 *
 * A higher number can do everything a lower one can. Owner is separated from
 * admin only by billing and ownership transfer, which is exactly the boundary a
 * merchant expects when they add a business partner.
 */
export const ROLE_RANK: Record<MemberRole, number> = {
  VIEWER: 0,
  STAFF: 1,
  ADMIN: 2,
  OWNER: 3,
};

/** Whether a role clears a bar. */
export function roleAtLeast(role: MemberRole, min: MemberRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[min];
}

/** Roles that can be handed out directly. Ownership moves by transfer only. */
export const ASSIGNABLE_ROLES: readonly MemberRole[] = ["ADMIN", "STAFF", "VIEWER"];

/** What each level actually lets someone do, in a sentence. */
export const ROLE_DESCRIPTION: Record<MemberRole, string> = {
  OWNER: "Full access, including billing and closing the store.",
  ADMIN: "Everything except billing and ownership.",
  STAFF: "Day-to-day work: products, orders, customers.",
  VIEWER: "Can look, but not change anything.",
};

/** "ADMIN" as a person would write it. */
export function roleLabel(role: MemberRole): string {
  return role.charAt(0) + role.slice(1).toLowerCase();
}
