import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "@/lib/auth/cookie";
import { deleteSession } from "@/lib/auth/session";

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

  const cookieToken = request.cookies.get(SESSION_COOKIE)?.value;
  if (cookieToken) {
    await deleteSession(cookieToken);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: 0,
  });

  return response;
}
