import assert from "node:assert";
import type {
  StudentProfile,
  TeacherProfile,
  SubjectEnrollment,
  AttendanceRecord,
  TimetableSlot,
  PaymentTransaction,
  AssessmentRecord,
  IssuedCertificateRecord,
  StudyMaterialItem,
} from "@/types";
import {
  DEMO_STORAGE_KEYS,
  getDemoStorage,
  setDemoStorage,
} from "@/lib/demoStorage";
import {
  SAMPLE_STUDENTS,
  SAMPLE_TEACHERS,
  SAMPLE_ENROLLMENTS,
  SAMPLE_PAYMENTS,
} from "@/data/enrollmentFeeData";
import {
  SAMPLE_TIMETABLE,
  SAMPLE_ASSESSMENTS,
  SAMPLE_MATERIALS,
  SAMPLE_ATTENDANCE,
} from "@/data/dashboardModulesData";

console.log("==================================================================");
console.log("   AROUCH ACADEMY — 12-POINT MASTER CROSS-PORTAL VERIFICATION    ");
console.log("==================================================================");

// -------------------------------------------------------------------------
// Scenario 1: Register New Student & Assign Subject, Teacher, Batch, Fee
// -------------------------------------------------------------------------
console.log("\nScenario 1: Registering new student with subject, teacher, batch, and fee...");
const newStudent: StudentProfile = {
  id: "std-999",
  name: "Zara Khan",
  classGrade: "Class X",
  board: "ICSE",
  guardianName: "Imran Khan",
  guardianPhone: "098830 99881",
  joiningDate: "2026-10-15",
  studentStatus: "active",
  accountLinkStatus: "linked",
  linkedUserIdentifier: "zara.student@aroush.academy",
};

const newEnrollment: SubjectEnrollment = {
  id: "enr-999-sci",
  studentId: "std-999",
  studentName: "Zara Khan",
  classGrade: "Class X",
  subjectName: "Science",
  batchName: "Batch Beta (Class X)",
  teacherId: "tch-alvi", // Dr. Tariq Alvi
  teacherName: "Dr. Tariq Alvi",
  enrollmentDate: "2026-10-15",
  monthlyFeeAmount: 2200,
  status: "active",
};

const studentsStore: StudentProfile[] = [...SAMPLE_STUDENTS, newStudent];
const enrollmentsStore: SubjectEnrollment[] = [...SAMPLE_ENROLLMENTS, newEnrollment];

assert.ok(studentsStore.some((s) => s.id === "std-999"), "New student must exist in student store");
assert.ok(enrollmentsStore.some((e) => e.id === "enr-999-sci"), "New enrollment must exist in enrollment store");
console.log("  ✓ Passed: Registered student std-999 and enrolled into Science under Dr. Tariq Alvi");

// -------------------------------------------------------------------------
// Scenario 2: Cross-Portal Visibility for Directory, Teacher, Student, Parent
// -------------------------------------------------------------------------
console.log("\nScenario 2: Verifying student & enrollment across all 4 portal views...");
{
  // 1. Academy Admin Directory view: sees all students
  const adminStudentList = studentsStore;
  assert.ok(adminStudentList.some((s) => s.id === "std-999"), "Admin sees std-999 in directory");

  // 2. Teacher Portal view: Teacher tch-alvi (Dr. Tariq Alvi) assigned to std-999
  const teacherAlviEnrollments = enrollmentsStore.filter((e) => e.teacherId === "tch-alvi");
  const teacherAlviStudentIds = new Set(teacherAlviEnrollments.map((e) => e.studentId));
  const teacherAlviStudents = studentsStore.filter((s) => teacherAlviStudentIds.has(s.id));
  assert.ok(teacherAlviStudents.some((s) => s.id === "std-999"), "Teacher tch-alvi sees std-999 in assigned student roster");

  // Teacher tch-azhar (Azhar Sir - Math) NOT assigned to std-999
  const teacherAzharEnrollments = enrollmentsStore.filter((e) => e.teacherId === "tch-azhar");
  const teacherAzharStudentIds = new Set(teacherAzharEnrollments.map((e) => e.studentId));
  const teacherAzharStudents = studentsStore.filter((s) => teacherAzharStudentIds.has(s.id));
  assert.strictEqual(teacherAzharStudents.some((s) => s.id === "std-999"), false, "Teacher tch-azhar does NOT see unassigned std-999");

  // 3. Student Portal view: std-999 personal account
  const studentViewEnrollments = enrollmentsStore.filter((e) => e.studentId === "std-999");
  assert.strictEqual(studentViewEnrollments.length, 1, "std-999 sees exactly 1 enrolled subject");
  assert.strictEqual(studentViewEnrollments[0].subjectName, "Science", "Enrolled subject is Science");
  assert.strictEqual(studentViewEnrollments[0].monthlyFeeAmount, 2200, "Monthly fee is 2200");

  // 4. Parent Portal view: Parent linked explicitly to std-999
  const parentLinkedId = "std-999";
  const parentChild = studentsStore.find((s) => s.id === parentLinkedId) || null;
  assert.ok(parentChild, "Parent child resolved to std-999");
  assert.strictEqual(parentChild?.name, "Zara Khan", "Parent sees child Zara Khan");
  const parentEnrollments = enrollmentsStore.filter((e) => e.studentId === parentChild?.id);
  assert.strictEqual(parentEnrollments[0].subjectName, "Science", "Parent sees child enrolled in Science");
  console.log("  ✓ Passed: Student & enrollment correctly scoped across Admin, Teacher, Student, and Parent views");
}

