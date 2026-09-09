import Link from "next/link";

type LogoItem = { image?: string; alt?: string; href?: string };

/**
 * A row of logos — brands stocked, press, partners.
 *
 * Scaled to one height rather than one width, because logos arrive in wildly
 * different proportions and matching their heights is what makes a row of
 * mismatched marks look deliberate. Greyscale is on by default for the same
 * reason: six brand palettes side by side fight each other and the page.
 */
export function LogoList({
  heading,
  logos,
  grayscale = true,
  logoHeight = 32,
}: {
  heading?: string;
  logos?: LogoItem[];
  grayscale?: boolean;
  logoHeight?: number;
}) {
  const shown = (logos ?? []).filter((l) => l.image);
  if (shown.length === 0) return null;

  return (
    <div>
      {heading && (
        <h2 className="mb-6 text-center text-xs font-medium uppercase tracking-[0.18em] text-ink-soft">
          {heading}
        </h2>
      )}
      <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
        {shown.map((logo, i) => {
          const img = (
            // eslint-disable-next-line @next/next/no-img-element -- merchant URL of unknown size
            <img
              src={logo.image}
              alt={logo.alt ?? ""}
              loading="lazy"
              style={{ height: logoHeight }}
              className={`w-auto object-contain transition ${
                grayscale ? "opacity-70 grayscale hover:opacity-100 hover:grayscale-0" : ""
              }`}
            />
          );
          return logo.href ? (
            <Link key={i} href={logo.href}>
              {img}
            </Link>
          ) : (
            <div key={i}>{img}</div>
          );
        })}
      </div>
    </div>
  );
}
