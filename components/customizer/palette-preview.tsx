"use client";

import { Check, TriangleAlert } from "lucide-react";
import { brandRamp } from "@/lib/color";
import { AA_NORMAL, contrastLevel, contrastRatio, formatRatio } from "@/lib/contrast";
import { resolveTextColor, type ThemeTokens } from "@/lib/theme-tokens";
import { cn } from "@/lib/utils";

/**
 * The shades derived from the accent colour.
 *
 * A single colour picker produces six tints and shades used across buttons,
 * hovers and backgrounds — showing them makes that derivation visible instead
 * of something you only discover by hunting for it on the storefront.
 */
function Ramp({ accent }: { accent: string }) {
  const ramp = brandRamp(accent);
  if (!ramp) return null;
  const steps: [string, string][] = [
    ["50", ramp[50]],
    ["100", ramp[100]],
    ["300", ramp[300]],
    ["500", ramp[500]],
    ["600", ramp[600]],
    ["700", ramp[700]],
  ];
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
        Shades made from your accent
      </p>
      <div className="mt-1.5 flex overflow-hidden rounded border border-border">
        {steps.map(([name, color]) => (
          <div key={name} className="flex-1" title={`${name} · ${color}`}>
            <div className="h-8" style={{ backgroundColor: color }} />
            <p className="bg-white py-0.5 text-center text-[9px] tabular-nums text-ink-faint">{name}</p>
          </div>
        ))}
      </div>
      <p className="mt-1 text-[11px] leading-snug text-ink-soft">
        Used for buttons, hovers and tinted backgrounds. 500 is your accent itself.
      </p>
    </div>
  );
}

/**
 * Every colour pairing in the theme, with its measured contrast.
 *
 * The individual inputs already warn about their own pairing, but a theme fails
 * as a whole — a background chosen after the text was set can break a
 * combination neither field is watching. This is the one place that shows all
 * of them at once.
 */
export function PalettePreview({ tokens }: { tokens: ThemeTokens }) {
  const pairs = [
    { label: "Body text on page", bg: tokens.pageBackground, fg: tokens.textPrimary },
    { label: "Muted text on page", bg: tokens.pageBackground, fg: tokens.textMuted },
    { label: "Body text on cards", bg: tokens.surface, fg: tokens.textPrimary },
    { label: "Button label on accent", bg: tokens.accent, fg: tokens.accentContrast },
    {
      label: "Header",
      bg: tokens.headerBackground,
      fg: resolveTextColor(tokens.headerBackground, tokens.headerText),
    },
    {
      label: "Footer",
      bg: tokens.footerBackground,
      fg: resolveTextColor(tokens.footerBackground, tokens.footerText),
    },
  ].map((pair) => {
    const ratio = contrastRatio(pair.bg, pair.fg);
    return { ...pair, ratio, level: contrastLevel(ratio), passes: ratio >= AA_NORMAL };
  });

  const failing = pairs.filter((p) => !p.passes);

  return (
    <div className="space-y-4">
      <Ramp accent={tokens.accent} />

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
          Readability check
        </p>
        <div className="mt-1.5 divide-y divide-border overflow-hidden rounded border border-border">
          {pairs.map((pair) => (
            <div key={pair.label} className="flex items-center gap-2 bg-white px-2 py-1.5">
              <span
                className="flex h-6 w-12 flex-shrink-0 items-center justify-center rounded text-[10px]"
                style={{ backgroundColor: pair.bg, color: pair.fg }}
              >
                Aa
              </span>
              <span className="min-w-0 flex-1 truncate text-[11px] text-ink-soft">{pair.label}</span>
              <span
                className={cn(
                  "flex flex-shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium tabular-nums",
                  pair.passes ? "bg-green-bg text-green" : "bg-rose-bg text-rose"
                )}
              >
                {pair.passes ? <Check className="h-2.5 w-2.5" /> : <TriangleAlert className="h-2.5 w-2.5" />}
                {formatRatio(pair.ratio)}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-1 text-[11px] leading-snug text-ink-soft">
          {failing.length === 0
            ? `Every combination clears ${AA_NORMAL}:1, the accessibility minimum for body text.`
            : `${failing.length} combination${failing.length === 1 ? "" : "s"} below ${AA_NORMAL}:1, saving is blocked until fixed.`}
        </p>
      </div>
    </div>
  );
}
