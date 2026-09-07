import { SHOPIFY_PRODUCT_COLUMNS } from "@/lib/csv/shopify-columns";
import { parseCsv, toRecords, type CsvRow } from "@/lib/csv/parse";

/**
 * Shopify's product CSV, read back.
 *
 * The exact inverse of lib/csv/export.ts, and deliberately written as one: a
 * file this platform exports has to come back in unchanged, and a file
 * Shopify exports has to come in at all. Both are tested by round-tripping a
 * catalogue through the pair in scripts/check-csv-format.ts.
 *
 * The layout is Shopify's, so the reading rules are Shopify's too:
 *
 *   - "URL handle" is the join. Every row carries it; rows sharing one belong
 *     to one product.
 *   - The first row of a product carries the product's own fields. A row whose
 *     product fields are blank continues the product above rather than
 *     starting a nameless new one.
 *   - A row may be a variant, an extra image, or both.
 *
 * Nothing here touches the database. It turns text into a description of what
 * the file says, plus a list of everything wrong with it, and hands both back
 * for a human to look at before anything is written.
 *
 * Client-safe: pure text in, data out.
 */

export type ImportedVariant = {
  option1: string;
  option2: string;
  option3: string;
  sku: string;
  barcode: string | null;
  stock: number;
  priceOverride: number | null;
  weightGrams: number | null;
  imageUrl: string | null;
  csvExtras: Record<string, string>;
};

export type ImportedProduct = {
  /** Shopify's "URL handle" — this platform's slug. The identity of the row. */
  slug: string;
  title: string;
  description: string;
  vendor: string | null;
  tags: string[];
  status: "DRAFT" | "PUBLISHED";
  isActive: boolean;
  basePrice: number;
  salePrice: number | null;
  costPrice: number;
  images: string[];
  categoryName: string | null;
  option1Name: string | null;
  option2Name: string | null;
  option3Name: string | null;
  variants: ImportedVariant[];
  csvExtras: Record<string, string>;
  /** The line in the file this product started on, for reporting. */
  line: number;
};

export type ImportProblem = {
  /** 1-based line in the file as a spreadsheet numbers it, header included. */
  line: number;
  message: string;
};

export type ImportReading = {
  products: ImportedProduct[];
  problems: ImportProblem[];
  /** Columns in the file that Shopify's format does not define. */
  unknownColumns: string[];
};

/** Columns this platform reads. Everything else rides along in csvExtras. */
const CONSUMED = new Set<string>([
  "Title",
  "URL handle",
  "Description",
  "Vendor",
  "Type",
  "Tags",
  "Published on online store",
  "Status",
  "SKU",
  "Barcode",
  "Option1 name",
  "Option1 value",
  "Option2 name",
  "Option2 value",
  "Option3 name",
  "Option3 value",
  "Price",
  "Compare-at price",
  "Cost per item",
  "Inventory quantity",
  "Weight value (grams)",
  "Product image URL",
  "Image position",
  "Variant image URL",
]);

/**
 * Shopify's stand-in for "this product has no options".
 *
 * The exporter writes it for a product with no variants, and Shopify writes it
 * too, so a variant carrying it is not a variant — it is the product itself.
 */
const NO_OPTION = "Default Title";

const text = (row: CsvRow, column: string): string => (row[column] ?? "").trim();

/** A number, or null when the cell is empty. NaN is a problem, not a zero. */
function number(value: string): number | null | "bad" {
  const cleaned = value.replace(/[^0-9.-]/g, "");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return "bad";
  return n;
}

/** Whatever the file says for a boolean column. Shopify writes TRUE/FALSE. */
function boolean(value: string, fallback: boolean): boolean {
  const v = value.trim().toLowerCase();
  if (v === "true" || v === "yes" || v === "1") return true;
  if (v === "false" || v === "no" || v === "0") return false;
  return fallback;
}

/** Everything on this row that the format does not define a meaning for. */
function extras(row: CsvRow, header: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const column of header) {
    if (CONSUMED.has(column)) continue;
    const value = (row[column] ?? "").trim();
    if (value !== "") out[column] = value;
  }
  return out;
}

