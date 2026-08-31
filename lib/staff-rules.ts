import { ROLE_RANK, type MemberRole } from "@/lib/roles";

/**
 * Who may do what to whom, as pure decisions.
 *
 * These used to live inline in the staff actions, which meant the only way to
 * exercise them was to stand up a database, three accounts and a session. So
 * they were checked by grepping the source for their error strings — which
 * proves the words exist, not that the rule holds. Here they are ordinary
 * functions over plain values, and every combination can be tried.
 *
 * Two rules run through all of it and neither is negotiable:
 *
 *   A shop always has exactly one owner. Removing the last one, or demoting
 *   them, would leave a store nobody can administer and no way to fix it
 *   without support intervention.
 *
 *   Nobody can grant access above their own. An admin who could appoint an
 *   owner has, in effect, already made themselves one.
 *
 * Each returns null to allow, or the sentence to show the person. The actions
 * remain responsible for authentication and for the writes; this decides only
 * whether the write is permitted.
 */

/** Whoever is asking. */
export type Actor = { userId: string; role: MemberRole };

/** Whoever it is being done to. Only what the rule actually consults. */
export type Target = { userId: string; role: MemberRole };

/**
 * Handing a shop over asks more of the recipient than any other change, so it
 * needs more than their rank: whether they ever joined, and whether anyone has
 * proved that address is theirs.
 */
export type OwnershipTarget = Target & {
  joined: boolean;
  emailVerified: boolean;
  email: string;
};

/** Can `actor` hand out `role` at all? */
export function canGrant(actor: Actor, role: MemberRole): string | null {
  if (role === "OWNER") {
    return "A shop has one owner. Use “transfer ownership” instead of naming a second.";
  }
  // An owner may grant anything below owner. Everyone else is capped strictly
  // below their own level, so an admin cannot mint another admin.
  if (actor.role !== "OWNER" && ROLE_RANK[role] >= ROLE_RANK[actor.role]) {
    return "You can only give someone less access than you have yourself.";
  }
  return null;
}

export function canChangeRole(actor: Actor, target: Target, role: MemberRole): string | null {
  if (target.role === "OWNER") {
    return "Transfer ownership instead of changing the owner's role.";
  }
  if (target.userId === actor.userId) {
    // Otherwise the last admin can quietly demote themselves and lock the
    // shop's own staff page against everyone but the owner.
    return "You can't change your own access.";
  }
  // Acting on a peer is the same problem as promoting one: an admin who can
  // demote another admin can clear the room.
  if (actor.role !== "OWNER" && ROLE_RANK[target.role] >= ROLE_RANK[actor.role]) {
    return "You can't change the access of someone at your own level.";
  }
  return canGrant(actor, role);
}

export function canRemove(actor: Actor, target: Target): string | null {
  if (target.role === "OWNER") {
    return "The owner can't be removed. Transfer ownership first.";
  }
  if (target.userId === actor.userId) {
    return "You can't remove yourself. Ask another admin, or transfer ownership first.";
  }
  if (actor.role !== "OWNER" && ROLE_RANK[target.role] >= ROLE_RANK[actor.role]) {
    return "You can't remove someone with access equal to your own.";
  }
  return null;
}

export function canTransferOwnership(actor: Actor, target: OwnershipTarget): string | null {
  if (actor.role !== "OWNER") return "Only the owner can hand a shop over.";
  if (target.userId === actor.userId) return "You already own this shop.";
  if (!target.joined) return "They haven't accepted their invitation yet.";
  // Handing a store to an address nobody has proved they control is how a typo
  // becomes an unrecoverable loss.
  if (!target.emailVerified) {
    return `${target.email} hasn't confirmed their email address yet.`;
  }
  return null;
}

/**
 * Whether the signed-in account may accept this invitation.
 *
 * The invitation is to an address, not to whoever ends up holding the link.
 * Without this check a forwarded email lets anyone into the shop.
 */
export function canAcceptInvite(
  signedInAs: string | null | undefined,
  invitedEmail: string
): string | null {
  if (!signedInAs) {
    return "Sign in (or create an account) with the invited address first.";
  }
  if (signedInAs.trim().toLowerCase() !== invitedEmail.trim().toLowerCase()) {
    return `That invitation was sent to ${invitedEmail}. Sign in with that address to accept it.`;
  }
  return null;
}
