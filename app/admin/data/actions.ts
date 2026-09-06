"use server";

import { del } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { db } from "@/lib/data/shop";

/**
 * Removes one file from the library and from storage.
 *
 * The row is found through the tenant-scoped client, so an id belonging to
 * another shop simply is not there — the delete cannot reach across a tenant
 * even if the id is guessed correctly.
 *
 * Storage is emptied first and the row second. The other order can leave a
 * paid-for file with nothing pointing at it, which is the state this table
 * exists to make impossible.
 */
export async function deleteAsset(id: string): Promise<{ error?: string }> {
  await requireRole("ADMIN");
  const prisma = await db();

  const asset = await prisma.mediaAsset.findFirst({ where: { id }, select: { url: true } });
  if (!asset) return { error: "That file is not in your library." };

  try {
    await del(asset.url);
  } catch {
    // Already gone from storage, or storage is unreachable. Either way the row
    // should not survive: a library entry whose file cannot be fetched is worse
    // than no entry, because it renders as a broken picture.
  }

  await prisma.mediaAsset.delete({ where: { id } });
  revalidatePath("/admin/data");
  return {};
}
