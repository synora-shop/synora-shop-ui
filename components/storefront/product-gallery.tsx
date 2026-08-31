"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);
  const shown = images.length > 0 ? images : ["/placeholder-product.svg"];

  return (
    <div>
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-brand-50">
        <Image
          src={shown[active]}
          alt={title}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
          priority
        />
      </div>
      {shown.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {shown.map((src, i) => (
            <button
              key={src + i}
              onClick={() => setActive(i)}
              className={cn(
                "relative h-20 w-16 flex-shrink-0 overflow-hidden rounded border-2 transition-colors",
                active === i ? "border-brand-500" : "border-transparent hover:border-brand-300 active:border-brand-500"
              )}
            >
              <Image src={src} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
