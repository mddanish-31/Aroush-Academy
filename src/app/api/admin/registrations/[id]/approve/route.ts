import { NextRequest, NextResponse } from "next/server";
import { approveRegistration } from "@/lib/admissions/approve";
import { getCurrentUser } from "@/lib/auth/guard";
import { readJsonBounded, sameOrigin } from "@/lib/auth/requestSafety";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (process.env.NEXT_PUBLIC_AUTH_MODE !== "server") {
    return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });
  }

  if (!sameOrigin(request)) {
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

  let parentUserId: string | undefined;
  try {
    const body = await readJsonBounded(request) as { parentUserId?: unknown } | null;
    if (body && typeof body === "object" && typeof body.parentUserId === "string" && UUID_REGEX.test(body.parentUserId)) {
      parentUserId = body.parentUserId;
    } else if (body?.parentUserId != null) {
      return NextResponse.json({ ok: false, reason: "invalid_request" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid_request" }, { status: 400 });
  }

  try {
    const result = await approveRegistration(id, admin.id, undefined, parentUserId);
    return NextResponse.json({
      ok: true,
      studentId: result.studentId,
      admissionNumber: result.admissionNumber,
      activationToken: result.activationToken,
    }, { headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } });
  } catch (error) {
    const message = error instanceof Error && ["Select the reviewed parent account", "Guardian phone requires administrator review and backfill", "Reviewed parent does not match guardian phone"].includes(error.message) ? error.message : "Approval could not be processed. Review account identities.";
    return NextResponse.json({ ok: false, error: message }, { status: 400, headers: { "Cache-Control": "private, no-store" } });
  }
}
