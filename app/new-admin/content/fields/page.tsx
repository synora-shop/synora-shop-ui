import { Plus } from "lucide-react";
import { Button, PageHeader, td, th } from "@/components/new-admin/ui";
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
      <section className="overflow-x-auto rounded-2xl bg-white ring-1 ring-[#0a0a0a]/[0.07]">
        <table className="w-full min-w-[760px]">
          <thead className="bg-[#fafafa]"><tr><th className={th}>Field</th><th className={th}>On</th><th className={th}>Kind</th><th className={th}>Filled in</th><th className={th}>Prints with</th></tr></thead>
          <tbody className="divide-y divide-[#0a0a0a]/[0.06]">
            {FIELDS.map((f) => (
              <tr key={f.on + f.key}>
                <td className={`${td} font-semibold`}>{f.name}</td>
                <td className={td}>{f.on}</td>
                <td className={`${td} text-[#0a0a0a]/60`}>{f.type}</td>
                <td className={`${td} text-[#0a0a0a]/60`}>{f.filled}</td>
                <td className={td}><CopyPath path={`{{ ${f.on === "Variants" ? "variant" : f.on.toLowerCase().replace(/s$/, "")}.metafields.custom.${f.key} }}`} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
