import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { ProductCard } from "@/components/storefront/product-card";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { ProductPurchasePanel } from "@/components/storefront/product-purchase-panel";
import { EnquiryPanel } from "@/components/storefront/enquiry-panel";
import { isEnquiryOnly } from "@/lib/product-kind";
import { getProductBySlug, getRelatedProducts, effectivePrice } from "@/lib/data/products";
import { getStoreSettings } from "@/lib/data/settings";
import { getSiteText, text } from "@/lib/site-text";
import { guardStorefront } from "@/lib/maintenance";
import { toGlobalEdits } from "@/lib/global-edits";

export async function generateMetadata(props: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  return { title: product?.title ?? "Product" };
}

export default async function ProductPage(props: PageProps<"/product/[slug]">) {
  await guardStorefront();
  const { slug } = await props.params;

  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(
    product.categories.map((c) => c.id),
    product.id
  );
  const price = effectivePrice(product);
  const [settings, siteText] = await Promise.all([getStoreSettings(), getSiteText()]);
  const edits = toGlobalEdits(settings);

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
              <EnquiryPanel product={product} />
            ) : (
            <ProductPurchasePanel
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
              <p className="mt-1 whitespace-pre-line text-sm text-ink-soft">{product.description}</p>
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
              <ProductCard key={p.id} product={p} saleBadgeLabel={text(siteText, "product.saleBadge")} edits={edits} />
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}