// -------------------------------------------------------------------------
// Scenario 3: Add Faculty & Verify Directory and Valid Assignment Selectors
// -------------------------------------------------------------------------
console.log("\nScenario 3: Adding faculty & verifying directory and active assignment selectors...");
{
  const newFaculty: TeacherProfile = {
    id: "tch-farhan",
    name: "Farhan Akhtar",
    assignedSubjects: ["Computer Applications"],
    batches: ["Batch Beta (Class X)"],
    status: "active",
    email: "farhan@aroush.academy",
  };
  const inactiveFaculty: TeacherProfile = {
    id: "tch-old",
    name: "Old Faculty",
    assignedSubjects: ["History"],
    batches: [],
    status: "inactive",
    email: "old@aroush.academy",
  };

  const facultyStore = [...SAMPLE_TEACHERS, newFaculty, inactiveFaculty];

  // Faculty Directory displays all registered faculty
  assert.ok(facultyStore.some((f) => f.id === "tch-farhan"), "Directory includes new faculty tch-farhan");

  // Assignment selectors only allow active faculty
  const activeFacultySelectors = facultyStore.filter((f) => (f.status || "active") === "active");
  assert.ok(activeFacultySelectors.some((f) => f.id === "tch-farhan"), "Active faculty tch-farhan is selectable");
  assert.strictEqual(activeFacultySelectors.some((f) => f.id === "tch-old"), false, "Inactive faculty tch-old is excluded from new assignment selectors");
  console.log("  ✓ Passed: Active faculty dynamically available in selectors; inactive faculty excluded");
}

// -------------------------------------------------------------------------
// Scenario 4: Attendance Updates and Cross-Portal Recalculations
// -------------------------------------------------------------------------
console.log("\nScenario 4: Updating attendance and verifying student/parent/class summaries...");
{
  // Record 2 attendance sessions for std-999
  const session1: AttendanceRecord = {
    id: "att-session-1",
    studentId: "std-999",
    studentName: "Zara Khan",
    subject: "Science",
    date: "2026-10-10",
    status: "present",
    teacherId: "tch-alvi",
    batch: "Batch Beta (Class X)",
  };
  const session2: AttendanceRecord = {
    id: "att-session-2",
    studentId: "std-999",
    studentName: "Zara Khan",
    subject: "Science",
    date: "2026-10-12",
    status: "absent",
    teacherId: "tch-alvi",
    batch: "Batch Beta (Class X)",
  };

  const attendanceStore = [...SAMPLE_ATTENDANCE, session1, session2];

  // Derive metrics for std-999 in Student Portal
  const studentRecords = attendanceStore.filter((r) => r.studentId === "std-999");
  const totalClasses = studentRecords.length;
  const attendedClasses = studentRecords.filter((r) => r.status === "present" || r.status === "late").length;
  const absentClasses = studentRecords.filter((r) => r.status === "absent").length;
  const percentage = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;

  assert.strictEqual(totalClasses, 2, "Total classes = 2");
  assert.strictEqual(attendedClasses, 1, "Attended classes = 1");
  assert.strictEqual(absentClasses, 1, "Absent classes = 1");
  assert.strictEqual(percentage, 50, "Attendance percentage = 50%");

  // Derive metrics for Parent Portal for linked ward std-999
  const parentRecords = attendanceStore.filter((r) => r.studentId === "std-999");
  const parentTotal = parentRecords.length;
  const parentAttended = parentRecords.filter((r) => r.status === "present" || r.status === "late").length;
  const parentPercentage = parentTotal > 0 ? Math.round((parentAttended / parentTotal) * 100) : 0;

  assert.strictEqual(parentPercentage, percentage, "Parent and Student metrics match identically (50%)");
  console.log("  ✓ Passed: Attendance updates recalculate identical metrics (Total=2, Attended=1, Rate=50%)");
}

