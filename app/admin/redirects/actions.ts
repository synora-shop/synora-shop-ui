"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { db, currentShopId } from "@/lib/data/shop";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { validateUrl } from "@/lib/url-validation";

async function requireAdmin() {
  await requireRole("STAFF");
}

export type RedirectInput = { fromPath: string; toPath: string; note: string; isActive: boolean };

/** Normalises the "from" side: always a site-relative path, no trailing slash. */
function normaliseFrom(raw: string): { ok: true; path: string } | { ok: false; error: string } {
  let path = raw.trim();
  if (path === "") return { ok: false, error: "Enter the address that should redirect." };

  // Accept a pasted full URL of this site and reduce it to its path.
  if (/^https?:\/\//i.test(path)) {
    try {
      path = new URL(path).pathname;
    } catch {
      return { ok: false, error: "That doesn't look like a valid address." };
    }
  }
  if (!path.startsWith("/")) path = `/${path}`;
  if (path.length > 1) path = path.replace(/\/+$/, "");
  if (path === "/") return { ok: false, error: "The home page can't redirect somewhere else." };
  return { ok: true, path };
}

export async function saveRedirect(input: RedirectInput, id?: string): Promise<{ error?: string }> {
  await requireAdmin();

  const from = normaliseFrom(input.fromPath);
  if (!from.ok) return { error: from.error };

  const to = validateUrl(input.toPath, { allowEmpty: false, allowInternal: true });
  if (!to.ok) return { error: `Destination: ${to.error}` };

  if (to.href === from.path) return { error: "That would redirect the address to itself." };

  // A -> B where B already redirects to C would bounce the visitor twice; point
  // it straight at the end of the chain instead.
  const chained = await (await db()).redirect.findFirst({ where: { fromPath: to.href } });
  if (chained && chained.isActive) {
    return {
      error: `${to.href} already redirects to ${chained.toPath}. Point this one straight there instead.`,
    };
  }

  const data = {
    fromPath: from.path,
    toPath: to.href,
    note: input.note.trim(),
    isActive: input.isActive,
  };

  try {
    if (id) await (await db()).redirect.update({ where: { id }, data });
    else await (await db()).redirect.create({ data: { ...data, shopId: await currentShopId() } });
  } catch {
    return { error: `A redirect for ${from.path} already exists.` };
  }

  revalidatePath("/admin/redirects");
  return {};
}

export async function deleteRedirect(id: string) {
  await requireAdmin();
  await (await db()).redirect.delete({ where: { id } }).catch(() => {});
  revalidatePath("/admin/redirects");
}

export async function toggleRedirect(id: string) {
  await requireAdmin();
  const existing = await (await db()).redirect.findUnique({ where: { id } });
  if (!existing) return;
  await (await db()).redirect.update({ where: { id }, data: { isActive: !existing.isActive } });
  revalidatePath("/admin/redirects");
}
