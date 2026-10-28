import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import type { db as defaultAppDb } from "../../db";
import { sessions, users } from "../../db/schema/identity";

type DbClient = typeof defaultAppDb;

async function resolveDb(db?: DbClient): Promise<DbClient> {
  if (db) {
    return db;
  }
  const { db: appDb } = await import("../../db");
  return appDb;
}

export interface SessionUser {
  id: string;
  role: string;
  name: string;
  identifier: string;
}

export async function createSession(
  userId: string,
  ip?: string | null,
  userAgent?: string | null,
  db?: DbClient
): Promise<string> {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const targetDb = await resolveDb(db);
  await targetDb.insert(sessions).values({
    user_id: userId,
    token_hash: tokenHash,
    ip_address: ip || null,
    user_agent: userAgent || null,
    expires_at: expiresAt,
  });

  return rawToken;
}

export async function getSessionUser(
  rawToken: string,
  db?: DbClient
): Promise<SessionUser | null> {
  if (!rawToken || typeof rawToken !== "string") {
    return null;
  }

  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const targetDb = await resolveDb(db);

  const rows = await targetDb
    .select({
      id: users.id,
      role: users.role,
      name: users.name,
      identifier: users.identifier,
      status: users.status,
      expiresAt: sessions.expires_at,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.user_id, users.id))
    .where(eq(sessions.token_hash, tokenHash))
    .limit(1);

  if (rows.length === 0) {
    return null;
  }

  const row = rows[0];
  if (row.expiresAt.getTime() <= Date.now()) {
    return null;
  }

  if (row.status !== "active") {
    return null;
  }

  return {
    id: row.id,
    role: row.role,
    name: row.name,
    identifier: row.identifier,
  };
}

export async function deleteSession(
  rawToken: string,
  db?: DbClient
): Promise<void> {
  if (!rawToken || typeof rawToken !== "string") {
    return;
  }

  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const targetDb = await resolveDb(db);

  await targetDb.delete(sessions).where(eq(sessions.token_hash, tokenHash));
}
