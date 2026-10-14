import { prisma } from "@/lib/prisma";
import { dateLabel, readChanges, type Note } from "@/lib/release-notes";

/**
 * Reading the release notes (server only). Kept apart from lib/release-notes.ts
 * because the console's editor runs in the browser and imports those shapes;
 * a database client in the same file breaks the browser bundle.
 */
export async function listReleaseNotes(): Promise<Note[]> {
  const rows = await prisma.releaseNote.findMany({ orderBy: [{ publishedOn: "desc" }, { createdAt: "desc" }] });
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    date: r.publishedOn.toISOString().slice(0, 10),
    dateLabel: dateLabel(r.publishedOn),
    changes: readChanges(r.changes),
  }));
}
