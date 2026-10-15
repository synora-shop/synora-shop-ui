import { PageHeader } from "@/components/ui/primitives";
import { db } from "@/lib/data/shop";
import { getCurrency } from "@/lib/data/settings";
import { formatMoney } from "@/lib/money";
import { shopSession } from "@/lib/auth-guard";
import { BinList, type BinRow } from "@/components/admin/bin-list";

export const dynamic = "force-dynamic";

/**
 * The Bin (new admin, 15 October): deleted products and orders, together,
 * newest first. They stay until they are deleted for good, here.
 */
export default async function AdminBinPage() {
  const [products, orders, currency, me] = await Promise.all([
    (await db()).product.findMany({
      where: { deletedAt: { not: null } },
      select: { id: true, title: true, images: true, deletedAt: true, categories: { select: { name: true } } },
      orderBy: { deletedAt: "desc" },
    }),
    (await db()).order.findMany({
      where: { deletedAt: { not: null } },
      select: { id: true, customerName: true, total: true, deletedAt: true },
      orderBy: { deletedAt: "desc" },
    }),
    getCurrency(),
    shopSession(),
  ]);

  const rows: BinRow[] = [
    ...products.map((p) => ({
      id: p.id,
      kind: "Product" as const,
      name: p.title,
      detail: p.categories.map((c) => c.name).join(", "),
      image: p.images[0],
      deletedAt: p.deletedAt!,
    })),
    ...orders.map((o) => ({
      id: o.id,
      kind: "Order" as const,
      name: `Order #${o.id}`,
      detail: `${o.customerName}, ${formatMoney(o.total, currency)}`,
      deletedAt: o.deletedAt!,
    })),
  ].sort((a, b) => b.deletedAt.getTime() - a.deletedAt.getTime());

  return (
    <div className="space-y-5">
      <PageHeader title="Bin" description="Products and orders you deleted. They stay here until you delete them for good, so you can change your mind." />
      <BinList rows={rows} canEmpty={me?.role === "OWNER" || me?.role === "ADMIN"} />
    </div>
  );
}
