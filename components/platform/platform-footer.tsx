import { appUrl } from "@/lib/shop-context";
import { SynoraAppMark } from "@/components/ui/synora-marks";

/**
 * The product site's footer — one layout, two colourings.
 *
 * Dark under the documentation page, which is dark; light under the front
 * page, which has been white since 14 October. The arrangement is the one
 * Abdul approved and is the same in both: the mark, the line, the company
 * that makes it, two columns of links, the small print centred.
 *
 * Every destination is real. There are two pages on this host, so the rest
 * point at the application and at the company site that owns the name.
 */
const TONES = {
  dark: {
    footer: "border-t border-white/10 bg-night",
    mark: "text-white",
    soft: "text-white/45",
    company: "text-white/40 hover:text-white/70 focus-visible:ring-white/60 focus-visible:ring-offset-night",
    heading: "text-white/40",
    link: "text-white/65 hover:text-white focus-visible:ring-white/60 focus-visible:ring-offset-night",
    base: "border-white/10 text-white/35",
  },
  light: {
    footer: "border-t border-[#0d0d50]/[0.08] bg-[linear-gradient(180deg,#ffffff_0%,#f4f4ff_100%)]",
    mark: "text-[#0d0d50]",
    soft: "text-[#0d0d50]/60",
    company: "text-[#0d0d50]/55 hover:text-[#0d0d50] focus-visible:ring-[#6666ff] focus-visible:ring-offset-white",
    heading: "text-[#6666ff]",
    link: "text-[#0d0d50]/75 hover:text-[#6666ff] focus-visible:ring-[#6666ff] focus-visible:ring-offset-white",
    base: "border-[#0d0d50]/[0.08] text-[#0d0d50]/50",
  },
} as const;
type Tone = (typeof TONES)[keyof typeof TONES];

