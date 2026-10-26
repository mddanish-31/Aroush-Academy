# ArousH Academy — Comprehensive Repository Audit Report

**Branch**: `frontend-redesign`  
**Stack**: Next.js 16.4.0, React 19, TypeScript, App Router  
**Audit Scope**: Phases 0 to 6 (Inventory, Public Site, Auth, Setup, Learning Modules, Money & Admin, Cross-Cutting)  
**Audit Date**: 2026-10-26  
**Auditor**: Antigravity Automated Read-Only Audit Suite  

---

## 1. Blocker and High Findings Table

All blocker and high-severity findings compiled across all audit phases, sorted by severity:

| Finding ID | Severity | File & Line Reference | One-Line Problem | One-Line Fix |
|:---|:---|:---|:---|:---|
| **P2-001** | **Blocker** | `src/lib/auth/demoAuthAdapter.ts:480` | Self-registration persists unhashed plaintext passwords directly into browser `localStorage` under `aroush_demo_registration_requests_v1`. | Remove plaintext password persistence and transition to server-side salted bcrypt/Argon2 hashing. |
| **P4-001** | **Blocker** | `src/data/mockExamData.ts:40`, `src/components/dashboard/AssessmentsModule.tsx:927` | MCQ exam questions deliver the answer key (`correctOptionIndex`) directly to the client browser in the test payload, allowing students to extract correct answers via DevTools. | Strip `correctOptionIndex` from client-delivered exam payloads and validate student submissions on a secure server endpoint. |
| **P4-002** | **Blocker** | `src/lib/demoStorage.ts:100-140`, `src/components/dashboard/DashboardShell.tsx:280-340` | Modifying `linkedStudentId` in localStorage allows any user to assume another student's identity and view their private attendance, tests, marks, fee receipts, and digital ID card. | Implement server-side session authentication with database authorization checks so the server strictly scopes records to the authenticated user ID. |
| **P5-001** | **Blocker** | `src/components/dashboard/FeesModule.tsx:860` | Payment proof screenshot uploads are converted to raw base64 data URLs and written directly to client `localStorage`, causing storage quota crashes (`QuotaExceededError`). | Upload binary files to secure object storage via multipart form data and store only the resulting secure asset URL in the database. |
| **P5-002** | **Blocker** | `src/components/dashboard/AuditLogsModule.tsx:1102` | The administrative audit log is stored in client `localStorage` and can be completely wiped via a "Confirm Reset" button or manipulated in DevTools. | Store audit records in an append-only, tamper-evident server-side database table with restricted access and no client deletion endpoints. |
| **P1-001** | **High** | `src/content/site.ts:45,57,63,69,111` | Header navigation and footer links point to broken or mismatched anchor IDs (`/#campus`, `/#visit`, `/#courses-v-viii`, `/#courses-ix-x`, `/#courses-xi-xii`). | Align anchor hrefs to singular IDs (`/#course-v-viii`, `/#course-ix-x`, `/#course-xi-xii`) and add `id="campus"` to AcademyIntro and `id="visit"` to EnquirySection. |
| **P2-002** | **High** | `src/lib/auth/demoAuthAdapter.ts:90-108` | Injecting an invalid or arbitrary role string into localStorage causes the dashboard to crash with an unhandled React error boundary. | Add a runtime Zod/TypeScript guard validating that `user.role` matches the expected enum and fall back safely to null on invalid roles. |
| **P3-001** | **High** | `src/components/dashboard/DirectoryModule.tsx:1-6056` | Monolithic file size of 6,056 lines severely degrades maintainability, testability, and code review efficiency. | Decompose directory into `StudentListTable`, `StudentDetailDrawer`, `SubjectEnrollmentModal`, and `FacultyDirectoryTab`. |
| **P4-003** | **High** | `src/components/dashboard/DirectoryModule.tsx:3403`, `AssessmentsModule.tsx:459` | Certificate eligibility logic is duplicated and contradictory across modules: DirectoryModule hardcodes qualification at `>= 75%`, ignoring dynamic assessment thresholds in AssessmentsModule. | Extract certificate qualification calculation into a single canonical function in `src/lib/assessmentVisibility.ts` shared by all modules. |
| **P5-003** | **High** | `src/components/dashboard/FeesModule.tsx:205` | Unlinked parent accounts fall back to displaying the first student in the database (`students[0]`), leaking private fee records of unrelated families. | Return `null` when a parent account has no linked student and render an explicit unlinked prompt rather than falling back to `students[0]`. |
| **P5-004** | **High** | `src/components/dashboard/FeeReceiptModal.tsx:46` | Printable digital receipts and merit certificates display official government registration claims and directorate seals generated without server validation. | Generate downloadable official receipts and certificates only via a backend service with cryptographic signatures, verification hashes, and persistent ledger backing. |
| **P5-005** | **High** | `src/components/dashboard/IdCardManagementModule.tsx:331` | Student ID card photo uploads convert images to base64 strings stored in client `localStorage`. | Replace client-side base64 storage with an authenticated image upload endpoint that stores optimized photos in a CDN or asset bucket. |
| **P6-001** | **High** | `src/components/dashboard/DashboardShell.tsx:920` | Mobile module navigation selector dropdown (`#mobile-module-select`) lacks an accessible name or label, failing axe-core critical rule `select-name`. | Add `aria-label="Select dashboard module"` to the `<select>` element. |
| **P6-002** | **High** | `src/components/dashboard/DashboardShell.tsx:1-40` | Monolithic static imports in `DashboardShell` bundle all admin, faculty, and student dashboard code into a single 763.7 KB client chunk (`2wqq-uyfnloyc.js`). | Use `next/dynamic` to lazy-load dashboard modules conditionally on the active role and tab. |

