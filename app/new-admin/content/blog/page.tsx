import { Plus } from "lucide-react";
import { Button, PageHeader, Pill, td, th } from "@/components/new-admin/ui";

export const metadata = { title: "Blog posts" };

const POSTS = [
  { title: "How to style a lawn suit for Eid", status: "Published", when: "12 Oct", views: 1840 },
  { title: "Caring for chikankari: a washing guide", status: "Published", when: "2 Oct", views: 960 },
  { title: "Behind the Winter collection", status: "Draft", when: "Edited today", views: 0 },
];

export default function BlogPage() {
  return (
    <>
      <PageHeader icon="content" title="Blog posts" sub="Write with pictures, videos and links, or your own HTML." actions={<Button primary><Plus className="h-4 w-4" /> Write a post</Button>} />
      <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-[#0d0d50]/[0.07]">
        <table className="w-full">
          <thead className="bg-[#fafafc]"><tr><th className={th}>Title</th><th className={th}>Status</th><th className={th}>Date</th><th className={`${th} text-right`}>Views</th></tr></thead>
          <tbody className="divide-y divide-[#0d0d50]/[0.06]">
            {POSTS.map((p) => (
              <tr key={p.title}>
                <td className={`${td} font-medium`}>{p.title}</td>
                <td className={td}>{p.status === "Published" ? <Pill tone="good">Published</Pill> : <Pill tone="off">Draft</Pill>}</td>
                <td className={`${td} text-[#0d0d50]/60`}>{p.when}</td>
                <td className={`${td} text-right tabular-nums`}>{p.views.toLocaleString("en-PK")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
