/** Somewhere the shop is. */
export type LocationCard = {
  id: string;
  name: string;
  address: string;
  city: string | null;
  phone: string | null;
  mapUrl: string | null;
};

/** Digits, plus and spaces only — everything a tel: link may carry. */
function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/**
 * Only a link we are willing to send someone to.
 *
 * The map URL is merchant input, and this renders on their own domain, so a
 * `javascript:` link here would run in a customer's browser on a page that
 * looks entirely legitimate. Anything that is not plain http(s) keeps its
 * address as text and loses its link.
 */
export function safeMapUrl(url: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : null;
}

/**
 * Where to find the shop.
 *
 * A link to a map rather than an embedded one, deliberately. An embedded map is
 * a third-party script running on a merchant's own domain, watching their
 * customers, and slowing down the one page most likely to be opened on a phone
 * outside.
 */
export function LocationInfo({
  heading,
  locations = [],
  showPhone = true,
}: {
  heading?: string;
  locations?: LocationCard[];
  showPhone?: boolean;
}) {
  if (locations.length === 0) return null;

  return (
    <div className="mx-auto max-w-4xl">
      {heading && (
        <h2 className="text-center font-serif text-3xl font-semibold">{heading}</h2>
      )}

      <div
        className="mt-8 grid gap-6"
        style={{
          gridTemplateColumns: `repeat(${Math.min(locations.length, 3)}, minmax(0, 1fr))`,
        }}
      >
        {locations.map((location) => {
          const map = safeMapUrl(location.mapUrl);
          return (
            <div
              key={location.id}
              className="rounded-[var(--radius)] border border-border bg-surface p-5"
            >
              <h3 className="font-medium text-ink">{location.name}</h3>

              <address className="mt-2 whitespace-pre-line text-sm not-italic leading-relaxed text-ink-soft">
                {location.address}
                {location.city ? `\n${location.city}` : ""}
              </address>

              {showPhone && location.phone && (
                <p className="mt-3 text-sm">
                  <a href={telHref(location.phone)} className="text-ink hover:text-brand-600">
                    {location.phone}
                  </a>
                </p>
              )}

              {map && (
                <p className="mt-3 text-sm">
                  <a
                    href={map}
                    target="_blank"
                    // noreferrer as well: the map host does not need to be told
                    // which shop's page sent the customer.
                    rel="noopener noreferrer"
                    className="text-brand-600 underline underline-offset-2"
                  >
                    Open in maps
                  </a>
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
