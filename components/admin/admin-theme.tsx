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
  // Safe to inject: this is CSS text this file computed on the server from
  // validated tokens. Nothing a merchant or a customer typed reaches it, and
  // it is a <style> element rather than markup.
  //
  // Said as a comment rather than an eslint-disable, because react/no-danger
  // is not an enabled rule in this project — the directive suppressed nothing
  // and read as though a warning existed to suppress.
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
