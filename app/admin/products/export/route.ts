import { requireRole } from "@/lib/auth-guard";
import { db, requireShop } from "@/lib/data/shop";
import { exportProductsCsv, type ExportableProduct } from "@/lib/csv/export";

/**
 * Every product, as a Shopify product CSV.
 *
 * A route rather than an action because the answer is a file: a server action
 * would have to hand the whole thing back through React and let the browser
 * rebuild it, where this streams straight to disk with a filename.
 *
 * Downloading a shop's entire catalogue is a staff-level act, so it is gated
 * like one.
 */
export async function GET() {
  await requireRole("STAFF");

  const shop = await requireShop();
  const rows = await (await db()).product.findMany({
    orderBy: { title: "asc" },
    include: {
      categories: { select: { name: true }, take: 1 },
      // Ordered so a re-export of an unchanged catalogue is byte for byte the
      // same file. Two exports that differ only in row order are two files a
      // merchant cannot diff.
      variants: { orderBy: [{ option1: "asc" }, { option2: "asc" }, { option3: "asc" }] },
    },
  });

  const products: ExportableProduct[] = rows.map((p) => ({
    title: p.title,
    slug: p.slug,
    description: p.description,
    vendor: p.vendor,
    tags: p.tags,
    status: p.status,
    isActive: p.isActive,
    basePrice: p.basePrice,
    salePrice: p.salePrice,
    costPrice: p.costPrice,
    images: p.images,
    // A product has no SEO override in SHOP; categories and pages do. The
    // columns are still written, empty and in place, so the file keeps its
    // shape and a merchant who set them on Shopify sees where they go.
    seoTitle: null,
    seoDescription: null,
    option1Name: p.option1Name,
    option2Name: p.option2Name,
    option3Name: p.option3Name,
    categories: p.categories,
    csvExtras: (p.csvExtras ?? {}) as Record<string, unknown>,
    variants: p.variants.map((v) => ({
      option1: v.option1,
      option2: v.option2,
      option3: v.option3,
      sku: v.sku,
      barcode: v.barcode,
      stock: v.stock,
      priceOverride: v.priceOverride,
      weightGrams: v.weightGrams,
      imageUrl: v.imageUrl,
      csvExtras: (v.csvExtras ?? {}) as Record<string, unknown>,
    })),
  }));

  const today = new Date().toISOString().slice(0, 10);
  const filename = `${shop.subdomain}-products-${today}.csv`;

  return new Response(exportProductsCsv(products), {
    headers: {
      // No byte order mark, deliberately. Shopify's export dialog offers a
      // plain CSV and an Excel flavoured one, and the Excel flavour differs by
      // three invisible bytes at the front. This has to diff cleanly against a
      // Shopify export, so it matches the plain one; the charset is declared in
      // the header instead, which every spreadsheet program reads.
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
