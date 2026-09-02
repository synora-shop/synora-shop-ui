// Tenant scoping: the rule that one shop can never read or write another's data.
//
// The obvious implementation is "remember to put shopId in every where clause",
// and it fails. Not immediately — it fails the first time someone writes a
// findMany in a hurry, six months from now, in a file nobody reviews closely.
// By then the leak is a customer support incident, not a code review comment.
//
// So the filter is injected instead of remembered. `forShop(shopId)` returns a
// Prisma client whose every query against a tenant-owned model carries that
// shop, and whose every create stamps it. Application code cannot opt out, and
// there is nothing to forget.
//
// What this deliberately does NOT do: hide the raw client. Migrations, the
// signup flow that creates a Shop, and cross-tenant admin tooling all need
// unscoped access, and pretending otherwise would just push people to work
// around it. `prisma` stays exported from lib/prisma.ts; this is what you reach
// for everywhere else.

import { prisma } from "@/lib/prisma";

/**
 * Models that belong to exactly one shop.
 *
 * Written out rather than derived, because Prisma 7 no longer exposes the
 * datamodel to application code. A hand-kept list is exactly the kind of thing
 * that drifts, so `npm run check:tenancy` reads the schema and fails if this
 * disagrees with it. Add a model with a shopId and forget this list, and the
 * build tells you — which is the same guarantee, arrived at differently.
 */
/**
 * Models that exist once per *business type* within a shop.
 *
 * A merchant may run an online store, switch to a blog, and switch back — and
 * find the store exactly as they left it. That only works if the rows that
 * describe a storefront are partitioned by which kind of business they belong
 * to, rather than overwritten when the type changes.
 *
 * Partitioned the same way and in the same place as shop scoping, so adding a
 * model to this set is the whole of the work: every read is filtered and every
 * write stamped, with no query in the app having to remember.
 *
 * Only what *describes the storefront* belongs here. Products and articles do
 * not: they coexist harmlessly, and a shop that switches to a blog and back
 * should still have its products.
 */
export const PROFILE_MODELS: ReadonlySet<string> = new Set(["Page", "ThemeSettings", "Menu", "MenuItem"]);

export const TENANT_MODELS: ReadonlySet<string> = new Set([
  "Customer",
  "AuditLog",
  "Address",
  "Category",
  "Product",
  "ProductVariant",
  "Order",
  "OrderItem",
  "PushSubscription",
  "StoreSettings",
  "Redirect",
  "FontAsset",
  "StickyButton",
  "ThemeSettings",
  "SiteText",
  "Page",
  "Section",
  "Article",
  "OpeningHours",
  "Location",
  "Metafield",
  "Menu",
  "MenuItem",
  "Enquiry",
  "Membership",
  "StaffInvite",
  "Domain",
  "Discount",
  "DiscountRedemption",
]);

/**
 * Models that exist above any single shop, and are never scoped.
 *
 * Membership is the interesting one: it has a shopId, so it is in the tenant
 * set above and gets filtered — a shop's staff list is that shop's business.
 * User and Shop are not, because signing in and creating a store both happen
 * before any shop context exists.
 */
export const PLATFORM_MODELS: ReadonlySet<string> = new Set([
  "Shop",
  "User",
  "AdminOtp",
  // A verification link belongs to a person, not a shop — it is how they prove
  // an address before any shop is in play.
  "VerificationToken",
  // Rate limits are keyed by their own string, which encodes whatever scope
  // the caller needs, so the table itself is not per-shop.
  "RateLimit",
]);

/** Operations that read or mutate rows and therefore need the filter. */
const FILTERED = new Set([
  "findFirst", "findFirstOrThrow", "findMany", "findUnique", "findUniqueOrThrow",
  "updateMany", "deleteMany", "count", "aggregate", "groupBy",
]);

/** Operations that create rows and therefore need the stamp. */
const CREATING = new Set(["create", "createMany", "createManyAndReturn", "upsert"]);

/**
 * Operations addressing a single row by its unique key.
 *
 * These need care: `update({ where: { id } })` cannot simply have shopId added,
 * because Prisma rejects a non-unique field in a unique where. They are handled
 * by checking the row belongs to the shop first — see below.
 */
const BY_UNIQUE = new Set(["update", "delete", "upsert"]);

/**
 * Reads addressing a single row by its unique key.
 *
 * Same constraint as BY_UNIQUE, different remedy: these are reads, so the shop
 * can be added to the query itself instead of costing a second round trip.
 */
const BY_UNIQUE_READ = new Set(["findUnique", "findUniqueOrThrow"]);

/**
 * The `where` a filtered read should actually run with.
 *
 * Two shapes, because Prisma accepts two. An ordinary read takes a WhereInput
 * and the whole caller filter can be ANDed with the shop. `findUnique` takes a
 * WhereUniqueInput, which must carry a unique field at its *top level* — wrap
 * that in an AND and the id moves down a level, nothing unique is left above
 * it, and Prisma rejects the call before it reaches the database. Every admin
 * detail page threw instead of loading, because every one of them looks its row
 * up by id.
 *
 * So for those the shop goes *beside* the unique field rather than around it.
 * Non-unique filters are allowed there, which is what makes this legal.
 *
 * Either way it is an AND rather than a spread of `{ shopId }`: a caller's own
 * where may already mention shopId, and silently overwriting it would hide a
 * bug instead of surfacing it as an impossible query.
 *
 * Exported for scripts/check-tenant-scope.ts — this is pure, so the shapes can
 * be asserted without a database.
 */
