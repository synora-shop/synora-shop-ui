import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The shared vocabulary for admin surfaces.
 *
 * Before this file, every page hand-rolled its own buttons and cards from
 * utility classes. They drifted — three different border radii, four greys, two
 * ideas of what a "secondary" button looked like — and each new page inherited
 * whichever variant happened to be copied. These are the primitives to reach
 * for instead; the point is not that they are clever, but that there is exactly
 * one of each.
 *
 * Server-safe: no client hooks, so these can be used from any component.
 */

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

// Pill, not a rounded rectangle. The identity is built on full radius, and a
// button is the element a merchant meets most often, so it is where the shape
// has to be unmistakable.
const BUTTON_BASE =
  "inline-flex items-center justify-center gap-1.5 rounded-pill font-medium " +
  "transition-all duration-150 ease-out will-change-transform " +
  "hover:-translate-y-px active:translate-y-0 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 " +
  "disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  // brand-600 rather than 500: it clears AAA against white, so button labels
  // are comfortable rather than merely legal. The tinted shadow makes a
  // primary action sit above the page rather than on it.
  primary:
    "bg-brand-600 text-white shadow-brand hover:bg-brand-700 active:bg-brand-900 active:shadow-sm",
  secondary:
    "border border-border bg-surface text-ink shadow-sm hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 active:bg-brand-100",
  ghost: "text-ink-soft hover:bg-subtle hover:text-ink active:bg-brand-100",
  danger:
    "border border-rose/30 bg-rose-bg text-rose hover:border-rose hover:bg-rose hover:text-white active:bg-rose",
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: "px-3.5 py-1.5 text-xs",
  md: "px-4.5 py-2 text-sm",
};

export function buttonClass(
  variant: ButtonVariant = "secondary",
  size: ButtonSize = "md",
  className?: string
) {
  return cn(BUTTON_BASE, BUTTON_VARIANTS[variant], BUTTON_SIZES[size], className);
}

/**
 * Forwards its ref, so a caller can reach the element itself.
 *
 * Needed the first time by useSpotlight, which has to scroll one particular
 * button into view and put a class on it. React 19 passes `ref` through props,
 * so this is a type on the signature rather than forwardRef.
 */
export function Button({
  variant = "secondary",
  size = "md",
  className,
  ref,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  ref?: React.Ref<HTMLButtonElement>;
}) {
  return <button ref={ref} className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant = "secondary",
  size = "md",
  className,
  href,
  ...props
}: React.ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <Link href={href} className={buttonClass(variant, size, className)} {...props} />;
}

// ---------------------------------------------------------------------------
// Surfaces
// ---------------------------------------------------------------------------

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-xl border border-border bg-surface shadow-sm", className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * A page's introduction: what this screen is for, and what you can do to it.
 *
 * It used to print the page's name in a large heading. It no longer does, and
 * that is the change: the chrome names the page now. The heading bar carries
 * the section — "Your App" — and the navigation bar under it carries the
 * screen — "Themes" — so a third copy of the same word in the body was the
 * page telling the merchant something they had just read twice.
 *
 * `title` is still accepted, and still required, because it remains the honest
 * name of the screen and because the day this needs a heading again it should
 * not have to be reintroduced at ninety call sites. It is simply not drawn.
 *
 * With no description and no actions there is nothing left to draw, so nothing
 * is — rather than an empty row holding a gap open.
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  /** The screen's name. Not rendered — see above. */
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  void title;
  if (!description && !actions) return null;
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3", className)}>
      {description && (
        <p className="min-w-0 max-w-2xl text-sm leading-snug text-ink-soft">{description}</p>
      )}
      {actions && <div className="ml-auto flex flex-shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/**
 * One setting, or one group of them: what it is on the left, the controls on
 * the right.
 *
 * Settings screens were a column of cards, each stretched to the full width of
 * a 1500px panel around a form 380px wide — most of every card empty, and the
 * explanation stacked above the field so the eye travelled down and back for
 * each one. Side by side, the width is spent on the explanation instead of on
 * nothing, and a column of these scans as a list of decisions.
 *
 * Below lg it stacks, because at that width there is only one column to give.
 */
export function Fieldset({
  title,
  description,
  children,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-3 rounded-xl border border-border bg-surface p-4 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:gap-6",
        className
      )}
    >
      <div className="min-w-0">
        <h3 className="text-[13px] font-semibold text-ink">{title}</h3>
        {description && (
          <p className="mt-1 text-xs leading-snug text-ink-soft">{description}</p>
        )}
      </div>
      {/* Capped rather than filling the rest: a text field the width of a
          window is harder to read, not easier. */}
      <div className="min-w-0 max-w-lg space-y-3">{children}</div>
    </div>
  );
}

