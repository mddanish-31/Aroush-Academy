import "server-only";
import { and, desc, eq, gte, lt, lte, or } from "drizzle-orm";
import type { db as appDb } from "../../db";
import { attendance } from "../../db/schema/attendance";
import { batches } from "../../db/schema/cohorts";
import { academic_subjects } from "../../db/schema/taxonomy";
import { getCurrentIdentity } from "../auth/profile";
import { calculateAttendanceStats } from "../attendanceCalculations";
import { parseAttendanceQuery } from "./attendanceQuery";
import type { AttendanceReadResult } from "./attendanceTypes";

export async function readAttendance(
  token: string,
  params: URLSearchParams,
  database?: typeof appDb,
): Promise<AttendanceReadResult> {
  const identity = await getCurrentIdentity(token, database);
  if (!identity) return { ok: false, reason: "unauthorized" };
  if (identity.role !== "student" && identity.role !== "parent") return { ok: false, reason: "forbidden" };
  if (!identity.profile || identity.profileStatus === "missing") return { ok: false, reason: "incomplete_setup" };
  const query = parseAttendanceQuery(params);
  if (!query) return { ok: false, reason: "invalid_request" };
  if (identity.role === "parent" && !query.studentId) return { ok: false, reason: "invalid_request" };
  const studentId = identity.role === "student" ? identity.profile.id : query.studentId!;
  if (identity.role === "student" && query.studentId && query.studentId !== studentId) {
    return { ok: false, reason: "forbidden" };
  }
  if (identity.role === "parent" && !identity.children.some((child) => child.id === studentId)) {
    return { ok: false, reason: "forbidden" };
  }

  const db = database ?? (await import("../../db")).db;
  const rows = await db
    .select({
      id: attendance.id,
      batchId: attendance.batch_id,
      date: attendance.date,
      status: attendance.status,
      subjectId: academic_subjects.id,
      subject: academic_subjects.name,
      batch: batches.name,
    })
    .from(attendance)
    .innerJoin(batches, eq(attendance.batch_id, batches.id))
    .innerJoin(academic_subjects, eq(batches.subject_id, academic_subjects.id))
    .where(and(
      eq(attendance.student_id, studentId),
      gte(attendance.date, query.from),
      lte(attendance.date, query.to),
      query.cursor ? or(
        lt(attendance.date, query.cursor.date),
        and(eq(attendance.date, query.cursor.date), lt(attendance.id, query.cursor.id)),
      ) : undefined,
    ))
    .orderBy(desc(attendance.date), desc(attendance.id))
    .limit(query.limit + 1);

  const records = rows.slice(0, query.limit);
  const last = records.at(-1);
  return {
    ok: true,
    studentId,
    records,
    summary: calculateAttendanceStats(records.map((record) => ({ ...record, studentId }))),
    summaryScope: "page",
    filters: { from: query.from, to: query.to },
    nextCursor: rows.length > query.limit && last ? `${last.date}:${last.id}` : null,
  };
}
