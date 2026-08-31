"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { adoptLegacyPrefix } from "@/lib/legacy-storage";

const PREFIX = "shp:draft:";

// Drafts written under the old prefix are moved across on load, so a rename
// does not quietly orphan work a merchant has not saved yet.
adoptLegacyPrefix("bettershp:draft:", PREFIX);
/** Drafts older than this are ignored — resurfacing week-old work is worse than losing it. */
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

type Stored<T> = { savedAt: number; data: T };

/**
 * Keeps unsaved work in local storage so a crashed tab, a closed laptop or an
 * accidental refresh doesn't cost the session.
 *
 * This is the backstop behind useUnsavedChanges: the guard covers the cases the
 * browser lets us intercept, and this covers the ones it doesn't — a crash, a
 * power cut, an OS-level tab kill.
 *
 * Nothing is restored automatically. A draft that silently overwrites what's on
 * screen is its own kind of data loss, so a recovered draft is offered and the
 * user decides.
 */
export function useDraftRecovery<T>({
  key,
  value,
  dirty,
  enabled = true,
}: {
  /** Stable per editor surface, e.g. `customizer:<pageId>`. */
  key: string;
  value: T;
  dirty: boolean;
  enabled?: boolean;
}) {
  const [recovered, setRecovered] = useState<{ data: T; savedAt: number } | null>(null);
  const storageKey = `${PREFIX}${key}`;
  // Read once on mount, before our own writes below can overwrite it.
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current || !enabled) return;
    checkedRef.current = true;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const stored = JSON.parse(raw) as Stored<T>;
      if (!stored?.savedAt || Date.now() - stored.savedAt > MAX_AGE_MS) {
        window.localStorage.removeItem(storageKey);
        return;
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reading browser-only state once after mount; a useState initializer can't do this without a hydration mismatch (the server has no localStorage), same pattern as the matchMedia read in swipe-row.tsx
      setRecovered({ data: stored.data, savedAt: stored.savedAt });
    } catch {
      // Corrupt or unavailable storage (private mode, quota) is not worth
      // failing the editor over — recovery is a bonus, never a dependency.
    }
  }, [storageKey, enabled]);

  // Persist the working draft, throttled so typing doesn't hammer storage.
  useEffect(() => {
    if (!enabled) return;
    if (!dirty) {
      // Saved and clean: there is nothing worth recovering any more.
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        /* ignore */
      }
      return;
    }
    const id = setTimeout(() => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify({ savedAt: Date.now(), data: value }));
      } catch {
        /* storage full or unavailable — carry on without recovery */
      }
    }, 600);
    return () => clearTimeout(id);
  }, [storageKey, value, dirty, enabled]);

  const dismiss = useCallback(() => {
    setRecovered(null);
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  return { recovered, dismiss };
}

/** "3 minutes ago", for telling someone how old a recovered draft is. */
export function timeAgo(timestamp: number): string {
  const seconds = Math.max(1, Math.round((Date.now() - timestamp) / 1000));
  if (seconds < 60) return "less than a minute ago";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return minutes === 1 ? "a minute ago" : `${minutes} minutes ago`;
  const hours = Math.round(minutes / 60);
  return hours === 1 ? "an hour ago" : `${hours} hours ago`;
}
