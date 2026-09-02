import { SHOPIFY_PRODUCT_COLUMNS } from "@/lib/csv/shopify-columns";

/**
 * Products, as Shopify's product CSV.
 *
 * The output has to be a file Shopify's own importer accepts, and a file a
 * merchant can diff against a Shopify export and see the same shape in. So the
 * columns are Shopify's, in Shopify's order, and the row layout is Shopify's
 * too:
 *
 *   row 1 of a product   every product field, the option *names*, the first
 *                        variant's option values, and the first image
 *   rows 2..n            the URL handle, the next variant's option values, and
 *                        that variant's own fields. Product fields are blank,
 *                        which is how the importer knows the row continues the
 *                        product above rather than starting a new one.
 *
 * The handle is the join. It is the one product-level column that repeats on
 * every row, and leaving it off a continuation row makes that row a new,
 * nameless product.
 *
 * Pure: rows in, text out. No database, no request.
 */

/** What the exporter needs of a product. Deliberately not the Prisma type. */
export type ExportableProduct = {
  title: string;
  slug: string;
  description: string;
  vendor: string | null;
  tags: string[];
  status: "DRAFT" | "PUBLISHED";
  isActive: boolean;
  basePrice: number;
  salePrice: number | null;
  costPrice: number;
  images: string[];
  seoTitle?: string | null;
  seoDescription?: string | null;
  option1Name: string | null;
  option2Name: string | null;
  option3Name: string | null;
  categories: { name: string }[];
  csvExtras?: Record<string, unknown> | null;
  variants: ExportableVariant[];
};

export type ExportableVariant = {
  option1: string;
  option2: string;
  option3: string;
  sku: string;
  barcode: string | null;
  stock: number;
  priceOverride: number | null;
  weightGrams: number | null;
  imageUrl: string | null;
  csvExtras?: Record<string, unknown> | null;
};

/**
 * One field, quoted the way a spreadsheet expects.
 *
 * Quoted whenever it contains a comma, a quote or a newline, with inner quotes
 * doubled. A product description with a comma in it is the ordinary case, not
 * the edge one, so this is the difference between a valid file and a file that
 * silently shifts every column after it.
 */
export function csvField(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

/**
 * The price a customer pays, and the one shown struck through beside it.
 *
 * Shopify reads "Compare-at price" as the higher, was-this price and "Price" as
 * what is charged. SHOP stores it the other way round — basePrice is the usual
 * price and salePrice undercuts it — so a product on sale has to be turned
 * around on the way out or every discount would export inverted.
 */
export function pricePair(
  basePrice: number,
  salePrice: number | null,
  override: number | null
): { price: number; compareAt: number | null } {
  const price = override ?? salePrice ?? basePrice;
  const compareAt = salePrice !== null && salePrice < basePrice ? basePrice : null;
  return { price, compareAt };
}

/** Whole rupees. PKR has no minor unit, so a decimal here would be noise. */
const money = (n: number | null): string => (n === null ? "" : String(Math.round(n)));

/**
 * Builds one row.
 *
 * Every column is looked up by name from `values`, so a column this platform
 * has nothing to say about comes out empty and in the right place rather than
 * shifting everything after it.
 */
function row(values: Record<string, unknown>): string {
  return SHOPIFY_PRODUCT_COLUMNS.map((column) => csvField(values[column])).join(",");
}

/** The header, exactly as Shopify writes it. */
export function csvHeader(): string {
  return SHOPIFY_PRODUCT_COLUMNS.join(",");
}

/**
 * How a CSV ends a line.
 *
 * Carriage return and newline, which is what RFC 4180 specifies, what Excel
 * expects, and what Shopify actually writes — its own template ends every line
 * 0d 0a. Ending lines with a bare newline produces a file that reads correctly
 * everywhere and is still not the same file, so a merchant diffing an export
 * from each platform sees every single line as changed.
 */
export const CSV_LINE_END = "\r\n";

export function exportProductsCsv(products: ExportableProduct[]): string {
  const lines: string[] = [csvHeader()];

  for (const product of products) {
    // A product with no variants is still a product: Shopify represents it as
    // a single row whose option value is "Default Title", and refusing to
    // export it would lose it silently.
    const variants: ExportableVariant[] =
      product.variants.length > 0
        ? product.variants
        : [
            {
              option1: "Default Title",
              option2: "",
              option3: "",
              sku: "",
              barcode: null,
              stock: 0,
              priceOverride: null,
              weightGrams: null,
              imageUrl: null,
            },
          ];

    // Images ride along on the rows that already exist. Any left over get rows
    // of their own, carrying nothing but the handle and the image, which is how
    // Shopify writes a product with more pictures than variants.
    const imageRows = Math.max(0, product.images.length - variants.length);

    variants.forEach((variant, index) => {
      const first = index === 0;
      const { price, compareAt } = pricePair(
        product.basePrice,
        product.salePrice,
        variant.priceOverride
      );
      const image = product.images[index];

      lines.push(
        row({
          // Product level, first row only. Blank on the rest is what tells the
          // importer the row continues the product above.
          ...(first
            ? {
                Title: product.title,
                Description: product.description,
                Vendor: product.vendor,
                Type: product.categories[0]?.name,
                Tags: product.tags.join(", "),
                "Published on online store": product.isActive ? "TRUE" : "FALSE",
                Status: product.status === "PUBLISHED" ? "Active" : "Draft",
                "Option1 name": product.option1Name,
                "Option2 name": product.option2Name,
                "Option3 name": product.option3Name,
                "SEO title": product.seoTitle,
                "SEO description": product.seoDescription,
                ...(product.csvExtras ?? {}),
              }
            : {}),

          // The join. On every row, always.
          "URL handle": product.slug,

          "Option1 value": variant.option1,
          "Option2 value": variant.option2,
          "Option3 value": variant.option3,
          SKU: variant.sku,
          Barcode: variant.barcode,
          Price: money(price),
          "Compare-at price": money(compareAt),
          "Cost per item": money(product.costPrice),
          "Inventory quantity": String(variant.stock),
          "Weight value (grams)": variant.weightGrams ?? "",
          "Variant image URL": variant.imageUrl,

          ...(image ? { "Product image URL": image, "Image position": String(index + 1) } : {}),
          ...(variant.csvExtras ?? {}),
        })
      );
    });

    for (let n = 0; n < imageRows; n++) {
      const position = variants.length + n;
      lines.push(
        row({
          "URL handle": product.slug,
          "Product image URL": product.images[position],
          "Image position": String(position + 1),
        })
      );
    }
  }

  // Trailing terminator included: a file without one appends to whatever
  // follows it when concatenated, and Shopify writes one.
  return lines.join(CSV_LINE_END) + CSV_LINE_END;
}
