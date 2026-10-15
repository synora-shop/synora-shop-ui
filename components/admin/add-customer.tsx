"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { createCustomer } from "@/app/admin/customers/actions";
import { FieldLabel } from "@/components/merchant/form-shell";

/**
 * "Add customer" (new admin, 15 October): for someone who ordered on
 * WhatsApp or over the phone and should be on the list. Name and email, and
 * a phone if you have it; then their page opens.
 */
const field = "mt-1 h-10 w-full rounded-[10px] bg-[#f5f5f5] px-3 text-[14px] outline-none ring-1 ring-[#0a0a0a]/10 focus:ring-2 focus:ring-[#0a0a0a]";

export function AddCustomer() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    start(async () => {
      const result = await createCustomer({ name: String(f.get("name") ?? ""), email: String(f.get("email") ?? ""), phone: String(f.get("phone") ?? "") });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.push(`/admin/customers/${result.id}`);
    });
  }

  return (
    <>
      <button type="button" onClick={() => { setError(null); setOpen(true); }} className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-[#0a0a0a] px-3.5 text-[13.5px] font-semibold text-white hover:bg-[#262626]">
        <Plus className="h-4 w-4" /> Add customer
      </button>
      {open && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/30 px-3 backdrop-blur-[2px]" onMouseDown={() => setOpen(false)}>
          <form role="dialog" aria-label="Add customer" onSubmit={submit} onMouseDown={(e) => e.stopPropagation()} className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-[0_40px_100px_-30px_rgba(0,0,0,0.6)]">
            <p className="flex items-center justify-between border-b border-[#0a0a0a]/[0.07] px-5 py-4 text-[15px] font-semibold">
              Add customer
              <button type="button" aria-label="Close" onClick={() => setOpen(false)}><X className="h-5 w-5 text-[#0a0a0a]/45" /></button>
            </p>
            <div className="flex flex-col gap-3 p-5">
              <div><FieldLabel htmlFor="ac-name">Name</FieldLabel><input id="ac-name" name="name" required autoFocus className={field} /></div>
              <div><FieldLabel htmlFor="ac-email">Email</FieldLabel><input id="ac-email" name="email" type="email" required className={field} /></div>
              <div><FieldLabel htmlFor="ac-phone">Phone (optional)</FieldLabel><input id="ac-phone" name="phone" type="tel" placeholder="0300 1234567" className={field} /></div>
              {error && <p role="alert" className="text-[13px] text-rose">{error}</p>}
            </div>
            <div className="flex justify-end gap-2 border-t border-[#0a0a0a]/[0.07] px-5 py-3">
              <button type="button" onClick={() => setOpen(false)} className="rounded-[10px] px-4 py-2 text-[13.5px] font-semibold ring-1 ring-[#0a0a0a]/12">Cancel</button>
              <button type="submit" disabled={pending} className="rounded-[10px] bg-[#0a0a0a] px-4 py-2 text-[13.5px] font-semibold text-white disabled:opacity-50">{pending ? "Adding…" : "Add customer"}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
