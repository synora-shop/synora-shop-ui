import { FilePen } from "lucide-react";
import { getAllPages } from "@/lib/data/pages";
import { PageList } from "@/components/admin/page-list";
import { ButtonLink, EmptyState } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

/**
 * Pages written and not yet published.
 *
 * The same idea as Products' Drafts, for the other half of a storefront. A
 * page starts hidden — every new page, and every policy page — and a merchant
 * with four of them waiting wants one place to see them and one press to put
 * them out.
 *
 * Collection pages are left out. They belong to a category and are published
 * with it, so a merchant cannot act on them here and listing them would only
 * be four rows in the way.
 */
export default async function PageDraftsPage() {
  const drafts = (await getAllPages()).filter((p) => !p.categoryId && !p.isPublished);

  if (drafts.length === 0) {
    return (
      <EmptyState
        icon={FilePen}
        title="Nothing waiting"
        description="Every page you have written is published. A new page starts hidden and waits here until you put it out."
        action={
          <ButtonLink href="/admin/pages" variant="secondary" size="sm">
            Back to pages
          </ButtonLink>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-soft">
        {drafts.length === 1 ? "One page is" : `${drafts.length} pages are`} written and not yet
        published. Tick any of them and press Publish to put them out together.
      </p>

      <PageList
        selectable
        // Every row here is hidden. A badge saying so on each one is a badge
        // saying nothing, and it reads as a warning about the page.
        showPublishState={false}
        pages={drafts.map((p) => ({ ...p, sections: p._count.sections }))}
      />
    </div>
  );
}
