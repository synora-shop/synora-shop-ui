"use client";

import { useState } from "react";
import { Bold, Code2, Heading2, ImagePlus, Italic, Link2, List, Video } from "lucide-react";
import { useToast } from "@/components/new-admin/shell";

/**
 * Writing a blog post (preview): a plain editor with pictures, video and
 * links, or the merchant's own HTML in the same box, one click apart. The
 * right column is everything about the post that is not the words.
 */
export function PostEditor() {
  const toast = useToast();
  const [html, setHtml] = useState(false);
  const [title, setTitle] = useState("Behind the Winter collection");
  const [text, setText] = useState("Every winter we go back to the looms in Faisalabad. This year we stayed for a week.\n\nHere is what we found, and the six pieces that came out of it.");
  const field = "h-10 w-full rounded-[10px] bg-white px-3.5 text-[14px] outline-none ring-1 ring-[#0a0a0a]/15 focus:ring-2 focus:ring-[#0a0a0a]";
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
      <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-[#0a0a0a]/[0.07]">
        <input value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Title" className="w-full border-b border-[#0a0a0a]/[0.06] px-6 py-5 text-[24px] font-semibold tracking-[-0.02em] outline-none" />
        <div className="flex items-center gap-1 border-b border-[#0a0a0a]/[0.06] px-3 py-1.5 text-[#0a0a0a]/60">
          {[Heading2, Bold, Italic, List, Link2, ImagePlus, Video].map((I, k) => <span key={k} className={`grid h-8 w-8 place-items-center rounded-lg ${html ? "opacity-30" : "hover:bg-[#f0f0f0]"}`}><I className="h-4 w-4" /></span>)}
          <button type="button" onClick={() => setHtml(!html)} aria-pressed={html} className={`ml-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold ${html ? "bg-[#0a0a0a] text-white" : "hover:bg-[#f0f0f0]"}`}><Code2 className="h-4 w-4" /> HTML</button>
        </div>
        <textarea
          value={html ? `<h1>${title}</h1>\n${text.split("\n\n").map((p) => `<p>${p}</p>`).join("\n")}` : text}
          onChange={(e) => !html && setText(e.target.value)}
          readOnly={html}
          rows={14}
          aria-label="Post"
          className={`block w-full resize-y px-6 py-5 outline-none ${html ? "bg-[#0a0a0a] font-mono text-[13px] leading-relaxed text-[#b8efd6]" : "text-[15.5px] leading-[1.75]"}`}
        />
      </section>
      <aside className="flex flex-col gap-4">
        <section className="rounded-2xl bg-[#0a0a0a] p-5 text-white">
          <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#b8efd6]">Status</p>
          <p className="mt-1 text-[16px] font-semibold">Draft · saved just now</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => toast("Draft saved")} className="rounded-[10px] py-2 text-[13px] font-semibold ring-1 ring-white/20">Save draft</button>
            <button type="button" onClick={() => toast(`“${title}” is published`)} className="rounded-[10px] bg-white py-2 text-[13px] font-semibold text-[#0a0a0a]">Publish</button>
          </div>
          <p className="mt-3 text-[12px] text-white/50">Or choose a date and time to publish it by itself.</p>
        </section>
        <section className="rounded-2xl bg-white p-5 ring-1 ring-[#0a0a0a]/[0.07]">
          <p className="mb-2 text-[14px] font-semibold">Cover picture</p>
          <div className="grid aspect-video place-items-center rounded-xl border-2 border-dashed border-[#0a0a0a]/12 text-[13px] text-[#0a0a0a]/45">Drop a picture</div>
        </section>
        <section className="flex flex-col gap-3 rounded-2xl bg-white p-5 ring-1 ring-[#0a0a0a]/[0.07]">
          <label className="block"><span className="mb-1.5 block text-[13px] font-semibold">Author</span><input defaultValue="Ayesha Khan" className={field} /></label>
          <label className="block"><span className="mb-1.5 block text-[13px] font-semibold">Tags</span><input defaultValue="Winter, Behind the scenes" className={field} /></label>
          <label className="block"><span className="mb-1.5 block text-[13px] font-semibold">Short summary</span><textarea rows={3} defaultValue="A week at the looms in Faisalabad." className="w-full rounded-[10px] px-3.5 py-2.5 text-[14px] outline-none ring-1 ring-[#0a0a0a]/15 focus:ring-2 focus:ring-[#0a0a0a]" /></label>
        </section>
      </aside>
    </div>
  );
}
