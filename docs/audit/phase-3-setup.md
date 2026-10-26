# Phase 3: Dashboard Shell & Academic Setup Audit

Audit Date: 2026-10-26
Branch: frontend-redesign
Scope: `DashboardShell`, `AcademicSetupModule`, `BatchesModule`, `DirectoryModule`, and associated data and lib dependencies

## Module 1: DashboardShell (`src/components/dashboard/DashboardShell.tsx`)

1. **Purpose**: Primary role-adaptive workspace host and navigation container managing role context switching, mobile navigation, simulated identity switcher, and submodule view dispatch.
2. **Entities Handled**:
   - Reads: `AuthUser` (`id`, `name`, `identifier`, `role`, `profileId`, `linkedStudentId`, `linkedStudentIds`).
   - Reads: Summary counts across `PaymentTransaction[]`, `MonthlyFeeObligation[]`, `SubjectEnrollment[]`, `AttendanceRecord[]`.
   - Creates/Updates: `CashPaymentModal` payload (`enrollmentId: string`, `studentName: string`, `subjectName: string`, `obligationId: string`, `feeAmount: number`, `balance: number`).
3. **Data Location**:
   - `aroush_demo_auth_user` (`localStorage`)
   - `aroush_demo_payments_v2`, `aroush_demo_obligations_v2`, `aroush_demo_enrollments_v1` via `useDemoStorage`
   - Seed records: `src/data/enrollmentFeeData.ts` and `src/data/dashboardModulesData.ts`
4. **Role Permissions**:
   - Visibility: Open to all roles (`academy-admin`, `teacher`, `student`, `parent`) and unauthenticated guest visitors (defaults to Teacher Guest Preview).
   - Enforced in code: `DashboardShell.tsx:185-230` maps navigation tabs based on `activeRole`.
5. **States**:
   - Loading: Suspense fallback in `src/app/dashboard/page.tsx:18-24` ("Loading role workspace...").
   - Empty/Error: Missing error boundary for invalid role strings; crashing bug documented in P2-002.
6. **Bugs & Anomalies**:
   - Em dash in faculty switcher header at line 1163 ("Demo Tool — Switch Simulated Faculty:").
   - 9 emoji characters in navigation labels (`🌐`, `📝`, `🔴`, etc.).
7. **Mobile Layout**:
   - Screenshot: `qa-output/audit/dashboard-shell-390.png`. Uses `#mobile-module-select` dropdown and scrolling tab strip.

## Module 2: AcademicSetupModule (`src/components/dashboard/AcademicSetupModule.tsx`)

1. **Purpose**: Configures academic master taxonomy including class levels (Class V-XII), education boards (ICSE, CBSE, WB Board), subject catalog with default tuition rates, and faculty allocations.
2. **Entities Handled**:
   - `AcademicClass` (`id: string`, `name: string`, `boards: string[]`, `order: number`, `isActive: boolean`)
   - `AcademicBoard` (`id: string`, `code: string`, `name: string`, `isActive: boolean`)
   - `AcademicSubject` (`id: string`, `name: string`, `code: string`, `classes: string[]`, `defaultFee: number`, `description?: string`, `isActive: boolean`)
   - `TeacherProfile` (`id: string`, `name: string`, `email: string`, `phone: string`, `subjects: string[]`, `batches: string[]`, `active: boolean`)
3. **Data Location**:
   - Storage keys: `aroush_demo_academic_classes_v1`, `aroush_demo_academic_boards_v1`, `aroush_demo_academic_subjects_v1`, `aroush_demo_faculty_v1`
   - Seed file: `src/data/academicMasterData.ts`
4. **Role Permissions**:
   - Visibility & Mutation: `academy-admin` only.
   - Enforced in code: Rendered only when `activeRole === "academy-admin"` and active tab is `Academic Setup & Batches`.
5. **States**:
   - Loading: Synchronously initialized from demoStorage cache.
   - Empty: Clean empty table rows when lists are empty.
   - Error: Client-side validation toast for missing required names or negative fees.
