import { KitLinks } from "@/components/storefront/kit-links";
import { Acme, Inter, Khand, Meddon, Poppins, Shippori_Mincho } from "next/font/google";
import { KITE_TYPE_CSS } from "@/components/kite/type";

/**
 * Kite's frame: its typefaces and its unit.
 *
 * The file's faces, and two stand-ins decided on 8 October because Apple's
 * licences do not allow serving its fonts to a visitor's browser:
 *
 *   SF Pro Text           → Inter            (the body: 214 of 274 texts)
 *   Hiragino Mincho Pro   → Shippori Mincho  (the large serif titles)
 *   Khand, Meddon, Poppins, Acme             — the file's own, from Google
 *
 * Line heights are always written out in design pixels (see type.ts), never
 * left to a font's own metrics — the stand-ins' differ from Apple's, and the
 * file's boxes are what the layout is measured against.
 *
 * The unit, `--u`, is one design pixel at the current screen: the phone's
 * design is 440 wide, the desktop's 1728. Under 768 the phone's is shown,
 * scaled to the screen and centred past 528 (1.2px); from 768 the desktop's,
 * scaled down below 1728 and centred above it.
 */
const sans = Inter({ variable: "--kite-sans", subsets: ["latin"], weight: ["300", "400", "600"], display: "swap" });
const serif = Shippori_Mincho({ variable: "--kite-serif", subsets: ["latin"], weight: ["400"], display: "swap" });
const khand = Khand({ variable: "--kite-khand", subsets: ["latin"], weight: ["300"], display: "swap" });
const script = Meddon({ variable: "--kite-script", subsets: ["latin"], weight: ["400"], display: "swap" });
const poppins = Poppins({ variable: "--kite-poppins", subsets: ["latin"], weight: ["400"], display: "swap" });
const acme = Acme({ variable: "--kite-acme", subsets: ["latin"], weight: ["400"], display: "swap" });

export const KITE_FONTS = [sans, serif, khand, script, poppins, acme].map((f) => f.variable).join(" ");

export function KiteFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${KITE_FONTS} min-h-screen bg-[#040404] [container-type:inline-size] font-[family-name:var(--kite-sans)] font-light text-[#f4f3f1] antialiased`}>
      <style>{KITE_TYPE_CSS}</style>
      <main className="relative mx-auto w-[calc(440*var(--u))] [--u:min(calc(100cqw/440),1.2px)] md:w-[calc(1728*var(--u))] md:[--u:min(calc(100cqw/1728),1px)]">
        <KitLinks>{children}</KitLinks>
      </main>
    </div>
  );
}
