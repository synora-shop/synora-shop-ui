import {
  getAllPages,
  getOrCreateAboutPage,
  getOrCreateFaqPage,
  getOrCreateHomePage,
} from "@/lib/data/pages";
import { createPage } from "@/app/admin/pages/actions";
import { PageList } from "@/components/admin/page-list";
import { PolicyPages } from "@/components/admin/policy-pages";
import { POLICY_PAGES } from "@/lib/policy-pages";
import { Fieldset, SectionDivider, buttonClass } from "@/components/ui/primitives";
import { Field } from "@/components/merchant/form-shell";

export const dynamic = "force-dynamic";

export default async function AdminPagesPage() {
  // Collection pages (auto-created per Category) live here too, but they have no Sections
  // to edit and are deleted only by deleting their Category — manage them from Categories,
  // not this list.
  // The three that come with the store are made on first sight rather than at
  // signup, and until now the first sight of the FAQ page was a customer
  // visiting /faq. This screen promises three, so it makes three.
  await Promise.all([getOrCreateHomePage(), getOrCreateAboutPage(), getOrCreateFaqPage()]);

  const pages = (await getAllPages()).filter((p) => !p.categoryId);

  return (
    <div className="space-y-2.5">
      <p className="text-sm text-ink-soft">
        Every page on your storefront, and the blocks each one is built from. Three come with
        the store — your homepage, your story and your FAQs — and cannot be deleted, though
        they can be renamed, moved to a different address, or hidden. Collection pages are
        managed from Categories.
      </p>

      <PageList pages={pages.map((p) => ({ ...p, sections: p._count.sections }))} />

      <SectionDivider
        title="The pages customers ask for"
        description="Returns, privacy and terms. Each one is added as a draft written in plain words, with every decision you have to make left in square brackets — read it through, make it yours, then publish it. Add them to your footer from Menus."
      />

      <PolicyPages
        existing={Object.fromEntries(
          pages
            .filter((p) => p.systemKey && POLICY_PAGES.some((policy) => policy.key === p.systemKey))
            .map((p) => [p.systemKey as string, { id: p.id, isPublished: p.isPublished }])
        )}
      />

      <SectionDivider
        title="Add a page"
        description="A blank page with one block of text on it, ready to build. Add it to your header or footer from Menus once it says what you want."
      />

      <form action={createPage}>
        <Fieldset
          title="New page"
          description="The address is made from the name unless you write your own, and can be changed later without breaking anyone's links."
        >
          <Field label="Name">
            <input name="title" required placeholder="e.g. Shipping and returns" className="input" />
          </Field>
          <Field label="Address" hint="Optional — left blank, it is made from the name.">
            <div className="flex items-center gap-2">
              <span className="flex-shrink-0 font-mono text-sm text-ink-faint">/p/</span>
              <input name="slug" placeholder="shipping-and-returns" className="input font-mono" />
            </div>
          </Field>
          <div>
            <button type="submit" className={buttonClass("primary", "sm")}>
              Add page
            </button>
          </div>
        </Fieldset>
      </form>
    </div>
  );
}
