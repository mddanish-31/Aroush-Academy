import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { getCurrentUser } from "@/lib/auth/guard";
import { readJsonBounded, sameOrigin } from "@/lib/auth/requestSafety";
import { provisionTeacher } from "@/lib/auth/provisionTeacher";

export async function POST(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_AUTH_MODE !== "server") return NextResponse.json({ ok: false }, { status: 404 });
  if (!sameOrigin(request)) return NextResponse.json({ ok: false }, { status: 403 });
  try {
    const admin = await getCurrentUser();
    if (!admin) return NextResponse.json({ ok: false }, { status: 401 });
    if (admin.role !== "academy-admin") return NextResponse.json({ ok: false }, { status: 403 });
    const body = await readJsonBounded(request).catch(() => null) as Record<string, unknown> | null;
    const result = await provisionTeacher(db, admin.id, body?.name, body?.email, body?.phone);
    return NextResponse.json(result ? { ok: true, ...result } : { ok: false, reason: "invalid_or_conflict" },
      { status: result ? 201 : 400, headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } });
  } catch (error) {
    const cause = error as { code?: string; cause?: { code?: string } };
    return NextResponse.json({ ok: false, reason: "invalid_or_conflict" }, { status: cause.code === "23505" || cause.cause?.code === "23505" ? 400 : 503 });
  }
}
