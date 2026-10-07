import { LoomNavbar } from "@/components/loom/navbar";
import { LoomNavigation } from "@/components/loom/navigation";
import { LoomHero } from "@/components/loom/hero";
import { LoomTrending } from "@/components/loom/trending";
import { LoomExploreColors } from "@/components/loom/explore-colors";
import { LoomTestimonial } from "@/components/loom/testimonial";
import { LoomService } from "@/components/loom/service";
import { LoomBlog } from "@/components/loom/blog";
import { LoomFooter } from "@/components/loom/footer";

/**
 * The Loom reference page — the kit's home screen, rebuilt from the file.
 *
 * Deliberately not wired to Synora. It is the measuring stick: the sections
 * live here at their exact Figma geometry so that the theme's real renderers
 * can be checked against something, rather than against a memory of a
 * screenshot. The order and heights are the file's own:
 *
 *   Navbar 64 · Navigation 80 · Hero 1192 · Trending 1058 ·
 *   Explore by Colors 210 · Testimoni 636 · Service 558 · Blog 555 ·
 *   Footer 341   = 4694
 *
 * The 375 screen is the base and 1440 is `lg:`; each was measured from its
 * own frame rather than one guessed from the other. Its sections, in order:
 *
 *   Navigation 94 · Hero 1253 · Trending 1255 · Explore by Colors 416 ·
 *   Testimoni 704 · Service 1020 · Blog 742 · Footer 838   = 6322
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
 */
export default function LoomPage() {
  return (
    <main className="mx-auto w-[calc(375*var(--u))] [--u:min(calc(100cqw/375),1.2px)] md:w-[calc(1440*var(--u))] md:[--u:min(calc(100cqw/1440),1px)]">
      <LoomNavbar />
      <LoomNavigation />
      <LoomHero />
      <LoomTrending />
      <LoomExploreColors />
      <LoomTestimonial />
      <LoomService />
      <LoomBlog />
      <LoomFooter />
    </main>
  );
}
