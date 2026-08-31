import { themeTokensToCss, type CustomFont, type ThemeTokens } from "@/lib/theme-tokens";

/**
 * Emits the theme's CSS-variable overrides.
 *
 * Rendered after AccentTheme so a Theme-panel accent colour wins over the
 * simpler Global Edits one when both are set. Emits nothing for an untouched
 * default theme.
 */
export function ThemeStyle({ tokens, fonts = [] }: { tokens: ThemeTokens; fonts?: CustomFont[] }) {
  const css = themeTokensToCss(tokens, fonts);
  if (!css) return null;
  // eslint-disable-next-line react/no-danger -- static, server-computed CSS text, not user-facing markup
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
