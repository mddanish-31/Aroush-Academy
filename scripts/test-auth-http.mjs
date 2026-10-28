import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from "ws";

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

const slash = "/";
const baseUrl = `http:${slash}${slash}localhost:3005`;

async function waitForServer(retries = 40, delay = 500) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`${baseUrl}/`, { method: "HEAD" });
      if (res.status < 500) {
        return true;
      }
    } catch {
    }
    await new Promise((r) => setTimeout(r, delay));
  }
  return false;
}

async function run() {
  const ready = await waitForServer();
  if (!ready) {
    console.error("Test server on port 3005 did not become ready in time");
    process.exit(1);
  }

  let hasFailure = false;
  function report(name, passed) {
    if (passed) {
      console.log(`PASS: ${name}`);
    } else {
      hasFailure = true;
      console.error(`FAIL: ${name}`);
    }
  }

  const rateLimitIdentifier = "http_test_rate_limit@aroush.local";
  let sessionToken = "";

  try {
    const resWrongPass = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: baseUrl,
      },
      body: JSON.stringify({
        identifier: adminEmail,
        password: "WrongPassword999!",
      }),
    });
    const wrongPassData = await resWrongPass.json().catch(() => ({}));
    report(
      "wrong password 401",
      resWrongPass.status === 401 && wrongPassData.ok === false && wrongPassData.reason === "invalid"
    );

    const resCorrect = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: baseUrl,
      },
      body: JSON.stringify({
        identifier: adminEmail,
        password: adminPassword,
      }),
    });
    const correctData = await resCorrect.json().catch(() => ({}));
    const setCookie = resCorrect.headers.get("set-cookie") || "";
    const hasHttpOnly = /httponly/i.test(setCookie);
    const hasSameSiteLax = /samesite=lax/i.test(setCookie);
    const hasSessionCookie = setCookie.includes("aroush_session=");

    const match = setCookie.match(/aroush_session=([^;]+)/);
    if (match) {
      sessionToken = match[1];
    }

    report(
      "correct login 200 and Set-Cookie has HttpOnly and SameSite=Lax",
      resCorrect.status === 200 && correctData.ok === true && hasHttpOnly && hasSameSiteLax && hasSessionCookie
    );

    const resMeWithout = await fetch(`${baseUrl}/api/auth/me`);
    const resMeWith = await fetch(`${baseUrl}/api/auth/me`, {
      headers: {
        Cookie: `aroush_session=${sessionToken}`,
      },
    });
    const meData = await resMeWith.json().catch(() => ({}));
    report(
      "/api/auth/me 200 with cookie and 401 without",
      resMeWithout.status === 401 && resMeWith.status === 200 && meData.ok === true && meData.user?.identifier === adminEmail.toLowerCase().trim()
    );

    const resBadOrigin = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: `http:${slash}${slash}attacker-site.com`,
      },
      body: JSON.stringify({
        identifier: adminEmail,
        password: adminPassword,
      }),
    });
    report("bad Origin 403", resBadOrigin.status === 403);

    let failCount = 0;
    for (let i = 0; i < 5; i++) {
      const resRateFail = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: baseUrl,
        },
        body: JSON.stringify({
          identifier: rateLimitIdentifier,
          password: "WrongPassword!",
        }),
      });
      if (resRateFail.status === 401) {
        failCount++;
      }
    }

    const res6th = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: baseUrl,
      },
      body: JSON.stringify({
        identifier: rateLimitIdentifier,
        password: "WrongPassword!",
      }),
    });
    const data6th = await res6th.json().catch(() => ({}));
    report("6th failed attempt 429", failCount === 5 && res6th.status === 429 && data6th.reason === "locked");

    const resDash = await fetch(`${baseUrl}/dashboard`, {
      redirect: "manual",
    });
    const location = resDash.headers.get("location") || "";
    const isRedirect = resDash.status === 307 || resDash.status === 308 || resDash.status === 302 || resDash.status === 303;
    report("/dashboard without cookie redirects to /login", isRedirect && location.includes("/login"));

    const resLogout = await fetch(`${baseUrl}/api/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: baseUrl,
        Cookie: `aroush_session=${sessionToken}`,
      },
    });
    const logoutData = await resLogout.json().catch(() => ({}));
    const resMeAfterLogout = await fetch(`${baseUrl}/api/auth/me`, {
      headers: {
        Cookie: `aroush_session=${sessionToken}`,
      },
    });
    report(
      "logout then /me 401",
      resLogout.status === 200 && logoutData.ok === true && resMeAfterLogout.status === 401
    );

  } finally {
    try {
      const pool = new Pool({ connectionString: testUrl });
      const client = await pool.connect();
      try {
        await client.query(
          "DELETE FROM login_attempts WHERE identifier = $1 OR identifier = $2",
          [adminEmail.toLowerCase().trim(), rateLimitIdentifier]
        );
        const adminUser = await client.query("SELECT id FROM users WHERE identifier = $1", [
          adminEmail.toLowerCase().trim(),
        ]);
        if (adminUser.rows.length > 0) {
          await client.query("DELETE FROM sessions WHERE user_id = $1", [adminUser.rows[0].id]);
        }
      } finally {
        client.release();
        await pool.end();
      }
    } catch (cleanupError) {
      console.error("Cleanup error:", cleanupError instanceof Error ? cleanupError.message : String(cleanupError));
    }
  }

  if (hasFailure) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Unhandled test runner error:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
