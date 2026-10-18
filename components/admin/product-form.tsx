"use client";

import { useState } from "react";
import { FieldError, PageHeader, buttonClass } from "@/components/ui/primitives";
import { useRouter } from "next/navigation";
import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { StatePill } from "@/components/admin/kit";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
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
import { Field } from "@/components/merchant/form-shell";
import { startNavProgress } from "@/components/ui/nav-progress";

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
  variants: { id: string; size: string; color: string; colorHex: string | null; sku: string; stock: number }[];
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

export function ProductForm({
  categories,
  product,
  currency,
}: {
  categories: Category[];
  product?: ExistingProduct;
  /** The store's own currency symbol, beside every box a price is typed into. */
  currency: string;
}) {
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
    product?.variants.map((v) => ({ id: v.id, size: v.size, color: v.color, colorHex: v.colorHex ?? "#4c100f", sku: v.sku, stock: v.stock })) ?? [{ ...emptyVariant }]
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
      // A size, a colour, or both; a row with neither was never filled in.
      variants: fillSkus(title, variants).filter((v) => v.size.trim() || v.color.trim()),
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
    startNavProgress();
    router.push("/admin/products");
    router.refresh();
  }

  const sell = salePrice === "" ? basePrice : Number(salePrice);
  const profit = sell - Number(costPrice || 0);
  const margin = sell > 0 ? ((profit / sell) * 100).toFixed(0) : "0";
  const kindLabel = kindState.kind === "NORMAL" ? "Normal" : kindState.kind === "BULK" ? "Bulk" : "Made to order";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit(product ? (status === "PUBLISHED" ? "publish" : "draft") : "publish");
      }}
      className="space-y-5"
    >
      {/* The product's name and where it stands, in the screen's one bar. */}
      <PageHeader
        title={product ? title || "Untitled product" : "New product"}
        meta={<><StatePill tone={status === "DRAFT" ? "wait" : "good"}>{status === "DRAFT" ? "Draft" : "Published"}</StatePill><StatePill tone="info">{kindLabel}</StatePill>{notice && <span className="text-xs text-amber">{notice}</span>}</>}
      />

      <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="space-y-5">
          <Card title="The product">
            <Field label="Title">
              <input required value={title} onChange={(e) => setTitle(e.target.value)} className="input" />
            </Field>
            <Field label="Description">
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="input" />
            </Field>
            <Field label="Details" hint="Fabric, care instructions: anything a shopper asks before buying.">
              <textarea value={details ?? ""} onChange={(e) => setDetails(e.target.value)} rows={3} className="input" />
            </Field>
            <Field label="Web address" hint="The last part of the product's link. Left blank, it is made from the title.">
              <input value={slug} onChange={(e) => setSlug(e.target.value)} className="input" />
            </Field>
          </Card>

          <Card title="Photos" aside={`${images.length} added · drag to reorder`}>
            <ImageDropzone images={images} onChange={setImages} folder="products" label="Images" />
          </Card>

          <ProductKindFields value={kindState} onChange={setKindState} />

          <Card title="Price">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label={`Price (${currency})`}>
                <input type="number" min={0} value={basePrice} onChange={(e) => setBasePrice(Number(e.target.value))} className="input" />
              </Field>
              <Field label={`Sale price (${currency})`} hint="Leave blank to sell at the price. The price is then shown struck through.">
                <input
                  type="number"
                  min={0}
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value === "" ? "" : Number(e.target.value))}
                  className="input"
                />
              </Field>
              <Field label={`Cost per item (${currency})`} hint="Only you see this.">
                <input type="number" min={0} value={costPrice} onChange={(e) => setCostPrice(Number(e.target.value))} className="input" />
              </Field>
            </div>
            <p className={cn("text-[13px] font-medium", profit < 0 ? "text-rose" : "text-ink")}>
              Profit per item: {currency} {profit.toLocaleString("en-US")} ({margin}% margin)
            </p>
          </Card>

          {/* Sizes describe stock the customer picks from at checkout. An
              enquiry-only product has no checkout, so the section is hidden
              rather than shown empty and unexplained. */}
          <div className={enquiryOnly ? "hidden" : undefined}>
            <Card
              title="Sizes and stock"
              pad={false}
              action={
                <button
                  type="button"
                  onClick={() => setVariants((prev) => [...prev, { ...emptyVariant }])}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-[13px] font-semibold text-[#4b4bea] transition-colors hover:bg-[#ecebff]"
                >
                  <Plus className="h-4 w-4" /> Add a size
                </button>
              }
            >
              <div className="hidden grid-cols-12 gap-2 bg-[#fafafa] px-5 py-2 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-[#0a0a0a]/45 sm:grid">
                <span className="col-span-2">Size</span>
                <span className="col-span-4">Colour</span>
                <span className="col-span-3">SKU</span>
                <span className="col-span-2 text-right">In stock</span>
              </div>
              <div className="divide-y divide-[#0a0a0a]/[0.06]">
                {variants.map((v, i) => (
                  <div key={i} className="grid grid-cols-2 items-center gap-2 px-5 py-2.5 sm:grid-cols-12">
                    <input
                      placeholder="Size"
                      aria-label={`Size for variant ${i + 1}`}
                      value={v.size}
                      onChange={(e) => updateVariant(i, { size: e.target.value })}
                      className="input col-span-1 sm:col-span-2"
                    />
                    <div className="col-span-1 flex gap-2 sm:col-span-4">
                      <input
                        placeholder="Colour"
                        aria-label={`Colour for variant ${i + 1}`}
                        value={v.color}
                        onChange={(e) => updateVariant(i, { color: e.target.value })}
                        className="input min-w-0 flex-1"
                      />
                      <input
                        type="color"
                        value={v.colorHex}
                        onChange={(e) => updateVariant(i, { colorHex: e.target.value })}
                        aria-label={`Colour swatch for variant ${i + 1}`}
                        className="h-9 w-10 shrink-0 rounded border border-border"
                      />
                    </div>
                    {/* Generated from the title, size and colour as you type, so
                        the common case needs no typing at all. It stays editable:
                        a merchant migrating from another system may have codes
                        that match their warehouse labels, and those must win. */}
                    <div className="relative col-span-1 sm:col-span-3">
                      <input
                        placeholder={buildSku({ title, size: v.size, color: v.color })}
                        value={v.sku}
                        onChange={(e) => updateVariant(i, { sku: e.target.value })}
                        aria-label="SKU"
                        className="input input-sm pr-8 font-mono"
                      />
                      {v.sku && (
                        <button
                          type="button"
                          onClick={() => updateVariant(i, { sku: "" })}
                          aria-label="Use the generated SKU"
                          title="Use the generated SKU"
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-ink-faint transition-colors hover:bg-brand-50 hover:text-brand-600"
                        >
                          <RotateCcw className="h-[var(--icon-box)] w-[var(--icon-box)].5" />
                        </button>
                      )}
                    </div>
                    <input
                      type="number"
                      min={0}
                      placeholder="Stock"
                      aria-label={`Stock for variant ${i + 1}`}
                      value={v.stock}
                      onChange={(e) => updateVariant(i, { stock: Number(e.target.value) })}
                      className="input col-span-1 text-right sm:col-span-2"
                    />
                    <button
                      type="button"
                      aria-label={`Remove variant ${i + 1}`}
                      onClick={() => setVariants((prev) => prev.filter((_, idx) => idx !== i))}
                      className="col-span-1 flex items-center justify-center gap-1 rounded-lg py-2 text-sm text-ink-soft transition-colors hover:bg-rose/5 hover:text-rose sm:col-span-1 sm:py-0"
                    >
                      <Trash2 className="h-[var(--icon-box)] w-[var(--icon-box)]" />
                      <span className="sm:hidden">Remove</span>
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        <div className="space-y-5">
          <Card title="Status">
            <ToggleSwitch inline checked={isActive} onChange={setIsActive} label="Active" description="Customers can see and buy it." />
            <ToggleSwitch inline checked={isFeatured} onChange={setIsFeatured} label="Featured" description="Shown on your homepage." />
          </Card>

          <Card title="Filed under">
            <Field label="Collections" hint="A product can belong to more than one.">
              <div className="flex flex-col gap-2">
                {categories.map((c) => {
                  const isSale = c.id === saleCategory?.id;
                  const locked = isSale && onSale;
                  return (
                    <label key={c.id} className={cn("flex items-center gap-2 text-sm", locked ? "text-ink-soft" : "cursor-pointer")}>
                      <input
                        type="checkbox"
                        checked={locked || categoryIds.includes(c.id)}
                        disabled={locked}
                        onChange={() => toggleCategory(c.id)}
                        className="h-4 w-4 accent-[#6666ff]"
                      />
                      {c.name}
                      {locked && <span className="text-xs italic">(auto, discount active)</span>}
                    </label>
                  );
                })}
                {categories.length === 0 && <p className="text-xs text-ink-soft">No collections yet. Add one from Collections.</p>}
              </div>
            </Field>
          </Card>
        </div>
      </div>

      {error && <FieldError>{error}</FieldError>}

      <div className="flex gap-3">
        <button type="button" disabled={submitting !== null} onClick={() => handleSubmit("draft")} className={buttonClass("secondary", "md")}>
          {submitting === "draft" ? "Saving…" : "Save Draft"}
        </button>
        <button type="button" disabled={submitting !== null} onClick={() => handleSubmit("publish")} className={buttonClass("primary", "md")}>
          {submitting === "publish" ? "Publishing…" : "Publish"}
        </button>
      </div>
    </form>
  );
}

/** One of the editor's cards, as the new admin draws them: a quiet heading over its fields. */
function Card({
  title,
  aside,
  action,
  pad = true,
  children,
}: {
  title: string;
  aside?: string;
  action?: React.ReactNode;
  pad?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-[#0a0a0a]/[0.07]">
      <header className="flex items-center justify-between gap-3 border-b border-[#0a0a0a]/[0.06] px-5 py-3">
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#0a0a0a]/50">{title}</h2>
        {aside && <span className="text-[12.5px] text-[#0a0a0a]/45">{aside}</span>}
        {action}
      </header>
      <div className={pad ? "space-y-4 p-5" : undefined}>{children}</div>
    </section>
  );
}
