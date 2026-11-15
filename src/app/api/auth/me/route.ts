import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/cookie";
import { getCurrentIdentity } from "@/lib/auth/profile";

const headers = { "Cache-Control": "private, no-store" };

export async function GET(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_AUTH_MODE !== "server") {
    return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404, headers });
  }

  const cookieToken = request.cookies.get(SESSION_COOKIE)?.value;
  if (!cookieToken) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401, headers });
  }

  try {
    const user = await getCurrentIdentity(cookieToken);
    if (!user) {
      return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401, headers });
    }
    return NextResponse.json({ ok: true, user }, { headers });
  } catch {
    return NextResponse.json({ ok: false, reason: "server_error" }, { status: 503, headers });
  }
}
