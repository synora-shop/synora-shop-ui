import { redirect } from "next/navigation";
import { currentCustomer } from "@/lib/data/customer";
import { db } from "@/lib/data/shop";
import { Container } from "@/components/ui/container";
import { getSiteText, text } from "@/lib/site-text";
import { AddressList } from "@/components/storefront/address-list";
import { addAddress } from "./actions";

export default async function AddressesPage() {
  const me = await currentCustomer();
  if (!me) redirect("/account/login?callbackUrl=/account/addresses");

  const [addresses, siteText] = await Promise.all([
    (await db()).address.findMany({
      where: { customerId: me.id },
      orderBy: { createdAt: "desc" },
    }),
    getSiteText(),
  ]);

  return (
    <Container className="py-16">
      <h1 className="font-serif text-3xl font-semibold text-ink">
        {text(siteText, "account.savedAddressesHeading")}
      </h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          {addresses.length === 0 ? (
            <p className="text-ink-soft">{text(siteText, "account.noAddressesYet")}</p>
          ) : (
            <AddressList addresses={addresses} removeLabel={text(siteText, "account.removeAddressButton")} />
          )}
        </div>

        <form action={addAddress} className="space-y-3 rounded-lg border border-border bg-white p-5">
          <h2 className="font-serif text-lg font-semibold text-ink">
            {text(siteText, "account.addNewAddressHeading")}
          </h2>
          <input name="label" placeholder="Label (e.g. Home, Office)" className="input" />
          <input
            name="line1"
            autoComplete="address-line1"
            required
            placeholder="Address line 1"
            className="input"
          />
          <input
            name="line2"
            autoComplete="address-line2"
            placeholder="Address line 2 (optional)"
            className="input"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              name="city"
              autoComplete="address-level2"
              required
              placeholder="City"
              className="input"
            />
            <input
              name="province"
              autoComplete="address-level1"
              required
              placeholder="Province"
              className="input"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              name="postalCode"
              autoComplete="postal-code"
              placeholder="Postal code"
              className="input"
            />
            <input name="phone" type="tel" autoComplete="tel" required placeholder="Phone" className="input" />
          </div>
          <button
            type="submit"
            className="rounded-full bg-brand-500 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600"
          >
            {text(siteText, "account.saveAddressButton")}
          </button>
        </form>
      </div>
    </Container>
  );
}
