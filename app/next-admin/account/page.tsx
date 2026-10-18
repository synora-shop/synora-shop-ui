import { Page } from "@/components/next-admin/ui";
import { Act } from "@/components/next-admin/act";
import { ACCOUNT } from "@/components/next-admin/settings-body";

export const metadata = { title: "Your account" };

/** The person signed in, apart from the store's settings (third design). */
export default function AccountPage() {
  return (
    <Page title="Your account" sub="Your profile, password and the devices you are signed in on." actions={<Act kind="primary" msg="Your account saved">Save</Act>}>
      <div className="flex max-w-3xl flex-col gap-2.5">{ACCOUNT}</div>
    </Page>
  );
}
