import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "@/lib/auth/cookie";
import { deleteSession } from "@/lib/auth/session";
import { sameOrigin } from "@/lib/auth/requestSafety";

export async function POST(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_AUTH_MODE !== "server") {
    return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });
  }

  if (!sameOrigin(request)) {
    return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
  }

  const cookieToken = request.cookies.get(SESSION_COOKIE)?.value;
  try {
    if (cookieToken) await deleteSession(cookieToken);
  } catch {
    return NextResponse.json({ ok: false, reason: "server_error" }, { status: 503 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: 0,
  });

  return response;
}
