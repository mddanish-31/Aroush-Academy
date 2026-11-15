import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { drizzle } from "drizzle-orm/neon-serverless";

const require = createRequire(import.meta.url);
require.cache[require.resolve("server-only")] = { exports: {} };
const { getCurrentIdentity } = await import("../src/lib/auth/profile.ts");

const accounts = ["student", "teacher", "parent", "academy-admin"].map((role) => ({
  id: `user-${role}`, role, name: `${role} account`, identifier: `${role}@example.test`,
}));
let expired = false;
let suspended = false;
let missingProfile = false;
let noChildren = false;
let failQuery = false;
const hash = (value) => createHash("sha256").update(value).digest("hex");
const query = async ({ text }, params) => {
  if (failQuery) throw new Error("Disposable database unavailable");
  if (text.includes('from "sessions"')) {
    assert.ok(text.includes('"sessions"."token_hash" = $1'));
    const user = accounts.find((account) => hash(account.role) === params[0]);
    return { rows: user ? [[user.id, user.role, user.name, user.identifier,
      suspended ? "suspended" : "active", new Date(Date.now() + (expired ? -1000 : 60000)).toISOString()]] : [] };
  }
  if (text.includes('from "parent_student_links"')) {
    assert.ok(text.includes('"parent_student_links"."parent_id" = $1'));
    assert.ok(text.includes('"parent_student_links"."is_verified" = $2'));
    assert.ok(text.includes('"parent_student_links"."student_id" = "students"."id"'));
    assert.deepEqual(params, ["profile-parent", true]);
    return { rows: noChildren ? [] : [["child-a", "Child A", "AA-1"], ["child-b", "Child B", "AA-2"]] };
  }
  for (const role of ["student", "teacher", "parent"]) {
    const table = role === "parent" ? "parents" : `${role}s`;
    if (!text.includes(`from "${table}"`)) continue;
    assert.ok(text.includes(`"${table}"."user_id" = $1`));
    assert.equal(params[0], `user-${role}`);
    return { rows: missingProfile ? [] : [role === "student"
      ? ["profile-student", "Own Student", "AA-3"] : [`profile-${role}`, `Own ${role}`]] };
  }
  throw new Error(`Unexpected query: ${text}`);
};
const db = drizzle({ client: { query } });

for (const account of accounts) {
  const result = await getCurrentIdentity(account.role, db);
  assert.equal(result.id, account.id);
  assert.equal(result.role, account.role);
  assert.equal(result.profile?.id ?? null, account.role === "academy-admin" ? null : `profile-${account.role}`);
  assert.equal(result.profileStatus, "ready");
  assert.deepEqual(result.children.map((child) => child.id), account.role === "parent" ? ["child-a", "child-b"] : []);
  assert.deepEqual(Object.keys(result).sort(), ["children", "id", "identifier", "name", "profile", "profileStatus", "role"]);
}
console.log("PASS: session identity scopes student, teacher, parent and admin profiles");

missingProfile = true;
for (const role of ["student", "teacher", "parent"]) {
  const result = await getCurrentIdentity(role, db);
  assert.equal(result.profileStatus, "missing");
  assert.equal(result.profile, null);
  assert.deepEqual(result.children, []);
}
missingProfile = false;
noChildren = true;
const parent = await getCurrentIdentity("parent", db);
assert.equal(parent.profile.id, "profile-parent");
assert.equal(parent.profileStatus, "missing");
assert.deepEqual(parent.children, []);
noChildren = false;
console.log("PASS: missing profiles and parents without children have explicit empty states");

assert.equal(await getCurrentIdentity("", db), null);
assert.equal(await getCurrentIdentity("invalid", db), null);
expired = true;
assert.equal(await getCurrentIdentity("student", db), null);
expired = false;
suspended = true;
assert.equal(await getCurrentIdentity("student", db), null);
suspended = false;
console.log("PASS: missing, invalid, expired and suspended sessions are denied");

require.cache[require.resolve("../src/db/index.ts")] = { exports: { db } };
process.env.NEXT_PUBLIC_AUTH_MODE = "server";
const { NextRequest } = await import("next/server.js");
const { GET } = await import("../src/app/api/auth/me/route.ts");
const response = await GET(new NextRequest("http://localhost/api/auth/me?role=academy-admin&profileId=other&childId=unlinked", {
  headers: { cookie: "aroush_session=student", "x-user-id": "other", "x-role": "academy-admin" },
}));
assert.equal(response.status, 200);
assert.equal(response.headers.get("cache-control"), "private, no-store");
assert.equal((await response.json()).user.profile.id, "profile-student");
assert.equal((await GET(new NextRequest("http://localhost/api/auth/me"))).status, 401);
for (const token of ["invalid", "student"]) {
  expired = token === "student";
  const denied = await GET(new NextRequest("http://localhost/api/auth/me?userId=user-teacher&role=teacher", {
    headers: { cookie: `aroush_session=${token}` },
  }));
  assert.equal(denied.status, 401);
  assert.deepEqual(await denied.json(), { ok: false, reason: "unauthorized" });
}
expired = false;
for (const role of ["teacher", "parent", "academy-admin"]) {
  const scoped = await GET(new NextRequest("http://localhost/api/auth/me?userId=other&role=student&profileId=other&childId=unlinked", {
    headers: { cookie: `aroush_session=${role}`, "x-user-id": "other", "x-role": "student" },
  }));
  const identity = (await scoped.json()).user;
  assert.equal(identity.id, `user-${role}`);
  assert.equal(identity.role, role);
  assert.deepEqual(identity.children.map((child) => child.id), role === "parent" ? ["child-a", "child-b"] : []);
  if (identity.profile) {
    assert.deepEqual(Object.keys(identity.profile).sort(), ["id", "name"]);
  }
}
failQuery = true;
const failed = await GET(new NextRequest("http://localhost/api/auth/me", { headers: { cookie: "aroush_session=teacher" } }));
assert.equal(failed.status, 503);
assert.deepEqual(await failed.json(), { ok: false, reason: "server_error" });
console.log("PASS: endpoint ignores supplied identity, denies missing session and contains database errors");
