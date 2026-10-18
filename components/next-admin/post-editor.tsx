"use client";

import { useState } from "react";
import { Bold, Code2, Heading2, ImagePlus, Italic, Link2, List, Video } from "lucide-react";
import { useToast } from "@/components/next-admin/bits";
import { Field, Page, Panel, SEL, Status, btn } from "@/components/next-admin/ui";
import { A } from "@/components/next-admin/nav";

/** Writing a post (third design): the words in a plain editor, or HTML one click away; the rest in the side column. */
export function PostEditor() {
  const toast = useToast();
  const [html, setHtml] = useState(false);
  const [title, setTitle] = useState("Behind the Winter collection");
  const [text, setText] = useState("Every winter we go back to the looms in Faisalabad. This year we stayed for a week.\n\nHere is what we found, and the six pieces that came out of it.");
  return (
    <Page
      title={title || "Untitled post"}
      crumbs={[{ label: "Content", href: `${A}/content` }, { label: "Blog posts", href: `${A}/content/blog` }]}
      meta={<Status tone="off">Draft · saved just now</Status>}
      actions={<><button type="button" onClick={() => toast("Draft saved")} className={btn()}>Save draft</button><button type="button" onClick={() => toast(`“${title}” is published`)} className={btn("primary")}>Publish</button></>}
    >
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="overflow-hidden rounded-[8px] border border-[#e4e4e7] bg-white">
          <input value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Title" className="w-full border-b border-[#f0f0f2] px-5 py-3.5 text-[20px] font-semibold tracking-[-0.01em] outline-none" />
          <div className="flex items-center gap-0.5 border-b border-[#f0f0f2] px-2 py-1 text-[#52525b]">
            {[Heading2, Bold, Italic, List, Link2, ImagePlus, Video].map((I, k) => <span key={k} className={`grid h-7 w-7 place-items-center rounded-[4px] ${html ? "opacity-30" : "hover:bg-[#f4f4f5]"}`}><I className="h-3.5 w-3.5" /></span>)}
            <button type="button" onClick={() => setHtml(!html)} aria-pressed={html} className={`ml-auto inline-flex h-7 items-center gap-1.5 rounded-[6px] px-2 text-[12px] font-medium ${html ? SEL : "hover:bg-[#f4f4f5]"}`}><Code2 className="h-3.5 w-3.5" /> HTML</button>
          </div>
          <textarea
            value={html ? `<h1>${title}</h1>\n${text.split("\n\n").map((p) => `<p>${p}</p>`).join("\n")}` : text}
            onChange={(e) => !html && setText(e.target.value)}
            readOnly={html}
            rows={16}
            aria-label="Post"
            className={`block w-full resize-y px-5 py-4 outline-none ${html ? "bg-[#fafafa] font-mono text-[12.5px] leading-relaxed text-[#3730a3]" : "text-[14.5px] leading-[1.75]"}`}
          />
        </section>
        <aside className="flex flex-col gap-3">
          <Panel title="Publishing">
            <p className="text-[12.5px] text-[#71717a]">Publish now, or choose a date and time and it publishes by itself.</p>
            <input type="datetime-local" className="mt-2 h-8 w-full rounded-[6px] border border-[#d4d4d8] px-2 text-[13px]" />
          </Panel>
          <Panel title="Cover picture">
            <div className="grid aspect-video place-items-center rounded-[6px] border border-dashed border-[#d4d4d8] text-[12.5px] text-[#a1a1aa]">Drop a picture</div>
          </Panel>
          <Panel>
            <div className="flex flex-col gap-3">
              <Field label="Author" value="Ayesha Khan" />
              <Field label="Tags" value="Winter, Behind the scenes" />
              <Field label="Short summary" area value="A week at the looms in Faisalabad." />
            </div>
          </Panel>
        </aside>
      </div>
    </Page>
  );
}
