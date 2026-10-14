import { CornerDownRight, GripVertical, Plus } from "lucide-react";
import { Button, Card, PageHeader } from "@/components/new-admin/ui";

export const metadata = { title: "Menus" };

const MAIN = [
  { label: "Shop", to: "All products", children: [{ label: "Summer Lawn", to: "Collection" }, { label: "Eid Edit", to: "Collection" }, { label: "Pret", to: "Collection" }] },
  { label: "New arrivals", to: "Collection" },
  { label: "Size guide", to: "Page" },
  { label: "Contact", to: "Page" },
];

export default function MenusPage() {
  return (
    <>
      <PageHeader icon="content" tone="mint" title="Menus" sub="The links in your store's header and footer. Up to 100 menus, each nested as deep as you need." actions={<Button primary><Plus className="h-4 w-4" /> Create menu</Button>} />
      <div className="grid gap-5 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <Card pad={false}>
          <ul className="p-2">
            {["Main menu", "Footer", "Help links"].map((m, i) => (
              <li key={m} className={`rounded-lg px-3 py-2.5 text-[14px] ${i === 0 ? "bg-[#f0f0f0] font-semibold" : "text-[#0a0a0a]/70"}`}>{m}<span className="float-right text-[12px] text-[#0a0a0a]/40">{[7, 5, 3][i]}</span></li>
            ))}
          </ul>
        </Card>
        <Card title="Main menu" action={<span className="text-[13px] font-semibold text-[#4b4bea]">Add item</span>}>
          <ul className="flex flex-col gap-2">
            {MAIN.map((it) => (
              <li key={it.label}>
                <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 ring-1 ring-[#0a0a0a]/10">
                  <GripVertical className="h-4 w-4 text-[#0a0a0a]/30" />
                  <span className="flex-1 font-medium">{it.label}</span>
                  <span className="text-[12.5px] text-[#0a0a0a]/50">{it.to}</span>
                </div>
                {it.children && (
                  <ul className="ml-8 mt-2 flex flex-col gap-2">
                    {it.children.map((c) => (
                      <li key={c.label} className="flex items-center gap-3 rounded-xl px-3 py-2 ring-1 ring-[#0a0a0a]/[0.07]">
                        <CornerDownRight className="h-4 w-4 text-[#0a0a0a]/30" />
                        <span className="flex-1 text-[14px]">{c.label}</span>
                        <span className="text-[12.5px] text-[#0a0a0a]/50">{c.to}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
