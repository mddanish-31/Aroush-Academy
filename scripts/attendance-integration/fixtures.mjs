import { randomBytes } from "node:crypto";
import { hashPassword } from "../../src/lib/auth/password.ts";

export const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

export async function createFixtures(pool, now) {
  const password = randomBytes(18).toString("hex");
  const hash = await hashPassword(password);
  const accounts = [
    ["a", "student"], ["b", "student"], ["c", "student"], ["empty", "student"],
    ["parent", "parent"], ["other-parent", "parent"], ["missing-student", "student"],
    ["missing-parent", "parent"], ["empty-parent", "parent"], ["inactive", "student"],
    ["expired", "student"], ["teacher", "teacher"], ["admin", "academy-admin"],
  ].map(([key, role], i) => ({ key, role, id: id(i + 1), identifier: `${key}@attendance.example.test` }));
  for (const account of accounts) {
    await pool.query("INSERT INTO users (id, identifier, password_hash, role, name) VALUES ($1,$2,$3,$4,$5)",
      [account.id, account.identifier, hash, account.role, `Synthetic ${account.key}`]);
  }
  const byKey = Object.fromEntries(accounts.map((account) => [account.key, account]));
  await pool.query("UPDATE users SET email=$1, phone=$2, phone_verified_at=now() WHERE id=$3",
    [byKey.a.identifier, "+919000000001", byKey.a.id]);
  await pool.query("UPDATE users SET phone=$1 WHERE id=$2", ["+919000000002", byKey.b.id]);
  await pool.query("INSERT INTO academic_classes (id,name,code) VALUES ($1,'Test Class','TEST-CLASS')", [id(200)]);
  await pool.query("INSERT INTO academic_boards (id,name,code) VALUES ($1,'Test Board','TEST-BOARD')", [id(201)]);
  await pool.query("INSERT INTO academic_subjects (id,name,code) VALUES ($1,'Test Subject','TEST-SUBJECT')", [id(202)]);
  await pool.query("INSERT INTO teachers (id,user_id,name,email) VALUES ($1,$2,'Test Teacher','teacher@attendance.example.test')",
    [id(300), byKey.teacher.id]);
  for (const n of [1, 2]) {
    await pool.query("INSERT INTO batches (id,name,subject_id,class_id,teacher_id) VALUES ($1,$2,$3,$4,$5)",
      [id(400 + n), `Test Batch ${n}`, id(202), id(200), id(300)]);
  }
  for (const [index, key] of ["a", "b", "c", "empty"].entries()) {
    byKey[key].studentId = id(100 + index);
    await pool.query("INSERT INTO students (id,user_id,admission_number,name,class_id,board_id,guardian_name,guardian_phone) VALUES ($1,$2,$3,$4,$5,$6,'Test Guardian','0000000000')",
      [byKey[key].studentId, byKey[key].id, `TEST-${key}`, `Test Child ${key}`, id(200), id(201)]);
  }
  for (const [index, key] of ["parent", "other-parent", "empty-parent"].entries()) {
    byKey[key].parentId = id(500 + index);
    await pool.query("INSERT INTO parents (id,user_id,name,phone) VALUES ($1,$2,$3,'0000000000')",
      [byKey[key].parentId, byKey[key].id, `Test ${key}`]);
  }
  for (const [parent, child, verified] of [["parent", "a", true], ["parent", "b", true],
    ["parent", "c", false], ["other-parent", "c", true]]) {
    await pool.query("INSERT INTO parent_student_links (parent_id,student_id,is_verified) VALUES ($1,$2,$3)",
      [byKey[parent].parentId, byKey[child].studentId, verified]);
  }
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const shift = (date, days) => new Date(Date.parse(date) + days * 86400000).toISOString().slice(0, 10);
  const marks = [
    [id(601), "a", today, "present", 1], [id(602), "a", today, "late", 2],
    [id(603), "a", shift(today, -1), "absent", 1], [id(604), "a", shift(today, -30), "excused", 1],
    [id(605), "a", shift(today, -31), "present", 1], [id(606), "a", shift(today, 1), "absent", 1],
    [id(607), "b", today, "absent", 1], [id(608), "c", today, "excused", 1],
  ];
  for (const [recordId, key, date, status, batch] of marks) {
    await pool.query("INSERT INTO attendance (id,student_id,batch_id,date,status,recorded_by_id) VALUES ($1,$2,$3,$4,$5,$6)",
      [recordId, byKey[key].studentId, id(400 + batch), date, status, byKey.teacher.id]);
  }
  console.log("PASS: created synthetic students, multi-child/unrelated/unverified links, empty/missing profiles and attendance");
  return { accounts: byKey, password, today, shift, now };
}
