import { KiteTemplateView } from "@/components/kite/template";
import { FOOTER_GROUP, HEADER_GROUP, COLLECTION } from "@/components/kite/templates";
import { KITE_DEMO_COLLECTION, kiteDemoContext } from "@/components/kite/demo";

/** The collection — every piece of the reference build. Not in the file: Kite's own parts (decided 8 October). */
export default function KiteShopPage() {
  const ctx = kiteDemoContext({ products: KITE_DEMO_COLLECTION, collection: { title: "Shop", description: "" } });
  return (
    <>
      <KiteTemplateView template={HEADER_GROUP} ctx={ctx} />
      <KiteTemplateView template={COLLECTION} ctx={ctx} />
      <KiteTemplateView template={FOOTER_GROUP} ctx={ctx} />
    </>
  );
}
