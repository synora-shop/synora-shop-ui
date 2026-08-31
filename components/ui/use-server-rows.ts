"use client";

import { useState, type Dispatch, type SetStateAction } from "react";

/**
 * A list that the server owns and the client may edit optimistically.
 *
 * Every admin list did `useState(rows)` and stopped there. That reads the prop
 * once, on the first render, and never again — so when a filter changed the URL
 * and the server sent back a different list, the component kept showing the
 * old one. The tab highlighted, the address bar updated, nothing else moved,
 * and the filters looked broken. They were not: the query was right and the
 * answer was thrown away.
 *
 * Holding the list in state is still wanted, because deleting a row should
 * remove it immediately rather than after a round trip. What was missing is
 * that a new list from the server has to win. This is React's documented
 * adjust-state-during-render pattern rather than an effect: it re-renders once,
 * before anything is painted, so there is no flash of the stale list.
 *
 * Identity is the signal — server components hand over a fresh array each
 * render, so a re-render means new data, and local edits made against the
 * previous one are superseded by definition.
 */
export function useServerRows<T>(rows: T[]): [T[], Dispatch<SetStateAction<T[]>>] {
  const [local, setLocal] = useState(rows);
  const [seen, setSeen] = useState(rows);

  if (seen !== rows) {
    setSeen(rows);
    setLocal(rows);
  }

  return [local, setLocal];
}
