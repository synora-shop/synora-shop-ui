import { Send } from "lucide-react";
import { Card, PageHeader, StatStrip, pkr, td, th } from "@/components/new-admin/ui";

export const metadata = { title: "Abandoned checkouts" };

const LEFT = [
  { who: "Maryam H.", contact: "0300 ●●●● 412", cart: "Zohra 3-piece, Kajal kurta", total: 15100, when: "40 min ago" },
  { who: "Guest", contact: "sadia.k@gmail.com", cart: "Siyah Gul organza", total: 13200, when: "3 hours ago" },
  { who: "Anum R.", contact: "0321 ●●●● 908", cart: "Gulnaar lawn ×2", total: 14900, when: "Yesterday" },
];

export default function AbandonedPage() {
  return (
    <>
      <PageHeader icon="orders" tone="iris" title="Abandoned checkouts" sub="People who reached checkout and stopped. A friendly reminder brings many back." />
      <StatStrip stats={[{ label: "Left this week", value: "11" }, { label: "Worth", value: pkr(126400) }, { label: "Came back after a reminder", value: "4", delta: "36%" }, { label: "Most left at", value: "Delivery charges" }]} />
      <Card pad={false}>
        <table className="w-full">
          <thead className="bg-[#fafafa]"><tr><th className={th}>Who</th><th className={th}>In the cart</th><th className={th}>When</th><th className={`${th} text-right`}>Total</th><th className={th} /></tr></thead>
          <tbody className="divide-y divide-[#0a0a0a]/[0.06]">
            {LEFT.map((l) => (
              <tr key={l.contact}>
                <td className={td}><span className="block font-medium">{l.who}</span><span className="text-[12.5px] text-[#0a0a0a]/50">{l.contact}</span></td>
                <td className={`${td} text-[#0a0a0a]/70`}>{l.cart}</td>
                <td className={`${td} text-[#0a0a0a]/60`}>{l.when}</td>
                <td className={`${td} text-right font-semibold`}>{pkr(l.total)}</td>
                <td className={`${td} text-right`}><span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[13px] font-semibold ring-1 ring-[#0a0a0a]/12"><Send className="h-3.5 w-3.5" /> Remind</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
