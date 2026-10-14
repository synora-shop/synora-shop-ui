import type { ReactNode } from "react";
import { SettingsNav } from "@/components/new-admin/settings-nav";

export const metadata = { title: "Settings" };

/**
 * Settings fills the screen and does not scroll as a page (preview): the
 * list stays put on the left, and only the chosen section scrolls, if it is
 * long enough to need to.
 */
export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-5 lg:-my-3 lg:h-[calc(100dvh-7.75rem)] lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8">
      <div className="flex min-h-0 flex-col lg:py-3">
        <SettingsNav />
      </div>
      <div className="min-h-0 lg:-mr-4 lg:overflow-y-auto lg:py-3 lg:pr-4 [scrollbar-width:thin]">
        <div className="max-w-3xl">{children}</div>
      </div>
    </div>
  );
}
