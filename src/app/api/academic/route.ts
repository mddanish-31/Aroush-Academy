import { NextRequest, NextResponse } from "next/server";
import { getCurrentIdentity } from "@/lib/auth/profile";
import { SESSION_COOKIE } from "@/lib/auth/cookie";
import { readJsonBounded, sameOrigin } from "@/lib/auth/requestSafety";
import { academicDatabaseError, invalid } from "@/lib/academic/access";
import { markAttendance } from "@/lib/academic/markAttendance";
import { createTimetable, cancelTimetable } from "@/lib/academic/timetable";
import { createPost, createRemark } from "@/lib/academic/posts";
import { createAssessment, saveMark, publishAssessment } from "@/lib/academic/results";
import { readAcademic } from "@/lib/academic/read";

const response = (body: object, status: number) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

async function identity(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_AUTH_MODE !== "server") return { error: response({ ok: false, reason: "not_found" }, 404) };
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return { error: response({ ok: false, reason: "unauthorized" }, 401) };
  const user = await getCurrentIdentity(token);
  if (!user) return { error: response({ ok: false, reason: "unauthorized" }, 401) };
  return { user };
}

function failure(error: unknown) {
  const known = academicDatabaseError(error);
  return response({ ok: false, reason: known?.reason ?? "server_error" }, known?.status ?? 503);
}

async function bodyOf(request: NextRequest) {
  let parsed: unknown;
  try { parsed = await readJsonBounded(request, 12000); } catch { return invalid(); }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return invalid();
  return parsed as Record<string, unknown>;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await identity(request);
    if (auth.error) return auth.error;
    return response({ ok: true, ...await readAcademic(auth.user!, request.nextUrl.searchParams) }, 200);
  } catch (error) { return failure(error); }
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return response({ ok: false, reason: "forbidden" }, 403);
  try {
    const auth = await identity(request);
    if (auth.error) return auth.error;
    const input = await bodyOf(request);
    const item = input.action === "attendance" ? await markAttendance(input, auth.user!)
      : input.action === "timetable" ? await createTimetable(input, auth.user!)
      : input.action === "post" ? await createPost(input, auth.user!)
      : input.action === "remark" ? await createRemark(input, auth.user!)
      : input.action === "assessment" ? await createAssessment(input, auth.user!)
      : input.action === "mark" ? await saveMark(input, auth.user!)
      : invalid();
    return response({ ok: true, item }, 201);
  } catch (error) { return failure(error); }
}

export async function PATCH(request: NextRequest) {
  if (!sameOrigin(request)) return response({ ok: false, reason: "forbidden" }, 403);
  try {
    const auth = await identity(request);
    if (auth.error) return auth.error;
    const input = await bodyOf(request);
    const item = input.action === "cancelTimetable" ? await cancelTimetable(input, auth.user!)
      : input.action === "publishAssessment" ? await publishAssessment(input, auth.user!)
      : invalid();
    return response({ ok: true, item }, 200);
  } catch (error) { return failure(error); }
}