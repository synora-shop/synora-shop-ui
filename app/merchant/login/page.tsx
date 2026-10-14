import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Metadata } from "next";
import { MerchantLoginForm } from "@/components/merchant/login-form";
import { FormFooter, FormHeading, FormLink } from "@/components/merchant/form-shell";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

/**
 * Somebody already signed in has nothing to do here: straight on to where
 * they were going, or to their dashboard (the console, for a master admin,
 * via /merchant/stores). A shopper's session is not a merchant's and is left
 * to sign in.
 */
export default async function MerchantLoginPage(props: PageProps<"/merchant/login">) {
  const session = await auth();
  if (session?.user?.id && !session.user.customerId) {
    const back = (await props.searchParams).callbackUrl;
    const to = typeof back === "string" && back.startsWith("/") && !back.startsWith("//") ? back : "/merchant/stores";
    redirect(to);
  }
  return (
    <>
      <FormHeading title="Sign in" description="Manage your store." />
      {/* Suspense because the form reads searchParams for callbackUrl, which
          opts the route into client-side rendering without it. */}
      <Suspense fallback={null}>
        <MerchantLoginForm />
      </Suspense>
      <FormFooter>
        No store yet? <FormLink href="/merchant/signup">Create one</FormLink>
      </FormFooter>
    </>
  );
}
