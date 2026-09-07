/**
 * When a shop may change what kind of business it is.
 *
 * Switching type changes what the merchant is asked to fill in. A shop wants
 * products, variants, stock and shipping; a restaurant wants a menu, hours and
 * a location. Letting someone switch while their store is open invites them to
 * spend an evening filling in a catalogue for a business the storefront is not
 * currently selling — and customers to browse it while they do.
 *
 * So the store closes its doors first. That is the whole rule: pause, switch,
 * reopen. Pausing is one click and reversible, and nothing is deleted by
 * either step — pages, themes and menus are stored per type, so switching back
 * brings the old storefront back exactly as it was.
 *
 * Client-safe: pure logic over a status, no Prisma, no next/headers.
 */

export type ShopStatusName = "TRIAL" | "ACTIVE" | "PAUSED" | "PAST_DUE" | "SUSPENDED" | "CLOSED";

export type TypeSwitchGate =
  | { allowed: true }
  | {
      allowed: false;
      /** Said to the merchant, in their terms. */
      reason: string;
      /** Whether pausing is the thing that would unblock it. */
      canPause: boolean;
    };

export function typeSwitchGate(status: ShopStatusName): TypeSwitchGate {
  switch (status) {
    case "PAUSED":
      return { allowed: true };
    case "CLOSED":
      return {
        allowed: false,
        reason: "This store is closed. Reopen it before changing what it sells.",
        canPause: false,
      };
    // Ours, not theirs. Pausing out of a suspension would be a way to clear it.
    case "SUSPENDED":
      return {
        allowed: false,
        reason: "This store is suspended. Get in touch and we'll sort it out.",
        canPause: false,
      };
    default:
      return {
        allowed: false,
        reason:
          "Your store is open, so it cannot change type yet. Pause it first — customers see a short notice, nothing is deleted, and you can reopen the moment you are done.",
        canPause: true,
      };
  }
}
