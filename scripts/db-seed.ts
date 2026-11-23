import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from "ws";
import { DEFAULT_SUBJECTS } from "../src/data/academicMasterData";
import { DEMO_ACCOUNTS } from "../src/lib/auth/demoAccounts";
import { hashPassword } from "../src/lib/auth/password";

neonConfig.webSocketConstructor = ws;

const isMainRequested = process.argv.includes("--main");
const isDemoRequested = process.argv.includes("--demo");
const isSyncAdminRequested = process.argv.includes("--sync-admin");
const allowMain = process.env.SEED_ALLOW_MAIN === "yes";

let connectionString: string;
let targetLabel: string;

if (isMainRequested) {
  if (!allowMain) {
    console.error("Targeting main requires SEED_ALLOW_MAIN=yes");
    process.exit(1);
  }
  const mainUrl = process.env.DATABASE_URL;
  if (!mainUrl || mainUrl.trim() === "") {
    console.error("DATABASE_URL is missing or empty");
    process.exit(1);
  }
  connectionString = mainUrl;
  targetLabel = "main";
} else {
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

  connectionString = testUrl;
  targetLabel = "test";
}

const adminEmail = process.env.SEED_ADMIN_EMAIL;
const adminPassword = process.env.SEED_ADMIN_PASSWORD;
const adminName = process.env.SEED_ADMIN_NAME;

if (!adminEmail || adminEmail.trim() === "") {
  console.error("SEED_ADMIN_EMAIL is missing or empty");
  process.exit(1);
}

if (!adminName || adminName.trim() === "") {
  console.error("SEED_ADMIN_NAME is missing or empty");
  process.exit(1);
}

if (!adminPassword) {
  console.error("SEED_ADMIN_PASSWORD is missing");
  process.exit(1);
}

if (adminPassword.length < 12) {
  console.error("SEED_ADMIN_PASSWORD must be at least 12 characters");
  process.exit(1);
}

const validEmail: string = adminEmail;
const validPassword: string = adminPassword;
const validName: string = adminName;

const CLASSES_TO_SEED = [
  { name: "Class V", code: "cls-5", displayOrder: 1 },
  { name: "Class VI", code: "cls-6", displayOrder: 2 },
  { name: "Class VII", code: "cls-7", displayOrder: 3 },
  { name: "Class VIII", code: "cls-8", displayOrder: 4 },
  { name: "Class IX", code: "cls-9", displayOrder: 5 },
  { name: "Class X", code: "cls-10", displayOrder: 6 },
  { name: "Class XI", code: "cls-11", displayOrder: 7 },
  { name: "Class XII", code: "cls-12", displayOrder: 8 },
];

const BOARDS_TO_SEED = [
  { name: "ICSE", code: "ICSE" },
  { name: "CBSE", code: "CBSE" },
  { name: "West Bengal Board", code: "WBBSE" },
];

