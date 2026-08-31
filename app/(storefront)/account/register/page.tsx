import Link from "next/link";
import { Container } from "@/components/ui/container";
import { getSiteText, text } from "@/lib/site-text";
import { RegisterForm } from "@/components/storefront/register-form";

export default async function RegisterPage() {
  const siteText = await getSiteText();

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-sm">
        <h1 className="font-serif text-3xl font-semibold text-ink">
          {text(siteText, "account.createAccountHeading")}
        </h1>
        <RegisterForm
          submitLabel={text(siteText, "account.createAccountButton")}
          submittingLabel={text(siteText, "account.creatingAccount")}
          genericError={text(siteText, "account.registerGenericError")}
        />
        <p className="mt-6 text-center text-sm text-ink-soft">
          {text(siteText, "account.haveAccountPrompt")}{" "}
          <Link href="/account/login" className="text-brand-600 underline-scribble">
            {text(siteText, "account.signInLink")}
          </Link>
        </p>
      </div>
    </Container>
  );
}