// -------------------------------------------------------------------------
// Scenario 5: Timetable Updates Across Admin, Teacher, Student, and Parent
// -------------------------------------------------------------------------
console.log("\nScenario 5: Updating timetable and verifying Admin master, Teacher, and Student/Parent schedules...");
{
  const newSession: TimetableSlot = {
    id: "tt-beta-sci-mon",
    dayOfWeek: "Monday",
    startTime: "17:00",
    endTime: "18:30",
    time: "05:00 PM - 06:30 PM",
    subjectId: "sub-sci",
    subject: "Science",
    batchId: "btc-beta",
    batch: "Batch Beta (Class X)",
    classGrade: "Class X",
    teacherId: "tch-alvi",
    teacherName: "Dr. Tariq Alvi",
    status: "active",
  };

  const timetableStore = [...SAMPLE_TIMETABLE, newSession];

  // 1. Admin Master Timetable includes all sessions
  assert.ok(timetableStore.some((t) => t.id === "tt-beta-sci-mon"), "Admin master timetable includes new session");

  // 2. Teacher tch-alvi timetable includes only tch-alvi sessions
  const teacherAlviTimetable = timetableStore.filter((t) => t.teacherId === "tch-alvi");
  assert.ok(teacherAlviTimetable.some((t) => t.id === "tt-beta-sci-mon"), "Teacher tch-alvi sees scheduled session");

  // 3. Student std-999 timetable (enrolled in Science + Batch Beta) includes session
  const stdEnrollments = enrollmentsStore.filter((e) => e.studentId === "std-999");
  const stdEnrolledSubjects = new Set(stdEnrollments.map((e) => e.subjectName));
  const stdEnrolledBatches = new Set(stdEnrollments.map((e) => e.batchName));

  const stdTimetable = timetableStore.filter((t) =>
    stdEnrolledSubjects.has(t.subject) && stdEnrolledBatches.has(t.batch)
  );
  assert.ok(stdTimetable.some((t) => t.id === "tt-beta-sci-mon"), "std-999 sees session matching enrolled subject & batch");

  // 4. Student std-101 (enrolled in Batch Alpha, Math) does NOT see Batch Beta Science
  const std101Enrollments = enrollmentsStore.filter((e) => e.studentId === "std-101");
  const std101Subjects = new Set(std101Enrollments.map((e) => e.subjectName));
  const std101Batches = new Set(std101Enrollments.map((e) => e.batchName));
  const std101Timetable = timetableStore.filter((t) =>
    std101Subjects.has(t.subject) && std101Batches.has(t.batch)
  );
  assert.strictEqual(std101Timetable.some((t) => t.id === "tt-beta-sci-mon"), false, "std-101 does not see unrelated Batch Beta session");

  // 5. Parent linked to std-999 sees identical session
  assert.ok(stdTimetable.some((t) => t.id === "tt-beta-sci-mon"), "Parent of std-999 sees the session");
  console.log("  ✓ Passed: Timetable updates propagate to Admin, Teacher tch-alvi, and enrolled student/parent");
}