---

## 2. Backend Contract Specification

For every domain entity identified across Phases 2 to 5, the following table defines ownership, access control rules, and current simulation persistence:

| Entity Name | Core Fields | Owning Role | Read Permissions | Write Permissions | Current Storage Key |
|:---|:---|:---|:---|:---|:---|
| **AuthUser** | `id`, `name`, `identifier`, `role`, `profileId`, `linkedStudentId`, `linkedStudentIds` | `system` | Authenticated user (self) | `academy-admin` (approval), user (register) | `aroush_demo_auth_user` |
| **RegistrationRequest** | `id`, `name`, `identifier`, `role`, `status`, `submittedAt`, `classGrade`, `wardName`, `linkedStudentId`, `reviewedAt`, `reviewedBy`, `rejectionReason` | `academy-admin` | `academy-admin`, applicant (self status) | Applicant (create), `academy-admin` (approve/reject) | `aroush_demo_registration_requests_v1` |
| **StudentProfile** | `id`, `name`, `admissionNumber`, `classGrade`, `board`, `schoolName`, `guardianName`, `guardianPhone`, `guardianEmail`, `address`, `dateOfAdmission`, `active` | `academy-admin` | `academy-admin`, `teacher` (assigned), `student` (self), `parent` (ward) | `academy-admin` | `aroush_demo_students_v1` |
| **TeacherProfile** | `id`, `name`, `email`, `phone`, `subjects`, `batches`, `active` | `academy-admin` | All authenticated roles | `academy-admin` | `aroush_demo_faculty_v1` |
| **AcademicClass** | `id`, `name`, `boards`, `order`, `isActive` | `academy-admin` | All roles | `academy-admin` | `aroush_demo_academic_classes_v1` |
| **AcademicBoard** | `id`, `code`, `name`, `isActive` | `academy-admin` | All roles | `academy-admin` | `aroush_demo_academic_boards_v1` |
| **AcademicSubject** | `id`, `name`, `code`, `classes`, `defaultFee`, `description`, `isActive` | `academy-admin` | All roles | `academy-admin` | `aroush_demo_academic_subjects_v1` |
| **BatchDefinition** | `id`, `name`, `subject`, `classGrade`, `teacherId`, `teacherName`, `capacity`, `enrolledCount`, `schedule`, `monthlyFee`, `status` | `academy-admin` | `academy-admin`, `teacher` (assigned), `student`/`parent` (enrolled) | `academy-admin` | `aroush_demo_batches_v1` |
| **SubjectEnrollment** | `id`, `studentId`, `studentName`, `subjectName`, `classGrade`, `board`, `batchId`, `batchName`, `teacherId`, `teacherName`, `monthlyFee`, `joiningDate`, `active` | `academy-admin` | `academy-admin`, `teacher` (assigned), `student` (self), `parent` (ward) | `academy-admin` | `aroush_demo_enrollments_v1` |
| **AttendanceRecord** | `id`, `sessionId`, `date`, `studentId`, `studentName`, `subject`, `batch`, `status`, `markedBy`, `markedByRole`, `remarks`, `history` | `teacher` / `academy-admin` | `academy-admin`, `teacher` (assigned), `student` (self), `parent` (ward) | `teacher` (assigned), `academy-admin` | `aroush_demo_attendance_v1` |
| **AssessmentRecord** | `id`, `title`, `subject`, `classGrade`, `batch`, `teacherId`, `totalMarks`, `status`, `examType`, `certificatePolicy`, `questions` | `teacher` / `academy-admin` | `academy-admin`, `teacher` (author), `student`/`parent` (published tests, sans answers) | `teacher` (assigned), `academy-admin` | `aroush_demo_assessments_v1`, `aroush_demo_mock_exams_v1` |
| **ExamAttemptResult** | `id`, `assessmentId`, `studentId`, `studentName`, `score`, `percentage`, `answers`, `submittedAt` | `student` / `teacher` | `academy-admin`, `teacher` (assigned), `student` (self), `parent` (ward) | `student` (submit), `teacher`/`admin` (grade) | `aroush_demo_exam_results_v1` |
| **AcademicCertificateData** | `certificateNumber`, `studentId`, `studentName`, `classGrade`, `board`, `assessmentId`, `assessmentName`, `subject`, `scoreObtained`, `totalMarks`, `percentage`, `criteriaMet`, `facultyName`, `issuedDate`, `title` | `academy-admin` | `academy-admin`, `teacher`, `student` (self), `parent` (ward) | `academy-admin` (issue/revoke) | `aroush_demo_issued_certificates_v1` |
| **ClassroomSession** | `id`, `title`, `subject`, `batchId`, `batchName`, `teacherId`, `teacherName`, `date`, `startTime`, `endTime`, `meetingUrl`, `platform`, `status`, `instructions` | `teacher` / `academy-admin` | `academy-admin`, `teacher` (assigned), `student`/`parent` (enrolled) | `teacher` (assigned), `academy-admin` | `aroush_demo_classroom_sessions_v1` |
| **TimetableSlot** | `id`, `dayOfWeek`, `startTime`, `endTime`, `subject`, `batchId`, `batchName`, `teacherId`, `teacherName`, `room`, `isSpecialSession` | `academy-admin` | All roles (scoped by batch for students/parents) | `academy-admin` | `aroush_demo_timetable_v1` |
| **StudyMaterial** | `id`, `title`, `subject`, `classGrade`, `batchId`, `batchName`, `teacherId`, `teacherName`, `type`, `status`, `fileName`, `size`, `uploadDate`, `storageRef`, `downloadCount` | `teacher` / `academy-admin` | `academy-admin`, `teacher`, `student`/`parent` (published and enrolled only) | `teacher` (assigned), `academy-admin` | `aroush_demo_study_materials_v1` |
| **PaymentTransaction** | `id`, `studentId`, `enrollmentId`, `obligationId`, `amount`, `paymentMethod`, `referenceId`, `paymentDate`, `collectedByName`, `collectedByRole`, `receiptNumber`, `notes` | `academy-admin` | `academy-admin`, `teacher` (assigned receipts), `student` (self), `parent` (ward) | `academy-admin`, `teacher` (assigned cash receipts) | `aroush_demo_payments_v1` |
| **MonthlyFeeObligation** | `id`, `enrollmentId`, `studentId`, `monthLabel`, `year`, `feeAmount`, `status`, `dueDate`, `paidAmount` | `academy-admin` | `academy-admin`, `teacher` (assigned), `student` (self), `parent` (ward) | `academy-admin` (billing engine) | `aroush_demo_obligations_v1` |
| **PaymentSubmission** | `id`, `studentId`, `studentName`, `subjectName`, `teacherId`, `teacherName`, `enrollmentId`, `obligationId`, `monthLabel`, `amount`, `paymentMethod`, `referenceId`, `transferDate`, `status`, `submittedByRole`, `proofFileName`, `proofFileSize`, `proofFileType`, `proofFileData` | `student` / `parent` | `academy-admin`, `student` (self), `parent` (ward) | `student`/`parent` (create), `academy-admin` (review) | `aroush_demo_payment_submissions_v1` |
| **FeeAdjustment** | `id`, `studentId`, `enrollmentId`, `adjustmentType`, `amount`, `reason`, `appliedDate`, `approvedBy` | `academy-admin` | `academy-admin`, `student` (self), `parent` (ward) | `academy-admin` | `aroush_demo_fee_adjustments_v1` |
| **FeeConfigurationRule** | `id`, `classGrade`, `board`, `subjectName`, `monthlyTuitionFee`, `effectiveDate` | `academy-admin` | All roles | `academy-admin` | `aroush_demo_fee_configurations_v1` |
| **PaymentDestination** | `id`, `subjectName`, `teacherId`, `accountHolderName`, `bankName`, `accountNumber`, `ifscCode`, `upiId`, `isActive` | `academy-admin` | All roles | `academy-admin` | `aroush_demo_payment_destinations_v1` |
| **StudentIdCardRecord** | `id`, `studentId`, `studentFormattedId`, `session`, `classGrade`, `board`, `status`, `validThru`, `photoUrl`, `enrolledSubjects`, `issueDate`, `history` | `academy-admin` | `academy-admin`, `student` (self), `parent` (ward) | `academy-admin` | `aroush_demo_id_cards_v1` |
| **NoticeItem** | `id`, `title`, `category`, `priority`, `content`, `publishDate`, `targetRoles`, `publishedBy` | `academy-admin` | Scoped strictly to `targetRoles` | `academy-admin` | `aroush_demo_notices_v1` |
| **AuditLogEntry** | `id`, `timestamp`, `action`, `actionType`, `target`, `details`, `performedBy`, `actorRole`, `type`, `entityType`, `entityId`, `outcome`, `diff`, `sourcePortal` | `system` | `academy-admin` | `system` (append-only server middleware; no client write/delete) | `aroush_demo_audit_logs_v1` |

