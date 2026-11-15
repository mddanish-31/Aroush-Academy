import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { eq, or } from "drizzle-orm";
import type { db as AppDb } from "../../db";
import { audit_logs } from "../../db/schema/audit";
import { password_reset_tokens, users } from "../../db/schema/identity";
import { teachers } from "../../db/schema/people";
import { normalizeIdentifier } from "./identifier";
import { hashPassword } from "./password";

export async function provisionTeacher(db: typeof AppDb, adminId: string, name: unknown, email: unknown, phone: unknown) {
  if (typeof name !== "string" || name.trim().length < 2 || name.length > 100 ||
      typeof email !== "string" || email.length > 255 || !email.includes("@") ||
      (phone != null && typeof phone !== "string")) return null;
  const normalizedEmail = normalizeIdentifier(email);
  const normalizedPhone = phone ? normalizeIdentifier(phone) : null;
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
      (phone && !normalizedPhone?.startsWith("+91")) || normalizedPhone === normalizedEmail) return null;
  const raw = randomBytes(32).toString("hex");
  const passwordHash = await hashPassword(randomBytes(32).toString("hex"));
  return db.transaction(async (tx) => {
    const [admin] = await tx.select({ name: users.name, role: users.role }).from(users).where(eq(users.id, adminId)).limit(1);
    if (!admin || admin.role !== "academy-admin") return null;
    const collision = await tx.select({ id: users.id }).from(users)
      .where(or(eq(users.identifier, normalizedEmail), eq(users.email, normalizedEmail),
        eq(users.phone, normalizedEmail), normalizedPhone ? eq(users.identifier, normalizedPhone) : undefined,
        normalizedPhone ? eq(users.phone, normalizedPhone) : undefined)).limit(1);
    if (collision.length) return null;
    const [account] = await tx.insert(users).values({ identifier: normalizedEmail, email: normalizedEmail,
      phone: normalizedPhone, password_hash: passwordHash, role: "teacher", name: name.trim(), status: "inactive" }).returning({ id: users.id });
    await tx.insert(teachers).values({ user_id: account.id, name: name.trim(), email: normalizedEmail, phone: normalizedPhone });
    await tx.insert(password_reset_tokens).values({ user_id: account.id, token_hash: createHash("sha256").update(raw).digest("hex"),
      purpose: "activation", expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) });
    await tx.insert(audit_logs).values({ performed_by_id: adminId, performed_by_name: admin.name, actor_role: admin.role,
      action: "teacher_provisioned", action_type: "CREATE", category: "auth", target: `user:${account.id}`,
      details: "Teacher account created inactive; 24-hour activation handoff issued", source_portal: "admin" });
    return { userId: account.id, activationToken: raw };
  });
}
