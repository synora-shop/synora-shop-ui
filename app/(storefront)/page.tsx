import { getOrCreateHomePage } from "@/lib/data/pages";
import { PageSections } from "@/components/storefront/page-sections";
import { isPreview } from "@/lib/preview-mode";
import { guardStorefront } from "@/lib/maintenance";
import { getKitForRequest } from "@/lib/data/theme";
import { kitBaseContext, toKitProducts } from "@/lib/data/kit-context";
import { getProducts } from "@/lib/data/products";
import { storefrontCatalog } from "@/lib/data/section-context";
import { currentShopId } from "@/lib/data/shop";
import { KitPage } from "@/components/storefront/kit-page";

// Always reflect the latest catalog/admin edits rather than a build-time snapshot.
export const dynamic = "force-dynamic";

export default async function HomePage(props: PageProps<"/">) {

  await guardStorefront();

  // A theme with its own sections draws its own home page — the shop's
  // featured products, or its newest when none are featured, as the products
  // its sections list.
  const live = await getKitForRequest();
  if (live) {
    // The shop's cached catalogue (lib/data/section-context.ts): the same rows
    // for every visitor, read once per shop per five minutes instead of three
    // queries per page view. `newest` may be missing from an entry cached
    // before it was added; the fallback covers those five minutes.
    const [base, catalog] = await Promise.all([kitBaseContext(), storefrontCatalog(await currentShopId())]);
    const rows = catalog.featured.length
      ? catalog.featured
      : (catalog.newest ?? (await getProducts({ sort: "newest" }, { perPage: 8 })).products);
    return <KitPage kit={live.kit} templates={live.templates} name="index" ctx={{ ...base, products: toKitProducts(rows as never, base.base) }} preview={isPreview(await props.searchParams)} />;
  }

  const page = await getOrCreateHomePage();

  return <PageSections sections={page.sections} preview={isPreview(await props.searchParams)} />;
}
