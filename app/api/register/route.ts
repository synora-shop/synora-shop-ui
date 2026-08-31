import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { currentShopId } from "@/lib/data/shop";
import { isValidEmail } from "@/lib/validation";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  // Public, unauthenticated, and it writes a row. Without a limit this is an
  // open invitation to fill a merchant's customer list.
  const limited = await rateLimit("customerRegister", await clientIp());
  if (!limited.ok) {
    return NextResponse.json({ error: limited.message }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!name || !email || password.length < 8) {
    return NextResponse.json(
      { error: "Name, email and a password of at least 8 characters are required." },
      { status: 400 }
    );
  }
  // Checked properly rather than by the presence of an "@": a malformed
  // address becomes an account nobody can recover and mail that never arrives.
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "That email address doesn't look right." }, { status: 400 });
  }

  // A shopper account, not a platform account. The same email may hold one at
  // every shop on the platform, and no merchant learns about the others — which is
  // exactly what the User/Customer split exists for.
  const shopId = await currentShopId();

  const existing = await prisma.customer.findUnique({
    where: { shopId_email: { shopId, email } },
  });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  await prisma.customer.create({
    // Cost 12, matching every other password this platform stores.
    data: { shopId, name, email, passwordHash: await bcrypt.hash(password, 12) },
  });

  return NextResponse.json({ ok: true });
}
