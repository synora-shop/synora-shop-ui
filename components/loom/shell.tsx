import { LoomTemplateView } from "@/components/loom/template";
import { FOOTER_GROUP, HEADER_GROUP } from "@/components/loom/templates";
import type { LoomContext } from "@/components/loom/contract";
import { demoContext } from "@/components/loom/demo";
import { cn } from "@/lib/utils";
import { T } from "@/components/loom/type";
import { tx } from "@/components/loom/text";

/**
 * What every reference page sits in: the header rows above, the footer below.
 * The font, the unit and `<main>` are LoomFrame's (components/loom/frame.tsx).
 *
 * `checkout` is the one exception: the menus, search and footer are links
 * away from paying, so the checkout keeps only the wordmark and the way back
 * to the cart.
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
  const ctx: LoomContext = demoContext();
  return (
    <>
      {checkout ? (
        <div className="mb-[calc(24*var(--u))] flex h-[calc(94*var(--u))] items-center justify-between border-b border-black/5 px-[calc(24*var(--u))] pb-[calc(24*var(--u))] pt-[calc(40*var(--u))] md:mb-[calc(40*var(--u))] md:h-[calc(80*var(--u))] md:px-[calc(60*var(--u))] md:py-0">
          <a href={ctx.routes.home} className="whitespace-nowrap text-[max(calc(24*var(--u)),19.2px)] font-extrabold leading-[max(calc(30*var(--u)),24px)] text-black">
            ECOMMERCE
          </a>
          <a href={ctx.routes.cart} className={cn(T.small, "text-black/50 underline underline-offset-4")}>
            {tx(ctx, "checkout.backToCart")}
          </a>
        </div>
      ) : (
        <LoomTemplateView template={HEADER_GROUP} ctx={ctx} />
      )}
      {children}
      {!checkout && <LoomTemplateView template={FOOTER_GROUP} ctx={ctx} />}
    </>
  );
}
