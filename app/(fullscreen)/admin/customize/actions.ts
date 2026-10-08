"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { db, currentShopId } from "@/lib/data/shop";
import { prisma } from "@/lib/prisma";
import { getSectionSchema } from "@/lib/section-schema";
import { validateUrl } from "@/lib/url-validation";
import { getPageTemplate } from "@/lib/page-templates";
import type { Prisma, SectionType } from "@/lib/generated/prisma/client";
import { kitFor } from "@/lib/themes/kits";
import { checkTemplate, isTemplateName } from "@/lib/themes/kit-templates";
import { isKitRoute } from "@/lib/themes/kit";
import { invalidateShop } from "@/lib/data/cached";
import { revisionOf, STALE_SAVE } from "@/lib/revision";
import { MAX_SECTIONS as MAX_PAGE_SECTIONS } from "@/lib/themes/kit-templates";

async function requireAdmin() {
  await requireRole("STAFF");
}

/** Confirms the page exists — and, through the scoped client, belongs to this shop. */
async function requirePage(pageId: string) {
  const page = await (await db()).page.findUnique({ where: { id: pageId }, select: { id: true } });
  if (!page) throw new Error("Page not found");
  return page;
}

export type DraftSection = {
  /** Sections added in the editor arrive with an id prefixed "new:". */
  id: string;
  type: string;
  data: unknown;
  isVisible: boolean;
};

/**
 * Persists a page's whole section list in one transaction: creates the ones
 * added in the editor, updates the rest, drops anything removed, and rewrites
 * `order` from the array's order.
 *
 * Returns the saved sections so the client can swap its temporary "new:" ids
 * for the real ones without a reload.
 */
/**
 * Re-checks every link in a section against the secure-URL rules and returns
 * the cleaned data.
 *
 * The customizer already blocks saving on a bad link, but that check runs in the
 * browser and so isn't a control — this is. It also normalises, so a bare
 * "synoradigitals.com" typed into a button lands in the database as a full https URL.
 */
function sanitiseSectionLinks(type: string, raw: unknown): unknown {
  const schema = getSectionSchema(type);
  if (!schema) return raw;
  const data = { ...((raw ?? {}) as Record<string, unknown>) };

  const clean = (value: unknown, label: string) => {
    const check = validateUrl(String(value ?? ""), { allowContactSchemes: true });
    if (!check.ok) throw new Error(`${schema.label}, ${label}: ${check.error}`);
    return check.href;
  };

  for (const field of schema.fields) {
    if (field.kind === "url") data[field.key] = clean(data[field.key], field.label);
  }

  if (schema.blocks) {
    const blocks = Array.isArray(data[schema.blocks.key]) ? (data[schema.blocks.key] as Record<string, unknown>[]) : [];
    data[schema.blocks.key] = blocks.map((block, i) => {
      const next = { ...block };
      for (const field of schema.blocks!.fields) {
        if (field.kind === "url") {
          next[field.key] = clean(block[field.key], `${schema.blocks!.label} ${i + 1} · ${field.label}`);
        }
      }
      return next;
    });
  }

  return data;
}

/** What a save hands back: the saved list and its new fingerprint, or why it did not save. */
export type SaveResult =
  | { ok: true; sections: DraftSection[]; revision: string }
  | { ok: false; error: string; stale?: boolean };

/** A thrown validation message, as something the browser will actually be shown. */
const failed = (err: unknown): SaveResult => ({
  ok: false,
  error: err instanceof Error ? err.message : "Couldn't save. Please try again.",
});

/** A page's sections in the one shape both the fingerprint and the editor use. */
const asDraft = (rows: { id: string; type: string; data: unknown; isVisible: boolean }[]): DraftSection[] =>
  rows.map((r) => ({ id: r.id, type: r.type, data: r.data, isVisible: r.isVisible }));

/** The fingerprint the editor opens a page with. Server-side, so it matches the save's. */
export async function pageRevision(pageId: string): Promise<string> {
  const rows = await (await db()).section.findMany({
    where: { pageId },
    orderBy: { order: "asc" },
    select: { id: true, type: true, data: true, isVisible: true },
  });
  return revisionOf(asDraft(rows));
}

/**
 * Persists a page's whole section list: creates the ones added in the editor,
 * updates the ones that changed, drops anything removed, rewrites `order`.
 *
 * Returns rather than throws. A thrown message from a server action is
 * replaced by a generic one in production, so "Hero, Button link: not a
 * valid address" reached nobody — the merchant saw "something went wrong".
 *
 * Refused when the page changed since the editor opened it (`base`), with the
 * page row locked for the length of the check and the write so two saves
 * cannot both pass the check. Writes only what differs: a save that changed
 * one section of forty is one statement, not forty.
 */
