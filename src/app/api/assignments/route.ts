import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { batches, enrollments } from "@/db/schema/cohorts";
import { students, teachers } from "@/db/schema/people";
import { academic_boards, academic_classes, academic_subjects } from "@/db/schema/taxonomy";
import { SESSION_COOKIE } from "@/lib/auth/cookie";
import { getCurrentIdentity } from "@/lib/auth/profile";

const response = (body: object, status: number) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export async function GET(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_AUTH_MODE !== "server") return response({ ok: false, reason: "not_found" }, 404);
  try {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    const identity = token ? await getCurrentIdentity(token) : null;
    if (!identity) return response({ ok: false, reason: "unauthorized" }, 401);
    if (identity.role === "academy-admin") return response({ ok: false, reason: "forbidden" }, 403);
    if (identity.profileStatus === "missing" || !identity.profile) return response({ ok: false, reason: "incomplete_setup" }, 409);
    const keys = request.nextUrl.searchParams;
    if ([...keys.keys()].some((key) => key !== "batchId" && key !== "studentId") || [...keys.keys()].length !== new Set(keys.keys()).size) return response({ ok: false, reason: "invalid_request" }, 400);
    const batchId = keys.get("batchId");
    const studentId = keys.get("studentId");
    if ((batchId && !isUuid(batchId)) || (studentId && !isUuid(studentId)) || request.nextUrl.search.length > 512) return response({ ok: false, reason: "invalid_request" }, 400);
    if (identity.role === "teacher") {
      if (studentId) return response({ ok: false, reason: "forbidden" }, 403);
      const owned = await db.select({ id: batches.id, name: batches.name, status: batches.status, className: academic_classes.name, boardName: academic_boards.name, subjectName: academic_subjects.name })
        .from(batches).innerJoin(academic_classes, eq(batches.class_id, academic_classes.id)).leftJoin(academic_boards, eq(batches.board_id, academic_boards.id))
        .innerJoin(academic_subjects, eq(batches.subject_id, academic_subjects.id)).innerJoin(teachers, eq(batches.teacher_id, teachers.id))
        .where(and(eq(teachers.id, identity.profile.id), eq(teachers.status, "active"), inArray(batches.status, ["active", "upcoming"]), batchId ? eq(batches.id, batchId) : undefined));
      if (batchId && !owned.length) return response({ ok: false, reason: "forbidden" }, 403);
      const ids = owned.map((item) => item.id);
      const pupils = ids.length ? await db.select({ id: students.id, name: students.name, admissionNumber: students.admission_number, batchId: enrollments.batch_id })
        .from(enrollments).innerJoin(students, eq(enrollments.student_id, students.id))
        .where(and(inArray(enrollments.batch_id, ids), eq(enrollments.status, "active"))) : [];
      return response({ ok: true, batches: owned, students: pupils }, 200);
    }
    if (batchId) return response({ ok: false, reason: "forbidden" }, 403);
    const target = identity.role === "student" ? identity.profile.id : studentId;
    if (!target || (identity.role === "student" && studentId && studentId !== target) || (identity.role === "parent" && !identity.children.some((child) => child.id === target))) return response({ ok: false, reason: "forbidden" }, 403);
    const assigned = await db.select({ id: batches.id, name: batches.name, status: batches.status, enrollmentStatus: enrollments.status, className: academic_classes.name, boardName: academic_boards.name, subjectName: academic_subjects.name, teacherName: teachers.name })
      .from(enrollments).innerJoin(batches, eq(enrollments.batch_id, batches.id))
      .innerJoin(academic_classes, eq(batches.class_id, academic_classes.id)).leftJoin(academic_boards, eq(batches.board_id, academic_boards.id))
      .innerJoin(academic_subjects, eq(batches.subject_id, academic_subjects.id)).innerJoin(teachers, eq(batches.teacher_id, teachers.id))
      .where(eq(enrollments.student_id, target));
    return response({ ok: true, studentId: target, batches: assigned }, 200);
  } catch { return response({ ok: false, reason: "server_error" }, 503); }
}
