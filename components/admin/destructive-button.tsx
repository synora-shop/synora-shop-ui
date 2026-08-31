"use client";

import { useTransition } from "react";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";

/**
 * A button that destroys something, and says so before it does.
 *
 * The confirm dialog is a client hook and most admin screens are server
 * components, so a server-rendered page cannot ask before deleting without a
 * bridge. This is it: hand it a server action, get a guarded button.
 *
 * Without it the pattern quietly degrades. Both the blog editor and the
 * locations screen shipped with a plain form that deleted on the first click,
 * with nothing between a merchant and the loss of a post they had written,
 * while every older screen in the admin asked properly.
 *
 * It also reports progress. A delete that hits the network and leaves the
 * button looking untouched invites a second click, which is how one delete
 * becomes two requests.
 */
export function DestructiveButton({
  action,
  title,
  description,
  confirmLabel = "Delete",
  children,
  className,
}: {
  /** A server action already bound to whatever it deletes. */
  action: () => Promise<unknown>;
  title: string;
  description?: string;
  confirmLabel?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { confirm, dialog } = useConfirm();
  const [pending, start] = useTransition();

  return (
    <>
      {dialog}
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          if (!(await confirm({ title, description, confirmLabel, danger: true }))) return;
          start(() => {
            void action();
          });
        }}
        className={cn(
          "text-sm text-rose transition-colors hover:underline disabled:opacity-50",
          className
        )}
      >
        {pending ? "Deleting…" : children}
      </button>
    </>
  );
}