export async function saveSections(pageId: string, sections: DraftSection[], base: string): Promise<SaveResult> {
  try {
    await requireAdmin();
    await requirePage(pageId);
    if (!Array.isArray(sections) || sections.length > MAX_PAGE_SECTIONS) {
      return { ok: false, error: `A page can hold up to ${MAX_PAGE_SECTIONS} sections.` };
    }
    // Validated before anything is written, so a bad link fails cleanly.
    const known = sections.filter((s) => getSectionSchema(s.type));
    const cleaned = known.map((s, order) => ({
      ...s,
      order,
      data: sanitiseSectionLinks(s.type, s.data) as Prisma.InputJsonValue,
    }));

    const sid = await currentShopId();
    const outcome = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Page" WHERE id = ${pageId} AND "shopId" = ${sid} FOR UPDATE`;
      const current = await tx.section.findMany({
        where: { pageId, shopId: sid },
        orderBy: { order: "asc" },
        select: { id: true, type: true, data: true, isVisible: true, order: true },
      });
      if (revisionOf(asDraft(current)) !== base) return null;

      const byId = new Map(current.map((c) => [c.id, c]));
      const kept = new Set(cleaned.filter((s) => !s.id.startsWith("new:")).map((s) => s.id));
      const removed = current.filter((c) => !kept.has(c.id)).map((c) => c.id);
      if (removed.length) await tx.section.deleteMany({ where: { id: { in: removed }, shopId: sid } });

      const fresh = cleaned.filter((s) => s.id.startsWith("new:"));
      if (fresh.length) {
        await tx.section.createMany({
          data: fresh.map((s) => ({ shopId: sid, pageId, type: s.type as SectionType, order: s.order, isVisible: s.isVisible, data: s.data })),
        });
      }
      for (const s of cleaned) {
        const was = s.id.startsWith("new:") ? null : byId.get(s.id);
        if (!was) continue;
        const same =
          was.order === s.order && was.isVisible === s.isVisible && was.type === s.type && JSON.stringify(was.data) === JSON.stringify(s.data);
        if (same) continue;
        await tx.section.updateMany({
          where: { id: s.id, shopId: sid },
          data: { type: s.type as SectionType, order: s.order, isVisible: s.isVisible, data: s.data },
        });
      }
      return tx.section.findMany({
        where: { pageId, shopId: sid },
        orderBy: { order: "asc" },
        select: { id: true, type: true, data: true, isVisible: true },
      });
    });
    if (!outcome) return { ok: false, error: STALE_SAVE, stale: true };
    const saved = asDraft(outcome);
    return { ok: true, sections: saved, revision: revisionOf(saved) };
  } catch (err) {
    return failed(err);
  }
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Finds a free slug, appending -2, -3 … if needed. */
async function uniqueSlug(base: string): Promise<string> {
  const root = slugify(base) || "page";
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    const taken = await (await db()).page.findFirst({ where: { slug: candidate } });
    if (!taken) return candidate;
  }
  return `${root}-${Date.now()}`;
}

/**
 * Creates a page from a template.
 *
 * Sections are stored as the template's partial data;
 * resolveSectionData() fills in the rest at render time, so a template never
 * needs updating when a section gains a setting.
 */
export async function createPageFromTemplate(
  templateKey: string,
  title: string
): Promise<{ id?: string; error?: string }> {
  await requireAdmin();

  const template = getPageTemplate(templateKey);
  if (!template) return { error: "That template no longer exists." };

  const trimmed = title.trim();
  if (!trimmed) return { error: "Give the page a name." };

  const slug = await uniqueSlug(trimmed);
  try {
    const sid = await currentShopId();
    const page = await (await db()).page.create({
      data: {
        shopId: sid,
        slug,
        title: trimmed,
        isSystem: false,
        isPublished: true,
        sections: {
          create: template.sections.map((section, order) => ({
            shopId: sid,
            type: section.type as SectionType,
            order,
            isVisible: true,
            data: section.data as Prisma.InputJsonValue,
          })),
        },
      },
    });
    revalidatePath("/admin/customize");
    return { id: page.id };
  } catch {
    return { error: "Couldn't create that page. Please try again." };
  }
}

/** Copies a page, its sections and its settings, under a new name. */
export async function duplicatePage(pageId: string): Promise<{ id?: string; error?: string }> {
  await requireAdmin();

  const source = await (await db()).page.findUnique({
    where: { id: pageId },
    include: { sections: { orderBy: { order: "asc" } } },
  });
  if (!source) return { error: "Page not found." };
  if (source.categoryId) return { error: "Collection pages are managed from Categories and can't be copied." };

  const slug = await uniqueSlug(`${source.slug}-copy`);
  try {
    const page = await (await db()).page.create({
      data: {
        shopId: await currentShopId(),
        slug,
        title: `${source.title} (copy)`,
        // A copy is never a system page, whatever it was copied from — the
        // originals are special because of their fixed routes, not their content.
        isSystem: false,
        isPublished: false,
        seoTitle: source.seoTitle,
        seoDescription: source.seoDescription,
        sections: {
          create: source.sections.map((s) => ({
            shopId: source.shopId,
            type: s.type,
            order: s.order,
            isVisible: s.isVisible,
            data: s.data as Prisma.InputJsonValue,
          })),
        },
      },
    });
    revalidatePath("/admin/customize");
    return { id: page.id };
  } catch {
    return { error: "Couldn't duplicate that page. Please try again." };
  }
}

