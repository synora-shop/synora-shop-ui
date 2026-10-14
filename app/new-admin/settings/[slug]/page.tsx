import { redirect } from "next/navigation";

/** Settings is one open page now; an old section address jumps to its place. */
export default async function SettingsSection({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/new-admin/settings#${slug}`);
}
