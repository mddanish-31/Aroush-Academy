import { NextRequest, NextResponse } from "next/server";
import { rejectRegistration } from "@/lib/admissions/approve";
import { getCurrentUser } from "@/lib/auth/guard";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;
  if (!id || !UUID_REGEX.test(id)) {
    return NextResponse.json({ ok: false, error: "Invalid registration id" }, { status: 400 });
  }

  const admin = await getCurrentUser();
  if (!admin) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }
  if (admin.role !== "academy-admin") {
    return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const reason = (body as Record<string, unknown>)?.reason;
  if (!reason || typeof reason !== "string" || reason.trim().length < 5) {
    return NextResponse.json(
      { ok: false, error: "Reason must be at least 5 characters" },
      { status: 400 }
    );
  }

  try {
    await rejectRegistration(id, admin.id, reason.trim());
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Rejection failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
