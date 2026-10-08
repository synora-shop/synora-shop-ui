import { kitSignInPage } from "@/components/storefront/kit-account";
import { Suspense } from "react";
import { Container } from "@/components/ui/container";
import { getSiteText, text } from "@/lib/site-text";
import { CodeSignInForm } from "@/components/storefront/code-sign-in-form";

/**
 * A customer's sign-in — also how an account is made: an email, then a code
 * (decided 8 October; no passwords for customers).
 */
export default async function LoginPage(props: PageProps<"/account/login">) {
  const kitted = await kitSignInPage(await props.searchParams);
  if (kitted) return kitted;

  const siteText = await getSiteText();

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-sm">
        <h1 className="font-serif text-3xl font-semibold text-ink">{text(siteText, "account.signInHeading")}</h1>
        <Suspense fallback={null}>
          <CodeSignInForm
            labels={{
              text: text(siteText, "account.signInText"),
              sendCode: text(siteText, "account.sendCode"),
              codeSent: text(siteText, "account.codeSent"),
              code: text(siteText, "account.code"),
              signIn: text(siteText, "account.signInButton"),
              differentEmail: text(siteText, "account.differentEmail"),
            }}
          />
        </Suspense>
      </div>
    </Container>
  );
}
