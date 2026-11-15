import "server-only";
import { and, eq, gte, or, sql } from "drizzle-orm";
import type { db as defaultAppDb } from "../../db";
import { registrations } from "../../db/schema/admissions";
import { academic_boards, academic_classes } from "../../db/schema/taxonomy";
import { login_attempts, users } from "../../db/schema/identity";
import { normalizeIdentifier } from "../auth/identifier";
import { hashPassword } from "../auth/password";

type DbClient = typeof defaultAppDb;

async function resolveDb(db?: DbClient): Promise<DbClient> {
  if (db) {
    return db;
  }
  const { db: appDb } = await import("../../db");
  return appDb;
}

export interface RegisterStudentInput {
  name: string;
  identifier: string;
  password: string;
  class_id: string;
  board_id: string;
  guardian_name: string;
  guardian_phone: string;
  guardian_email?: string | null;
}

export interface RegisterResult {
  ok: boolean;
  registrationId?: string;
  error?: string;
}

export async function registerStudent(
  input: RegisterStudentInput,
  ip?: string | null,
  db?: DbClient
): Promise<RegisterResult> {
  const targetDb = await resolveDb(db);

  if (
    !input ||
    typeof input !== "object" ||
    typeof input.name !== "string" ||
    typeof input.guardian_name !== "string" ||
    typeof input.password !== "string" ||
    typeof input.guardian_phone !== "string" ||
    typeof input.class_id !== "string" ||
    typeof input.board_id !== "string"
  ) {
    return { ok: false, error: "Invalid registration payload" };
  }

  const trimmedStudentName = input.name.trim();
  const trimmedGuardianName = input.guardian_name.trim();

  if (trimmedStudentName.length < 2 || trimmedStudentName.length > 100) {
    return { ok: false, error: "Invalid registration details" };
  }

  if (trimmedGuardianName.length < 2 || trimmedGuardianName.length > 100) {
    return { ok: false, error: "Invalid registration details" };
  }

  if (input.password.length < 12 || input.password.length > 200) {
    return { ok: false, error: "Invalid registration details" };
  }

  const studentIdentifier = normalizeIdentifier(input.identifier || "");
  const guardianIdentifier = normalizeIdentifier(input.guardian_phone);

  if (!studentIdentifier || (studentIdentifier.includes("@") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentIdentifier)) ||
      !guardianIdentifier?.startsWith("+91") || input.guardian_phone.length > 20) {
    return { ok: false, error: "Invalid registration details" };
  }

  if (studentIdentifier === guardianIdentifier) {
    return { ok: false, error: "Invalid registration details" };
  }

  const clientIp = ip && ip.trim() !== "" ? ip.trim() : "127.0.0.1";
  const rateLimitIdentifier = "register:" + clientIp;
  const oneHourAgo = sql`now() - interval '1 hour'`;

  const ipCountResult = await targetDb
    .select({ count: sql<number>`count(*)::int` })
    .from(login_attempts)
    .where(
      and(
        eq(login_attempts.identifier, rateLimitIdentifier),
        gte(login_attempts.created_at, oneHourAgo)
      )
    );

  const ipAttempts = ipCountResult[0]?.count ?? 0;
  if (ipAttempts >= 5) {
    return { ok: false, error: "Too many registration attempts. Please try again later." };
  }

  const classRows = await targetDb
    .select({ id: academic_classes.id, name: academic_classes.name })
    .from(academic_classes)
    .where(and(eq(academic_classes.id, input.class_id), eq(academic_classes.is_active, true)))
    .limit(1);

  if (classRows.length === 0) {
    return { ok: false, error: "Invalid registration details" };
  }

  const boardRows = await targetDb
    .select({ id: academic_boards.id })
    .from(academic_boards)
    .where(and(eq(academic_boards.id, input.board_id), eq(academic_boards.is_active, true)))
    .limit(1);

  if (boardRows.length === 0) {
    return { ok: false, error: "Invalid registration details" };
  }

  const existingUsers = await targetDb
    .select({ identifier: users.identifier, email: users.email, phone: users.phone, role: users.role })
    .from(users)
    .where(or(eq(users.identifier, studentIdentifier), eq(users.email, studentIdentifier), eq(users.phone, studentIdentifier), eq(users.identifier, guardianIdentifier), eq(users.phone, guardianIdentifier)));

  for (const existingUser of existingUsers) {
    if ([existingUser.identifier, existingUser.email, existingUser.phone].includes(studentIdentifier)) {
      return { ok: false, error: "Registration request could not be processed" };
    }
    if (existingUser.role !== "parent" && [existingUser.identifier, existingUser.phone].includes(guardianIdentifier)) {
      return { ok: false, error: "Registration request could not be processed" };
    }
  }

  const pendingRegistrations = await targetDb
    .select({ id: registrations.id })
    .from(registrations)
    .where(
      and(
        eq(registrations.status, "pending"),
        or(
          eq(registrations.identifier, studentIdentifier),
          eq(registrations.identifier, guardianIdentifier),
          eq(registrations.guardian_identifier, studentIdentifier)
        )
      )
    )
    .limit(1);

  if (pendingRegistrations.length > 0) {
    return { ok: false, error: "Registration request could not be processed" };
  }

  const guardianEmail = input.guardian_email ? normalizeIdentifier(input.guardian_email) : null;
  if (input.guardian_email != null && (typeof input.guardian_email !== "string" || !guardianEmail?.includes("@") ||
    guardianEmail.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guardianEmail))) {
    return { ok: false, error: "Invalid registration details" };
  }
  const studentPasswordHash = await hashPassword(input.password);

  const created = await targetDb.transaction(async (tx) => {
    const [row] = await tx.insert(registrations).values({
      name: trimmedStudentName,
      identifier: studentIdentifier,
      password_hash: studentPasswordHash,
      role: "student",
      class_id: input.class_id,
      board_id: input.board_id,
      guardian_name: trimmedGuardianName,
      guardian_identifier: guardianIdentifier,
      guardian_email: guardianEmail,
      guardian_phone: guardianIdentifier,
      class_grade: classRows[0].name,
      ward_name: trimmedStudentName,
      status: "pending",
    }).returning({ id: registrations.id });
    await tx.insert(login_attempts).values({
      identifier: rateLimitIdentifier,
      ip_address: clientIp,
      success: true,
    });
    return row;
  });

  return { ok: true, registrationId: created.id };
}
