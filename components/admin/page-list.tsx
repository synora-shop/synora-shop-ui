"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/primitives";
import { deletePage } from "@/app/admin/pages/actions";
import { useServerRows } from "@/components/ui/use-server-rows";
import { SwipeRow } from "@/components/ui/swipe-row";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

type PageRow = {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  isSystem: boolean;
  /** How many blocks it is built from — an empty page should look empty. */
  sections: number;
};

export function PageList({ pages }: { pages: PageRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useServerRows(pages);
  const { confirm, dialog } = useConfirm();
  const toast = useToast();

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
          No pages yet. Add one on the right.
        </p>
      </>
    );
  }

  return (
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
            className="no-tap-scale group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-subtle active:bg-subtle"
          >
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-1.5 text-[13px] font-medium">
                <span className="truncate">{page.title}</span>
                {/* A page that cannot be deleted should say so before somebody
                    goes looking for the button. */}
                {page.isSystem && <Badge>Default</Badge>}
                {!page.isPublished && <Badge tone="warn">Hidden</Badge>}
              </p>
              <p className="truncate font-mono text-[11px] text-ink-faint">
                {page.slug === "home" ? "/" : `/p/${page.slug}`}
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
  );
}
