import Link from "next/link";

/**
 * The three sections that are structure rather than content.
 *
 * Together in one file because each is a handful of lines and none of them
 * will ever grow: a divider is a line, a spacer is a gap, a button row is
 * buttons. Three files of twelve lines would be filing for its own sake.
 */

/** A line across the page. */
export function Divider({
  style = "solid",
  thickness = 1,
  widthPercent = 100,
}: {
  style?: string;
  thickness?: number;
  widthPercent?: number;
}) {
  return (
    <hr
      className="mx-auto border-0 border-t border-border"
      style={{
        borderTopStyle: (style as "solid" | "dashed" | "dotted") ?? "solid",
        borderTopWidth: Math.max(1, thickness ?? 1),
        width: `${Math.min(100, Math.max(10, widthPercent ?? 100))}%`,
      }}
    />
  );
}

/**
 * Empty room.
 *
 * `showOnMobile` exists because vertical space is scarcer on a phone than
 * anywhere else, and a gap that reads as generous on a desktop reads as a
 * broken page when it is a third of the screen.
 */
export function Spacer({ height = 48, showOnMobile = true }: { height?: number; showOnMobile?: boolean }) {
  return (
    <div
      aria-hidden
      className={showOnMobile ? "" : "hidden sm:block"}
      style={{ height: Math.max(0, height ?? 48) }}
    />
  );
}

type ButtonItem = { label?: string; href?: string; style?: string };

/** A row of buttons on their own. */
export function ButtonRow({
  heading,
  buttons,
  align = "center",
}: {
  heading?: string;
  buttons?: ButtonItem[];
  align?: string;
}) {
  const shown = (buttons ?? []).filter((b) => b.label?.trim() && b.href?.trim());
  if (shown.length === 0) return null;
  const centred = align !== "left";

  return (
    <div className={centred ? "text-center" : ""}>
      {heading && <p className="mb-4 font-serif text-2xl font-semibold text-ink">{heading}</p>}
      <div className={`flex flex-wrap gap-3 ${centred ? "justify-center" : ""}`}>
        {shown.map((button, i) => (
          <Link
            key={i}
            href={button.href!}
            className={
              button.style === "outline"
                ? "rounded-full border border-brand-500 px-6 py-2.5 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-50"
                : "rounded-full bg-brand-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600"
            }
          >
            {button.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
