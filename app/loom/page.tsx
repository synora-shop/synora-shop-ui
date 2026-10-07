import { LoomShell } from "@/components/loom/shell";
import { LoomHero } from "@/components/loom/hero";
import { LoomTrending } from "@/components/loom/trending";
import { LoomExploreColors } from "@/components/loom/explore-colors";
import { LoomTestimonial } from "@/components/loom/testimonial";
import { LoomService } from "@/components/loom/service";
import { LoomBlog } from "@/components/loom/blog";

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
 * The 375 screen is the base and 1440 is `md:`; each was measured from its
 * own frame rather than one guessed from the other. Its sections, in order:
 *
 *   Navigation 94 · Hero 1253 · Trending 1255 · Explore by Colors 416 ·
 *   Testimoni 704 · Service 1020 · Blog 742 · Footer 838   = 6322
 *
 * How every other width is drawn is LoomShell's job — components/loom/shell.tsx.
 */
export default function LoomPage() {
  return (
    <LoomShell>
      <LoomHero />
      <LoomTrending />
      <LoomExploreColors />
      <LoomTestimonial />
      <LoomService />
      <LoomBlog />
    </LoomShell>
  );
}
