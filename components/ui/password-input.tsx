"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A password `<input>` with a show/hide eye toggle button. Drop-in replacement for
 * `<input type="password" className="input" ... />` — forwards every other prop
 * (name, autoComplete, required, minLength, placeholder, value/onChange, etc.).
 */
export function PasswordInput({
  className,
  autoComplete,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? "text" : "password"}
        // Toggling `type` alone is not enough in Safari: once its password
        // AutoFill has adopted a field it keeps painting masked dots over it
        // regardless of `type`, so "Show" changes the icon but not the text.
        // Belt and braces: while hidden we also mask via CSS (redundant but
        // harmless), and while visible we drop the password autocomplete hint
        // so nothing re-masks the now-plain text.
        autoComplete={visible ? "off" : autoComplete}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        className={cn(
          "input pr-10",
          !visible && "[-webkit-text-security:disc]",
          className,
        )}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-ink-soft transition-colors hover:text-ink"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
