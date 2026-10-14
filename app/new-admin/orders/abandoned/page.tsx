import { Send } from "lucide-react";
import { PageHeader, StatStrip, pkr } from "@/components/new-admin/ui";
import { DataTable } from "@/components/new-admin/sort";

export const metadata = { title: "Abandoned checkouts" };

const LEFT = [
  { who: "Maryam H.", contact: "0300 ●●●● 412", cart: "Zohra 3-piece, Kajal kurta", total: 15100, when: "40 min ago", at: 3 },
  { who: "Guest", contact: "sadia.k@gmail.com", cart: "Siyah Gul organza", total: 13200, when: "3 hours ago", at: 2 },
  { who: "Anum R.", contact: "0321 ●●●● 908", cart: "Gulnaar lawn ×2", total: 14900, when: "Yesterday", at: 1 },
];

export default function AbandonedPage() {
  return (
    <>
      <PageHeader icon="orders" tone="iris" title="Abandoned checkouts" sub="People who reached checkout and stopped. A friendly reminder brings many back." />
      <StatStrip stats={[{ label: "Left this week", value: "11" }, { label: "Worth", value: pkr(126400) }, { label: "Came back after a reminder", value: "4", delta: "36%" }, { label: "Most left at", value: "Delivery charges" }]} />
      <DataTable
        cols={[
          { key: "who", label: "Who" },
          { key: "cart", label: "In the cart" },
          { key: "when", label: "When", numeric: true },
          { key: "total", label: "Total", align: "right", numeric: true },
          { key: "go", label: "", sort: false },
        ]}
        rows={LEFT.map((l) => ({
          id: l.contact,
          by: { who: l.who, cart: l.cart, when: l.at, total: l.total },
          cells: {
            who: <><span className="block font-medium">{l.who}</span><span className="text-[12.5px] text-[#0a0a0a]/50">{l.contact}</span></>,
            cart: <span className="text-[#0a0a0a]/70">{l.cart}</span>,
            when: <span className="text-[#0a0a0a]/60">{l.when}</span>,
            total: <b className="font-semibold">{pkr(l.total)}</b>,
            go: <span className="flex justify-end"><span className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a0a0a] px-2.5 py-1 text-[13px] font-semibold text-white"><Send className="h-3.5 w-3.5" /> Remind</span></span>,
          },
        }))}
      />
    </>
  );
}
