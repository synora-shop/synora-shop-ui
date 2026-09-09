const SIZE: Record<string, string> = {
  small: "text-sm",
  medium: "text-xl sm:text-2xl",
  large: "text-3xl sm:text-5xl",
};

/**
 * A band of text sliding across the page.
 *
 * The text is repeated enough to overflow the widest screen, the strip is
 * rendered twice, and the animation moves it by exactly half its own width —
 * which is what makes the loop seamless instead of snapping back at the end.
 *
 * It holds still under reduced motion, and that is not a nicety. Text that
 * never stops moving is unreadable to some people and unbearable to others, so
 * `.marquee-track` is in globals.css beside every other animation rather than
 * inline here, where the rule that every animation has a still answer could not
 * see it.
 */
export function Marquee({
  text,
  separator = "•",
  speed = 24,
  size = "medium",
}: {
  text?: string;
  separator?: string;
  speed?: number;
  size?: string;
}) {
  const words = (text ?? "").trim();
  if (!words) return null;

  const run = (
    <div className="flex shrink-0 items-center gap-6 pr-6">
      {Array.from({ length: 12 }, (_, i) => (
        <span key={i} className="flex shrink-0 items-center gap-6 whitespace-nowrap">
          <span>{words}</span>
          {separator && (
            <span aria-hidden className="opacity-40">
              {separator}
            </span>
          )}
        </span>
      ))}
    </div>
  );

  return (
    <div className={`relative overflow-hidden font-medium ${SIZE[size] ?? SIZE.medium}`}>
      {/* Announced once. The visible strip is twelve copies twice over, and a
          screen reader reading that would be reading it twenty-four times. */}
      <span className="sr-only">{words}</span>
      <div
        aria-hidden
        className="marquee-track flex w-max items-center"
        style={{ animationDuration: `${Math.max(4, speed ?? 24)}s` }}
      >
        {run}
        {run}
      </div>
    </div>
  );
}
