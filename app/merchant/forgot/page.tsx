import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/merchant/forgot-form";
import { FormFooter, FormHeading, FormLink } from "@/components/merchant/form-shell";

export const metadata: Metadata = {
  title: "Reset your password",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <>
      <FormHeading
        title="Reset your password"
        description="Tell us the address on the account and we'll send a link. It works once, and only for an hour."
      />
      <ForgotPasswordForm />
      <FormFooter>
        Remembered it? <FormLink href="/merchant/login">Sign in</FormLink>
      </FormFooter>
    </>
  );
}