export function PlatformFooter({ tone = "dark", ...rest }: { tone?: keyof typeof TONES } & React.HTMLAttributes<HTMLElement>) {
  const t = TONES[tone];
  return (
  <footer {...rest} className={t.footer}>
    <div className="mx-auto max-w-[78rem] px-5 py-14">
      <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
        <div className="max-w-xs">
          <SynoraAppMark className={t.mark} />
          <p className={`mt-4 text-sm leading-relaxed ${t.soft}`}>
            An online shop that argues with you before you make the expensive mistake, not
            after.
          </p>

          {/* The company that makes it. On its own, in the brand colour,
              with a slow pulse on the light around it — visible at the
              edge of vision without competing with anything being read. */}
          <a
            href="https://synoradigitals.com"
            target="_blank"
            rel="noreferrer"
            aria-label="Synora Digitals"
            className={`mt-7 inline-flex items-center gap-2.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-4 ${t.company}`}
          >
            <svg viewBox="0 0 48 48" className="sd-mark h-7 w-7 flex-shrink-0" aria-hidden>
              <defs>
                {/* The mark's own outline, used to clip the light — so the
                    band travels through the letterform and not across the
                    box around it. */}
                <clipPath id={`sdClip-${tone}`}>
                  <path d="M9.47,32.8c1.68-4.8,7.36-21.1,19.47-24.12.62-.16,1.48-.33,2.54-.42.62-.05.92.74.41,1.09h0c-1.69,1.17-3.9,2.73-6.44,5.23-3.81,3.75-6.54,6.93-6.67,7.08-2.39,2.8-5.48,6.59-8.96,11.32-.13.18-.43.04-.35-.18h0ZM15.02,38.24c4.9-1.65,21.52-7.21,24.6-19.09.16-.61.34-1.45.43-2.49.05-.61-.75-.9-1.11-.4h0c-1.19,1.66-2.78,3.82-5.33,6.32-3.82,3.73-7.07,6.41-7.22,6.54-2.86,2.35-6.72,5.38-11.54,8.78-.19.13-.04.42.18.35h0ZM37.67,10.6c-1.21-1.19-5.11.7-10.04,5.53-9.47,9.28-15.77,17.78-18.46,21.65-.34.5.27,1.09.77.76,3.95-2.64,12.62-8.82,22.08-18.1,4.93-4.83,6.86-8.65,5.64-9.84ZM11.62,22.92c1.44-3.28,3.7-8.26,8.61-12.25.6-.49,1.37-1.07,2.33-1.67.59-.38.2-1.27-.49-1.11-2.65.62-5.16,1.94-7.22,3.97-.58.57-1.11,1.18-1.58,1.82-1.82,2.46-2.78,5.34-2.88,8.25-.01.44,0,.89.02,1.33.03.54.79.67,1.01.16.07-.16.14-.32.21-.49ZM40.44,25.9c.16-.67-.75-1.06-1.13-.48-.62.93-1.21,1.69-1.71,2.28-4.07,4.82-9.16,7.03-12.5,8.44-.17.07-.34.14-.5.21-.51.21-.39.96.17.99.45.02.91.03,1.36.02,2.96-.1,5.9-1.04,8.41-2.82,0,0,0,0,0,0,.65-.46,1.27-.98,1.85-1.55,2.07-2.03,3.41-4.49,4.05-7.08Z" />
                </clipPath>
                <linearGradient id={`sdSheen-${tone}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                  <stop offset="45%" stopColor="#ffffff" stopOpacity="0.9" />
                  <stop offset="55%" stopColor="#ffffff" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M9.47,32.8c1.68-4.8,7.36-21.1,19.47-24.12.62-.16,1.48-.33,2.54-.42.62-.05.92.74.41,1.09h0c-1.69,1.17-3.9,2.73-6.44,5.23-3.81,3.75-6.54,6.93-6.67,7.08-2.39,2.8-5.48,6.59-8.96,11.32-.13.18-.43.04-.35-.18h0ZM15.02,38.24c4.9-1.65,21.52-7.21,24.6-19.09.16-.61.34-1.45.43-2.49.05-.61-.75-.9-1.11-.4h0c-1.19,1.66-2.78,3.82-5.33,6.32-3.82,3.73-7.07,6.41-7.22,6.54-2.86,2.35-6.72,5.38-11.54,8.78-.19.13-.04.42.18.35h0ZM37.67,10.6c-1.21-1.19-5.11.7-10.04,5.53-9.47,9.28-15.77,17.78-18.46,21.65-.34.5.27,1.09.77.76,3.95-2.64,12.62-8.82,22.08-18.1,4.93-4.83,6.86-8.65,5.64-9.84ZM11.62,22.92c1.44-3.28,3.7-8.26,8.61-12.25.6-.49,1.37-1.07,2.33-1.67.59-.38.2-1.27-.49-1.11-2.65.62-5.16,1.94-7.22,3.97-.58.57-1.11,1.18-1.58,1.82-1.82,2.46-2.78,5.34-2.88,8.25-.01.44,0,.89.02,1.33.03.54.79.67,1.01.16.07-.16.14-.32.21-.49ZM40.44,25.9c.16-.67-.75-1.06-1.13-.48-.62.93-1.21,1.69-1.71,2.28-4.07,4.82-9.16,7.03-12.5,8.44-.17.07-.34.14-.5.21-.51.21-.39.96.17.99.45.02.91.03,1.36.02,2.96-.1,5.9-1.04,8.41-2.82,0,0,0,0,0,0,.65-.46,1.27-.98,1.85-1.55,2.07-2.03,3.41-4.49,4.05-7.08Z" fill="#6666ff" />
              <g clipPath={`url(#sdClip-${tone})`}>
                <rect className="sd-sheen" x="0" y="-10" width="22" height="68" fill={`url(#sdSheen-${tone})`} />
              </g>
            </svg>
            <span>A Synora Digitals product</span>
          </a>
        </div>

        <div className="grid grid-cols-2 gap-x-14 gap-y-8 sm:gap-x-20">
          <FooterGroup t={t} title="The product">
            <FooterLink t={t} href="/#features">What it does</FooterLink>
            <FooterLink t={t} href={appUrl("/merchant/signup")}>Create your shop</FooterLink>
            <FooterLink t={t} href={appUrl("/merchant/login")}>Log in</FooterLink>
          </FooterGroup>

          {/* The company's own pages left this column: they are one click
              away through the mark above, and a merchant standing in a
              footer looking for help is not looking for our About page. */}
          <FooterGroup t={t} title="Help">
            <FooterLink t={t} href="/documentation">Documentation</FooterLink>
            <FooterLink t={t} href="/documentation">Release notes</FooterLink>
            <FooterLink t={t} href="/documentation">Known issues</FooterLink>
          </FooterGroup>
        </div>
      </div>

      {/* One line, centred. It was two held apart by justify-between, and
          the second was a slogan doing no work — the page has already made
          its case by the time anybody reaches here. With the slogan gone
          the survivor has nothing to be balanced against, so it sits in
          the middle rather than hugging the left edge. */}
      <div className={`mt-12 border-t pt-6 text-center text-xs ${t.base}`}>
        <p>&copy; {new Date().getFullYear()} Synora Digitals. All rights reserved.</p>
      </div>
    </div>
  </footer>
  );
}

function FooterGroup({ t, title, children }: { t: Tone; title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className={`text-[11px] font-medium uppercase tracking-[0.09em] ${t.heading}`}>{title}</h2>
      <ul className="mt-3.5 space-y-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({ t, href, children }: { t: Tone; href: string; children: React.ReactNode }) {
  const external = href.startsWith("http");
  return (
    <li>
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
        className={`text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-4 ${t.link}`}
      >
        {children}
      </a>
    </li>
  );
}
