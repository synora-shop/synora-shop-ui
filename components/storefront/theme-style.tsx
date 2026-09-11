import { themeTokensToCss, type CustomFont, type ThemeTokens } from "@/lib/theme-tokens";

/**
 * Emits the theme's CSS-variable overrides.
 *
 * The only place the storefront's colours come from. There were two — this and
 * an AccentTheme block emitting a second brand ramp from the shop's settings —
 * and which one a merchant got depended on whether this one emitted anything at
 * all. Emits nothing for an untouched default theme, which is what made the
 * other one work sometimes and not others.
 */
export function ThemeStyle({ tokens, fonts = [] }: { tokens: ThemeTokens; fonts?: CustomFont[] }) {
  const css = themeTokensToCss(tokens, fonts);
  if (!css) return null;
  // eslint-disable-next-line react/no-danger -- static, server-computed CSS text, not user-facing markup
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
