"use client";

import type { ReactNode } from "react";
import { btn } from "@/components/next-admin/ui";
import { useToast } from "@/components/next-admin/bits";

/** A button on a server page that says what it did (the preview saves nothing). */
export function Act({ children, msg, kind = "secondary", small = false, title }: { children: ReactNode; msg: string; kind?: Parameters<typeof btn>[0]; small?: boolean; title?: string }) {
  const toast = useToast();
  return <button type="button" title={title} onClick={() => toast(msg)} className={btn(kind, small)}>{children}</button>;
}

/** Copy a line (a field's print path, a file's link) in one click. */
export function Copy({ text, label }: { text: string; label?: string }) {
  const toast = useToast();
  return (
    <button type="button" onClick={() => { navigator.clipboard?.writeText(text).catch(() => {}); toast("Copied"); }} className="inline-flex max-w-full items-center gap-1.5 rounded-[6px] bg-[#f3f3f3] px-1.5 py-0.5 font-mono text-[12px] text-[#3a3a3a] hover:bg-[#ebebeb]">
      <span className="truncate">{label ?? text}</span>
    </button>
  );
}
