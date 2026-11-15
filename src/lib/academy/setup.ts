import "server-only";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { audit_logs } from "@/db/schema/audit";
import { batches, enrollments } from "@/db/schema/cohorts";
import { teacher_subjects, students, teachers } from "@/db/schema/people";
import { academic_boards, academic_classes, academic_subjects } from "@/db/schema/taxonomy";

export class SetupError extends Error {
  constructor(public reason: "invalid_request" | "conflict", public status: 400 | 409) { super(reason); }
}

const invalid = (): never => { throw new SetupError("invalid_request", 400); };
const conflict = (): never => { throw new SetupError("conflict", 409); };
const uuid = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const label = (value: unknown, max = 100): value is string => typeof value === "string" && value.trim().length >= 2 && value.trim().length <= max;
const code = (value: unknown): value is string => typeof value === "string" && /^[A-Za-z0-9_-]{2,50}$/.test(value);
const version = sql<string>`${batches.updated_at}::text`;

export async function listSetup() {
  const [classes, boards, subjects, faculty, qualifications, groups, pupils, registrations] = await Promise.all([
    db.select({ id: academic_classes.id, name: academic_classes.name, code: academic_classes.code, is_active: academic_classes.is_active }).from(academic_classes).orderBy(asc(academic_classes.name)),
    db.select({ id: academic_boards.id, name: academic_boards.name, code: academic_boards.code, is_active: academic_boards.is_active }).from(academic_boards).orderBy(asc(academic_boards.name)),
    db.select({ id: academic_subjects.id, name: academic_subjects.name, code: academic_subjects.code, is_active: academic_subjects.is_active }).from(academic_subjects).orderBy(asc(academic_subjects.name)),
    db.select({ id: teachers.id, name: teachers.name, status: teachers.status }).from(teachers).orderBy(asc(teachers.name)),
    db.select().from(teacher_subjects),
    db.select({ id: batches.id, name: batches.name, class_id: batches.class_id, board_id: batches.board_id, subject_id: batches.subject_id, teacher_id: batches.teacher_id, capacity: batches.capacity, status: batches.status, updated_at: version }).from(batches).orderBy(asc(batches.name)),
    db.select({ id: students.id, name: students.name, admission_number: students.admission_number, class_id: students.class_id, board_id: students.board_id, status: students.status, updated_at: sql<string>`${students.updated_at}::text` }).from(students).orderBy(asc(students.name)),
    db.select({ id: enrollments.id, student_id: enrollments.student_id, batch_id: enrollments.batch_id, status: enrollments.status, monthly_fee_paise: enrollments.monthly_fee_paise, updated_at: sql<string>`${enrollments.updated_at}::text` }).from(enrollments),
  ]);
  return { classes, boards, subjects, teachers: faculty, teacherSubjects: qualifications, batches: groups, students: pupils, enrollments: registrations };
}

type Payload = Record<string, unknown>;

