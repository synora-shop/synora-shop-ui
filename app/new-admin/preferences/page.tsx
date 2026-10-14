import { redirect } from "next/navigation";

/** Preferences moved under Online Store, as on Shopify. */
export default function PreferencesMoved() {
  redirect("/new-admin/online-store/preferences");
}
