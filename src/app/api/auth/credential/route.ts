import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { redeemCredential } from "@/lib/auth/credentials";
import { readJsonBounded, sameOrigin } from "@/lib/auth/requestSafety";

export async function POST(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_AUTH_MODE !== "server") return NextResponse.json({ ok: false }, { status: 404 });
  if (!sameOrigin(request)) return NextResponse.json({ ok: false }, { status: 403 });
  try {
    const body = await readJsonBounded(request).catch(() => null) as Record<string, unknown> | null;
    if (body?.purpose !== "activation" && body?.purpose !== "recovery") return NextResponse.json({ ok: false }, { status: 400 });
    const ok = await redeemCredential(db, body.token, body.password, body.purpose, request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown");
    return NextResponse.json({ ok }, { status: ok ? 200 : 400, headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ ok: false, reason: "unavailable" }, { status: 503 });
  }
}
