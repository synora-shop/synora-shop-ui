"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { useToast } from "@/components/next-admin/bits";
import { ICONS } from "@/components/new-admin/ui";
import { SIDE, Status, btn, link } from "@/components/next-admin/ui";
import { A, STORE_SETTINGS } from "@/components/next-admin/nav";
import { WORDS } from "@/components/new-admin/settings-words";

/** The settings list (third design): grouped, searchable, the open one tinted. */
export function SettingsNav() {
  const path = usePathname();
  const [q, setQ] = useState("");
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const hits = STORE_SETTINGS.filter((s) => words.every((w) => `${s.label} ${s.blurb} ${WORDS[s.slug] ?? ""}`.toLowerCase().includes(w)));
  return (
    <nav aria-label="Settings" className={`${SIDE.wrap} lg:sticky lg:top-[72px] lg:self-start`}>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a setting" aria-label="Find a setting" className={SIDE.find} />
      <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-px">
        {hits.map((s, i) => {
          const on = path === `${A}/settings/${s.slug}`;
          const Icon = ICONS[s.icon];
          return (
            <li key={s.slug}>
              {(i === 0 || hits[i - 1].group !== s.group) && <p className={`hidden lg:block ${SIDE.group}`}>{s.group}</p>}
              <Link href={`${A}/settings/${s.slug}`} aria-current={on ? "page" : undefined} className={`${SIDE.item} ${on ? SIDE.on : SIDE.off}`}>
                <Icon className={`h-4 w-4 shrink-0 ${on ? "text-[#b7b9ff]" : "text-white/45"}`} /> {s.label}
              </Link>
            </li>
          );
        })}
        {hits.length === 0 && <li className="px-2.5 py-2 text-[12.5px] text-white/45">Nothing matches.</li>}
      </ul>
      <p className="mt-1.5 hidden border-t border-white/[0.07] px-2.5 pb-1 pt-2.5 text-[12px] leading-relaxed text-white/40 lg:block">
        Your own profile, password and devices are under <Link href={`${A}/account`} className="font-medium text-[#b7b9ff] hover:underline">Your account</Link>, in the store menu.
      </p>
    </nav>
  );
}

