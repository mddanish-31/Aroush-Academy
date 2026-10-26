# Phase 4: Learning Modules Audit

Audit Date: 2026-10-26
Branch: frontend-redesign
Scope: `AttendanceModule`, `AssessmentsModule`, `ClassroomModule`, `TimetableModule`, `StudyMaterialsModule`, and supporting domain libraries

## Module 1: AttendanceModule (`src/components/dashboard/AttendanceModule.tsx`, 1308 lines)

1. **Purpose**: Manages daily classroom session attendance rosters, teacher marking workflows, correction audit trails, and percentage summaries for students and parents.
2. **Entities Handled**:
   - `AttendanceRecord` (`id: string`, `sessionId: string`, `date: string`, `studentId: string`, `studentName: string`, `subject: string`, `batch: string`, `status: AttendanceStatus`, `markedBy: string`, `markedByRole: UserRole`, `remarks?: string`, `history?: AttendanceAuditEntry[]`).
3. **Data Location**:
   - Storage key: `DEMO_STORAGE_KEYS.ATTENDANCE` (`aroush_demo_attendance_v1`)
   - Seed file: `SAMPLE_ATTENDANCE` in `src/data/dashboardModulesData.ts`
4. **Role Permissions**:
   - Academy Admin: View all batches and students; edit/correct records.
   - Teacher: Restricted to assigned batches and enrolled students (`tch-azhar`, `tch-alvi`, `tch-roy`).
   - Student & Parent: Read-only view filtered strictly to the active student ID or linked ward ID.
5. **States**:
   - Loading: Synced post-mount via `useDemoStorage`.
   - Empty: Renders filter reset prompt when no sessions match selected date range.
   - Error: Mandatory audit reason enforced on all attendance modifications.
6. **Bugs & Anomalies**:
   - 17 emojis and unicode symbols in table buttons and status badges.
   - Em dash in remarks fallback on line 735 (`{r.remarks || "—"}`).
7. **Mobile Layout**:
   - Screenshot: `qa-output/audit/module-attendance-390.png`. Responsive list layout with tap-based status toggle.

## Module 2: AssessmentsModule (`src/components/dashboard/AssessmentsModule.tsx`, 3713 lines)

1. **Purpose**: Authors mock exams, evaluates online student MCQ test submissions, enters marks, and controls certificate qualification policies and issuance.
2. **Entities Handled**:
   - `AssessmentRecord` (`id`, `title`, `subject`, `classGrade`, `batch`, `teacherId`, `totalMarks`, `status`, `examType`, `certificatePolicy`).
   - `ExamAttemptResult` (`id`, `assessmentId`, `studentId`, `studentName`, `score`, `percentage`, `answers`, `submittedAt`).
   - `AcademicCertificateData` (`certificateId`, `studentId`, `assessmentId`, `status: "issued" | "revoked"`).
3. **Data Location**:
   - Storage keys: `aroush_demo_assessments_v1`, `aroush_demo_mock_exams_v1`, `aroush_demo_exam_results_v1`, `aroush_demo_issued_certificates_v1`
   - Seed file: `src/data/mockExamData.ts`
4. **Role Permissions**:
   - Admin & Teacher: Author exams, grade papers, publish results, issue certificates.
   - Student & Parent: Take published MCQ exams, inspect personal scorecards and certificates. Draft/unpublished tests are hidden.
5. **States**:
   - Empty: Clean state when no exams exist for chosen subject/batch.
   - Error: Enforces marks bounded between 0 and total marks.
6. **Bugs & Anomalies**:
   - **BLOCKER SECURITY LEAK**: Every MCQ question payload delivered to the student browser contains `correctOptionIndex` (`mockExamData.ts:40`), allowing exam answers to be inspected in DevTools before submission.
   - 31 emojis in headings, action buttons, and notices.
7. **Mobile Layout**:
   - Screenshot: `qa-output/audit/module-examinations-390.png`. Vertical card layout for scorecards and authoring forms.

## Module 3: ClassroomModule (`src/components/dashboard/ClassroomModule.tsx`, 1816 lines)

1. **Purpose**: Schedules and hosts live interactive video lectures (Zoom, Google Meet, Teams), providing join links and enrollment-scoped rooms.
2. **Entities Handled**:
   - `ClassroomSession` (`id`, `title`, `subject`, `batchId`, `batchName`, `teacherId`, `teacherName`, `date`, `startTime`, `endTime`, `meetingUrl`, `platform`, `status`, `instructions`).
3. **Data Location**:
   - Storage key: `DEMO_STORAGE_KEYS.CLASSROOM_SESSIONS` (`aroush_demo_classroom_sessions_v1`)
   - Seed file: `src/data/classroomData.ts`
4. **Role Permissions**:
   - Admin: View and manage all sessions.
   - Teacher: Create, edit, complete, and cancel meetings for assigned batches.
   - Student & Parent: Join meetings matching enrolled subjects; cancelled sessions disable join links.
