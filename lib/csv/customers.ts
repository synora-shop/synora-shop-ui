import { csvField, CSV_LINE_END } from "@/lib/csv/export";
import { SHOPIFY_CUSTOMER_COLUMNS } from "@/lib/csv/customer-columns";
import { parseCsv, toRecords, type CsvRow } from "@/lib/csv/parse";

/**
 * Customers, out and back, as Shopify's customer CSV.
 *
 * Written as one file with both halves for the same reason the product pair
 * is: they are inverses, and a merchant who exports, edits one cell in a
 * spreadsheet and imports must get back what they had everywhere they did not
 * touch. The round trip is the test.
 *
 * A person is identified by their email address, which is what Shopify uses
 * and what this platform's own unique index uses. Names are split on the last
 * space going out and joined coming back, which is the only rule that survives
 * "Faisal Siddiqui" and "Maria del Carmen Ruiz" equally badly and predictably.
 *
 * Client-safe: pure text in, data out.
 */

export type ExportableCustomer = {
  name: string;
  email: string;
  phone: string | null;
  /** The default address, or the first one. Absent when they have none. */
  address?: {
    line1: string;
    line2: string | null;
    city: string;
    province: string;
    postalCode: string | null;
    phone: string;
  } | null;
  /** What they have spent, in whole units of the shop's currency. */
  totalSpent: number;
  totalOrders: number;
};

/** A name in two halves, Shopify's shape. Everything before the last space is the first name. */
export function splitName(full: string): { first: string; last: string } {
  const trimmed = full.trim().replace(/\s+/g, " ");
  if (trimmed === "") return { first: "", last: "" };
  const cut = trimmed.lastIndexOf(" ");
  if (cut === -1) return { first: trimmed, last: "" };
  return { first: trimmed.slice(0, cut), last: trimmed.slice(cut + 1) };
}

/** The two halves back together, without a stray space when one is empty. */
export function joinName(first: string, last: string): string {
  return [first.trim(), last.trim()].filter(Boolean).join(" ");
}

function row(values: Record<string, unknown>): string {
  return SHOPIFY_CUSTOMER_COLUMNS.map((column) => csvField(values[column])).join(",");
}

export function customerCsvHeader(): string {
  return SHOPIFY_CUSTOMER_COLUMNS.join(",");
}

export function exportCustomersCsv(customers: ExportableCustomer[]): string {
  const lines: string[] = [customerCsvHeader()];

  for (const customer of customers) {
    const { first, last } = splitName(customer.name);
    lines.push(
      row({
        "First Name": first,
        "Last Name": last,
        Email: customer.email,
        // Nobody has been asked, and a blanket "yes" in a file that loads into
        // another platform is the kind of default that ends in a complaint.
        "Accepts Email Marketing": "no",
        Address1: customer.address?.line1,
        Address2: customer.address?.line2,
        City: customer.address?.city,
        Province: customer.address?.province,
        Zip: customer.address?.postalCode,
        Phone: customer.phone ?? customer.address?.phone,
        "Accepts SMS Marketing": "no",
        "Total Spent": String(Math.round(customer.totalSpent)),
        "Total Orders": String(customer.totalOrders),
        "Tax Exempt": "no",
      })
    );
  }

  return lines.join(CSV_LINE_END) + CSV_LINE_END;
}

/* -------------------------------------------------------------------------- */
/* Reading one back                                                            */
/* -------------------------------------------------------------------------- */

export type ImportedCustomer = {
  name: string;
  email: string;
  phone: string | null;
  address: {
    line1: string;
    line2: string | null;
    city: string;
    province: string;
    postalCode: string | null;
    phone: string;
  } | null;
  /** The line in the file, for reporting. */
  line: number;
};

export type CustomerReading = {
  customers: ImportedCustomer[];
  problems: { line: number; message: string }[];
  unknownColumns: string[];
};

const text = (row: CsvRow, column: string): string => (row[column] ?? "").trim();

/**
 * An address is only worth writing when there is something to deliver to.
 *
 * Shopify exports every customer with empty address columns whether or not
 * they have one, and writing a row of empty strings would give every imported
 * customer a blank address they then have to delete.
 */
function addressOf(record: CsvRow): ImportedCustomer["address"] {
  const line1 = text(record, "Address1");
  const city = text(record, "City");
  if (line1 === "" && city === "") return null;
  return {
    line1,
    line2: text(record, "Address2") || null,
    city,
    province: text(record, "Province") || text(record, "Province Code"),
    postalCode: text(record, "Zip") || null,
    phone: text(record, "Phone"),
  };
}

/** Roughly an address, which is all a CSV can tell you. */
function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function readShopifyCustomers(csv: string): CustomerReading {
  const rows = parseCsv(csv);
  if (rows.length === 0) {
    return { customers: [], problems: [{ line: 1, message: "The file is empty." }], unknownColumns: [] };
  }

  const { header, records } = toRecords(rows);
  const problems: { line: number; message: string }[] = [];

  if (!header.includes("Email")) {
    problems.push({
      line: 1,
      message:
        'No "Email" column. A customer is identified by their email address, so without it the file cannot be read.',
    });
    return { customers: [], problems, unknownColumns: [] };
  }

  const known = new Set<string>(SHOPIFY_CUSTOMER_COLUMNS);
  const unknownColumns = header.filter((c) => c !== "" && !known.has(c));

  const byEmail = new Map<string, ImportedCustomer>();

  records.forEach((record, index) => {
    const line = index + 2;
    const email = text(record, "Email").toLowerCase();

    if (email === "") {
      if (Object.values(record).some((v) => v.trim() !== "")) {
        problems.push({ line, message: "No email address, so there is nobody to import." });
      }
      return;
    }
    if (!looksLikeEmail(email)) {
      problems.push({ line, message: `"${email}" is not an email address.` });
      return;
    }
    if (byEmail.has(email)) {
      problems.push({ line, message: `${email} is in this file twice.` });
      return;
    }

    const name = joinName(text(record, "First Name"), text(record, "Last Name"));
    byEmail.set(email, {
      name: name || email.split("@")[0],
      email,
      phone: text(record, "Phone") || null,
      address: addressOf(record),
      line,
    });
  });

  const customers = [...byEmail.values()];
  if (customers.length === 0 && problems.length === 0) {
    problems.push({ line: 1, message: "No customers in the file." });
  }

  return { customers, problems, unknownColumns };
}
