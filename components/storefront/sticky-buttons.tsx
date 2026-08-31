"use client";

import { usePathname } from "next/navigation";
import { MessageCircle, Camera, AtSign, Mail, Phone, Send, Link2, Headset } from "lucide-react";
import {
  stickyButtonHref,
  stickyButtonMatchesPath,
  opensInNewTab,
  type StickyButtonRow,
} from "@/lib/sticky-buttons";

/**
 * Built-in icon set offered in the editor, keyed by `iconValue`.
 *
 * Deliberately generic shapes: this icon library no longer ships brand logos
 * (they were removed over trademark concerns), so for an exact Instagram or
 * WhatsApp mark an admin uploads the official SVG instead.
 */
export const BUILTIN_ICONS = {
  chat: MessageCircle,
  camera: Camera,
  at: AtSign,
  send: Send,
  mail: Mail,
  phone: Phone,
  support: Headset,
  link: Link2,
} as const;

export type BuiltinIconKey = keyof typeof BUILTIN_ICONS;

/** Sensible default icon per button kind, used when none was chosen. */
const DEFAULT_ICON: Record<string, BuiltinIconKey> = {
  WHATSAPP: "chat",
  INSTAGRAM: "camera",
  MESSENGER: "send",
  EMAIL: "mail",
  PHONE: "phone",
  LINK: "support",
};

function ButtonIcon({ button }: { button: StickyButtonRow }) {
  if (button.iconKind === "UPLOAD" && button.iconValue) {
    // Rendered as an <img>, never inlined: browsers don't execute script inside
    // an SVG loaded this way, which is the second of the two defences around
    // uploaded icons (see lib/icon-validation.ts).
    // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded icon at an arbitrary Blob URL
    return <img src={button.iconValue} alt="" className="h-7 w-7 object-contain" />;
  }
  const key = (button.iconValue as BuiltinIconKey) || DEFAULT_ICON[button.kind] || "chat";
  const Icon = BUILTIN_ICONS[key] ?? MessageCircle;
  return <Icon className="h-7 w-7" />;
}

/**
 * The floating contact buttons, stacked above one another in the corner.
 *
 * Which ones appear depends on each button's page scope, evaluated on the
 * client from the current pathname — that keeps the storefront layout free of
 * route-sniffing and works identically inside the customizer's preview iframe.
 */
export function StickyButtons({ buttons }: { buttons: StickyButtonRow[] }) {
  const pathname = usePathname();
  const visible = buttons
    .filter((b) => b.isVisible && b.value.trim() !== "")
    .filter((b) => stickyButtonMatchesPath(b.scope, pathname))
    .sort((a, b) => a.order - b.order);

  if (visible.length === 0) return null;

  return (
    <div data-shp-region="sticky-button" className="fixed bottom-5 right-5 z-40 flex flex-col-reverse items-center gap-3">
      {visible.map((button) => (
        <a
          key={button.id}
          href={stickyButtonHref(button)}
          {...(opensInNewTab(button.kind) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          aria-label={button.label}
          title={button.label}
          style={{ backgroundColor: button.color }}
          className="flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        >
          <ButtonIcon button={button} />
        </a>
      ))}
    </div>
  );
}
