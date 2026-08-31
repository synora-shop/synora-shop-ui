"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { moveOrderToBin } from "@/app/admin/orders/actions";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { isNavigationError } from "@/lib/is-redirect";

export function DeleteOrderButton({ id }: { id: string }) {
  const { confirm, dialog } = useConfirm();
  const toast = useToast();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    const ok = await confirm({
      title: `Move order ${id} to the Bin?`,
      description:
        "It'll drop out of revenue/profit totals immediately. Restore it anytime from Admin → Bin.",
      confirmLabel: "Move to Bin",
      danger: true,
    });
    if (!ok) return;

    setPending(true);
    const formData = new FormData();
    formData.set("id", id);
    try {
      // Redirects to /admin/orders itself on success.
      await moveOrderToBin(formData);
    } catch (error) {
      if (isNavigationError(error)) throw error;
      // Previously this call had no catch at all: a failure became an
      // unhandled rejection and the button simply appeared to do nothing.
      setPending(false);
      toast.error("Couldn't move that order to the Bin. Try again.", { blocking: true });
    }
  }

  return (
    <>
      {dialog}
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="flex items-center gap-1.5 rounded px-2 py-1 text-sm text-rose transition-colors hover:bg-rose/10 active:bg-rose/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" />
        {pending ? "Moving…" : "Delete Order"}
      </button>
    </>
  );
}
