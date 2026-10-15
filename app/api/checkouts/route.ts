import { NextResponse } from "next/server";
import { db, requireShop } from "@/lib/data/shop";
import { isDemoShop } from "@/lib/theme-store";
import { clientIp, rateLimit } from "@/lib/rate-limit";

/**
 * A checkout saving itself as the customer fills it in (new admin, 15 October).
 *
 * The storefront's checkouts (the classic form, Loom's and Kite's) post here a
 * moment after the customer stops typing, once there is a way to reach them
 * and something in the cart. Each browser checkout carries its own token, so
 * every save updates one row. When an order is placed, /api/orders marks the
 * row recovered; a row that is never recovered is an abandoned checkout, on
 * Orders > Abandoned checkouts, where the merchant can remind them.
 *
 * Nothing here can do harm if abused: it writes one row per token for the
 * shop the request came to, sizes are capped, and it is rate limited. It
 * answers 204 whatever happens, because a checkout must never fail, or even
 * slow down, because this did.
 */
const STEPS = new Set(["contact", "address", "delivery", "payment"]);
const MAX_LINES = 50;

type Line = { title: string; qty: number; price: number; productId?: string; variantId?: string };

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

function readLines(raw: unknown): Line[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, MAX_LINES).flatMap((l) => {
    if (!l || typeof l !== "object") return [];
    const r = l as Record<string, unknown>;
    const qty = Number(r.qty);
    const price = Number(r.price);
    const title = text(r.title, 200);
    if (!title || !Number.isFinite(qty) || qty <= 0 || !Number.isFinite(price) || price < 0) return [];
    return [{
      title,
      qty: Math.min(Math.round(qty), 9999),
      price: Math.round(price),
      productId: text(r.productId, 64) || undefined,
      variantId: text(r.variantId, 64) || undefined,
    }];
  });
}

export async function POST(request: Request) {
  const done = new NextResponse(null, { status: 204 });
  try {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return done;

    const token = text(body.token, 64);
    const email = text(body.email, 200).toLowerCase();
    const phone = text(body.phone, 30);
    const lines = readLines(body.lines);
    // Nobody to remind, or nothing to remind them of: not worth a row.
    if (!/^[\w-]{8,64}$/.test(token) || lines.length === 0) return done;
    if (!/^\S+@\S+\.\S+$/.test(email) && phone.replace(/\D/g, "").length < 10) return done;

    const shop = await requireShop();
    if (isDemoShop(shop.subdomain)) return done;

    const limited = await rateLimit("checkoutDraft", `${shop.id}:${await clientIp()}`);
    if (!limited.ok) return done;

    const step = STEPS.has(String(body.step)) ? String(body.step) : "contact";
    const data = {
      email,
      phone,
      name: text(body.name, 120),
      city: text(body.city, 80),
      lines,
      subtotal: lines.reduce((n, l) => n + l.price * l.qty, 0),
      step,
    };
    const scoped = await db();
    const existing = await scoped.checkoutDraft.findFirst({ where: { token }, select: { id: true, recoveredOrderId: true } });
    if (existing?.recoveredOrderId) return done; // already became an order
    if (existing) await scoped.checkoutDraft.update({ where: { id: existing.id }, data });
    else await scoped.checkoutDraft.create({ data: { ...data, token, shopId: shop.id } });
  } catch (error) {
    console.error("[checkouts] saving a started checkout failed", error);
  }
  return done;
}
