import { Suspense } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { getSiteText, text } from "@/lib/site-text";
import { LoginForm } from "@/components/storefront/login-form";

export default async function LoginPage() {
  const siteText = await getSiteText();

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-sm">
        <h1 className="font-serif text-3xl font-semibold text-ink">
          {text(siteText, "account.signInHeading")}
        </h1>
        <Suspense fallback={null}>
          <LoginForm
            submitLabel={text(siteText, "account.signInButton")}
            submittingLabel={text(siteText, "account.signingIn")}
            invalidCredentialsError={text(siteText, "account.invalidCredentials")}
          />
        </Suspense>
        <p className="mt-6 text-center text-sm text-ink-soft">
          {text(siteText, "account.noAccountPrompt")}{" "}
          <Link href="/account/register" className="text-brand-600 underline-scribble">
            {text(siteText, "account.createOneLink")}
          </Link>
        </p>
      </div>
    </Container>
  );
}
