import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { attendance } from "@/db/schema/attendance";
import { attendance_corrections } from "@/db/schema/academic";
import { audit_logs } from "@/db/schema/audit";
import { batches, enrollments } from "@/db/schema/cohorts";
import type { ServerIdentity } from "@/lib/auth/profileTypes";
import { conflict, forbidden, invalid, uuid, calendarDate, textValue } from "./access";

type Input = Record<string, unknown>;
const statuses = ["present", "absent", "late", "excused"] as const;

export async function markAttendance(input: Input, actor: ServerIdentity) {
  if (actor.role !== "teacher" || actor.profileStatus !== "ready") return forbidden();
  if (!uuid(input.batchId) || !uuid(input.studentId) || !calendarDate(input.date) || !statuses.includes(input.status as typeof statuses[number])) return invalid();
  if (input.date > new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())) return invalid();
  if (input.remarks !== undefined && (typeof input.remarks !== "string" || input.remarks.length > 1000)) return invalid();
  if (input.reason !== undefined && !textValue(input.reason, 500)) return invalid();
  const batchId = input.batchId;
  const studentId = input.studentId;
  const date = input.date;
  const status = input.status as typeof statuses[number];
  return db.transaction(async (tx) => {
    const [batch] = await tx.select({ id: batches.id }).from(batches).where(and(eq(batches.id, batchId), eq(batches.teacher_id, actor.profile!.id), eq(batches.status, "active"))).for("share");
    if (!batch) return forbidden();
    const [enrollment] = await tx.select({ id: enrollments.id }).from(enrollments).where(and(eq(enrollments.batch_id, batchId), eq(enrollments.student_id, studentId), eq(enrollments.status, "active"))).limit(1);
    if (!enrollment) return forbidden();
    const [existing] = await tx.select({ id: attendance.id, status: attendance.status, updatedAt: sql<string>`${attendance.updated_at}::text` })
      .from(attendance).where(and(eq(attendance.batch_id, batchId), eq(attendance.student_id, studentId), eq(attendance.date, date))).for("update");
    if (existing) {
      if (existing.status === status) return { id: existing.id, status, unchanged: true };
      if (!textValue(input.reason, 500) || input.version !== existing.updatedAt) return conflict();
      const [updated] = await tx.update(attendance).set({ status, remarks: typeof input.remarks === "string" ? input.remarks : null, recorded_by_id: actor.id, updated_at: sql`clock_timestamp()` })
        .where(eq(attendance.id, existing.id)).returning({ id: attendance.id, updatedAt: sql<string>`${attendance.updated_at}::text` });
      await tx.insert(attendance_corrections).values({ attendance_id: existing.id, previous_status: existing.status, next_status: status, reason: input.reason.trim(), corrected_by_id: actor.id });
      await tx.insert(audit_logs).values({ performed_by_id: actor.id, performed_by_name: actor.name, actor_role: "teacher", action: "attendance_corrected", action_type: "UPDATE", category: "academic", target: `attendance:${existing.id}`, entity_type: "attendance", entity_id: existing.id, details: "Attendance status corrected", diff: { previousStatus: existing.status, nextStatus: status }, source_portal: "teacher" });
      return { id: updated.id, status, updatedAt: updated.updatedAt };
    }
    const [created] = await tx.insert(attendance).values({ batch_id: batchId, student_id: studentId, date, status, remarks: typeof input.remarks === "string" ? input.remarks : null, recorded_by_id: actor.id })
      .returning({ id: attendance.id, updatedAt: sql<string>`${attendance.updated_at}::text` });
    await tx.insert(audit_logs).values({ performed_by_id: actor.id, performed_by_name: actor.name, actor_role: "teacher", action: "attendance_marked", action_type: "CREATE", category: "academic", target: `attendance:${created.id}`, entity_type: "attendance", entity_id: created.id, details: "Attendance marked", source_portal: "teacher" });
    return { id: created.id, status, updatedAt: created.updatedAt };
  });
}
