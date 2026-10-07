import { LoomCard, LoomPhoto, px } from "@/components/loom/primitives";

const PHOTO = "/loom/57cd86eaec4b399b54263e873dd87745943b8f88.png";

/**
 * Testimoni — one photograph with the quote set over it. Radius 40 at both
 * sizes; it is the one card the phone does not round down.
 *
 * Desktop: 1320x556, the words 80 in from the left. The file places its five
 * blocks absolutely at 80 / 128 / 278 / 422 / 454 down the card; as a flow
 * that is 10 between eyebrow and quote, 20 to the four-line body, 40 to the name — and
 * 80 of padding all round, which adds up to exactly 556. It is a flow, and the
 * height a minimum, so that where the body text is held at its floor on a
 * small laptop the card grows instead of the words running off its foot.
 * The image is 2116x1411 offset (-91,-303) — a crop on the subject's
 * shoulders that no `object-position` would find.
 *
 * Phone: 343x624, 32 in. Eyebrow and quote 8 apart, 40 to the body, 24 to the
 * person — who gains a 64px round portrait on the phone that desktop does not
 * have. It is the same photograph, cropped by the file's own transform to the
 * face. The background photo fills the card from the centre.
 */
export function LoomTestimonial() {
  return (
    <section className="flex justify-center px-[calc(16*var(--u))] py-[calc(40*var(--u))] md:px-0">
      <LoomCard data-m="testimonial-card" className="min-h-[calc(624*var(--u))] w-full md:min-h-[calc(556*var(--u))] md:w-[calc(1320*var(--u))]">
        <LoomPhoto src={PHOTO} w={2116} h={1411} x={-91} y={-303} m={{ w: 1139, h: 919 }} />
        <figure className="relative flex flex-col gap-[calc(40*var(--u))] p-[calc(32*var(--u))] text-white md:gap-[calc(20*var(--u))] md:p-[calc(80*var(--u))]">
          <div className="flex w-[calc(263*var(--u))] flex-col gap-[calc(8*var(--u))] md:w-[calc(511*var(--u))] md:gap-[calc(10*var(--u))]">
            <figcaption className="text-[max(calc(20*var(--u)),16px)] font-normal leading-[max(calc(28*var(--u)),22.4px)] tracking-[calc(-1*var(--u))] text-white/50 md:text-[calc(30*var(--u))] md:leading-[calc(38*var(--u))]">
              What people said
            </figcaption>
            <blockquote
              data-m="quote"
              className="text-[calc(40*var(--u))] font-normal leading-[calc(48*var(--u))] tracking-[calc(-3*var(--u))] md:text-[calc(65*var(--u))] md:leading-[calc(65*var(--u))] md:tracking-[calc(-4*var(--u))]"
            >
              Love the way they handle the order.
            </blockquote>
          </div>
          <div className="flex w-[calc(262*var(--u))] flex-col gap-[calc(24*var(--u))] md:w-[calc(510*var(--u))] md:gap-[calc(40*var(--u))]">
            <p className="text-[max(calc(16*var(--u)),12.8px)] font-normal leading-[max(calc(26*var(--u)),20.8px)] tracking-[calc(-0.3*var(--u))] text-white/80 md:text-[max(calc(18*var(--u)),14.4px)]">
              Very professional and friendly at the same time. They packed the order on schedule and the
              detail of their wrapping is top notch. One of my best experience for buying online items.
              Surely will come back for another purchase.
            </p>
            <div>
              <div className="relative h-[calc(64*var(--u))] w-[calc(64*var(--u))] overflow-hidden rounded-full md:hidden">
                {/* eslint-disable-next-line @next/next/no-img-element -- reference build */}
                <img
                  src={PHOTO}
                  alt=""
                  className="absolute left-[var(--x)] top-[var(--y)] h-[var(--h)] w-[var(--w)] max-w-none"
                  style={px({ w: 271, h: 180.67, x: -94.45, y: -36.8 })}
                />
              </div>
              <p
                data-m="quote-name"
                className="text-[max(calc(16*var(--u)),12.8px)] font-semibold leading-[max(calc(32*var(--u)),25.6px)] tracking-[calc(-0.5*var(--u))] md:text-[max(calc(24*var(--u)),19.2px)]"
              >
                Samantha William
              </p>
              <p className="text-[max(calc(14*var(--u)),11.2px)] font-normal leading-[max(calc(22*var(--u)),17.6px)] text-white/50">Fashion Enthusiast</p>
            </div>
          </div>
        </figure>
      </LoomCard>
    </section>
  );
}
