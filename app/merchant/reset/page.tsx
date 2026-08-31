import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/merchant/reset-form";
import {
  FormFooter,
  FormHeading,
  FormLink,
  FormMessage,
} from "@/components/merchant/form-shell";

export const metadata: Metadata = {
  title: "Choose a new password",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage(props: PageProps<"/merchant/reset">) {
  const sp = await props.searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";

  // The token is not checked here. Validating it on load would mean answering
  // "is this a real link?" to anyone who asks, and the answer is worth having
  // if you are working through a list of guesses. It is checked once, on the
  // submission that would actually use it.
  if (!token) {
    return (
      <>
        <FormHeading title="Choose a new password" />
        <FormMessage tone="error">
          That link is missing its code. Open the link from the email, or ask for a new one.
        </FormMessage>
        <FormFooter>
          <FormLink href="/merchant/forgot">Send a new link</FormLink>
        </FormFooter>
      </>
    );
  }

  return (
    <>
      <FormHeading
        title="Choose a new password"
        description="You'll be signed out everywhere else, on every device."
      />
      <ResetPasswordForm token={token} />
    </>
  );
}
