import { LoomTemplateView } from "@/components/loom/template";
import { FOOTER_GROUP, HEADER_GROUP } from "@/components/loom/templates";
import { DEMO_MENUS } from "@/components/loom/demo-menus";
import type { LoomContext } from "@/components/loom/contract";
import { SHOES } from "@/components/loom/catalogue";
import { cn } from "@/lib/utils";
import { T } from "@/components/loom/type";

/**
 * The frame every Loom page sits in: the header rows above, the footer below,
 * and `<main>`, which is where the page's unit is set.
 *
 * The kit draws nothing between or beyond the two, so every length is a
 * number of `--u` — one design pixel at the current width:
 *
 *   under 768   the phone design, scaled to the screen: --u = width / 375,
 *               capped at 1.2px, so 320–450 is the 375 design at its own
 *               proportions and anything wider centres a 450 column
 *   768 and up  the desktop design, scaled the same way: --u = width / 1440,
 *               capped at 1px, so 1440 is exact and wider screens centre it
 *
 * At 375 and at 1440 --u is exactly 1px and the page is the file.
 *
 * Every page is `<LoomShell>` around its own sections, so the header, the
 * footer and the unit are the same object on all of them rather than a copy
 * per page that can drift.
 *
 * `checkout` is the one exception: the menus, search and footer are links
 * away from paying, so the checkout keeps only the wordmark and the way back
 * to the cart — the phone header's own height and gutter on both sizes' terms.
 */
export function LoomShell({
  children,
  checkout = false,
}: {
  children: React.ReactNode;
  checkout?: boolean;
}) {
  // The demo shop's data. Ported, this is the shop's own menus, read once per
  // request and handed to every section — no section fetches.
  const ctx: LoomContext = { menus: DEMO_MENUS, products: SHOES };
  return (
    <main className="mx-auto w-[calc(375*var(--u))] [--u:min(calc(100cqw/375),1.2px)] md:w-[calc(1440*var(--u))] md:[--u:min(calc(100cqw/1440),1px)]">
      {checkout ? (
        <div className="mb-[calc(24*var(--u))] flex h-[calc(94*var(--u))] items-center justify-between border-b border-black/5 px-[calc(24*var(--u))] pb-[calc(24*var(--u))] pt-[calc(40*var(--u))] md:mb-[calc(40*var(--u))] md:h-[calc(80*var(--u))] md:px-[calc(60*var(--u))] md:py-0">
          <a href="/loom" className="whitespace-nowrap text-[max(calc(24*var(--u)),19.2px)] font-extrabold leading-[max(calc(30*var(--u)),24px)] text-black">
            ECOMMERCE
          </a>
          <a href="/loom/cart" className={cn(T.small, "text-black/50 underline underline-offset-4")}>
            Back to cart
          </a>
        </div>
      ) : (
        <LoomTemplateView template={HEADER_GROUP} ctx={ctx} />
      )}
      {children}
      {!checkout && <LoomTemplateView template={FOOTER_GROUP} ctx={ctx} />}
    </main>
  );
}
