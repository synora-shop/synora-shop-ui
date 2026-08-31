import { Suspense } from "react";
import type { Metadata } from "next";
import { MerchantLoginForm } from "@/components/merchant/login-form";
import { FormFooter, FormHeading, FormLink } from "@/components/merchant/form-shell";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default function MerchantLoginPage() {
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