/**
 * The line between one part of a screen and the next.
 *
 * Screens were separating their sections with nothing but a gap, and a gap is
 * not a divider — on a page of stacked cards it reads as more of the same list.
 * A named rule says where one subject ends and another begins, and names the
 * new one while it is at it.
 *
 * The rule runs to the edge rather than stopping at the text, so the eye has a
 * full line to break on. Actions ride the right-hand end, where they belong to
 * the section being introduced rather than to the page.
 */
export function SectionDivider({
  title,
  description,
  actions,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("pt-1", className)}>
      <div className="flex items-center gap-3">
        <h2 className="flex-shrink-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
          {title}
        </h2>
        <span className="h-px flex-1 bg-border" aria-hidden />
        {actions && <div className="flex flex-shrink-0 items-center gap-2">{actions}</div>}
      </div>
      {description && (
        <p className="mt-1 max-w-2xl text-xs leading-snug text-ink-soft">{description}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Badge
// ---------------------------------------------------------------------------

type BadgeTone = "neutral" | "brand" | "good" | "warn" | "bad";

// Each tone carries a hairline border as well as a fill. A flat pastel chip
// reads as a smudge against a tinted page; the border is what makes it read as
// a deliberate object.
const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: "bg-subtle text-ink-soft ring-1 ring-inset ring-border",
  brand: "bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-300/50",
  good: "bg-green-bg text-green ring-1 ring-inset ring-green/25",
  warn: "bg-amber-bg text-amber ring-1 ring-inset ring-amber/25",
  bad: "bg-rose-bg text-rose ring-1 ring-inset ring-rose/25",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill px-2.5 py-0.5 text-[11px] font-medium",
        BADGE_TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// FieldError
// ---------------------------------------------------------------------------

/**
 * A message that has just appeared because of something the merchant did.
 *
 * Seventeen screens had written this by hand, and each had written it slightly
 * differently: some `text-sm`, some `text-xs`, most with no `role`. The last
 * one is the reason this exists rather than a convention — an error rendered
 * as a plain paragraph is silent to a screen reader, so a merchant who cannot
 * see it is simply told nothing and left wondering why the save did nothing.
 *
 * `role="alert"` announces it. `notice-in` makes it arrive: it opens its own
 * height as well as fading, so the form below slides down rather than being
 * shoved, which is how someone loses their place on a long page.
 *
 * Render it conditionally — `{error && <FieldError>{error}</FieldError>}`. The
 * animation is on mount, so a message that changes from one error to another
 * while staying mounted does not replay it; that is correct, because nothing
 * moved and nothing needs finding.
 */
export function FieldError({
  size = "sm",
  className,
  children,
}: {
  /** `sm` under a form, `xs` inside a dense row. */
  size?: "sm" | "xs";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p
      role="alert"
      className={cn(
        "notice-in leading-snug text-rose",
        size === "xs" ? "text-xs" : "text-sm",
        className
      )}
    >
      {children}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Stat
// ---------------------------------------------------------------------------

/**
 * A single number with its label.
 *
 * Figures are set in the mono face and tabular, so a column of them lines up
 * and a changing value doesn't reflow the row beside it.
 */
export function Stat({
  label,
  value,
  hint,
  tone,
  href,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: BadgeTone;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const body = (
    <>
      <div className="flex items-center gap-2">
        {Icon && (
          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600">
            <Icon className="h-3.5 w-3.5" />
          </span>
        )}
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">{label}</p>
      </div>
      <p className="mt-1.5 font-mono text-2xl font-medium tabular-nums text-ink">{value}</p>
      {hint && (
        <p className="mt-1 text-[11px] leading-snug text-ink-soft">
          {tone ? <Badge tone={tone}>{hint}</Badge> : hint}
        </p>
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group rounded-lg border border-border bg-surface p-4 shadow-sm transition-all duration-200 ease-out hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg"
      >
        {body}
      </Link>
    );
  }
  return <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">{body}</div>;
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

/**
 * What a list shows when it has nothing in it.
 *
 * An empty list that just says "No products" tells you nothing you didn't
 * already know. These take an action, because the only useful thing an empty
 * state can do is offer the first step.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-surface px-6 py-10 text-center">
      {Icon && (
        <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <Icon className="h-5 w-5" />
        </span>
      )}
      <p className="font-medium">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm leading-snug text-ink-soft">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