---

## 3. Needs Owner Confirmation List

The following business claims, faculty rosters, phone numbers, and subject offerings are hardcoded in `src/content/` or `src/data/` and require business owner confirmation:

1. **Admissions Primary Phone**: `098830 05641` (`src/content/site.ts:7`, `src/app/layout.tsx:87`).
2. **Admissions Secondary Phone**: `82408 16226` (`src/content/site.ts:8`, `src/content/landing.ts:266`).
3. **Official Administrative Email**: `aroushacademyazharsir@gmail.com` (`src/content/site.ts:9`, `src/app/layout.tsx:88`).
4. **Campus Center Address**: `1/1 Samsul Huda Road, near Jeebrail International School, Park Circus, Ballygunge, Kolkata 700017` (`src/content/site.ts:6`, `src/app/layout.tsx:91`).
5. **Class Range Offerings**: Class V to VIII, Class IX to X, and Class XI to XII (`src/content/landing.ts:51,67,85`).
6. **Affiliation Boards**: ICSE, CBSE, and West Bengal Board (`src/content/landing.ts:55,71,89`).
7. **Unverified Curriculum Subjects (11 Items)**:
   - Class V-VIII: All subjects (Maths, Science, English, Social Sciences) flagged `verified: false` (`src/content/landing.ts:57-60`).
   - Class IX-X: Biology, English, Vernacular flagged `verified: false` (`src/content/landing.ts:76-78`).
   - Class XI-XII: Computer Science, Humanities flagged `verified: false` (`src/content/landing.ts:94-95`).
