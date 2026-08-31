"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteAddress } from "@/app/(storefront)/account/addresses/actions";
import { SwipeRow } from "@/components/ui/swipe-row";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

type AddressRow = {
  id: string;
  label: string;
  line1: string;
  line2: string | null;
  city: string;
  province: string;
  postalCode: string | null;
  phone: string;
};

export function AddressList({
  addresses,
  removeLabel,
}: {
  addresses: AddressRow[];
  removeLabel: string;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(addresses);
  const { confirm, dialog } = useConfirm();
  const toast = useToast();

  async function handleRemove(id: string, label: string) {
    const ok = await confirm({
      title: `Remove "${label}"?`,
      description: "This address will be permanently removed from your account.",
      confirmLabel: "Remove",
      danger: true,
    });
    if (!ok) return;

    const previous = rows;
    setRows((r) => r.filter((a) => a.id !== id));
    const formData = new FormData();
    formData.set("id", id);
    try {
      await deleteAddress(formData);
      router.refresh();
    } catch {
      // Rolling the row back without a word reads as the action having
      // worked and then quietly undone itself.
      setRows(previous);
      toast.error("Couldn't remove that address. Try again.", { blocking: true });
    }
  }

  return (
    <div className="space-y-4">
      {dialog}
      {rows.map((a) => (
        <SwipeRow
          key={a.id}
          className="rounded-lg border border-border bg-white"
          actions={[
            { key: "remove", label: removeLabel, icon: Trash2, tone: "danger", onClick: () => handleRemove(a.id, a.label) },
          ]}
        >
          <div className="p-4 text-sm">
            <p className="font-medium text-ink">{a.label}</p>
            <p className="text-ink-soft">
              {a.line1}
              {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.province} {a.postalCode}
            </p>
            <p className="text-ink-soft">{a.phone}</p>
          </div>
        </SwipeRow>
      ))}
    </div>
  );
}
