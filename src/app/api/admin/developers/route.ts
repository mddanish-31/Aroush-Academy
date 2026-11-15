import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guard";
import { readJsonBounded, sameOrigin } from "@/lib/auth/requestSafety";
import { provisionDeveloper } from "@/lib/cms/provision";
import { CmsError } from "@/lib/cms/store";

const reply = (body: object, status: number) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

export async function POST(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_AUTH_MODE !== "server") return reply({ ok: false, reason: "not_found" }, 404);
  if (!sameOrigin(request)) return reply({ ok: false, reason: "forbidden" }, 403);
  try {
    const user = await getCurrentUser();
    if (!user) return reply({ ok: false, reason: "unauthorized" }, 401);
    if (user.role !== "academy-admin") return reply({ ok: false, reason: "forbidden" }, 403);
    const body: unknown = await readJsonBounded(request, 2048);
    if (!body || typeof body !== "object" || Array.isArray(body)) return reply({ ok: false, reason: "invalid_request" }, 400);
    const input = body as Record<string, unknown>;
    return reply({ ok: true, ...await provisionDeveloper(input.name, input.email, user) }, 201);
  } catch (error) {
    if (error instanceof CmsError) return reply({ ok: false, reason: error.reason }, error.status);
    if (error instanceof SyntaxError) return reply({ ok: false, reason: "invalid_request" }, 400);
    if (error instanceof Error && error.message === "invalid_request") return reply({ ok: false, reason: "invalid_request" }, 400);
    return reply({ ok: false, reason: "server_error" }, 503);
  }
}