8. **Faculty Roster**:
   - Founder Azhar Sir is confirmed as Director & Mathematics Lead.
   - Three instructor profiles currently display placeholder titles ("Senior Mathematics Faculty", "Commerce & Accounts Faculty", "Science & Board Faculty" in `src/content/landing.ts:155-177`) and require actual instructor names or hiring confirmation.
9. **Pedagogical Claim**: "Maths 3 Days a Week (Dual Teachers)" routine (`src/content/landing.ts:22`).
10. **Tuition Fee Schedules**: Monthly rates ranging from ₹1,200 to ₹3,500/month (`src/data/enrollmentFeeData.ts`).

---

## 4. Merged "Not Checked" List

Consolidated inventory of items not verified during this audit across Phases 0 to 6, with reasons:

1. **Production Deployment & Remote Database**: Live PostgreSQL/MySQL database connection pooling, production environment variables, and CDN caching layers were not checked (audit executed locally in read-only mode).
2. **External Social Media URL Liveness**: External links to Facebook, YouTube, and Instagram in `src/content/site.ts` were not pinged per Rule 14.
3. **Third-Party Payment Gateways**: Live webhook integrations with Razorpay, PayTM, or Stripe were not verified (the application currently uses simulated client-side UTR entries).
4. **Email & SMS Notification Delivery**: Transactional SMTP delivery, SMS OTP dispatch, and spam score deliverability were not tested (no external communications gateway configured).
5. **Screen Reader Audio Verification**: Accessibility was evaluated via automated axe-core engine; physical keyboard audio readout was not manually audited with VoiceOver or NVDA.
6. **Physical ID Card Hardware Printing**: Plastic PVC or thermal ID card printer calibration and bleed margins were not tested on hardware printers.
7. **Large Scale File Upload Quotas**: Multi-megabyte DSLR photo uploads were not pushed to full browser quota exhaustion due to read-only testing constraints.
8. **Live WebRTC Video Latency**: Interactive video packet loss and bandwidth adaptation in live classroom meetings were not measured (sessions link externally to Zoom/Google Meet).
9. **Simulated 3G Network Throttling on Bundle Chunks**: Static build bundle sizes were measured, but simulated real-world packet latency tests were not run.
10. **Legacy Browser Engines**: Only modern Chromium in Playwright was tested; legacy browsers (e.g., Internet Explorer, older Safari engines) were not evaluated.
11. **Hardware Display Gamut & Color Calibration**: Contrast ratios were mathematically evaluated against sRGB color spaces rather than physical OLED/IPS hardware variations.

