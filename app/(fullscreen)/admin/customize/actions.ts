"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { db, currentShopId } from "@/lib/data/shop";
import { prisma } from "@/lib/prisma";
import { getSectionSchema } from "@/lib/section-schema";
import { validateUrl } from "@/lib/url-validation";
import { getPageTemplate } from "@/lib/page-templates";
import type { Prisma, SectionType } from "@/lib/generated/prisma/client";

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

export async function saveSections(pageId: string, sections: DraftSection[]) {
  await requireAdmin();
  await requirePage(pageId);

  const existing = await (await db()).section.findMany({ where: { pageId }, select: { id: true } });
  const existingIds = new Set(existing.map((s) => s.id));
  const keptIds = new Set(sections.filter((s) => !s.id.startsWith("new:")).map((s) => s.id));
  const removed = [...existingIds].filter((id) => !keptIds.has(id));

  const sid = await currentShopId();
  await prisma.$transaction(async (tx) => {
    if (removed.length > 0) {
      // The ids came from a scoped read, so this was already correct — but a
      // deleteMany inside a raw transaction is exactly the shape that has
      // destroyed data here before, and the shop is right there. Safe by
      // filter beats safe by argument.
      await tx.section.deleteMany({ where: { id: { in: removed }, shopId: sid } });
    }
    for (const [index, section] of sections.entries()) {
      if (!getSectionSchema(section.type)) continue; // unknown type — ignore rather than persist junk
      const payload = {
        type: section.type as SectionType,
        order: index,
        isVisible: section.isVisible,
        data: sanitiseSectionLinks(section.type, section.data) as Prisma.InputJsonValue,
      };
      if (section.id.startsWith("new:")) {
        await tx.section.create({ data: { shopId: sid, pageId, ...payload } });
      } else if (existingIds.has(section.id)) {
        await tx.section.updateMany({ where: { id: section.id, shopId: sid }, data: payload });
      }
    }
  });

  revalidatePath("/admin/customize");
  revalidatePath("/", "layout");

  const saved = await (await db()).section.findMany({
    where: { pageId },
    orderBy: { order: "asc" },
    select: { id: true, type: true, data: true, isVisible: true },
  });
  return saved;
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
  await requirePage(pageId);

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
