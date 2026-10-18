import { Send } from "lucide-react";
import { Metrics, Page, T, pkr } from "@/components/next-admin/ui";
import { Act } from "@/components/next-admin/act";
import { Table } from "@/components/next-admin/table";
import { A } from "@/components/next-admin/nav";

export const metadata = { title: "Abandoned checkouts" };

const LEFT = [
  { who: "Maryam H.", contact: "0300 ●●●● 412", cart: "Zohra 3-piece, Kajal kurta", total: 15100, when: "40 min ago", at: 3 },
  { who: "Guest", contact: "sadia.k@gmail.com", cart: "Siyah Gul organza", total: 13200, when: "3 hours ago", at: 2 },
  { who: "Anum R.", contact: "0321 ●●●● 908", cart: "Gulnaar lawn ×2", total: 14900, when: "Yesterday", at: 1 },
];

export default function AbandonedPage() {
  return (
    <Page title="Abandoned checkouts" crumbs={[{ label: "Orders", href: `${A}/orders` }]} sub="People who reached checkout and stopped. A friendly reminder brings many back.">
      <Metrics items={[{ label: "Left this week", value: "11" }, { label: "Worth", value: pkr(126400) }, { label: "Came back after a reminder", value: "4", delta: "36%" }, { label: "Most left at", value: "Delivery charges" }]} />
      <Table
        cols={[
          { key: "who", label: "Who" },
          { key: "cart", label: "In the cart" },
          { key: "when", label: "When" },
          { key: "total", label: "Total", right: true },
          { key: "go", label: "", sort: false, className: "w-24" },
        ]}
        rows={LEFT.map((l) => ({
          id: l.contact,
          by: { who: l.who, cart: l.cart, when: l.at, total: l.total },
          cells: {
            who: <>{l.who} <span className={T.muted}>· {l.contact}</span></>,
            cart: <span className="text-[#3a3a3a]">{l.cart}</span>,
            when: <span className={T.muted}>{l.when}</span>,
            total: <b className="font-semibold tabular-nums">{pkr(l.total)}</b>,
            go: <Act small msg={`Reminder sent to ${l.contact}`}><Send /> Remind</Act>,
          },
        }))}
      />
    </Page>
  );
}
