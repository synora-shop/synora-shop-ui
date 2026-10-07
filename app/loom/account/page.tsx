import type { Metadata } from "next";
import { LoomShell } from "@/components/loom/shell";
import { LoomBreadcrumb } from "@/components/loom/breadcrumb";
import { LoomAccount } from "@/components/loom/account/account";

export const metadata: Metadata = { title: "Your account — Loom reference build" };

/** The account, signed in — the design is on LoomAccount. */
export default function LoomAccountPage() {
  return (
    <LoomShell>
      <LoomBreadcrumb trail={[{ label: "Home", href: "/loom" }]} current="Account" />
      <LoomAccount />
    </LoomShell>
  );
}
