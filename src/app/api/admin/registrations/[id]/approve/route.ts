import { NextRequest, NextResponse } from "next/server";
import { approveRegistration } from "@/lib/admissions/approve";
import { requireRole } from "@/lib/auth/guard";

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

  const admin = await requireRole(["academy-admin"]);

  try {
    const result = await approveRegistration(id, admin.id);
    return NextResponse.json({
      ok: true,
      studentId: result.studentId,
      admissionNumber: result.admissionNumber,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Approval failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