6. **Bugs & Anomalies**:
   - Uses literal character `✕` as modal close button (`AcademicSetupModule.tsx:853, 900, 981, 1095`) instead of Lucide icons.
   - Monolithic file length: 1,157 lines.
7. **Mobile Layout**:
   - Screenshot: `qa-output/audit/module-academic-setup-390.png`. Full-width responsive sub-tab selector.

## Module 3: BatchesModule (`src/components/dashboard/BatchesModule.tsx`)

1. **Purpose**: Manages classroom batch cohorts, capacity thresholds, weekly lecture routines, and assigned subject teachers.
2. **Entities Handled**:
   - `BatchDefinition` (`id: string`, `name: string`, `subject: string`, `classGrade: string`, `teacherId: string`, `teacherName: string`, `capacity: number`, `enrolledCount: number`, `schedule: string`, `monthlyFee: number`, `status: "active" | "inactive"`)
3. **Data Location**:
   - Storage key: `aroush_demo_batches_v1` (`DEMO_STORAGE_KEYS.BATCHES`)
   - Seed file: `SAMPLE_BATCHES` in `src/data/dashboardModulesData.ts`
4. **Role Permissions**:
   - Visibility: `academy-admin` (all batches); teachers view assigned batches.
   - Mutation: `academy-admin` only.
   - Enforced in code: Creation modal restricted to admin role.
5. **States**:
   - Loading: Hydrated via `useDemoStorage`.
   - Empty: Renders empty message with call to action.
   - Error: Validates required batch name and teacher assignment before creation.
6. **Bugs & Anomalies**:
   - Uses calendar emoji `🗓️` in `BatchesModule.tsx:168`.
   - Modal close button uses literal `✕` glyph (`BatchesModule.tsx:229`).
7. **Mobile Layout**:
   - Screenshot: `qa-output/audit/module-batches-390.png`. Stacked batch cards with capacity meters.

## Module 4: DirectoryModule (`src/components/dashboard/DirectoryModule.tsx`)

1. **Purpose**: Comprehensive institutional directory managing student profiles, admissions, subject-wise enrollments, guardian linkages, fee ledgers, and faculty records.
2. **Entities Handled**:
   - `StudentProfile` (`id: string`, `name: string`, `admissionNumber: string`, `classGrade: string`, `board: string`, `schoolName: string`, `guardianName: string`, `guardianPhone: string`, `guardianEmail: string`, `address: string`, `dateOfAdmission: string`, `active: boolean`)
   - `SubjectEnrollment` (`id: string`, `studentId: string`, `studentName: string`, `subjectName: string`, `classGrade: string`, `board: string`, `batchId: string`, `batchName: string`, `teacherId: string`, `teacherName: string`, `monthlyFee: number`, `joiningDate: string`, `active: boolean`)
   - `AccountInvitation` (`id: string`, `studentId: string`, `studentName: string`, `targetRole: "student" | "parent"`, `recipientIdentifier: string`, `invitationCode: string`, `activationStatus: string`)
3. **Data Location**:
   - Storage keys: `aroush_demo_students_v1`, `aroush_demo_enrollments_v1`, `aroush_demo_obligations_v2`, `aroush_demo_payments_v2`
   - Seed file: `src/data/enrollmentFeeData.ts`
4. **Role Permissions**:
   - Visibility: `academy-admin` (all records); `teacher` (only students enrolled in their assigned batches).
   - Mutation: `academy-admin` only.
   - Enforced in code: Action modals and profile edit triggers guarded by `activeRole === "academy-admin"`.
5. **States**:
   - Search/Filter Empty: "No students found matching your search query" with reset action.
   - Form Errors: Validates 10-digit guardian mobile and non-empty legal name.