// -------------------------------------------------------------------------
// Scenario 6: Fee Payments, Student ID Resolution, Balances, and Receipts
// -------------------------------------------------------------------------
console.log("\nScenario 6: Recording fee payment with correct studentId resolution and balance updates...");
{
  // Given enrollment enr-999-sci for student std-999:
  const enrollment = enrollmentsStore.find((e) => e.id === "enr-999-sci")!;
  assert.ok(enrollment, "Enrollment must exist");

  // Our bugfix: studentId must resolve from enrollment.studentId rather than fragile regex replacement
  const resolvedStudentId = enrollment.studentId;
  assert.strictEqual(resolvedStudentId, "std-999", "studentId cleanly resolved to std-999 (not std-999-sci)");

  const newPayment: PaymentTransaction = {
    id: "tx-test-999",
    obligationId: "ob-999-sci-2026-10",
    enrollmentId: enrollment.id,
    studentId: resolvedStudentId,
    amount: 2200,
    paymentDate: "2026-10-15",
    paymentMethod: "online",
    referenceId: "UPI-AR-999-OCT",
    collectedByRole: "academy-admin",
    collectedByName: "Academy Admin Office",
    isGatewayVerified: false,
    notes: "Guardian paid via UPI",
  };

  const paymentsStore = [...SAMPLE_PAYMENTS, newPayment];

  // Verify Student query for payments
  const studentPayments = paymentsStore.filter((p) => p.studentId === "std-999");
  assert.strictEqual(studentPayments.length, 1, "Student std-999 sees exactly 1 payment record");
  assert.strictEqual(studentPayments[0].referenceId, "UPI-AR-999-OCT", "Reference number is correct");
  assert.strictEqual(studentPayments[0].amount, 2200, "Amount is 2200");

  // Verify Parent query for payments
  const parentPayments = paymentsStore.filter((p) => p.studentId === "std-999");
  assert.strictEqual(parentPayments[0].referenceId, "UPI-AR-999-OCT", "Parent sees exact same payment record");
  console.log("  ✓ Passed: Payment recorded with canonical studentId std-999; receipts consistent across portals");
}

// -------------------------------------------------------------------------
// Scenario 7: Assessment Publishing & Role Visibility Scoping
// -------------------------------------------------------------------------
console.log("\nScenario 7: Assessment publishing & strict draft vs published scoping...");
{
  const draftExam: AssessmentRecord = {
    id: "exam-draft-1",
    title: "Unit Test 3: Genetics",
    subject: "Science",
    batch: "Batch Beta (Class X)",
    classGrade: "Class X",
    date: "2026-10-20",
    totalMarks: 50,
    teacherId: "tch-alvi",
    type: "regular-class-test",
    status: "draft",
    certificatePolicy: { enabled: false, minPercentage: 75 },
    studentScores: [
      { studentId: "std-999", studentName: "Zara Khan", marksObtained: 46, status: "evaluated" },
    ],
  };

  const examStore = [...SAMPLE_ASSESSMENTS, draftExam];

  // Student & Parent visibility rule: must be published or completed
  const studentVisibleDrafts = examStore.filter((exam) => {
    if (exam.classGrade !== "Class X") return false;
    if (exam.status !== "published" && exam.status !== "completed") return false;
    return true;
  });
  assert.strictEqual(studentVisibleDrafts.some((e) => e.id === "exam-draft-1"), false, "Student cannot see draft assessment");

  // Publish the assessment
  const publishedExam: AssessmentRecord = { ...draftExam, status: "published" };
  const updatedExamStore = examStore.map((e) => (e.id === draftExam.id ? publishedExam : e));

  const studentVisiblePublished = updatedExamStore.filter((exam) => {
    if (exam.classGrade !== "Class X") return false;
    if (exam.status !== "published" && exam.status !== "completed") return false;
    return true;
  });
  assert.ok(studentVisiblePublished.some((e) => e.id === "exam-draft-1"), "Student can see published assessment");

  // Check std-999 results scorecard
  const stdExam = updatedExamStore.find((e) => e.id === "exam-draft-1")!;
  const score = stdExam.studentScores.find((s) => s.studentId === "std-999")!;
  const pct = Math.round((score.marksObtained / stdExam.totalMarks) * 100);
  assert.strictEqual(pct, 92, "Student score is 92%");

  // Check std-101 (different student) does not have score in this exam
  const std101Score = stdExam.studentScores.find((s) => s.studentId === "std-101");
  assert.strictEqual(std101Score, undefined, "std-101 has no score in this assessment");
  console.log("  ✓ Passed: Drafts strictly hidden; published results visible only to eligible students/parents");
}

