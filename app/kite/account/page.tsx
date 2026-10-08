import { KiteTemplateView } from "@/components/kite/template";
import { ACCOUNT, HEADER_GROUP } from "@/components/kite/templates";
import { KITE_DEMO_BAG, KITE_DEMO_CUSTOMER, KITE_DEMO_SAVED, kiteDemoContext } from "@/components/kite/demo";

/**
 * Kite's account in the reference build — the file's three "Account" screens
 * (?tab=saved, ?tab=orders) and its phone one. A header and the account, no
 * footer, as the file draws them.
 */
export default async function KiteAccountPage(props: PageProps<"/kite/account">) {
  const tab = (await props.searchParams).tab;
  const ctx = kiteDemoContext({
    customer: KITE_DEMO_CUSTOMER,
    savedGroups: KITE_DEMO_SAVED,
    cart: KITE_DEMO_BAG,
    accountTab: tab === "saved" ? "saved" : tab === "orders" ? "orders" : "details",
  });
  return (
    <>
      <KiteTemplateView template={HEADER_GROUP} ctx={ctx} />
      <KiteTemplateView template={ACCOUNT} ctx={ctx} />
    </>
  );
}