export function readShopifyProducts(csv: string): ImportReading {
  const rows = parseCsv(csv);
  const problems: ImportProblem[] = [];

  if (rows.length === 0) {
    return { products: [], problems: [{ line: 1, message: "The file is empty." }], unknownColumns: [] };
  }

  const { header, records } = toRecords(rows);

  if (!header.includes("URL handle")) {
    problems.push({
      line: 1,
      message:
        'No "URL handle" column. That column is what ties a product\'s rows together, so without it the file cannot be read. Export a product from Shopify to see the shape.',
    });
    return { products: [], problems, unknownColumns: [] };
  }

  const known = new Set<string>(SHOPIFY_PRODUCT_COLUMNS);
  const unknownColumns = header.filter((c) => c !== "" && !known.has(c));

  const byHandle = new Map<string, ImportedProduct>();
  // Image position is a number in the file; ordering by it rather than by row
  // order is what keeps a Shopify export's picture order intact.
  const imagesByHandle = new Map<string, { url: string; position: number }[]>();

  records.forEach((record, index) => {
    // +2: one for the header, one because a spreadsheet counts from 1.
    const line = index + 2;
    const slug = text(record, "URL handle");
    const title = text(record, "Title");

    if (slug === "") {
      // A row with a title but no handle is a product nobody can address.
      if (title !== "" || Object.values(record).some((v) => v.trim() !== "")) {
        problems.push({ line, message: "No URL handle, so this row belongs to no product." });
      }
      return;
    }

    let product = byHandle.get(slug);

    if (!product) {
      if (title === "") {
        problems.push({
          line,
          message: `The first row for "${slug}" has no title, so there is nothing to create.`,
        });
        return;
      }

      const price = number(text(record, "Price"));
      const compareAt = number(text(record, "Compare-at price"));
      const cost = number(text(record, "Cost per item"));

      if (price === "bad") {
        problems.push({ line, message: `"${text(record, "Price")}" is not a price.` });
        return;
      }
      if (compareAt === "bad") {
        problems.push({ line, message: `"${text(record, "Compare-at price")}" is not a price.` });
        return;
      }

      // The inverse of export's pricePair. Shopify's Price is what a customer
      // pays and Compare-at is the higher was-price; this platform stores the
      // usual price and a sale price that undercuts it.
      const paid = price ?? 0;
      const wasHigher = typeof compareAt === "number" && compareAt > paid;

      product = {
        slug,
        title,
        description: text(record, "Description"),
        vendor: text(record, "Vendor") || null,
        tags: text(record, "Tags")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        status: /^active$/i.test(text(record, "Status")) ? "PUBLISHED" : "DRAFT",
        isActive: boolean(text(record, "Published on online store"), true),
        basePrice: wasHigher ? (compareAt as number) : paid,
        salePrice: wasHigher ? paid : null,
        costPrice: typeof cost === "number" ? cost : 0,
        images: [],
        categoryName: text(record, "Type") || null,
        option1Name: text(record, "Option1 name") || null,
        option2Name: text(record, "Option2 name") || null,
        option3Name: text(record, "Option3 name") || null,
        variants: [],
        csvExtras: extras(record, header),
        line,
      };
      byHandle.set(slug, product);
      imagesByHandle.set(slug, []);
    } else if (title !== "" && title !== product.title) {
      // Two products sharing a handle is the one ambiguity the format cannot
      // resolve: the importer would have to guess which title wins.
      problems.push({
        line,
        message: `"${slug}" already belongs to "${product.title}", so this row's title "${title}" would overwrite it. Give it a different URL handle.`,
      });
      return;
    }

    // ---- the picture, if this row carries one
    const imageUrl = text(record, "Product image URL");
    if (imageUrl !== "") {
      const position = number(text(record, "Image position"));
      imagesByHandle.get(slug)!.push({
        url: imageUrl,
        position: typeof position === "number" ? position : Number.MAX_SAFE_INTEGER,
      });
    }

    // ---- the variant, if this row is one
    const option1 = text(record, "Option1 value");
    const option2 = text(record, "Option2 value");
    const option3 = text(record, "Option3 value");
    const sku = text(record, "SKU");
    const inventory = text(record, "Inventory quantity");
    const rowIsVariant = option1 !== "" || sku !== "" || inventory !== "";

    if (!rowIsVariant) return;

    if (option1 === NO_OPTION && option2 === "" && option3 === "") {
      // Not a variant: the product itself, written the only way the format can
      // write a product that has none. Its stock still belongs somewhere, so
      // it becomes a single unnamed variant rather than being dropped.
      const stock = number(inventory);
      if (stock === "bad") {
        problems.push({ line, message: `"${inventory}" is not a number of items.` });
        return;
      }
      product.variants.push({
        option1: "",
        option2: "",
        option3: "",
        sku,
        barcode: text(record, "Barcode") || null,
        stock: typeof stock === "number" ? Math.max(0, Math.round(stock)) : 0,
        priceOverride: null,
        weightGrams: null,
        imageUrl: text(record, "Variant image URL") || null,
        csvExtras: {},
      });
      return;
    }

    const stock = number(inventory);
    if (stock === "bad") {
      problems.push({ line, message: `"${inventory}" is not a number of items.` });
      return;
    }
    const weight = number(text(record, "Weight value (grams)"));
    const rowPrice = number(text(record, "Price"));
    if (rowPrice === "bad") {
      problems.push({ line, message: `"${text(record, "Price")}" is not a price.` });
      return;
    }

    // A variant priced differently from the product it belongs to is an
    // override; one priced the same is not, and writing it as one would turn
    // every ordinary variant into an exception.
    const productPrice = product.salePrice ?? product.basePrice;
    const priceOverride =
      typeof rowPrice === "number" && rowPrice !== productPrice ? rowPrice : null;

    const duplicate = product.variants.some(
      (v) => v.option1 === option1 && v.option2 === option2 && v.option3 === option3
    );
    if (duplicate) {
      problems.push({
        line,
        message: `"${slug}" already has a ${[option1, option2, option3].filter(Boolean).join(" / ")}.`,
      });
      return;
    }

    product.variants.push({
      option1,
      option2,
      option3,
      sku,
      barcode: text(record, "Barcode") || null,
      stock: typeof stock === "number" ? Math.max(0, Math.round(stock)) : 0,
      priceOverride,
      weightGrams: typeof weight === "number" ? Math.round(weight) : null,
      imageUrl: text(record, "Variant image URL") || null,
      csvExtras: extras(record, header),
    });
  });

  // Pictures in the order the file gave them, without repeats.
  for (const [slug, images] of imagesByHandle) {
    const product = byHandle.get(slug);
    if (!product) continue;
    const seen = new Set<string>();
    product.images = images
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((i) => i.url)
      .filter((url) => (seen.has(url) ? false : (seen.add(url), true)));
  }

  const products = [...byHandle.values()];
  if (products.length === 0 && problems.length === 0) {
    problems.push({ line: 1, message: "No products in the file." });
  }

  return { products, problems, unknownColumns };
}
