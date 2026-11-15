import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guard";
import { readJsonBounded, sameOrigin } from "@/lib/auth/requestSafety";
import { changePayee } from "@/lib/finance/payee";
import { financeFailure } from "@/lib/finance/rules";

const response = (body: object, status: number) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

export async function PUT(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_AUTH_MODE !== "server") return response({ ok: false, reason: "not_found" }, 404);
  if (!sameOrigin(request)) return response({ ok: false, reason: "forbidden" }, 403);
  try {
    const user = await getCurrentUser();
    if (!user) return response({ ok: false, reason: "unauthorized" }, 401);
    if (user.role !== "academy-admin") return response({ ok: false, reason: "forbidden" }, 403);
    let input: unknown;
    try { input = await readJsonBounded(request, 4096); }
    catch { return response({ ok: false, reason: "invalid_request" }, 400); }
    if (!input || typeof input !== "object" || Array.isArray(input)) return response({ ok: false, reason: "invalid_request" }, 400);
    return response({ ok: true, ...await changePayee(input as Record<string, unknown>, user, request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown") }, 200);
  } catch (error) {
    const known = financeFailure(error);
    return response({ ok: false, reason: known?.reason ?? "server_error" }, known?.status ?? 503);
  }
}
