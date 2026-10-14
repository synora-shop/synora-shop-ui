import { PageHeader, StatStrip } from "@/components/new-admin/ui";
import { ProductsBoard } from "@/components/new-admin/products-board";
import { PRODUCTS } from "@/lib/new-admin/sample";

export const metadata = { title: "Products" };

export default function ProductsPage() {
  return (
    <>
      <PageHeader icon="products" tone="mint" title="Products" sub="What you sell: sizes, stock, price, and how each is sold." />
      <StatStrip stats={[{ label: "Active", value: "10" }, { label: "Unfinished", value: "2" }, { label: "Running low", value: "3", down: true, delta: "Under 10 left" }, { label: "Sold out", value: "1", down: true }]} />
      <ProductsBoard products={PRODUCTS} />
    </>
  );
}
