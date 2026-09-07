import { csvField, CSV_LINE_END } from "@/lib/csv/export";
import { SHOPIFY_ORDER_COLUMNS } from "@/lib/csv/order-columns";
import { cellNumber, parseCsv, toRecords, type CsvRow } from "@/lib/csv/parse";

/**
 * Orders, out and back, in Shopify's order export shape.
 *
 * One row per line item, joined by "Name" — the order number. The first row of
 * an order carries the order's own fields; the rest carry the name and their
 * own line. That is Shopify's layout and the same rule the product file uses,
 * so the reader is the same shape too.
 *
 * Shopify itself exports orders and cannot import them, which is exactly why a
 * merchant moving between platforms loses their history. Reading one back is
 * the point of this file.
 *
 * Nothing here sends an email or a notification. An order that arrived in a
 * file last year must not tell a customer today that their order has been
 * received.
 *
 * Client-safe: pure text in, data out.
 */

export type ExportableOrderItem = {
  title: string;
  sku: string;
  quantity: number;
  price: number;
};

export type ExportableOrder = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingLine1: string;
  shippingLine2: string | null;
  shippingCity: string;
  shippingProvince: string;
  shippingPostalCode: string | null;
  subtotal: number;
  shippingFee: number;
  total: number;
  discountCode: string | null;
  discountAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  notes: string | null;
  createdAt: Date;
  items: ExportableOrderItem[];
};

/** Shopify's word for where the money is. */
export function financialStatus(paymentStatus: string): string {
  switch (paymentStatus) {
    case "CONFIRMED":
      return "paid";
    case "FAILED":
      return "voided";
    default:
      return "pending";
  }
}

/** Shopify's word for where the goods are. Blank means nothing has shipped. */
export function fulfillmentStatus(orderStatus: string): string {
  switch (orderStatus) {
    case "DELIVERED":
      return "fulfilled";
    case "SHIPPED":
      return "partial";
    default:
      return "";
  }
}

/** And back the other way, for a file arriving from Shopify. */
export function paymentStatusFrom(financial: string): "PENDING" | "CONFIRMED" | "FAILED" {
  const v = financial.trim().toLowerCase();
  if (v === "paid" || v === "partially_paid") return "CONFIRMED";
  if (v === "voided" || v === "refunded") return "FAILED";
  return "PENDING";
}

export function orderStatusFrom(
  fulfillment: string,
  cancelledAt: string
): "PENDING" | "CONFIRMED" | "PACKED" | "SHIPPED" | "DELIVERED" | "CANCELLED" {
  if (cancelledAt.trim() !== "") return "CANCELLED";
  const v = fulfillment.trim().toLowerCase();
  if (v === "fulfilled") return "DELIVERED";
  if (v === "partial") return "SHIPPED";
  return "PENDING";
}

/** How this platform's payment methods are written, both ways. */
const PAYMENT_METHODS: Record<string, string> = {
  COD: "Cash on Delivery",
  BANK_TRANSFER: "Bank Transfer",
  JAZZCASH: "JazzCash",
  EASYPAISA: "EasyPaisa",
};

export function paymentMethodFrom(written: string): "COD" | "BANK_TRANSFER" | "JAZZCASH" | "EASYPAISA" {
  const v = written.trim().toLowerCase().replace(/[^a-z]/g, "");
  if (v.includes("bank")) return "BANK_TRANSFER";
  if (v.includes("jazz")) return "JAZZCASH";
  if (v.includes("easy")) return "EASYPAISA";
  return "COD";
}

function row(values: Record<string, unknown>): string {
  return SHOPIFY_ORDER_COLUMNS.map((column) => csvField(values[column])).join(",");
}

export function orderCsvHeader(): string {
  return SHOPIFY_ORDER_COLUMNS.join(",");
}

/** ISO 8601, which is what Shopify writes and the only format that sorts. */
const iso = (d: Date): string => d.toISOString();

