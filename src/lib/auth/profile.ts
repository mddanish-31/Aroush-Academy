import "server-only";
import { and, asc, eq } from "drizzle-orm";
import type { db as appDb } from "../../db";
import { parents, parent_student_links, students, teachers } from "../../db/schema/people";
import { isValidAuthUser } from "./authGuard";
import type { ServerIdentity } from "./profileTypes";
import { getSessionUser } from "./session";

export async function getCurrentIdentity(
  token: string,
  database?: typeof appDb,
): Promise<ServerIdentity | null> {
  const sessionUser = await getSessionUser(token, database);
  if (!isValidAuthUser(sessionUser)) return null;

  const identity: ServerIdentity = {
    id: sessionUser.id,
    role: sessionUser.role,
    name: sessionUser.name,
    identifier: sessionUser.identifier,
    profile: null,
    children: [],
    profileStatus: "ready",
  };
  if (identity.role === "academy-admin" || identity.role === "developer") return identity;

  const db = database ?? (await import("../../db")).db;
  if (identity.role === "student") {
    const [profile] = await db
      .select({ id: students.id, name: students.name, admissionNumber: students.admission_number })
      .from(students)
      .where(eq(students.user_id, identity.id))
      .limit(1);
    identity.profile = profile ?? null;
  } else if (identity.role === "teacher") {
    const [profile] = await db
      .select({ id: teachers.id, name: teachers.name })
      .from(teachers)
      .where(eq(teachers.user_id, identity.id))
      .limit(1);
    identity.profile = profile ?? null;
  } else {
    const [profile] = await db
      .select({ id: parents.id, name: parents.name })
      .from(parents)
      .where(eq(parents.user_id, identity.id))
      .limit(1);
    identity.profile = profile ?? null;
    if (profile) {
      identity.children = await db
        .select({ id: students.id, name: students.name, admissionNumber: students.admission_number })
        .from(parent_student_links)
        .innerJoin(students, eq(parent_student_links.student_id, students.id))
        .where(and(
          eq(parent_student_links.parent_id, profile.id),
          eq(parent_student_links.is_verified, true),
        ))
        .orderBy(asc(students.name), asc(students.id));
    }
  }

  if (!identity.profile || (identity.role === "parent" && identity.children.length === 0)) {
    identity.profileStatus = "missing";
  }
  return identity;
}
