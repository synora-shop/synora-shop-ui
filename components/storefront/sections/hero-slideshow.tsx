"use client";

import { useEffect, useState } from "react";
import { ImagePlaceholder } from "@/components/storefront/image-placeholder";
import Link from "next/link";
import { Container } from "@/components/ui/container";

export type HeroSlide = {
  image?: string;
  eyebrow?: string;
  headline: string;
  subheading?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

// Deliberately NOT wrapped in SectionFrame: the hero is full-bleed and owns its
// own height/overlay settings, so the shared padding/width controls don't apply.
const HEIGHT_CLASS: Record<string, string> = {
  medium: "min-h-[50vh]",
  large: "min-h-[70vh]",
  full: "min-h-screen",
};

// Auto-advancing hero. With zero slides it renders nothing (an empty Hero
// section an admin hasn't filled in yet); with one slide it's a static
// hero (no dots/interval — same as the old hardcoded homepage hero).
export function HeroSlideshow({
  slides,
  autoplaySeconds = 6,
  height = "large",
  overlayOpacity = 30,
}: {
  slides: HeroSlide[];
  autoplaySeconds?: number;
  height?: string;
  overlayOpacity?: number;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const ms = Math.max(1, autoplaySeconds) * 1000;
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), ms);
    return () => clearInterval(id);
  }, [slides.length, autoplaySeconds]);

  if (slides.length === 0) return null;
  // Clamped during render rather than corrected in an effect: a slide can be
  // deleted in the customizer while a later index is showing, and this way
  // there's no intermediate frame pointing at a slide that no longer exists.
  const current = Math.min(index, slides.length - 1);
  const slide = slides[current];
  const onImage = Boolean(slide.image);

  return (
    <section
      className={`relative flex items-center justify-center overflow-hidden bg-subtle ${
        HEIGHT_CLASS[height] ?? HEIGHT_CLASS.large
      }`}
    >
      {slide.image ? (
        // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded background image, arbitrary URL
        <img src={slide.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <ImagePlaceholder kind="image" className="absolute inset-0 h-full w-full" />
      )}
      {onImage && (
        <div className="absolute inset-0 bg-black" style={{ opacity: overlayOpacity / 100 }} />
      )}

      <Container className="relative z-10 flex flex-col items-center gap-6 py-24 text-center">
        {slide.eyebrow && (
          <p
            className={`text-xs font-medium uppercase tracking-[0.3em] ${
              onImage ? "text-white" : "text-brand-500"
            }`}
          >
            {slide.eyebrow}
          </p>
        )}
        <h1
          className={`max-w-2xl font-serif text-5xl font-semibold leading-tight sm:text-6xl ${
            onImage ? "text-white" : "text-ink"
          }`}
        >
          {slide.headline}
        </h1>
        {slide.subheading && (
          <p className={`max-w-md ${onImage ? "text-white/90" : "text-ink-soft"}`}>{slide.subheading}</p>
        )}
        {slide.ctaLabel && slide.ctaHref && (
          <Link
            href={slide.ctaHref}
            className="mt-2 inline-flex items-center rounded-full bg-brand-500 px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-600 active:bg-brand-700"
          >
            {slide.ctaLabel}
          </Link>
        )}
      </Container>

      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className="group no-tap-scale flex h-6 w-8 items-center justify-center"
            >
              <span
                className={`h-1.5 w-6 rounded-full transition-colors ${
                  i === current ? "bg-brand-500" : "bg-white/60 group-hover:bg-white/80 group-active:bg-white"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
