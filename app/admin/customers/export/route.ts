import { requireRole } from "@/lib/auth-guard";
import { db } from "@/lib/data/shop";
import { exportCustomersCsv, type ExportableCustomer } from "@/lib/csv/customers";

/**
 * Every customer, as a Shopify customer CSV.
 *
 * A route rather than an action because the answer is a file. Downloading a
 * shop's whole customer list is a staff-level act — it is the most personal
 * data this platform holds — so it is gated like one and written to the audit
 * log by nothing, which is a gap worth naming: see docs/QUEUE.md.
 */
export async function GET() {
  await requireRole("STAFF");

  const rows = await (await db()).customer.findMany({
    orderBy: { email: "asc" },
    include: {
      // The default one, or the first they gave us.
      addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }], take: 1 },
      orders: {
        where: { deletedAt: null, orderStatus: { not: "CANCELLED" } },
        select: { total: true },
      },
    },
  });

  const customers: ExportableCustomer[] = rows.map((c) => ({
    name: c.name,
    email: c.email,
    phone: c.phone,
    address: c.addresses[0]
      ? {
          line1: c.addresses[0].line1,
          line2: c.addresses[0].line2,
          city: c.addresses[0].city,
          province: c.addresses[0].province,
          postalCode: c.addresses[0].postalCode,
          phone: c.addresses[0].phone,
        }
      : null,
    totalSpent: c.orders.reduce((sum, o) => sum + o.total, 0),
    totalOrders: c.orders.length,
  }));

  return new Response(exportCustomersCsv(customers), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="customers.csv"`,
    },
  });
}
