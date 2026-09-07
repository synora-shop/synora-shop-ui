"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Every error, refusal and confirmation surfaces here rather than dying in a
// console or an inline paragraph only some screens bothered to render.
//
// Timing: informational and success messages clear themselves after 3 seconds.
// Errors get longer and a dismiss button, because a message you're meant to act
// on shouldn't disappear while you're still reading it — and anything raised as
// `blocking` stays until it's dismissed or the problem is fixed.

export type ToastTone = "info" | "success" | "error";

type Toast = {
  id: number;
  tone: ToastTone;
  message: string;
  /** Stays on screen until dismissed — for errors the user has to act on. */
  blocking?: boolean;
  /**
   * On its way out.
   *
   * A toast that is simply deleted from the list vanishes, and the ones below
   * it jump up into the gap. So dismissing marks it instead, the exit
   * animation plays, and the row is removed when that is done — which is also
   * what collapses its height, so its neighbours slide rather than jump.
   */
  leaving?: boolean;
};

/**
 * How long the exit animation runs. Must match `.toast-out` in globals.css.
 *
 * If this is shorter the toast is deleted mid-animation and blinks out; if it
 * is longer the toast sits invisible, holding its neighbours down. Both are
 * only visible in motion, which is exactly why the number is written down once
 * with a note rather than twice by accident.
 */
const LEAVE_MS = 160;

type ShowOptions = { blocking?: boolean };

type ToastApi = {
  info: (message: string, options?: ShowOptions) => void;
  success: (message: string, options?: ShowOptions) => void;
  error: (message: string, options?: ShowOptions) => void;
  dismissAll: () => void;
};

const ToastContext = createContext<ToastApi | null>(null);

const DURATION: Record<ToastTone, number> = {
  info: 3000,
  success: 3000,
  error: 6000,
};

const TONE_STYLES: Record<ToastTone, string> = {
  info: "border-border bg-white text-ink",
  success: "border-green bg-green-bg text-ink",
  error: "border-rose bg-rose-bg text-ink",
};

const TONE_ICON = {
  info: Info,
  success: CheckCircle2,
  error: AlertTriangle,
} as const;

const TONE_ICON_COLOR: Record<ToastTone, string> = {
  info: "text-brand-500",
  success: "text-green",
  error: "text-rose",
};

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  /**
   * Which toasts are already on their way out.
   *
   * A ref rather than a read inside the state updater. Dismissing the same
   * toast twice is ordinary — the auto-dismiss timer and the close button
   * landing together — and a second removal would restart the animation on a
   * toast that is half gone. Deciding that inside `setToasts` looked simpler
   * and was wrong: React invokes updaters twice in development, so the second
   * invocation would see the first one's result, conclude the toast was
   * already leaving, and never schedule the removal at all. The toast would
   * then sit there faded forever.
   */
  const leaving = useRef(new Set<number>());

  const dismiss = useCallback((id: number) => {
    if (leaving.current.has(id)) return;
    leaving.current.add(id);

    // Two steps: mark it so the exit animation plays, then remove it once that
    // has finished. Removing straight away would make it vanish and the toasts
    // below it jump up into the gap.
    setToasts((list) => list.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => {
      setToasts((list) => list.filter((t) => t.id !== id));
      leaving.current.delete(id);
    }, LEAVE_MS);
  }, []);

  const show = useCallback(
    (tone: ToastTone, message: string, options?: ShowOptions) => {
      const id = ++nextId;
      const toast: Toast = { id, tone, message, blocking: options?.blocking };
      setToasts((list) => {
        // Repeating the same message shouldn't stack — refresh the existing
        // one. A copy already on its way out is dropped immediately rather
        // than left to finish leaving underneath its own replacement.
        const withoutDuplicate = list.filter((t) => t.message !== message);
        return [...withoutDuplicate, toast].slice(-4);
      });
      if (!toast.blocking) {
        setTimeout(() => dismiss(id), DURATION[tone]);
      }
    },
    [dismiss]
  );

  const api = useMemo<ToastApi>(
    () => ({
      info: (message, options) => show("info", message, options),
      success: (message, options) => show("success", message, options),
      error: (message, options) => show("error", message, options),
      // Immediate, with no exit: dismissAll is called when a screen is leaving
      // or a problem has been fixed, and animating four toasts out of a page
      // that is already gone is motion nobody sees.
      dismissAll: () => {
        leaving.current.clear();
        setToasts([]);
      },
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport>
        {toasts.map((toast) => {
          const Icon = TONE_ICON[toast.tone];
          return (
            <div
              key={toast.id}
              role={toast.tone === "error" ? "alert" : "status"}
              className={cn(
                "pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-lg border px-4 py-3 text-sm shadow-lg",
                toast.leaving ? "toast-out" : "toast-in",
                TONE_STYLES[toast.tone]
              )}
            >
              <Icon className={cn("mt-0.5 h-4 w-4 flex-shrink-0", TONE_ICON_COLOR[toast.tone])} />
              <p className="min-w-0 flex-1 leading-snug">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss"
                className="-mr-1 rounded p-0.5 text-ink-soft transition-colors hover:bg-black/5 active:bg-black/10"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </ToastViewport>
    </ToastContext.Provider>
  );
}

/**
 * Messages for the current screen.
 *
 * Falls back to a no-op-but-loud implementation if a provider somehow isn't
 * mounted, so a missing provider can never swallow an error silently.
 */
/**
 * Where toasts are painted.
 *
 * Portalled to <body> rather than rendered in place, because `position: fixed`
 * is resolved against the nearest ancestor with a transform, filter or
 * container-type — not the viewport. The app has several (the press-down scale
 * on :active, the customizer's panels), so an in-place toast could be pinned to
 * the bottom of some panel and scroll away off-screen. From <body> there is no
 * such ancestor and "fixed" means what it says.
 *
 * Bottom-centred on phones and bottom-right from `sm` up, inset by the safe
 * area so it clears a home indicator or a rounded corner.
 */
function ToastViewport({ children }: { children: React.ReactNode }) {
  // "Are we on the client yet?" without an effect: the server snapshot is
  // false and the client snapshot is true, so the portal appears after
  // hydration and never during SSR, where document.body doesn't exist.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  if (!mounted) return null;

  return createPortal(
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[2147483600] flex max-h-dvh flex-col items-center gap-2 overflow-hidden p-3 sm:items-end sm:p-4"
      style={{
        paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
        paddingRight: "max(0.75rem, env(safe-area-inset-right))",
        paddingLeft: "max(0.75rem, env(safe-area-inset-left))",
      }}
    >
      {children}
    </div>,
    document.body
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (context) return context;
  return {
    info: (m) => console.info("[toast]", m),
    success: (m) => console.info("[toast]", m),
    error: (m) => console.error("[toast]", m),
    dismissAll: () => {},
  };
}
