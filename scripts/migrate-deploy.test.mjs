import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { shouldMigrateOnBuild } from "./migrate-on-build.mjs";

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("shouldMigrateOnBuild", () => {
  it("migrates when VERCEL_ENV is production", () => {
    const d = shouldMigrateOnBuild({ VERCEL_ENV: "production" });
    assert.equal(d.migrate, true);
    assert.match(d.reason, /production/);
  });

  it("skips when VERCEL_ENV is preview", () => {
    const d = shouldMigrateOnBuild({ VERCEL_ENV: "preview" });
    assert.equal(d.migrate, false);
    assert.match(d.reason, /preview/);
  });

  it("skips when VERCEL_ENV is development", () => {
    const d = shouldMigrateOnBuild({ VERCEL_ENV: "development" });
    assert.equal(d.migrate, false);
  });

  it("migrates when ALLOW_MIGRATE_ON_BUILD=1 even if VERCEL_ENV unset", () => {
    const d = shouldMigrateOnBuild({ ALLOW_MIGRATE_ON_BUILD: "1" });
    assert.equal(d.migrate, true);
  });

  it("ALLOW_MIGRATE_ON_BUILD wins over preview", () => {
    const d = shouldMigrateOnBuild({
      VERCEL_ENV: "preview",
      ALLOW_MIGRATE_ON_BUILD: "1",
    });
    assert.equal(d.migrate, true);
  });

  it("skips when VERCEL_ENV unset and no escape hatch", () => {
    const d = shouldMigrateOnBuild({});
    assert.equal(d.migrate, false);
  });
});

describe("migrate ownership in package.json", () => {
  it("UI build still invokes migrate-deploy.mjs", () => {
    const pkg = JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8"));
    assert.match(pkg.scripts.build, /migrate-deploy\.mjs/);
  });
});
