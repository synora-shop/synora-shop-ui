// Applies pending migrations, retrying only when the advisory lock is busy.
//
// `prisma migrate deploy` takes a Postgres advisory lock so two deploys cannot
// apply migrations at once. On this project that lock times out often enough to
// be a real problem: two deploys starting close together will do it (pushing
// twice, or changing an environment variable, which triggers its own build),
// and so will a lock still held by a connection from a build that has already
// finished — Neon keeps sessions alive briefly after the process exits, and the
// lock is session-scoped. It has failed four separate production deploys.
//
// Waiting is the correct response to a busy lock: nothing has been applied, and
// whoever holds it is either finishing or about to be dropped. Every other
// failure — a bad migration, an unreachable database, a checksum mismatch — is
// still fatal on the first attempt, because retrying those just delays the same
// error behind a misleading pause.

import { spawnSync } from "node:child_process";

/** Prisma's code for "reached the database, but timed out". */
const LOCK_TIMEOUT = "P1002";
const ATTEMPTS = 4;
const BACKOFF_MS = [0, 10_000, 20_000, 30_000];

function attempt() {
  const run = spawnSync("npx", ["prisma", "migrate", "deploy"], {
    encoding: "utf8",
    // Inherit stderr so Prisma's own output is in the build log either way,
    // but capture stdout so the failure can be classified.
    stdio: ["ignore", "pipe", "pipe"],
  });
  const output = `${run.stdout ?? ""}${run.stderr ?? ""}`;
  process.stdout.write(output);
  return { ok: run.status === 0, output };
}

for (let i = 0; i < ATTEMPTS; i++) {
  if (BACKOFF_MS[i] > 0) {
    console.log(`[migrate] lock was busy — retrying in ${BACKOFF_MS[i] / 1000}s`);
    await new Promise((r) => setTimeout(r, BACKOFF_MS[i]));
  }

  const { ok, output } = attempt();
  if (ok) process.exit(0);

  if (!output.includes(LOCK_TIMEOUT)) {
    console.error("[migrate] failed for a reason that will not fix itself — not retrying");
    process.exit(1);
  }
}

console.error(`[migrate] the advisory lock stayed busy across ${ATTEMPTS} attempts`);
process.exit(1);
