"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Sends someone onward from a finished screen, after a visible countdown.
 *
 * Used at the end of the flows that have nowhere else to go — password reset
 * and email confirmation both end on "that worked", and the next thing anyone
 * wants is the sign-in page. Leaving them to find the button is a dead end.
 *
 * The countdown is returned rather than hidden so the screen can say what is
 * about to happen: a page that navigates on its own with no warning reads as a
 * glitch, and someone still reading the confirmation deserves to know why it is
 * about to disappear. Callers keep an explicit button too, so nobody has to
 * wait out the timer.
 *
 * Inactive until `active` is true, so it can be declared unconditionally at the
 * top of a component whose success state arrives later.
 */
export function useCountdownRedirect(to: string, seconds: number, active: boolean) {
  const router = useRouter();
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (!active) return;

    // Two timers rather than one derived from the other: the countdown is
    // cosmetic, and a browser that throttles intervals in a background tab
    // would otherwise delay the navigation itself.
    const tick = setInterval(() => setRemaining((n) => (n > 0 ? n - 1 : 0)), 1000);
    const go = setTimeout(() => router.push(to), seconds * 1000);

    return () => {
      clearInterval(tick);
      clearTimeout(go);
    };
  }, [active, router, to, seconds]);

  return remaining;
}
