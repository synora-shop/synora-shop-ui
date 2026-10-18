import { redirect } from "next/navigation";

/** Settings opens on its first section. */
export default function SettingsPage() {
  redirect("/next-admin/settings/general");
}
