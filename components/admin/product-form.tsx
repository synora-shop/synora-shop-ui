"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { saveProduct, type ProductInput, type VariantInput } from "@/app/admin/products/actions";
import { ImageDropzone } from "@/components/admin/image-dropzone";
import { ProductKindFields, type KindState } from "@/components/admin/product-kind-fields";
import { buildSku, fillSkus } from "@/lib/sku";
import {
  isEnquiryOnly,
  parseCustomFields,
  parseTiers,
  type BulkPricing,
  type ProductKind,
} from "@/lib/product-kind";
import { cn } from "@/lib/utils";

type Category = { id: string; name: string; slug: string };

type ExistingProduct = {
  id: string;
  title: string;
  slug: string;
  description: string;
  details: string | null;
  images: string[];
  basePrice: number;
  salePrice: number | null;
  costPrice: number;
  categories: { id: string }[];
  isFeatured: boolean;
  isActive: boolean;
  status: "DRAFT" | "PUBLISHED";
  variants: { size: string; color: string; colorHex: string | null; sku: string; stock: number }[];
  kind: string;
  bulkPricing: string;
  minOrderQuantity: number | null;
  bulkPriceMin: number | null;
  bulkPriceMax: number | null;
  bulkTiers: unknown;
  customFields: unknown;
  enquiryUrl: string | null;
};

const emptyVariant: VariantInput = { size: "", color: "", colorHex: "#4b45e0", sku: "", stock: 15 };

