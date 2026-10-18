import { CornerDownRight, GripVertical, Plus } from "lucide-react";
import { Btn, Page, Panel, SEL, link } from "@/components/next-admin/ui";
import { A } from "@/components/next-admin/nav";

export const metadata = { title: "Menus" };

const MAIN = [
  { label: "Shop", to: "All products", children: [{ label: "Summer Lawn", to: "Collection" }, { label: "Eid Edit", to: "Collection" }, { label: "Pret", to: "Collection" }] },
  { label: "New arrivals", to: "Collection" },
  { label: "Size guide", to: "Page" },
  { label: "Contact", to: "Page" },
];

export default function MenusPage() {
  return (
    <Page title="Menus" crumbs={[{ label: "Content", href: `${A}/content` }]} sub="The links in your store's header and footer. Up to 100 menus, nested as deep as you need." actions={<Btn kind="primary"><Plus /> Create menu</Btn>}>
      <div className="grid gap-3 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <Panel flush>
          <ul className="flex flex-col gap-px p-1.5">
            {([["Main menu", "Header", 7], ["Footer", "Footer", 5], ["Help links", "Not shown", 3]] as const).map(([m, where, n], i) => (
              <li key={m} className={`rounded-[6px] px-2.5 py-1.5 ${i === 0 ? SEL : "hover:bg-[#fafafa]"}`}>
                <span className="flex items-center justify-between text-[13px] font-medium">{m}<span className="text-[11.5px] font-normal opacity-60">{n} links</span></span>
                <span className={`block text-[11.5px] ${where === "Not shown" ? "text-[#b45309]" : "opacity-60"}`}>{where === "Not shown" ? "Not shown anywhere yet" : `In the ${where.toLowerCase()}`}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Main menu" action={<button type="button" className={link}>Add item</button>}>
          <ul className="flex flex-col gap-1">
            {MAIN.map((it) => (
              <li key={it.label}>
                <div className="flex h-9 items-center gap-2.5 rounded-[6px] px-2.5 ring-1 ring-inset ring-[#e4e4e7]">
                  <GripVertical className="h-3.5 w-3.5 cursor-grab text-[#a1a1aa]" />
                  <span className="flex-1 text-[13px] font-medium">{it.label}</span>
                  <span className="text-[12px] text-[#71717a]">{it.to}</span>
                </div>
                {it.children && (
                  <ul className="ml-6 mt-1 flex flex-col gap-1">
                    {it.children.map((c) => (
                      <li key={c.label} className="flex h-8 items-center gap-2.5 rounded-[6px] px-2.5 ring-1 ring-inset ring-[#f0f0f2]">
                        <CornerDownRight className="h-3.5 w-3.5 text-[#a1a1aa]" />
                        <span className="flex-1 text-[13px]">{c.label}</span>
                        <span className="text-[12px] text-[#71717a]">{c.to}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </Page>
  );
}
