// Floating contact buttons — the model shared by the storefront renderer and
// the admin editor. Client-safe: pure data and string building.

export const STICKY_KINDS = ["WHATSAPP", "INSTAGRAM", "MESSENGER", "EMAIL", "PHONE", "LINK"] as const;
export type StickyKind = (typeof STICKY_KINDS)[number];

export const STICKY_SCOPES = ["HOME", "SHOPPING", "ALL"] as const;
export type StickyScope = (typeof STICKY_SCOPES)[number];

export type StickyButtonRow = {
  id: string;
  kind: string;
  label: string;
  value: string;
  message: string;
  scope: string;
  iconKind: string;
  iconValue: string;
  color: string;
  order: number;
  isVisible: boolean;
};

/** Per-kind metadata: what `value` means, and a sensible brand colour. */
export const STICKY_KIND_META: Record<
  StickyKind,
  { label: string; valueLabel: string; valuePlaceholder: string; color: string; supportsMessage: boolean }
> = {
  WHATSAPP: {
    label: "WhatsApp",
    valueLabel: "Phone number",
    valuePlaceholder: "923001234567",
    color: "#25D366",
    supportsMessage: true,
  },
  INSTAGRAM: {
    label: "Instagram",
    valueLabel: "Username",
    valuePlaceholder: "yourstore.com",
    color: "#E1306C",
    supportsMessage: false,
  },
  MESSENGER: {
    label: "Messenger",
    valueLabel: "Page username",
    valuePlaceholder: "yourstore",
    color: "#0084FF",
    supportsMessage: false,
  },
  EMAIL: {
    label: "Email",
    valueLabel: "Email address",
    valuePlaceholder: "hello@yourstore.com",
    color: "#4c100f",
    supportsMessage: true,
  },
  PHONE: {
    label: "Phone call",
    valueLabel: "Phone number",
    valuePlaceholder: "+923001234567",
    color: "#0f766e",
    supportsMessage: false,
  },
  LINK: {
    label: "Chat / custom link",
    valueLabel: "Link",
    valuePlaceholder: "https://tawk.to/chat/…",
    color: "#4c100f",
    supportsMessage: false,
  },
};

export const STICKY_SCOPE_LABELS: Record<StickyScope, string> = {
  HOME: "Home page only",
  SHOPPING: "Home, collection and product pages",
  ALL: "Every page",
};

/**
 * Whether a button shows on the given path.
 */
export function stickyButtonMatchesPath(scope: string, pathname: string): boolean {
  if (scope === "ALL") return true;
  const isHome = pathname === "/";
  if (scope === "HOME") return isHome;
  if (scope === "SHOPPING") {
    return (
      isHome ||
      pathname.startsWith("/collections") ||
      pathname.startsWith("/product") ||
      pathname === "/shop"
    );
  }
  return true;
}

/** The href a button opens, derived from its kind and value. */
export function stickyButtonHref(button: Pick<StickyButtonRow, "kind" | "value" | "message">): string {
  const value = button.value.trim();
  const message = button.message?.trim() ?? "";

  switch (button.kind) {
    case "WHATSAPP": {
      const digits = value.replace(/\D/g, "");
      const query = message ? `?text=${encodeURIComponent(message)}` : "";
      return `https://wa.me/${digits}${query}`;
    }
    case "INSTAGRAM":
      return `https://ig.me/m/${value.replace(/^@/, "")}`;
    case "MESSENGER":
      return `https://m.me/${value.replace(/^@/, "")}`;
    case "EMAIL": {
      const query = message ? `?body=${encodeURIComponent(message)}` : "";
      return `mailto:${value}${query}`;
    }
    case "PHONE":
      return `tel:${value.replace(/[^\d+]/g, "")}`;
    default:
      return value;
  }
}

/** External destinations need target=_blank; mailto:/tel: must not use it. */
export function opensInNewTab(kind: string): boolean {
  return kind !== "EMAIL" && kind !== "PHONE";
}
