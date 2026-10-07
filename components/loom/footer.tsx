/**
 * Footer — 1440x341 on `#121212`, the brand block at the left gutter and
 * three link columns pushed to the right, 100 apart.
 *
 * The opacity ladder is the whole design: column labels at 11/16 Semi Bold
 * with +1px tracking at full strength, the links beneath them 13/16 Medium at
 * **52%**. Not a grey — 52% white, which is why the footer reads as one
 * surface rather than two.
 *
 * The newsletter field is a 250x45 pill outlined white at the same 52%,
 * beside a 105x45 solid white button with `#121212` text.
 *
 * Phone, 375x838: everything stacks inside a 16px gutter. The brand block and
 * the field (now full width, the button under it, 10 apart) sit 40 apart with
 * 40 above and below; then Popular and Menu side by side, 60 apart; then Other
 * on its own row, 40 under them; then 40 of footer below that.
 *
 * The ground runs to both edges of the window at any width — a spread shadow
 * clipped to the footer's own height — while the content stays in the page's
 * column. Past 1440, or past the phone's 450 cap, a footer that stopped at the
 * column would leave white either side of a black band.
 */
const COLUMNS = [
  { label: "Popular", links: ["Shoes", "T-Shirt", "Jackets", "Hat", "Accessories"] },
  { label: "Menu", links: ["All Category", "Gift Cards", "Special Events", "Testimonial", "Blog"] },
  {
    label: "Other",
    links: ["Tracking Package", "FAQ", "About Us", "Contact Us", "Terms and Conditions"],
  },
];

export function LoomFooter() {
  return (
    <footer className="flex flex-col bg-[#121212] pb-[calc(40*var(--u))] shadow-[0_0_0_100vmax_#121212] [clip-path:inset(0_-100vmax)] md:min-h-[calc(341*var(--u))] md:flex-row md:items-start md:justify-between md:px-[calc(60*var(--u))] md:pb-0 md:pt-[calc(60*var(--u))]">
      <div className="flex shrink-0 flex-col gap-[calc(40*var(--u))] px-[calc(16*var(--u))] py-[calc(40*var(--u))] md:w-[calc(365*var(--u))] md:gap-[calc(25*var(--u))] md:p-0">
        <div className="flex w-[calc(290*var(--u))] flex-col gap-[calc(10*var(--u))]">
          <p className="text-[max(calc(24*var(--u)),19.2px)] font-extrabold leading-[max(calc(30*var(--u)),24px)] text-white">ECOMMERCE</p>
          <p className="text-[max(calc(14*var(--u)),11.2px)] font-normal leading-[max(calc(22*var(--u)),17.6px)] text-white/[0.52]">
            Ecommerce is a free UI Kit from Paperpillar that you can use for your personal or
            commercial project.
          </p>
        </div>
        <div className="flex flex-col gap-[calc(10*var(--u))] md:flex-row md:items-center">
          <input
            type="email"
            placeholder="Type your email address"
            aria-label="Email address"
            className="h-[max(calc(45*var(--u)),40px)] w-full rounded-[200px] border border-white/[0.52] bg-transparent px-[calc(16*var(--u))] md:w-[calc(250*var(--u))] md:px-[calc(24*var(--u))] text-[max(calc(13*var(--u)),11px)] leading-[max(calc(21*var(--u)),16.8px)] text-white outline-none placeholder:text-white/[0.52]"
          />
          <button
            type="button"
            className="h-[max(calc(45*var(--u)),40px)] min-w-[calc(105*var(--u))] self-start rounded-[200px] px-[calc(16*var(--u))] bg-white text-[max(calc(13*var(--u)),11px)] font-semibold leading-[max(calc(21*var(--u)),16.8px)] text-[#121212]"
          >
            Submit
          </button>
        </div>
      </div>

      <nav className="flex flex-wrap gap-x-[calc(60*var(--u))] gap-y-[calc(40*var(--u))] px-[calc(16*var(--u))] py-[calc(40*var(--u))] md:flex-nowrap md:gap-[calc(100*var(--u))] md:p-0">
        {COLUMNS.map((c) => (
          <div key={c.label} className={`flex flex-col gap-[calc(16*var(--u))] ${c.label === "Other" ? "basis-full md:basis-auto" : ""}`}>
            <p data-m="footer-label" className="text-[max(calc(11*var(--u)),11px)] font-semibold uppercase leading-[max(calc(16*var(--u)),12.8px)] tracking-[calc(1*var(--u))] text-white">
              {c.label}
            </p>
            {c.links.map((l) => (
              <a
                key={l}
                href={l === "Shoes" || l === "All Category" ? "/loom/collection" : "#"}
                data-m="footer-link"
                className="whitespace-nowrap text-[max(calc(13*var(--u)),11px)] font-medium leading-[max(calc(16*var(--u)),12.8px)] text-white/[0.52]"
              >
                {l}
              </a>
            ))}
          </div>
        ))}
      </nav>
    </footer>
  );
}
