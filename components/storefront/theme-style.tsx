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
  // Safe to inject: this is CSS text this file computed on the server from
  // validated tokens. Nothing a merchant or a customer typed reaches it, and
  // it is a <style> element rather than markup.
  //
  // Said as a comment rather than an eslint-disable, because react/no-danger
  // is not an enabled rule in this project — the directive suppressed nothing
  // and read as though a warning existed to suppress.
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
