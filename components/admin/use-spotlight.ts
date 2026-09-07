"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  SPOTLIGHT_MS,
  SPOTLIGHT_PARAM,
  type SpotlightTarget,
  isSpotlightTarget,
} from "@/lib/spotlight";

/**
 * Plays the "look here" animation on this element, if this screen was opened
 * by a link asking for it.
 *
 * Returns a ref to put on the control. Does nothing at all when the parameter
 * is absent or names a different target, which is every ordinary visit.
 *
 *   const pauseRef = useSpotlight("pause");
 *   <Button ref={pauseRef}>Pause store</Button>
 *
 * Four things it has to get right, and all four were found by trying it:
 *
 *   The control may be below the fold. A hint playing off screen is worse than
 *   no hint — the merchant is told they were shown something they never saw.
 *   So it scrolls into view first, and centres rather than merely reaching the
 *   edge, because a control level with the bottom of the window has not really
 *   been pointed at.
 *
 *   The parameter has to go. Left in the URL, a reload or a back-and-forward
 *   replays a hint about a job the merchant has already done, and any link
 *   they copy carries it to someone else. Replaced rather than pushed, so the
 *   back button still goes where they came from.
 *
 *   It must not fire twice. React runs effects twice in development, and a
 *   second run would restart the animation half way through the first.
 *
 *   The element may not be mounted yet on the first pass. The screen renders,
 *   the ref fills in, and the effect runs — but a control behind a condition
 *   that is still resolving is null when the effect first fires, so it retries
 *   on the next frame rather than giving up silently.
 */
export function useSpotlight<T extends HTMLElement>(target: SpotlightTarget) {
  const ref = useRef<T>(null);
  const params = useSearchParams();

  /**
   * What the URL asked for when this screen mounted.
   *
   * Read once, into a ref, and the effect below depends on nothing. That is
   * load-bearing rather than tidy. The effect clears the parameter as its last
   * act, and on a re-run it would then find nothing to do and its cleanup
   * would strip the class off a control that is still mid-animation. Two
   * versions of this hook were wrong in opposite directions for exactly that
   * reason: one left the class on forever, the next removed it a frame after
   * adding it.
   *
   * Reading it once is also the honest description of what a hint is. It is
   * about how the merchant arrived, and nothing that happens afterwards
   * changes how they arrived.
   */
  const askedOnArrival = useRef(params.get(SPOTLIGHT_PARAM));

  useEffect(() => {
    const asked = askedOnArrival.current;
    if (!isSpotlightTarget(asked) || asked !== target) return;

    let frame = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let tries = 0;
    // Captured rather than read from the ref at cleanup time, so the class
    // always comes off the element it went on to.
    let lit: HTMLElement | null = null;

    const play = () => {
      const el = ref.current;
      if (!el) {
        // About a second of frames. Long enough for a control that is still
        // resolving, short enough that a target which will never appear does
        // not leave a loop running for the life of the screen.
        if (++tries > 60) return;
        frame = requestAnimationFrame(play);
        return;
      }

      // Centred, and instant under reduced motion — someone who asked for less
      // movement should not be handed a long smooth scroll as consolation.
      const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });

      lit = el;
      el.classList.add("attention");
      timer = setTimeout(() => el.classList.remove("attention"), SPOTLIGHT_MS);

      // The hint has been given; the URL should not still be asking for it, or
      // a reload replays it and a copied link carries it to someone else.
      // history rather than the router: this is the same screen with one
      // parameter gone, and a router navigation would re-render the tree and
      // interrupt the animation that has just started.
      const url = new URL(window.location.href);
      url.searchParams.delete(SPOTLIGHT_PARAM);
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    };

    frame = requestAnimationFrame(play);

    // Unmount only, because the dependency list is empty. The class comes off
    // here as well as on the timer: cancelling the timer alone would leave a
    // control outlined for the life of the screen, which a finished animation
    // hides and reduced motion — whose answer is a static ring — does not.
    return () => {
      cancelAnimationFrame(frame);
      if (timer) clearTimeout(timer);
      lit?.classList.remove("attention");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see askedOnArrival: this must run once, on arrival, and never again
  }, []);

  return ref;
}
