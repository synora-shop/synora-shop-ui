import type { Metadata } from "next";
import { Shell } from "@/components/next-admin/shell";

export const metadata: Metadata = { title: { default: "Admin, third design (preview)", template: "%s · Admin preview" }, robots: { index: false, follow: false } };

/**
 * The third design of the merchant admin (18 October), on the preview's
 * sample data. /new-admin stays as it was; this sits beside it so the two
 * can be compared. Production sends it to /admin (next.config.ts).
 */
export default function NextAdminLayout({ children }: { children: React.ReactNode }) {
  return <Shell>{children}</Shell>;
}
