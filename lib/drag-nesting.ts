// Working out what a drag *means*: reorder, or nest?
//
// The complaint this answers is that dragging felt like a guess — you let go
// and found out. The fix is not a better animation but a decision the user can
// read before committing: horizontal movement means "make this a child",
// vertical means "move it in the list", and the indicator has to say which one
// is about to happen.
//
// Shopify's rule, and the one used here: the pointer's depth is its horizontal
// offset from where the drag started, divided by one indent step. Depth is then
// clamped to what the list can actually accept at that position — you cannot
// indent under nothing, and you cannot nest deeper than the maximum.
//
// Client-safe: pure arithmetic, no DOM, no React.

/** One level of indentation, in pixels. Also the drag distance per level. */
export const INDENT_PX = 28;

/**
 * Two levels only.
 *
 * A third tier is unusable on touch and hides the very items it was added to
 * surface, so the limit is enforced here rather than left to the merchant's
 * judgement — a rule the code applies is worth more than a warning it shows.
 */
export const MAX_DEPTH = 1;

export type FlatItem = {
  id: string;
  /** 0 for a top-level item, 1 for a child. */
  depth: number;
};

export type DropIntent = {
  /** Index the dragged item lands at, in the flattened list. */
  index: number;
  /** Depth it lands at, already clamped to what's legal there. */
  depth: number;
  /** The item it becomes a child of, or null at the top level. */
  parentId: string | null;
  /** What to tell the user this drag will do. */
  kind: "reorder" | "nest" | "unnest";
};

/**
 * The depth a drop would land at, before legality is considered.
 *
 * Rounding rather than flooring means the indicator flips at the halfway point
 * of a drag, which is where a person expects it to — flooring makes you drag a
 * whole step past the visual indent before anything changes.
 */
export function depthFromOffset(offsetX: number, startDepth: number): number {
  return startDepth + Math.round(offsetX / INDENT_PX);
}

/**
 * What dropping at this position would actually do.
 *
 * `items` is the list with the dragged item already removed, so `index` is a
 * gap between neighbours rather than a slot the item occupies. The item above
 * the gap decides what is possible: you can sit at its depth, or one deeper as
 * its child, and nothing else — an item can't be indented under a gap.
 */
export function resolveDrop(
  items: FlatItem[],
  index: number,
  wantedDepth: number,
  dragged: { id: string; depth: number }
): DropIntent {
  const above = index > 0 ? items[index - 1] : null;
  const below = index < items.length ? items[index] : null;

  // Nothing above means the top of the list, which is always top level.
  const maxDepth = above ? Math.min(above.depth + 1, MAX_DEPTH) : 0;
  // A child can't be orphaned above its own parent: if the item below is
  // deeper, the drop has to be at least deep enough to keep it attached.
  const minDepth = below ? below.depth : 0;

  const depth = Math.max(minDepth, Math.min(wantedDepth, maxDepth));

  // The parent is the nearest item above that sits one level shallower.
  let parentId: string | null = null;
  if (depth > 0) {
    for (let i = index - 1; i >= 0; i--) {
      if (items[i].depth === depth - 1) {
        parentId = items[i].id;
        break;
      }
    }
  }

  const kind: DropIntent["kind"] =
    depth > dragged.depth ? "nest" : depth < dragged.depth ? "unnest" : "reorder";

  return { index, depth, parentId, kind };
}

/**
 * Plain-language description of a pending drop.
 *
 * Shown live while dragging, because the whole point is that the outcome is
 * knowable before you let go.
 */
export function describeDrop(intent: DropIntent, parentLabel?: string): string {
  if (intent.kind === "nest") {
    return parentLabel ? `Nest under "${parentLabel}"` : "Nest as a sub-item";
  }
  if (intent.kind === "unnest") return "Move out to the top level";
  return "Reorder";
}

/**
 * Flattens a parent/child tree into the list the dragging works on.
 *
 * Children follow their parent immediately, which is what makes a flat index
 * plus a depth enough to describe any position in the tree.
 */
export function flatten<T extends { id: string; parentId?: string | null }>(
  items: T[]
): (T & { depth: number })[] {
  const tops = items.filter((i) => !i.parentId);
  const out: (T & { depth: number })[] = [];
  for (const top of tops) {
    out.push({ ...top, depth: 0 });
    for (const child of items.filter((i) => i.parentId === top.id)) {
      out.push({ ...child, depth: 1 });
    }
  }
  // Anything whose parent has gone missing is surfaced at the top rather than
  // dropped — losing a link silently is worse than showing it in the wrong place.
  for (const item of items) {
    if (item.parentId && !out.some((o) => o.id === item.id)) {
      out.push({ ...item, depth: 0 });
    }
  }
  return out;
}

/**
 * Rebuilds parent links from a flattened list after a drop.
 *
 * The flat list is the source of truth during a drag; this turns it back into
 * the tree the database stores.
 */
export function reparent<T extends { id: string }>(
  flat: (T & { depth: number })[]
): (T & { parentId: string | null; order: number })[] {
  let lastTopId: string | null = null;
  return flat.map((item, order) => {
    if (item.depth === 0) {
      lastTopId = item.id;
      return { ...item, parentId: null, order };
    }
    return { ...item, parentId: lastTopId, order };
  });
}
