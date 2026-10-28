import "server-only";
import { and, eq, gte, sql } from "drizzle-orm";
import type { db as defaultAppDb } from "../../db";
import { login_attempts, users } from "../../db/schema/identity";
import { normalizeIdentifier } from "./identifier";
import { verifyPassword } from "./password";

type DbClient = typeof defaultAppDb;

async function resolveDb(db?: DbClient): Promise<DbClient> {
  if (db) {
    return db;
  }
  const { db: appDb } = await import("../../db");
  return appDb;
}

const DUMMY_HASH = "scrypt$131072$8$1$EPiQ9HV/BAIs6IIhNyAK/w==$Kf4DNqI35/2/DuyjYPHcp5yLYVICyZNIO836csRmDac6WRHAD1XCmW4cAVamOy9RNYqffxrNC3bfxo1lHQygRQ==";

export interface LoginResult {
  ok: boolean;
  reason?: "invalid" | "locked";
  userId?: string;
}

export async function loginWithPassword(
  identifier: string,
  password: string,
  ip?: string | null,
  db?: DbClient
): Promise<LoginResult> {
  const targetDb = await resolveDb(db);
  const normalized = normalizeIdentifier(identifier || "");
  const lookupIdentifier = normalized || identifier || "unknown";

  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

  const identifierCountResult = await targetDb
    .select({ count: sql<number>`count(*)::int` })
    .from(login_attempts)
    .where(
      and(
        eq(login_attempts.identifier, lookupIdentifier),
        eq(login_attempts.success, false),
        gte(login_attempts.created_at, fifteenMinutesAgo)
      )
    );
  const identifierFailures = identifierCountResult[0]?.count ?? 0;

  let ipFailures = 0;
  if (ip) {
    const ipCountResult = await targetDb
      .select({ count: sql<number>`count(*)::int` })
      .from(login_attempts)
      .where(
        and(
          eq(login_attempts.ip_address, ip),
          eq(login_attempts.success, false),
          gte(login_attempts.created_at, fifteenMinutesAgo)
        )
      );
    ipFailures = ipCountResult[0]?.count ?? 0;
  }

  if (identifierFailures >= 5 || ipFailures >= 20) {
    return { ok: false, reason: "locked" };
  }

  let user = null;
  if (normalized) {
    const rows = await targetDb
      .select()
      .from(users)
      .where(eq(users.identifier, normalized))
      .limit(1);
    if (rows.length > 0) {
      user = rows[0];
    }
  }

  const storedHash = user?.password_hash ?? DUMMY_HASH;
  const isMatch = await verifyPassword(password || "", storedHash);

  if (!user || !isMatch || user.status !== "active") {
    await targetDb.insert(login_attempts).values({
      identifier: lookupIdentifier,
      ip_address: ip || null,
      success: false,
    });
    return { ok: false, reason: "invalid" };
  }

  await targetDb.insert(login_attempts).values({
    identifier: lookupIdentifier,
    ip_address: ip || null,
    success: true,
  });

  await targetDb
    .update(users)
    .set({ last_login_at: new Date() })
    .where(eq(users.id, user.id));

  return { ok: true, userId: user.id };
}
