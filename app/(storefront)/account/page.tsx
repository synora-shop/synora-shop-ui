import { redirect } from "next/navigation";
import { currentCustomer } from "@/lib/data/customer";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import { Container } from "@/components/ui/container";
import { getSiteText, text } from "@/lib/site-text";

export default async function AccountPage() {
  const me = await currentCustomer();
  if (!me) redirect("/account/login?callbackUrl=/account");
  const siteText = await getSiteText();

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-md">
        <h1 className="font-serif text-3xl font-semibold text-ink">
          Hi, {me.name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-ink-soft">{me.email}</p>

        <div className="mt-8 divide-y divide-border rounded-lg border border-border bg-white">
          <Link href="/account/orders" className="block px-5 py-4 text-sm hover:bg-subtle">
            {text(siteText, "account.orderHistoryLink")}
          </Link>
          <Link href="/account/addresses" className="block px-5 py-4 text-sm hover:bg-subtle">
            {text(siteText, "account.savedAddressesLink")}
          </Link>
        </div>

        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
          className="mt-6"
        >
          <button type="submit" className="text-sm text-brand-600 underline-scribble">
            {text(siteText, "account.signOut")}
          </button>
        </form>
      </div>
    </Container>
  );
}
