import Module from "node:module";
import { createHash } from "node:crypto";
import { neonConfig, Pool } from "@neondatabase/serverless";
import { eq, inArray, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "../src/db/schema";
import { login_attempts, sessions, users } from "../src/db/schema/identity";
import { normalizeIdentifier } from "../src/lib/auth/identifier";
import { hashPassword } from "../src/lib/auth/password";

const require = Module.createRequire(import.meta.url);
require.cache[require.resolve("server-only")] = { exports: {} } as NodeModule;

neonConfig.webSocketConstructor = ws;

const testUrl = process.env.TEST_DATABASE_URL;
const mainUrl = process.env.DATABASE_URL;
const unpooledUrl = process.env.DATABASE_URL_UNPOOLED;

if (!testUrl || testUrl.trim() === "") {
  console.error("TEST_DATABASE_URL is empty or missing");
  process.exit(1);
}

if (testUrl === mainUrl) {
  console.error("TEST_DATABASE_URL must not equal DATABASE_URL");
  process.exit(1);
}

if (testUrl === unpooledUrl) {
  console.error("TEST_DATABASE_URL must not equal DATABASE_URL_UNPOOLED");
  process.exit(1);
}

const adminEmail = process.env.SEED_ADMIN_EMAIL;
const adminPassword = process.env.SEED_ADMIN_PASSWORD;

if (!adminEmail || !adminPassword) {
  console.error("SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD is missing");
  process.exit(1);
}

const validEmail: string = adminEmail;
const validPassword: string = adminPassword;

const pool = new Pool({ connectionString: testUrl });
const testDb = drizzle(pool, { schema });

async function run() {
  const { loginWithPassword } = await import("../src/lib/auth/login");
  const { createSession, deleteSession, getSessionUser } = await import("../src/lib/auth/session");

  let hasFailure = false;
  const tempUserIds: string[] = [];
  const normalizedAdmin = validEmail.toLowerCase().trim();

  function report(name: string, passed: boolean) {
    if (passed) {
      console.log(`PASS: ${name}`);
    } else {
      hasFailure = true;
      console.error(`FAIL: ${name}`);
    }
  }

  const adminRows = await testDb
    .select()
    .from(users)
    .where(eq(users.identifier, normalizedAdmin))
    .limit(1);

  if (adminRows.length === 0) {
    console.error("Seeded admin user not found. Run db:seed:test first.");
    process.exit(1);
  }
  const adminUserId = adminRows[0].id;

  try {
    const normTests = [
      normalizeIdentifier("  Admin@Aroush.Local  ") === "admin@aroush.local",
      normalizeIdentifier("9876543210") === "+919876543210",
      normalizeIdentifier("09876543210") === "+919876543210",
      normalizeIdentifier("919876543210") === "+919876543210",
      normalizeIdentifier("+91 98765 43210") === "+919876543210",
      normalizeIdentifier("+91-(98765)-43210") === "+919876543210",
      normalizeIdentifier("invalid-phone") === null,
      normalizeIdentifier("12345") === null,
    ];
    report("normalizeIdentifier cases", normTests.every(Boolean));

    const correctLogin = await loginWithPassword(validEmail, validPassword, "127.0.0.1", testDb);
    report("correct login ok", correctLogin.ok === true && correctLogin.userId === adminUserId);

    const wrongPass = await loginWithPassword(validEmail, "WrongPass123456!", "127.0.0.1", testDb);
    report("wrong password invalid", wrongPass.ok === false && wrongPass.reason === "invalid");

    const unknownUser = await loginWithPassword("nonexistent_user@aroush.local", "SomePass123456!", "127.0.0.1", testDb);
    report("unknown user invalid", unknownUser.ok === false && unknownUser.reason === "invalid");

    const lockTestPass = "TempLockPass123!";
    const lockTestHash = await hashPassword(lockTestPass);
    const lockUserRes = await testDb
      .insert(users)
      .values({
        identifier: "test_lock_flow@aroush.local",
        email: "test_lock_flow@aroush.local",
        password_hash: lockTestHash,
        role: "student",
        name: "Lock Test User",
        status: "active",
      })
      .returning({ id: users.id });
    tempUserIds.push(lockUserRes[0].id);

    for (let i = 0; i < 5; i++) {
      await loginWithPassword("test_lock_flow@aroush.local", "WrongPass123!", "192.168.1.100", testDb);
    }
    const lockedRes = await loginWithPassword("test_lock_flow@aroush.local", lockTestPass, "192.168.1.100", testDb);
    report("5 wrong attempts then correct password returns locked", lockedRes.ok === false && lockedRes.reason === "locked");

    const sessionToken = await createSession(adminUserId, "127.0.0.1", "test-agent", testDb);
    const sessionUser = await getSessionUser(sessionToken, testDb);
    report(
      "session create then getSessionUser ok",
      sessionUser !== null && sessionUser.id === adminUserId && sessionUser.identifier === normalizedAdmin
    );

    const expiredToken = "expired_raw_token_32_bytes_test_hex_12345678";
    const expiredHash = createHash("sha256").update(expiredToken).digest("hex");
    await testDb.insert(sessions).values({
      user_id: adminUserId,
      token_hash: expiredHash,
      expires_at: new Date(Date.now() - 10000),
    });
    const expiredUser = await getSessionUser(expiredToken, testDb);
    report("expired session rejected", expiredUser === null);

    const suspendedPass = "SuspendedPass123!";
    const suspendedHash = await hashPassword(suspendedPass);
    const suspendedUserRes = await testDb
      .insert(users)
      .values({
        identifier: "test_suspended_flow@aroush.local",
        email: "test_suspended_flow@aroush.local",
        password_hash: suspendedHash,
        role: "student",
        name: "Suspended User",
        status: "suspended",
      })
      .returning({ id: users.id });
    tempUserIds.push(suspendedUserRes[0].id);

    const suspendedToken = await createSession(suspendedUserRes[0].id, "127.0.0.1", "test-agent", testDb);
    const suspendedUser = await getSessionUser(suspendedToken, testDb);
    report("suspended user rejected", suspendedUser === null);

    await deleteSession(sessionToken, testDb);
    const lookupAfterDelete = await getSessionUser(sessionToken, testDb);
    report("deleteSession then lookup fails", lookupAfterDelete === null);

  } finally {
    try {
      await testDb.delete(login_attempts).where(
        or(
          eq(login_attempts.identifier, normalizedAdmin),
          eq(login_attempts.identifier, "nonexistent_user@aroush.local"),
          eq(login_attempts.identifier, "test_lock_flow@aroush.local")
        )
      );

      const allUserIds = [adminUserId, ...tempUserIds];
      await testDb.delete(sessions).where(inArray(sessions.user_id, allUserIds));

      if (tempUserIds.length > 0) {
        await testDb.delete(users).where(inArray(users.id, tempUserIds));
      }
    } catch (cleanupError) {
      console.error("Cleanup error:", cleanupError instanceof Error ? cleanupError.message : String(cleanupError));
    }
    await pool.end();
  }

  if (hasFailure) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Unhandled test runner error:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
