"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A submit button that says what it is doing.
 *
 * SaveButton next door owns a state machine and is driven by a client
 * component. A server-rendered `<form action={…}>` has no such state: it
 * submits, the page revalidates, and the button looks exactly as it did — so
 * the merchant has no idea whether anything happened and presses it again.
 *
 * `useFormStatus` supplies the pending half. The confirmation half is the part
 * worth having: the moment a submission finishes, this flashes "Saved" for two
 * seconds. Not a toast, because the answer belongs where the question was
 * asked, next to the button the merchant just pressed.
 */
export function FormSaveButton({
  idleLabel = "Save",
  savingLabel = "Saving…",
  savedLabel = "Saved",
  className,
}: {
  idleLabel?: string;
  savingLabel?: string;
  savedLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  const [saved, setSaved] = useState(false);
  const was = useRef(false);

  useEffect(() => {
    // The transition out of pending is the only signal a server action gives
    // back here, and it is enough: the form only stops submitting once the
    // action has returned.
    if (was.current && !pending) {
      setSaved(true);
      const timer = setTimeout(() => setSaved(false), 2000);
      return () => clearTimeout(timer);
    }
    was.current = pending;
  }, [pending]);

  return (
    <button
      type="submit"
      disabled={pending}
      aria-live="polite"
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-6 py-2 text-sm font-medium text-white transition-all duration-200",
        saved ? "bg-emerald" : "bg-brand-500 hover:bg-brand-600",
        pending && "opacity-70",
        className
      )}
    >
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {saved && !pending && <Check className="h-3.5 w-3.5" />}
      {pending ? savingLabel : saved ? savedLabel : idleLabel}
    </button>
  );
}