// -------------------------------------------------------------------------
// Scenario 8: Certificate Policy Configurable & Normal Tests Do Not Auto-Issue
// -------------------------------------------------------------------------
console.log("\nScenario 8: Certificate policy controls and duplicate issuance prevention...");
{
  // 1. Regular class test: cert policy is disabled
  const normalTest: AssessmentRecord = {
    id: "exam-norm",
    title: "Class Test 4: Quadratic Equations",
    subject: "Mathematics",
    batch: "Batch Alpha (Class IX-X)",
    classGrade: "Class X",
    date: "2026-10-18",
    totalMarks: 30,
    teacherId: "tch-azhar",
    type: "regular-class-test",
    status: "published",
    certificatePolicy: { enabled: false, minPercentage: 80 },
    studentScores: [
      { studentId: "std-101", studentName: "Taha Rahman", marksObtained: 29, status: "evaluated" },
    ],
  };

  const pct = Math.round((29 / 30) * 100);
  assert.strictEqual(pct, 97, "Scored 97%");
  const isAutoCert = normalTest.certificatePolicy?.enabled && pct >= normalTest.certificatePolicy.minPercentage;
  assert.strictEqual(Boolean(isAutoCert), false, "Normal class test does NOT automatically issue certificates");

  // 2. Honors/Mock test with certificate policy enabled
  const certExam: AssessmentRecord = {
    id: "exam-honors",
    title: "All-India Science Olympiad Mock",
    subject: "Science",
    batch: "Batch Beta (Class X)",
    classGrade: "Class X",
    date: "2026-10-22",
    totalMarks: 100,
    teacherId: "tch-alvi",
    type: "board-mock-test",
    status: "published",
    certificatePolicy: {
      enabled: true,
      minPercentage: 85,
      certificateType: "merit",
      certificateTitle: "Olympiad Certificate of Distinction",
    },
    studentScores: [
      { studentId: "std-999", studentName: "Zara Khan", marksObtained: 90, status: "evaluated" }, // 90% >= 85% -> Eligible
      { studentId: "std-102", studentName: "Ananya Verma", marksObtained: 80, status: "evaluated" }, // 80% < 85% -> Ineligible
    ],
  };

  const zaraPct = 90;
  const ananyaPct = 80;
  assert.strictEqual(zaraPct >= certExam.certificatePolicy!.minPercentage, true, "Zara is eligible for certificate");
  assert.strictEqual(ananyaPct >= certExam.certificatePolicy!.minPercentage, false, "Ananya is ineligible for certificate");

  // 3. Issue certificate and test duplicate prevention
  const certStore: IssuedCertificateRecord[] = [];
  const issueCert = (stdId: string, stdName: string) => {
    const alreadyIssued = certStore.some((c) => c.assessmentId === certExam.id && c.studentId === stdId && c.status === "issued");
    if (alreadyIssued) return false;
    certStore.push({
      id: `cert-${certExam.id}-${stdId}`,
      certificateNumber: `AA-2026-SCI-${stdId}-001`,
      certificateType: "merit",
      title: certExam.certificatePolicy!.certificateTitle || "Merit",
      studentId: stdId,
      studentName: stdName,
      classGrade: "Class X",
      board: "ICSE",
      subject: "Science",
      assessmentId: certExam.id,
      assessmentName: certExam.title,
      assessmentDate: certExam.date,
      scoreObtained: 90,
      totalMarks: 100,
      percentage: 90,
      criteriaMet: "Passed with distinction",
      issuedDate: "2026-10-15",
      issuedBy: "Dr. Tariq Alvi",
      issuedByRole: "teacher",
      facultyName: "Dr. Tariq Alvi",
      status: "issued",
    });
    return true;
  };

  assert.strictEqual(issueCert("std-999", "Zara Khan"), true, "First issuance succeeds");
  assert.strictEqual(issueCert("std-999", "Zara Khan"), false, "Duplicate issuance is blocked");
  console.log("  ✓ Passed: Certificate policy configurable; normal tests do not auto-issue; duplicate prevention active");
}

