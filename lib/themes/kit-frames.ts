import { LoomFrame } from "@/components/loom/frame";

/**
 * What every page of each kit sits inside — its fonts, its unit, its `<main>`
 * — by theme key.
 *
 * Kept out of lib/themes/kits.ts on purpose: a frame loads its fonts through
 * next/font, which only works inside the app, and the kit registry is also
 * read by plain scripts (scripts/check-loom.tsx) that must not need it.
 */
export const KIT_FRAMES: Record<string, (props: { children: React.ReactNode }) => React.ReactNode> = {
  loom: LoomFrame,
};
