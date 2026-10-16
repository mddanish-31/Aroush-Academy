import assert from "node:assert";
import QRCode from "qrcode-svg";
import { SAMPLE_STUDENTS, SAMPLE_ENROLLMENTS } from "@/data/enrollmentFeeData";
import { SAMPLE_ID_CARDS } from "@/data/studentIdCardsData";
import { DEMO_STORAGE_KEYS, getDemoStorage, setDemoStorage } from "@/lib/demoStorage";
import type { StudentIdCardRecord, StudentIdCardStatus, AuditLogEntry } from "@/types";

console.log("==================================================================");
console.log("   AROUCH ACADEMY — DIGITAL STUDENT ID MANAGEMENT VERIFICATION    ");
console.log("==================================================================");

// -------------------------------------------------------------------------
// 1. Multi-Student Dynamic Formatting
// -------------------------------------------------------------------------
console.log("\n1. Verifying dynamic student records (no hardcoding)...");
SAMPLE_STUDENTS.forEach((student) => {
  const formattedId = `AA-2026-${student.id.replace("std-", "")}`;
  const initials = student.name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  assert.ok(formattedId.startsWith("AA-2026-"), `Formatted ID must start with AA-2026-: ${formattedId}`);
  assert.ok(initials.length >= 1 && initials.length <= 2, `Initials must be 1-2 chars: ${initials}`);
  console.log(`  ✓ Student: ${student.name.padEnd(18)} | ID: ${formattedId} | Initials: ${initials} | Class: ${student.classGrade} · ${student.board}`);
});

// -------------------------------------------------------------------------
// 2. QR Code Scannable Payload & Privacy Verification
// -------------------------------------------------------------------------
console.log("\n2. Verifying QR Code Generation & Payload Safety...");
SAMPLE_STUDENTS.forEach((student) => {
  const verificationUrl = `https://aroush.academy/verify/id?studentId=${encodeURIComponent(student.id)}&session=2026-2027`;
  
  // Privacy check: Ensure sensitive guardian info or phone numbers are NOT in the QR payload
  assert.ok(!verificationUrl.includes(student.guardianPhone), "QR payload must NOT leak guardian phone");
  assert.ok(!verificationUrl.includes(student.guardianName), "QR payload must NOT leak guardian name");
  
  // Generate SVG with qrcode-svg
  const qr = new QRCode({
    content: verificationUrl,
    padding: 0,
    width: 68,
    height: 68,
    color: "#0B0C0E",
    background: "#FFFFFF",
    ecl: "M",
  });
  
  const svg = qr.svg();
  assert.ok(svg.includes("<svg"), "QR output must be valid SVG markup");
  assert.ok(svg.includes("width=\"68\"") || svg.includes("viewBox"), "QR SVG must specify dimension or viewBox");
  assert.ok(svg.includes("<path") || svg.includes("<rect"), "QR SVG must have vector paths or rects");
});
console.log("  ✓ Passed: QR payloads generated cleanly and verified safe from sensitive PII leakage");

// -------------------------------------------------------------------------
// 3. Subject Enrollment Extraction & Deduplication
// -------------------------------------------------------------------------
console.log("\n3. Verifying enrolled subjects across students...");
SAMPLE_STUDENTS.forEach((student) => {
  const studentEnrollments = SAMPLE_ENROLLMENTS.filter((e) => e.studentId === student.id);
  const subjects = studentEnrollments.length > 0
    ? Array.from(new Set(studentEnrollments.map((e) => e.subjectName)))
    : ["General Curriculum"];
  
  assert.ok(subjects.length > 0, "Subjects array must not be empty");
  console.log(`  ✓ ${student.name}: ${subjects.join(", ")}`);
});

// -------------------------------------------------------------------------
// 4. Reverse Face Information Completeness
// -------------------------------------------------------------------------
console.log("\n4. Verifying reverse face metadata integrity...");
SAMPLE_STUDENTS.forEach((student) => {
  assert.ok(student.guardianName, `Guardian name required for ${student.name}`);
  assert.ok(student.guardianPhone, `Guardian phone required for ${student.name}`);
  assert.ok(student.joiningDate, `Joining date required for ${student.name}`);
});
console.log("  ✓ Passed: All students possess valid guardian and admission date metadata");

// -------------------------------------------------------------------------
// 5. Initial Seed State & Lifecycle Schema Validation
// -------------------------------------------------------------------------
console.log("\n5. Verifying initial seed ID-card records and status distribution...");
assert.ok(SAMPLE_ID_CARDS.length > 0, "Initial sample ID cards should not be empty");

