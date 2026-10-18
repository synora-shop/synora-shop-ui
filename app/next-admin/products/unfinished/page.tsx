import { Page } from "@/components/next-admin/ui";
import { ProductsBoard } from "@/components/next-admin/products-board";
import { A } from "@/components/next-admin/nav";
import { PRODUCTS } from "@/lib/new-admin/sample";

export const metadata = { title: "Unfinished products" };

/** Started and not yet put out: the catalogue's drafts, on a screen of their own. */
export default function UnfinishedPage() {
  return (
    <Page title="Unfinished" crumbs={[{ label: "Products", href: `${A}/products` }]} sub="Products you started and have not put on sale. Tick them and make them active together.">
      <ProductsBoard products={PRODUCTS.filter((p) => p.status === "Draft")} />
    </Page>
  );
}
