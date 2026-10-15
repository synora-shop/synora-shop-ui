"use client";

import { useEffect } from "react";
import { Printer } from "lucide-react";

/** Opens the print dialog once the slips are on screen, and again on demand. */
export function PrintNow() {
  useEffect(() => {
    const id = setTimeout(() => window.print(), 400);
    return () => clearTimeout(id);
  }, []);
  return (
    <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-[10px] bg-white px-3.5 py-1.5 text-[13px] font-semibold text-[#0a0a0a]">
      <Printer className="h-4 w-4" /> Print
    </button>
  );
}
