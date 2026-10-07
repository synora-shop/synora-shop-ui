/**
 * The kit's own text styles, by the names the file gives them.
 *
 * Read from the "Internal Only Canvas" page of the .fig, where each style is a
 * named text node — `Display/Display 1`, `Body/Body 4` and so on. The home
 * page's sections predate this file and spell their classes out, because each
 * was transcribed and measured node by node; the pages the kit does not draw
 * are built from these instead, so that a product page cannot invent a
 * sixteenth size the design never had.
 *
 * Every value is in `--u` (see components/loom/shell.tsx). Styles at 24px and
 * under floor at 80% of their size, never under 11px, with their line height
 * floored to match — the same rule the home page follows.
 *
 * Tailwind only sees whole class names, so these are written out in full
 * rather than built by a function.
 */
export const T = {
  /** Display 1 — Regular 90/75, -5. The hero headline. */
  display1: "font-normal text-[calc(90*var(--u))] leading-[calc(75*var(--u))] tracking-[calc(-5*var(--u))]",
  /** Display 2 — Regular 56/56, -5. The phone's hero headline. */
  display2: "font-normal text-[calc(56*var(--u))] leading-[calc(56*var(--u))] tracking-[calc(-5*var(--u))]",
  /** Display 3 — Regular 40/40, -3. Card captions. */
  display3: "font-normal text-[calc(40*var(--u))] leading-[calc(40*var(--u))] tracking-[calc(-3*var(--u))]",
  /** Display 4 — Regular 32/32, -3. The phone's card captions. */
  display4: "font-normal text-[calc(32*var(--u))] leading-[calc(32*var(--u))] tracking-[calc(-3*var(--u))]",

  /** Heading 1 — Regular 65/65, -4. */
  h1: "font-normal text-[calc(65*var(--u))] leading-[calc(65*var(--u))] tracking-[calc(-4*var(--u))]",
  /** Heading 2 — Regular 60/65, -3. Section statements on desktop. */
  h2: "font-normal text-[calc(60*var(--u))] leading-[calc(65*var(--u))] tracking-[calc(-3*var(--u))]",
  /** Heading 3 — Regular 40/48, -3. Section statements on the phone. */
  h3: "font-normal text-[calc(40*var(--u))] leading-[calc(48*var(--u))] tracking-[calc(-3*var(--u))]",
  /** Heading 4 (Reguler) — 30/38, -1. Section titles: "Trending". */
  h4: "font-normal text-[calc(30*var(--u))] leading-[calc(38*var(--u))] tracking-[calc(-1*var(--u))]",
  /** Heading 4 (Medium) — 30/40, -1. A column head on desktop. */
  h4Medium: "font-medium text-[calc(30*var(--u))] leading-[calc(40*var(--u))] tracking-[calc(-1*var(--u))]",
  /** Heading 5 — Medium 24/40, -1. A column head on the phone. */
  h5: "font-medium text-[max(calc(24*var(--u)),19.2px)] leading-[max(calc(40*var(--u)),32px)] tracking-[calc(-1*var(--u))]",

  /** Body 1 — Medium 24/32, -1. A product's name on a desktop card. */
  body1: "font-medium text-[max(calc(24*var(--u)),19.2px)] leading-[max(calc(32*var(--u)),25.6px)] tracking-[calc(-1*var(--u))]",
  /** Body 2 — Regular 20/28, -1. A price on a desktop card. */
  body2: "font-normal text-[max(calc(20*var(--u)),16px)] leading-[max(calc(28*var(--u)),22.4px)] tracking-[calc(-1*var(--u))]",
  /** Body 3 — Medium 18/32, -1. A product's name on a phone card. */
  body3: "font-medium text-[max(calc(18*var(--u)),14.4px)] leading-[max(calc(32*var(--u)),25.6px)] tracking-[calc(-1*var(--u))]",
  /** Body 4 — Regular 18/26, -0.3. Running text on desktop. */
  body4: "font-normal text-[max(calc(18*var(--u)),14.4px)] leading-[max(calc(26*var(--u)),20.8px)] tracking-[calc(-0.3*var(--u))]",
  /** Body 5 — Regular 16/28, -1. A price on a phone card. */
  body5: "font-normal text-[max(calc(16*var(--u)),12.8px)] leading-[max(calc(28*var(--u)),22.4px)] tracking-[calc(-1*var(--u))]",
  /** Body 6 — Regular 16/26, -0.3. Running text on the phone. */
  body6: "font-normal text-[max(calc(16*var(--u)),12.8px)] leading-[max(calc(26*var(--u)),20.8px)] tracking-[calc(-0.3*var(--u))]",
  /** Body 6 (Bold) — Semi Bold 16/32, -0.5. A name under a quote. */
  body6Bold: "font-semibold text-[max(calc(16*var(--u)),12.8px)] leading-[max(calc(32*var(--u)),25.6px)] tracking-[calc(-0.5*var(--u))]",

  /** Single text 1 — Semi Bold 24/32, -0.5. */
  single1: "font-semibold text-[max(calc(24*var(--u)),19.2px)] leading-[max(calc(32*var(--u)),25.6px)] tracking-[calc(-0.5*var(--u))]",
  /** Single text 2 — Medium 14/24, +1. Button labels; uppercase where used. */
  single2: "font-medium text-[max(calc(14*var(--u)),11.2px)] leading-[max(calc(24*var(--u)),19.2px)] tracking-[calc(1*var(--u))]",

  /** Not a named style, but the kit's small text everywhere: 13/16 Medium. */
  small: "font-medium text-[max(calc(13*var(--u)),11px)] leading-[max(calc(16*var(--u)),12.8px)]",
} as const;

/**
 * The kit's colours, from its "Color" style page. Muted text is the ink at
 * 80% (the file's "Grey"), not a grey of its own.
 */
export const C = {
  black1: "#000000",
  ink: "#121212",
  blue: "#233c6b",
  softRed: "#f15353",
  shade700: "#2e3a59",
  gray600: "#4f5b67",
} as const;
