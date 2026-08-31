import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The heading block every merchant account page opens with.
 *
 * These pages are seen one at a time by someone who is part-way through
 * something — signing up, recovering an account, accepting an invitation. They
 * should read the same each time so it is obvious they belong to one flow.
 */
export function FormHeading({
  title,
  description,
}: {
  title: string;
  description?: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-balance text-ink">
        {title}
      </h1>
      {description && (
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{description}</p>
      )}
    </div>
  );
}

/** A labelled field. The label is always present — placeholders are not labels. */
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs leading-snug text-ink-soft">{hint}</span>}
    </label>
  );
}

/**
 * The result of a submission.
 *
 * Errors are `role="alert"` so a screen reader announces them without the user
 * having to go looking; successes are `role="status"`, which does not interrupt.
 */
export function FormMessage({
  tone,
  children,
  className,
}: {
  tone: "error" | "success";
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-lg border px-3 py-2 text-sm leading-snug",
        tone === "error"
          ? "border-rose/30 bg-rose-bg text-ink"
          : "border-green/30 bg-green-bg text-ink",
        className
      )}
    >
      {children}
    </p>
  );
}

/** The one-line "or do this instead" under a form. */
export function FormFooter({
  children,
}: {
  children: React.ReactNode;
}) {
  return <p className="mt-6 text-center text-sm text-ink-soft">{children}</p>;
}

export function FormLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="font-medium text-brand-600 hover:text-brand-700 underline-scribble">
      {children}
    </Link>
  );
}

/**
 * The single primary action on an account page.
 *
 * Full width and always labelled with what it does next, not "Submit". The
 * pending label is a separate string rather than a spinner alone, because on a
 * slow connection the difference between "sending" and "sent" is the only
 * feedback there is.
 */
export function SubmitButton({
  pending,
  children,
  pendingLabel,
}: {
  pending: boolean;
  children: React.ReactNode;
  pendingLabel: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
