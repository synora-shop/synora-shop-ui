import { db } from "@/lib/data/shop";
import { findBrokenMenuLinks } from "@/lib/data/broken-links";
import { RedirectsManager } from "@/components/customizer/redirects-manager";
import { PageHeader } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export default async function RedirectsPage() {
  const [redirects, brokenLinks] = await Promise.all([
    (await db()).redirect.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fromPath: true,
        toPath: true,
        note: true,
        isActive: true,
        hits: true,
      },
    }),
    findBrokenMenuLinks(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Links & redirects"
        description="Keep old addresses working, so a link someone bookmarked or Google indexed never turns into a dead end."
      />
      <RedirectsManager redirects={redirects} brokenLinks={brokenLinks} />
    </div>
  );
}