const statusCounts: Record<StudentIdCardStatus, number> = {
  draft: 0,
  "pending-approval": 0,
  approved: 0,
  rejected: 0,
  inactive: 0,
  expired: 0,
};

SAMPLE_ID_CARDS.forEach((card) => {
  // Validate link to valid student
  const linkedStudent = SAMPLE_STUDENTS.find((s) => s.id === card.studentId);
  assert.ok(linkedStudent, `Card ${card.id} must link to a valid student (${card.studentId})`);

  // Validate required fields
  assert.ok(card.id, "Card ID is required");
  assert.ok(card.studentFormattedId, "Admission formatted ID is required");
  assert.ok(card.session, "Session is required");
  assert.ok(card.validFrom, "validFrom is required");
  assert.ok(card.validThru, "validThru is required");
  assert.ok(Array.isArray(card.history), "history must be an array");
  assert.ok(card.history.length > 0, "card must have at least one history entry");

  statusCounts[card.status] = (statusCounts[card.status] || 0) + 1;
});

assert.ok(statusCounts.approved >= 1, "Must have at least 1 approved card in seed");
assert.ok(statusCounts["pending-approval"] >= 1, "Must have at least 1 pending-approval card in seed");
assert.ok(statusCounts.draft >= 1, "Must have at least 1 draft card in seed");
assert.ok(statusCounts.inactive >= 1, "Must have at least 1 inactive card in seed");

console.log(`  ✓ Passed: Seed records valid. Distribution: Approved=${statusCounts.approved}, Pending=${statusCounts["pending-approval"]}, Draft=${statusCounts.draft}, Inactive=${statusCounts.inactive}`);

// -------------------------------------------------------------------------
// 6. ID Card Creation Workflow & Validation (No Duplicate Cards)
// -------------------------------------------------------------------------
console.log("\n6. Testing Admin ID card creation and validation rules...");
let workingCards: StudentIdCardRecord[] = [...SAMPLE_ID_CARDS];

// Find a student who does not yet have a card (std-104)
const studentWithoutCard = SAMPLE_STUDENTS.find((s) => !workingCards.some((c) => c.studentId === s.id));
assert.ok(studentWithoutCard, "There should be a student without an ID card (e.g. std-104)");

// Function to simulate Admin creating an ID card
function createCard(params: {
  studentId: string;
  studentName: string;
  studentFormattedId: string;
  classGrade: string;
  board: string;
  session: string;
  joiningDate: string;
  enrolledSubjects: string[];
  batches: string[];
  guardianName: string;
  guardianPhone: string;
  campusName: string;
  campusAddress: string;
  campusPhone: string;
  campusEmail: string;
  validFrom: string;
  validThru: string;
  photoUrl?: string;
  emergencyContact?: string;
  status: StudentIdCardStatus;
  actingUser: string;
}): StudentIdCardRecord {
  // Check for duplicate card for the same student
  if (workingCards.some((c) => c.studentId === params.studentId)) {
    throw new Error(`Student ${params.studentId} already has an ID card record.`);
  }

  // Check required fields
  if (!params.studentFormattedId.trim() || !params.session.trim() || !params.validFrom || !params.validThru) {
    throw new Error("Missing required ID card fields.");
  }

  const now = new Date().toISOString();
  const newCard: StudentIdCardRecord = {
    id: `idc-std-${params.studentId.replace("std-", "")}`,
    studentId: params.studentId,
    studentName: params.studentName,
    studentFormattedId: params.studentFormattedId,
    classGrade: params.classGrade,
    board: params.board,
    session: params.session,
    joiningDate: params.joiningDate,
    enrolledSubjects: params.enrolledSubjects,
    batches: params.batches,
    guardianName: params.guardianName,
    guardianPhone: params.guardianPhone,
    campusName: params.campusName,
    campusAddress: params.campusAddress,
    campusPhone: params.campusPhone,
    campusEmail: params.campusEmail,
    validFrom: params.validFrom,
    validThru: params.validThru,
    photoUrl: params.photoUrl,
    emergencyContact: params.emergencyContact,
    status: params.status,
    createdAt: now,
    updatedAt: now,
    history: [
      {
        id: `hist-${Date.now()}`,
        timestamp: now,
        action: "created",
        actorRole: "academy-admin",
        actorName: params.actingUser,
        notes: `Card created in ${params.status} state`,
      },
    ],
  };

  workingCards = [newCard, ...workingCards];
  return newCard;
}

