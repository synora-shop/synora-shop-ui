"use client";

import { useRouter } from "next/navigation";

/**
 * A theme kit's own links, followed the way `next/link` follows them.
 *
 * Kit sections draw plain `<a href>` — they are server components written
 * against the design, and most of their links come from settings. Followed by
 * the browser, every one of them threw the page away and loaded the next from
 * nothing: a blank flash, the fonts again, the same header drawn again. On the
 * live Loom demo that read as "clicking just reloads the page" (reported
 * 8 October), while the platform's own pages — which use StoreLink — moved
 * between pages in place.
 *
 * One listener around the kit's page turns a plain click on a link to one of
 * this site's pages into a client navigation instead. Nothing is prefetched
 * (no requests a visitor did not ask for). Everything else keeps the browser's
 * own behaviour: a new tab or window (modifier keys, middle click, `target`),
 * a download, another site, `mailto:`/`tel:`, a jump within the page, an API
 * address, a file, and any link marked `data-native`.
 *
 * A search box is the same: a GET form to one of this site's pages (Loom's
 * header search) goes there in place too.
 */
export function KitLinks({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <div
      className="contents"
      onClick={(e) => {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        const a = (e.target as Element).closest?.("a[href]") as HTMLAnchorElement | null;
        if (!a || a.hasAttribute("download") || a.hasAttribute("data-native")) return;
        if (a.target && a.target !== "_self") return;
        const url = new URL(a.href, location.href);
        if (url.origin !== location.origin) return;
        if (url.pathname === location.pathname && url.search === location.search && url.hash) return;
        if (/^\/(api|_next)\//.test(url.pathname) || /\.[a-z0-9]{2,5}$/i.test(url.pathname)) return;
        e.preventDefault();
        router.push(url.pathname + url.search + url.hash);
      }}
      onSubmit={(e) => {
        const form = e.target as HTMLFormElement;
        if (e.defaultPrevented || (form.method || "get").toLowerCase() !== "get" || form.hasAttribute("data-native")) return;
        if (form.target && form.target !== "_self") return;
        const url = new URL(form.action || location.href, location.href);
        if (url.origin !== location.origin || /^\/(api|_next)\//.test(url.pathname)) return;
        url.search = new URLSearchParams(new FormData(form) as unknown as Record<string, string>).toString();
        e.preventDefault();
        router.push(url.pathname + url.search);
      }}
    >
      {children}
    </div>
  );
}
