import { Metrics, Page } from "@/components/next-admin/ui";
import { ProductActions, ProductsBoard } from "@/components/next-admin/products-board";
import { A } from "@/components/next-admin/nav";
import { PRODUCTS } from "@/lib/new-admin/sample";

export const metadata = { title: "Products" };

export default function ProductsPage() {
  return (
    <Page title="Products" sub="What you sell: sizes, stock, price, and how each is sold." actions={<ProductActions />}>
      <Metrics items={[{ label: "Active", value: "10" }, { label: "Unfinished", value: "2", href: `${A}/products/unfinished` }, { label: "Running low", value: "3", down: true, delta: "Under 10 left", href: `${A}/products/inventory` }, { label: "Sold out", value: "1", down: true, delta: "Ayla co-ord" }]} />
      <ProductsBoard products={PRODUCTS} />
    </Page>
  );
}