/**
 * Saves one template of a theme copy that brings its own sections — the
 * customizer's save for a kit theme (lib/themes/kits.ts).
 *
 * Every rule is enforced here, not in the browser: the copy must be this
 * shop's (the scoped client finds nothing else), it must be on a version that
 * has a kit, and the template must pass checkTemplate — known section types
 * only, settings filled through each section's own schema so nothing
 * undeclared is stored, a singleton once, a page's main section kept. Links
 * are checked like every other section's, except a theme's own page names
 * ("route:cart"), which are always valid.
 *
 * Sections added in the editor arrive with "new:" ids and leave with real
 * ones. Only this template is written; the copy's other templates are kept.
 */
export async function saveKitTemplate(copyId: string, name: string, sections: DraftSection[], base: string): Promise<SaveResult> {
  try {
    await requireAdmin();
    const client = await db();
    const copy = await client.installedTheme.findUnique({
      where: { id: copyId },
      select: { id: true, themeKey: true, version: true, templates: true },
    });
    if (!copy) return { ok: false, error: "That theme is not in this shop." };
    const kit = kitFor(copy.themeKey, copy.version);
    if (!kit) return { ok: false, error: "This version of the theme does not have its own sections." };
    if (!isTemplateName(name)) return { ok: false, error: "No such page in this theme." };
    if (!Array.isArray(sections)) return { ok: false, error: "Nothing to save." };

    const before = ((copy.templates ?? {}) as Record<string, unknown>)[name];
    if (revisionOf(before ?? null) !== base) return { ok: false, error: STALE_SAVE, stale: true };

    const withIds = sections.map((s) => ({
      ...s,
      id: s.id.startsWith("new:") ? `s${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}` : s.id,
    }));

    // Links first, by the same rules as the platform's sections.
    for (const s of withIds) {
      const def = kit.sections[s.type];
      if (!def) continue; // checkTemplate refuses it below, with its name
      const data = { ...((s.data ?? {}) as Record<string, unknown>) };
      const clean = (value: unknown, label: string) => {
        if (isKitRoute(value)) return String(value).trim();
        const check = validateUrl(String(value ?? ""), { allowContactSchemes: true });
        if (!check.ok) throw new Error(`${def.schema.label}, ${label}: ${check.error}`);
        return check.href;
      };
      for (const f of def.schema.fields) if (f.kind === "url") data[f.key] = clean(data[f.key], f.label);
      if (def.schema.blocks && Array.isArray(data[def.schema.blocks.key])) {
        data[def.schema.blocks.key] = (data[def.schema.blocks.key] as Record<string, unknown>[]).map((b, i) => {
          const next = { ...b };
          for (const f of def.schema.blocks!.fields) {
            if (f.kind === "url") next[f.key] = clean(b[f.key], `${def.schema.blocks!.label} ${i + 1} · ${f.label}`);
          }
          return next;
        });
      }
      s.data = data;
    }

    const checked = checkTemplate(kit, name, {
      sections: withIds.map((s) => ({ id: s.id, type: s.type, visible: s.isVisible, data: s.data })),
    });
    if (!checked.ok) return { ok: false, error: checked.error };

    // One statement, and only this template. Rewriting the whole column from
    // what was read lost a save of another template that landed in between —
    // two people on Home and Product, one of them silently undone. The WHERE
    // also re-checks that this template is still what was read, so the window
    // between the check above and the write is closed too.
    const sid = await currentShopId();
    //
    // RETURNING hands back the template as the database now holds it, which
    // is what the next save will fingerprint: the database orders a JSON
    // object's keys its own way, so a fingerprint of what was *sent* never
    // matched again and every second save was refused as stale.
    const written = await prisma.$queryRaw<{ stored: unknown }[]>`
      UPDATE "InstalledTheme"
         SET templates = jsonb_set(COALESCE(templates, '{}'::jsonb), ARRAY[${name}]::text[], ${JSON.stringify(checked.template)}::jsonb, true)
       WHERE id = ${copy.id} AND "shopId" = ${sid}
         AND (templates -> ${name}) IS NOT DISTINCT FROM ${before === undefined ? null : JSON.stringify(before)}::jsonb
      RETURNING templates -> ${name} AS stored`;
    if (written.length !== 1) return { ok: false, error: STALE_SAVE, stale: true };

    // The storefront reads copies through the per-shop theme cache; without
    // this the saved page would not show for up to five minutes. Nothing else
    // is refreshed: the editor already holds what it saved, and re-rendering
    // its page would re-run every query the editor opened with.
    invalidateShop(sid, "theme");

    const saved = checked.template.sections.map((s) => ({
      id: s.id,
      type: s.type,
      data: s.data,
      isVisible: s.visible !== false,
    }));
    return { ok: true, sections: saved, revision: revisionOf(written[0].stored) };
  } catch (err) {
    return failed(err);
  }
}
