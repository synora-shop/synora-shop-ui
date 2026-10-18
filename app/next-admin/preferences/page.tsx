import { redirect } from "next/navigation";

/** Preferences live under Online Store, as on Shopify. */
export default function PreferencesMoved() {
  redirect("/next-admin/online-store/preferences");
}
