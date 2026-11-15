import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { batches, enrollments } from "@/db/schema/cohorts";
import type { ServerIdentity } from "@/lib/auth/profileTypes";

export class AcademicError extends Error {
  constructor(public reason: "invalid_request" | "forbidden" | "conflict" | "incomplete_setup", public status: 400 | 403 | 409) { super(reason); }
}

export const invalid = (): never => { throw new AcademicError("invalid_request", 400); };
export const forbidden = (): never => { throw new AcademicError("forbidden", 403); };
export const conflict = (): never => { throw new AcademicError("conflict", 409); };
export const uuid = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export const textValue = (value: unknown, max: number): value is string => typeof value === "string" && value.trim().length > 0 && value.trim().length <= max;
export const calendarDate = (value: unknown): value is string => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;

export function studentFor(identity: ServerIdentity, requested: unknown) {
  if (identity.profileStatus !== "ready") throw new AcademicError("incomplete_setup", 409);
  if (identity.role === "student") {
    if (requested !== undefined && requested !== identity.profile!.id) return forbidden();
    return identity.profile!.id;
  }
  if (identity.role === "parent") {
    if (!uuid(requested) || !identity.children.some((child) => child.id === requested)) return forbidden();
    return requested;
  }
  return forbidden();
}

export async function assignedBatch(identity: ServerIdentity, batchId: unknown) {
  if (!uuid(batchId)) return invalid();
  if (identity.role !== "teacher" || identity.profileStatus !== "ready") return forbidden();
  const [batch] = await db.select({ id: batches.id, teacherId: batches.teacher_id }).from(batches)
    .where(and(eq(batches.id, batchId), eq(batches.teacher_id, identity.profile!.id), eq(batches.status, "active"))).limit(1);
  if (!batch) return forbidden();
  return batch;
}

export async function enrolledStudent(batchId: string, studentId: unknown) {
  if (!uuid(studentId)) return invalid();
  const [row] = await db.select({ id: enrollments.id }).from(enrollments)
    .where(and(eq(enrollments.batch_id, batchId), eq(enrollments.student_id, studentId), eq(enrollments.status, "active"))).limit(1);
  if (!row) return forbidden();
  return studentId;
}

export function academicDatabaseError(error: unknown) {
  if (error && typeof error === "object" && "reason" in error && "status" in error &&
      typeof (error as { reason: unknown }).reason === "string" &&
      typeof (error as { status: unknown }).status === "number") {
    return error as AcademicError;
  }
  const dbError = error as { code?: string; cause?: { code?: string } };
  const code = dbError.code ?? dbError.cause?.code;
  if (code === "23505" || code === "23P01") return new AcademicError("conflict", 409);
  if (code === "23503" || code === "23514" || code === "22P02") return new AcademicError("invalid_request", 400);
  return null;
}