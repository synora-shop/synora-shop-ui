"use client";

import { useState, useTransition } from "react";
import { setVariantStock } from "@/app/admin/products/actions";
import { useToast } from "@/components/ui/toast";

/**
 * A size's stock, edited where it is shown: type, then Enter or click away.
 * Escape puts the number back. Coloured as the design does: sold out, low,
 * or plenty.
 */
export function StockCell({ id, stock, low, label }: { id: string; stock: number; low: number; label: string }) {
  const [value, setValue] = useState(String(stock));
  const [saved, setSaved] = useState(stock);
  const [pending, start] = useTransition();
  const toast = useToast();
  const n = Number(value);
  const tone = saved === 0 ? "bg-[#ffe9e2] text-[#a3330c]" : saved < low ? "bg-[#fff1d6] text-[#7a4b00]" : "bg-[#f0f0f0] text-[#0a0a0a]";

  function commit() {
    if (value.trim() === "" || n === saved) {
      setValue(String(saved));
      return;
    }
    if (!Number.isInteger(n) || n < 0) {
      toast.error("Stock has to be a whole number, 0 or more.");
      setValue(String(saved));
      return;
    }
    start(async () => {
      const result = await setVariantStock(id, n);
      if (!result.ok) {
        toast.error(result.error);
        setValue(String(saved));
        return;
      }
      setSaved(n);
      toast.success(`${label}: ${n} left.`);
    });
  }

  return (
    <input
      inputMode="numeric"
      aria-label={`Stock for ${label}`}
      value={value}
      disabled={pending}
      onChange={(e) => setValue(e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          setValue(String(saved));
          requestAnimationFrame(() => (e.target as HTMLInputElement).blur());
        }
      }}
      className={`w-[4.5rem] rounded-lg px-2.5 py-1 text-center text-[14px] font-semibold tabular-nums outline-none focus:bg-white focus:ring-2 focus:ring-[#0a0a0a] disabled:opacity-60 ${tone}`}
    />
  );
}
