import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/cookie";
import { readAttendance } from "@/lib/attendance/readAttendance";
import type { AttendanceReadError } from "@/lib/attendance/attendanceTypes";

const headers = { "Cache-Control": "private, no-store" };
const errorStatus: Record<AttendanceReadError, number> = {
  unauthorized: 401,
  forbidden: 403,
  incomplete_setup: 409,
  invalid_request: 400,
};

export async function GET(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_AUTH_MODE !== "server") {
    return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404, headers });
  }
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401, headers });
  }
  try {
    const result = await readAttendance(token, request.nextUrl.searchParams);
    return NextResponse.json(result, { status: result.ok ? 200 : errorStatus[result.reason], headers });
  } catch {
    return NextResponse.json({ ok: false, reason: "server_error" }, { status: 503, headers });
  }
}
