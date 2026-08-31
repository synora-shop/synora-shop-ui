import type { Metadata } from "next";
import { ConfirmEmail, ResendVerification } from "@/components/merchant/verify-email";
import { FormFooter, FormHeading, FormLink } from "@/components/merchant/form-shell";

export const metadata: Metadata = {
  title: "Confirm your email",
  robots: { index: false, follow: false },
};

export default async function VerifyEmailPage(props: PageProps<"/merchant/verify">) {
  const sp = await props.searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";

  if (token) {
    return (
      <>
        <FormHeading
          title="Confirm your email"
          description="One tap and your store is open for business."
        />
        <ConfirmEmail token={token} />
      </>
    );
  }

  return (
    <>
      <FormHeading
        title="Send a new link"
        description="Confirmation links last a day. If yours has expired, put your address in below and we'll send another."
      />
      <ResendVerification />
      <FormFooter>
        <FormLink href="/merchant/login">Back to sign in</FormLink>
      </FormFooter>
    </>
  );
}