/** The order number as customers will see it, as you type. */
export function OrderNumber() {
  const [pre, setPre] = useState("#ZL-");
  const [suf, setSuf] = useState("");
  const f = "h-8 w-full rounded-[10px] border border-[#dddddd] px-2.5 text-[13px] outline-none focus:border-[#6666ff]";
  return (
    <div className="grid gap-3 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <label className="block"><span className="mb-1 block text-[12.5px] font-medium text-[#3a3a3a]">Before the number</span><input value={pre} onChange={(e) => setPre(e.target.value)} maxLength={8} className={f} /></label>
      <label className="block"><span className="mb-1 block text-[12.5px] font-medium text-[#3a3a3a]">After the number</span><input value={suf} onChange={(e) => setSuf(e.target.value)} maxLength={8} placeholder="Nothing" className={f} /></label>
      <p className="flex h-8 items-center gap-1 text-[12.5px] text-[#737373]">
        Customers see {[1049, 1050].map((n) => <b key={n} className="rounded-[6px] bg-[#f3f3f3] px-1.5 py-0.5 font-mono text-[12px] font-semibold text-[#0a0a0a]">{pre}{n}{suf}</b>)}…
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
  const av = (t: string, cls: string) => <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${cls}`}>{t}</span>;
  return (
    <div className="divide-y divide-[#f1f1f1]">
      <div className="flex h-12 items-center gap-3 px-4">
        {av("AK", "bg-[#ecebff] text-[#3d3dc4]")}
        <div className="min-w-0 flex-1"><p className="text-[13px] font-medium">{owner} <span className="font-normal text-[#737373]">· {ownerEmail}</span></p><p className="truncate text-[12px] text-[#737373]">Everything, including billing and closing the store</p></div>
        <Status tone="off">Owner</Status>
      </div>
      {people.map((p, i) => (
        <div key={p.name} className="flex h-12 items-center gap-3 px-4">
          {av(p.name.split(" ").map((w) => w[0]).join(""), "bg-[#e0f2fe] text-[#075985]")}
          <div className="min-w-0 flex-1"><p className="text-[13px] font-medium">{p.name}</p><p className="truncate text-[12px] text-[#737373]">{p.what}</p></div>
          <label className="relative">
            <span className="sr-only">Role for {p.name}</span>
            <select value={p.role} onChange={(e) => { const before = people; setPeople(people.map((x, j) => (j === i ? { ...x, role: e.target.value } : x))); toast(`${p.name} is now ${e.target.value}`, () => setPeople(before)); }} className="h-7 appearance-none rounded-[10px] bg-white pl-2.5 pr-7 text-[12.5px] font-medium outline-none ring-1 ring-inset ring-[#dddddd]">
              {ROLES.map((r) => <option key={r}>{r}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1.5 h-3.5 w-3.5 text-[#a3a3a3]" />
          </label>
          <button type="button" onClick={() => { const before = people; setPeople(people.filter((_, j) => j !== i)); toast(`${p.name} removed`, () => setPeople(before)); }} className="text-[12.5px] text-[#737373] hover:text-[#b91c1c]">Remove</button>
        </div>
      ))}
      {invite && (
        <div className="flex h-12 items-center gap-3 px-4">
          {av("?", "border border-dashed border-[#dddddd] text-[#a3a3a3]")}
          <div className="min-w-0 flex-1"><p className="text-[13px] font-medium">sana@zohralawn.pk</p><p className="truncate text-[12px] text-[#737373]">Invited as Staff 2 days ago · link good for 5 more days</p></div>
          <button type="button" onClick={() => toast("Invite sent again")} className={link}>Resend</button>
          <button type="button" onClick={() => { setInvite(false); toast("Invite cancelled", () => setInvite(true)); }} className="text-[12.5px] text-[#737373] hover:text-[#0a0a0a]">Cancel</button>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3 px-4 py-2.5">
        <button type="button" onClick={() => toast("Invite box opened")} className={btn()}><Plus /> Invite someone</button>
        <span className="text-[12px] text-[#737373]">Admin, Staff, or Viewer (can look, cannot change)</span>
        <button type="button" onClick={() => toast("Choose who becomes owner; we ask for your password")} className="ml-auto text-[12.5px] text-[#737373] hover:text-[#0a0a0a]">Hand over ownership</button>
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
    <div className="divide-y divide-[#f1f1f1]">
      {rows.map((p, i) => (
        <div key={p.t}>
          <button type="button" onClick={() => setOpen(open === p.t ? null : p.t)} aria-expanded={open === p.t} className="flex h-11 w-full items-center gap-3 px-4 text-left hover:bg-[#fafafa]">
            <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{p.t} <span className="font-normal text-[#737373]">· {p.done ? "linked from checkout and your footer" : p.body ? "a draft is ready to read" : "not written yet"}</span></span>
            <Status tone={p.done ? "good" : p.body ? "wait" : "off"}>{p.done ? "Published" : p.body ? "Draft" : "Empty"}</Status>
            <ChevronDown className={`h-3.5 w-3.5 text-[#a3a3a3] transition-transform ${open === p.t ? "rotate-180" : ""}`} />
          </button>
          {open === p.t && (
            <div className="bg-[#fafafa] px-4 pb-3 pt-1">
              <textarea defaultValue={p.body} rows={5} placeholder="Write it here, or start from our wording for Pakistan." className="block w-full resize-y rounded-[10px] border border-[#dddddd] bg-white px-3 py-2 text-[13px] leading-relaxed outline-none focus:border-[#6666ff]" />
              <div className="mt-2 flex flex-wrap items-center justify-end gap-1.5">
                <span className="mr-auto text-[12px] text-[#737373]">Not legal advice; you are responsible for what it says.</span>
                <button type="button" onClick={() => setOpen(null)} className={btn()}>Cancel</button>
                <button type="button" onClick={() => { const before = rows; setRows(rows.map((x, j) => (j === i ? { ...x, done: true, body: x.body || "Written." } : x))); setOpen(null); toast(`${p.t} published`, () => setRows(before)); }} className={btn("primary")}>{p.done ? "Save" : "Publish"}</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