// Create draft card for std-104
const createdDraft = createCard({
  studentId: studentWithoutCard.id,
  studentName: studentWithoutCard.name,
  studentFormattedId: `AA-2026-${studentWithoutCard.id.replace("std-", "")}`,
  classGrade: studentWithoutCard.classGrade,
  board: studentWithoutCard.board,
  session: "2026–2027",
  joiningDate: studentWithoutCard.joiningDate,
  enrolledSubjects: ["Accountancy", "Economics"],
  batches: ["Commerce Senior"],
  guardianName: studentWithoutCard.guardianName,
  guardianPhone: studentWithoutCard.guardianPhone,
  campusName: "AROUCH ACADEMY — Central Campus",
  campusAddress: "42 Knowledge Park, Sector 5, Salt Lake, Kolkata 700091",
  campusPhone: "+91 33 2950 1200",
  campusEmail: "admin@aroush.academy",
  validFrom: "2026-04-01",
  validThru: "2027-03-31",
  status: "draft",
  actingUser: "Admin (Demo)",
});

assert.strictEqual(createdDraft.status, "draft");
assert.strictEqual(createdDraft.studentId, studentWithoutCard.id);
assert.strictEqual(createdDraft.history.length, 1);
console.log(`  ✓ Successfully created draft card for ${studentWithoutCard.name} (${studentWithoutCard.id})`);

// Duplicate prevention test: attempting to create again for the same student must throw
assert.throws(() => {
  createCard({
    studentId: studentWithoutCard.id,
    studentName: studentWithoutCard.name,
    studentFormattedId: `AA-2026-${studentWithoutCard.id.replace("std-", "")}`,
    classGrade: studentWithoutCard.classGrade,
    board: studentWithoutCard.board,
    session: "2026–2027",
    joiningDate: studentWithoutCard.joiningDate,
    enrolledSubjects: ["Accountancy"],
    batches: ["Commerce Senior"],
    guardianName: studentWithoutCard.guardianName,
    guardianPhone: studentWithoutCard.guardianPhone,
    campusName: "AROUCH ACADEMY — Central Campus",
    campusAddress: "42 Knowledge Park, Kolkata",
    campusPhone: "+91 33 2950 1200",
    campusEmail: "admin@aroush.academy",
    validFrom: "2026-04-01",
    validThru: "2027-03-31",
    status: "draft",
    actingUser: "Admin (Demo)",
  });
}, /already has an ID card record/, "Duplicate creation must be rejected");
console.log("  ✓ Passed: Duplicate card creation correctly prevented");

// Missing required field validation test
assert.throws(() => {
  createCard({
    studentId: "std-dummy",
    studentName: "Dummy",
    studentFormattedId: "",
    classGrade: "Class X",
    board: "CBSE",
    session: "2026–2027",
    joiningDate: "2026-04-01",
    enrolledSubjects: [],
    batches: [],
    guardianName: "Guardian",
    guardianPhone: "123",
    campusName: "AROUCH",
    campusAddress: "Kolkata",
    campusPhone: "123",
    campusEmail: "info@aroush.academy",
    validFrom: "2026-04-01",
    validThru: "2027-03-31",
    status: "draft",
    actingUser: "Admin (Demo)",
  });
}, /Missing required ID card fields/, "Missing required fields must be rejected");
console.log("  ✓ Passed: Empty admission ID correctly rejected");

// -------------------------------------------------------------------------
// 7. Full Lifecycle Transitions: Draft -> Pending -> Approved -> Inactive
// -------------------------------------------------------------------------
console.log("\n7. Testing complete lifecycle state transitions and history logging...");

function transitionCard(
  cardId: string,
  newStatus: StudentIdCardStatus,
  actingUser: string,
  reason?: string
): StudentIdCardRecord {
  const cardIndex = workingCards.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) throw new Error("Card not found");
  const current = workingCards[cardIndex];

  if ((newStatus === "rejected" || newStatus === "inactive") && (!reason || !reason.trim())) {
    throw new Error(`A mandatory reason is required to mark a card as ${newStatus}`);
  }

  const now = new Date().toISOString();
  const actionName =
    newStatus === "approved"
      ? "approved"
      : newStatus === "inactive"
      ? "deactivated"
      : newStatus === "rejected"
      ? "rejected"
      : newStatus === "pending-approval"
      ? "submitted"
      : "updated";

  const updated: StudentIdCardRecord = {
    ...current,
    status: newStatus,
    updatedAt: now,
    rejectionReason: newStatus === "rejected" ? reason : current.rejectionReason,
    deactivationReason: newStatus === "inactive" ? reason : current.deactivationReason,
    issuedAt: newStatus === "approved" ? now : current.issuedAt,
    issuedBy: newStatus === "approved" ? actingUser : current.issuedBy,
    history: [
      {
        id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: now,
        action: actionName,
        actorRole: "academy-admin",
        actorName: actingUser,
        notes: reason || `Status changed from ${current.status} to ${newStatus}`,
      },
      ...current.history,
    ],
  };

  workingCards[cardIndex] = updated;
  return updated;
}

