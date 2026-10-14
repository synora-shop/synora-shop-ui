import { Plus } from "lucide-react";
import { Button, PageHeader, Pill } from "@/components/new-admin/ui";
import { DataTable } from "@/components/new-admin/sort";

export const metadata = { title: "Blog posts" };

const POSTS = [
  { title: "How to style a lawn suit for Eid", status: "Published", when: "12 Oct", at: 2, views: 1840 },
  { title: "Caring for chikankari: a washing guide", status: "Published", when: "2 Oct", at: 1, views: 960 },
  { title: "Behind the Winter collection", status: "Draft", when: "Edited today", at: 3, views: 0 },
];

export default function BlogPage() {
  return (
    <>
      <PageHeader icon="content" tone="mint" title="Blog posts" sub="Write with pictures, videos and links, or your own HTML." actions={<Button primary><Plus className="h-4 w-4" /> Write a post</Button>} />
      <DataTable
        cols={[
          { key: "title", label: "Title" },
          { key: "status", label: "Status" },
          { key: "when", label: "Date", numeric: true },
          { key: "views", label: "Views", align: "right", numeric: true },
        ]}
        rows={POSTS.map((p) => ({
          id: p.title,
          by: { title: p.title, status: p.status, when: p.at, views: p.views },
          cells: {
            title: <span className="font-medium">{p.title}</span>,
            status: p.status === "Published" ? <Pill tone="good">Published</Pill> : <Pill tone="off">Draft</Pill>,
            when: <span className="text-[#0a0a0a]/60">{p.when}</span>,
            views: p.views.toLocaleString("en-PK"),
          },
        }))}
      />
    </>
  );
}
