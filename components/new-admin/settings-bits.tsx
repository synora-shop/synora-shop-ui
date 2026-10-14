"use client";

import { useState } from "react";
import { Bold, ChevronDown, Code2, Italic, Link2, List, Plus, Underline } from "lucide-react";
import { Pill } from "@/components/new-admin/ui";
import { useToast } from "@/components/new-admin/shell";

/**
 * Settings pieces that answer back as you change them (preview): the order
 * number as customers will see it, staff roles, and policies that open in
 * place to be written.
 */
export function OrderNumber() {
  const [pre, setPre] = useState("#ZL-");
  const [suf, setSuf] = useState("");
  const field = "h-10 w-full rounded-[10px] px-3.5 text-[14px] outline-none ring-1 ring-[#0a0a0a]/15 focus:ring-2 focus:ring-[#0a0a0a]";
  return (
    <div className="grid gap-3 p-5 sm:grid-cols-2">
      <label className="block"><span className="mb-1.5 block text-[13px] font-semibold">Before the number</span><input value={pre} onChange={(e) => setPre(e.target.value)} maxLength={8} className={field} /></label>
      <label className="block"><span className="mb-1.5 block text-[13px] font-semibold">After the number</span><input value={suf} onChange={(e) => setSuf(e.target.value)} maxLength={8} placeholder="Nothing" className={field} /></label>
      <p className="text-[13px] text-[#0a0a0a]/55 sm:col-span-2">
        Customers will see{" "}
        {[1049, 1050, 1051].map((n, i) => (
          <span key={n}>{i > 0 && ", "}<b className="rounded-md bg-[#0a0a0a] px-1.5 py-0.5 font-mono text-[12px] font-semibold text-white">{pre}{n}{suf}</b></span>
        ))}
        …
      </p>
    </div>
  );
}

