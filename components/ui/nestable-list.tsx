"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  ChevronUp,
  CornerDownRight,
  GripVertical,
  Indent,
  Outdent,
} from "lucide-react";
import {
  INDENT_PX,
  depthFromOffset,
  describeDrop,
  resolveDrop,
  type DropIntent,
} from "@/lib/drag-nesting";
import { cn } from "@/lib/utils";

export type NestableItem = { id: string; depth: number; label: string };

/**
 * A list you can reorder *and* nest.
 *
 * Every structural control lives here: the drag handle, move up/down, and
 * indent/outdent. Callers render only the *contents* of a row. That division
 * is deliberate — the previous arrangement had this component draw a handle
 * and the caller draw its own controls, and the menu editor ended up showing
 * two grip icons side by side, one of which was a bare icon with no handlers
 * attached to it at all. A control that looks draggable and isn't is worse
 * than no control.
 *
 * Dragging is not the only way to nest, and that matters more than it sounds:
 * drag-to-indent is unusable with a keyboard, awkward on a phone, and invisible
 * to anyone who does not think to try dragging sideways. The buttons do
 * everything the drag does.
 *
 * Pointer events rather than HTML5 drag-and-drop: the native API has no touch
 * support worth the name. The consequence is that we own the interaction, which
 * is also what lets the drop indicator track horizontal movement — something
 * native drag cannot report reliably.
 */