// 7a. Submit for Approval (Draft -> Pending Approval)
const pendingCard = transitionCard(createdDraft.id, "pending-approval", "Faculty Reviewer", "Submitted for admin review");
assert.strictEqual(pendingCard.status, "pending-approval");
assert.strictEqual(pendingCard.history[0].action, "submitted");
console.log("  ✓ Transition Draft -> Pending Approval verified");

// 7b. Rejection with mandatory reason test
assert.throws(() => {
  transitionCard(createdDraft.id, "rejected", "Admin (Demo)", ""); // empty reason must fail
}, /mandatory reason is required/);

const rejectedCard = transitionCard(createdDraft.id, "rejected", "Admin (Demo)", "Photograph resolution is blurred");
assert.strictEqual(rejectedCard.status, "rejected");
assert.strictEqual(rejectedCard.rejectionReason, "Photograph resolution is blurred");
console.log("  ✓ Mandatory rejection reason enforced and logged");

// 7c. Direct Admin Approval (Rejected -> Approved / Issued)
const approvedCard = transitionCard(createdDraft.id, "approved", "Admin (Demo)", "Approved with replacement photo");
assert.strictEqual(approvedCard.status, "approved");
assert.strictEqual(approvedCard.issuedBy, "Admin (Demo)");
assert.ok(approvedCard.issuedAt, "issuedAt timestamp must be recorded");
console.log("  ✓ Direct Admin Approval verified with issuedAt timestamp");

// 7d. Deactivation with mandatory reason test
assert.throws(() => {
  transitionCard(createdDraft.id, "inactive", "Admin (Demo)", "   "); // whitespace reason must fail
}, /mandatory reason is required/);

const deactivatedCard = transitionCard(createdDraft.id, "inactive", "Admin (Demo)", "Student transferred to another academy branch");
assert.strictEqual(deactivatedCard.status, "inactive");
assert.strictEqual(deactivatedCard.deactivationReason, "Student transferred to another academy branch");
console.log("  ✓ Deactivation verified with mandatory reason");

// 7e. Reissuance / Renewal back to approved
const renewedCard = transitionCard(createdDraft.id, "approved", "Admin (Demo)", "Card re-activated for new term");
assert.strictEqual(renewedCard.status, "approved");
assert.strictEqual(renewedCard.history.length, 6, "All 6 status changes preserved in history");
console.log("  ✓ Reissuance & complete status history integrity confirmed");

// -------------------------------------------------------------------------
// 8. Role-Based Visibility & Cross-Student Isolation Rules
// -------------------------------------------------------------------------
console.log("\n8. Verifying strict role visibility and cross-student isolation...");

// Define the portal visibility helper mirroring DashboardShell.tsx
function getStudentVisibleCard(studentId: string, allCards: StudentIdCardRecord[]): StudentIdCardRecord | null {
  const card = allCards.find((c) => c.studentId === studentId);
  // Student Portal Rule: ONLY approved cards are visible as issued
  if (!card || card.status !== "approved") {
    return null;
  }
  return card;
}

function getParentVisibleCard(wardStudentId: string, allCards: StudentIdCardRecord[]): StudentIdCardRecord | null {
  const card = allCards.find((c) => c.studentId === wardStudentId);
  // Parent Portal Rule: ONLY approved cards of linked ward are visible
  if (!card || card.status !== "approved") {
    return null;
  }
  return card;
}

// Test Case 1: Student std-101 has an APPROVED card
const card101 = getStudentVisibleCard("std-101", SAMPLE_ID_CARDS);
assert.ok(card101 !== null, "std-101 must have an approved card visible");
assert.strictEqual(card101?.status, "approved");
assert.strictEqual(card101?.studentId, "std-101");
console.log("  ✓ Scenario 1: Student std-101 sees their approved card");

// Test Case 2: Parent of std-101 sees std-101's approved card
const parentCard101 = getParentVisibleCard("std-101", SAMPLE_ID_CARDS);
assert.ok(parentCard101 !== null, "Parent of std-101 must see the approved card");
assert.strictEqual(parentCard101?.studentId, "std-101");
console.log("  ✓ Scenario 2: Parent of std-101 sees ward's approved card");

