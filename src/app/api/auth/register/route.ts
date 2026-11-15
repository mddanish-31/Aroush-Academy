import { NextRequest, NextResponse } from "next/server";
import { registerStudent, RegisterStudentInput } from "@/lib/admissions/register";
import { readJsonBounded, sameOrigin } from "@/lib/auth/requestSafety";

export async function POST(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_AUTH_MODE !== "server") {
    return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });
  }

  if (!sameOrigin(request)) {
    return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await readJsonBounded(request);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";

  try {
    const result = await registerStudent(body as RegisterStudentInput, ip);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: "Registration request could not be processed" }, { status: result.error?.startsWith("Too many") ? 429 : 400 });
    }

    return NextResponse.json({ ok: true, registrationId: result.registrationId }, { status: 201 });
  } catch (error) {
    const cause = error as { code?: string; cause?: { code?: string } };
    return NextResponse.json({ ok: false, error: "Registration request could not be processed" }, { status: cause.code === "23505" || cause.cause?.code === "23505" ? 400 : 503 });
  }
}
