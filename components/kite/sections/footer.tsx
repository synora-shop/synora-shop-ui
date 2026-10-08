import { cn } from "@/lib/utils";
import { menu, on, str, type KiteContext } from "@/components/kite/contract";
import { kt } from "@/components/kite/type";

/**
 * The footer — "MacBook Pro 16" - 11" in the file, from where the Journey
 * photograph ends (130 into that screen), so 987 high and every position
 * the file's less 130:
 *
 *   at 32,338   the shop's name in the serif 32 capitals with a 48 rule 8
 *               after, two more lines under it (48 each, 613 wide), 32
 *               below, the words (SF Pro Light 16)
 *   at 937,428  300 wide, right-aligned: EMAIL at 80%, the line it is
 *               written on 51 down, 32 below, GET EXCLUSIVE DEALS underlined
 *               (20)
 *   at 1529,444 the links, underlined (16), 32 apart
 *   at 32,938 / right 32,938  the small print and the contact (14)
 *
 * The sign-up has nothing behind it yet — the same as Loom's (docs/KITE.md).
 * The desktop's, as the file draws it; phones get the plain one first above.
 */
export function KiteFooter({ data, ctx }: { data: Record<string, unknown>; ctx: KiteContext }) {
  const links = menu(data, "menu", ctx);
  const serif = kt("serif", 32);
  return (
    <>
    {/* Phones: the file draws no phone footer, so this is the plainest one in
        Kite's own terms (decided 8 October) — the header's double rule, the
        same links (SF Pro Light 16, underlined, 16 apart), the small print and
        the contact (14), all in the phone's 16 margin. */}
    <footer data-k="footer-phone" className="relative flex flex-col gap-[calc(32*var(--u))] px-[calc(16*var(--u))] pb-[calc(32*var(--u))] pt-[calc(38*var(--u))] md:hidden">
      <div aria-hidden className="absolute inset-x-0 top-[calc(-0.5*var(--u))] h-px bg-[#f4f3f1]" />
      <div aria-hidden className="absolute inset-x-0 top-[calc(5.5*var(--u))] h-px bg-[#f4f3f1]" />
      {links.length ? (
        <nav aria-label="Footer" className="flex flex-col items-start gap-[calc(16*var(--u))]">
          {links.map((l) => (
            <a key={l.id} href={l.href || undefined} {...kt("sans", 16)} className={cn(kt("sans", 16).className, l.href && "underline")}>
              {l.label}
            </a>
          ))}
        </nav>
      ) : null}
      <div className="flex flex-col gap-[calc(8*var(--u))]">
        <p {...kt("sans", 14)}>{str(data, "smallPrint")}</p>
        <p {...kt("sans", 14)}>{str(data, "contact")}</p>
      </div>
    </footer>
    <footer data-k="footer" className="relative hidden h-[calc(987*var(--u))] md:block">
      <div className="absolute left-[calc(32*var(--u))] top-[calc(338*var(--u))] flex w-[calc(613*var(--u))] flex-col gap-[calc(32*var(--u))]">
        <div className="uppercase">
          <div className="flex items-center gap-[calc(8*var(--u))]">
            <p {...serif}>{str(data, "name")}</p>
            <span aria-hidden className="h-px w-[calc(48*var(--u))] bg-[#f4f3f1]" />
          </div>
          {/* Single lines in the file: never wrapped, though the stand-in serif is wider. */}
          <p {...serif} className={cn(serif.className, "whitespace-nowrap")}>{str(data, "line1")}</p>
          <p {...serif} className={cn(serif.className, "whitespace-nowrap")}>{str(data, "line2")}</p>
        </div>
        <p {...kt("sans", 16)}>{str(data, "text")}</p>
      </div>

      {on(data, "showSignup") ? (
        <form className="absolute left-[calc(937*var(--u))] top-[calc(428*var(--u))] flex w-[calc(300*var(--u))] flex-col items-end gap-[calc(32*var(--u))]">
          <label className="relative block h-[calc(51*var(--u))] w-full">
            <span {...kt("sans", 16)} className={cn(kt("sans", 16).className, "absolute left-0 top-0 opacity-80")}>{str(data, "signupLabel")}</span>
            <input type="email" name="email" aria-label={str(data, "signupLabel")} className="absolute inset-x-0 bottom-0 h-[calc(30*var(--u))] w-full bg-transparent text-[#f4f3f1] outline-none" />
            <span aria-hidden className="absolute inset-x-0 bottom-[calc(-0.5*var(--u))] h-px bg-[#f4f3f1]" />
          </label>
          <button type="button" {...kt("sans", 20)} className={cn(kt("sans", 20).className, "underline")}>
            {str(data, "signupButton")}
          </button>
        </form>
      ) : null}

      {links.length ? (
        // Anchored by its right edge (32 in — the file's 1529 + 167): on a small
        // laptop the reading floor makes the links wider than their scaled
        // box, and anchored at the left they ran off the page.
        <nav aria-label="Footer" className="absolute right-[calc(32*var(--u))] top-[calc(444*var(--u))] flex min-w-[calc(167*var(--u))] flex-col items-start gap-[calc(32*var(--u))]">
          {links.map((l) => (
            <a key={l.id} href={l.href || undefined} {...kt("sans", 16)} className={cn(kt("sans", 16).className, "whitespace-nowrap", l.href && "underline")}>
              {l.label}
            </a>
          ))}
        </nav>
      ) : null}

      <p {...kt("sans", 14)} className={cn(kt("sans", 14).className, "absolute left-[calc(32*var(--u))] top-[calc(938*var(--u))]")}>{str(data, "smallPrint")}</p>
      <p {...kt("sans", 14)} className={cn(kt("sans", 14).className, "absolute right-[calc(32*var(--u))] top-[calc(938*var(--u))]")}>{str(data, "contact")}</p>
    </footer>
    </>
  );
}
