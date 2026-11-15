import assert from "node:assert/strict";

export async function verifySetup(pool, base, fixture) {
  const login = async (account) => {
    const response = await fetch(`${base}/api/auth/login`, { method: "POST", headers: { Origin: base, "Content-Type": "application/json" }, body: JSON.stringify({ identifier: account.identifier, password: fixture.password }) });
    assert.equal(response.status, 200);
    return response.headers.get("set-cookie").split(";")[0];
  };
  const admin = await login(fixture.accounts.admin);
  const teacher = await login(fixture.accounts.teacher);
  const provisioned = (await pool.query("SELECT id FROM teachers WHERE email='teacher.new@synthetic.example.test'")).rows[0];
  assert.ok(provisioned);
  fixture.accounts.newTeacher = { identifier: "teacher.new@synthetic.example.test" };
  const assignedTeacher = await login(fixture.accounts.newTeacher);
  const student = await login(fixture.accounts.a);
  const parent = await login(fixture.accounts.parent);
  const other = await login(fixture.accounts["other-parent"]);
  const request = async (path, method, cookie, body, status) => {
    const response = await fetch(`${base}${path}`, { method, headers: { Origin: base, Cookie: cookie, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    assert.equal(response.status, status, `${method} ${path}: ${response.status} ${(await response.clone().text()).slice(0, 200)}`);
    return response.json();
  };
  const create = async (kind, fields, status = 201) => request("/api/admin/setup", "POST", admin, { kind, ...fields }, status);
  await request("/api/admin/setup", "GET", teacher, null, 403);
  const academicClass = (await create("class", { name: "Synthetic Advanced", code: "SYN-ADV" })).item;
  const board = (await create("board", { name: "Synthetic Board", code: "SYN-BOARD" })).item;
  const subject = (await create("subject", { name: "Synthetic Subject", code: "SYN-SUB" })).item;
  await create("class", { name: "Duplicate", code: "SYN-ADV" }, 409);
  await create("teacherSubject", { teacherId: provisioned.id, subjectId: subject.id });
  await request("/api/admin/setup", "PATCH", admin, { kind: "teacherSubject", teacherId: provisioned.id, subjectId: subject.id, version: "present", status: "removed" }, 200);
  await create("teacherSubject", { teacherId: provisioned.id, subjectId: subject.id });
  const batch = (await create("batch", { name: "Synthetic Batch", classId: academicClass.id, boardId: board.id, subjectId: subject.id, teacherId: provisioned.id, capacity: 12 })).item;
  await request("/api/admin/setup", "PATCH", admin, { kind: "teacherSubject", teacherId: provisioned.id, subjectId: subject.id, version: "present", status: "removed" }, 409);
  await create("batch", { name: "Invalid Batch", classId: academicClass.id, boardId: board.id, subjectId: subject.id, teacherId: fixture.accounts.a.studentId, capacity: 12 }, 400);
  const studentId = fixture.accounts.a.studentId;
  const initial = await request("/api/admin/setup", "GET", admin, null, 200);
  const profile = initial.students.find((item) => item.id === studentId);
  await request("/api/admin/setup", "PATCH", admin, { kind: "student", id: studentId, version: profile.updated_at, classId: academicClass.id, boardId: board.id }, 200);
  await request("/api/admin/setup", "PATCH", admin, { kind: "student", id: studentId, version: profile.updated_at, classId: academicClass.id, boardId: board.id }, 409);
  const enrollment = (await create("enrollment", { studentId, batchId: batch.id, monthlyFeePaise: 120000 })).item;
  const statuses = await Promise.all([create("enrollment", { studentId, batchId: batch.id, monthlyFeePaise: 120000 }, 409), create("enrollment", { studentId, batchId: batch.id, monthlyFeePaise: 120000 }, 409)]);
  assert.equal(statuses.length, 2);
  assert.equal((await pool.query("SELECT count(*)::int AS n FROM enrollments WHERE student_id=$1 AND batch_id=$2", [studentId, batch.id])).rows[0].n, 1);
  await request(`/api/assignments?batchId=${batch.id}`, "GET", teacher, null, 403);
  const teacherView = await request(`/api/assignments?batchId=${batch.id}`, "GET", assignedTeacher, null, 200);
  assert.equal(teacherView.students[0].id, studentId);
  assert.equal(JSON.stringify(teacherView).includes("guardian_phone"), false);
  const studentView = await request("/api/assignments", "GET", student, null, 200);
  assert.ok(studentView.batches.some((item) => item.id === batch.id));
  const parentView = await request(`/api/assignments?studentId=${studentId}`, "GET", parent, null, 200);
  assert.ok(parentView.batches.some((item) => item.id === batch.id));
  await request(`/api/assignments?studentId=${studentId}`, "GET", other, null, 403);
  await request(`/api/assignments?batchId=${batch.id}`, "GET", other, null, 403);
  await request("/api/assignments?batchId=invalid", "GET", assignedTeacher, null, 400);
  await request("/api/assignments?role=academy-admin", "GET", student, null, 400);
  await request(`/api/assignments?studentId=${fixture.accounts.c.studentId}`, "GET", parent, null, 403);
  const newerAdmin = await login(fixture.accounts.admin);
  const persisted = await request("/api/admin/setup", "GET", newerAdmin, null, 200);
  assert.ok(persisted.batches.some((item) => item.id === batch.id));
  assert.ok(persisted.enrollments.some((item) => item.id === enrollment.id));
  await request("/api/admin/setup", "PATCH", admin, { kind: "batch", id: batch.id, version: "2000-01-01T00:00:00.000Z", status: "archived" }, 409);
  await request("/api/admin/setup", "PATCH", admin, { kind: "batch", id: batch.id, version: batch.updated_at, status: "archived" }, 200);
  await request("/api/admin/setup", "PATCH", admin, { kind: "teacherSubject", teacherId: provisioned.id, subjectId: subject.id, version: "present", status: "removed" }, 200);
  await request("/api/admin/setup", "PATCH", admin, { kind: "teacherSubject", teacherId: provisioned.id, subjectId: subject.id, version: "present", status: "removed" }, 409);
  // Recreate teacherSubject for subsequent browser tests
  await create("teacherSubject", { teacherId: provisioned.id, subjectId: subject.id });
  const enrollmentVersion = persisted.enrollments.find((item) => item.id === enrollment.id).updated_at;
  await request("/api/admin/setup", "PATCH", admin, { kind: "enrollment", id: enrollment.id, version: enrollmentVersion, status: "paused" }, 200);
  await request(`/api/assignments?batchId=${batch.id}`, "GET", assignedTeacher, null, 403);
  assert.ok((await request(`/api/assignments?studentId=${studentId}`, "GET", parent, null, 200)).batches.some((item) => item.enrollmentStatus === "paused"));
  const archivedClass = (await create("class", { name: "Archive Target", code: "ARCHIVE-TARGET" })).item;
  await request("/api/admin/setup", "PATCH", admin, { kind: "class", id: archivedClass.id, version: "active", status: "inactive" }, 200);
  await request("/api/admin/setup", "PATCH", admin, { kind: "class", id: archivedClass.id, version: "active", status: "inactive" }, 409);
  await request("/api/admin/setup", "PATCH", admin, { kind: "teacher", id: "00000000-0000-4000-8000-000000000300", version: "active", status: "inactive" }, 200);
  assert.equal((await request("/api/assignments", "GET", teacher, null, 200)).batches.length, 0);
  await pool.query("REVOKE INSERT ON audit_logs FROM attendance_app");
  try {
    await create("class", { name: "Audit Failure", code: "AUDIT-FAILURE" }, 503);
    assert.equal((await pool.query("SELECT count(*)::int AS n FROM academic_classes WHERE code='AUDIT-FAILURE'")).rows[0].n, 0);
  } finally { await pool.query("GRANT INSERT ON audit_logs TO attendance_app"); }
  assert.equal((await pool.query("SELECT count(*)::int AS n FROM enrollments WHERE id=$1", [enrollment.id])).rows[0].n, 1);
  assert.equal((await pool.query("SELECT count(*)::int AS n FROM audit_logs WHERE action LIKE 'setup_%'")).rows[0].n >= 6, true);
  console.log("PASS: real admin setup, concurrent enrollment denial, scoped assignments, stale edit rejection, archive and audit");
}