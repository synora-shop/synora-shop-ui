/**
 * Pointing at the one control that is standing in someone's way.
 *
 * A merchant who tries to change what their store sells is told they have to
 * pause it first. That sentence is true and useless on its own: the pause
 * button is on a different screen, under a heading they have never opened.
 * So the refusal carries a link, and the link says where.
 *
 * The mechanism is a query parameter — `/admin/theme?show=pause` — because the
 * two screens do not share a component tree and the journey has to survive a
 * full navigation. The screen that receives it scrolls the control into view,
 * plays `.attention` on it, and then removes the parameter from the URL so a
 * reload does not replay a hint the merchant has already read.
 *
 * TARGETS is a closed set on purpose. `.attention` is the loudest thing in the
 * product — five seconds of a control growing and pulsing — and it only works
 * while it is rare. An animation that answers "where?" and appears twice has
 * stopped answering anything. Adding a target here is a decision, not a
 * convenience, which is why it costs a line in this file and a line in
 * check-motion.
 *
 * Client-safe: plain strings, no Prisma, no next/headers.
 */

/** The query parameter that carries a hint across a navigation. */
export const SPOTLIGHT_PARAM = "show";

/** Every control that may be pointed at. See the note above before adding one. */
export const SPOTLIGHT_TARGETS = {
  /** The pause button on Your App → Themes. */
  pause: "pause",
} as const;

export type SpotlightTarget = keyof typeof SPOTLIGHT_TARGETS;

/** How long the hint plays. Must match `.attention` in globals.css. */
export const SPOTLIGHT_MS = 5000;

/** A link that lands on `path` and points at `target`. */
export function spotlightHref(path: string, target: SpotlightTarget): string {
  return `${path}?${SPOTLIGHT_PARAM}=${SPOTLIGHT_TARGETS[target]}`;
}

/** Whether a raw query value names a target we know. */
export function isSpotlightTarget(value: string | null): value is SpotlightTarget {
  return value !== null && value in SPOTLIGHT_TARGETS;
}