export function exportOrdersCsv(orders: ExportableOrder[], currency: string): string {
  const lines: string[] = [orderCsvHeader()];

  for (const order of orders) {
    const street = [order.shippingLine1, order.shippingLine2].filter(Boolean).join(", ");
    const items = order.items.length > 0 ? order.items : [{ title: "", sku: "", quantity: 0, price: 0 }];

    items.forEach((item, index) => {
      const first = index === 0;
      lines.push(
        row({
          // The join. On every row, always — a row without it belongs to no
          // order, which is the one thing the format cannot recover from.
          Name: order.id,
          Email: order.customerEmail,

          ...(first
            ? {
                "Financial Status": financialStatus(order.paymentStatus),
                "Fulfillment Status": fulfillmentStatus(order.orderStatus),
                "Accepts Marketing": "no",
                Currency: currency,
                Subtotal: String(order.subtotal),
                Shipping: String(order.shippingFee),
                Taxes: "0",
                Total: String(order.total),
                "Discount Code": order.discountCode,
                "Discount Amount": String(order.discountAmount),
                "Created at": iso(order.createdAt),
                "Billing Name": order.customerName,
                "Billing Street": street,
                "Billing Address1": order.shippingLine1,
                "Billing Address2": order.shippingLine2,
                "Billing City": order.shippingCity,
                "Billing Zip": order.shippingPostalCode,
                "Billing Province": order.shippingProvince,
                "Billing Phone": order.customerPhone,
                "Shipping Name": order.customerName,
                "Shipping Street": street,
                "Shipping Address1": order.shippingLine1,
                "Shipping Address2": order.shippingLine2,
                "Shipping City": order.shippingCity,
                "Shipping Zip": order.shippingPostalCode,
                "Shipping Province": order.shippingProvince,
                "Shipping Phone": order.customerPhone,
                Notes: order.notes,
                "Cancelled at": order.orderStatus === "CANCELLED" ? iso(order.createdAt) : "",
                "Payment Method": PAYMENT_METHODS[order.paymentMethod] ?? order.paymentMethod,
                Id: order.id,
                Phone: order.customerPhone,
              }
            : {}),

          "Lineitem quantity": String(item.quantity),
          "Lineitem name": item.title,
          "Lineitem price": String(item.price),
          "Lineitem sku": item.sku,
          "Lineitem requires shipping": "true",
          "Lineitem taxable": "false",
          "Lineitem fulfillment status": fulfillmentStatus(order.orderStatus) || "unfulfilled",
        })
      );
    });
  }

  return lines.join(CSV_LINE_END) + CSV_LINE_END;
}

/* -------------------------------------------------------------------------- */
/* Reading one back                                                            */
/* -------------------------------------------------------------------------- */

export type ImportedOrderItem = {
  title: string;
  sku: string;
  quantity: number;
  price: number;
};

export type ImportedOrder = {
  /** Shopify's "Name". Kept as given, so re-importing the same file matches. */
  reference: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingLine1: string;
  shippingLine2: string | null;
  shippingCity: string;
  shippingProvince: string;
  shippingPostalCode: string | null;
  subtotal: number;
  shippingFee: number;
  total: number;
  discountCode: string | null;
  discountAmount: number;
  paymentMethod: "COD" | "BANK_TRANSFER" | "JAZZCASH" | "EASYPAISA";
  paymentStatus: "PENDING" | "CONFIRMED" | "FAILED";
  orderStatus: "PENDING" | "CONFIRMED" | "PACKED" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  notes: string | null;
  placedAt: Date;
  items: ImportedOrderItem[];
  line: number;
};

export type OrderReading = {
  orders: ImportedOrder[];
  problems: { line: number; message: string }[];
  unknownColumns: string[];
};

const text = (row: CsvRow, column: string): string => (row[column] ?? "").trim();


