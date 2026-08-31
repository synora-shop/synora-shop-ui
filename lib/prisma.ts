import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Reuse a single PrismaClient across hot reloads in dev (avoids exhausting DB connections).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * How many Postgres connections one instance of this app may hold.
 *
 * This has to be set here, not in the connection string. Prisma 7 talks to the
 * database through a driver adapter, and node-postgres owns the pool — so
 * `?connection_limit=` in DATABASE_URL is parsed by nobody and silently does
 * nothing. Left at node-postgres's default of 10, a single page firing six
 * queries in parallel opens six sockets, which is unremarkable against a
 * managed Postgres and fatal against a small local one.
 *
 * It matters more in production than in development. Every serverless instance
 * keeps its own pool, so the real ceiling is (instances x max), and Postgres
 * refuses connections long before the app stops scaling out. A small number per
 * instance, with a pooler in front, is what makes that arithmetic work.
 */
const POOL_MAX = Number(process.env.DATABASE_POOL_MAX ?? 5);

/**
 * Says explicitly what `sslmode=require` already means here.
 *
 * node-postgres currently treats `require` as `verify-full` — full certificate
 * and hostname verification — but warns on every cold start that a future major
 * version will switch it to libpq's weaker semantics, where `require` encrypts
 * without verifying anyone. The managed connection string is handed to us by the
 * Neon integration and is not ours to edit, so the mode is pinned here instead.
 *
 * `verify-full` rather than the compatibility flag on purpose: it is the current
 * behaviour, it is the stronger of the two, and Neon presents a valid
 * certificate, so nothing is given up by naming it.
 */
function connectionString(): string | undefined {
  const raw = process.env.DATABASE_URL;
  if (!raw) return raw;
  try {
    const url = new URL(raw);
    const mode = url.searchParams.get("sslmode");
    if (mode && mode !== "disable" && mode !== "verify-full") {
      url.searchParams.set("sslmode", "verify-full");
      return url.toString();
    }
    return raw;
  } catch {
    // Not a parseable URL — hand it over untouched and let the driver complain
    // about it, rather than swallowing a malformed value here.
    return raw;
  }
}

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: connectionString(),
    max: Number.isFinite(POOL_MAX) && POOL_MAX > 0 ? POOL_MAX : 5,
    // Hand sockets back quickly: an idle instance shouldn't hold a connection
    // that the next request could have used.
    idleTimeoutMillis: 10_000,
    // Fail fast instead of node-postgres's default of waiting forever — a 500
    // that says the database is unreachable beats a page that hangs.
    connectionTimeoutMillis: 10_000,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
