import { ExternalLink, Package, Ruler } from "lucide-react";
import { formatPKR } from "@/lib/utils";
import { safeAssetUrl } from "@/lib/icon-validation";
import { validateUrl } from "@/lib/url-validation";
import {
  PRODUCT_KIND_META,
  parseCustomFields,
  parseTiers,
  priceDisplay,
  type ProductKind,
} from "@/lib/product-kind";
import { EnquiryForm } from "./enquiry-form";

/**
 * What a bulk or made-to-order product shows where the buy button would be.
 *
 * The order matters: what it costs, then what the minimum is, then how to ask.
 * A buyer's first question is the price, and burying that under a form is how
 * enquiry pages lose people who would have bought.
 */
export function EnquiryPanel({
  product,
}: {
  product: {
    id: string;
    title: string;
    kind: string;
    bulkPricing: string;
    minOrderQuantity: number | null;
    bulkPriceMin: number | null;
    bulkPriceMax: number | null;
    bulkTiers: unknown;
    customFields: unknown;
    enquiryUrl: string | null;
  };
}) {
  const kind = (product.kind as ProductKind) ?? "BULK";
  const meta = PRODUCT_KIND_META[kind] ?? PRODUCT_KIND_META.BULK;
  const tiers = parseTiers(product.bulkTiers);
  const fields = parseCustomFields(product.customFields);
  const display = priceDisplay(product);

  // Checked again at render, not merely when it was saved. This value becomes
  // an href on a public page, and a row could have been written before the
  // validation existed or edited by another route.
  const externalRaw = product.enquiryUrl?.trim() ?? "";
  const external = externalRaw
    ? (() => {
        const check = validateUrl(externalRaw, { allowEmpty: false, allowInternal: true });
        return check.ok ? (safeAssetUrl(check.href) ?? null) : null;
      })()
    : null;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-surface p-5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-600">
          {kind === "CUSTOM" ? <Ruler className="h-3 w-3" /> : <Package className="h-3 w-3" />}
          {meta.badge}
        </span>

        <div className="mt-3">
          {display.mode === "range" && (
            <>
              <p className="font-mono text-2xl font-medium tabular-nums">
                {formatPKR(display.min)}, {formatPKR(display.max)}
              </p>
              <p className="mt-0.5 text-xs text-ink-soft">per unit, depending on quantity and spec</p>
            </>
          )}
          {display.mode === "from" && (
            <>
              <p className="font-mono text-2xl font-medium tabular-nums">
                From {formatPKR(display.unitPrice)}
              </p>
              <p className="mt-0.5 text-xs text-ink-soft">
                per unit at {display.minQty}+ units
              </p>
            </>
          )}
          {display.mode === "onRequest" && (
            <>
              <p className="text-2xl font-medium">{display.label}</p>
              <p className="mt-0.5 text-xs text-ink-soft">
                Tell us what you need and we&apos;ll come back with a quote.
              </p>
            </>
          )}
        </div>

        {product.minOrderQuantity ? (
          <p className="mt-3 inline-flex rounded-lg bg-subtle px-2.5 py-1 text-xs text-ink-soft">
            Minimum order&nbsp;
            <span className="font-mono font-medium tabular-nums text-ink">
              {product.minOrderQuantity}
            </span>
            &nbsp;units
          </p>
        ) : null}

        {tiers.length > 0 && (
          <table className="mt-4 w-full text-sm">
            <caption className="mb-1.5 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
              Price per unit
            </caption>
            <tbody className="divide-y divide-border">
              {tiers.map((tier, i) => (
                <tr key={tier.minQty}>
                  <td className="py-1.5 text-ink-soft">
                    {i === tiers.length - 1
                      ? `${tier.minQty}+ units`
                      : `${tier.minQty},${tiers[i + 1].minQty - 1} units`}
                  </td>
                  <td className="py-1.5 text-right font-mono tabular-nums">
                    {formatPKR(tier.unitPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {external ? (
        <a
          href={external}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-700 active:bg-brand-900 sm:w-auto"
        >
          Enquire about this product
          <ExternalLink className="h-4 w-4" />
        </a>
      ) : (
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold">Ask about this product</h2>
          <p className="mt-1 text-xs leading-snug text-ink-soft">
            {kind === "CUSTOM"
              ? "Send us your measurements and we'll confirm price and timeline."
              : "Tell us your quantity and we'll come back with a price."}
          </p>
          <div className="mt-4">
            <EnquiryForm
              productId={product.id}
              productTitle={product.title}
              minOrderQuantity={product.minOrderQuantity}
              askQuantity={kind === "BULK"}
              customFields={fields}
            />
          </div>
        </div>
      )}
    </div>
  );
}
