import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "@/lib/auth/cookie";
import { changePassword } from "@/lib/auth/credentials";
import { getSessionUser } from "@/lib/auth/session";
import { readJsonBounded, sameOrigin } from "@/lib/auth/requestSafety";

export async function POST(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_AUTH_MODE !== "server") return NextResponse.json({ ok: false }, { status: 404 });
  if (!sameOrigin(request)) return NextResponse.json({ ok: false }, { status: 403 });
  try {
    const user = await getSessionUser(request.cookies.get(SESSION_COOKIE)?.value ?? "");
    if (!user) return NextResponse.json({ ok: false }, { status: 401 });
    const body = await readJsonBounded(request).catch(() => null) as Record<string, unknown> | null;
    const ok = await changePassword(db, user.id, body?.currentPassword, body?.newPassword, request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown");
    const response = NextResponse.json({ ok }, { status: ok ? 200 : 400, headers: { "Cache-Control": "private, no-store" } });
    if (ok) response.cookies.set(SESSION_COOKIE, "", { ...SESSION_COOKIE_OPTIONS, maxAge: 0 });
    return response;
  } catch {
    return NextResponse.json({ ok: false, reason: "unavailable" }, { status: 503 });
  }
}
