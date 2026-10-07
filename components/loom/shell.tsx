import { LoomNavbar } from "@/components/loom/navbar";
import { LoomNavigation } from "@/components/loom/navigation";
import { LoomFooter } from "@/components/loom/footer";

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
 */
export function LoomShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto w-[calc(375*var(--u))] [--u:min(calc(100cqw/375),1.2px)] md:w-[calc(1440*var(--u))] md:[--u:min(calc(100cqw/1440),1px)]">
      <LoomNavbar />
      <LoomNavigation />
      {children}
      <LoomFooter />
    </main>
  );
}
