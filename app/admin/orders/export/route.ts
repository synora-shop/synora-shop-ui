import { requireRole } from "@/lib/auth-guard";
import { db } from "@/lib/data/shop";
import { getCurrency } from "@/lib/data/settings";
import { exportOrdersCsv, type ExportableOrder } from "@/lib/csv/orders";

/**
 * Every order, in Shopify's order export shape.
 *
 * Binned orders are left out. They are excluded from every revenue total in
 * the panel, and a file that quietly includes them would not add up against
 * the screen it came from.
 */
export async function GET() {
  await requireRole("STAFF");

  const [rows, currency] = await Promise.all([
    (await db()).order.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: { items: true },
    }),
    getCurrency(),
  ]);

  const orders: ExportableOrder[] = rows.map((o) => ({
    id: o.id,
    customerName: o.customerName,
    customerEmail: o.customerEmail,
    customerPhone: o.customerPhone,
    shippingLine1: o.shippingLine1,
    shippingLine2: o.shippingLine2,
    shippingCity: o.shippingCity,
    shippingProvince: o.shippingProvince,
    shippingPostalCode: o.shippingPostalCode,
    subtotal: o.subtotal,
    shippingFee: o.shippingFee,
    total: o.total,
    discountCode: o.discountCode,
    discountAmount: o.discountAmount,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    orderStatus: o.orderStatus,
    notes: o.notes,
    createdAt: o.createdAt,
    items: o.items.map((i) => ({
      // The size and colour ride in the name, because Shopify's line item has
      // one name and no options: "Slim Hoodie (S/Rust)" is what its own export
      // writes for a variant, and what its readers expect.
      title: [i.title, [i.size, i.color].filter(Boolean).join("/")].filter(Boolean).join(" ").trim(),
      sku: "",
      quantity: i.quantity,
      price: i.price,
    })),
  }));

  return new Response(exportOrdersCsv(orders, currency), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders.csv"`,
    },
  });
}
