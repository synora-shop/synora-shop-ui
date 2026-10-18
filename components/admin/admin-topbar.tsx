"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Keyboard } from "lucide-react";
import { AdminSearch } from "@/components/admin/admin-search";
import { useAdminNav } from "@/lib/admin-nav-store";

/**
 * The admin's keyboard (18 October). There is no top bar any more; what it
 * held moved to the rail (alerts, Create, you) and to each screen's own
 * heading (where you are). What is left draws nothing until asked:
 *   ⌘K or /   the command bar
 *   G then …  go to a section (G O orders, G P products, G S settings…)
 *   C         the Create menu in the rail
 *   ?         the list of these
 */
const GOTO: Record<string, string> = {
  h: "/admin", o: "/admin/orders", p: "/admin/products", c: "/admin/customers", d: "/admin/discounts",
  f: "/admin/data", a: "/admin/analytics", t: "/admin/theme", s: "/admin/store",
};

export function AdminKeys() {
  const pathname = usePathname();
  const router = useRouter();
  const [keysAt, setKeysAt] = useState<string | null>(null);
  const keys = keysAt === pathname;
  const searching = useAdminNav((s) => s.searching);
  const setSearching = useAdminNav((s) => s.setSearching);

  const pendingG = useRef(0);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.tagName === "SELECT" || target?.isContentEditable;
      const palette = (event.key === "k" || event.key === "K") && (event.metaKey || event.ctrlKey);
      if (palette || (event.key === "/" && !typing)) {
        event.preventDefault();
        setSearching(true);
        return;
      }
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "Escape") {
        setKeysAt(null);
        return;
      }
      if (event.key === "?") {
        setKeysAt((k) => (k ? null : window.location.pathname));
        return;
      }
      if (Date.now() - pendingG.current < 900 && GOTO[event.key]) {
        pendingG.current = 0;
        router.push(GOTO[event.key]);
        return;
      }
      if (event.key === "g") pendingG.current = Date.now();
      else if (event.key === "c") window.dispatchEvent(new Event("admin-create"));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, setSearching]);

  return (
    <>
      {searching && <AdminSearch onClose={() => setSearching(false)} />}
      {keys && <Shortcuts onClose={() => setKeysAt(null)} />}
    </>
  );
}

function Shortcuts({ onClose }: { onClose: () => void }) {
  const rows: [string, string][] = [
    ["⌘ K   or   /", "Search and commands"],
    ["C", "Create something"],
    ["G  H", "Home"],
    ["G  O", "Orders"],
    ["G  P", "Products"],
    ["G  C", "Customers"],
    ["G  D", "Discounts"],
    ["G  F", "Files and content"],
    ["G  A", "Analytics"],
    ["G  T", "Online store and themes"],
    ["G  S", "Settings"],
    ["?", "This list"],
  ];
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/30 px-3 backdrop-blur-[2px]" onMouseDown={onClose}>
      <div role="dialog" aria-label="Keyboard shortcuts" onMouseDown={(e) => e.stopPropagation()} className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-[0_40px_100px_-30px_rgba(0,0,0,0.6)] ring-1 ring-black/10">
        <p className="flex items-center gap-2.5 border-b border-[#0a0a0a]/[0.07] px-5 py-4 text-[15px] font-semibold"><Keyboard className="h-5 w-5" /> Keyboard shortcuts</p>
        <ul className="divide-y divide-[#0a0a0a]/[0.05] px-5 py-2">
          {rows.map(([k, l]) => (
            <li key={k} className="flex items-center justify-between py-2.5 text-[14px]">
              {l}
              <kbd className="rounded-md bg-[#f0f0f0] px-2 py-0.5 font-sans text-[12px] font-semibold">{k}</kbd>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

