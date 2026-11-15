import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gte, isNull, sql } from "drizzle-orm";
import type { db as AppDb } from "../../db";
import { audit_logs } from "../../db/schema/audit";
import { login_attempts, password_reset_tokens, sessions, users } from "../../db/schema/identity";
import { hashPassword, verifyPassword } from "./password";

type Db = typeof AppDb;
const digest = (value: string) => createHash("sha256").update(value).digest("hex");
const validPassword = (value: unknown): value is string => typeof value === "string" && value.length >= 12 && value.length <= 200;

export async function limitCredentialAttempts(db: Db, key: string, ip: string, max = 5) {
  const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(login_attempts)
    .where(and(eq(login_attempts.identifier, key), gte(login_attempts.created_at, sql`now() - interval '1 hour'`)));
  if ((row?.count ?? 0) >= max) return false;
  await db.insert(login_attempts).values({ identifier: key, ip_address: ip, success: false });
  return true;
}

export async function changePassword(db: Db, userId: string, current: unknown, next: unknown, ip: string) {
  if (!validPassword(next) || typeof current !== "string" || current.length > 200) return false;
  if (!await limitCredentialAttempts(db, `change:${userId}`, ip)) return false;
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user || !await verifyPassword(current, user.password_hash)) return false;
  const passwordHash = await hashPassword(next);
  await db.transaction(async (tx) => {
    await tx.update(users).set({ password_hash: passwordHash, updated_at: new Date() }).where(eq(users.id, userId));
    await tx.update(password_reset_tokens).set({ used_at: new Date() })
      .where(and(eq(password_reset_tokens.user_id, userId), isNull(password_reset_tokens.used_at)));
    await tx.delete(sessions).where(eq(sessions.user_id, userId));
    await tx.insert(audit_logs).values({ performed_by_id: userId, performed_by_name: user.name, actor_role: user.role,
      action: "password_changed", action_type: "UPDATE", category: "auth", target: `user:${userId}`,
      details: "Account password changed; sessions revoked", source_portal: "account" });
  });
  return true;
}

export async function issueRecovery(db: Db, adminId: string, adminPassword: unknown, userId: string, ip: string, purpose: "recovery" | "activation" = "recovery") {
  if (typeof adminPassword !== "string" || adminPassword.length > 200) return null;
  if (!await limitCredentialAttempts(db, `handoff:${adminId}`, ip)) return null;
  const [admin] = await db.select().from(users).where(eq(users.id, adminId)).limit(1);
  if (!admin || admin.role !== "academy-admin" || admin.status !== "active" || !await verifyPassword(adminPassword, admin.password_hash)) return null;
  const raw = randomBytes(32).toString("hex");
  const issued = await db.transaction(async (tx) => {
    const [target] = await tx.select({ id: users.id, status: users.status }).from(users).where(eq(users.id, userId)).for("update").limit(1);
    if (!target || target.status !== (purpose === "activation" ? "inactive" : "active")) return false;
    await tx.update(password_reset_tokens).set({ used_at: new Date() })
      .where(and(eq(password_reset_tokens.user_id, userId), eq(password_reset_tokens.purpose, purpose), isNull(password_reset_tokens.used_at)));
    await tx.insert(password_reset_tokens).values({ user_id: userId, token_hash: digest(raw), purpose,
      expires_at: new Date(Date.now() + (purpose === "activation" ? 24 * 60 : 30) * 60 * 1000) });
    await tx.insert(audit_logs).values({ performed_by_id: adminId, performed_by_name: admin.name, actor_role: admin.role,
      action: purpose === "recovery" ? "recovery_handoff_created" : "activation_reissued", action_type: "CREATE", category: "auth", target: `user:${userId}`,
      details: `Administrator reauthenticated and created a manual ${purpose} handoff; identity verification is manual`, source_portal: "admin" });
    return true;
  });
  return issued ? raw : null;
}

export async function redeemCredential(db: Db, token: unknown, password: unknown, purpose: "activation" | "recovery", ip: string) {
  if (typeof token !== "string" || !/^[0-9a-f]{64}$/.test(token) || !validPassword(password)) return false;
  if (!await limitCredentialAttempts(db, "redeem:global", ip, 100)) return false;
  if (!await limitCredentialAttempts(db, `redeem:${ip}`, ip, 10)) return false;
  const passwordHash = await hashPassword(password);
  return db.transaction(async (tx) => {
    const [entry] = await tx.select().from(password_reset_tokens).where(eq(password_reset_tokens.token_hash, digest(token))).for("update").limit(1);
    if (!entry || entry.purpose !== purpose || entry.used_at || entry.expires_at <= new Date()) return false;
    const [user] = await tx.select().from(users).where(eq(users.id, entry.user_id)).for("update").limit(1);
    if (!user || (purpose === "activation" ? user.status !== "inactive" : user.status !== "active")) return false;
    await tx.update(users).set({ password_hash: passwordHash, status: "active", updated_at: new Date() }).where(eq(users.id, user.id));
    await tx.update(password_reset_tokens).set({ used_at: new Date() }).where(eq(password_reset_tokens.id, entry.id));
    await tx.delete(sessions).where(eq(sessions.user_id, user.id));
    await tx.insert(audit_logs).values({ performed_by_id: user.id, performed_by_name: user.name, actor_role: user.role,
      action: purpose === "activation" ? "account_activated" : "password_reset", action_type: "UPDATE", category: "auth",
      target: `user:${user.id}`, details: "Credential set with single-use token; previous sessions revoked", source_portal: "account" });
    return true;
  });
}
