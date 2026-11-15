import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { academic_posts, academic_remarks } from "@/db/schema/academic";
import { audit_logs } from "@/db/schema/audit";
import { batches, enrollments } from "@/db/schema/cohorts";
import type { ServerIdentity } from "@/lib/auth/profileTypes";
import { calendarDate, forbidden, invalid, textValue, uuid } from "./access";

export async function createPost(input: Record<string, unknown>, actor: ServerIdentity) {
  if (input.kind !== "notice" && input.kind !== "material" && input.kind !== "homework") return invalid();
  if (!textValue(input.title, 160) || !textValue(input.body, 10000)) return invalid();
  if (input.dueOn !== undefined && !calendarDate(input.dueOn)) return invalid();
  if (input.kind !== "homework" && input.dueOn !== undefined) return invalid();
  const audience = input.audience === undefined ? "all" : input.audience;
  if (audience !== "all" && audience !== "teachers" && audience !== "students" && audience !== "parents") return invalid();
  if (input.kind !== "notice" && audience !== "all") return invalid();
  if (actor.role !== "academy-admin" && actor.role !== "teacher") return forbidden();
  if (input.batchId !== undefined && !uuid(input.batchId)) return invalid();
  if (input.kind !== "notice" && !uuid(input.batchId)) return invalid();
  if (actor.role === "teacher" && !uuid(input.batchId)) return forbidden();
  return db.transaction(async (tx) => {
    if (input.batchId) {
      const [batch] = await tx.select({ teacherId: batches.teacher_id }).from(batches).where(and(eq(batches.id, input.batchId as string), eq(batches.status, "active"))).for("share");
      if (!batch || (actor.role === "teacher" && batch.teacherId !== actor.profile?.id)) return forbidden();
    }
    const [post] = await tx.insert(academic_posts).values({ batch_id: (input.batchId as string) ?? null, kind: input.kind as "notice" | "material" | "homework", title: (input.title as string).trim(), body: (input.body as string).trim(), audience, due_on: (input.dueOn as string) ?? null, author_id: actor.id }).returning({ id: academic_posts.id });
    await tx.insert(audit_logs).values({ performed_by_id: actor.id, performed_by_name: actor.name, actor_role: actor.role, action: `academic_${input.kind}_published`, action_type: "CREATE", category: "academic", target: `post:${post.id}`, details: "Academic text published", entity_type: "academic_post", entity_id: post.id, source_portal: actor.role === "teacher" ? "teacher" : "admin" });
    return post;
  });
}

export async function createRemark(input: Record<string, unknown>, actor: ServerIdentity) {
  if (actor.role !== "teacher" || actor.profileStatus !== "ready") return forbidden();
  if (!uuid(input.batchId) || !uuid(input.studentId) || !textValue(input.body, 2000)) return invalid();
  return db.transaction(async (tx) => {
    const [batch] = await tx.select({ id: batches.id }).from(batches).where(and(eq(batches.id, input.batchId as string), eq(batches.teacher_id, actor.profile!.id), eq(batches.status, "active"))).for("share");
    if (!batch) return forbidden();
    const [enrollment] = await tx.select({ id: enrollments.id }).from(enrollments).where(and(eq(enrollments.batch_id, batch.id), eq(enrollments.student_id, input.studentId as string), eq(enrollments.status, "active"))).limit(1);
    if (!enrollment) return forbidden();
    const [remark] = await tx.insert(academic_remarks).values({ batch_id: batch.id, student_id: input.studentId as string, body: (input.body as string).trim(), author_id: actor.id }).returning({ id: academic_remarks.id });
    await tx.insert(audit_logs).values({ performed_by_id: actor.id, performed_by_name: actor.name, actor_role: "teacher", action: "student_remark_created", action_type: "CREATE", category: "academic", target: `student:${input.studentId}`, details: "Student remark recorded", entity_type: "academic_remark", entity_id: remark.id, source_portal: "teacher" });
    return remark;
  });
}
