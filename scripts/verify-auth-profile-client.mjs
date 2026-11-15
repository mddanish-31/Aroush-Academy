import assert from "node:assert/strict";
import { loadServerIdentity } from "../src/lib/auth/loadServerIdentity.ts";

const user = {
  id: "user-student", name: "Student", identifier: "student@example.test", role: "student",
  profile: { id: "own-student", name: "Own Student", admissionNumber: "AA-1" },
  children: [], profileStatus: "ready",
};
const load = (status, payload) => loadServerIdentity(async () => new Response(JSON.stringify(payload), { status }));
assert.deepEqual(await load(200, { ok: true, user }), { status: "authenticated", user });
assert.deepEqual(await load(401, { ok: false }), { status: "unauthenticated" });
assert.deepEqual(await load(503, { ok: false }), { status: "error" });
assert.deepEqual(await loadServerIdentity(async () => { throw new Error("offline"); }), { status: "error" });
assert.deepEqual(await loadServerIdentity(async () => new Response("broken")), { status: "error" });
for (const invalid of [null, {}, { ...user, role: "owner" }, { ...user, profile: null },
  { ...user, children: [{ id: "unlinked" }] }, { ...user, profileStatus: "unknown" },
  { ...user, children: [{ id: "other", name: "Other Student" }] },
  { ...user, role: "parent", children: [] },
  { ...user, role: "academy-admin", profile: null, profileStatus: "missing" }]) {
  assert.deepEqual(await load(200, { ok: true, user: invalid }), { status: "error" });
}
assert.equal((await load(200, { ok: true, user: { ...user, profile: null, profileStatus: "missing" } })).status, "authenticated");
for (const account of [
  { ...user, role: "teacher" },
  { ...user, role: "academy-admin", profile: null },
  { ...user, role: "parent", children: [{ id: "child-a", name: "Child A" }] },
  { ...user, role: "parent", children: [], profileStatus: "missing" },
]) {
  assert.deepEqual(await load(200, { ok: true, user: account }), { status: "authenticated", user: account });
}
console.log("PASS: identity loading distinguishes authenticated, unauthenticated, missing profile and server error");
console.log("PASS: network failures and malformed responses never become valid identities");