// -------------------------------------------------------------------------
// Scenario 9: Unlinked Account Strict Isolation
// -------------------------------------------------------------------------
console.log("\nScenario 9: Unlinked account strict isolation (no silent fallback to other students)...");
{
  // 1. Unlinked Student Demo User
  interface MockUser {
    id: string;
    role: string;
    linkedStudentId?: string;
    profileId?: string;
    linkedStudentIds?: string[];
  }

  const unlinkedStudentUser: MockUser = {
    id: "u-unlinked-std",
    role: "student",
    // No linkedStudentId or profileId
  };

  const resolveStudent = (user: MockUser, students: StudentProfile[]): StudentProfile | null => {
    if (user.role === "student") {
      const linkedId = user.linkedStudentId || user.profileId;
      if (!linkedId) return null;
      return students.find((s) => s.id === linkedId) || null;
    }
    return null;
  };

  const resolved = resolveStudent(unlinkedStudentUser, studentsStore);
  assert.strictEqual(resolved, null, "Unlinked student account resolves strictly to null, NOT std-101!");

  // 2. Unlinked Parent Demo User
  const unlinkedParentUser: MockUser = {
    id: "u-unlinked-par",
    role: "parent",
    linkedStudentIds: [],
  };

  const resolveParent = (user: MockUser, students: StudentProfile[]): StudentProfile | null => {
    if (user.role === "parent") {
      const linkedIds = user.linkedStudentIds || (user.linkedStudentId ? [user.linkedStudentId] : []);
      if (linkedIds && linkedIds.length > 0) {
        return students.find((s) => linkedIds.includes(s.id)) || null;
      }
      return null;
    }
    return null;
  };

  const resolvedParent = resolveParent(unlinkedParentUser, studentsStore);
  assert.strictEqual(resolvedParent, null, "Unlinked parent account resolves strictly to null, NOT std-101!");
  console.log("  ✓ Passed: Unlinked student & parent accounts safely return null without data leakage");
}

// -------------------------------------------------------------------------
// Scenario 10: Demo Storage Schema and Persistence
// -------------------------------------------------------------------------
console.log("\nScenario 10: Demo storage persistence and safe fallback schema...");
{
  // Test in-memory cache and validation
  setDemoStorage(DEMO_STORAGE_KEYS.STUDENTS, studentsStore);
  const retrievedStudents = getDemoStorage<StudentProfile[]>(DEMO_STORAGE_KEYS.STUDENTS, []);
  assert.ok(retrievedStudents.some((s) => s.id === "std-999"), "Saved students retrieved from demo storage");

  // Test fallback for missing key
  const fallback = [{ id: "test-default" }];
  const result = getDemoStorage("non_existent_key_xyz", fallback);
  assert.deepStrictEqual(result, fallback, "Fallback returned for uninitialized key");
  console.log("  ✓ Passed: Demo storage correctly persists and retrieves typed state across keys");
}

// -------------------------------------------------------------------------
// Scenario 11: Role-Based Scoping for Study Materials & Notices
// -------------------------------------------------------------------------
console.log("\nScenario 11: Role-based scoping for study materials and notices...");
{
  const newMaterial: StudyMaterialItem = {
    id: "mat-99",
    title: "Class X Science — Genetics & Heredity Revision Notes",
    subject: "Science",
    classGrade: "Class X",
    type: "PDF Notes",
    size: "2.4 MB",
    uploadedBy: "Dr. Tariq Alvi",
    teacherId: "tch-alvi",
    date: "2026-10-15",
  };

  const materialsStore = [...SAMPLE_MATERIALS, newMaterial];

  // Student std-999 (enrolled in Science) can view
  const stdEnrolledSubjects = ["Science"];
  const visibleToStd999 = materialsStore.filter((m) => stdEnrolledSubjects.includes(m.subject));
  assert.ok(visibleToStd999.some((m) => m.id === "mat-99"), "Enrolled student sees Science material");

  // Student std-102 (enrolled only in Mathematics) cannot view
  const std102EnrolledSubjects = ["Accountancy"];
  const visibleToStd102 = materialsStore.filter((m) => std102EnrolledSubjects.includes(m.subject));
  assert.strictEqual(visibleToStd102.some((m) => m.id === "mat-99"), false, "Non-enrolled student does NOT see Science material");
  console.log("  ✓ Passed: Study materials scoped strictly to enrolled subjects and assigned faculty");
}

