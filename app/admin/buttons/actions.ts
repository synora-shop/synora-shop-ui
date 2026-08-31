"use server";

import { put } from "@vercel/blob";
import { requireRole } from "@/lib/auth-guard";
import { db, currentShopId } from "@/lib/data/shop";
import { invalidateShop } from "@/lib/data/cached";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { validateIconFile } from "@/lib/icon-validation";
import { scanBuffer, scanPolicyBlocks } from "@/lib/virus-scan";
import { validateUrl } from "@/lib/url-validation";
import { STICKY_KINDS, STICKY_SCOPES, STICKY_KIND_META, type StickyKind } from "@/lib/sticky-buttons";

async function requireAdmin() {
  await requireRole("STAFF");
}

async function revalidateButtons() {
  invalidateShop(await currentShopId(), "buttons");
  revalidatePath("/admin/buttons");
  revalidatePath("/", "layout");
}

export type StickyButtonInput = {
  id?: string;
  kind: string;
  label: string;
  value: string;
  message: string;
  scope: string;
  iconKind: string;
  iconValue: string;
  color: string;
  isVisible: boolean;
};

/**
 * Whitelists every enum-ish field so a tampered client can't store junk, and
 * re-checks any raw URL. The browser-side check is only there to give fast
 * feedback — this is the gate that actually holds.
 */
function clean(input: StickyButtonInput) {
  const kind: StickyKind = (STICKY_KINDS as readonly string[]).includes(input.kind)
    ? (input.kind as StickyKind)
    : "LINK";
  const scope = (STICKY_SCOPES as readonly string[]).includes(input.scope) ? input.scope : "ALL";
  const iconKind = input.iconKind === "UPLOAD" ? "UPLOAD" : "BUILTIN";

  // Only the custom-link kind stores a raw URL; the others hold a phone number
  // or a handle that stickyButtonHref() turns into a safe link.
  let value = input.value.trim();
  if (kind === "LINK" && value !== "") {
    const check = validateUrl(value, { allowEmpty: false, allowContactSchemes: true, allowInternal: false });
    if (!check.ok) throw new Error(`${input.label || "Button"}: ${check.error}`);
    value = check.href;
  }

  return {
    kind,
    scope,
    iconKind,
    label: input.label.trim() || STICKY_KIND_META[kind].label,
    value,
    message: input.message?.trim() ?? "",
    iconValue: input.iconValue?.trim() ?? "",
    color: /^#[0-9a-f]{6}$/i.test(input.color) ? input.color : STICKY_KIND_META[kind].color,
    isVisible: Boolean(input.isVisible),
  };
}

/**
 * Replaces the whole button list in one transaction.
 */
export async function saveStickyButtons(buttons: StickyButtonInput[]) {
  await requireAdmin();

  const sid = await currentShopId();
  await prisma.$transaction(async (tx) => {
    await tx.stickyButton.deleteMany({ where: { shopId: sid } });
    for (const [order, button] of buttons.entries()) {
      await tx.stickyButton.create({
        data: { shopId: sid, order, ...clean(button) },
      });
    }
  });

  await revalidateButtons();
  return (await db()).stickyButton.findMany({ orderBy: { order: "asc" } });
}

/**
 * Uploads a custom button icon.
 *
 * SVGs are sanitised before storage and always rendered through <img> on the
 * storefront, so script inside an uploaded icon can neither be stored nor run.
 */
export async function uploadButtonIcon(formData: FormData): Promise<{ url?: string; error?: string }> {
  await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "No file selected." };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const check = validateIconFile(bytes, file.name);
  if (!check.ok) return { error: check.error };

  // Scanned as uploaded, before sanitising — the point is to judge the file the
  // admin actually chose, not a version this code already rewrote.
  const verdict = await scanBuffer(bytes, file.name);
  const blocked = scanPolicyBlocks(verdict);
  if (blocked) return { error: blocked };

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { error: "File storage isn't configured, so icons can't be uploaded on this deployment." };
  }

  try {
    const isSvg = check.format === "svg";
    const body = isSvg ? check.text : Buffer.from(check.bytes);
    const blob = await put(`button-icons/${Date.now()}-${file.name}`, body, {
      access: "public",
      contentType: isSvg ? "image/svg+xml" : "image/png",
    });
    return { url: blob.url };
  } catch {
    return { error: "Upload failed. Please try again." };
  }
}