export async function createSetup(input: Payload, admin: { id: string; name: string }) {
  const kind = input.kind;
  if (kind === "class" || kind === "board" || kind === "subject") {
    if (!label(input.name) || !code(input.code)) return invalid();
    const name = input.name.trim();
    const normalizedCode = input.code.toUpperCase();
    const table = kind === "class" ? academic_classes : kind === "board" ? academic_boards : academic_subjects;
    return db.transaction(async (tx) => {
      const [item] = await tx.insert(table).values({ name, code: normalizedCode }).returning({ id: table.id, name: table.name });
      await tx.insert(audit_logs).values({ performed_by_id: admin.id, performed_by_name: admin.name, actor_role: "academy-admin", action: `setup_${kind}_created`, action_type: "CREATE", category: "academic", target: `${kind}:${item.id}`, details: "Academic record created", entity_type: kind, entity_id: item.id, source_portal: "admin" });
      return item;
    });
  }
  if (kind === "teacherSubject") {
    if (!uuid(input.teacherId) || !uuid(input.subjectId)) return invalid();
    const teacherId = input.teacherId;
    const subjectId = input.subjectId;
    return db.transaction(async (tx) => {
      const [teacher] = await tx.select({ id: teachers.id }).from(teachers).where(and(eq(teachers.id, teacherId), eq(teachers.status, "active"))).limit(1);
      const [subject] = await tx.select({ id: academic_subjects.id }).from(academic_subjects).where(and(eq(academic_subjects.id, subjectId), eq(academic_subjects.is_active, true))).limit(1);
      if (!teacher || !subject) return invalid();
      const [item] = await tx.insert(teacher_subjects).values({ teacher_id: teacher.id, subject_id: subject.id }).returning();
      await tx.insert(audit_logs).values({ performed_by_id: admin.id, performed_by_name: admin.name, actor_role: "academy-admin", action: "setup_qualification_created", action_type: "CREATE", category: "academic", target: `teacher:${teacher.id}`, details: `Subject qualification ${subject.id}`, entity_type: "teacher", entity_id: teacher.id, source_portal: "admin" });
      return item;
    });
  }
  if (kind === "batch") {
    if (!label(input.name, 255) || !uuid(input.classId) || !uuid(input.boardId) || !uuid(input.subjectId) || !uuid(input.teacherId) || !Number.isInteger(input.capacity) || Number(input.capacity) < 1 || Number(input.capacity) > 500) return invalid();
    const name = input.name.trim();
    const classId = input.classId;
    const boardId = input.boardId;
    const subjectId = input.subjectId;
    const teacherId = input.teacherId;
    return db.transaction(async (tx) => {
      const [klass] = await tx.select({ id: academic_classes.id }).from(academic_classes).where(and(eq(academic_classes.id, classId), eq(academic_classes.is_active, true)));
      const [board] = await tx.select({ id: academic_boards.id }).from(academic_boards).where(and(eq(academic_boards.id, boardId), eq(academic_boards.is_active, true)));
      const [subject] = await tx.select({ id: academic_subjects.id }).from(academic_subjects).where(and(eq(academic_subjects.id, subjectId), eq(academic_subjects.is_active, true)));
      const [teacher] = await tx.select({ id: teachers.id }).from(teachers).where(and(eq(teachers.id, teacherId), eq(teachers.status, "active")));
      const [qualified] = await tx.select().from(teacher_subjects).where(and(eq(teacher_subjects.teacher_id, teacherId), eq(teacher_subjects.subject_id, subjectId))).for("share");
      if (!klass || !board || !subject || !teacher || !qualified) return invalid();
      const [item] = await tx.insert(batches).values({ name, class_id: klass.id, board_id: board.id, subject_id: subject.id, teacher_id: teacher.id, capacity: Number(input.capacity), monthly_fee_paise: 0 }).returning({ id: batches.id, name: batches.name, updated_at: version });
      await tx.insert(audit_logs).values({ performed_by_id: admin.id, performed_by_name: admin.name, actor_role: "academy-admin", action: "setup_batch_created", action_type: "CREATE", category: "academic", target: `batch:${item.id}`, details: "Batch assigned to teacher", entity_type: "batch", entity_id: item.id, source_portal: "admin" });
      return item;
    });
  }
  if (kind === "enrollment") {
    if (!uuid(input.studentId) || !uuid(input.batchId) || !Number.isSafeInteger(input.monthlyFeePaise) || Number(input.monthlyFeePaise) < 0 || Number(input.monthlyFeePaise) > 100000000) return invalid();
    const studentId = input.studentId;
    const batchId = input.batchId;
    return db.transaction(async (tx) => {
      const [student] = await tx.select({ class_id: students.class_id, board_id: students.board_id, status: students.status }).from(students).where(eq(students.id, studentId)).for("update");
      const [batch] = await tx.select({ class_id: batches.class_id, board_id: batches.board_id, status: batches.status }).from(batches).where(eq(batches.id, batchId)).for("share");
      if (!student || student.status !== "active" || !batch || batch.status !== "active" || student.class_id !== batch.class_id || student.board_id !== batch.board_id) return invalid();
      const [item] = await tx.insert(enrollments).values({ student_id: studentId, batch_id: batchId, monthly_fee_paise: Number(input.monthlyFeePaise) }).returning({ id: enrollments.id });
      await tx.insert(audit_logs).values({ performed_by_id: admin.id, performed_by_name: admin.name, actor_role: "academy-admin", action: "setup_enrollment_created", action_type: "CREATE", category: "academic", target: `enrollment:${item.id}`, details: "Student enrolled in batch", entity_type: "enrollment", entity_id: item.id, source_portal: "admin" });
      return item;
    });
  }
  return invalid();
}

