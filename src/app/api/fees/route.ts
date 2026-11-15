import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guard";
import { readJsonBounded, sameOrigin } from "@/lib/auth/requestSafety";
import { createFee, readFees, reviewSubmission } from "@/lib/finance/ledger";
import { financeFailure } from "@/lib/finance/rules";

const response = (body: object, status: number) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
async function identity() {
  if (process.env.NEXT_PUBLIC_AUTH_MODE !== "server") return { error: response({ ok: false, reason: "not_found" }, 404) };
  const user = await getCurrentUser();
  if (!user) return { error: response({ ok: false, reason: "unauthorized" }, 401) };
  if (user.role !== "academy-admin" && user.role !== "student" && user.role !== "parent") return { error: response({ ok: false, reason: "forbidden" }, 403) };
  return { user };
}
function failure(error: unknown) {
  const known = financeFailure(error);
  return response({ ok: false, reason: known?.reason ?? "server_error" }, known?.status ?? 503);
}
async function body(request: NextRequest) {
  try {
    const value: unknown = await readJsonBounded(request, 4096);
    return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
  } catch { return null; }
}

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await identity();
    if (error) return error;
    const page = request.nextUrl.searchParams.get("page") ?? "0";
    const pendingPage = request.nextUrl.searchParams.get("pendingPage") ?? "0";
    const enrollmentPage = request.nextUrl.searchParams.get("enrollmentPage") ?? "0";
    if ([page, pendingPage, enrollmentPage].some((value) => !/^\d{1,5}$/.test(value))) return response({ ok: false, reason: "invalid_request" }, 400);
    return response({ ok: true, ...await readFees(user!, request.nextUrl.searchParams.get("studentId"), Number(page), Number(pendingPage), Number(enrollmentPage)) }, 200);
  } catch (error) { return failure(error); }
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return response({ ok: false, reason: "forbidden" }, 403);
  try {
    const { user, error } = await identity();
    if (error) return error;
    const input = await body(request);
    if (!input) return response({ ok: false, reason: "invalid_request" }, 400);
    return response({ ok: true, ...await createFee(input, user!) }, 201);
  } catch (error) { return failure(error); }
}

export async function PATCH(request: NextRequest) {
  if (!sameOrigin(request)) return response({ ok: false, reason: "forbidden" }, 403);
  try {
    const { user, error } = await identity();
    if (error) return error;
    const input = await body(request);
    if (!input) return response({ ok: false, reason: "invalid_request" }, 400);
    return response({ ok: true, ...await reviewSubmission(input, user!) }, 200);
  } catch (error) { return failure(error); }
}
