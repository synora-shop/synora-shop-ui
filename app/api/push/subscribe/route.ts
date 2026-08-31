import { NextResponse } from "next/server";
import { shopSession } from "@/lib/auth-guard";
import { db, currentShopId } from "@/lib/data/shop";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type SubscriptionPayload = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

function isValidPayload(body: unknown): body is SubscriptionPayload {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  const keys = b.keys as Record<string, unknown> | undefined;
  return (
    typeof b.endpoint === "string" &&
    !!keys &&
    typeof keys.p256dh === "string" &&
    typeof keys.auth === "string"
  );
}

export async function POST(request: Request) {
  const me = await shopSession();
  if (!me) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!isValidPayload(body)) {
    return NextResponse.json({ error: "Invalid subscription payload" }, { status: 400 });
  }

  await (await db()).pushSubscription.upsert({
    where: { endpoint: body.endpoint },
    update: { p256dh: body.keys.p256dh, auth: body.keys.auth, userId: me.userId },
    create: {
      shopId: await currentShopId(),
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
      userId: me.userId,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const me = await shopSession();
  if (!me) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const endpoint = (body as { endpoint?: string } | null)?.endpoint;
  if (typeof endpoint !== "string") {
    return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
  }

  await (await db()).pushSubscription.deleteMany({ where: { endpoint, userId: me.userId } });
  return NextResponse.json({ ok: true });
}
