import Link from "next/link";
import { db } from "@/lib/data/shop";
import { BinProductList } from "@/components/admin/bin-product-list";
import { BinOrderList } from "@/components/admin/bin-order-list";

export const dynamic = "force-dynamic";

export default async function AdminBinPage(props: PageProps<"/admin/bin">) {
  const sp = await props.searchParams;
  const tab = sp.tab === "orders" ? "orders" : "products";

  const [products, orders] = await Promise.all([
    tab === "products"
      ? (await db()).product.findMany({
          where: { deletedAt: { not: null } },
          include: { categories: true },
          orderBy: { deletedAt: "desc" },
        })
      : Promise.resolve([]),
    tab === "orders"
      ? (await db()).order.findMany({
          where: { deletedAt: { not: null } },
          orderBy: { deletedAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold">Bin</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Deleted products and orders land here first. Restore anytime, or permanently delete
        to free the data for good.
      </p>

      <div className="mt-4 flex gap-2">
        <Link
          href="/admin/bin?tab=products"
          className={`rounded-full border border-border px-4 py-1.5 text-sm transition-colors ${
            tab === "products" ? "border-brand-500 bg-brand-500 text-white" : "hover:bg-subtle active:bg-subtle"
          }`}
        >
          Product Bin
        </Link>
        <Link
          href="/admin/bin?tab=orders"
          className={`rounded-full border border-border px-4 py-1.5 text-sm transition-colors ${
            tab === "orders" ? "border-brand-500 bg-brand-500 text-white" : "hover:bg-subtle active:bg-subtle"
          }`}
        >
          Orders Bin
        </Link>
      </div>

      {tab === "products" ? <BinProductList products={products} /> : <BinOrderList orders={orders} />}
    </div>
  );
}
