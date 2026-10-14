import { PageHeader } from "@/components/new-admin/ui";
import { ProductsBoard } from "@/components/new-admin/products-board";
import { PRODUCTS } from "@/lib/new-admin/sample";

export const metadata = { title: "Unfinished products" };

/** Started and not yet put out: the catalogue's drafts, on a screen of their own. */
export default function UnfinishedPage() {
  return (
    <>
      <PageHeader icon="products" tone="mint" title="Unfinished" sub="Products you started and have not put on sale yet. Tick them and make them active together." />
      <ProductsBoard products={PRODUCTS.filter((p) => p.status === "Draft")} actions={false} />
    </>
  );
}
