"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { moveOrderToBin } from "@/app/admin/orders/actions";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/primitives";
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
      {/* The shared button, not a red link that happened to look like one. The
          label is sentence case like every other action in the panel, and it
          says where the order goes rather than implying it is gone. */}
      <Button variant="danger" size="sm" onClick={handleClick} disabled={pending}>
        <Trash2 className="h-4 w-4" />
        {pending ? "Moving…" : "Move to Bin"}
      </Button>
    </>
  );
}
