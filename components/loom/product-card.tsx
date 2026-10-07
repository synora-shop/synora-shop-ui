import { LoomCard, LoomPhoto, px, type Placement } from "@/components/loom/primitives";
import { LoomLove } from "@/components/loom/wishlist";

export type LoomProduct = {
  /** The catalogue id — what the heart saves to the wishlist. */
  id?: string;
  title: string;
  /** Formatted in the shop's currency. */
  price: string;
  /** The same price as a number — what the wishlist keeps. */
  amount?: number;
  /** Desktop card width. */
  w: number;
  /** Full width on the phone. */
  wideOnPhone?: boolean;
  src: string;
  /**
   * The image's own box inside the card, exactly as the file crops it, and the
   * same on the phone. A card the file never drew — a related product on a
   * product page — leaves them out and the photo covers the card instead.
   */
  img?: Placement;
  mImg?: Placement;
  /** Where the card goes. */
  href?: string;
  loved?: boolean;
};

/**
 * A product card: the image, then the name at 24/32 Medium and the price at
 * 20/28 Regular muted to eighty per cent — 12 below a 374-tall image and 4
 * between the two lines on desktop.
 *
 * On the phone the image is 163.5 tall in a half-width card and 196 in a wide
 * one, the text 18/32 and 16/28, 8 below the image and nothing between. The
 * radius is 24 on the half-width card and 21 on the wide one; the file really
 * does draw those differently.
 */
export function LoomProductCard({ id, title, price, amount, w, wideOnPhone, src, img, mImg, loved, href = "#" }: LoomProduct) {
  return (
    <article
      className={`relative flex flex-col gap-[calc(8*var(--u))] md:w-[var(--w)] md:shrink-0 md:gap-0 ${wideOnPhone ? "col-span-2" : ""}`}
      style={px({ w })}
    >
      <LoomCard
        className="h-[var(--mh)] w-full rounded-[var(--mr)] md:h-[calc(374*var(--u))] md:rounded-[calc(40*var(--u))]"
        style={px(wideOnPhone ? { mh: 196, mr: 20.98 } : { mh: 163.5, mr: 24 })}
      >
        {img ? (
          <LoomPhoto src={src} alt={title} {...img} m={mImg} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={title} className="absolute inset-0 h-full w-full object-cover" />
        )}
        <LoomLove product={id ? { id, title, price: amount ?? 0, src, href } : undefined} active={loved} />
      </LoomCard>
      <div>
        <h3
          data-m="product-name"
          className="text-[max(calc(18*var(--u)),14.4px)] font-medium leading-[max(calc(32*var(--u)),25.6px)] tracking-[calc(-1*var(--u))] text-[#121212] md:mt-[calc(12*var(--u))] md:text-[max(calc(24*var(--u)),19.2px)]"
        >
          <a href={href} className="after:absolute after:inset-0">
            {title}
          </a>
        </h3>
        <p
          data-m="product-price"
          className="text-[max(calc(16*var(--u)),12.8px)] font-normal leading-[max(calc(28*var(--u)),22.4px)] tracking-[calc(-1*var(--u))] text-[#121212]/80 md:mt-[calc(4*var(--u))] md:text-[max(calc(20*var(--u)),16px)]"
        >
          {price}
        </p>
      </div>
    </article>
  );
}