async function seed() {
  const pool = new Pool({ connectionString });
  const client = await pool.connect();

  try {
    for (const cls of CLASSES_TO_SEED) {
      await client.query(
        `INSERT INTO academic_classes (name, code, display_order, is_active)
         VALUES ($1, $2, $3, true)
         ON CONFLICT (code) DO NOTHING`,
        [cls.name, cls.code, cls.displayOrder]
      );
    }

    for (const brd of BOARDS_TO_SEED) {
      await client.query(
        `INSERT INTO academic_boards (name, code, is_active)
         VALUES ($1, $2, true)
         ON CONFLICT (code) DO NOTHING`,
        [brd.name, brd.code]
      );
    }

    for (const sub of DEFAULT_SUBJECTS) {
      await client.query(
        `INSERT INTO academic_subjects (name, code, default_monthly_fee_paise, description, is_active)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (code) DO NOTHING`,
        [
          sub.name,
          sub.code,
          Math.round(sub.defaultMonthlyFee * 100),
          sub.description || null,
          sub.isActive ?? true,
        ]
      );
    }

    const normalizedEmail = validEmail.toLowerCase().trim();
    const normalizedName = validName.trim();
    const passwordHash = await hashPassword(validPassword);

    if (isSyncAdminRequested) {
      await client.query(
        `INSERT INTO users (identifier, email, email_verified_at, password_hash, role, name, status)
         VALUES ($1, $2, NOW(), $3, 'academy-admin', $4, 'active')
         ON CONFLICT (identifier) DO UPDATE
         SET password_hash = EXCLUDED.password_hash,
             email = COALESCE(users.email, EXCLUDED.email),
             email_verified_at = COALESCE(users.email_verified_at, NOW()),
             name = EXCLUDED.name,
             status = 'active'`,
        [normalizedEmail, normalizedEmail, passwordHash, normalizedName]
      );
    } else {
      await client.query(
        `INSERT INTO users (identifier, email, password_hash, role, name, status)
         VALUES ($1, $2, $3, 'academy-admin', $4, 'active')
         ON CONFLICT (identifier) DO NOTHING`,
        [normalizedEmail, normalizedEmail, passwordHash, normalizedName]
      );
    }

    if (isDemoRequested) {
      const adminDemo = DEMO_ACCOUNTS["academy-admin"];
      const teacherDemo = DEMO_ACCOUNTS["teacher"];
      const studentDemo = DEMO_ACCOUNTS["student"];
      const parentDemo = DEMO_ACCOUNTS["parent"];

      if (adminDemo) {
        const adminHash = await hashPassword(adminDemo.demoPassword);
        const adminId = adminDemo.user.identifier.toLowerCase().trim();
        await client.query(
          `INSERT INTO users (identifier, email, email_verified_at, password_hash, role, name, status)
           VALUES ($1, $1, NOW(), $2, 'academy-admin', $3, 'active')
           ON CONFLICT (identifier) DO UPDATE
           SET password_hash = EXCLUDED.password_hash,
               email = COALESCE(users.email, EXCLUDED.email),
               email_verified_at = COALESCE(users.email_verified_at, NOW()),
               status = 'active'`,
          [adminId, adminHash, adminDemo.user.name]
        );
      }

      if (teacherDemo) {
        const teacherHash = await hashPassword(teacherDemo.demoPassword);
        const teacherEmail = teacherDemo.user.identifier.toLowerCase().trim();
        const teacherUserRes = await client.query<{ id: string }>(
          `INSERT INTO users (identifier, email, email_verified_at, password_hash, role, name, status)
           VALUES ($1, $1, NOW(), $2, 'teacher', $3, 'active')
           ON CONFLICT (identifier) DO UPDATE
           SET password_hash = EXCLUDED.password_hash,
               email = COALESCE(users.email, EXCLUDED.email),
               email_verified_at = COALESCE(users.email_verified_at, NOW()),
               status = 'active'
           RETURNING id`,
          [teacherEmail, teacherHash, teacherDemo.user.name]
        );
        const teacherUserId = teacherUserRes.rows[0].id;
        await client.query(
          `INSERT INTO teachers (user_id, name, email, phone, status)
           SELECT $1, $2, $3, '+919830000002', 'active'
           WHERE NOT EXISTS (SELECT 1 FROM teachers WHERE user_id = $1)`,
          [teacherUserId, teacherDemo.user.name, teacherEmail]
        );
      }

      let demoStudentProfileId: string | null = null;
      if (studentDemo) {
        const studentHash = await hashPassword(studentDemo.demoPassword);
        const studentEmail = studentDemo.user.identifier.toLowerCase().trim();
        const studentUserRes = await client.query<{ id: string }>(
          `INSERT INTO users (identifier, email, email_verified_at, password_hash, role, name, status)
           VALUES ($1, $1, NOW(), $2, 'student', $3, 'active')
           ON CONFLICT (identifier) DO UPDATE
           SET password_hash = EXCLUDED.password_hash,
               email = COALESCE(users.email, EXCLUDED.email),
               email_verified_at = COALESCE(users.email_verified_at, NOW()),
               status = 'active'
           RETURNING id`,
          [studentEmail, studentHash, studentDemo.user.name]
        );
        const studentUserId = studentUserRes.rows[0].id;

        const clsRes = await client.query<{ id: string }>(
          `SELECT id FROM academic_classes WHERE code = 'cls-10' LIMIT 1`
        );
        const brdRes = await client.query<{ id: string }>(
          `SELECT id FROM academic_boards WHERE code = 'CBSE' LIMIT 1`
        );
        if (clsRes.rows.length > 0 && brdRes.rows.length > 0) {
          const studentRowRes = await client.query<{ id: string }>(
            `INSERT INTO students (user_id, admission_number, name, class_id, board_id, guardian_name, guardian_phone, guardian_email, status)
             VALUES ($1, 'AA-DEMO-101', $2, $3, $4, $5, '+919830000004', $6, 'active')
             ON CONFLICT (admission_number) DO UPDATE
             SET user_id = COALESCE(students.user_id, EXCLUDED.user_id),
                 status = 'active'
             RETURNING id`,
            [
              studentUserId,
              studentDemo.user.name,
              clsRes.rows[0].id,
              brdRes.rows[0].id,
              parentDemo?.user.name || "Mrs. Amina Rahman",
              parentDemo?.user.identifier.toLowerCase().trim() || "amina.rahman@parent.aroush.in",
            ]
          );
          demoStudentProfileId = studentRowRes.rows[0].id;
        }
      }

      if (parentDemo) {
        const parentHash = await hashPassword(parentDemo.demoPassword);
        const parentEmail = parentDemo.user.identifier.toLowerCase().trim();
        const parentUserRes = await client.query<{ id: string }>(
          `INSERT INTO users (identifier, email, email_verified_at, password_hash, role, name, status)
           VALUES ($1, $1, NOW(), $2, 'parent', $3, 'active')
           ON CONFLICT (identifier) DO UPDATE
           SET password_hash = EXCLUDED.password_hash,
               email = COALESCE(users.email, EXCLUDED.email),
               email_verified_at = COALESCE(users.email_verified_at, NOW()),
               status = 'active'
           RETURNING id`,
          [parentEmail, parentHash, parentDemo.user.name]
        );
        const parentUserId = parentUserRes.rows[0].id;

        let parentProfileRes = await client.query<{ id: string }>(
          `SELECT id FROM parents WHERE user_id = $1 LIMIT 1`,
          [parentUserId]
        );
        if (parentProfileRes.rows.length === 0) {
          parentProfileRes = await client.query<{ id: string }>(
            `INSERT INTO parents (user_id, name, phone, email)
             VALUES ($1, $2, '+919830000004', $3)
             RETURNING id`,
            [parentUserId, parentDemo.user.name, parentEmail]
          );
        }
        const parentProfileId = parentProfileRes.rows[0].id;

        if (demoStudentProfileId) {
          await client.query(
            `INSERT INTO parent_student_links (parent_id, student_id, relationship, is_verified)
             VALUES ($1, $2, 'mother', true)
             ON CONFLICT (parent_id, student_id) DO UPDATE
             SET is_verified = true`,
            [parentProfileId, demoStudentProfileId]
          );
        }
      }
    }

    const classCountRes = await client.query<{ count: string }>("SELECT COUNT(*) FROM academic_classes");
    const boardCountRes = await client.query<{ count: string }>("SELECT COUNT(*) FROM academic_boards");
    const subjectCountRes = await client.query<{ count: string }>("SELECT COUNT(*) FROM academic_subjects");
    const userCountRes = await client.query<{ count: string }>("SELECT COUNT(*) FROM users");

    console.log(`Seeded target: ${targetLabel}`);
    console.log(`academic_classes total rows: ${classCountRes.rows[0].count}`);
    console.log(`academic_boards total rows: ${boardCountRes.rows[0].count}`);
    console.log(`academic_subjects total rows: ${subjectCountRes.rows[0].count}`);
    console.log(`users total rows: ${userCountRes.rows[0].count}`);
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error("Seed error:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
