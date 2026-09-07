"use server";

import { requireRole } from "@/lib/auth-guard";
import { switchBusinessType } from "@/app/admin/business-type-actions";
import { isBusinessType } from "@/lib/themes/business-type";

/**
 * Changes what kind of business this shop is.
 *
 * Nothing is deleted and nothing is migrated. The rows that describe a
 * storefront are partitioned by business type, so the previous one is not
 * overwritten, it simply stops being the one on screen. Switching back brings
 * it all straight back: the same pages, the same design, the same colours.
 *
 * Products, posts, orders and customers are shared rather than partitioned, so
 * a shop that switches keeps its catalogue either way.
 */
export async function changeBusinessType(value: string) {
  await requireRole("ADMIN");
  if (!isBusinessType(value)) return;

  // The same door as the top bar's, so the rule that the store must be paused
  // first cannot be true in one place and false in the other. Two actions that
  // both write businessType is two rules waiting to disagree.
  await switchBusinessType(value);
}
