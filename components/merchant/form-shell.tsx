import Link from "next/link";
import { InfoPopover } from "@/components/ui/info-popover";
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
      <h1 className="text-[2.25rem] font-semibold leading-[1.05] tracking-[-0.035em] text-balance text-[#0d0d50]">
        {title}
      </h1>
      {description && (
        <p className="mt-2.5 text-[15px] leading-relaxed text-[#0d0d50]/60">{description}</p>
      )}
    </div>
  );
}

/**
 * The one label style for a form control, anywhere in the panel.
 *
 * `Field` wraps its control and needs no id; this one is for the cases that
 * cannot wrap — a control with an info popover beside its label, because a
 * button inside a `<label>` is invalid and would steal the click that should
 * have gone to the input.
 */
export function FieldLabel({
  htmlFor,
  info,
  children,
}: {
  /**
   * The control this names. Leave it out only when there is no single control
   * to name — a gallery, a drop zone — and it renders as a caption instead: a
   * `<label>` pointing at nothing is worse than no label at all, because a
   * screen reader announces it and then lands the user somewhere unrelated.
   */
  htmlFor?: string;
  info?: string;
  children: React.ReactNode;
}) {
  const text = "text-sm font-medium text-ink";
  return (
    <div className="mb-1.5 flex items-center gap-1.5">
      {htmlFor ? (
        <label htmlFor={htmlFor} className={text}>
          {children}
        </label>
      ) : (
        <span className={text}>{children}</span>
      )}
      {info && <InfoPopover text={info} />}
    </div>
  );
}

/** A labelled field. The label is always present — placeholders are not labels. */
export function Field({
  label,
  hint,
  children,
}: {
  label: React.ReactNode;
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

/** The hint under a control, for the cases `Field` cannot wrap. */
export function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 text-xs leading-snug text-ink-soft">{children}</p>;
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
  return <p className="mt-8 text-center text-sm text-[#0d0d50]/60">{children}</p>;
}

export function FormLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="font-semibold text-[#5050e0] hover:text-[#0d0d50] underline-scribble">
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
      className="h-12 w-full rounded-full bg-[#6666ff] px-5 text-[15px] font-semibold text-white shadow-[0_12px_30px_-12px_rgba(102,102,255,0.8)] transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-[#5a5af5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6666ff] focus-visible:ring-offset-2 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
