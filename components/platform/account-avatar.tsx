import { Crown } from "lucide-react";

/**
 * A person's avatar (14 October). Synora master admins wear gold: a gold coin
 * with a bevelled ring, a sheen that sweeps across now and then (".av-shine",
 * app/globals.css, still for reduced motion) and a small navy crown. Everyone
 * else wears Synora's iris. Initials only, no photos.
 */
const SIZE = {
  sm: { box: "h-9 w-9", text: ["text-[13px]", "text-[11px]", "text-[9.5px]"], crown: "h-4 w-4 -right-1 -top-1", icon: "h-2.5 w-2.5" },
  md: { box: "h-12 w-12", text: ["text-[17px]", "text-[14px]", "text-[12px]"], crown: "h-5 w-5 -right-1 -top-1", icon: "h-3 w-3" },
  lg: { box: "h-16 w-16", text: ["text-[22px]", "text-[18px]", "text-[15px]"], crown: "h-6 w-6 -right-1 -top-1", icon: "h-3.5 w-3.5" },
} as const;

export function AccountAvatar({ initials, master = false, size = "sm" }: { initials: string; master?: boolean; size?: keyof typeof SIZE }) {
  const s = SIZE[size];
  const text = s.text[Math.min(Math.max(initials.length, 1), 3) - 1];
  if (!master) {
    return (
      <span aria-hidden className={`grid ${s.box} shrink-0 place-items-center rounded-full bg-[linear-gradient(140deg,#9b9bff_0%,#6666ff_55%,#4b4bea_100%)] font-bold tracking-tight text-white shadow-[0_6px_16px_-6px_rgba(102,102,255,0.8)] ring-2 ring-white ${text}`}>
        {initials}
      </span>
    );
  }
  return (
    <span aria-hidden className={`relative inline-block ${s.box} shrink-0`}>
      <span className="block h-full w-full rounded-full bg-[conic-gradient(from_210deg,#fff4c8,#d9a521,#7d5310,#f4d377,#b9851b,#fff4c8)] p-[2px] shadow-[0_8px_22px_-8px_rgba(160,110,20,0.85)]">
        <span
          className={`av-shine relative grid h-full w-full place-items-center overflow-hidden rounded-full bg-[linear-gradient(145deg,#fdeaa8_0%,#e6b84a_40%,#b8811f_72%,#f2cf72_100%)] font-extrabold tracking-[-0.02em] text-[#3d2905] [text-shadow:0_1px_0_rgba(255,244,200,0.7)] ${text}`}
        >
          {initials}
        </span>
      </span>
      <span className={`absolute grid ${s.crown} place-items-center rounded-full bg-[#0d0d50] text-[#f2cf72] ring-2 ring-white`}>
        <Crown className={s.icon} strokeWidth={2.5} />
      </span>
    </span>
  );
}
