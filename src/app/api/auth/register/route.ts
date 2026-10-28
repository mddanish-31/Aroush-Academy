import { NextRequest, NextResponse } from "next/server";
import { registerStudent, RegisterStudentInput } from "@/lib/admissions/register";

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
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";

  const result = await registerStudent(body as RegisterStudentInput, ip);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, registrationId: result.registrationId }, { status: 201 });
}
