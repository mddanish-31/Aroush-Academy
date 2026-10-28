import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/cookie";
import { getSessionUser } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_AUTH_MODE !== "server") {
    return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });
  }

  const cookieToken = request.cookies.get(SESSION_COOKIE)?.value;
  if (!cookieToken) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  const user = await getSessionUser(cookieToken);
  if (!user) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      role: user.role,
      name: user.name,
      identifier: user.identifier,
    },
  });
}
