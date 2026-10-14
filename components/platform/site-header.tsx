import Link from "next/link";
import { appUrl } from "@/lib/shop-context";
import { SynoraAppMark } from "@/components/ui/synora-marks";
import { AccountSlot } from "@/components/platform/account-slot";
import { HelpSearch, SearchButton, type SearchItem } from "@/components/platform/help-search";
import { MobileMenu } from "@/components/platform/mobile-menu";
import { SECTIONS, type HelpSection } from "@/components/platform/sections";
import { docsSearchItems, suggestedSearchItems } from "@/lib/docs-content";

/**
 * The header of the product's own site (14 October): the front page, the docs,
 * help and the release notes all wear it.
 *
 * A floating pill: the mark; Docs, Help and Release notes, each with its own
 * colour and lit on its own page; search (⌘K); and the account end (Log in
 * and Start free, or "Go to dashboard" and the avatar). On a phone the links
 * fold into a menu, except on the three help pages, which have their tab bar
 * along the bottom instead. A thin line along its foot fills as you scroll.
 *
 * It replaces the front page's earlier header, whose middle was a ticker of
 * the ways to pay: the links to the help pages needed that room more.
 */
export function SiteHeader({ active, search = [] }: { active?: HelpSection; search?: SearchItem[] }) {
  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-4">
        <div className="relative mx-auto flex max-w-[72rem] items-center justify-between gap-3 rounded-full border border-[#0d0d50]/[0.08] bg-white/85 py-2.5 pl-5 pr-2.5 shadow-[0_8px_30px_-12px_rgba(13,13,80,0.15)] backdrop-blur-md sm:pl-6">
          <Link href="/" className="shrink-0 rounded text-[#0d0d50] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6666ff] focus-visible:ring-offset-4">
            <SynoraAppMark />
          </Link>

          <nav aria-label="Help pages" className="hidden items-center gap-1 md:flex">
            {SECTIONS.map(({ id, href, label, short, dot, on }) => {
              const lit = id === active;
              return (
                <Link
                  key={id}
                  href={href}
                  aria-current={lit ? "page" : undefined}
                  className={`inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-full px-3.5 text-[13.5px] font-semibold transition-colors ${lit ? on : "text-[#0d0d50]/65 hover:bg-[#f4f4fa] hover:text-[#0d0d50]"}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                  <span className="lg:hidden">{short}</span>
                  <span className="hidden lg:inline">{label}</span>
                </Link>
              );
            })}
            <span className="mx-1 h-5 w-px bg-[#0d0d50]/10" />
            <SearchButton />
          </nav>

          <div className="flex items-center gap-1">
            <AccountSlot signup={appUrl("/merchant/signup")} login={appUrl("/merchant/login")} />
            {!active && <MobileMenu />}
          </div>

          <span aria-hidden className="lp-progress pointer-events-none absolute inset-x-8 bottom-0 h-[2px] rounded-full bg-gradient-to-r from-[#6666ff] via-[#b7b9ff] to-[#b8efd6]" />
        </div>
      </header>
      <HelpSearch items={[...docsSearchItems(), ...search]} suggested={suggestedSearchItems()} />
    </>
  );
}
