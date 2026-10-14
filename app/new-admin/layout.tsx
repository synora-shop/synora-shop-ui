import type { Metadata } from "next";
import { AdminShell } from "@/components/new-admin/shell";

export const metadata: Metadata = { title: { default: "New admin (preview)", template: "%s · New admin (preview)" }, robots: { index: false, follow: false } };

/**
 * A preview of the redesigned merchant admin (15 October), on sample data.
 * It sits beside the real admin (/admin) and touches nothing of it; when the
 * design is agreed, its pieces move into the real panel one screen at a time.
 */
export default function NewAdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
