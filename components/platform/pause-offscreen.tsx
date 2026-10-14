"use client";

import { useEffect } from "react";

/**
 * Pauses a section's endless animations while it is off screen.
 *
 * Every `[data-anim-scope]` on the page is watched; one that has scrolled out
 * of view gets `data-offscreen`, which app/globals.css turns into
 * animation-play-state: paused for everything inside it. The floating pieces,
 * the drifting colour, the marquee and the ticking cursor then cost nothing
 * while nobody can see them, and pick up where they left off. Renders nothing.
 */
export function PauseOffscreen() {
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) e.target.toggleAttribute("data-offscreen", !e.isIntersecting);
      },
      { rootMargin: "120px 0px" }
    );
    document.querySelectorAll("[data-anim-scope]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}