const ROLES = ["Admin", "Staff", "Viewer"] as const;
export function TeamList({ owner, ownerEmail }: { owner: string; ownerEmail: string }) {
  const toast = useToast();
  const [people, setPeople] = useState([
    { name: "Bilal Khan", what: "active today", role: "Admin" as string },
    { name: "Rida Aslam", what: "packs orders · active 2 hours ago", role: "Staff" as string },
  ]);
  const [invite, setInvite] = useState(true);
  return (
    <div className="divide-y divide-[#0a0a0a]/[0.06]">
      <div className="flex items-center gap-4 px-5 py-3.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#0a0a0a] text-[12px] font-semibold text-white">AK</span>
        <div className="min-w-0 flex-1"><p className="text-[14.5px] font-medium">{owner}</p><p className="text-[13px] text-[#0a0a0a]/55">{ownerEmail} · everything, including billing and closing the store</p></div>
        <Pill tone="off">Owner</Pill>
      </div>
      {people.map((p, i) => (
        <div key={p.name} className="flex items-center gap-4 px-5 py-3.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#c8e7ff] text-[12px] font-semibold">{p.name.split(" ").map((w) => w[0]).join("")}</span>
          <div className="min-w-0 flex-1"><p className="text-[14.5px] font-medium">{p.name}</p><p className="text-[13px] text-[#0a0a0a]/55">{p.what}</p></div>
          <label className="relative">
            <span className="sr-only">Role for {p.name}</span>
            <select value={p.role} onChange={(e) => { const before = people; setPeople(people.map((x, j) => (j === i ? { ...x, role: e.target.value } : x))); toast(`${p.name} is now ${e.target.value}`, () => setPeople(before)); }} className="h-9 appearance-none rounded-[10px] bg-[#f5f5f5] pl-3 pr-8 text-[13px] font-semibold outline-none">
              {ROLES.map((r) => <option key={r}>{r}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-[#0a0a0a]/45" />
          </label>
          <button type="button" onClick={() => { const before = people; setPeople(people.filter((_, j) => j !== i)); toast(`${p.name} removed`, () => setPeople(before)); }} className="text-[13px] font-semibold text-[#a3330c]">Remove</button>
        </div>
      ))}
      {invite && (
        <div className="flex items-center gap-4 px-5 py-3.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-dashed border-[#0a0a0a]/25 text-[12px] text-[#0a0a0a]/45">?</span>
          <div className="min-w-0 flex-1"><p className="text-[14.5px] font-medium">sana@zohralawn.pk</p><p className="text-[13px] text-[#0a0a0a]/55">Invited as Staff 2 days ago · link good for 5 more days</p></div>
          <button type="button" onClick={() => toast("Invite sent again")} className="text-[13px] font-semibold text-[#4b4bea]">Resend</button>
          <button type="button" onClick={() => { setInvite(false); toast("Invite cancelled", () => setInvite(true)); }} className="text-[13px] font-semibold text-[#0a0a0a]/55">Cancel</button>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-4 px-5 py-3.5">
        <button type="button" onClick={() => toast("Invite box opened")} className="inline-flex items-center gap-1.5 text-[14px] font-semibold"><Plus className="h-4 w-4" /> Invite someone</button>
        <span className="text-[13px] text-[#0a0a0a]/50">Admin, Staff, or Viewer (can look, cannot change)</span>
        <button type="button" onClick={() => toast("Choose who becomes owner; we ask for your password")} className="ml-auto text-[13px] font-semibold text-[#0a0a0a]/60 hover:text-[#0a0a0a]">Hand over ownership</button>
      </div>
    </div>
  );
}

const POLICIES = [
  { t: "Return and refund policy", done: true, body: "You can return any unworn piece within 7 days of delivery, with its tags on. We collect it from your door in Lahore, Karachi and Islamabad; elsewhere, send it by courier and we refund the charge." },
  { t: "Privacy policy", done: true, body: "We keep your name, phone number and address only to deliver your order and to let you see it later. We never sell them." },
  { t: "Terms of service", done: false, body: "A draft written for shops in Pakistan. Read it through, change anything, then publish." },
  { t: "Shipping policy", done: true, body: "Lahore next day; Karachi, Islamabad and Rawalpindi in 2 to 3 days; the rest of Pakistan in 3 to 5." },
  { t: "Contact information", done: true, body: "Zohra Lawn · 12-B Main Boulevard, Gulberg III, Lahore · 0300 1234567 · ayesha@zohralawn.pk" },
  { t: "Legal notice", done: false, body: "" },
];
export function PolicyList() {
  const toast = useToast();
  const [open, setOpen] = useState<string | null>(null);
  const [rows, setRows] = useState(POLICIES);
  return (
    <div className="divide-y divide-[#0a0a0a]/[0.06]">
      {rows.map((p, i) => (
        <div key={p.t}>
          <button type="button" onClick={() => setOpen(open === p.t ? null : p.t)} aria-expanded={open === p.t} className="flex w-full items-center gap-4 px-5 py-3.5 text-left hover:bg-[#fafafa]">
            <span className="min-w-0 flex-1">
              <span className="block text-[14.5px] font-medium">{p.t}</span>
              <span className="block text-[13px] text-[#0a0a0a]/55">{p.done ? "Published · linked from checkout and your footer" : p.body ? "A draft is ready: read it, then publish" : "Not written yet"}</span>
            </span>
            {p.done ? <Pill tone="good">Published</Pill> : <Pill tone={p.body ? "wait" : "off"}>{p.body ? "Draft" : "Empty"}</Pill>}
            <ChevronDown className={`h-4 w-4 text-[#0a0a0a]/35 transition-transform ${open === p.t ? "rotate-180" : ""}`} />
          </button>
          {open === p.t && (
            <div className="bg-[#fafafa] px-5 pb-5 pt-1">
              <div className="overflow-hidden rounded-xl bg-white ring-1 ring-[#0a0a0a]/12">
                <div className="flex items-center gap-1 border-b border-[#0a0a0a]/[0.07] px-2 py-1.5 text-[#0a0a0a]/60">
                  {[Bold, Italic, Underline, List, Link2].map((I, k) => <span key={k} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-[#f0f0f0]"><I className="h-4 w-4" /></span>)}
                  <span className="ml-auto grid h-8 w-8 place-items-center rounded-lg hover:bg-[#f0f0f0]" title="Edit as HTML"><Code2 className="h-4 w-4" /></span>
                </div>
                <textarea defaultValue={p.body} rows={5} placeholder="Write it here, or start from our wording for Pakistan." className="block w-full resize-y px-4 py-3 text-[14px] leading-relaxed outline-none" />
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                <span className="mr-auto text-[12.5px] text-[#0a0a0a]/50">Not legal advice; you are responsible for what it says.</span>
                <button type="button" onClick={() => setOpen(null)} className="rounded-[10px] px-3.5 py-2 text-[13px] font-semibold ring-1 ring-[#0a0a0a]/12">Cancel</button>
                <button type="button" onClick={() => { const before = rows; setRows(rows.map((x, j) => (j === i ? { ...x, done: true, body: x.body || "Written." } : x))); setOpen(null); toast(`${p.t} published`, () => setRows(before)); }} className="rounded-[10px] bg-[#0a0a0a] px-3.5 py-2 text-[13px] font-semibold text-white">{p.done ? "Save" : "Publish"}</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
