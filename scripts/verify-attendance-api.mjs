import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { drizzle } from "drizzle-orm/neon-serverless";
import { NextRequest } from "next/server.js";

const require = createRequire(import.meta.url);
require.cache[require.resolve("server-only")] = { exports: {} };
const uuid = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const accounts = [
  { token: "student-a", id: uuid(1), role: "student", profile: uuid(101) },
  { token: "student-b", id: uuid(2), role: "student", profile: uuid(102) },
  { token: "parent", id: uuid(3), role: "parent", profile: uuid(201) },
  { token: "teacher", id: uuid(4), role: "teacher", profile: uuid(301) },
  { token: "admin", id: uuid(5), role: "academy-admin", profile: null },
];
const marks = ["present", "late", "absent", "excused"].map((status, i) => ({
  id: uuid(401 + i), studentId: uuid(101), batchId: uuid(501), date: `2026-11-0${4 - i}`,
  status, subjectId: uuid(601), subject: "Test Subject", batch: "Test Batch",
}));
marks.push({ ...marks[0], id: uuid(410), studentId: uuid(102) });
marks.push({ ...marks[0], id: uuid(420), studentId: uuid(103) });
let expired = false;
let missingProfile = false;
let noChildren = false;
let emptyAttendance = false;
let failedTable = "";
let attendanceQueries = 0;

const query = async ({ text }, params) => {
  if (failedTable && text.includes(`from "${failedTable}"`)) throw new Error("Private database detail");
  if (text.includes('from "sessions"')) {
    assert.ok(text.includes('"sessions"."token_hash" = $1'));
    const account = accounts.find((item) => createHash("sha256").update(item.token).digest("hex") === params[0]);
    return { rows: account ? [[account.id, account.role, "Test Account", "test@example.test", "active",
      new Date(Date.now() + (expired ? -1000 : 60000)).toISOString()]] : [] };
  }
  if (text.includes('from "parent_student_links"')) {
    assert.ok(text.includes('"parent_student_links"."parent_id" = $1'));
    assert.ok(text.includes('"parent_student_links"."is_verified" = $2'));
    assert.deepEqual(params, [uuid(201), true]);
    return { rows: noChildren ? [] : [[uuid(101), "Child A", "TEST-A"], [uuid(102), "Child B", "TEST-B"]] };
  }
  for (const table of ["students", "parents", "teachers"]) {
    if (!text.includes(`from "${table}"`)) continue;
    assert.ok(text.includes(`"${table}"."user_id" = $1`));
    const account = accounts.find((item) => item.id === params[0]);
    assert.ok(account);
    return { rows: missingProfile ? [] : [table === "students"
      ? [account.profile, "Own Student", "TEST-OWN"] : [account.profile, "Own Profile"]] };
  }
  if (text.includes('from "attendance"')) {
    attendanceQueries++;
    assert.ok(text.includes('"attendance"."student_id" = $1'));
    assert.ok(text.includes('"attendance"."date" >= $2'));
    assert.ok(text.includes('"attendance"."date" <= $3'));
    assert.ok(text.includes('order by "attendance"."date" desc, "attendance"."id" desc'));
    assert.ok(text.includes('"attendance"."batch_id" = "batches"."id"'));
    assert.ok(text.includes('"batches"."subject_id" = "academic_subjects"."id"'));
    assert.ok(!text.includes(params[0]));
    assert.ok(params.at(-1) <= 201);
    let rows = emptyAttendance ? [] : marks.filter((mark) => mark.studentId === params[0]
      && mark.date >= params[1] && mark.date <= params[2]);
    if (params.length > 4) {
      assert.ok(text.includes('"attendance"."date" < $4'));
      assert.ok(text.includes('"attendance"."id" < $6'));
      rows = rows.filter((mark) => mark.date < params[3] || (mark.date === params[4] && mark.id < params[5]));
    }
    rows = rows.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)).slice(0, params.at(-1));
    return { rows: rows.map(({ id, batchId, date, status, subjectId, subject, batch }) =>
      [id, batchId, date, status, subjectId, subject, batch]) };
  }
  throw new Error(`Unexpected SQL: ${text}`);
};
const db = drizzle({ client: { query } });
require.cache[require.resolve("../src/db/index.ts")] = { exports: { db } };
process.env.NEXT_PUBLIC_AUTH_MODE = "server";
const { GET } = await import("../src/app/api/attendance/route.ts");
const read = async (token = "student-a", filters = "from=2026-11-01&to=2026-11-30") => {
  const response = await GET(new NextRequest(`http://localhost/api/attendance?${filters}`, {
    headers: token ? { cookie: `aroush_session=${token}`, "x-role": "academy-admin", "x-user-id": uuid(2) } : {},
  }));
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  return { status: response.status, body: await response.json() };
};

const own = await read();
assert.equal(own.status, 200);
assert.equal(own.body.studentId, uuid(101));
assert.deepEqual(own.body.records.map((row) => row.status), ["present", "late", "absent", "excused"]);
assert.equal(own.body.summary.totalClasses, 4);
assert.equal(own.body.summary.attendedClasses, 2);
assert.equal(own.body.summary.absentClasses, 2);
assert.equal(own.body.summary.percentage, 50);
assert.equal(own.body.summaryScope, "page");
assert.equal(own.body.nextCursor, null);
assert.deepEqual(Object.keys(own.body.records[0]).sort(), ["batch", "batchId", "date", "id", "status", "subject", "subjectId"]);
assert.equal((await read("student-b")).body.studentId, uuid(102));
assert.equal((await read("student-a", `studentId=${uuid(102)}`)).status, 403);
assert.equal((await read("student-a", `studentId=${uuid(101)}`)).status, 200);
console.log("PASS: students read only their own records; supplied IDs and headers cannot override ownership");