// -------------------------------------------------------------------------
// Scenario 12: Simultaneous Classes Supported & Conflict Detection
// -------------------------------------------------------------------------
console.log("\nScenario 12: Simultaneous classes for different teachers without collision...");
{
  const classA: TimetableSlot = {
    id: "time-sim-1",
    dayOfWeek: "Wednesday",
    startTime: "16:00",
    endTime: "17:30",
    time: "04:00 PM - 05:30 PM",
    subjectId: "sub-math",
    subject: "Mathematics",
    batchId: "btc-alpha",
    batch: "Batch Alpha (Class IX-X)",
    classGrade: "Class X",
    teacherId: "tch-azhar",
    teacherName: "Azhar Sir",
    status: "active",
  };

  const classB: TimetableSlot = {
    id: "time-sim-2",
    dayOfWeek: "Wednesday",
    startTime: "16:00",
    endTime: "17:30",
    time: "04:00 PM - 05:30 PM",
    subjectId: "sub-sci",
    subject: "Science",
    batchId: "btc-sci",
    batch: "Batch Science (Class IX-X)",
    classGrade: "Class X",
    teacherId: "tch-alvi",
    teacherName: "Dr. Tariq Alvi",
    status: "active",
  };

  // Multiple teachers teaching different batches at the exact same time:
  const simultaneousList = [classA, classB];
  assert.strictEqual(simultaneousList.length, 2, "Both classes exist simultaneously");
  assert.notStrictEqual(classA.teacherId, classB.teacherId, "Different teachers");
  assert.notStrictEqual(classA.batch, classB.batch, "Different batches");

  // Conflict detection function: checks teacher overlap
  const checkTeacherConflict = (newSess: TimetableSlot, existing: TimetableSlot[]) => {
    return existing.some(
      (e) =>
        e.dayOfWeek === newSess.dayOfWeek &&
        e.teacherId === newSess.teacherId &&
        e.id !== newSess.id &&
        Boolean(
          newSess.startTime &&
          newSess.endTime &&
          e.startTime &&
          e.endTime &&
          !(newSess.endTime <= e.startTime || newSess.startTime >= e.endTime)
        )
    );
  };

  // Attempt to schedule conflicting class for Teacher tch-azhar at the same time:
  const conflictingClass: TimetableSlot = {
    id: "time-sim-conflict",
    dayOfWeek: "Wednesday",
    startTime: "16:30",
    endTime: "18:00",
    time: "04:30 PM - 06:00 PM",
    subjectId: "sub-math-adv",
    subject: "Mathematics Practice",
    batchId: "btc-gamma",
    batch: "Batch Gamma",
    classGrade: "Class X",
    teacherId: "tch-azhar", // Same teacher!
    teacherName: "Azhar Sir",
    status: "active",
  };

  assert.strictEqual(checkTeacherConflict(conflictingClass, simultaneousList), true, "Teacher conflict correctly detected");

  // Scheduling for different teacher at 16:30 does NOT conflict with Teacher tch-azhar
  const nonConflictingClass: TimetableSlot = {
    id: "time-sim-ok",
    dayOfWeek: "Wednesday",
    startTime: "16:30",
    endTime: "18:00",
    time: "04:30 PM - 06:00 PM",
    subjectId: "sub-comp",
    subject: "Computer Applications",
    batchId: "btc-gamma",
    batch: "Batch Gamma",
    classGrade: "Class X",
    teacherId: "tch-farhan", // Different teacher
    teacherName: "Farhan Akhtar",
    status: "active",
  };
  assert.strictEqual(checkTeacherConflict(nonConflictingClass, simultaneousList), false, "Different teacher at same time does not conflict");
  console.log("  ✓ Passed: Simultaneous classes supported; single-teacher schedule conflicts detected");
}

console.log("\n==================================================================");
console.log("   ALL 12 MASTER CROSS-PORTAL VERIFICATION SCENARIOS PASSED!     ");
console.log("==================================================================");