export function NestableList({
  items,
  onChange,
  renderItem,
  className,
  maxDepth = 1,
}: {
  items: NestableItem[];
  onChange: (next: NestableItem[]) => void;
  renderItem: (item: NestableItem) => React.ReactNode;
  className?: string;
  maxDepth?: number;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [intent, setIntent] = useState<DropIntent | null>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const rowRefs = useRef(new Map<string, HTMLElement>());
  const origin = useRef<{ x: number; depth: number } | null>(null);

  const dragged = items.find((i) => i.id === dragId) ?? null;
  // The list without the dragged item: an index is then a *gap* between
  // neighbours rather than a slot, which is what makes the maths simple.
  const rest = dragged ? items.filter((i) => i.id !== dragged.id) : items;

  const computeIntent = useCallback(
    (clientX: number, clientY: number, item: NestableItem): DropIntent => {
      // Which gap the pointer is over, by comparing against row midpoints.
      let index = rest.length;
      for (let i = 0; i < rest.length; i++) {
        const el = rowRefs.current.get(rest[i].id);
        if (!el) continue;
        const box = el.getBoundingClientRect();
        if (clientY < box.top + box.height / 2) {
          index = i;
          break;
        }
      }
      const wanted = depthFromOffset(clientX - (origin.current?.x ?? clientX), item.depth);
      return resolveDrop(rest, index, wanted, item);
    },
    [rest]
  );

  /**
   * Drag is driven from the window, not from the handle.
   *
   * Pointer capture alone loses the drag the moment the pointer leaves the
   * button in a browser that drops capture, and the handle is a 24px target —
   * leaving it is the normal case, not the edge case. Listening on the window
   * means the drag survives wherever the pointer goes, including outside the
   * document.
   */
  useEffect(() => {
    if (!dragged) return;

    const move = (event: PointerEvent) => {
      event.preventDefault();
      setPointer({ x: event.clientX, y: event.clientY });
      setIntent(computeIntent(event.clientX, event.clientY, dragged));
    };

    const finish = () => {
      // Read the latest intent through the state setter rather than closing
      // over a stale one — this listener is bound once per drag.
      setIntent((current) => {
        if (current) {
          const next = [...rest];
          next.splice(current.index, 0, { ...dragged, depth: current.depth });
          onChange(next);
        }
        return null;
      });
      setDragId(null);
      setPointer(null);
      origin.current = null;
    };

    const cancel = () => {
      setDragId(null);
      setIntent(null);
      setPointer(null);
      origin.current = null;
    };

    const onKey = (event: KeyboardEvent) => {
      // Escape abandons the drag and changes nothing, which is what every
      // other drag on a computer does.
      if (event.key === "Escape") cancel();
    };

    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("keydown", onKey);

    // While dragging, the grabbing cursor applies to the whole page and text
    // stops selecting. Without this the cursor reverts to a text caret the
    // moment it leaves the handle — which is the "cursor goes bad while
    // dragging" that made this feel broken.
    const previousCursor = document.body.style.cursor;
    const previousSelect = document.body.style.userSelect;
    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";

    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("keydown", onKey);
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousSelect;
    };
  }, [dragged, rest, computeIntent, onChange]);

  function startDrag(event: React.PointerEvent, item: NestableItem) {
    // Ignore anything that isn't the primary button, so a right-click on the
    // handle doesn't leave a drag running with no way to end it.
    if (event.button !== 0) return;
    event.preventDefault();
    origin.current = { x: event.clientX, depth: item.depth };
    setPointer({ x: event.clientX, y: event.clientY });
    setDragId(item.id);
    setIntent(null);
  }

  // ---------------------------------------------------------------- buttons

  /** The item plus everything nested under it — moved as one. */
  const blockAt = useCallback(
    (index: number) => {
      let end = index + 1;
      while (end < items.length && items[end].depth > items[index].depth) end++;
      return { start: index, end };
    },
    [items]
  );

  const moveBlock = useCallback(
    (index: number, direction: -1 | 1) => {
      const { start, end } = blockAt(index);
      const block = items.slice(start, end);
      const without = [...items.slice(0, start), ...items.slice(end)];

      // Where the block goes is the far side of its neighbouring block, not the
      // next row: stepping one row at a time would drop a top-level item
      // between a parent and its own children.
      let target: number;
      if (direction === -1) {
        if (start === 0) return;
        let prev = start - 1;
        while (prev > 0 && items[prev].depth > items[start].depth) prev--;
        target = prev;
      } else {
        if (end >= items.length) return;
        let after = end;
        const neighbourDepth = items[after].depth;
        after += 1;
        while (after < items.length && items[after].depth > neighbourDepth) after += 1;
        target = after - block.length;
      }

      const next = [...without];
      next.splice(target, 0, ...block);
      // The move may have landed the block somewhere its depth is no longer
      // legal — first position, or under a shallower neighbour. Re-resolving
      // is cheaper than enumerating the cases.
      const head = next[target];
      const legal = resolveDrop(
        next.filter((_, i) => i !== target),
        target,
        head.depth,
        head
      );
      if (legal.depth !== head.depth) {
        const shift = legal.depth - head.depth;
        for (let i = target; i < target + block.length; i++) {
          next[i] = { ...next[i], depth: Math.max(0, next[i].depth + shift) };
        }
      }
      onChange(next);
    },
    [items, blockAt, onChange]
  );

  /** Whether a row can change depth by `delta`, and the list if it does. */
  const changeDepth = useCallback(
    (index: number, delta: 1 | -1): NestableItem[] | null => {
      const item = items[index];
      const wanted = item.depth + delta;
      if (wanted < 0 || wanted > maxDepth) return null;

      // An item with children cannot indent: its children would land a level
      // deeper than the list allows.
      const { end } = blockAt(index);
      if (delta === 1 && end > index + 1) return null;

      const rest = items.filter((_, i) => i !== index);
      const legal = resolveDrop(rest, index, wanted, item);
      if (legal.depth !== wanted) return null;

      const next = [...rest];
      next.splice(index, 0, { ...item, depth: wanted });
      return next;
    },
    [items, blockAt, maxDepth]
  );

  // Which rendered row the drop line goes above; null means the very end.
  const dropBeforeId = intent && intent.index < rest.length ? rest[intent.index].id : null;

  const parentLabel =
    intent?.parentId != null ? items.find((i) => i.id === intent.parentId)?.label : undefined;

  return (
    <div className={cn(dragged && "select-none", className)}>
      <ul className="space-y-1">
        {items.map((item, index) => {
          const canIndent = changeDepth(index, 1) !== null;
          const canOutdent = changeDepth(index, -1) !== null;
          const isDragging = dragId === item.id;

          return (
            <li key={item.id}>
              {/* The drop line sits in the gap and indents with the pointer, so
                  the depth you'll land at is visible before you commit.
                  Positions are computed against the list *without* the dragged
                  row (an index is a gap, not a slot), then mapped back onto the
                  rendered list — which keeps every row on screen. An earlier
                  version rendered only the remaining rows, so the row you were
                  holding disappeared out from under you. */}
              {dragged && intent && dropBeforeId === item.id && (
                <DropLine depth={intent.depth} kind={intent.kind} />
              )}
              <div
                ref={(el) => {
                  if (el) rowRefs.current.set(item.id, el);
                  else rowRefs.current.delete(item.id);
                }}
                aria-grabbed={isDragging || undefined}
                style={{ marginLeft: item.depth * INDENT_PX }}
                className={cn(
                  "flex items-center gap-1 rounded-lg border bg-surface px-2 py-1.5 transition-shadow",
                  // A dragged row is lifted rather than faded. Fading alone
                  // reads as "disabled"; the ring and shadow read as "held".
                  isDragging
                    ? "border-brand-500 opacity-95 shadow-lg ring-2 ring-brand-300"
                    : "border-border"
                )}
              >
                <button
                  type="button"
                  aria-label={`Drag to move ${item.label}`}
                  onPointerDown={(e) => startDrag(e, item)}
                  className={cn(
                    "touch-none rounded p-1 text-ink-faint transition-colors",
                    "hover:bg-subtle hover:text-ink",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                    isDragging ? "cursor-grabbing bg-brand-50 text-brand-600" : "cursor-grab"
                  )}
                >
                  <GripVertical className="h-4 w-4" />
                </button>

                <div className="flex shrink-0 items-center">
                  <StructureButton
                    label={`Move ${item.label} up`}
                    disabled={index === 0}
                    onClick={() => moveBlock(index, -1)}
                    icon={ChevronUp}
                  />
                  <StructureButton
                    label={`Move ${item.label} down`}
                    disabled={blockAt(index).end >= items.length}
                    onClick={() => moveBlock(index, 1)}
                    icon={ChevronDown}
                  />
                  <StructureButton
                    label={`Nest ${item.label} under the item above`}
                    disabled={!canIndent}
                    onClick={() => {
                      const next = changeDepth(index, 1);
                      if (next) onChange(next);
                    }}
                    icon={Indent}
                  />
                  <StructureButton
                    label={`Move ${item.label} out to the top level`}
                    disabled={!canOutdent}
                    onClick={() => {
                      const next = changeDepth(index, -1);
                      if (next) onChange(next);
                    }}
                    icon={Outdent}
                  />
                </div>

                {item.depth > 0 && (
                  <CornerDownRight
                    className="h-3.5 w-3.5 flex-shrink-0 text-ink-faint"
                    aria-hidden
                  />
                )}
                <div className="min-w-0 flex-1">{renderItem(item)}</div>
              </div>
            </li>
          );
        })}
        {dragged && intent && dropBeforeId === null && (
          <DropLine depth={intent.depth} kind={intent.kind} />
        )}
      </ul>

      {/* The verdict follows the pointer, so it is where the eye already is.
          It used to sit under the list, which on a long menu meant scrolling
          away from your own drag to read what it was about to do. */}
      {dragged && intent && pointer && (
        <DragLabel x={pointer.x} y={pointer.y} intent={intent} parentLabel={parentLabel} />
      )}

      {/* Announced for screen readers, which cannot see the pointer label. */}
      <p aria-live="polite" className="sr-only">
        {dragged && intent ? describeDrop(intent, parentLabel) : ""}
      </p>

      <p className="mt-3 text-xs leading-snug text-ink-soft">
        Drag the handle to reorder, or drag <strong>right</strong> to nest an item under the one
        above it. The arrows do the same thing without dragging. Menus go two levels deep.
      </p>
    </div>
  );
}

