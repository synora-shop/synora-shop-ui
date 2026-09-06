import { db } from "@/lib/data/shop";
import { PageCrumb } from "@/components/admin/page-crumb";
import { getStoreSettings } from "@/lib/data/settings";
import { currencySymbol, resolveStoreDefaults } from "@/lib/store-defaults";
import { ProductForm } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await (await db()).category.findMany({ orderBy: { name: "asc" } });
  const defaults = resolveStoreDefaults(await getStoreSettings());

  return (
    <div>
      {/* The chrome names the screen; this names the record being made. */}
      <PageCrumb label="New" />
      <div>
        <ProductForm categories={categories} currency={currencySymbol(defaults.currency)} />
      </div>
    </div>
  );
}
