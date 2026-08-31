"use server";

import { put, del } from "@vercel/blob";
import { requireRole } from "@/lib/auth-guard";
import { db, currentShopId } from "@/lib/data/shop";
import { invalidateShop } from "@/lib/data/cached";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { validateFontFile } from "@/lib/font-validation";
import { scanBuffer, scanPolicyBlocks, verdictSummary } from "@/lib/virus-scan";

async function requireAdmin() {
  await requireRole("STAFF");
}

async function revalidateFonts() {
  invalidateShop(await currentShopId(), "fonts");
  revalidatePath("/admin/fonts");
  revalidatePath("/admin/theme");
  revalidatePath("/", "layout");
}

/**
 * Accepts a font upload only after reading the file's actual bytes and
 * confirming they're a real, intact font — the filename and browser-reported
 * MIME type are never trusted. See lib/font-validation.ts for exactly what is
 * and isn't checked.
 */
export async function uploadFont(
  formData: FormData
): Promise<{ error?: string; id?: string; scan?: { status: string; provider: string; detail: string } }> {
  await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "No file selected." };

  const bytes = new Uint8Array(await file.arrayBuffer());

  // Cheap structural check first: no point spending a scanner request on
  // something that isn't a font at all.
  const check = validateFontFile(bytes, file.name);
  if (!check.ok) return { error: check.error };

  const verdict = await scanBuffer(bytes, file.name);
  const blocked = scanPolicyBlocks(verdict);
  if (blocked) return { error: blocked };

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { error: "File storage isn't configured, so fonts can't be uploaded on this deployment." };
  }

  const displayName = String(formData.get("name") || "").trim() || file.name.replace(/\.[^.]+$/, "");
  const scan = verdictSummary(verdict);

  try {
    const blob = await put(`fonts/${Date.now()}-${file.name}`, Buffer.from(bytes), {
      access: "public",
      contentType: `font/${check.format}`,
    });
    const created = await (await db()).fontAsset.create({
      data: {
        shopId: await currentShopId(),
        name: displayName,
        url: blob.url,
        format: check.format,
        sizeBytes: bytes.length,
        scanStatus: scan.status,
        scanProvider: scan.provider,
        scanDetail: scan.detail,
        sha256: verdict.sha256,
        scannedAt: new Date(),
      },
    });
    await revalidateFonts();
    return { id: created.id, scan };
  } catch {
    return { error: "Upload failed. Please try again." };
  }
}

export async function renameFont(id: string, name: string): Promise<{ error?: string }> {
  await requireAdmin();
  const trimmed = name.trim();
  if (!trimmed) return { error: "Name can't be empty." };
  await (await db()).fontAsset.update({ where: { id }, data: { name: trimmed } });
  await revalidateFonts();
  return {};
}

/**
 * Deletes a font, refusing while the theme still selects it — otherwise the
 * store would silently drop to a fallback family.
 */
export async function deleteFont(id: string): Promise<{ error?: string }> {
  await requireAdmin();

  const themes = await (await db()).themeSettings.findMany({ select: { tokens: true } });
  const inUse = themes.filter((t) => {
    const tokens = (t.tokens ?? {}) as { headingFont?: string; bodyFont?: string };
    return tokens.headingFont === `custom:${id}` || tokens.bodyFont === `custom:${id}`;
  });
  if (inUse.length > 0) {
    return { error: "That font is still in use by your theme. Switch to another font first." };
  }

  const font = await (await db()).fontAsset.findUnique({ where: { id } });
  if (!font) return { error: "Font not found." };

  await (await db()).fontAsset.delete({ where: { id } });
  // Blob removal is best-effort: the database row is the source of truth, and a
  // stray orphaned file is far better than a failed delete leaving a font
  // listed in the UI that no longer exists.
  try {
    await del(font.url);
  } catch {
    /* ignore */
  }

  await revalidateFonts();
  return {};
}