---

## 5. Suggested Remediation Order (3 Batches)

Every remediation action points directly to an identified finding ID:

### Batch 1: Immediate Fixes (Makes the Demo Safe to Show)
*Objective: Eliminate obvious crashes, dead links, security leaks visible in DevTools, and layout bugs before presenting the demo.*

1. **Fix broken navigation and anchor links** [P1-001]: Align header and footer hrefs to singular DOM IDs (`/#course-v-viii`, `/#course-ix-x`, `/#course-xi-xii`) and add missing `id="campus"` and `id="visit"`.
2. **Strip answer key from client MCQ payload** [P4-001]: Remove `correctOptionIndex` from `mockExamData.ts` to prevent students from inspecting exam answers in DevTools.
3. **Fix fabricated role crash in auth** [P2-002]: Add runtime Zod validation in `demoAuthAdapter.ts` to reject corrupt role strings and prevent React error boundary crashes.
4. **Prevent unlinked parent data leakage** [P5-003]: Remove `return parentStudent || students[0];` in `FeesModule.tsx:205` so unlinked parents do not see another family's fee ledger.
5. **Add accessible label to mobile module selector** [P6-001]: Add `aria-label="Select dashboard module"` to `#mobile-module-select` in `DashboardShell.tsx:920` to satisfy critical axe rule.
6. **Replace emojis with Lucide React icons** [P3-005, P4-007, P5-007]: Replace unicode glyphs (`🖨️`, `🗓️`, `✕`, etc.) with accessible `<Printer />`, `<Calendar />`, `<X />` icons.
7. **Watermark demo vouchers and certificates** [P5-004]: Add clear "Frontend Demo Voucher — Not Valid For Legal Record" watermarks to printable modals.

