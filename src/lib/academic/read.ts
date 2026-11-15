import "server-only";
import { and, desc, eq, gte, inArray, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { academic_posts, academic_remarks, assessments, assessment_marks, timetable_events } from "@/db/schema/academic";
import { attendance } from "@/db/schema/attendance";
import { batches, enrollments } from "@/db/schema/cohorts";
import { students } from "@/db/schema/people";
import type { ServerIdentity } from "@/lib/auth/profileTypes";
import { calendarDate, forbidden, invalid, studentFor, uuid } from "./access";

export async function readAcademic(identity: ServerIdentity, query: URLSearchParams) {
  if (query.toString().length > 1024 || [...query.keys()].some((key) => !["studentId", "batchId", "date"].includes(key) || query.getAll(key).length !== 1)) return invalid();
  if (identity.profileStatus !== "ready" && identity.role !== "academy-admin") return forbidden();
  const studentId = identity.role === "student" || identity.role === "parent" ? studentFor(identity, query.get("studentId") ?? undefined) : null;
  const selectedBatch = query.get("batchId");
  const date = query.get("date") ?? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  if (!calendarDate(date) || (selectedBatch !== null && !uuid(selectedBatch))) return invalid();
  const batchRows = identity.role === "academy-admin"
    ? await db.select({ id: batches.id, name: batches.name, teacherId: batches.teacher_id }).from(batches).where(eq(batches.status, "active")).orderBy(batches.name).limit(100)
    : identity.role === "teacher"
      ? await db.select({ id: batches.id, name: batches.name, teacherId: batches.teacher_id }).from(batches).where(and(eq(batches.teacher_id, identity.profile!.id), eq(batches.status, "active"))).orderBy(batches.name).limit(100)
      : await db.select({ id: batches.id, name: batches.name, teacherId: batches.teacher_id }).from(enrollments).innerJoin(batches, eq(batches.id, enrollments.batch_id))
        .where(and(eq(enrollments.student_id, studentId!), eq(enrollments.status, "active"))).orderBy(batches.name).limit(100);
  const ids = batchRows.map((row) => row.id);
  if (selectedBatch && !ids.includes(selectedBatch)) return forbidden();
  const activeBatch = selectedBatch ?? ids[0] ?? null;
  const roleAudience = identity.role === "academy-admin" ? "all" : identity.role === "teacher" ? "teachers" : identity.role === "parent" ? "parents" : "students";
  const posts = await db.select({ id: academic_posts.id, batchId: academic_posts.batch_id, kind: academic_posts.kind, title: academic_posts.title, body: academic_posts.body, audience: academic_posts.audience, dueOn: academic_posts.due_on, publishedAt: academic_posts.published_at })
    .from(academic_posts)
    .where(and(
      ids.length ? or(isNull(academic_posts.batch_id), inArray(academic_posts.batch_id, ids)) : isNull(academic_posts.batch_id),
      identity.role === "academy-admin" ? undefined : or(eq(academic_posts.audience, "all"), eq(academic_posts.audience, roleAudience)),
    )).orderBy(desc(academic_posts.published_at)).limit(100);
  const filteredPosts = posts.filter((post) => post.batchId || post.kind === "notice");
  const events = ids.length ? await db.select({ id: timetable_events.id, batchId: timetable_events.batch_id, title: timetable_events.title, startsAt: timetable_events.starts_at, endsAt: timetable_events.ends_at, status: timetable_events.status, version: sql<string>`${timetable_events.updated_at}::text` })
    .from(timetable_events).where(and(inArray(timetable_events.batch_id, ids), eq(timetable_events.status, "scheduled"), gte(timetable_events.starts_at, new Date(Date.now() - 30 * 86400000))))
    .orderBy(timetable_events.starts_at).limit(100) : [];
  const results = ids.length ? await db.select({ id: assessments.id, batchId: assessments.batch_id, title: assessments.title, maxMarks: assessments.max_marks, status: assessments.status, publishedAt: assessments.published_at })
    .from(assessments).where(and(inArray(assessments.batch_id, ids), identity.role === "student" || identity.role === "parent" ? eq(assessments.status, "published") : undefined))
    .orderBy(desc(assessments.created_at)).limit(100) : [];
  const resultIds = results.map((result) => result.id);
  const marks = resultIds.length ? await db.select({ assessmentId: assessment_marks.assessment_id, studentId: assessment_marks.student_id, marks: assessment_marks.marks })
    .from(assessment_marks).where(and(inArray(assessment_marks.assessment_id, resultIds), studentId ? eq(assessment_marks.student_id, studentId) : undefined)).limit(500) : [];
  const remarks = studentId ? await db.select({ id: academic_remarks.id, batchId: academic_remarks.batch_id, body: academic_remarks.body, createdAt: academic_remarks.created_at })
    .from(academic_remarks).where(and(eq(academic_remarks.student_id, studentId), ids.length ? inArray(academic_remarks.batch_id, ids) : sql`false`)).orderBy(desc(academic_remarks.created_at)).limit(100) : [];
  const roster = identity.role === "teacher" && activeBatch ? await db.select({ id: students.id, name: students.name, admissionNumber: students.admission_number }).from(enrollments)
    .innerJoin(students, eq(students.id, enrollments.student_id)).where(and(eq(enrollments.batch_id, activeBatch), eq(enrollments.status, "active"))).orderBy(students.name).limit(200) : [];
  const dayMarks = roster.length ? await db.select({ id: attendance.id, studentId: attendance.student_id, status: attendance.status, version: sql<string>`${attendance.updated_at}::text` })
    .from(attendance).where(and(eq(attendance.batch_id, activeBatch!), eq(attendance.date, date), inArray(attendance.student_id, roster.map((row) => row.id)))) : [];
  return { batches: batchRows, posts: filteredPosts, events, assessments: results, marks, remarks, roster, dayMarks, selectedBatch: activeBatch, date };
}
