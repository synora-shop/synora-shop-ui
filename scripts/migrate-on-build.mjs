/**
 * Decide whether `npm run build` should run `prisma migrate deploy`.
 *
 * Production Vercel builds migrate. Preview/development builds must not —
 * they historically shared production DATABASE_URL and applied branch
 * migrations to the live database before the matching code shipped.
 *
 * Escape hatch: ALLOW_MIGRATE_ON_BUILD=1 for intentional local/CI deploy.
 */

/**
 * @param {NodeJS.ProcessEnv | Record<string, string | undefined>} env
 * @returns {{ migrate: boolean, reason: string }}
 */
export function shouldMigrateOnBuild(env) {
  if (env.ALLOW_MIGRATE_ON_BUILD === "1") {
    return { migrate: true, reason: "ALLOW_MIGRATE_ON_BUILD=1" };
  }
  if (env.VERCEL_ENV === "production") {
    return { migrate: true, reason: "VERCEL_ENV=production" };
  }
  if (env.VERCEL_ENV === "preview") {
    return { migrate: false, reason: "VERCEL_ENV=preview (skip — do not migrate shared/prod DB)" };
  }
  if (env.VERCEL_ENV === "development") {
    return { migrate: false, reason: "VERCEL_ENV=development (skip)" };
  }
  if (env.VERCEL_ENV) {
    return {
      migrate: false,
      reason: `VERCEL_ENV=${env.VERCEL_ENV} (skip — only production migrates on build)`,
    };
  }
  return {
    migrate: false,
    reason: "VERCEL_ENV unset (skip — use ALLOW_MIGRATE_ON_BUILD=1 or npm run db:migrate:deploy)",
  };
}
