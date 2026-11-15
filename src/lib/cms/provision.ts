import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { eq, or } from "drizzle-orm";
import { db } from "@/db";
import { audit_logs } from "@/db/schema/audit";
import { password_reset_tokens, users } from "@/db/schema/identity";
import { normalizeIdentifier } from "@/lib/auth/identifier";
import { hashPassword } from "@/lib/auth/password";
import type { SessionUser } from "@/lib/auth/session";
import { CmsError } from "./store";

export async function provisionDeveloper(name: unknown, email: unknown, actor: SessionUser) {
  if (typeof name !== "string" || name.trim().length < 2 || name.length > 100 ||
    typeof email !== "string" || email.length > 255) throw new CmsError("invalid_request", 400);
  const identifier = normalizeIdentifier(email);
  if (!identifier || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) throw new CmsError("invalid_request", 400);
  const raw = randomBytes(32).toString("hex");
  const passwordHash = await hashPassword(randomBytes(32).toString("hex"));
  return db.transaction(async (tx) => {
    const [admin] = await tx.select({ role: users.role }).from(users).where(eq(users.id, actor.id)).limit(1);
    if (admin?.role !== "academy-admin") throw new CmsError("invalid_request", 403);
    const collision = await tx.select({ id: users.id }).from(users)
      .where(or(eq(users.identifier, identifier), eq(users.email, identifier), eq(users.phone, identifier))).limit(1);
    if (collision.length) throw new CmsError("conflict", 409);
    const [account] = await tx.insert(users).values({ identifier, email: identifier, name: name.trim(), role: "developer",
      status: "inactive", password_hash: passwordHash }).returning({ id: users.id });
    await tx.insert(password_reset_tokens).values({ user_id: account.id, token_hash: createHash("sha256").update(raw).digest("hex"),
      purpose: "activation", expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) });
    await tx.insert(audit_logs).values({ performed_by_id: actor.id, performed_by_name: actor.name, actor_role: actor.role,
      action: "developer_provisioned", action_type: "CREATE", category: "auth", target: `user:${account.id}`,
      details: "Developer account created inactive; 24-hour activation handoff issued", source_portal: "admin" });
    return { userId: account.id, activationToken: raw };
  });
}
