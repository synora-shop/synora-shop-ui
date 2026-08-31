import { adminThemeCss } from "@/lib/theme-tokens";
import { getThemeTokens } from "@/lib/data/theme";

/**
 * Applies the store's brand colour to the admin panel.
 *
 * The panel re-tints as colours are edited, which is what makes the choice
 * feel connected rather than delayed.
 *
 * That's also what makes it risky, and why adminThemeCss clamps: a pale or very
 * dark brand colour applied verbatim could leave the panel's own text
 * unreadable, and the panel is where you'd go to undo it. Surfaces are a
 * desaturated tint of the brand hue and text is walked until it clears AA, so
 * there is no colour you can pick that locks you out of fixing it.
 */
export async function AdminTheme() {
  const tokens = await getThemeTokens();
  const css = adminThemeCss(tokens);
  if (!css) return null;
  // eslint-disable-next-line react/no-danger -- static, server-computed CSS text, not user-facing markup
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
