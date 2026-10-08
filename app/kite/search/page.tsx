import { KiteTemplateView } from "@/components/kite/template";
import { FOOTER_GROUP, HEADER_GROUP, SEARCH } from "@/components/kite/templates";
import { KITE_DEMO_COLLECTION, kiteDemoContext } from "@/components/kite/demo";

/** Search, over the reference build's pieces. `?q=` is what was typed. Not in the file: Kite's own parts (decided 8 October). */
export default async function KiteSearchPage(props: PageProps<"/kite/search">) {
  const q = (await props.searchParams).q;
  const ctx = kiteDemoContext({ products: KITE_DEMO_COLLECTION, query: typeof q === "string" ? q : "" });
  return (
    <>
      <KiteTemplateView template={HEADER_GROUP} ctx={ctx} />
      <KiteTemplateView template={SEARCH} ctx={ctx} />
      <KiteTemplateView template={FOOTER_GROUP} ctx={ctx} />
    </>
  );
}