5. **States**:
   - Empty: Clean calendar view when no classes are scheduled for the day.
   - Error: Validates HTTPS meeting URLs and mandatory start times.
6. **Bugs & Anomalies**:
   - 11 emojis in platform choices (`🟢 Google Meet`, `🔵 Zoom`, `🔗 Other`).
7. **Mobile Layout**:
   - Screenshot: `qa-output/audit/module-classroom-390.png`. Full-width meeting cards with direct "Join Class" buttons.

## Module 4: TimetableModule (`src/components/dashboard/TimetableModule.tsx`, 2119 lines)

1. **Purpose**: Coordinates 7-day weekly academic routines (Mon-Sun), room allocations, batch schedules, conflict detection, and individual student routines.
2. **Entities Handled**:
   - `TimetableSlot` (`id`, `dayOfWeek`, `startTime`, `endTime`, `subject`, `batchId`, `batchName`, `teacherId`, `teacherName`, `room`, `isSpecialSession`).
3. **Data Location**:
   - Storage key: `DEMO_STORAGE_KEYS.TIMETABLE` (`aroush_demo_timetable_v1`)
   - Seed file: `src/data/dashboardModulesData.ts`
4. **Role Permissions**:
   - Admin & Teacher: Create, update, cancel weekly routines; automated conflict detector blocks overlapping teacher or batch schedules.
   - Student & Parent: View personal weekly schedule derived from active subject enrollments.
5. **States**:
   - Empty: Unscheduled time slots display neutral placeholder cells.
   - Error: Interactive conflict warning dialog displayed on schedule collisions.
6. **Bugs & Anomalies**:
   - En dash used in headers: lines 574, 576, 689 (`7-Day Mon–Sun`).
7. **Mobile Layout**:
   - Screenshot: `qa-output/audit/module-timetable-390.png`. Single-day agenda switcher replaces desktop calendar grid.

## Module 5: StudyMaterialsModule (`src/components/dashboard/StudyMaterialsModule.tsx`, 2776 lines)

1. **Purpose**: Repository for syllabus study materials, lecture summaries, formula banks, and past papers with draft/published status controls.
2. **Entities Handled**:
   - `StudyMaterial` (`id`, `title`, `subject`, `classGrade`, `batchId`, `batchName`, `teacherId`, `teacherName`, `type`, `status`, `fileName`, `size`, `uploadDate`, `storageRef`, `downloadCount`).
3. **Data Location**:
   - Storage key: `DEMO_STORAGE_KEYS.STUDY_MATERIALS` (`aroush_demo_study_materials_v1`)
   - Seed file: `src/data/dashboardModulesData.ts`
4. **Role Permissions**:
   - Admin & Teacher: Upload, edit, draft, publish, and delete materials.
   - Student & Parent: Download published materials matching enrolled subjects; drafts strictly hidden.
5. **States**:
   - Empty: Subject filter renders empty prompt when 0 files match.
   - Error: File size guard rejects uploads > 10MB.
6. **Bugs & Anomalies**:
   - Em dash in status update toast messages on lines 552, 584, 615, 875.
   - File uploads simulate storage references via `session-local://` URLs without persistent cloud storage.
7. **Mobile Layout**:
   - Screenshot: `qa-output/audit/module-materials-390.png`. Clean vertical card stack with type badges and download triggers.

## Extra Security & Architecture Checks

### (a) Answer Key Delivery to Client
- **CRITICAL FINDING**: In `src/data/mockExamData.ts:40,50,60,70,80`, each MCQ question contains `correctOptionIndex: number` in the data payload sent to all users. In `AssessmentsModule.tsx:927`, answer checking is performed in client JavaScript (`chosen === q.correctOptionIndex`). Any student can open browser DevTools and read the entire answer key before answering.

### (b) Cross-Student Data Access via Storage Tampering
- **CRITICAL FINDING**: In `localStorage.getItem("aroush_demo_auth_user")`, modifying `linkedStudentId` from `std-101` to `std-102` immediately switches the active dashboard identity from Taha Rahman to Ananya Verma without server validation, exposing Ananya's attendance, test results, fee receipts, and digital ID card.

### (c) Calculation Duplication vs Shared Functions
- Attendance percentage is duplicated: `DirectoryModule.tsx:2485-2493` computes `Math.round(attended / total * 100)` inline instead of using `src/lib/attendanceCalculations.ts`.
- Certificate eligibility is inconsistent: `DirectoryModule.tsx:3403` hardcodes merit qualification at `>= 75%`, whereas `AssessmentsModule.tsx:2682` uses configurable policy thresholds (e.g. 80%).

## Step 7: Style Rule Verification (Rule 7 & Rule 12)