export function scopedWhere(
  operation: string,
  where: Record<string, unknown> | undefined,
  shopId: string,
  /** Extra equality filters, for a model partitioned beyond the shop. */
  extra: Record<string, unknown> = {}
): Record<string, unknown> {
  const scope = { shopId, ...extra };
  if (BY_UNIQUE_READ.has(operation)) {
    const prior = where?.AND;
    const existing = prior === undefined ? [] : Array.isArray(prior) ? prior : [prior];
    return { ...(where ?? {}), AND: [...existing, scope] };
  }
  return where ? { AND: [where, scope] } : scope;
}

export class CrossTenantError extends Error {
  constructor(model: string, operation: string) {
    super(
      `Refused ${operation} on ${model}: the row belongs to a different shop. ` +
        `This is a bug, a tenant-scoped client should never be given another shop's id.`
    );
    this.name = "CrossTenantError";
  }
}

/**
 * A Prisma client locked to one shop.
 *
 * Reads are filtered, writes are stamped, and single-row writes are checked
 * before they run. Anything on a platform-level model (User, Shop, Membership)
 * passes through untouched.
 */
export function forShop(shopId: string, businessType?: string) {
  if (!shopId) throw new Error("forShop() requires a shopId.");

  // Omitted on purpose in places that predate business types, and in scripts.
  // Without it a partitioned model behaves exactly as it did before, which is
  // what keeps this change invisible to everything that has not opted in.
  const partition = businessType ? { businessType } : {};

  return prisma.$extends({
    name: "tenant-scope",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!model || !TENANT_MODELS.has(model)) return query(args);

          const a = (args ?? {}) as Record<string, unknown>;

          if (FILTERED.has(operation)) {
            const where = a.where as Record<string, unknown> | undefined;
            const extra = PROFILE_MODELS.has(model) ? partition : {};
            return query({ ...a, where: scopedWhere(operation, where, shopId, extra) });
          }

          if (BY_UNIQUE.has(operation)) {
            // Prisma will not accept shopId inside a unique where, so
            // ownership is verified with a separate read first. One extra
            // query per single-row write is a price worth paying to make
            // cross-tenant writes impossible rather than unlikely.
            const where = a.where as Record<string, unknown> | undefined;
            if (where) {
              const delegate = (prisma as unknown as Record<string, {
                findFirst: (x: unknown) => Promise<{ shopId: string } | null>;
              }>)[lowerFirst(model)];
              const existing = await delegate.findFirst({
                where: flattenUniqueWhere(where),
                select: { shopId: true },
              });
              if (existing && existing.shopId !== shopId) {
                throw new CrossTenantError(model, operation);
              }
            }
          }

          if (CREATING.has(operation)) {
            return query(
              stampCreate(a, {
                shopId,
                ...(PROFILE_MODELS.has(model) ? partition : {}),
              })
            );
          }

          return query(a);
        },
      },
    },
  });
}

/**
 * A unique `where` in the shape `findFirst` accepts.
 *
 * Prisma addresses a compound unique key as one nested object —
 * `{ shopId_day: { shopId, day } }` — and that is a valid `WhereUniqueInput`
 * and an invalid `WhereInput`. The ownership pre-read below hands the caller's
 * where straight to `findFirst`, so every write keyed that way threw
 * "Unknown argument" before it ever reached the database.
 *
 * It broke saving site text long before it broke opening hours; the compound
 * key is simply rarer than `{ id }`, so it went unnoticed until three features
 * in one week happened to use one.
 *
 * A compound entry is recognised by its own shape rather than by guessing at
 * the name: every key inside it must be one of the parts the outer name is
 * built from. `{ shopId_day: { shopId, day } }` qualifies; a relation filter
 * that happens to contain an underscore does not.
 */
export function flattenUniqueWhere(
  where: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(where)) {
    const parts = key.split("_");
    const isCompound =
      parts.length > 1 &&
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.keys(value as object).length > 0 &&
      Object.keys(value as object).every((field) => parts.includes(field));

    if (isCompound) Object.assign(out, value);
    else out[key] = value;
  }
  return out;
}

/** The Prisma delegate name for a model: "ProductVariant" -> "productVariant". */
function lowerFirst(model: string): string {
  return model.charAt(0).toLowerCase() + model.slice(1);
}

/**
 * Adds shopId to whatever this operation is about to insert.
 *
 * Handles the three shapes Prisma accepts — a single `data` object, an array of
 * them for createMany, and upsert's separate `create`.
 */
function stampCreate(
  args: Record<string, unknown>,
  scope: Record<string, unknown>
): Record<string, unknown> {
  const out = { ...args };

  // shopId goes LAST so it wins.
  //
  // Spreading it first would let a caller's own shopId override it, which turns
  // this from a guarantee into a default — and a create is exactly where a
  // wrong or attacker-supplied shopId would plant a row in someone else's shop.
  // Callers may pass shopId (the types ask for it); it is simply ignored.
  const stamp = (d: unknown): unknown => {
    if (Array.isArray(d)) return d.map((row) => ({ ...(row as object), ...scope }));
    if (d && typeof d === "object") return { ...(d as object), ...scope };
    return d;
  };

  if ("data" in out) out.data = stamp(out.data);
  if ("create" in out) out.create = stamp(out.create);

  return out;
}

export type TenantClient = ReturnType<typeof forShop>;
