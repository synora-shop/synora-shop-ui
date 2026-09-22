import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * A section of a screen — the boxes the main container is made of.
 *
 * Every screen in the panel is a stack of these, 30 design pixels apart, and
 * the global design document specifies them exactly: #f5f5f5, outlined #2e2e2e
 * at a quarter of a pixel, with a 5px black glow at 10%.
 *
 * The same tone as the page behind the main container, and deliberately. A
 * section is not raised off the container — it is a region marked out on it,
 * which is why the outline and the glow are doing the separating rather than a
 * lighter fill. There is no lighter fill available: the container is white.
 *
 * A quarter-pixel outline cannot be drawn. A device pixel is the thinnest a
 * browser will go, so the weight is carried by the alpha instead — the same
 * trick the control outline uses, for the same reason.
 *
 * `title` is the label in the corner. Optional, because a section that is one
 * obvious thing does not need telling.
 */
export function Section({
  title,
  className,
  children,
}: {
  title?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-section-line bg-section p-[var(--gap-lg)] shadow-section",
        className
      )}
    >
      {title && (
        <h2 className="mb-[var(--gap-lg)] text-[length:var(--text-normal)] text-control-ink">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

/**
 * The line every screen ends with.
 *
 * `Learn more about "Themes" here` — the global design document asks for it by
 * name, on every screen, after the last section. It goes to the documentation,
 * which is also linked in the footer of the product's own site.
 *
 * Worth having rather than worth skipping: a merchant who has read a screen and
 * still does not understand it has nowhere else to go, and the alternative is a
 * help icon per control, which is forty of them saying nothing.
 */
export function LearnMore({ about }: { about: string }) {
  return (
    <p className="py-[var(--gap-lg)] text-center text-[length:var(--text-secondary)] text-control-soft">
      Learn more about &ldquo;{about}&rdquo;{" "}
      <Link
        href="/documentation"
        className="text-brand-500 underline underline-offset-2 transition-opacity hover:opacity-80"
      >
        here
      </Link>
    </p>
  );
}
