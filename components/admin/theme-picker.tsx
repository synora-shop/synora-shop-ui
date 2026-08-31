import { chooseTheme } from "@/app/admin/theme/actions-theme-choice";
import { themesFor, themeTokens, type BusinessType } from "@/lib/themes/registry";
import { ThemeChoiceButton } from "@/components/admin/theme-choice-button";

/**
 * The designs this shop can wear.
 *
 * Only the ones for its kind of business. Offering a restaurant design to a
 * bookshop would be offering a storefront whose sections it has no data for.
 *
 * Each card previews itself in its own colours and type rather than describing
 * them, because "monochrome and sharp edged" means far less than seeing it.
 */
export function ThemePicker({
  businessType,
  current,
}: {
  businessType: BusinessType;
  current: string;
}) {
  const themes = themesFor(businessType);

  return (
    <section>
      <h2 className="font-serif text-xl font-semibold">Design</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Pick a starting point. Everything below can still be changed, and switching designs
        keeps the colours you have set for each one.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {themes.map((theme) => {
          const tokens = themeTokens(theme.key);
          const active = theme.key === current;

          return (
            <form key={theme.key} action={chooseTheme.bind(null, theme.key)}>
              <ThemeChoiceButton active={active}>
                {/* The theme, in miniature and in its own tokens. */}
                <span
                  className="block px-5 py-6"
                  style={{ background: tokens.pageBackground, color: tokens.textPrimary }}
                >
                  <span
                    className="block text-lg font-semibold"
                    style={{
                      fontWeight: tokens.headingWeight,
                      letterSpacing: `${tokens.headingLetterSpacing / 100}em`,
                    }}
                  >
                    {theme.name}
                  </span>
                  <span className="mt-1 block text-xs" style={{ color: tokens.textMuted }}>
                    Aa Bb Cc
                  </span>
                  {/* A neutral word. "Shop now" on a blog or a restaurant is
                      the sample contradicting the theme it is sampling. */}
                  <span
                    className="mt-3 inline-block px-3 py-1 text-xs"
                    style={{
                      background: tokens.accent,
                      color: tokens.accentContrast,
                      borderRadius: `${tokens.buttonRadius}px`,
                    }}
                  >
                    Button
                  </span>
                </span>

                <span className="block border-t border-border bg-white px-4 py-3">
                  <span className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{theme.name}</span>
                    {active && (
                      <span className="rounded-pill bg-emerald-bg px-2 py-0.5 text-xs font-medium text-emerald">
                        In use
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-xs text-ink-soft">{theme.description}</span>
                </span>
              </ThemeChoiceButton>
            </form>
          );
        })}
      </div>
    </section>
  );
}
