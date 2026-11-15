import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guard";
import { readJsonBounded, sameOrigin } from "@/lib/auth/requestSafety";
import { createSetup, listSetup, setupDatabaseError, updateSetup } from "@/lib/academy/setup";

const response = (body: object, status: number) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

async function admin() {
  if (process.env.NEXT_PUBLIC_AUTH_MODE !== "server") return { error: response({ ok: false, reason: "not_found" }, 404) };
  const user = await getCurrentUser();
  if (!user) return { error: response({ ok: false, reason: "unauthorized" }, 401) };
  if (user.role !== "academy-admin") return { error: response({ ok: false, reason: "forbidden" }, 403) };
  return { user };
}

function failure(error: unknown) {
  const known = setupDatabaseError(error);
  return response({ ok: false, reason: known?.reason ?? "server_error" }, known?.status ?? 503);
}

export async function GET() {
  try {
    const result = await admin();
    if (result.error) return result.error;
    return response({ ok: true, ...await listSetup() }, 200);
  } catch (error) { return failure(error); }
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return response({ ok: false, reason: "forbidden" }, 403);
  try {
    const result = await admin();
    if (result.error) return result.error;
    const body: unknown = await readJsonBounded(request).catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) return response({ ok: false, reason: "invalid_request" }, 400);
    return response({ ok: true, item: await createSetup(body as Record<string, unknown>, result.user!) }, 201);
  } catch (error) { return failure(error); }
}

export async function PATCH(request: NextRequest) {
  if (!sameOrigin(request)) return response({ ok: false, reason: "forbidden" }, 403);
  try {
    const result = await admin();
    if (result.error) return result.error;
    const body: unknown = await readJsonBounded(request).catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) return response({ ok: false, reason: "invalid_request" }, 400);
    return response({ ok: true, item: await updateSetup(body as Record<string, unknown>, result.user!) }, 200);
  } catch (error) { return failure(error); }
}