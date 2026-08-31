/** Semantic color coding for order/payment statuses — reused by the orders list and detail
 * page so the same status always reads the same color everywhere. */
export function orderStatusStyle(status: string): string {
  switch (status) {
    case "DELIVERED":
      return "bg-green-bg text-green";
    case "CANCELLED":
      return "bg-rose-bg text-rose";
    case "PENDING":
      return "bg-amber-bg text-amber";
    default:
      // CONFIRMED, PACKED, SHIPPED — in progress, on brand.
      return "bg-brand-100 text-brand-700";
  }
}

/** Solid-color dot to match `orderStatusStyle`'s badge text color — written as literal
 * class names (not derived from the badge classes) so Tailwind's scanner can see them. */
export function orderStatusDotStyle(status: string): string {
  switch (status) {
    case "DELIVERED":
      return "bg-green";
    case "CANCELLED":
      return "bg-rose";
    case "PENDING":
      return "bg-amber";
    default:
      return "bg-brand-600";
  }
}

/**
 * The same status coding, as a <Badge> tone.
 *
 * The class-string helpers above predate the shared Badge, and the orders
 * screens still use them. New surfaces take a tone instead, so a status badge
 * is the same component as every other badge rather than a lookalike.
 */
export function orderStatusTone(status: string): "neutral" | "brand" | "good" | "warn" | "bad" {
  switch (status) {
    case "DELIVERED":
      return "good";
    case "CANCELLED":
      return "bad";
    case "PENDING":
      return "warn";
    default:
      return "brand";
  }
}

/** "AWAITING_VERIFICATION" reads badly in a badge; this is the human form. */
export function statusLabel(status: string): string {
  return status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ");
}

export function paymentStatusStyle(status: string): string {
  switch (status) {
    case "CONFIRMED":
      return "bg-green-bg text-green";
    case "FAILED":
      return "bg-rose-bg text-rose";
    default:
      // PENDING, AWAITING_VERIFICATION
      return "bg-amber-bg text-amber";
  }
}
