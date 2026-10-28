import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema/identity";
import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "@/lib/auth/cookie";
import { loginWithPassword } from "@/lib/auth/login";
import { createSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_AUTH_MODE !== "server") {
    return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });
  }

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!origin || !host) {
    return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
  }

  try {
    const originHost = new URL(origin).host;
    if (originHost !== host) {
      return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 401 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 401 });
  }

  const { identifier, password } = body as Record<string, unknown>;

  if (
    typeof identifier !== "string" ||
    typeof password !== "string" ||
    identifier.length > 255 ||
    password.length > 200 ||
    identifier.trim() === "" ||
    password === ""
  ) {
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 401 });
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";

  const loginResult = await loginWithPassword(identifier, password, ip);

  if (!loginResult.ok) {
    if (loginResult.reason === "locked") {
      return NextResponse.json({ ok: false, reason: "locked" }, { status: 429 });
    }
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 401 });
  }

  const userRows = await db
    .select({
      role: users.role,
      name: users.name,
    })
    .from(users)
    .where(eq(users.id, loginResult.userId!))
    .limit(1);

  if (userRows.length === 0) {
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 401 });
  }

  const user = userRows[0];
  const userAgent = request.headers.get("user-agent");
  const rawToken = await createSession(loginResult.userId!, ip, userAgent);

  const response = NextResponse.json({
    ok: true,
    role: user.role,
    name: user.name,
  });

  response.cookies.set(SESSION_COOKIE, rawToken, SESSION_COOKIE_OPTIONS);

  return response;
}