6. **Bugs & Anomalies**:
   - Monolithic file length: 6,056 lines.
   - Em dash violations in template literals on lines 4547 and 5156 (`{b.name} — ₹{bFee}/mo`).
   - 17 emojis and symbols in UI controls (`🔍`, `📞`, `✏️`, `⚡`, `📅`, `📊`, `🎓`, `⚠️`, `✕`).
   - "Simulate Student Account Activation" button on line 2796 bypasses email delivery and activates student purely in local state.
7. **Mobile Layout**:
   - Screenshot: `qa-output/audit/module-directory-390.png`. Filters collapse into expandable sheet; responsive student cards.

## Step 7: Style Rule Verification (Rule 7 & Rule 12)

| Rule | Grep Command Executed | Count | Status |
| :--- | :--- | :--- | :--- |
| **No em/en dash** | `grep -rn "—\\|–" src/components/dashboard/DashboardShell.tsx src/components/dashboard/AcademicSetupModule.tsx src/components/dashboard/BatchesModule.tsx src/components/dashboard/DirectoryModule.tsx src/data/dashboardModulesData.ts src/data/enrollmentFeeData.ts src/data/academicMasterData.ts` | 14 | VIOLATION (Flagged P3-004) |
| **No emojis** | Node unicode regex scan on Phase 3 components | 39 | VIOLATION (Flagged P3-005) |
| **No code comments** | `grep -rn "// " src/components/dashboard/DashboardShell.tsx src/components/dashboard/AcademicSetupModule.tsx src/components/dashboard/BatchesModule.tsx src/components/dashboard/DirectoryModule.tsx` | 83 | VIOLATION |
| **Small files** | `wc -l` on `DirectoryModule.tsx` (6056), `DashboardShell.tsx` (4550), `AcademicSetupModule.tsx` (1157) | 3 files > 500 lines | VIOLATION (Flagged P3-001, P3-002, P3-003) |

## Phase 3 Findings

- **P3-001** | high | `src/components/dashboard/DirectoryModule.tsx:1-6056` | Monolithic file size of 6,056 lines severely degrades maintainability, testability, and code review efficiency. | Evidence: Line count `wc -l src/components/dashboard/DirectoryModule.tsx` returned `6056`. | Decompose directory into `StudentListTable`, `StudentDetailDrawer`, `SubjectEnrollmentModal`, and `FacultyDirectoryTab`.
- **P3-002** | medium | `src/components/dashboard/DashboardShell.tsx:1-4550` | DashboardShell is 4,550 lines long, containing deeply nested module state, modal definitions, and navigation rendering. | Evidence: Line count `wc -l src/components/dashboard/DashboardShell.tsx` returned `4550`. | Extract modal dialogs, navigation sidebars, and role headers into dedicated child components.
- **P3-003** | medium | `src/components/dashboard/AcademicSetupModule.tsx:1-1157` | AcademicSetupModule is 1,157 lines long, violating the small file guideline. | Evidence: `wc -l src/components/dashboard/AcademicSetupModule.tsx` returned `1157`. | Break out class management, subject catalog, and faculty assignment into separate module components.
- **P3-004** | low | `src/components/dashboard/DirectoryModule.tsx:4547,5156` | Em dash (`—`) used in UI text and template literals across Phase 3 modules (14 total occurrences), violating Rule 7. | Evidence: `grep -rn "—\|–" ...` found 14 instances including `DirectoryModule.tsx:4547` (`{b.name} — ₹{bFee}/mo`). | Replace all em dashes with commas, hyphens, or proper typographical structures.
- **P3-005** | low | `src/components/dashboard/DirectoryModule.tsx:1612,1770,2191` | 39 emoji icons and symbols used in UI buttons, headings, and notices across Phase 3 modules, violating Rule 7. | Evidence: Node unicode scan identified 39 emojis across Phase 3 modules. | Replace all emoji glyphs with accessible `lucide-react` icons.

## Not Checked (Phase 3)

1. Bulk CSV/Excel student import and export performance with > 10,000 student records.
2. Concurrent multi-user edit conflicts when two administrators modify the same batch capacity simultaneously.
3. Offline service-worker sync for directory mutations made without an active internet connection.
