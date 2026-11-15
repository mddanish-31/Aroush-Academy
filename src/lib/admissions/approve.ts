import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { eq, or, sql } from "drizzle-orm";
import type { db as defaultAppDb } from "../../db";
import { registrations } from "../../db/schema/admissions";
import { audit_logs } from "../../db/schema/audit";
import { password_reset_tokens, users } from "../../db/schema/identity";
import { parent_student_links, parents, students } from "../../db/schema/people";
import { hashPassword } from "../auth/password";

type DbClient = typeof defaultAppDb;

async function resolveDb(db?: DbClient): Promise<DbClient> {
  if (db) {
    return db;
  }
  const { db: appDb } = await import("../../db");
  return appDb;
}

function getIstDateInfo(date = new Date()) {
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(date.getTime() + istOffsetMs);
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(istDate.getUTCDate()).padStart(2, "0");
  const dateStr = `${year}-${month}-${day}`;
  return { year, dateStr };
}

export interface ApproveResult {
  ok: boolean;
  studentId: string;
  studentUserId: string;
  admissionNumber: string;
  activationToken?: string;
}

export async function approveRegistration(
  registrationId: string,
  adminUserId: string,
  db?: DbClient,
  parentUserId?: string,
): Promise<ApproveResult> {
  const targetDb = await resolveDb(db);

  return await targetDb.transaction(async (tx) => {
    const adminRows = await tx
      .select({ id: users.id, name: users.name, role: users.role })
      .from(users)
      .where(eq(users.id, adminUserId))
      .limit(1);

    if (adminRows.length === 0) {
      throw new Error("Admin user not found");
    }
    const adminUser = adminRows[0];

    const regRows = await tx
      .select()
      .from(registrations)
      .where(eq(registrations.id, registrationId))
      .for("update")
      .limit(1);

    if (regRows.length === 0) {
      throw new Error("Registration not found");
    }

    const registration = regRows[0];
    if (registration.status !== "pending") {
      throw new Error("Registration is not pending");
    }

    if (adminUser.role !== "academy-admin") throw new Error("Forbidden");
    const guardianPhone = registration.guardian_phone ?? (registration.guardian_identifier.startsWith("+91") ? registration.guardian_identifier : null);
    if (!guardianPhone) throw new Error("Guardian phone requires administrator review and backfill");
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${guardianPhone}))`);

    const existingStudentUser = await tx
      .select({ id: users.id })
      .from(users)
      .where(or(eq(users.identifier, registration.identifier), eq(users.email, registration.identifier), eq(users.phone, registration.identifier)))
      .limit(1);

    if (existingStudentUser.length > 0) {
      throw new Error("Student identifier already taken");
    }

    const existingGuardianUsers = await tx
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(or(eq(users.identifier, guardianPhone), eq(users.phone, guardianPhone)));

    if (existingGuardianUsers.some((user) => user.role !== "parent")) throw new Error("Guardian identity collision requires review");
    if (existingGuardianUsers.length && (!parentUserId || existingGuardianUsers.some((user) => user.id !== parentUserId))) throw new Error("Select the reviewed parent account");

    const { year: istYear, dateStr: istDateStr } = getIstDateInfo();

    const seqResult = await tx.execute(sql`
      INSERT INTO number_sequences (kind, year, last_value, updated_at)
      VALUES ('admission', ${istYear}, 1, now())
      ON CONFLICT (kind, year)
      DO UPDATE SET last_value = number_sequences.last_value + 1, updated_at = now()
      RETURNING last_value
    `);

    const nextVal = Number((seqResult.rows[0] as { last_value: number | string }).last_value);
    const padded = String(nextVal).padStart(4, "0");
    const admissionNumber = `AA-${istYear}-${padded}`;

    const [studentUser] = await tx
      .insert(users)
      .values({
        identifier: registration.identifier,
        email: registration.identifier.includes("@") ? registration.identifier : null,
        phone: registration.identifier.startsWith("+91") ? registration.identifier : null,
        password_hash: registration.password_hash,
        role: "student",
        name: registration.name,
        status: "active",
      })
      .returning({ id: users.id, name: users.name });

    const guardianEmail = registration.guardian_email;

    const [studentRow] = await tx
      .insert(students)
      .values({
        user_id: studentUser.id,
        admission_number: admissionNumber,
        name: registration.name,
        class_id: registration.class_id,
        board_id: registration.board_id,
        guardian_name: registration.guardian_name,
        guardian_phone: guardianPhone,
        guardian_email: guardianEmail,
        joining_date: istDateStr,
        status: "active",
      })
      .returning({ id: students.id });

    let parentId: string;
    let activationToken: string | undefined;
    if (parentUserId) {
      const [existingUser] = await tx.select({ id: users.id, role: users.role, phone: users.phone })
        .from(users).where(eq(users.id, parentUserId)).for("update").limit(1);
      if (!existingUser || existingUser.role !== "parent" || existingUser.phone !== guardianPhone) throw new Error("Reviewed parent does not match guardian phone");
      const parentRows = await tx
        .select({ id: parents.id })
        .from(parents)
        .where(eq(parents.user_id, existingUser.id))
        .limit(1);

      if (!parentRows.length) throw new Error("Reviewed parent profile is missing");
      parentId = parentRows[0].id;
    } else {
      const existingContact = await tx.select({ id: parents.id }).from(parents).where(eq(parents.phone, guardianPhone)).limit(1);
      if (existingContact.length) throw new Error("Select the reviewed parent account");
      activationToken = randomBytes(32).toString("hex");
      const [newParentUser] = await tx
        .insert(users)
        .values({
          identifier: guardianPhone,
          email: null,
          phone: guardianPhone,
          password_hash: await hashPassword(randomBytes(32).toString("hex")),
          role: "parent",
          name: registration.guardian_name,
          status: "inactive",
        })
        .returning({ id: users.id });
      await tx.insert(password_reset_tokens).values({
        user_id: newParentUser.id,
        token_hash: createHash("sha256").update(activationToken).digest("hex"),
        purpose: "activation",
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      const [newParent] = await tx
        .insert(parents)
        .values({
          user_id: newParentUser.id,
          name: registration.guardian_name,
          phone: guardianPhone,
          email: guardianEmail,
        })
        .returning({ id: parents.id });
      parentId = newParent.id;
    }

    await tx.insert(parent_student_links).values({
      parent_id: parentId,
      student_id: studentRow.id,
      relationship: "parent",
      is_verified: true,
    });

    await tx
      .update(registrations)
      .set({
        status: "approved",
        approved_user_id: studentUser.id,
        reviewed_by_id: adminUserId,
        reviewed_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(registrations.id, registrationId));

    await tx.insert(audit_logs).values({
      performed_by_id: adminUserId,
      performed_by_name: adminUser.name,
      actor_role: adminUser.role,
      action: "registration_approved",
      action_type: "APPROVE",
      category: "admissions",
      target: `registration:${registrationId}`,
      entity_type: "registration",
      entity_id: registrationId,
      details: `Approved registration ${registrationId} for student ${registration.name} (${admissionNumber})`,
      outcome: "SUCCESS",
      source_portal: "admin",
    });

    return {
      ok: true,
      studentId: studentRow.id,
      studentUserId: studentUser.id,
      admissionNumber,
      activationToken,
    };
  });
}

export async function rejectRegistration(
  registrationId: string,
  adminUserId: string,
  reason: string,
  db?: DbClient
): Promise<{ ok: boolean }> {
  if (!reason || typeof reason !== "string" || reason.trim().length < 5) {
    throw new Error("Rejection reason must be at least 5 characters");
  }

  const targetDb = await resolveDb(db);

  return await targetDb.transaction(async (tx) => {
    const adminRows = await tx
      .select({ id: users.id, name: users.name, role: users.role })
      .from(users)
      .where(eq(users.id, adminUserId))
      .limit(1);

    if (adminRows.length === 0) {
      throw new Error("Admin user not found");
    }
    const adminUser = adminRows[0];

    const regRows = await tx
      .select()
      .from(registrations)
      .where(eq(registrations.id, registrationId))
      .for("update")
      .limit(1);

    if (regRows.length === 0) {
      throw new Error("Registration not found");
    }

    const registration = regRows[0];
    if (registration.status !== "pending") {
      throw new Error("Registration is not pending");
    }

    await tx
      .update(registrations)
      .set({
        status: "rejected",
        rejection_reason: reason.trim(),
        reviewed_by_id: adminUserId,
        reviewed_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(registrations.id, registrationId));

    await tx.insert(audit_logs).values({
      performed_by_id: adminUserId,
      performed_by_name: adminUser.name,
      actor_role: adminUser.role,
      action: "registration_rejected",
      action_type: "REJECT",
      category: "admissions",
      target: `registration:${registrationId}`,
      entity_type: "registration",
      entity_id: registrationId,
      details: `Rejected registration ${registrationId}: ${reason.trim()}`,
      outcome: "SUCCESS",
      source_portal: "admin",
    });

    return { ok: true };
  });
}
