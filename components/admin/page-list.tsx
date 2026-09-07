"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, ChevronRight, Eye, Trash2 } from "lucide-react";
import { Badge, Button } from "@/components/ui/primitives";
import { BulkBar } from "@/components/admin/bulk-bar";
import { pageAddress } from "@/lib/page-address";
import { deletePage, publishPages } from "@/app/admin/pages/actions";
import { useServerRows } from "@/components/ui/use-server-rows";
import { SwipeRow } from "@/components/ui/swipe-row";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type PageRow = {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  isSystem: boolean;
  systemKey: string | null;
  /** How many blocks it is built from — an empty page should look empty. */
  sections: number;
};

export function PageList({
  pages,
  selectable = false,
  showPublishState = true,
  emptyMessage = "No pages yet. Add one on the right.",
}: {
  pages: PageRow[];
  /**
   * Whether rows can be ticked and published together.
   *
   * On the Drafts screen, where publishing several is the job. Off on the
   * Pages list, where a tick beside every row would be a control offered for
   * something nobody came to do.
   */
  selectable?: boolean;
  /**
   * Whether to draw the Hidden mark.
   *
   * Off on the Drafts screen, where every row is hidden. A badge repeated on
   * every row says nothing and reads as a warning.
   */
  showPublishState?: boolean;
  emptyMessage?: string;
}) {
  const router = useRouter();
  const [rows, setRows] = useServerRows(pages);
  const { confirm, dialog } = useConfirm();
  const toast = useToast();
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [publishing, startPublishing] = useTransition();

  // Ticks are always intersected with what is on screen: a page that has since
  // been published or deleted must not be acted on invisibly.
  const selected = useMemo(
    () => rows.filter((p) => picked.has(p.id)).map((p) => p.id),
    [rows, picked]
  );

  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function publish() {
    if (selected.length === 0) return;
    const ids = selected;
    startPublishing(async () => {
      const result = await publishPages(ids);
      if ("error" in result) {
        toast.error(result.error, { blocking: true });
        return;
      }
      setPicked(new Set());
      toast.success(
        result.published === 0
          ? "Nothing needed publishing."
          : `${result.published} page${result.published === 1 ? "" : "s"} published.`
      );
      router.refresh();
    });
  }

  async function handleDelete(id: string, title: string) {
    const ok = await confirm({
      title: `Delete "${title}"?`,
      description: "This page and its sections will be permanently removed.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;

    const previous = rows;
    setRows((r) => r.filter((p) => p.id !== id));
    const formData = new FormData();
    formData.set("pageId", id);
    try {
      await deletePage(formData);
      router.refresh();
    } catch {
      // Rolling the row back without a word reads as the action having
      // worked and then quietly undone itself.
      setRows(previous);
      toast.error("Couldn't remove that page. Try again.", { blocking: true });
    }
  }

  if (rows.length === 0) {
    return (
      <>
        {dialog}
        <p className="rounded-xl border border-dashed border-border bg-surface px-5 py-10 text-center text-sm text-ink-soft">
          {emptyMessage}
        </p>
      </>
    );
  }

  return (
    <>
    <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
      {dialog}
      {rows.map((page) => (
        <SwipeRow
          key={page.id}
          actions={
            page.isSystem
              ? []
              : [{ key: "delete", label: "Delete", icon: Trash2, tone: "danger", onClick: () => handleDelete(page.id, page.title) }]
          }
        >
          <Link
            href={`/admin/pages/${page.id}`}
            className={cn(
              "no-tap-scale group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-subtle active:bg-subtle",
              picked.has(page.id) && "bg-brand-50"
            )}
          >
            {selectable && (
              <button
                type="button"
                role="checkbox"
                aria-checked={picked.has(page.id)}
                aria-label={`Select ${page.title}`}
                onClick={(e) => {
                  // The row is a link. Ticking is not following it.
                  e.preventDefault();
                  e.stopPropagation();
                  toggle(page.id);
                }}
                className={cn(
                  // An explicit radius: this design system's rounded-md is
                  // 14px, which on a 20px box is a circle, and a circle means
                  // "pick one of these".
                  "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-[5px] border transition-colors",
                  picked.has(page.id)
                    ? "border-brand-500 bg-brand-500 text-white"
                    : "border-border bg-control text-transparent hover:border-ink-faint"
                )}
              >
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </button>
            )}
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-1.5 text-[13px] font-medium">
                <span className="truncate">{page.title}</span>
                {/* A page that cannot be deleted should say so before somebody
                    goes looking for the button. */}
                {page.isSystem && <Badge>Default</Badge>}
                {showPublishState && !page.isPublished && <Badge tone="warn">Hidden</Badge>}
              </p>
              <p className="truncate font-mono text-[11px] text-ink-faint">
                {pageAddress(page.slug, page.systemKey)}
              </p>
            </div>

            <span className="flex-shrink-0 text-[11px] text-ink-soft">
              {page.sections === 0 ? "Empty" : `${page.sections} section${page.sections === 1 ? "" : "s"}`}
            </span>

            {/* The row is a link, and until now nothing said so. */}
            <ChevronRight
              className="h-4 w-4 flex-shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </SwipeRow>
      ))}
    </div>

    {selectable && selected.length > 0 && (
      <BulkBar count={selected.length} noun="page" onClear={() => setPicked(new Set())}>
        <Button size="sm" variant="primary" disabled={publishing} onClick={publish}>
          <Eye className="h-3.5 w-3.5" />
          Publish
        </Button>
      </BulkBar>
    )}
    </>
  );
}