export function readShopifyOrders(csv: string): OrderReading {
  const rows = parseCsv(csv);
  if (rows.length === 0) {
    return { orders: [], problems: [{ line: 1, message: "The file is empty." }], unknownColumns: [] };
  }

  const { header, records } = toRecords(rows);
  const problems: { line: number; message: string }[] = [];

  if (!header.includes("Name")) {
    problems.push({
      line: 1,
      message:
        'No "Name" column. That is the order number, and it is what ties an order\'s rows together.',
    });
    return { orders: [], problems, unknownColumns: [] };
  }

  const known = new Set<string>(SHOPIFY_ORDER_COLUMNS);
  const unknownColumns = header.filter((c) => c !== "" && !known.has(c));

  const byName = new Map<string, ImportedOrder>();

  records.forEach((record, index) => {
    const line = index + 2;
    const reference = text(record, "Name");

    if (reference === "") {
      if (Object.values(record).some((v) => v.trim() !== "")) {
        problems.push({ line, message: "No order number, so this row belongs to no order." });
      }
      return;
    }

    let order = byName.get(reference);

    if (!order) {
      const email = text(record, "Email");
      if (email === "") {
        problems.push({
          line,
          message: `Order ${reference} has no email address, so there is nobody to attach it to.`,
        });
        return;
      }

      const total = cellNumber(text(record, "Total"));
      if (total === "bad") {
        problems.push({ line, message: `"${text(record, "Total")}" is not a total.` });
        return;
      }

      const created = text(record, "Created at");
      const placedAt = created ? new Date(created) : new Date();
      if (Number.isNaN(placedAt.getTime())) {
        problems.push({ line, message: `"${created}" is not a date.` });
        return;
      }

      const subtotal = cellNumber(text(record, "Subtotal"));
      const shipping = cellNumber(text(record, "Shipping"));
      const discount = cellNumber(text(record, "Discount Amount"));

      order = {
        reference,
        customerName:
          text(record, "Shipping Name") || text(record, "Billing Name") || email.split("@")[0],
        customerEmail: email.toLowerCase(),
        customerPhone: text(record, "Shipping Phone") || text(record, "Phone") || "",
        shippingLine1: text(record, "Shipping Address1") || text(record, "Shipping Street"),
        shippingLine2: text(record, "Shipping Address2") || null,
        shippingCity: text(record, "Shipping City"),
        shippingProvince: text(record, "Shipping Province"),
        shippingPostalCode: text(record, "Shipping Zip") || null,
        subtotal: typeof subtotal === "number" ? Math.round(subtotal) : 0,
        shippingFee: typeof shipping === "number" ? Math.round(shipping) : 0,
        total: typeof total === "number" ? Math.round(total) : 0,
        discountCode: text(record, "Discount Code") || null,
        discountAmount: typeof discount === "number" ? Math.round(discount) : 0,
        paymentMethod: paymentMethodFrom(text(record, "Payment Method")),
        paymentStatus: paymentStatusFrom(text(record, "Financial Status")),
        orderStatus: orderStatusFrom(text(record, "Fulfillment Status"), text(record, "Cancelled at")),
        notes: text(record, "Notes") || null,
        placedAt,
        items: [],
        line,
      };
      byName.set(reference, order);
    }

    // ---- the line item, if this row carries one
    const title = text(record, "Lineitem name");
    const quantity = cellNumber(text(record, "Lineitem quantity"));
    if (title === "" && quantity === null) return;

    if (quantity === "bad") {
      problems.push({ line, message: `"${text(record, "Lineitem quantity")}" is not a quantity.` });
      return;
    }
    const price = cellNumber(text(record, "Lineitem price"));
    if (price === "bad") {
      problems.push({ line, message: `"${text(record, "Lineitem price")}" is not a price.` });
      return;
    }

    order.items.push({
      title: title || "Item",
      sku: text(record, "Lineitem sku"),
      quantity: typeof quantity === "number" ? Math.max(0, Math.round(quantity)) : 1,
      price: typeof price === "number" ? Math.round(price) : 0,
    });
  });

  const orders = [...byName.values()];
  if (orders.length === 0 && problems.length === 0) {
    problems.push({ line: 1, message: "No orders in the file." });
  }

  return { orders, problems, unknownColumns };
}
