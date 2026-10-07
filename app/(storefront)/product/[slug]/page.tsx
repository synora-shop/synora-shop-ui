import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { ProductCard } from "@/components/storefront/product-card";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { getThemeLayout, getKitForRequest } from "@/lib/data/theme";
import { kitBaseContext, toKitProductPage, toKitProducts } from "@/lib/data/kit-context";
import { KitPage } from "@/components/storefront/kit-page";
import { isPreview } from "@/lib/preview-mode";
import { ProductPurchasePanel } from "@/components/storefront/product-purchase-panel";
import { EnquiryPanel } from "@/components/storefront/enquiry-panel";
import { isEnquiryOnly } from "@/lib/product-kind";
import { getProductBySlug, getRelatedProducts, effectivePrice } from "@/lib/data/products";
import { getStoreSettings } from "@/lib/data/settings";
import { getSiteText, text } from "@/lib/site-text";
import { guardStorefront } from "@/lib/maintenance";
import { toGlobalEdits } from "@/lib/global-edits";
import { getCurrency } from "@/lib/data/settings";
import { ProductDescription } from "@/components/storefront/product-description";
import { productHtmlToText } from "@/lib/product-html";

export async function generateMetadata(props: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product" };
  // A merchant's own search title and description when they set one — on
  // Shopify or here — and the product's own words when they did not. Shopify
  // carries both in its CSV and this platform read neither until 3 October,
  // so every migrated product silently lost the ones it had.
  return {
    title: product.seoTitle?.trim() || product.title,
    description:
      product.seoDescription?.trim() ||
      // Never the HTML: a meta description is plain text, and handing markup
      // to the metadata API prints the tags in the search result.
      productHtmlToText(product.descriptionHtml) ||
      product.description ||
      undefined,
  };
}

export default async function ProductPage(props: PageProps<"/product/[slug]">) {
  await guardStorefront();
  const currency = await getCurrency();
  const { slug } = await props.params;

  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(
    product.categories.map((c) => c.id),
    product.id
  );
  const price = effectivePrice(product);
  const [settings, siteText, layout] = await Promise.all([
    getStoreSettings(),
    getSiteText(),
    getThemeLayout(),
  ]);
  const edits = toGlobalEdits(settings);

  // A theme with its own sections draws its product template. An enquiry-only
  // product keeps the platform's page for now: the kit's panel has Add to cart
  // and nothing to ask a question with, and a button that cannot do what it
  // says is the one thing a page must not show (docs/DESIGN.md §9).
  const live = await getKitForRequest();
  if (live && !isEnquiryOnly(product.kind)) {
    const base = await kitBaseContext();
    const ctx = {
      ...base,
      product: toKitProductPage(product as never, currency),
      products: toKitProducts(related as never, base.base),
    };
    return <KitPage kit={live.kit} templates={live.templates} name="product" ctx={ctx} preview={isPreview(await props.searchParams)} />;
  }

  return (
    <Container className="py-12">
      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images} title={product.title} />

        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-brand-500">
            {product.categories.map((c) => c.name).join(" · ")}
          </p>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-ink">{product.title}</h1>

          <div className="mt-6">
            {isEnquiryOnly(product.kind) ? (
              <EnquiryPanel currency={currency} product={product} />
            ) : (
            <ProductPurchasePanel
              stickyBuyBar={layout.stickyBuyBar}
              productId={product.id}
              slug={product.slug}
              title={product.title}
              image={product.images[0] ?? ""}
              price={price}
              variants={product.variants}
              whatsappNumber={settings.whatsappNumber}
              showInventoryCount={settings.showInventoryCount}
              lowStockThreshold={settings.lowStockThreshold}
              lowStockBadgeText={settings.lowStockBadgeText}
              whatsappOrderButton={settings.whatsappOrderButton}
              addToCartLabel={text(siteText, "product.addToCart")}
              addedToCartLabel={text(siteText, "product.addedToCart")}
              buyNowLabel={text(siteText, "product.buyNow")}
              orderViaWhatsAppLabel={text(siteText, "product.orderViaWhatsApp")}
            />
            )}
          </div>

          <div className="mt-10 space-y-4 border-t border-border pt-6">
            <div>
              <h2 className="text-sm font-semibold text-ink">Description</h2>
              <ProductDescription
                html={product.descriptionHtml}
                text={product.description}
                className="mt-1 whitespace-pre-line text-sm text-ink-soft"
              />
            </div>
            {product.details && (
              <div>
                <h2 className="text-sm font-semibold text-ink">Details</h2>
                <p className="mt-1 whitespace-pre-line text-sm text-ink-soft">{product.details}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="font-serif text-2xl font-semibold text-ink">You may also like</h2>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} currency={currency} product={p} layout={layout.productCard} features={layout} saleBadgeLabel={text(siteText, "product.saleBadge")} edits={edits} />
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}
