import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { kt } from "@/components/kite/type";

/**
 * The parts Kite's undrawn pages are built from — every one taken from
 * something the file does draw, so a page it never shows still reads as Kite:
 *
 *   KitePage      the margins of every screen: 16 on the phone, 32 on the desktop
 *   KiteTitle     the account's greeting: Hiragino (Shippori) 64, 96 on the desktop
 *   KiteHeading   the section names: Khand Light 32, capitals
 *   KiteButton    the product page's "Add to cart": a 39-high bar in the ink,
 *                 its words in the ground — or outlined, for the second choice
 *   KiteTextLink  EDIT, CHANGE, VIEW: SF Pro Light, underlined, capitals
 *   KiteField     the account's field: label at 16 and 80%, the value at 20,
 *                 a rule in the ink under it — here a field that takes typing
 *   KiteRow       the product page's rows: a half-ink rule above and below
 */
export const KITE_RULE = "shadow-[inset_0_-1px_0_rgba(244,243,241,0.5)]";
export const KITE_RULE_TOP = "shadow-[inset_0_1px_0_rgba(244,243,241,0.5)]";

export function KitePage({ children, className, k }: { children: React.ReactNode; className?: string; k: string }) {
  return (
    <section data-k={k} className={cn("px-[calc(16*var(--u))] pb-[calc(64*var(--u))] pt-[calc(16*var(--u))] md:px-[calc(32*var(--u))] md:pb-[calc(120*var(--u))] md:pt-[calc(32*var(--u))]", className)}>
      {children}
    </section>
  );
}

export function KiteTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  const t = kt("serif", 64, 96);
  return (
    <h1 {...t} className={cn(t.className, "break-words", className)}>
      {children}
    </h1>
  );
}

export function KiteHeading({ children, className, as: As = "h2" }: { children: React.ReactNode; className?: string; as?: "h2" | "h3" | "p" | "legend" }) {
  const t = kt("khand", 32);
  return (
    <As {...t} className={cn(t.className, "uppercase", className)}>
      {children}
    </As>
  );
}

type ButtonProps = { variant?: "solid" | "outline"; href?: string; className?: string; children: React.ReactNode } & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

export function KiteButton({ variant = "solid", href, className, children, ...rest }: ButtonProps) {
  const t = kt("sans", 16);
  const classes = cn(
    t.className,
    "flex min-h-[calc(39*var(--u))] items-center justify-center px-[calc(24*var(--u))] text-center uppercase disabled:opacity-50",
    variant === "solid" ? "bg-[#f4f3f1] text-[#040404]" : "shadow-[inset_0_0_0_1px_#f4f3f1]",
    className
  );
  if (href) {
    return (
      <a href={href} style={t.style} className={classes}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" {...rest} style={t.style} className={classes}>
      {children}
    </button>
  );
}

export function KiteTextLink({ href, onClick, children, className, dim = true, size = 16 }: { href?: string; onClick?: () => void; children: React.ReactNode; className?: string; dim?: boolean; size?: number }) {
  const t = kt("sans", size === 20 ? 16 : 14, size);
  const classes = cn(t.className, "uppercase underline underline-offset-4", dim && "opacity-50 hover:opacity-100", className);
  return href ? (
    <a href={href} style={t.style} className={classes}>
      {children}
    </a>
  ) : (
    <button type="button" onClick={onClick} style={t.style} className={classes}>
      {children}
    </button>
  );
}

type FieldProps = { label: string; error?: string; className?: string } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "className">;

export const KiteField = forwardRef<HTMLInputElement, FieldProps>(function KiteField({ label, error, className, id, ...rest }, ref) {
  const name = id ?? `f-${label.replace(/\W+/g, "-").toLowerCase()}`;
  const l = kt("sans", 14, 16);
  const v = kt("sans", 16, 20);
  return (
    <div className={cn("flex flex-col gap-[calc(8*var(--u))]", className)}>
      <label htmlFor={name} {...l} className={cn(l.className, "uppercase opacity-80")}>
        {label}
      </label>
      <input
        ref={ref}
        id={name}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        {...rest}
        style={v.style}
        className={cn(v.className, "w-full rounded-none border-0 bg-transparent pb-[calc(12*var(--u))] text-[#f4f3f1] shadow-[inset_0_-1px_0_#f4f3f1] outline-none placeholder:text-[#f4f3f1]/40 focus:shadow-[inset_0_-2px_0_#f4f3f1]", error && "shadow-[inset_0_-1px_0_#e2735f]")}
      />
      {error ? (
        <p id={`${name}-error`} role="alert" {...l} className={cn(l.className, "text-[#e2735f]")}>
          {error}
        </p>
      ) : null}
    </div>
  );
});

export function KiteSelect({ label, options, placeholder, error, className, value, onChange }: { label: string; options: string[]; placeholder: string; error?: string; className?: string; value: string; onChange: (v: string) => void }) {
  const name = `f-${label.replace(/\W+/g, "-").toLowerCase()}`;
  const l = kt("sans", 14, 16);
  const v = kt("sans", 16, 20);
  return (
    <div className={cn("flex flex-col gap-[calc(8*var(--u))]", className)}>
      <label htmlFor={name} {...l} className={cn(l.className, "uppercase opacity-80")}>
        {label}
      </label>
      <select
        id={name}
        value={value}
        aria-invalid={!!error}
        onChange={(e) => onChange(e.target.value)}
        style={v.style}
        className={cn(v.className, "w-full cursor-pointer appearance-none rounded-none border-0 bg-transparent pb-[calc(12*var(--u))] text-[#f4f3f1] shadow-[inset_0_-1px_0_#f4f3f1] outline-none [&>option]:bg-[#040404]", error && "shadow-[inset_0_-1px_0_#e2735f]")}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      {error ? (
        <p role="alert" {...l} className={cn(l.className, "text-[#e2735f]")}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** A label and a figure on one line, on the half-ink rule — the totals, an order's facts. */
export function KiteLine({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  const t = kt("sans", 16, 20);
  return (
    <div className={cn("flex items-baseline justify-between gap-[calc(16*var(--u))] py-[calc(12*var(--u))]", KITE_RULE, strong && "font-normal")}>
      <span {...t} className={cn(t.className, "shrink-0 uppercase", !strong && "opacity-80")}>
        {label}
      </span>
      <span {...t} className={cn(t.className, "text-right uppercase")}>
        {value}
      </span>
    </div>
  );
}
