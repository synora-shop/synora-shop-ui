#!/usr/bin/env node
/**
 * Gives Synora master admins an account and a password (14 October).
 *
 *   MASTER_PASSWORD='…' node scripts/set-master-admins.mjs a@x.com,b@y.com          # shows what it would do
 *   MASTER_PASSWORD='…' node scripts/set-master-admins.mjs a@x.com,b@y.com --apply  # does it
 *   … --local                                                                      # this machine's database instead
 *
 * Writes to the LIVE database (LIVE_DATABASE_URL in .env.live), so it is run by
 * the owner, by hand. For each address: no account yet → one is created,
 * already confirmed; an account already there → its password is replaced, it
 * is marked confirmed, and every other session it has is signed out.
 *
 * Being a master admin is the separate SYNORA_TEAM_EMAILS setting in Vercel;
 * this only makes sure each address can sign in. Such an account opens the
 * Synora console (/synora) from the normal sign-in page, never a shop's panel,
 * so the dry run warns about any address that already runs a shop.
 *
 * The password is stored only as a bcrypt hash, like every other password.
 */
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pg = require("pg");
const bcrypt = require("bcryptjs");

const emails = (process.argv[2] ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
const apply = process.argv.includes("--apply");
const password = process.env.MASTER_PASSWORD ?? "";

if (emails.length === 0 || emails.some((e) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e))) {
  console.error("Give the addresses as the first argument, separated by commas.");
  process.exit(1);
}
if (password.length < 10) {
  console.error("Set MASTER_PASSWORD (at least 10 characters).");
  process.exit(1);
}

// --local tries it on this machine's database (.env.local) instead.
const local = process.argv.includes("--local");
const [file, key] = local ? ["../.env.local", "DATABASE_URL="] : ["../.env.live", "LIVE_DATABASE_URL="];
const line = readFileSync(new URL(file, import.meta.url), "utf8").split("\n").find((l) => l.startsWith(key));
const url = line?.slice(key.length).replace(/^"|"$/g, "");
if (!url) {
  console.error(`${key.slice(0, -1)} is missing from ${file.slice(3)}.`);
  process.exit(1);
}

const db = new pg.Client({ connectionString: url });
await db.connect();
const hash = await bcrypt.hash(password, 12);

const where = local ? "the LOCAL database" : "the LIVE database";
console.log(apply ? `Applying to ${where}:\n` : `Dry run on ${where} (nothing written). Add --apply to do it:\n`);
try {
  if (apply) await db.query("BEGIN");
  for (const email of emails) {
    const found = (await db.query(`SELECT id FROM "User" WHERE lower(email) = $1`, [email])).rows[0];
    const shops = found
      ? (await db.query(`SELECT s.subdomain, m.role FROM "Membership" m JOIN "Shop" s ON s.id = m."shopId" WHERE m."userId" = $1`, [found.id])).rows
      : [];
    const warn = shops.length ? `  ! runs ${shops.map((s) => `${s.subdomain} (${s.role})`).join(", ")}: signing in will open the console, not this shop` : "";

    if (!found) {
      console.log(`  ${email}: create a new account`);
      if (apply) {
        await db.query(
          `INSERT INTO "User" (id, name, email, "passwordHash", "emailVerifiedAt", "sessionsValidFrom", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, now(), now(), now(), now())`,
          [`c${randomUUID().replaceAll("-", "")}`, email.split("@")[0], email, hash]
        );
      }
    } else {
      console.log(`  ${email}: account exists, replace its password and sign out its other sessions`);
      if (apply) {
        await db.query(
          `UPDATE "User" SET "passwordHash" = $2, "emailVerifiedAt" = COALESCE("emailVerifiedAt", now()), "sessionsValidFrom" = now(), "updatedAt" = now() WHERE id = $1`,
          [found.id, hash]
        );
      }
    }
    if (warn) console.log(warn);
  }
  if (apply) await db.query("COMMIT");
  console.log(apply ? "\nDone." : "\nNothing was changed.");
} catch (err) {
  if (apply) await db.query("ROLLBACK");
  console.error("Stopped, nothing was changed:", err.message);
  process.exitCode = 1;
} finally {
  await db.end();
}