export function ProductForm({ categories, product }: { categories: Category[]; product?: ExistingProduct }) {
  const router = useRouter();
  const [title, setTitle] = useState(product?.title ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [details, setDetails] = useState(product?.details ?? "");
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [basePrice, setBasePrice] = useState(product?.basePrice ?? 0);
  const [salePrice, setSalePrice] = useState(product?.salePrice ?? ("" as number | ""));
  const [costPrice, setCostPrice] = useState(product?.costPrice ?? 0);
  const [categoryIds, setCategoryIds] = useState<string[]>(
    product?.categories.map((c) => c.id) ?? []
  );
  const [kindState, setKindState] = useState<KindState>({
    kind: (product?.kind as ProductKind) ?? "NORMAL",
    bulkPricing: (product?.bulkPricing as BulkPricing) ?? "HIDDEN",
    minOrderQuantity: product?.minOrderQuantity ?? "",
    bulkPriceMin: product?.bulkPriceMin ?? "",
    bulkPriceMax: product?.bulkPriceMax ?? "",
    tiers: parseTiers(product?.bulkTiers),
    customFields: parseCustomFields(product?.customFields),
    enquiryUrl: product?.enquiryUrl ?? "",
  });
  const enquiryOnly = isEnquiryOnly(kindState.kind);
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false);
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [variants, setVariants] = useState<VariantInput[]>(
    product?.variants.map((v) => ({ ...v, colorHex: v.colorHex ?? "#4c100f" })) ?? [{ ...emptyVariant }]
  );
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">(product?.status ?? "DRAFT");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<"draft" | "publish" | null>(null);

  function updateVariant(index: number, patch: Partial<VariantInput>) {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }

  // A discount always implies the Sale category and vice versa — the checkbox below is
  // locked (checked + disabled) while this is true; the server (saveProduct) is the actual
  // source of truth for adding/removing Sale membership, this is just a visual reflection.
  const saleCategory = categories.find((c) => c.slug === "sale");
  const onSale = salePrice !== "" && Number(salePrice) > 0 && Number(salePrice) < Number(basePrice);

  function toggleCategory(id: string) {
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  async function handleSubmit(intent: "draft" | "publish") {
    setSubmitting(intent);
    setError(null);
    setNotice(null);

    const input: ProductInput = {
      id: product?.id,
      title,
      slug,
      description,
      details,
      images,
      basePrice: Number(basePrice),
      salePrice: salePrice === "" ? null : Number(salePrice),
      costPrice: Number(costPrice),
      categoryIds,
      isFeatured,
      isActive,
      variants: fillSkus(title, variants).filter((v) => v.size && v.color),
      kind: kindState.kind,
      bulkPricing: kindState.bulkPricing,
      minOrderQuantity: kindState.minOrderQuantity === "" ? null : kindState.minOrderQuantity,
      bulkPriceMin: kindState.bulkPriceMin === "" ? null : kindState.bulkPriceMin,
      bulkPriceMax: kindState.bulkPriceMax === "" ? null : kindState.bulkPriceMax,
      tiers: kindState.tiers,
      customFields: kindState.customFields,
      enquiryUrl: kindState.enquiryUrl,
      intent,
    };

    const result = await saveProduct(input);
    if ("error" in result) {
      setError(result.error);
      setSubmitting(null);
      return;
    }
    if (result.downgradedToDraft) {
      // Saved, but the admin isn't taken away — they can see what's still missing and keep going.
      setStatus(result.status);
      setNotice(`Saved as draft, ${result.downgradedToDraft}`);
      setSubmitting(null);
      router.refresh();
      return;
    }
    router.push("/admin/products");
    router.refresh();
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit(product ? (status === "PUBLISHED" ? "publish" : "draft") : "publish");
      }}
      className="space-y-8"
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-medium uppercase",
            status === "DRAFT" ? "bg-amber-bg text-amber" : "bg-green-bg text-green"
          )}
        >
          {status === "DRAFT" ? "Draft" : "Published"}
        </span>
        {notice && <span className="text-xs text-amber">{notice}</span>}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase text-ink-soft">Title</label>
            <input required value={title} onChange={(e) => setTitle(e.target.value)} className="input mt-1" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-ink-soft">
              Slug (auto-generated from title if left blank)
            </label>
            <input value={slug} onChange={(e) => setSlug(e.target.value)} className="input mt-1" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-ink-soft">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="input mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-ink-soft">
              Details (fabric, care instructions)
            </label>
            <textarea
              value={details ?? ""}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              className="input mt-1"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase text-ink-soft">Base Price (PKR)</label>
              <input
                type="number"
                min={0}
                value={basePrice}
                onChange={(e) => setBasePrice(Number(e.target.value))}
                className="input mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-ink-soft">
                Sale Price (optional)
              </label>
              <input
                type="number"
                min={0}
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value === "" ? "" : Number(e.target.value))}
                className="input mt-1"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase text-ink-soft">
              Cost Price (PKR), hidden from customers
            </label>
            <input
              type="number"
              min={0}
              value={costPrice}
              onChange={(e) => setCostPrice(Number(e.target.value))}
              className="input mt-1"
            />
            <p className="mt-1 text-xs text-ink-soft">
              What you pay per unit. Used only for profit calculations in the admin panel,
              customers never see this.{" "}
              {(() => {
                const sell = salePrice === "" ? basePrice : Number(salePrice);
                const profit = sell - Number(costPrice || 0);
                const margin = sell > 0 ? ((profit / sell) * 100).toFixed(0) : "0";
                return (
                  <span className={profit < 0 ? "font-medium text-rose" : "font-medium text-ink"}>
                    Profit per unit: PKR {profit.toLocaleString()} ({margin}% margin)
                  </span>
                );
              })()}
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase text-ink-soft">
              Categories (a product can belong to more than one)
            </label>
            <div className="mt-1 flex flex-wrap gap-3 rounded-lg border border-border p-3">
              {categories.map((c) => {
                const isSale = c.id === saleCategory?.id;
                const locked = isSale && onSale;
                return (
                  <label
                    key={c.id}
                    className={cn(
                      "flex items-center gap-2 text-sm",
                      locked ? "text-ink-soft" : "cursor-pointer"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={locked || categoryIds.includes(c.id)}
                      disabled={locked}
                      onChange={() => toggleCategory(c.id)}
                    />
                    {c.name}
                    {locked && <span className="text-xs italic">(auto, discount active)</span>}
                  </label>
                );
              })}
              {categories.length === 0 && (
                <p className="text-xs text-ink-soft">No categories yet, add one from the Categories page.</p>
              )}
            </div>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
              Featured (shown on homepage)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Active (visible in store)
            </label>
          </div>

          <ImageDropzone images={images} onChange={setImages} folder="products" label="Images" />
        </div>
      </div>

      <ProductKindFields value={kindState} onChange={setKindState} />

      {/* Variants describe stock the customer picks from at checkout. An
          enquiry-only product has no checkout, so the section is hidden rather
          than shown empty and unexplained. */}
      <div className={enquiryOnly ? "hidden" : undefined}>
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-semibold">Variants (size / color / stock)</h2>
          <button
            type="button"
            onClick={() => setVariants((prev) => [...prev, { ...emptyVariant }])}
            className="flex items-center gap-1 rounded px-2 py-1 text-sm text-brand-600 transition-colors hover:bg-brand-50 active:bg-brand-100"
          >
            <Plus className="h-4 w-4" /> Add Variant
          </button>
        </div>

        <div className="mt-3 space-y-2">
          {variants.map((v, i) => (
            <div
              key={i}
              className="grid grid-cols-2 items-center gap-2 rounded-lg border border-border p-2 sm:grid-cols-12 sm:border-0 sm:p-0"
            >
              <input
                placeholder="Size"
                value={v.size}
                onChange={(e) => updateVariant(i, { size: e.target.value })}
                className="input col-span-1 sm:col-span-2"
              />
              <input
                placeholder="Color"
                value={v.color}
                onChange={(e) => updateVariant(i, { color: e.target.value })}
                className="input col-span-1 sm:col-span-3"
              />
              <input
                type="color"
                value={v.colorHex}
                onChange={(e) => updateVariant(i, { colorHex: e.target.value })}
                className="col-span-1 h-9 w-full rounded border border-border sm:col-span-1"
              />
              {/* Generated from the title, size and colour as you type, so the
                  common case needs no typing at all. It stays editable: a
                  merchant migrating from another system may have codes that
                  match their warehouse labels, and those must win. */}
              <div className="relative col-span-1 sm:col-span-3">
                <input
                  placeholder={buildSku({ title, size: v.size, color: v.color })}
                  value={v.sku}
                  onChange={(e) => updateVariant(i, { sku: e.target.value })}
                  aria-label="SKU"
                  className="input pr-8 font-mono text-xs"
                />
                {v.sku && (
                  <button
                    type="button"
                    onClick={() => updateVariant(i, { sku: "" })}
                    aria-label="Use the generated SKU"
                    title="Use the generated SKU"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-ink-faint transition-colors hover:bg-brand-50 hover:text-brand-600"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <input
                type="number"
                min={0}
                placeholder="Stock"
                value={v.stock}
                onChange={(e) => updateVariant(i, { stock: Number(e.target.value) })}
                className="input col-span-1 sm:col-span-2"
              />
              <button
                type="button"
                onClick={() => setVariants((prev) => prev.filter((_, idx) => idx !== i))}
                className="col-span-1 flex items-center justify-center gap-1 rounded border border-border py-2 text-sm text-ink-soft transition-colors hover:border-rose hover:bg-rose/5 hover:text-rose active:bg-rose/10 active:text-rose sm:col-span-1 sm:border-0 sm:py-0"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sm:hidden">Remove</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-rose">{error}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          disabled={submitting !== null}
          onClick={() => handleSubmit("draft")}
          className="rounded-full border border-border px-6 py-3 text-sm font-medium text-ink-soft transition-colors hover:bg-subtle active:bg-brand-100 disabled:opacity-50"
        >
          {submitting === "draft" ? "Saving…" : "Save Draft"}
        </button>
        <button
          type="button"
          disabled={submitting !== null}
          onClick={() => handleSubmit("publish")}
          className="rounded-full bg-brand-500 px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-600 active:bg-brand-700 disabled:opacity-50"
        >
          {submitting === "publish" ? "Publishing…" : "Publish"}
        </button>
      </div>
    </form>
  );
}
