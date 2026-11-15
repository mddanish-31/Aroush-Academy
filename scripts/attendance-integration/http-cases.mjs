import assert from "node:assert/strict";
import { id } from "./fixtures.mjs";

export async function verifyHttp(pool, baseUrl, fixture) {
  const { accounts, password, today, shift, now } = fixture;
  const cookies = {};
  const login = async (account, expected = 200) => {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST", redirect: "error", signal: AbortSignal.timeout(20000),
      headers: { "Content-Type": "application/json", Origin: baseUrl },
      body: JSON.stringify({ identifier: account.identifier, password }),
    });
    assert.equal(response.status, expected);
    if (expected !== 200) return;
    const cookie = response.headers.get("set-cookie");
    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /SameSite=lax/i);
    cookies[account.key] = cookie.split(";")[0];
  };
  for (const account of Object.values(accounts)) await login(account);
  const alternateLogin = async (identifier, expected) => {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST", headers: { "Content-Type": "application/json", Origin: baseUrl },
      body: JSON.stringify({ identifier, password }), signal: AbortSignal.timeout(20000),
    });
    assert.equal(response.status, expected);
  };
  await alternateLogin("9000000001", 200);
  await alternateLogin("9000000002", 401);
  await alternateLogin("A@ATTENDANCE.EXAMPLE.TEST", 200);
  console.log("PASS: verified secondary phone and normalized primary email login; unverified phone denied");
  console.log("PASS: real password login created HTTP-only session cookies for synthetic accounts");

  const request = async (path, key, expected) => {
    const response = await fetch(`${baseUrl}${path}`, {
      headers: key ? { cookie: cookies[key] ?? "aroush_session=invalid", "x-user-id": accounts.b.id, "x-role": "academy-admin" } : {},
      redirect: "error", signal: AbortSignal.timeout(15000),
    });
    assert.equal(response.status, expected, `${path} returned ${response.status}`);
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    return response.json();
  };
  const read = (key, params = {}, status = 200) => request(`/api/attendance?${new URLSearchParams(params)}`, key, status);
  const own = await read("a");
  assert.equal(own.studentId, accounts.a.studentId);
  assert.deepEqual(own.records.map((row) => row.id), [id(602), id(601), id(603), id(604)]);
  assert.deepEqual(Object.keys(own.records[0]).sort(), ["batch", "batchId", "date", "id", "status", "subject", "subjectId"]);
  assert.equal(own.summary.totalClasses, 4);
  assert.equal(own.summary.attendedClasses, 2);
  assert.equal(own.summary.percentage, 50);
  assert.equal(own.summaryScope, "page");
  assert.equal((await read("b")).records[0].id, id(607));
  assert.equal((await read("c")).records[0].id, id(608));
  await read("a", { studentId: accounts.b.studentId }, 403);
  await read("a", { studentId: accounts.a.studentId });
  const me = await request("/api/auth/me?role=academy-admin&profileId=other", "a", 200);
  assert.equal(me.user.profile.id, accounts.a.studentId);
  for (const key of ["a", "b"]) {
    assert.deepEqual((await read("parent", { studentId: accounts[key].studentId })).records, (await read(key)).records);
  }
  const forbidden = { ok: false, reason: "forbidden" };
  for (const studentId of [accounts.c.studentId, id(999)]) {
    assert.deepEqual(await read("parent", { studentId }, 403), forbidden);
  }
  await read("other-parent", { studentId: accounts.c.studentId });
  await read("other-parent", { studentId: accounts.a.studentId }, 403);
  await read("parent", {}, 400);
  console.log("PASS: PostgreSQL-backed student ownership and verified multi-child links reject cross-account, unverified and nonexistent children");

  await read(null, {}, 401);
  await read("invalid", {}, 401);
  for (const key of ["admin", "teacher"]) await read(key, {}, 403);
  await pool.query("UPDATE users SET status='inactive' WHERE id=$1", [accounts.inactive.id]);
  await read("inactive", {}, 401);
  await login(accounts.inactive, 401);
  await pool.query("UPDATE sessions SET expires_at=$1 WHERE user_id=$2", [new Date(now.getTime() - 1000), accounts.expired.id]);
  await read("expired", {}, 401);
  for (const key of ["missing-student", "missing-parent", "empty-parent"]) {
    assert.deepEqual(await read(key, {}, 409), { ok: false, reason: "incomplete_setup" });
  }
  const empty = await read("empty");
  assert.deepEqual(empty.records, []);
  assert.equal(empty.summary.totalClasses, 0);
  assert.equal(empty.summary.percentage, 0);
  assert.equal(empty.nextCursor, null);
  console.log("PASS: absent/expired/inactive sessions, unsupported roles, incomplete setup and valid empty attendance remain distinct");

  assert.notEqual(today, now.toISOString().slice(0, 10));
  assert.deepEqual(own.filters, { from: shift(today, -30), to: today });
  const day = await read("a", { from: today, to: today });
  assert.deepEqual(day.records.map((row) => row.id), [id(602), id(601)]);
  assert.equal((await read("a", { from: shift(today, -30), to: today })).records.length, 4);
  const maximum = await read("a", { from: shift(today, -365), to: today, limit: "200" });
  assert.equal(maximum.records.length, 5);
  await read("a", { from: shift(today, -366), to: today }, 400);
  for (const params of [{ from: "2026-02-30" }, { to: "bad" }, { from: "0000-01-01" },
    { from: shift(today, 1), to: today }, { limit: "201" }, { limit: "-1" }, { limit: "0" },
    { limit: "1.5" }, { cursor: "bad" }, { studentId: "bad" }, { role: "student" }, { unknown: "a".repeat(3000) }]) {
    await read("a", params, 400);
  }
  await request("/api/attendance?limit=1&limit=2", "a", 400);
  assert.equal((await read("a", { from: "2024-02-29", to: "2024-02-29" })).records.length, 0);
  console.log("PASS: inclusive dates, 31-calendar-date Kolkata defaults with UTC server/database, maximum range and invalid/oversized requests");

  const ids = [];
  let cursor;
  for (let page = 0; page < 10; page++) {
    const result = await read("a", { from: shift(today, -30), to: today, limit: "1", ...(cursor ? { cursor } : {}) });
    assert.equal(result.records.length, 1);
    assert.equal(result.summary.totalClasses, 1);
    assert.equal(result.summary.percentage, page < 2 ? 100 : 0);
    assert.equal(result.summaryScope, "page");
    ids.push(result.records[0].id);
    cursor = result.nextCursor;
    if (!cursor) break;
  }
  assert.deepEqual(ids, own.records.map((row) => row.id));
  assert.equal(new Set(ids).size, 4);
  assert.equal(cursor, null);
  await read("parent", { studentId: accounts.c.studentId, cursor: `${today}:${id(602)}` }, 403);
  console.log("PASS: equal-date keyset pagination is stable with no gaps/duplicates and summaries cover only each returned page");

  const expectedFailure = { ok: false, reason: "server_error" };
  await pool.query("ALTER TABLE attendance RENAME TO attendance_unavailable");
  try { assert.deepEqual(await read("a", {}, 503), expectedFailure); }
  finally { await pool.query("ALTER TABLE attendance_unavailable RENAME TO attendance"); }
  await pool.query("REVOKE SELECT ON users FROM attendance_app");
  try { assert.deepEqual(await read("a", {}, 503), expectedFailure); }
  finally { await pool.query("GRANT SELECT ON users TO attendance_app"); }
  await read("a");
  const registrations = await fetch(`${baseUrl}/api/admin/registrations`, {
    headers: { cookie: cookies.admin }, redirect: "error", signal: AbortSignal.timeout(15000),
  });
  assert.equal(registrations.status, 200);
  assert.equal((await registrations.json()).ok, true);
  console.log("PASS: actual missing table and database permission failures return private generic 503s; recovery and admin Registrations remain functional");
}
