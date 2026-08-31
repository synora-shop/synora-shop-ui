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

export function Button({
  variant = "secondary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
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
      className={cn("rounded-lg border border-border bg-surface shadow-sm", className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * A page's title block.
 *
 * Every admin page had its own arrangement of heading, description and
 * actions. One component means the eye lands in the same place on every page,
 * which is most of what makes a panel feel finished.
 */
export function PageHeader({
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
    <div className={cn("flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <h1 className="text-page-title font-semibold tracking-tight text-balance">{title}</h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm leading-snug text-ink-soft">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-shrink-0 flex-wrap items-center gap-2">{actions}</div>}
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
    <div className="flex flex-col items-center rounded-lg border border-dashed border-border bg-surface px-6 py-12 text-center">
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
