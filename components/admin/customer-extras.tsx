"use client";

import { useId, useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { saveCustomerNote, setCustomerMarketing, setCustomerTags } from "@/app/admin/customers/actions";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { useToast } from "@/components/ui/toast";
import { FieldLabel } from "@/components/merchant/form-shell";

/**
 * A customer's team note, tags and their yes to offers (new admin, 15
 * October). Each saves on its own as it changes; nothing waits for a button.
 */
export function CustomerNote({ id, initial }: { id: string; initial: string }) {
  const [note, setNote] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const toast = useToast();
  const noteId = useId();
  async function persist() {
    if (note === saved) return;
    const r = await saveCustomerNote(id, note).catch(() => null);
    if (r?.ok) setSaved(note);
    else toast.error("Couldn't save that note.");
  }
  return (
    <div>
      <FieldLabel htmlFor={noteId}>Team note</FieldLabel>
      <textarea
        id={noteId}
        rows={3}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onBlur={persist}
        placeholder="Prefers delivery after 5 pm. Always orders size M."
        className="mt-1 w-full rounded-xl bg-[#f5f5f5] px-3.5 py-2.5 text-[14px] outline-none ring-1 ring-[#0a0a0a]/10 focus:ring-2 focus:ring-[#0a0a0a]"
      />
      <p className="mt-1 text-[12px] text-[#0a0a0a]/45">Only your team sees this. Saves when you click away.</p>
    </div>
  );
}

export function CustomerTags({ id, initial }: { id: string; initial: string[] }) {
  const [tags, setTags] = useState(initial);
  const [draft, setDraft] = useState("");
  const [, start] = useTransition();
  const toast = useToast();
  function save(next: string[]) {
    const before = tags;
    setTags(next);
    start(async () => {
      const r = await setCustomerTags(id, next).catch(() => null);
      if (!r?.ok) {
        setTags(before);
        toast.error("Couldn't save the tags.");
      }
    });
  }
  function add() {
    const t = draft.trim();
    if (!t || tags.includes(t)) return setDraft("");
    save([...tags, t]);
    setDraft("");
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 rounded-md bg-[#f0f0f0] py-1 pl-2 pr-1 text-[12.5px] font-medium">
          {t}
          <button type="button" aria-label={`Remove ${t}`} onClick={() => save(tags.filter((x) => x !== t))} className="grid h-4 w-4 place-items-center rounded text-[#0a0a0a]/45 hover:bg-[#0a0a0a]/10 hover:text-[#0a0a0a]">
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <span className="inline-flex items-center rounded-md ring-1 ring-dashed ring-[#0a0a0a]/20">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Add tag"
          aria-label="Add a tag"
          maxLength={30}
          className="w-20 bg-transparent px-2 py-1 text-[12.5px] outline-none"
        />
        {draft.trim() && (
          <button type="button" aria-label="Add" onClick={add} className="px-1 text-[#0a0a0a]/50 hover:text-[#0a0a0a]"><Plus className="h-3.5 w-3.5" /></button>
        )}
      </span>
    </div>
  );
}

export function CustomerOffers({ id, initial }: { id: string; initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [, start] = useTransition();
  const toast = useToast();
  return (
    <div className="flex items-center justify-between gap-3 text-[13.5px]">
      <span>
        Agreed to news and offers by email
        <span className="block text-[12px] text-[#0a0a0a]/45">Only switch on with their yes.</span>
      </span>
      <ToggleSwitch
        checked={on}
        label="Agreed to offers by email"
        hideLabel
        onChange={(next) => {
          setOn(next);
          start(async () => {
            const r = await setCustomerMarketing(id, next).catch(() => null);
            if (!r?.ok) {
              setOn(!next);
              toast.error("Couldn't change that.");
            }
          });
        }}
      />
    </div>
  );
}
