import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { assessments, assessment_marks } from "@/db/schema/academic";
import { audit_logs } from "@/db/schema/audit";
import { batches, enrollments } from "@/db/schema/cohorts";
import type { ServerIdentity } from "@/lib/auth/profileTypes";
import { conflict, forbidden, invalid, textValue, uuid } from "./access";

export async function createAssessment(input: Record<string, unknown>, actor: ServerIdentity) {
  if (actor.role !== "teacher" || actor.profileStatus !== "ready") return forbidden();
  if (!uuid(input.batchId) || !textValue(input.title, 160) || !Number.isInteger(input.maxMarks) || Number(input.maxMarks) < 1 || Number(input.maxMarks) > 1000) return invalid();
  return db.transaction(async (tx) => {
    const [batch] = await tx.select({ id: batches.id }).from(batches).where(and(eq(batches.id, input.batchId as string), eq(batches.teacher_id, actor.profile!.id), eq(batches.status, "active"))).for("share");
    if (!batch) return forbidden();
    const [assessment] = await tx.insert(assessments).values({ batch_id: batch.id, title: (input.title as string).trim(), max_marks: input.maxMarks as number, created_by_id: actor.id }).returning({ id: assessments.id });
    await tx.insert(audit_logs).values({ performed_by_id: actor.id, performed_by_name: actor.name, actor_role: "teacher", action: "assessment_created", action_type: "CREATE", category: "academic", target: `assessment:${assessment.id}`, details: "Assessment draft created", entity_type: "assessment", entity_id: assessment.id, source_portal: "teacher" });
    return assessment;
  });
}

export async function saveMark(input: Record<string, unknown>, actor: ServerIdentity) {
  if (actor.role !== "teacher" || actor.profileStatus !== "ready") return forbidden();
  if (!uuid(input.assessmentId) || !uuid(input.studentId) || !Number.isInteger(input.marks) || Number(input.marks) < 0) return invalid();
  return db.transaction(async (tx) => {
    const [assessment] = await tx.select({ id: assessments.id, batchId: assessments.batch_id, maxMarks: assessments.max_marks, status: assessments.status }).from(assessments).where(eq(assessments.id, input.assessmentId as string)).for("update");
    if (!assessment || assessment.status !== "draft") return conflict();
    const [batch] = await tx.select({ id: batches.id }).from(batches).where(and(eq(batches.id, assessment.batchId), eq(batches.teacher_id, actor.profile!.id), eq(batches.status, "active"))).for("share");
    if (!batch) return forbidden();
    if (Number(input.marks) > assessment.maxMarks) return invalid();
    const [enrollment] = await tx.select({ id: enrollments.id }).from(enrollments).where(and(eq(enrollments.batch_id, batch.id), eq(enrollments.student_id, input.studentId as string), eq(enrollments.status, "active"))).limit(1);
    if (!enrollment) return forbidden();
    const [previous] = await tx.select({ id: assessment_marks.id, marks: assessment_marks.marks }).from(assessment_marks).where(and(eq(assessment_marks.assessment_id, assessment.id), eq(assessment_marks.student_id, input.studentId as string))).limit(1);
    const [mark] = previous
      ? await tx.update(assessment_marks).set({ marks: input.marks as number, entered_by_id: actor.id, updated_at: sql`clock_timestamp()` }).where(eq(assessment_marks.id, previous.id)).returning({ id: assessment_marks.id })
      : await tx.insert(assessment_marks).values({ assessment_id: assessment.id, student_id: input.studentId as string, marks: input.marks as number, entered_by_id: actor.id }).returning({ id: assessment_marks.id });
    await tx.insert(audit_logs).values({ performed_by_id: actor.id, performed_by_name: actor.name, actor_role: "teacher", action: previous ? "assessment_mark_corrected" : "assessment_mark_entered", action_type: previous ? "UPDATE" : "CREATE", category: "academic", target: `assessment:${assessment.id}`, details: "Draft mark entered", diff: { studentId: input.studentId, previousMarks: previous?.marks ?? null, nextMarks: input.marks }, entity_type: "assessment_mark", entity_id: mark.id, source_portal: "teacher" });
    return mark;
  });
}

export async function publishAssessment(input: Record<string, unknown>, actor: ServerIdentity) {
  if (actor.role !== "teacher" || actor.profileStatus !== "ready") return forbidden();
  if (!uuid(input.id) || input.confirm !== true) return invalid();
  return db.transaction(async (tx) => {
    const [assessment] = await tx.select({ id: assessments.id, batchId: assessments.batch_id, status: assessments.status }).from(assessments).where(eq(assessments.id, input.id as string)).for("update");
    if (!assessment || assessment.status !== "draft") return conflict();
    const [batch] = await tx.select({ id: batches.id }).from(batches).where(and(eq(batches.id, assessment.batchId), eq(batches.teacher_id, actor.profile!.id), eq(batches.status, "active"))).for("update");
    if (!batch) return forbidden();
    const missing = await tx.select({ id: enrollments.student_id }).from(enrollments)
      .leftJoin(assessment_marks, and(eq(assessment_marks.student_id, enrollments.student_id), eq(assessment_marks.assessment_id, assessment.id)))
      .where(and(eq(enrollments.batch_id, batch.id), eq(enrollments.status, "active"), sql`${assessment_marks.id} is null`)).limit(1);
    const [count] = await tx.select({ n: sql<number>`count(*)::int` }).from(enrollments).where(and(eq(enrollments.batch_id, batch.id), eq(enrollments.status, "active")));
    if (missing.length || count.n === 0) return conflict();
    const [published] = await tx.update(assessments).set({ status: "published", published_at: sql`clock_timestamp()` }).where(eq(assessments.id, assessment.id)).returning({ id: assessments.id });
    await tx.insert(audit_logs).values({ performed_by_id: actor.id, performed_by_name: actor.name, actor_role: "teacher", action: "assessment_published", action_type: "UPDATE", category: "academic", target: `assessment:${assessment.id}`, details: "Results published", entity_type: "assessment", entity_id: assessment.id, source_portal: "teacher" });
    return published;
  });
}
