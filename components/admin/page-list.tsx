"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2 } from "lucide-react";
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

  return (
    <div className="divide-y divide-border rounded-lg border border-border bg-white">
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
            className="no-tap-scale flex items-center justify-between px-5 py-4 transition-colors hover:bg-subtle active:bg-subtle"
          >
            <div>
              <p className="text-sm font-medium">{page.title}</p>
              <p className="text-xs text-ink-soft">
                {page.slug === "home" ? "/" : `/p/${page.slug}`}
                {!page.isPublished && " · Unpublished"}
              </p>
            </div>
          </Link>
        </SwipeRow>
      ))}
      {rows.length === 0 && <p className="px-5 py-4 text-sm text-ink-soft">No pages yet.</p>}
    </div>
  );
}
