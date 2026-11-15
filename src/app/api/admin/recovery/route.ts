import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { issueRecovery } from "@/lib/auth/credentials";
import { getCurrentUser } from "@/lib/auth/guard";
import { readJsonBounded, sameOrigin } from "@/lib/auth/requestSafety";

export async function POST(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_AUTH_MODE !== "server") return NextResponse.json({ ok: false }, { status: 404 });
  if (!sameOrigin(request)) return NextResponse.json({ ok: false }, { status: 403 });
  try {
    const admin = await getCurrentUser();
    if (!admin) return NextResponse.json({ ok: false }, { status: 401 });
    if (admin.role !== "academy-admin") return NextResponse.json({ ok: false }, { status: 403 });
    const body = await readJsonBounded(request).catch(() => null) as Record<string, unknown> | null;
    if (body?.purpose !== "activation" && body?.purpose !== "recovery") return NextResponse.json({ ok: false }, { status: 400 });
    if (typeof body?.userId !== "string" || !/^[0-9a-f-]{36}$/i.test(body.userId)) return NextResponse.json({ ok: false }, { status: 400 });
    const token = await issueRecovery(db, admin.id, body.adminPassword, body.userId, request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown", body.purpose);
    return NextResponse.json(token ? { ok: true, token } : { ok: false }, { status: token ? 200 : 400,
      headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } });
  } catch {
    return NextResponse.json({ ok: false, reason: "unavailable" }, { status: 503 });
  }
}
