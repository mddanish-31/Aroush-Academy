import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { audit_logs } from "@/db/schema/audit";
import { settings } from "@/db/schema/config";
import { users } from "@/db/schema/identity";
import { limitCredentialAttempts } from "@/lib/auth/credentials";
import { verifyPassword } from "@/lib/auth/password";
import { fail } from "./rules";

type Payee = { name: string; upiId: string | null; phone: string | null };
const key = "central_fee_payee";

export async function getPayee(): Promise<{ value: Payee | null; version: string | null }> {
  const [row] = await db.select({ value: settings.value, version: sql<string>`${settings.updated_at}::text` }).from(settings).where(eq(settings.key, key)).limit(1);
  return row ? { value: row.value as Payee, version: row.version } : { value: null, version: null };
}

export async function changePayee(input: Record<string, unknown>, admin: { id: string; name: string }, ip: string) {
  if (typeof input.name !== "string" || input.name.trim().length < 2 || input.name.length > 100 ||
    (input.upiId != null && input.upiId !== "" && (typeof input.upiId !== "string" || !/^[A-Za-z0-9._-]{2,128}@[A-Za-z0-9.-]{2,64}$/.test(input.upiId))) ||
    (input.phone != null && input.phone !== "" && (typeof input.phone !== "string" || !/^\+91[6-9]\d{9}$/.test(input.phone))) ||
    (input.version !== null && (typeof input.version !== "string" || input.version.length > 100)) ||
    typeof input.adminPassword !== "string" || input.adminPassword.length > 200) return fail("invalid_request", 400);
  if (!await limitCredentialAttempts(db, `payee:${admin.id}`, ip, 5)) return fail("conflict", 409);
  const [account] = await db.select({ password_hash: users.password_hash, role: users.role }).from(users).where(eq(users.id, admin.id)).limit(1);
  if (!account || account.role !== "academy-admin" || !await verifyPassword(input.adminPassword, account.password_hash)) return fail("invalid_request", 400);
  const value: Payee = { name: input.name.trim(), upiId: input.upiId ? String(input.upiId).trim() : null, phone: input.phone ? String(input.phone) : null };
  return db.transaction(async (tx) => {
    const [previous] = await tx.select({ version: sql<string>`${settings.updated_at}::text`, value: settings.value }).from(settings).where(eq(settings.key, key)).for("update").limit(1);
    if ((previous?.version ?? null) !== input.version) return fail("conflict", 409);
    const [saved] = previous
      ? await tx.update(settings).set({ value, updated_at: sql`clock_timestamp()` }).where(eq(settings.key, key)).returning({ version: sql<string>`${settings.updated_at}::text` })
      : await tx.insert(settings).values({ key, value }).returning({ version: sql<string>`${settings.updated_at}::text` });
    await tx.insert(audit_logs).values({ performed_by_id: admin.id, performed_by_name: admin.name, actor_role: "academy-admin", action: "central_payee_changed", action_type: "UPDATE", category: "finance", target: "central_payee", details: "Central receiving details changed after administrator reauthentication", diff: { before: previous?.value ?? null, after: value }, source_portal: "admin" });
    return { value, version: saved.version };
  });
}
