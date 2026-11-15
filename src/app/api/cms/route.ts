import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guard";
import { readJsonBounded, sameOrigin } from "@/lib/auth/requestSafety";
import { CmsError, publishCms, readCmsEditor, rollbackCms, saveCmsDraft } from "@/lib/cms/store";

const reply = (body: object, status: number) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

async function editor() {
  if (process.env.NEXT_PUBLIC_AUTH_MODE !== "server") return { error: reply({ ok: false, reason: "not_found" }, 404) };
  const user = await getCurrentUser();
  if (!user) return { error: reply({ ok: false, reason: "unauthorized" }, 401) };
  if (user.role !== "developer" && user.role !== "academy-admin") return { error: reply({ ok: false, reason: "forbidden" }, 403) };
  return { user };
}

function failure(error: unknown) {
  if (error instanceof CmsError) return reply({ ok: false, reason: error.reason }, error.status);
  if (error instanceof SyntaxError) return reply({ ok: false, reason: "invalid_request" }, 400);
  if (error instanceof Error && error.message === "invalid_request") return reply({ ok: false, reason: "invalid_request" }, 400);
  return reply({ ok: false, reason: "server_error" }, 503);
}

export async function GET() {
  try {
    const access = await editor();
    if (access.error) return access.error;
    return reply({ ok: true, ...await readCmsEditor() }, 200);
  } catch (error) { return failure(error); }
}

export async function PATCH(request: NextRequest) {
  if (!sameOrigin(request)) return reply({ ok: false, reason: "forbidden" }, 403);
  try {
    const access = await editor();
    if (access.error) return access.error;
    const input: unknown = await readJsonBounded(request, 120000);
    if (!input || typeof input !== "object" || Array.isArray(input)) return reply({ ok: false, reason: "invalid_request" }, 400);
    const body = input as Record<string, unknown>;
    let result;
    if (body.action === "save") result = await saveCmsDraft(body.draft, body.version, access.user!);
    else if (body.action === "publish") result = await publishCms(body.version, access.user!);
    else if (body.action === "rollback") result = await rollbackCms(body.revisionId, body.version, access.user!);
    else return reply({ ok: false, reason: "invalid_request" }, 400);
    return reply({ ok: true, ...result }, 200);
  } catch (error) { return failure(error); }
}
