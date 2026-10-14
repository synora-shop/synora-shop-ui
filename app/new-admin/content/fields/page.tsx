import { Plus } from "lucide-react";
import { Button, PageHeader } from "@/components/new-admin/ui";
import { DataTable } from "@/components/new-admin/sort";
import { CopyPath } from "@/components/new-admin/copy-path";

export const metadata = { title: "Custom fields" };

/**
 * Custom fields (preview): extra details a theme can print. Every field shows
 * the exact line that prints it, copied in one click, because that is why a
 * merchant is here: they want it on the page.
 */
const FIELDS = [
  { on: "Products", name: "Fabric", type: "Text", key: "fabric", filled: "11 of 12" },
  { on: "Products", name: "Care instructions", type: "Text", key: "care", filled: "9 of 12" },
  { on: "Products", name: "Dupatta length", type: "Number (metres)", key: "dupatta_length", filled: "6 of 12" },
  { on: "Variants", name: "Chest size", type: "Number (inches)", key: "chest", filled: "28 of 40" },
  { on: "Customers", name: "Preferred delivery time", type: "Choice", key: "delivery_time", filled: "31 of 214" },
  { on: "Orders", name: "Gift message", type: "Text", key: "gift_message", filled: "on 6 orders" },
];

export default function FieldsPage() {
  return (
    <>
      <PageHeader icon="content" tone="mint" title="Custom fields" sub="Extra details on products, orders and customers, for your theme to show." actions={<Button primary><Plus className="h-4 w-4" /> Add a field</Button>} />
      <DataTable
        minWidth={760}
        cols={[
          { key: "name", label: "Field" },
          { key: "on", label: "On" },
          { key: "type", label: "Kind" },
          { key: "filled", label: "Filled in" },
          { key: "path", label: "Prints with", sort: false },
        ]}
        rows={FIELDS.map((f) => ({
          id: f.on + f.key,
          by: { name: f.name, on: f.on, type: f.type, filled: f.filled },
          cells: {
            name: <b className="font-semibold">{f.name}</b>,
            on: f.on,
            type: <span className="text-[#0a0a0a]/60">{f.type}</span>,
            filled: <span className="text-[#0a0a0a]/60">{f.filled}</span>,
            path: <CopyPath path={`{{ ${f.on === "Variants" ? "variant" : f.on.toLowerCase().replace(/s$/, "")}.metafields.custom.${f.key} }}`} />,
          },
        }))}
      />
    </>
  );
}
