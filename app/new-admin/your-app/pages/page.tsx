import { Plus } from "lucide-react";
import { Button, PageHeader, Pill, td, th } from "@/components/new-admin/ui";

export const metadata = { title: "Pages" };

const PAGES = [["About us", "Published", "/about"], ["Size guide", "Published", "/p/size-guide"], ["Wholesale enquiries", "Published", "/p/wholesale"], ["Eid lookbook", "Draft", "/p/eid-lookbook"]];

export default function PagesPage() {
  return (
    <>
      <PageHeader icon="app" title="Pages" sub="The pages of your store that are not products: about, guides, lookbooks." actions={<Button primary><Plus className="h-4 w-4" /> Add page</Button>} />
      <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-[#0d0d50]/[0.07]">
        <table className="w-full">
          <thead className="bg-[#fafafc]"><tr><th className={th}>Page</th><th className={th}>Address</th><th className={th}>Status</th></tr></thead>
          <tbody className="divide-y divide-[#0d0d50]/[0.06]">
            {PAGES.map(([t, s, a]) => (
              <tr key={t}><td className={`${td} font-medium`}>{t}</td><td className={`${td} font-mono text-[12.5px] text-[#0d0d50]/55`}>{a}</td><td className={td}>{s === "Published" ? <Pill tone="good">Published</Pill> : <Pill tone="off">Draft</Pill>}</td></tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
