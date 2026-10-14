/**
 * A person's avatar (14 October): initials in a circle, no photos.
 *
 * Merchants wear Synora's iris with white initials. A Synora master admin
 * wears navy with gold initials, the one quiet mark that says who they are;
 * the same gold appears as the small dot beside "Master dashboard"
 * (components/platform/master-link.tsx). Nothing about it moves or shines.
 */
const SIZE = {
  sm: { box: "h-9 w-9", text: ["text-[13px]", "text-[12px]", "text-[10.5px]"] },
  md: { box: "h-12 w-12", text: ["text-[17px]", "text-[15px]", "text-[13px]"] },
  lg: { box: "h-16 w-16", text: ["text-[22px]", "text-[19px]", "text-[16px]"] },
} as const;

export const MASTER_GOLD = "#e3b94f";

export function AccountAvatar({ initials, master = false, size = "sm" }: { initials: string; master?: boolean; size?: keyof typeof SIZE }) {
  const s = SIZE[size];
  const text = s.text[Math.min(Math.max(initials.length, 1), 3) - 1];
  return (
    <span
      aria-hidden
      className={`grid ${s.box} shrink-0 place-items-center rounded-full font-semibold tracking-tight ring-2 ring-white ${text} ${
        master ? "bg-[#0d0d50] text-[#e3b94f]" : "bg-[#6666ff] text-white"
      }`}
    >
      {initials}
    </span>
  );
}
