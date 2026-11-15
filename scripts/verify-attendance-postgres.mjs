import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { drizzle } from "drizzle-orm/neon-serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { startDatabase } from "./attendance-integration/runtime.mjs";
import { createFixtures } from "./attendance-integration/fixtures.mjs";
import { startHttp } from "./attendance-integration/server.mjs";
import { verifyHttp } from "./attendance-integration/http-cases.mjs";
import { verifySchema } from "./attendance-integration/schema-cases.mjs";
import { verifyAccounts } from "./attendance-integration/account-cases.mjs";
import { verifyBrowser } from "./attendance-integration/browser-cases.mjs";
import { verifySetup } from "./attendance-integration/setup-cases.mjs";
import { verifySetupBrowser } from "./attendance-integration/setup-browser.mjs";
import { verifyFees } from "./attendance-integration/fee-cases.mjs";
import { verifyFeeBrowser } from "./attendance-integration/fee-browser.mjs";
import { verifyAcademic } from "./attendance-integration/academic-cases.mjs";

const runtime = await startDatabase();
let http;
try {
  await migrate(drizzle(runtime.pool), { migrationsFolder: "./drizzle" });
  const applied = (await runtime.pool.query('SELECT hash FROM drizzle.__drizzle_migrations ORDER BY created_at')).rows;
  const journal = JSON.parse(readFileSync("drizzle/meta/_journal.json", "utf8"));
  assert.equal(applied.length, journal.entries.length);
  for (const [index, entry] of journal.entries.entries()) {
    assert.equal(applied[index].hash, createHash("sha256").update(readFileSync(`drizzle/${entry.tag}.sql`)).digest("hex"));
    console.log(`PASS: applied repository migration ${entry.tag} in order`);
  }
  await runtime.pool.query(`CREATE ROLE attendance_app LOGIN PASSWORD '${runtime.password}'`);
  await runtime.pool.query("GRANT USAGE ON SCHEMA public TO attendance_app");
  await runtime.pool.query("GRANT SELECT ON ALL TABLES IN SCHEMA public TO attendance_app");
  await runtime.pool.query("GRANT INSERT ON sessions, login_attempts TO attendance_app");
  await runtime.pool.query("GRANT UPDATE ON users TO attendance_app");
  await runtime.pool.query("GRANT INSERT ON users, students, parents, parent_student_links, registrations, teachers, password_reset_tokens, audit_logs, academic_classes, academic_boards, academic_subjects, teacher_subjects, batches, enrollments TO attendance_app");
  await runtime.pool.query("GRANT INSERT ON fee_obligations, fee_adjustments, payment_submissions, fee_payments, fee_allocations, fee_receipts, settings TO attendance_app");
  await runtime.pool.query("GRANT INSERT ON attendance, attendance_corrections, timetable_events, academic_posts, academic_remarks, assessments, assessment_marks TO attendance_app");
  await runtime.pool.query("GRANT UPDATE ON fee_obligations, payment_submissions, settings TO attendance_app");
  await runtime.pool.query("GRANT UPDATE ON attendance, timetable_events, assessments, assessment_marks TO attendance_app");
  await runtime.pool.query("GRANT UPDATE ON batches, academic_classes, academic_boards, academic_subjects, teachers, students, enrollments TO attendance_app");
  await runtime.pool.query("GRANT UPDATE, DELETE ON teacher_subjects TO attendance_app");
  await runtime.pool.query("GRANT UPDATE ON registrations, password_reset_tokens TO attendance_app");
  await runtime.pool.query("GRANT DELETE ON sessions TO attendance_app");
  await runtime.pool.query("GRANT INSERT, UPDATE ON number_sequences TO attendance_app");
  const clock = new Date();
  clock.setUTCHours(20, 0, 0, 0);
  const fixture = await createFixtures(runtime.pool, clock);
  await verifySchema(runtime.pool, fixture);
  http = await startHttp(runtime, clock.toISOString());
  await verifyHttp(runtime.pool, http.baseUrl, fixture);
  await verifyAccounts(runtime.pool, http.baseUrl, fixture);
  await verifySetup(runtime.pool, http.baseUrl, fixture);
  await verifyBrowser(http.baseUrl, fixture);
  await verifySetupBrowser(http.baseUrl, fixture);
  await verifyFees(runtime.pool, http.baseUrl, fixture);
  await verifyFeeBrowser(http.baseUrl, fixture);
  await verifyAcademic(runtime.pool, http.baseUrl, fixture);
  console.log("PASS: disposable PostgreSQL attendance integration completed");
} finally {
  await http?.stop();
  await runtime.close();
}