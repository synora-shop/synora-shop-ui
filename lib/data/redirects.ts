import { prisma } from "@/lib/prisma";
import { db } from "@/lib/data/shop";

/**
 * Looks up a redirect for a path that is about to 404.
 *
 * Called from the dynamic routes rather than from proxy.ts on purpose: the
 * proxy runs on every single request and would need a database round trip to
 * do this, whereas a 404 is rare and already doing server work. The cost lands
 * only on the requests that would otherwise have been a dead end.
 */
export async function findRedirect(pathname: string): Promise<string | null> {
  const redirect = await (await db()).redirect.findFirst({ where: { fromPath: pathname } });
  if (!redirect || !redirect.isActive) return null;

  // Best-effort counter — a failure here must never turn a working redirect
  // into a 404, so it is deliberately not awaited into the critical path.
  prisma.redirect
    .update({ where: { id: redirect.id }, data: { hits: { increment: 1 } } })
    .catch(() => {});

  return redirect.toPath;
}
