import { brandRamp } from "@/lib/color";

/** Re-tints the whole storefront from a single Global Edits color picker by overriding
 * the --color-brand-* CSS custom properties every brand-* Tailwind utility already reads
 * from — no per-component changes, and it applies to pages added after the edit too. */
export function AccentTheme({ accentColor }: { accentColor: string }) {
  if (accentColor === "#4c100f") return null; // matches the built-in palette — nothing to override
  const ramp = brandRamp(accentColor);
  if (!ramp) return null;

  const css = `:root{--color-brand-50:${ramp[50]};--color-brand-100:${ramp[100]};--color-brand-300:${ramp[300]};--color-brand-500:${ramp[500]};--color-brand-600:${ramp[600]};--color-brand-700:${ramp[700]};}`;
  // eslint-disable-next-line react/no-danger -- static, server-computed CSS text, not user-facing markup
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
