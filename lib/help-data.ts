import { prisma } from "@/lib/prisma";
import type { ThreadEntry } from "@/components/help/thread";

/**
 * One request with its conversation, the opening message first (14 October).
 * `userId` limits it to the sender's own; the console passes none.
 */
export async function loadHelpThread(number: number, userId?: string) {
  if (!Number.isInteger(number) || number < 1) return null;
  const r = await prisma.helpRequest.findFirst({
    where: { number, ...(userId ? { userId } : {}) },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      shop: { select: { id: true, name: true, subdomain: true, status: true, createdAt: true } },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          createdAt: true,
          emailVerifiedAt: true,
          memberships: { where: { acceptedAt: { not: null } }, select: { role: true, shop: { select: { name: true, subdomain: true, status: true } } } },
          _count: { select: { helpRequests: true } },
        },
      },
    },
  });
  if (!r) return null;
  const entries: ThreadEntry[] = [
    { id: `${r.id}-opening`, fromTeam: false, authorName: r.user.name, body: r.body, viaEmail: false, statusTo: null, createdAt: r.createdAt.toISOString() },
    ...r.messages.map((m) => ({
      id: m.id,
      fromTeam: m.fromTeam,
      authorName: m.authorName,
      body: m.body,
      viaEmail: m.viaEmail,
      statusTo: m.statusTo,
      createdAt: m.createdAt.toISOString(),
    })),
  ];
  return { request: r, entries };
}