### Batch 2: Architectural Prerequisites (Must Happen Before Backend Integration)
*Objective: Establish secure boundaries, correct data encapsulation, and eliminate storage crashes before wiring real databases.*

1. **Eliminate plaintext password storage** [P2-001]: Remove plaintext password persistence from `aroush_demo_registration_requests_v1` in `demoAuthAdapter.ts`.
2. **Stop base64 image persistence in localStorage** [P5-001, P5-005]: Replace client `FileReader.readAsDataURL()` with multipart form uploads to avoid browser `QuotaExceededError`.
3. **Implement Next.js middleware route protection** [P2-003]: Add `middleware.ts` to enforce authentication on `/dashboard/:path*` instead of exposing guest preview shells.
4. **Enforce server-side user scoping** [P4-002]: Enforce strict server-side authorization checks on all student and parent data queries, eliminating horizontal privilege escalation via `linkedStudentId`.
5. **Unify duplicated attendance and certificate logic** [P4-003, P4-004, P6-005]: Refactor `DirectoryModule` to use shared calculation routines from `attendanceCalculations.ts` and `assessmentVisibility.ts`.
6. **Code-split dashboard shell with dynamic imports** [P6-002]: Replace static imports in `DashboardShell.tsx` with `next/dynamic` to eliminate the monolithic 764 KB client chunk.

### Batch 3: Hardening & Long-Term Maintenance (Post-Backend Polish)
*Objective: Address maintainability, code modularity, strict style guidelines, and design system adherence.*

1. **Decompose oversized monolithic components** [P1-003, P1-004, P2-004, P3-001, P3-002, P3-003, P4-005, P5-006]: Split files exceeding 500 lines (`DirectoryModule`, `DashboardShell`, `AssessmentsModule`, `FeesModule`, etc.) into focused subcomponents.
2. **Resolve WCAG AA color contrast failures** [P6-003]: Darken secondary text tokens (`#AAAAAA` -> `#555555`) to achieve 4.5:1 contrast against light backgrounds.
3. **Replace raw image tags with Next.js Image** [P6-006]: Replace raw `<img>` tags and remove all 6 `eslint-disable-next-line @next/next/no-img-element` comments.
4. **Add keyboard focus to mobile table regions** [P6-004]: Add `tabIndex={0}` and `aria-label` to table scroll containers to satisfy Safari accessibility.
5. **Purge prohibited em/en dashes and code comments** [P2-005, P3-004, P4-006, P5-008]: Replace em/en dashes with standard hyphens and remove all inline code comments.
6. **Move audit logs to append-only database table** [P5-002]: Replace localStorage audit trail with an immutable backend audit service.
