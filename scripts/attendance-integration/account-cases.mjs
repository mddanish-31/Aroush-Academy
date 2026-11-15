import assert from "node:assert/strict";

export async function verifyAccounts(pool, base, fixture) {
  const post = async (path, body, cookie, status = 200, ip = "192.0.2.55") => {
    const response = await fetch(`${base}${path}`, { method: "POST", signal: AbortSignal.timeout(20000),
      headers: { Origin: base, "Content-Type": "application/json", "x-forwarded-for": ip, ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body) });
    if (status !== null) assert.equal(response.status, status, `${path}: ${response.status} ${await response.clone().text()}`);
    return { status: response.status, data: await response.json(), cookie: response.headers.get("set-cookie")?.split(";")[0] };
  };
  const login = async (identifier, password, status = 200) => post("/api/auth/login", { identifier, password }, null, status,
    identifier.startsWith("900") ? "198.51.100.2" : identifier.includes("teacher") ? "198.51.100.3" : "198.51.100.1");
  const admin = (await login(fixture.accounts.admin.identifier, fixture.password)).cookie;
  const id = (await pool.query("SELECT id FROM academic_classes LIMIT 1")).rows[0].id;
  const board = (await pool.query("SELECT id FROM academic_boards LIMIT 1")).rows[0].id;
  const signup = (name, phone) => post("/api/auth/register", { name, identifier: `${name.toLowerCase().replace(" ", "")}@synthetic.example.test`,
    password: fixture.password, class_id: id, board_id: board, guardian_name: "Test Guardian", guardian_phone: phone }, null, 201);
  await post("/api/auth/register", { name: "Invalid Student", identifier: "student@synthetic.example.test", password: fixture.password,
    class_id: id, board_id: board, guardian_name: "Test Guardian", guardian_phone: "9000000313", guardian_email: "invalid@" }, null, 400);

  const first = (await signup("Sibling One", "9000000310")).data.registrationId;
  const second = (await signup("Sibling Two", "9000000310")).data.registrationId;
  const approvals = await Promise.all([
    post(`/api/admin/registrations/${first}/approve`, {}, admin, null),
    post(`/api/admin/registrations/${second}/approve`, {}, admin, null),
  ]);
  assert.deepEqual(approvals.map((item) => item.status).sort(), [200, 400]);
  const winner = approvals.findIndex((item) => item.status === 200);
  const token = approvals[winner].data.activationToken;
  assert.match(token, /^[a-f0-9]{64}$/);
  const parent = (await pool.query("SELECT id, password_hash, status FROM users WHERE identifier='+919000000310'")).rows[0];
  assert.equal(parent.status, "inactive");
  await login("9000000310", fixture.password, 401);
  await post(`/api/admin/registrations/${winner === 0 ? second : first}/approve`, { parentUserId: parent.id }, admin);
  assert.equal((await pool.query("SELECT count(*)::int AS n FROM parents WHERE phone='+919000000310'")).rows[0].n, 1);
  assert.equal((await pool.query("SELECT password_hash FROM users WHERE id=$1", [parent.id])).rows[0].password_hash, parent.password_hash);
  const pending = (await signup("Collision Student", "9000000312")).data.registrationId;
  await pool.query("INSERT INTO users(identifier,password_hash,role,name) VALUES ($1,$2,'student','Synthetic collision')",
    ["collisionstudent@synthetic.example.test", parent.password_hash]);
  await post(`/api/admin/registrations/${pending}/approve`, {}, admin, 400);
  assert.equal((await pool.query("SELECT status FROM registrations WHERE id=$1", [pending])).rows[0].status, "pending");
  assert.equal((await pool.query("SELECT count(*)::int AS n FROM students WHERE name='Collision Student'")).rows[0].n, 0);
  await post("/api/auth/credential", { purpose: "activation", token, password: fixture.password });
  await post("/api/auth/credential", { purpose: "activation", token, password: fixture.password }, null, 400);
  const parentLogin = await login("9000000310", fixture.password);
  assert.ok(parentLogin.cookie);
  const linked = (await pool.query("SELECT s.id FROM students s JOIN parent_student_links l ON l.student_id=s.id JOIN parents p ON p.id=l.parent_id WHERE p.user_id=$1", [parent.id])).rows;
  assert.equal(linked.length, 2);
  for (const student of linked) {
    const result = await fetch(`${base}/api/attendance?studentId=${student.id}`, { headers: { Cookie: parentLogin.cookie } });
    assert.equal(result.status, 200);
  }
  assert.equal((await fetch(`${base}/api/attendance?studentId=${fixture.accounts.a.studentId}`, { headers: { Cookie: parentLogin.cookie } })).status, 403);
  console.log("PASS: sibling approval requires reviewed parent selection, reuses one account without replacing its password; activation is single use");

  const teacher = (await post("/api/admin/teachers", { name: "Synthetic Teacher", email: "teacher.new@synthetic.example.test", phone: "9000000311" }, admin, 201)).data;
  assert.match(teacher.activationToken, /^[a-f0-9]{64}$/);
  await login("teacher.new@synthetic.example.test", fixture.password, 401);
  await post("/api/admin/teachers", { name: "Other", email: "teacher.new@synthetic.example.test" }, admin, 400);
  const beforeTeacher = (await pool.query("SELECT count(*)::int AS n FROM teachers WHERE user_id=$1", [teacher.userId])).rows[0].n;
  assert.equal(beforeTeacher, 1);
  const expired = await pool.query("UPDATE password_reset_tokens SET expires_at=now()-interval '1 day' WHERE user_id=$1 AND purpose='activation' RETURNING id", [teacher.userId]);
  assert.equal(expired.rowCount, 1);
  await post("/api/auth/credential", { purpose: "activation", token: teacher.activationToken, password: fixture.password }, null, 400);
  const reissued = (await post("/api/admin/recovery", { userId: teacher.userId, adminPassword: fixture.password, purpose: "activation" }, admin)).data.token;
  assert.match(reissued, /^[a-f0-9]{64}$/);
  await post("/api/auth/credential", { purpose: "activation", token: reissued, password: fixture.password });
  assert.ok((await login("teacher.new@synthetic.example.test", fixture.password)).cookie);
  const fresh = (await post("/api/admin/teachers", { name: "Another Teacher", email: "another.teacher@synthetic.example.test" }, admin, 201)).data;
  await post("/api/auth/credential", { purpose: "activation", token: fresh.activationToken, password: fixture.password });
  assert.ok((await login("another.teacher@synthetic.example.test", fixture.password)).cookie);
  console.log("PASS: teacher provisioning creates profile and inactive account, handles collisions, expiry and forced single-use activation");

  const recovery = (await post("/api/admin/recovery", { userId: parent.id, adminPassword: fixture.password, purpose: "recovery" }, admin)).data.token;
  assert.match(recovery, /^[a-f0-9]{64}$/);
  await post("/api/admin/recovery", { userId: parent.id, adminPassword: "wrong", purpose: "recovery" }, admin, 400);
  await post("/api/auth/credential", { purpose: "recovery", token: recovery, password: "NewSyntheticPassword123" });
  await post("/api/auth/credential", { purpose: "recovery", token: recovery, password: "NewSyntheticPassword123" }, null, 400);
  await post("/api/auth/credential", { purpose: "activation", token: recovery, password: "NewSyntheticPassword123" }, null, 400);
  const oldSession = await fetch(`${base}/api/auth/me`, { headers: { Cookie: parentLogin.cookie } });
  assert.equal(oldSession.status, 401);
  await login("9000000310", fixture.password, 401);
  const newLogin = await login("9000000310", "NewSyntheticPassword123");
  await post("/api/auth/change-password", { currentPassword: "wrong", newPassword: "AnotherSyntheticPassword123" }, newLogin.cookie, 400);
  await post("/api/auth/change-password", { currentPassword: "NewSyntheticPassword123", newPassword: "AnotherSyntheticPassword123" }, newLogin.cookie);
  assert.equal((await fetch(`${base}/api/auth/me`, { headers: { Cookie: newLogin.cookie } })).status, 401);
  assert.ok((await login("9000000310", "AnotherSyntheticPassword123")).cookie);
  const expiring = (await post("/api/admin/recovery", { userId: parent.id, adminPassword: fixture.password, purpose: "recovery" }, admin)).data.token;
  assert.match(expiring, /^[a-f0-9]{64}$/);
  const expiredRecovery = await pool.query("UPDATE password_reset_tokens SET expires_at=now()-interval '1 day' WHERE user_id=$1 AND purpose='recovery' AND used_at IS NULL RETURNING id", [parent.id]);
  assert.equal(expiredRecovery.rowCount, 1);
  await post("/api/auth/credential", { purpose: "recovery", token: expiring, password: "ThirdSyntheticPassword123" }, null, 400);
  const freshParent = await login("9000000310", "AnotherSyntheticPassword123");
  const forbidden = await fetch(`${base}/api/auth/logout`, { method: "POST", headers: { Origin: "https://other.example.test", Cookie: freshParent.cookie } });
  assert.equal(forbidden.status, 403);
  await post("/api/auth/logout", {}, freshParent.cookie);
  assert.equal((await fetch(`${base}/api/auth/me`, { headers: { Cookie: freshParent.cookie } })).status, 401);
  for (let i = 0; i < 3; i++) await post("/api/admin/recovery", { userId: parent.id, adminPassword: "wrong", purpose: "recovery" }, admin, 400);
  await post("/api/admin/recovery", { userId: parent.id, adminPassword: fixture.password, purpose: "recovery" }, admin, 400);
  const adminAgain = await login(fixture.accounts.admin.identifier, fixture.password);
  await pool.query("REVOKE DELETE ON sessions FROM attendance_app");
  try {
    await post("/api/auth/logout", {}, adminAgain.cookie, 503);
    assert.equal((await fetch(`${base}/api/auth/me`, { headers: { Cookie: adminAgain.cookie } })).status, 200);
  } finally { await pool.query("GRANT DELETE ON sessions TO attendance_app"); }
  await post("/api/auth/logout", {}, adminAgain.cookie);
  await pool.query("REVOKE SELECT ON login_attempts FROM attendance_app");
  try { await login("unavailable@synthetic.example.test", fixture.password, 503); }
  finally { await pool.query("GRANT SELECT ON login_attempts TO attendance_app"); }
  const events = (await pool.query("SELECT action, details FROM audit_logs WHERE action IN ('registration_approved','teacher_provisioned','recovery_handoff_created','password_changed','account_activated','password_reset')")).rows;
  for (const action of ["registration_approved", "teacher_provisioned", "recovery_handoff_created", "password_changed", "account_activated", "password_reset"]) {
    assert.ok(events.some((event) => event.action === action), `Missing audit action ${action}`);
  }
  assert.ok(events.every((event) => ![token, recovery, teacher.activationToken, fixture.password].some((secret) => event.details.includes(secret))));
  const collision = await pool.query("INSERT INTO users(identifier,password_hash,role,name) VALUES ($1,$2,'student','Synthetic alias collision') RETURNING id",
    ["+919000000001", parent.password_hash]);
  try { await login("9000000001", fixture.password, 401); }
  finally { await pool.query("DELETE FROM users WHERE id=$1", [collision.rows[0].id]); }
  assert.ok((await login("9000000001", fixture.password)).cookie);
  console.log("PASS: admin reauthentication, recovery reuse/purpose denial, password change, session revocation, same-origin protection and recovery rate limit");
}
