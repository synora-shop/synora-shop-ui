"use client";

import { Copy } from "lucide-react";
import { useToast } from "@/components/new-admin/shell";

/** The line a theme uses to print a custom field, copied in one click. */
export function CopyPath({ path }: { path: string }) {
  const toast = useToast();
  return (
    <button type="button" onClick={() => { navigator.clipboard?.writeText(path).catch(() => {}); toast("Copied"); }} className="inline-flex max-w-full items-center gap-2 rounded-lg bg-[#f5f5f5] px-2.5 py-1 font-mono text-[12px] text-[#0a0a0a]/70 hover:bg-[#ececec]">
      <span className="truncate">{path}</span>
      <Copy className="h-3.5 w-3.5 shrink-0" />
    </button>
  );
}
