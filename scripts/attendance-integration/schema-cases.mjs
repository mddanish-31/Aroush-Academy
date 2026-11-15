import assert from "node:assert/strict";
import { id } from "./fixtures.mjs";

export async function verifySchema(pool, fixture) {
  const { accounts, today, shift } = fixture;
  const insert = "INSERT INTO attendance (id,student_id,batch_id,date,status,recorded_by_id) VALUES ($1,$2,$3,$4,$5,$6)";
  const valid = [id(900), accounts.a.studentId, id(401), shift(today, -10), "present", accounts.teacher.id];
  const rejects = async (values, code) => {
    await assert.rejects(pool.query(insert, values), (error) => error.code === code);
  };
  await rejects([id(601), accounts.a.studentId, id(401), shift(today, -10), "present", accounts.teacher.id], "23505");
  await rejects([id(901), accounts.a.studentId, id(401), today, "present", accounts.teacher.id], "23505");
  for (const status of ["pending", "PRESENT", "", "cancelled"]) {
    await rejects(valid.map((value, index) => index === 4 ? status : value), "23514");
  }
  for (const index of [0, 1, 2, 3, 4, 5]) {
    await rejects(valid.map((value, i) => i === index ? null : value), "23502");
  }
  for (const index of [1, 2, 5]) {
    await rejects(valid.map((value, i) => i === index ? id(999) : value), "23503");
  }
  await rejects(valid.map((value, i) => i === 3 ? "2026-02-30" : value), "22008");
  await assert.rejects(pool.query("DELETE FROM batches WHERE id=$1", [id(401)]), (error) => error.code === "23503");
  await pool.query("INSERT INTO users (id,identifier,password_hash,role,name) VALUES ($1,'recorder@attendance.example.test','unused','teacher','Test Recorder')", [id(910)]);
  await pool.query(insert, [id(911), accounts.a.studentId, id(401), shift(today, -11), "absent", id(910)]);
  await assert.rejects(pool.query("DELETE FROM users WHERE id=$1", [id(910)]), (error) => error.code === "23503");
  await pool.query("DELETE FROM attendance WHERE id=$1", [id(911)]);
  await pool.query("DELETE FROM users WHERE id=$1", [id(910)]);
  console.log("PASS: PostgreSQL enforces attendance primary/unique keys, allowed statuses, NOT NULL, real dates, all foreign keys and restricted deletes");

  const indexes = (await pool.query("SELECT indexname,indexdef FROM pg_indexes WHERE schemaname='public' AND tablename='attendance' ORDER BY indexname")).rows;
  assert.deepEqual(indexes.map((row) => row.indexname), ["attendance_pkey", "idx_attendance_batch_date", "idx_attendance_student_batch_date", "idx_attendance_student_date_id"]);
  assert.match(indexes[2].indexdef, /UNIQUE.*\(student_id, batch_id, date\)/);
  assert.match(indexes[3].indexdef, /\(student_id, date DESC.*id DESC/);
  const invalid = await pool.query("SELECT count(*)::int AS count FROM pg_index WHERE indrelid='attendance'::regclass AND (NOT indisvalid OR NOT indisready)");
  assert.equal(invalid.rows[0].count, 0);
  await pool.query("BEGIN");
  try {
    await pool.query("SET LOCAL enable_seqscan=off");
    const plan = await pool.query("EXPLAIN (FORMAT JSON) SELECT id,date FROM attendance WHERE student_id=$1 ORDER BY date DESC,id DESC LIMIT 2", [accounts.a.studentId]);
    assert.match(JSON.stringify(plan.rows), /idx_attendance_student_date_id/);
    await pool.query("DELETE FROM students WHERE id=$1", [accounts.b.studentId]);
    assert.equal((await pool.query("SELECT count(*)::int AS count FROM attendance WHERE student_id=$1", [accounts.b.studentId])).rows[0].count, 0);
  } finally { await pool.query("ROLLBACK"); }
  console.log("PASS: attendance indexes exist and are valid, ordered lookup can use its index, and student deletion cascades inside a rolled-back test transaction");
}
