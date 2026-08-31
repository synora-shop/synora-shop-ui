import { redirect } from "next/navigation";
import Link from "next/link";
import { shopSession } from "@/lib/auth-guard";
import { db } from "@/lib/data/shop";
import { listMetafields } from "@/lib/data/metafields";
import { isOwnerType, type OwnerType } from "@/lib/metafields";
import { MetafieldsEditor } from "@/components/admin/metafields-editor";
import { PageHeader, Card } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TABS: { type: OwnerType; label: string }[] = [
  { type: "product", label: "Products" },
  { type: "collection", label: "Categories" },
  { type: "page", label: "Pages" },
  { type: "shop", label: "The store" },
];

/** The things of one kind that can carry a field, for the picker. */
async function ownersOf(ownerType: OwnerType): Promise<{ id: string; label: string }[]> {
  const client = await db();
  switch (ownerType) {
    case "product": {
      const rows = await client.product.findMany({
        where: { deletedAt: null },
        select: { id: true, title: true },
        orderBy: { title: "asc" },
        take: 500,
      });
      return rows.map((r) => ({ id: r.id, label: r.title }));
    }
    case "collection": {
      const rows = await client.category.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      });
      return rows.map((r) => ({ id: r.id, label: r.name }));
    }
    case "page": {
      const rows = await client.page.findMany({
        select: { id: true, title: true },
        orderBy: { title: "asc" },
      });
      return rows.map((r) => ({ id: r.id, label: r.title }));
    }
    case "shop":
      // The store itself is the only owner, and it has no row to choose.
      return [{ id: "", label: "The whole store" }];
  }
}

export default async function MetafieldsPage(props: PageProps<"/admin/metafields">) {
  const me = await shopSession();
  if (!me) redirect("/merchant/login?callbackUrl=/admin/metafields");

  const sp = await props.searchParams;
  const ownerType: OwnerType = isOwnerType(sp.on) ? sp.on : "product";
  const owners = await ownersOf(ownerType);

  const requested = typeof sp.id === "string" ? sp.id : undefined;
  const owner =
    owners.find((o) => o.id === requested) ?? owners[0] ?? null;

  const rows = owner ? await listMetafields(ownerType, owner.id) : [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Custom fields"
        description="Extra information on your products, categories and pages, which your theme can read and show. Shopify calls these metafields. A theme written for Shopify looks for them by the same name."
      />

      <div className="flex flex-wrap gap-1.5">
        {TABS.map((tab) => (
          <Link
            key={tab.type}
            href={`/admin/metafields?on=${tab.type}`}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              tab.type === ownerType
                ? "border-brand-500 bg-brand-50 text-brand-600"
                : "border-border text-ink-soft hover:bg-subtle"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {owners.length === 0 ? (
        <Card className="p-6 text-center text-sm text-ink-soft">
          There are no {TABS.find((t) => t.type === ownerType)?.label.toLowerCase()} to add fields to yet.
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
          {ownerType !== "shop" && (
            <Card className="max-h-[28rem] overflow-y-auto p-1.5">
              {owners.map((o) => (
                <Link
                  key={o.id}
                  href={`/admin/metafields?on=${ownerType}&id=${o.id}`}
                  className={cn(
                    "block truncate rounded-lg px-2.5 py-2 text-sm transition-colors",
                    o.id === owner?.id
                      ? "bg-brand-50 font-medium text-brand-600"
                      : "text-ink-soft hover:bg-subtle hover:text-ink"
                  )}
                >
                  {o.label}
                </Link>
              ))}
            </Card>
          )}

          <div className={cn("min-w-0", ownerType === "shop" && "lg:col-span-2")}>
            {owner && (
              <>
                <p className="mb-2 text-sm font-medium">{owner.label}</p>
                <MetafieldsEditor
                  key={`${ownerType}:${owner.id}`}
                  ownerType={ownerType}
                  ownerId={owner.id}
                  initial={rows.map((r) => ({
                    id: r.id,
                    namespace: r.namespace,
                    key: r.key,
                    type: r.type,
                    value: r.value,
                  }))}
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
