import Module from "node:module";
import { neonConfig, Pool } from "@neondatabase/serverless";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "../src/db/schema";
import { hashPassword } from "../src/lib/auth/password";

const require = Module.createRequire(import.meta.url);
require.cache[require.resolve("server-only")] = { exports: {} } as NodeModule;

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

const adminEmail = process.env.SEED_ADMIN_EMAIL;
const adminPassword = process.env.SEED_ADMIN_PASSWORD;

if (!adminEmail || !adminPassword) {
  console.error("SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD is missing");
  process.exit(1);
}

const validAdminEmail: string = adminEmail;

const pool = new Pool({ connectionString: testUrl });
const db = drizzle({ client: pool, schema });

async function run() {
  const { registerStudent } = await import("../src/lib/admissions/register");
  const { approveRegistration, rejectRegistration } = await import("../src/lib/admissions/approve");
  const { loginWithPassword } = await import("../src/lib/auth/login");

  let hasFailure = false;
  function report(name: string, passed: boolean) {
    if (passed) {
      console.log(`PASS: ${name}`);
    } else {
      hasFailure = true;
      console.error(`FAIL: ${name}`);
    }
  }

  const testIp = "192.0.2.100";
  const rateLimitTestIp = "192.0.2.200";

  const student1Email = "adm_student_1@aroush.local";
  const student1Password = "StrongPassword123!";
  const guardian1Phone = "+919876540001";

  const student2Email = "adm_student_2@aroush.local";
  const student2Password = "StrongPassword123!";

  const studentRejectEmail = "adm_student_reject@aroush.local";
  const guardianRejectPhone = "+919876540099";

  const clashStudentEmail = "adm_student_clash@aroush.local";
  const guardianClashPhone = "+919876540088";

  const rateStudentEmails: string[] = [];
  const rateGuardianPhones: string[] = [];
  for (let i = 1; i <= 6; i++) {
    rateStudentEmails.push(`rate_student_${i}@aroush.local`);
    rateGuardianPhones.push(`+91987659000${i}`);
  }

  const allTestIdentifiers = [
    student1Email,
    guardian1Phone,
    student2Email,
    studentRejectEmail,
    guardianRejectPhone,
    clashStudentEmail,
    guardianClashPhone,
    ...rateStudentEmails,
    ...rateGuardianPhones,
  ];

  try {
    const adminRows = await db
      .select({ id: schema.users.id, name: schema.users.name })
      .from(schema.users)
      .where(eq(schema.users.identifier, validAdminEmail.toLowerCase().trim()))
      .limit(1);

    if (adminRows.length === 0) {
      console.error("Admin user not found in test db");
      process.exit(1);
    }
    const adminUserId = adminRows[0].id;

    const classRows = await db
      .select({ id: schema.academic_classes.id })
      .from(schema.academic_classes)
      .where(eq(schema.academic_classes.is_active, true))
      .limit(1);

    const boardRows = await db
      .select({ id: schema.academic_boards.id })
      .from(schema.academic_boards)
      .where(eq(schema.academic_boards.is_active, true))
      .limit(1);

    if (classRows.length === 0 || boardRows.length === 0) {
      console.error("Academic class or board missing in test db");
      process.exit(1);
    }

    const classId = classRows[0].id;
    const boardId = boardRows[0].id;

    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const currentIstYear = new Date(Date.now() + istOffsetMs).getUTCFullYear();

    await db
      .delete(schema.number_sequences)
      .where(
        and(
          eq(schema.number_sequences.kind, "admission"),
          eq(schema.number_sequences.year, currentIstYear)
        )
      );

    const reg1Result = await registerStudent(
      {
        name: "Aman Sharma",
        identifier: student1Email,
        password: student1Password,
        class_id: classId,
        board_id: boardId,
        guardian_name: "Rajesh Sharma",
        guardian_phone: guardian1Phone,
        guardian_email: "rajesh.sharma@aroush.local",
      },
      testIp,
      db
    );

    let test1Passed = false;
    let reg1Id = "";
    if (reg1Result.ok && reg1Result.registrationId) {
      reg1Id = reg1Result.registrationId;
      const reg1Rows = await db
        .select()
        .from(schema.registrations)
        .where(eq(schema.registrations.id, reg1Id))
        .limit(1);
      if (
        reg1Rows.length > 0 &&
        reg1Rows[0].status === "pending" &&
        reg1Rows[0].name === "Aman Sharma"
      ) {
        test1Passed = true;
      }
    }
    report("valid registration creates pending row", test1Passed);

    const regDupResult = await registerStudent(
      {
        name: "Aman Sharma Duplicate",
        identifier: student1Email,
        password: student1Password,
        class_id: classId,
        board_id: boardId,
        guardian_name: "Rajesh Sharma",
        guardian_phone: "+919876540002",
      },
      testIp,
      db
    );
    report("same identifier again fails", regDupResult.ok === false);

    const regSameResult = await registerStudent(
      {
        name: "Same Identifier Student",
        identifier: "same_ident@aroush.local",
        password: student1Password,
        class_id: classId,
        board_id: boardId,
        guardian_name: "Same Guardian",
        guardian_phone: "same_ident@aroush.local",
      },
      testIp,
      db
    );
    report("student equals guardian identifier fails", regSameResult.ok === false);

    let rateOkCount = 0;
    for (let i = 1; i <= 5; i++) {
      const res = await registerStudent(
        {
          name: `Rate Student ${i}`,
          identifier: `rate_student_${i}@aroush.local`,
          password: student1Password,
          class_id: classId,
          board_id: boardId,
          guardian_name: `Rate Guardian ${i}`,
          guardian_phone: `+91987659000${i}`,
        },
        rateLimitTestIp,
        db
      );
      if (res.ok) {
        rateOkCount++;
      }
    }

    const reg6thResult = await registerStudent(
      {
        name: "Rate Student 6",
        identifier: "rate_student_6@aroush.local",
        password: student1Password,
        class_id: classId,
        board_id: boardId,
        guardian_name: "Rate Guardian 6",
        guardian_phone: "+919876590006",
      },
      rateLimitTestIp,
      db
    );
    report(
      "6th registration from one ip in an hour fails",
      rateOkCount === 5 && reg6thResult.ok === false
    );

    const approve1 = await approveRegistration(reg1Id, adminUserId, db);
    let test5Passed = false;
    let student1UserId = "";
    let parent1UserId = "";

    if (approve1.ok && approve1.admissionNumber && approve1.admissionNumber.endsWith("-0001")) {
      const studentUserRows = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.identifier, student1Email))
        .limit(1);

      const studentProfileRows = await db
        .select()
        .from(schema.students)
        .where(eq(schema.students.id, approve1.studentId))
        .limit(1);

      const parentUserRows = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.identifier, guardian1Phone))
        .limit(1);

      const parentProfileRows = await db
        .select()
        .from(schema.parents)
        .where(eq(schema.parents.phone, guardian1Phone))
        .limit(1);

      const linkRows = await db
        .select()
        .from(schema.parent_student_links)
        .where(
          and(
            eq(schema.parent_student_links.student_id, approve1.studentId),
            parentProfileRows.length > 0
              ? eq(schema.parent_student_links.parent_id, parentProfileRows[0].id)
              : eq(schema.parent_student_links.student_id, approve1.studentId)
          )
        )
        .limit(1);

      const auditRows = await db
        .select()
        .from(schema.audit_logs)
        .where(eq(schema.audit_logs.target, `registration:${reg1Id}`))
        .limit(1);

      const updatedRegRows = await db
        .select()
        .from(schema.registrations)
        .where(eq(schema.registrations.id, reg1Id))
        .limit(1);

      if (
        studentUserRows.length > 0 &&
        studentUserRows[0].role === "student" &&
        studentProfileRows.length > 0 &&
        studentProfileRows[0].admission_number === approve1.admissionNumber &&
        parentUserRows.length > 0 &&
        parentUserRows[0].role === "parent" &&
        parentProfileRows.length > 0 &&
        linkRows.length > 0 &&
        auditRows.length > 0 &&
        auditRows[0].action === "registration_approved" &&
        updatedRegRows.length > 0 &&
        updatedRegRows[0].status === "approved"
      ) {
        test5Passed = true;
        student1UserId = studentUserRows[0].id;
        parent1UserId = parentUserRows[0].id;
      }
    }
    report(
      "approve creates student user, student row, parent user, parent row, link, admission number AA-YYYY-0001, audit row and registration approved",
      test5Passed
    );

    let test6Passed = false;
    try {
      await approveRegistration(reg1Id, adminUserId, db);
    } catch {
      test6Passed = true;
    }
    report("second approve fails", test6Passed);

    const reg2Result = await registerStudent(
      {
        name: "Rohan Sharma",
        identifier: student2Email,
        password: student2Password,
        class_id: classId,
        board_id: boardId,
        guardian_name: "Rajesh Sharma",
        guardian_phone: guardian1Phone,
      },
      testIp,
      db
    );

    let test7Passed = false;
    if (reg2Result.ok && reg2Result.registrationId) {
      const approve2 = await approveRegistration(reg2Result.registrationId, adminUserId, db, parent1UserId);
      if (approve2.ok && approve2.admissionNumber && approve2.admissionNumber.endsWith("-0002")) {
        const parentUsers = await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.identifier, guardian1Phone));

        const parentProfiles = await db
          .select()
          .from(schema.parents)
          .where(eq(schema.parents.phone, guardian1Phone));

        const linksForStudent2 = await db
          .select()
          .from(schema.parent_student_links)
          .where(eq(schema.parent_student_links.student_id, approve2.studentId));

        if (parentUsers.length === 1 && parentProfiles.length === 1 && linksForStudent2.length === 1) {
          test7Passed = true;
        }
      }
    }
    report(
      "approving with an existing parent identifier reuses the parent and creates only a new link and next admission number 0002",
      test7Passed
    );

    const regRejectResult = await registerStudent(
      {
        name: "Reject Candidate",
        identifier: studentRejectEmail,
        password: student1Password,
        class_id: classId,
        board_id: boardId,
        guardian_name: "Reject Guardian",
        guardian_phone: guardianRejectPhone,
      },
      testIp,
      db
    );

    let test8Passed = false;
    if (regRejectResult.ok && regRejectResult.registrationId) {
      const rejectId = regRejectResult.registrationId;
      let shortReasonFailed = false;
      try {
        await rejectRegistration(rejectId, adminUserId, "bad", db);
      } catch {
        shortReasonFailed = true;
      }

      const validReject = await rejectRegistration(
        rejectId,
        adminUserId,
        "Incomplete documentation provided",
        db
      );

      const regAfterReject = await db
        .select()
        .from(schema.registrations)
        .where(eq(schema.registrations.id, rejectId))
        .limit(1);

      const rejectStudentUsers = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.identifier, studentRejectEmail));

      const rejectGuardianUsers = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.identifier, guardianRejectPhone));

      if (
        shortReasonFailed &&
        validReject.ok &&
        regAfterReject.length > 0 &&
        regAfterReject[0].status === "rejected" &&
        regAfterReject[0].rejection_reason === "Incomplete documentation provided" &&
        rejectStudentUsers.length === 0 &&
        rejectGuardianUsers.length === 0
      ) {
        test8Passed = true;
      }
    }
    report("reject needs a reason and creates no users", test8Passed);

    const regClashResult = await registerStudent(
      {
        name: "Clash Student",
        identifier: clashStudentEmail,
        password: student1Password,
        class_id: classId,
        board_id: boardId,
        guardian_name: "Clash Guardian",
        guardian_phone: guardianClashPhone,
      },
      testIp,
      db
    );

    let test9Passed = false;
    if (regClashResult.ok && regClashResult.registrationId) {
      const clashRegId = regClashResult.registrationId;
      const dummyClashHash = await hashPassword("DummyClashPass123!");
      const [injectedUser] = await db
        .insert(schema.users)
        .values({
          identifier: clashStudentEmail,
          email: clashStudentEmail,
          password_hash: dummyClashHash,
          role: "student",
          name: "Injected Existing User",
          status: "active",
        })
        .returning();

      let approveThrew = false;
      try {
        await approveRegistration(clashRegId, adminUserId, db);
      } catch {
        approveThrew = true;
      }

      const regStatus = await db
        .select()
        .from(schema.registrations)
        .where(eq(schema.registrations.id, clashRegId))
        .limit(1);

      const studentRows = await db
        .select()
        .from(schema.students)
        .where(eq(schema.students.name, "Clash Student"));

      const parentRows = await db
        .select()
        .from(schema.parents)
        .where(eq(schema.parents.name, "Clash Guardian"));

      if (
        approveThrew &&
        regStatus.length > 0 &&
        regStatus[0].status === "pending" &&
        studentRows.length === 0 &&
        parentRows.length === 0
      ) {
        test9Passed = true;
      }

      await db.delete(schema.users).where(eq(schema.users.id, injectedUser.id));
    }
    report(
      "a failure injected mid-transaction (identifier taken between checks) leaves zero partial rows",
      test9Passed
    );

    const studentLogin = await loginWithPassword(student1Email, student1Password, testIp, db);
    const parentLogin = await loginWithPassword(guardian1Phone, student1Password, testIp, db);

    report(
      "student can log in and parent cannot before their own activation",
      studentLogin.ok === true &&
        studentLogin.userId === student1UserId &&
        parentLogin.ok === false && parent1UserId.length > 0
    );
  } finally {
    try {
      const client = await pool.connect();
      try {
        await client.query(
          "DELETE FROM login_attempts WHERE identifier LIKE 'register:%' OR identifier = ANY($1)",
          [allTestIdentifiers]
        );

        const studentProfileIds = await client.query(
          "SELECT id FROM students WHERE name = ANY($1)",
          [["Aman Sharma", "Rohan Sharma", "Reject Candidate", "Clash Student"]]
        );
        const sIds = studentProfileIds.rows.map((r: { id: string }) => r.id);
        if (sIds.length > 0) {
          await client.query("DELETE FROM parent_student_links WHERE student_id = ANY($1)", [sIds]);
          await client.query("DELETE FROM students WHERE id = ANY($1)", [sIds]);
        }

        const parentProfileIds = await client.query(
          "SELECT id FROM parents WHERE phone = ANY($1)",
          [[guardian1Phone, guardianRejectPhone, guardianClashPhone, ...rateGuardianPhones]]
        );
        const pIds = parentProfileIds.rows.map((r: { id: string }) => r.id);
        if (pIds.length > 0) {
          await client.query("DELETE FROM parent_student_links WHERE parent_id = ANY($1)", [pIds]);
          await client.query("DELETE FROM parents WHERE id = ANY($1)", [pIds]);
        }

        const userIdsResult = await client.query(
          "SELECT id FROM users WHERE identifier = ANY($1)",
          [allTestIdentifiers]
        );
        const uIds = userIdsResult.rows.map((r: { id: string }) => r.id);
        if (uIds.length > 0) {
          await client.query("DELETE FROM sessions WHERE user_id = ANY($1)", [uIds]);
          await client.query("DELETE FROM users WHERE id = ANY($1)", [uIds]);
        }

        await client.query(
          "DELETE FROM registrations WHERE identifier = ANY($1) OR guardian_identifier = ANY($1)",
          [allTestIdentifiers]
        );
      } finally {
        client.release();
        await pool.end();
      }
    } catch (cleanupError) {
      console.error(
        "Cleanup error:",
        cleanupError instanceof Error ? cleanupError.message : String(cleanupError)
      );
    }
  }

  if (hasFailure) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Unhandled test runner error:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
