"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * A thin top-of-page progress bar, NProgress-style, mounted once in the root
 * layout so every internal link click across the whole site (storefront +
 * admin) gets an instant visual acknowledgment instead of feeling dead while
 * the next page loads — without wrapping every <Link> individually.
 *
 * Mechanism: a capture-phase click listener on `document` recognizes clicks
 * on internal <a href> elements and starts the bar; the pathname/search-params
 * change that follows a completed navigation finishes it. A safety timeout
 * clears it if a click doesn't end up navigating (e.g. the target had its own
 * onClick that cancelled/redirected the action).
 */
export function NavProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const trickleRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const safetyRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadingRef = useRef(false);

  function clearTimers() {
    if (trickleRef.current) clearInterval(trickleRef.current);
    if (safetyRef.current) clearTimeout(safetyRef.current);
    trickleRef.current = null;
    safetyRef.current = null;
  }

  function finish() {
    if (!loadingRef.current) return;
    loadingRef.current = false;
    clearTimers();
    setProgress(100);
    setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 200);
  }

  // A completed navigation is the one reliable "done" signal.
  // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: finishes the bar started by the click handler below
  useEffect(() => {
    finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- finish() is stable enough for this purpose; only path/search identity matters
  }, [pathname, searchParams]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as HTMLElement)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      const href = anchor.getAttribute("href") ?? "";
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      loadingRef.current = true;
      clearTimers();
      setVisible(true);
      setProgress(20);
      trickleRef.current = setInterval(() => {
        setProgress((p) => (p < 85 ? p + (85 - p) * 0.15 : p));
      }, 200);
      // If the navigation never completes (interrupted, cancelled elsewhere), don't
      // leave the bar stuck forever.
      safetyRef.current = setTimeout(() => finish(), 6000);
    }
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- finish/clearTimers close over refs only
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-0.5"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 0.2s ease" }}
    >
      <div
        className="h-full bg-brand-500"
        style={{ width: `${progress}%`, transition: "width 0.3s ease-out" }}
      />
    </div>
  );
}
