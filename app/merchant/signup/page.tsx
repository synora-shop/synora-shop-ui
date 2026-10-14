import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PLATFORM_DOMAIN } from "@/lib/shop-context";
import { SignupForm } from "@/components/merchant/signup-form";
import { FormFooter, FormHeading, FormLink } from "@/components/merchant/form-shell";

export const metadata: Metadata = {
  title: "Create your store",
  // Account pages have nothing to offer a search engine and everything to lose
  // from being indexed under a merchant's name.
  robots: { index: false, follow: false },
};

export default async function SignupPage() {
  // Already signed in: a second account is not what they came for. On to the
  // dashboard (or the console, for a master admin) via /merchant/stores.
  const session = await auth();
  if (session?.user?.id && !session.user.customerId) redirect("/merchant/stores");
  return (
    <>
      <FormHeading
        title="Create your store"
        description="A few details and you'll have somewhere to sell. No card needed to start."
      />
      {/* Read on the server: the domain differs between local, preview and
          production, and inlining process.env in a client bundle would freeze
          whichever value happened to be set at build time. */}
      <SignupForm platformDomain={PLATFORM_DOMAIN} />
      <FormFooter>
        Already have a store? <FormLink href="/merchant/login">Sign in</FormLink>
      </FormFooter>
    </>
  );
}
