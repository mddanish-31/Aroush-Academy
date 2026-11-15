import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

export async function verifyFees(pool, base, fixture) {
  const login = async (account) => {
    const response = await fetch(`${base}/api/auth/login`, { method: "POST", headers: { Origin: base, "Content-Type": "application/json" }, body: JSON.stringify({ identifier: account.identifier, password: fixture.password }) });
    assert.equal(response.status, 200);
    return response.headers.get("set-cookie").split(";")[0];
  };
  const admin = await login(fixture.accounts.admin);
  const student = await login(fixture.accounts.a);
  const parent = await login(fixture.accounts.parent);
  const stranger = await login(fixture.accounts["other-parent"]);
  const teacher = await login(fixture.accounts.newTeacher);
  const request = async (cookie, method, body, status, path = "/api/fees") => {
    const response = await fetch(`${base}${path}`, { method, headers: { Origin: base, Cookie: cookie, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    assert.equal(response.status, status, `${method} ${path} ${response.status}: ${(await response.clone().text()).slice(0, 200)}`);
    return response.json();
  };
  const enrollmentId = (await pool.query("SELECT e.id FROM enrollments e JOIN batches b ON e.batch_id=b.id WHERE e.student_id=$1 AND b.name='Browser Batch 1440'", [fixture.accounts.a.studentId])).rows[0].id;
  await request(teacher, "GET", null, 403);
  await request(stranger, "GET", null, 403, `/api/fees?studentId=${fixture.accounts.a.studentId}`);
  await request(student, "PUT", { name: "Synthetic Azhar Sir", adminPassword: fixture.password, version: null }, 403, "/api/fees/payee");
  const configured = await request(admin, "PUT", { name: "Synthetic Azhar Sir", adminPassword: fixture.password, version: null }, 200, "/api/fees/payee");
  await request(admin, "PUT", { name: "Synthetic Azhar Sir", upiId: "fixture@upi.test", adminPassword: "incorrect", version: configured.version }, 400, "/api/fees/payee");
  const upiPayee = await request(admin, "PUT", { name: "Synthetic Azhar Sir", upiId: "fixture@upi.test", adminPassword: fixture.password, version: configured.version }, 200, "/api/fees/payee");
  await request(admin, "PUT", { name: "Synthetic Azhar Sir", adminPassword: fixture.password, version: configured.version }, 409, "/api/fees/payee");
  assert.equal(upiPayee.value.upiId, "fixture@upi.test");
  const key = randomUUID();
  const obligation = (await request(admin, "POST", { action: "obligation", enrollmentId, periodKey: "Synthetic Period One", amountPaise: 210000, dueOn: fixture.today, requestKey: key }, 201)).item;
  await request(admin, "POST", { action: "obligation", enrollmentId, periodKey: "Synthetic Period One", amountPaise: 210000, dueOn: fixture.today, requestKey: key }, 409);
  await request(admin, "POST", { action: "obligation", enrollmentId, periodKey: "Synthetic Period One", amountPaise: 210000, dueOn: fixture.today, requestKey: randomUUID() }, 409);
  const newerStudent = await login(fixture.accounts.a);
  const before = await request(newerStudent, "GET", null, 200);
  assert.equal(before.obligations.find((item) => item.id === obligation.id).balancePaise, 210000);
  const payment = (await request(admin, "POST", { action: "cash", obligationId: obligation.id, amountPaise: 60000, collectedOn: fixture.today, requestKey: randomUUID() }, 201)).receipt;
  assert.equal(payment.amountPaise, 60000);
  await request(admin, "POST", { action: "cash", obligationId: obligation.id, amountPaise: 200000, collectedOn: fixture.today, requestKey: randomUUID() }, 409);
  const adjustment = (await request(admin, "POST", { action: "adjustment", obligationId: obligation.id, kind: "discount", amountPaise: 10000, reason: "Synthetic reviewed discount", requestKey: randomUUID() }, 201)).item;
  assert.ok(adjustment.id);
  await request(admin, "POST", { action: "adjustment", obligationId: obligation.id, kind: "discount", amountPaise: 10000, reason: "Synthetic reviewed discount", requestKey: adjustment.request_key }, 409);
  await request(admin, "POST", { action: "adjustment", obligationId: obligation.id, kind: "waiver", amountPaise: 150000, reason: "Too much", requestKey: randomUUID() }, 409);
  const after = await request(parent, "GET", null, 200, `/api/fees?studentId=${fixture.accounts.a.studentId}`);
  assert.equal(after.obligations.find((item) => item.id === obligation.id).balancePaise, 140000);
  assert.ok(after.receipts.some((item) => item.receiptNumber === payment.receiptNumber));
  assert.equal((await request(student, "GET", null, 200)).obligations.find((item) => item.id === obligation.id).balancePaise, 140000);
  await request(admin, "POST", { action: "cash", obligationId: obligation.id, amountPaise: -1, collectedOn: fixture.today, requestKey: randomUUID() }, 400);
  await request(admin, "POST", { action: "cash", obligationId: obligation.id, amountPaise: "1.00", collectedOn: fixture.today, requestKey: randomUUID() }, 400);
  await request(admin, "POST", { action: "cash", obligationId: obligation.id, amountPaise: 1.5, collectedOn: fixture.today, requestKey: randomUUID() }, 400);
  await request(admin, "POST", { action: "cash", obligationId: obligation.id, amountPaise: 1, collectedOn: "2026-02-30", requestKey: randomUUID() }, 400);
  await request(student, "POST", { action: "cash", obligationId: obligation.id, amountPaise: 1, collectedOn: fixture.today, requestKey: randomUUID() }, 403);
  await request(teacher, "PUT", { name: "Wrong", adminPassword: fixture.password, version: upiPayee.version }, 403, "/api/fees/payee");
  await request(parent, "GET", null, 200, `/api/fees?studentId=${fixture.accounts.b.studentId}`);
  await request(parent, "GET", null, 403, `/api/fees?studentId=${fixture.accounts.c.studentId}`);
  await request(student, "GET", null, 403, `/api/fees?studentId=${fixture.accounts.b.studentId}`);
  await request(admin, "GET", null, 400, "/api/fees?pendingPage=-1");
  assert.deepEqual((await request(admin, "GET", null, 200, "/api/fees?pendingPage=1&enrollmentPage=1")).pending, []);
  assert.equal((await pool.query("SELECT count(*)::int AS n FROM fee_receipts WHERE payment_id=$1", [payment.paymentId])).rows[0].n, 1);
  await request(student, "POST", { action: "submit", obligationId: obligation.id, amountPaise: 150000, transferOn: fixture.today, referenceId: "REF-OVER", requestKey: randomUUID() }, 409);
  const ref = "FIXTURE-ONE";
  const submission = (await request(student, "POST", { action: "submit", obligationId: obligation.id, amountPaise: 40000, transferOn: fixture.today, referenceId: ref, requestKey: randomUUID() }, 201)).item;
  const duplicate = (await request(parent, "POST", { action: "submit", studentId: fixture.accounts.a.studentId, obligationId: obligation.id, amountPaise: 10000, transferOn: fixture.today, referenceId: ref, requestKey: randomUUID() }, 201)).item;
  assert.equal((await request(admin, "GET", null, 200)).pending.find((item) => item.id === submission.id).reusedReference, true);
  assert.equal((await request(student, "GET", null, 200)).obligations.find((item) => item.id === obligation.id).balancePaise, 140000);
  await request(admin, "PATCH", { id: submission.id, decision: "verify" }, 400);
  await request(teacher, "PATCH", { id: submission.id, decision: "verify", confirmVerification: true }, 403);
  const approve = () => request(admin, "PATCH", { id: submission.id, decision: "verify", confirmVerification: true }, 200);
  const results = await Promise.allSettled([approve(), approve()]);
  assert.equal(results.filter((item) => item.status === "fulfilled").length, 1);
  assert.equal(results.filter((item) => item.status === "rejected" && item.reason.code === "ERR_ASSERTION" && item.reason.message.includes("409")).length, 1);
  await request(admin, "PATCH", { id: submission.id, decision: "reject", reason: "Stale" }, 409);
  await request(admin, "PATCH", { id: duplicate.id, decision: "verify", confirmVerification: true }, 409);
  await request(admin, "PATCH", { id: duplicate.id, decision: "reject", reason: "Reused transfer reference" }, 200);
  assert.equal((await request(student, "GET", null, 200)).obligations.find((item) => item.id === obligation.id).balancePaise, 100000);
  const status = await pool.query("SELECT (SELECT count(*)::int FROM fee_payments WHERE submission_id=$1) AS payments, (SELECT count(*)::int FROM fee_receipts r JOIN fee_payments p ON p.id=r.payment_id WHERE p.submission_id=$1) AS receipts", [submission.id]);
  assert.equal(status.rows[0].payments, 1);
  assert.equal(status.rows[0].receipts, 1);
  await assert.rejects(pool.query("UPDATE fee_payments SET amount_paise=1 WHERE id=$1", [payment.paymentId]), /immutable/);
  await assert.rejects(pool.query("DELETE FROM fee_receipts WHERE payment_id=$1", [payment.paymentId]), /immutable/);
  await assert.rejects(pool.query("TRUNCATE fee_receipts"), /immutable/);
  const beforeFailure = await pool.query("SELECT (SELECT count(*)::int FROM fee_payments) AS payments, (SELECT count(*)::int FROM fee_receipts) AS receipts, (SELECT last_value FROM number_sequences WHERE kind='fee-receipt' AND year=$1) AS sequence", [Number(fixture.today.slice(0, 4))]);
  await pool.query("REVOKE INSERT ON audit_logs FROM attendance_app");
  try { await request(admin, "POST", { action: "cash", obligationId: obligation.id, amountPaise: 1000, collectedOn: fixture.today, requestKey: randomUUID() }, 503); }
  finally { await pool.query("GRANT INSERT ON audit_logs TO attendance_app"); }
  const afterFailure = await pool.query("SELECT (SELECT count(*)::int FROM fee_payments) AS payments, (SELECT count(*)::int FROM fee_receipts) AS receipts, (SELECT last_value FROM number_sequences WHERE kind='fee-receipt' AND year=$1) AS sequence", [Number(fixture.today.slice(0, 4))]);
  assert.deepEqual(afterFailure.rows, beforeFailure.rows);
  const cashKey = randomUUID();
  const cashBody = { action: "cash", obligationId: obligation.id, amountPaise: 70000, collectedOn: fixture.today, requestKey: cashKey };
  const cashResults = await Promise.allSettled([
    request(admin, "POST", cashBody, 201),
    request(admin, "POST", { ...cashBody, requestKey: randomUUID() }, 201),
  ]);
  assert.equal(cashResults.filter((item) => item.status === "fulfilled").length, 1);
  assert.equal(cashResults.filter((item) => item.status === "rejected" && item.reason.message.includes("409")).length, 1);
  const remaining = (await request(student, "GET", null, 200)).obligations.find((item) => item.id === obligation.id).balancePaise;
  assert.equal(remaining, 30000);
  assert.equal((await pool.query("SELECT count(*)::int AS n FROM fee_payments WHERE obligation_id=$1 AND amount_paise=70000", [obligation.id])).rows[0].n, 1);
  const audit = await pool.query("SELECT action FROM audit_logs WHERE action IN ('central_payee_changed','fee_payment_posted','fee_adjustment_created','upi_submission_verified','upi_submission_rejected')");
  assert.ok(audit.rows.some((row) => row.action === "central_payee_changed"));
  assert.ok(audit.rows.some((row) => row.action === "upi_submission_rejected"));
  console.log("PASS: manual UPI review, duplicate reference, concurrent approval, stale review and audited payee changes");
  console.log("PASS: malformed and excess amounts, cross-child isolation, immutable postings and failed-transaction rollback");
  console.log("PASS: durable obligation, partial cash receipt, discount, idempotency and independent scoped payer sessions");
}