for (const child of [101, 102]) {
  const result = await read("parent", `studentId=${uuid(child)}&from=2026-11-01&to=2026-11-30`);
  assert.equal(result.status, 200);
  assert.equal(result.body.studentId, uuid(child));
}
const beforeDenied = attendanceQueries;
for (const child of [103, 999]) {
  const result = await read("parent", `studentId=${uuid(child)}`);
  assert.deepEqual(result, { status: 403, body: { ok: false, reason: "forbidden" } });
}
assert.equal(attendanceQueries, beforeDenied);
assert.equal((await read("parent")).status, 400);
console.log("PASS: parents read each authorized child and receive the same denial for unlinked or nonexistent children");

for (const token of ["", "invalid"]) assert.equal((await read(token)).status, 401);
expired = true;
assert.equal((await read()).status, 401);
expired = false;
for (const token of ["teacher", "admin"]) assert.equal((await read(token)).status, 403);
missingProfile = true;
for (const token of ["student-a", "parent"]) {
  assert.deepEqual(await read(token), { status: 409, body: { ok: false, reason: "incomplete_setup" } });
}
missingProfile = false;
noChildren = true;
assert.equal((await read("parent")).body.reason, "incomplete_setup");
noChildren = false;
emptyAttendance = true;
const empty = await read();
assert.equal(empty.status, 200);
assert.deepEqual(empty.body.records, []);
assert.equal(empty.body.summary.totalClasses, 0);
assert.equal(empty.body.summary.percentage, 0);
emptyAttendance = false;
for (const table of ["attendance", "sessions"]) {
  failedTable = table;
  assert.deepEqual(await read(), { status: 503, body: { ok: false, reason: "server_error" } });
}
failedTable = "";
console.log("PASS: missing/expired sessions, roles, incomplete profiles, empty attendance and database errors remain distinct");

for (const filter of ["from=2026-02-30", "to=invalid", "from=0000-01-01", "from=2026-12-01&to=2026-11-01",
  "from=2020-01-01&to=2026-01-01", "limit=201", "limit=-1", "limit=0", "limit=1.5", "limit=1e2",
  "limit=999999999999999999999", "studentId=bad", "from=2026-11-01&from=2026-11-02", "cursor=bad",
  `cursor=2026-02-30:${uuid(401)}`, "role=student", `unknown=${"a".repeat(3000)}`]) {
  const before = attendanceQueries;
  assert.equal((await read("student-a", filter)).status, 400, filter);
  assert.equal(attendanceQueries, before);
}
marks.push({ ...marks[0], id: uuid(411), batchId: uuid(502) });
const first = (await read("student-a", "from=2026-11-01&to=2026-11-30&limit=2")).body;
assert.equal(first.records.length, 2);
assert.equal(first.summary.totalClasses, 2);
assert.equal(first.summary.percentage, 100);
assert.ok(first.nextCursor);
assert.deepEqual(first.records.map((row) => row.id), [uuid(411), uuid(401)]);
const second = (await read("student-a", `from=2026-11-01&to=2026-11-30&limit=2&cursor=${encodeURIComponent(first.nextCursor)}`)).body;
assert.equal(second.records.length, 2);
assert.ok(second.nextCursor);
const third = (await read("student-a", `from=2026-11-01&to=2026-11-30&limit=2&cursor=${encodeURIComponent(second.nextCursor)}`)).body;
assert.equal(third.records.length, 1);
assert.equal(third.nextCursor, null);
assert.equal(new Set([...first.records, ...second.records, ...third.records].map((row) => row.id)).size, 5);
const filtered = (await read("student-a", "from=2026-11-02&to=2026-11-03")).body;
assert.deepEqual(filtered.records.map((row) => row.date), ["2026-11-03", "2026-11-02"]);
const { parseAttendanceQuery } = await import("../src/lib/attendance/attendanceQuery.ts");
const defaults = parseAttendanceQuery(new URLSearchParams(), new Date("2026-11-10T20:00:00Z"));
assert.deepEqual(defaults, { from: "2026-10-12", to: "2026-11-11", limit: 100, studentId: null, cursor: null });
assert.equal(parseAttendanceQuery(new URLSearchParams("to=2026-01-31")).from, "2026-01-01");
assert.ok(parseAttendanceQuery(new URLSearchParams("from=2024-02-29&to=2024-02-29&limit=200")));
assert.equal(parseAttendanceQuery(new URLSearchParams(`cursor=2026-10-31:${uuid(401)}&from=2026-11-01&to=2026-11-30`)), null);
console.log("PASS: strict dates, bounded requests, inclusive filters, stable pagination and page summaries");

process.env.NEXT_PUBLIC_AUTH_MODE = "demo";
assert.equal((await read()).status, 404);
console.log("PASS: demo mode cannot serve fabricated attendance through this endpoint");