/** One of the small structural controls that sit beside the drag handle. */
function StructureButton({
  label,
  disabled,
  onClick,
  icon: Icon,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded p-1 text-ink-faint transition-colors",
        "hover:bg-subtle hover:text-ink active:bg-brand-100 active:text-brand-600",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
        // Disabled controls stay visible but plainly inert, so the shape of the
        // list is readable — a first item obviously cannot move up.
        "disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-ink-faint"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

/**
 * The floating "Nest under X" that tracks the pointer.
 *
 * Portalled to <body> because `position: fixed` resolves against the nearest
 * transformed ancestor, not the viewport — and the admin has several. In place,
 * this would be pinned inside a panel and could scroll off screen.
 */
function DragLabel({
  x,
  y,
  intent,
  parentLabel,
}: {
  x: number;
  y: number;
  intent: DropIntent;
  parentLabel?: string;
}) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      aria-hidden
      style={{ left: x + 14, top: y + 14 }}
      className={cn(
        "pointer-events-none fixed z-[2147483600] inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium shadow-md",
        intent.kind === "nest"
          ? "bg-brand-600 text-white"
          : intent.kind === "unnest"
            ? "bg-amber text-white"
            : "bg-ink text-white"
      )}
    >
      {intent.kind === "nest" && <CornerDownRight className="h-3.5 w-3.5" />}
      {describeDrop(intent, parentLabel)}
    </div>,
    document.body
  );
}

/** The indented line showing exactly where and how deep the item will land. */
function DropLine({ depth, kind }: { depth: number; kind: DropIntent["kind"] }) {
  return (
    <div
      style={{ marginLeft: depth * INDENT_PX }}
      className="flex items-center gap-1.5 py-0.5"
      aria-hidden
    >
      <span
        className={cn(
          "h-2 w-2 flex-shrink-0 rounded-full",
          kind === "nest" ? "bg-brand-500" : kind === "unnest" ? "bg-amber" : "bg-ink-faint"
        )}
      />
      <span
        className={cn(
          "h-0.5 flex-1 rounded-full",
          kind === "nest" ? "bg-brand-500" : kind === "unnest" ? "bg-amber" : "bg-ink-faint"
        )}
      />
    </div>
  );
}
