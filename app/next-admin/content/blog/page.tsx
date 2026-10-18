import Link from "next/link";
import { Plus } from "lucide-react";
import { Btn, Page, Status, T } from "@/components/next-admin/ui";
import { Table } from "@/components/next-admin/table";
import { A } from "@/components/next-admin/nav";

export const metadata = { title: "Blog posts" };

const POSTS = [
  { title: "How to style a lawn suit for Eid", status: "Published", when: "12 Oct", at: 2, views: 1840 },
  { title: "Caring for chikankari: a washing guide", status: "Published", when: "2 Oct", at: 1, views: 960 },
  { title: "Behind the Winter collection", status: "Draft", when: "Edited today", at: 3, views: 0 },
];

export default function BlogPage() {
  return (
    <Page title="Blog posts" crumbs={[{ label: "Content", href: `${A}/content` }]} sub="Write with pictures, videos and links, or your own HTML." actions={<Btn kind="primary" href={`${A}/content/blog/new`}><Plus /> Write a post</Btn>}>
      <Table
        views={["All", "Published", "Draft"]}
        search="Search posts"
        cols={[{ key: "title", label: "Title" }, { key: "status", label: "Status" }, { key: "when", label: "Date" }, { key: "views", label: "Views", right: true }]}
        rows={POSTS.map((p) => ({
          id: p.title,
          views: [p.status],
          by: { title: p.title, status: p.status, when: p.at, views: p.views },
          cells: {
            title: <Link href={`${A}/content/blog/new`} className="font-medium hover:underline">{p.title}</Link>,
            status: <Status tone={p.status === "Published" ? "good" : "off"}>{p.status}</Status>,
            when: <span className={T.muted}>{p.when}</span>,
            views: <span className="tabular-nums">{p.views.toLocaleString("en-PK")}</span>,
          },
        }))}
      />
    </Page>
  );
}