| Rule | Grep Command Executed | Count | Status |
| :--- | :--- | :--- | :--- |
| **No em/en dash** | `grep -rn "—\\|–" src/components/dashboard/AttendanceModule.tsx src/components/dashboard/AssessmentsModule.tsx src/components/dashboard/ClassroomModule.tsx src/components/dashboard/TimetableModule.tsx src/components/dashboard/StudyMaterialsModule.tsx` | 24 | VIOLATION (Flagged P4-006) |
| **No emojis** | Node unicode regex scan on Phase 4 components | 70 | VIOLATION (Flagged P4-007) |
| **No code comments** | `grep -rn "// " src/components/dashboard/{AttendanceModule,AssessmentsModule,ClassroomModule,TimetableModule,StudyMaterialsModule}.tsx` | 192 | VIOLATION |
| **Small files** | `wc -l` on the 5 learning module components | 5 files > 1,000 lines | VIOLATION (Flagged P4-005) |

## Phase 4 Findings

- **P4-001** | blocker | `src/data/mockExamData.ts:40` & `src/components/dashboard/AssessmentsModule.tsx:927` | MCQ exam questions deliver the answer key (`correctOptionIndex`) directly to the client browser in the test payload, allowing students to extract correct answers before or during the exam via DevTools. | Evidence: `mockExamData.ts:40` delivers `correctOptionIndex: 2` to client; evaluation occurs in browser `AssessmentsModule.tsx:927` (`chosen === q.correctOptionIndex`). | Strip `correctOptionIndex` from client-delivered exam payloads; submit answers to server-side endpoint for validation.
- **P4-002** | blocker | `src/lib/demoStorage.ts:100-140` & `src/components/dashboard/DashboardShell.tsx:280-340` | Modifying `linkedStudentId` in localStorage allows any student or parent to access another student's attendance records, examination marks, fee receipts, and digital ID passes without authentication checks. | Evidence: Playwright tamper test: changing `localStorage.aroush_demo_auth_user` `linkedStudentId` from `std-101` to `std-102` immediately switched the entire dashboard view to Ananya Verma (STD-102) and exposed all her private records. | Implement server-side session authentication with database authorization checks so the server strictly scopes records to the authenticated user ID.
- **P4-003** | high | `src/components/dashboard/DirectoryModule.tsx:3403` vs `AssessmentsModule.tsx:459` | Certificate eligibility logic is duplicated and contradictory across modules: DirectoryModule hardcodes qualification at `>= 75%`, ignoring dynamic assessment-specific thresholds configured in AssessmentsModule. | Evidence: `DirectoryModule.tsx:3403` hardcodes `★ Merit Certificate Qualified (≥ 75%)`, whereas `AssessmentsModule.tsx:2682` allows custom thresholds (e.g. 80%), creating out-of-sync qualification claims. | Extract certificate qualification calculation into a single canonical function in `src/lib/assessmentVisibility.ts` shared by all modules.
- **P4-004** | medium | `src/components/dashboard/DirectoryModule.tsx:2485-2493` vs `src/lib/attendanceCalculations.ts:23-48` | DirectoryModule reimplements an ad-hoc inline attendance percentage formula instead of importing the canonical `computeAttendanceStats` function. | Evidence: `DirectoryModule.tsx:2487` uses inline `Math.round((studentAtt.filter(...).length / studentAtt.length) * 100)` rather than the tested library function. | Refactor DirectoryModule to import and consume `computeAttendanceStats` from `src/lib/attendanceCalculations.ts`.
- **P4-005** | medium | `src/components/dashboard/AssessmentsModule.tsx:1-3713` & `StudyMaterialsModule.tsx:1-2776` & `TimetableModule.tsx:1-2119` & `ClassroomModule.tsx:1-1816` & `AttendanceModule.tsx:1-1308` | All 5 learning module components exceed 1,000 lines (with AssessmentsModule at 3,713 lines), violating project modularity standards. | Evidence: `wc -l` on the 5 components returned 3713, 2776, 2119, 1816, and 1308 lines. | Decompose each module into focused submodule components (authoring modal, scorecard view, table list, filter bar).
- **P4-006** | low | `src/components/dashboard/AttendanceModule.tsx:735` & `TimetableModule.tsx:574,576,689` & `StudyMaterialsModule.tsx:552,584` | 24 em dashes and en dashes used across Phase 4 components, violating Rule 7. | Evidence: `grep -rn "—\|–" ...` identified 24 instances across learning modules. | Replace all em/en dashes with commas, hyphens, or standard formatting.
- **P4-007** | low | `src/components/dashboard/` Phase 4 modules (70 instances) | 70 emoji icons and unicode symbols used in buttons, table cells, and status badges across learning modules, violating Rule 7. | Evidence: Unicode regex scan identified 70 emoji glyphs across Phase 4 components. | Replace all emoji glyphs with accessible `lucide-react` icons.

## Not Checked (Phase 4)

1. WebRTC video streaming quality, latency, and packet loss in live classroom sessions (meetings link to external providers).
2. Large file download throughput for study material attachments exceeding 100MB over constrained 3G mobile networks.
3. Proctoring integrity for anti-cheat browser tab switching detection during timed mock examinations.