export async function updateSetup(input: Payload, admin: { id: string; name: string }) {
  if (input.kind === "teacherSubject") {
    if (!uuid(input.teacherId) || !uuid(input.subjectId) || input.version !== "present" || input.status !== "removed") return invalid();
    const teacherId = input.teacherId;
    const subjectId = input.subjectId;
    return db.transaction(async (tx) => {
      const [qualification] = await tx.select().from(teacher_subjects).where(and(eq(teacher_subjects.teacher_id, teacherId), eq(teacher_subjects.subject_id, subjectId))).for("update");
      if (!qualification) return conflict();
      const [assigned] = await tx.select({ id: batches.id }).from(batches).where(and(eq(batches.teacher_id, teacherId), eq(batches.subject_id, subjectId), inArray(batches.status, ["active", "upcoming"]))).limit(1);
      if (assigned) return conflict();
      await tx.delete(teacher_subjects).where(and(eq(teacher_subjects.teacher_id, teacherId), eq(teacher_subjects.subject_id, subjectId)));
      await tx.insert(audit_logs).values({ performed_by_id: admin.id, performed_by_name: admin.name, actor_role: "academy-admin", action: "setup_qualification_removed", action_type: "DELETE", category: "academic", target: `teacher:${teacherId}`, details: `Subject qualification ${subjectId} removed`, entity_type: "teacher", entity_id: teacherId, source_portal: "admin" });
      return { teacher_id: teacherId, subject_id: subjectId };
    });
  }
  if (!uuid(input.id) || typeof input.version !== "string" || input.version.length > 100) return invalid();
  if (input.kind === "class" || input.kind === "board" || input.kind === "subject") {
    if (input.version !== "active" || input.status !== "inactive") return invalid();
    const kind = input.kind;
    const table = kind === "class" ? academic_classes : kind === "board" ? academic_boards : academic_subjects;
    return db.transaction(async (tx) => {
      const [item] = await tx.update(table).set({ is_active: false }).where(and(eq(table.id, input.id as string), eq(table.is_active, true))).returning({ id: table.id });
      if (!item) return conflict();
      await tx.insert(audit_logs).values({ performed_by_id: admin.id, performed_by_name: admin.name, actor_role: "academy-admin", action: `setup_${kind}_archived`, action_type: "UPDATE", category: "academic", target: `${kind}:${item.id}`, details: "Academic record deactivated", entity_type: kind, entity_id: item.id, source_portal: "admin" });
      return item;
    });
  }
  if (input.kind === "teacher") {
    if (input.version !== "active" || input.status !== "inactive") return invalid();
    return db.transaction(async (tx) => {
      const [item] = await tx.update(teachers).set({ status: "inactive", updated_at: sql`clock_timestamp()` }).where(and(eq(teachers.id, input.id as string), eq(teachers.status, "active"))).returning({ id: teachers.id });
      if (!item) return conflict();
      await tx.insert(audit_logs).values({ performed_by_id: admin.id, performed_by_name: admin.name, actor_role: "academy-admin", action: "setup_teacher_deactivated", action_type: "UPDATE", category: "academic", target: `teacher:${item.id}`, details: "Teacher profile deactivated", entity_type: "teacher", entity_id: item.id, source_portal: "admin" });
      return item;
    });
  }
  if (input.kind === "enrollment") {
    if (input.status !== "paused" && input.status !== "completed") return invalid();
    return db.transaction(async (tx) => {
      const [item] = await tx.update(enrollments).set({ status: input.status as "paused" | "completed", updated_at: sql`clock_timestamp()` }).where(and(eq(enrollments.id, input.id as string), sql`${enrollments.updated_at}::text = ${input.version}`, eq(enrollments.status, "active"))).returning({ id: enrollments.id });
      if (!item) return conflict();
      await tx.insert(audit_logs).values({ performed_by_id: admin.id, performed_by_name: admin.name, actor_role: "academy-admin", action: "setup_enrollment_updated", action_type: "UPDATE", category: "academic", target: `enrollment:${item.id}`, details: `Enrollment ${input.status}`, entity_type: "enrollment", entity_id: item.id, source_portal: "admin" });
      return item;
    });
  }
  if (input.kind === "student") {
    if (!uuid(input.classId) || !uuid(input.boardId) || (input.status !== undefined && input.status !== "inactive")) return invalid();
    const studentId = input.id;
    const classId = input.classId;
    const boardId = input.boardId;
    return db.transaction(async (tx) => {
      const [klass] = await tx.select({ id: academic_classes.id }).from(academic_classes).where(and(eq(academic_classes.id, classId), eq(academic_classes.is_active, true)));
      const [board] = await tx.select({ id: academic_boards.id }).from(academic_boards).where(and(eq(academic_boards.id, boardId), eq(academic_boards.is_active, true)));
      if (!klass || !board) return invalid();
      const [item] = await tx.update(students).set({ class_id: classId, board_id: boardId, status: input.status === "inactive" ? "inactive" : "active", updated_at: sql`clock_timestamp()` })
        .where(and(eq(students.id, studentId), sql`${students.updated_at}::text = ${input.version}`)).returning({ id: students.id, updated_at: sql<string>`${students.updated_at}::text` });
      if (!item) return conflict();
      await tx.insert(audit_logs).values({ performed_by_id: admin.id, performed_by_name: admin.name, actor_role: "academy-admin", action: "setup_student_updated", action_type: "UPDATE", category: "academic", target: `student:${item.id}`, details: input.status === "inactive" ? "Student deactivated" : "Student class and board updated", entity_type: "student", entity_id: item.id, source_portal: "admin" });
      return item;
    });
  }
  if (input.kind === "batch") {
    if ((input.status !== "archived" && !uuid(input.teacherId)) || (input.teacherId !== undefined && !uuid(input.teacherId))) return invalid();
    const batchId = input.id;
    return db.transaction(async (tx) => {
      const [current] = await tx.select({ teacher_id: batches.teacher_id, subject_id: batches.subject_id, status: batches.status }).from(batches).where(eq(batches.id, batchId)).limit(1);
      if (!current) return invalid();
      if (current.status === "archived") return conflict();
      if (input.teacherId) {
        const [qualified] = await tx.select().from(teacher_subjects).innerJoin(teachers, eq(teachers.id, teacher_subjects.teacher_id)).where(and(eq(teacher_subjects.teacher_id, input.teacherId as string), eq(teacher_subjects.subject_id, current.subject_id), eq(teachers.status, "active"))).limit(1).for("share");
        if (!qualified) return invalid();
      }
      const [item] = await tx.update(batches).set({ teacher_id: (input.teacherId as string) || current.teacher_id, status: input.status === "archived" ? "archived" : current.status, updated_at: sql`clock_timestamp()` }).where(and(eq(batches.id, batchId), sql`${batches.updated_at}::text = ${input.version}`)).returning({ id: batches.id, updated_at: version });
      if (!item) return conflict();
      await tx.insert(audit_logs).values({ performed_by_id: admin.id, performed_by_name: admin.name, actor_role: "academy-admin", action: "setup_batch_updated", action_type: "UPDATE", category: "academic", target: `batch:${item.id}`, details: input.status === "archived" ? "Batch archived" : "Assigned teacher changed", diff: { previousTeacherId: current.teacher_id, newTeacherId: input.teacherId ?? current.teacher_id }, entity_type: "batch", entity_id: item.id, source_portal: "admin" });
      return item;
    });
  }
  return invalid();
}

export function setupDatabaseError(error: unknown) {
  if (error instanceof SetupError) return error;
  const dbError = error as { code?: string; cause?: { code?: string } };
  if (dbError.code === "23505" || dbError.cause?.code === "23505") return new SetupError("conflict", 409);
  if (dbError.code === "23503" || dbError.cause?.code === "23503") return new SetupError("invalid_request", 400);
  return null;
}