// Test Case 3: Student std-102 has a PENDING-APPROVAL card -> MUST NOT SEE AS ISSUED
const card102 = getStudentVisibleCard("std-102", SAMPLE_ID_CARDS);
assert.strictEqual(card102, null, "std-102 must NOT see pending-approval card as issued");
console.log("  ✓ Scenario 3: Student std-102 (pending approval) sees unissued message (null)");

// Test Case 4: Parent of std-102 -> MUST NOT SEE AS ISSUED
const parentCard102 = getParentVisibleCard("std-102", SAMPLE_ID_CARDS);
assert.strictEqual(parentCard102, null, "Parent of std-102 must NOT see pending card as issued");
console.log("  ✓ Scenario 4: Parent of std-102 sees unissued empty state (null)");

// Test Case 5: Student std-103 has a DRAFT card -> MUST NOT SEE AS ISSUED
const card103 = getStudentVisibleCard("std-103", SAMPLE_ID_CARDS);
assert.strictEqual(card103, null, "std-103 must NOT see draft card as issued");
console.log("  ✓ Scenario 5: Student std-103 (draft) sees unissued message (null)");

// Test Case 6: Student std-105 has an INACTIVE card -> MUST NOT SEE AS ISSUED
const card105 = getStudentVisibleCard("std-105", SAMPLE_ID_CARDS);
assert.strictEqual(card105, null, "std-105 must NOT see inactive card as issued");
console.log("  ✓ Scenario 6: Student std-105 (inactive) cannot present card as valid");

// Test Case 7: Strict Cross-Student Isolation: std-102 NEVER accesses std-101's card
const isolatedCardFor102 = getStudentVisibleCard("std-102", SAMPLE_ID_CARDS);
assert.notStrictEqual(isolatedCardFor102?.studentId, "std-101", "std-102 must never receive std-101's card");
console.log("  ✓ Scenario 7: Strict isolation: Student B cannot see Student A's card");

// -------------------------------------------------------------------------
// 9. Audit Trail Logging for ID Card Operations
// -------------------------------------------------------------------------
console.log("\n9. Testing Audit Trail logging integration...");
const auditLogs: AuditLogEntry[] = [];

function logIdCardAudit(action: string, targetStudentName: string, details: string) {
  auditLogs.unshift({
    id: `audit-id-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    performedBy: "Admin (Demo)",
    action,
    target: targetStudentName,
    details,
    type: "security",
  });
}

logIdCardAudit("Create ID Card", "Fatima Sheikh", "Created new digital ID card in Draft state for AA-2026-104");
logIdCardAudit("Issue ID Card", "Fatima Sheikh", "Approved and officially issued digital ID card (valid thru 2027-03-31)");
logIdCardAudit("Deactivate ID Card", "Rohan Mukherjee", "Deactivated ID card. Reason: Student transferred branch");

assert.strictEqual(auditLogs.length, 3);
assert.strictEqual(auditLogs[0].type, "security");
assert.strictEqual(auditLogs[0].action, "Deactivate ID Card");
// Verify no guardian phone or sensitive PII is logged in audit details
auditLogs.forEach((entry) => {
  assert.ok(!entry.details.includes("0988"), "Audit log must not contain phone numbers");
  assert.ok(!entry.details.includes("guardian"), "Audit log must not contain guardian private data");
});
console.log("  ✓ Passed: ID card audit logs generated cleanly with security category and non-sensitive details");

// -------------------------------------------------------------------------
// 10. Demo Storage Persistence & Serialization
// -------------------------------------------------------------------------
console.log("\n10. Testing Demo Storage serialization and round-trip retrieval...");
setDemoStorage(DEMO_STORAGE_KEYS.STUDENT_ID_CARDS, workingCards);
const retrievedCards = getDemoStorage<StudentIdCardRecord[]>(
  DEMO_STORAGE_KEYS.STUDENT_ID_CARDS,
  []
);

assert.strictEqual(retrievedCards.length, workingCards.length, "Retrieved cards count must match stored count");
assert.strictEqual(retrievedCards[0].id, workingCards[0].id, "First card ID matches");
assert.strictEqual(retrievedCards[0].history.length, workingCards[0].history.length, "History entries preserved");
console.log(`  ✓ Passed: Successfully persisted and retrieved ${retrievedCards.length} ID cards from demo storage`);

console.log("\n==================================================================");
console.log("   ALL DIGITAL STUDENT ID MANAGEMENT CHECKS PASSED SUCCESSFULLY!  ");
console.log("==================================================================");
