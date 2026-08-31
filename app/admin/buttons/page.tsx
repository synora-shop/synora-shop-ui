import { db } from "@/lib/data/shop";
import { ButtonsManager } from "@/components/customizer/buttons-manager";
import { PageHeader } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export default async function ButtonsPage() {
  const rows = await (
    await db()
  ).stickyButton.findMany({
    orderBy: { order: "asc" },
    select: {
      kind: true,
      label: true,
      value: true,
      message: true,
      scope: true,
      iconKind: true,
      iconValue: true,
      color: true,
      isVisible: true,
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sticky buttons"
        description="Floating contact buttons that follow the customer down the page. Each one can appear on the home page only, on shopping pages, or everywhere."
      />
      <ButtonsManager initial={rows} />
    </div>
  );
}
