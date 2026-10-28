import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const testUrl = process.env.TEST_DATABASE_URL;
const mainUrl = process.env.DATABASE_URL;
const unpooledUrl = process.env.DATABASE_URL_UNPOOLED;

if (!testUrl || testUrl.trim() === "") {
  console.error("TEST_DATABASE_URL is empty or missing");
  process.exit(1);
}

if (testUrl === mainUrl) {
  console.error("TEST_DATABASE_URL must not equal DATABASE_URL");
  process.exit(1);
}

if (testUrl === unpooledUrl) {
  console.error("TEST_DATABASE_URL must not equal DATABASE_URL_UNPOOLED");
  process.exit(1);
}

const pool = new Pool({ connectionString: testUrl });

async function runTests() {
  const client = await pool.connect();
  let hasFailure = false;

  const inserted = {
    classId: "",
    boardId: "",
    subjectId: "",
    teacherUserId: "",
    teacherId: "",
    studentId: "",
    nullEmailUser1Id: "",
    nullEmailUser2Id: "",
    registration1Id: "",
    registration2Id: "",
  };

  function reportResult(name: string, passed: boolean, message?: string) {
    if (passed) {
      console.log(`PASS: ${name}`);
    } else {
      hasFailure = true;
      console.error(`FAIL: ${name}${message ? " - " + message : ""}`);
    }
  }

  try {
    const classRes = await client.query<{ id: string }>(
      "INSERT INTO academic_classes (name, code, display_order, is_active) VALUES ($1, $2, $3, $4) RETURNING id",
      ["Test Class X", "test-cls-10", 1, true]
    );
    inserted.classId = classRes.rows[0].id;

    const boardRes = await client.query<{ id: string }>(
      "INSERT INTO academic_boards (name, code, is_active) VALUES ($1, $2, $3) RETURNING id",
      ["Test Board CBSE", "test-cbse", true]
    );
    inserted.boardId = boardRes.rows[0].id;

    const subjectRes = await client.query<{ id: string }>(
      "INSERT INTO academic_subjects (name, code, default_monthly_fee_paise, is_active) VALUES ($1, $2, $3, $4) RETURNING id",
      ["Test Mathematics", "test-math", 250000, true]
    );
    inserted.subjectId = subjectRes.rows[0].id;

    const userRes = await client.query<{ id: string }>(
      "INSERT INTO users (identifier, email, phone, password_hash, role, name, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
      ["test_teacher@aroush.local", "test_teacher@aroush.local", "9876543201", "hash1", "teacher", "Test Teacher", "active"]
    );
    inserted.teacherUserId = userRes.rows[0].id;

    const teacherRes = await client.query<{ id: string }>(
      "INSERT INTO teachers (user_id, name, email, phone, status) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [inserted.teacherUserId, "Test Teacher", "test_teacher@aroush.local", "9876543201", "active"]
    );
    inserted.teacherId = teacherRes.rows[0].id;

    const studentRes = await client.query<{ id: string }>(
      "INSERT INTO students (admission_number, name, class_id, board_id, guardian_name, guardian_phone, guardian_email, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id",
      ["ADM-TEST-001", "Test Student", inserted.classId, inserted.boardId, "Guardian Test", "9876543202", "guardian@aroush.local", "active"]
    );
    inserted.studentId = studentRes.rows[0].id;

    reportResult("Part A: Insert class, board, subject, user, teacher, student", true);

    let dupIdentifierFailed = false;
    try {
      await client.query(
        "INSERT INTO users (identifier, email, phone, password_hash, role, name, status) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        ["test_teacher@aroush.local", "diff_email@aroush.local", "9876543203", "hash2", "teacher", "Test Teacher 2", "active"]
      );
    } catch {
      dupIdentifierFailed = true;
    }
    reportResult("duplicate users.identifier fails", dupIdentifierFailed);

    let dupEmailFailed = false;
    try {
      await client.query(
        "INSERT INTO users (identifier, email, phone, password_hash, role, name, status) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        ["test_diff_user@aroush.local", "test_teacher@aroush.local", "9876543204", "hash3", "teacher", "Test Teacher 3", "active"]
      );
    } catch {
      dupEmailFailed = true;
    }
    reportResult("two users with the same non-null email fail", dupEmailFailed);

    let nullEmailSucceeded = false;
    try {
      const u1 = await client.query<{ id: string }>(
        "INSERT INTO users (identifier, email, phone, password_hash, role, name, status) VALUES ($1, NULL, $2, $3, $4, $5, $6) RETURNING id",
        ["test_null_1@aroush.local", "9876543205", "hash4", "student", "Student Null 1", "active"]
      );
      inserted.nullEmailUser1Id = u1.rows[0].id;

      const u2 = await client.query<{ id: string }>(
        "INSERT INTO users (identifier, email, phone, password_hash, role, name, status) VALUES ($1, NULL, $2, $3, $4, $5, $6) RETURNING id",
        ["test_null_2@aroush.local", "9876543206", "hash5", "student", "Student Null 2", "active"]
      );
      inserted.nullEmailUser2Id = u2.rows[0].id;
      nullEmailSucceeded = true;
    } catch {
      nullEmailSucceeded = false;
    }
    reportResult("two users with NULL email succeed", nullEmailSucceeded);

    let pendingRegistrationCheck = false;
    try {
      const reg1 = await client.query<{ id: string }>(
        "INSERT INTO registrations (name, identifier, password_hash, role, status) VALUES ($1, $2, $3, $4, $5) RETURNING id",
        ["Applicant 1", "applicant_test@aroush.local", "hash_reg", "student", "pending"]
      );
      inserted.registration1Id = reg1.rows[0].id;

      let secondPendingFailed = false;
      try {
        await client.query(
          "INSERT INTO registrations (name, identifier, password_hash, role, status) VALUES ($1, $2, $3, $4, $5)",
          ["Applicant 2", "applicant_test@aroush.local", "hash_reg_2", "student", "pending"]
        );
      } catch {
        secondPendingFailed = true;
      }

      await client.query(
        "UPDATE registrations SET status = 'approved' WHERE id = $1",
        [inserted.registration1Id]
      );

      let secondAfterApproveSucceeded = false;
      try {
        const reg2 = await client.query<{ id: string }>(
          "INSERT INTO registrations (name, identifier, password_hash, role, status) VALUES ($1, $2, $3, $4, $5) RETURNING id",
          ["Applicant 2", "applicant_test@aroush.local", "hash_reg_2", "student", "pending"]
        );
        inserted.registration2Id = reg2.rows[0].id;
        secondAfterApproveSucceeded = true;
      } catch {
        secondAfterApproveSucceeded = false;
      }

      pendingRegistrationCheck = secondPendingFailed && secondAfterApproveSucceeded;
    } catch {
      pendingRegistrationCheck = false;
    }
    reportResult(
      "second pending registration with the same identifier fails but succeeds after the first is set to approved",
      pendingRegistrationCheck
    );

    let deleteClassFailed = false;
    try {
      await client.query("DELETE FROM academic_classes WHERE id = $1", [inserted.classId]);
    } catch {
      deleteClassFailed = true;
    }
    reportResult("deleting academic_class used by student fails (RESTRICT)", deleteClassFailed);

    const auditRes = await client.query<{ id: string }>(
      "INSERT INTO audit_logs (performed_by_name, actor_role, action, action_type, category, target, details) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
      ["Test System", "academy-admin", "CREATE", "TEST", "GENERAL", "System", "Audit log test row"]
    );
    const auditLogId = auditRes.rows[0].id;

    let updateAuditBlocked = false;
    try {
      await client.query("UPDATE audit_logs SET details = 'Mutated' WHERE id = $1", [auditLogId]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("audit_logs entries are immutable and append-only")) {
        updateAuditBlocked = true;
      }
    }
    reportResult("audit_logs UPDATE blocked by immutable trigger", updateAuditBlocked);

    let deleteAuditBlocked = false;
    try {
      await client.query("DELETE FROM audit_logs WHERE id = $1", [auditLogId]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("audit_logs entries are immutable and append-only")) {
        deleteAuditBlocked = true;
      }
    }
    reportResult("audit_logs DELETE blocked by immutable trigger", deleteAuditBlocked);

    let truncateAuditBlocked = false;
    try {
      await client.query("TRUNCATE TABLE audit_logs");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("audit_logs entries are immutable and append-only")) {
        truncateAuditBlocked = true;
      }
    }
    reportResult("audit_logs TRUNCATE blocked by immutable trigger", truncateAuditBlocked);

  } finally {
    try {
      if (inserted.registration1Id || inserted.registration2Id) {
        await client.query("DELETE FROM registrations WHERE identifier = $1", ["applicant_test@aroush.local"]);
      }
      if (inserted.studentId) {
        await client.query("DELETE FROM students WHERE id = $1", [inserted.studentId]);
      }
      if (inserted.teacherId) {
        await client.query("DELETE FROM teachers WHERE id = $1", [inserted.teacherId]);
      }
      const userIdsToDelete = [inserted.teacherUserId, inserted.nullEmailUser1Id, inserted.nullEmailUser2Id].filter(Boolean);
      if (userIdsToDelete.length > 0) {
        await client.query("DELETE FROM users WHERE id = ANY($1)", [userIdsToDelete]);
      }
      if (inserted.subjectId) {
        await client.query("DELETE FROM academic_subjects WHERE id = $1", [inserted.subjectId]);
      }
      if (inserted.boardId) {
        await client.query("DELETE FROM academic_boards WHERE id = $1", [inserted.boardId]);
      }
      if (inserted.classId) {
        await client.query("DELETE FROM academic_classes WHERE id = $1", [inserted.classId]);
      }
      console.log("Cleanup: all test rows deleted except audit_logs (audit_logs cannot be deleted; immutable and append-only)");
    } catch (cleanupError) {
      console.error("Cleanup error:", cleanupError instanceof Error ? cleanupError.message : String(cleanupError));
    }
    client.release();
    await pool.end();
  }

  if (hasFailure) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Unhandled test runner error:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
