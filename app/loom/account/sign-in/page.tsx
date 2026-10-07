import type { Metadata } from "next";
import { LoomShell } from "@/components/loom/shell";
import { LoomSignIn } from "@/components/loom/account/sign-in";

export const metadata: Metadata = { title: "Sign in — Loom reference build" };

/** Sign in and create an account — the design is on LoomSignIn. */
export default function LoomSignInPage() {
  return (
    <LoomShell>
      <LoomSignIn />
    </LoomShell>
  );
}
