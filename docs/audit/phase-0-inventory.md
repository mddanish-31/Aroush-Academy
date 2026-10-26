# Phase 0: Inventory

Audit Date: 2026-10-26
Branch: frontend-redesign
Environment: Next.js 16.4, React 19, TypeScript

## Step 1: Route Inventory

Static review of `src/app/` routes.

| Route | File Path | Type | Role | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `/` | `src/app/page.tsx` | Static | Public | Main landing page; fetches static content via `getSiteContent()` |
| `/faq` | `src/app/faq/page.tsx` | Static | Public | Frequently Asked Questions page |
| `/privacy` | `src/app/privacy/page.tsx` | Static | Public | DPDP Act 2023 Privacy Policy page |
| `/terms` | `src/app/terms/page.tsx` | Static | Public | Institutional Terms and Conditions |
| `/login` | `src/app/login/page.tsx` | Static | Auth | Sign-in page with client-side Suspense boundary for `LoginForm` |
| `/register` | `src/app/register/page.tsx` | Static | Auth | Registration page with client-side Suspense boundary for `RegisterForm` |
| `/dashboard` | `src/app/dashboard/page.tsx` | Static | Dashboard | Role workspace preview with client-side Suspense boundary for `DashboardShell` |
| `/robots.txt` | `src/app/robots.ts` | Static | Public | Metadata route generating robots configuration |
| `/sitemap.xml` | `src/app/sitemap.ts` | Static | Public | Metadata route generating XML sitemap |

Total routes: 9 (7 pages, 2 metadata routes).

## Step 2: File Inventory & Line Counts

Directory scope: `src/components`, `src/lib`, `src/data`, `src/content`.
Total files: 67.
Files over 500 lines flagged: 23 files.

### Flagged Files (> 500 lines)

| File Path | Line Count | Status |
| :--- | :--- | :--- |
| `src/components/dashboard/DirectoryModule.tsx` | 6056 | FLAGGED (>500) |
| `src/components/dashboard/DashboardShell.tsx` | 4550 | FLAGGED (>500) |
| `src/components/dashboard/AssessmentsModule.tsx` | 3713 | FLAGGED (>500) |
| `src/components/dashboard/FeesModule.tsx` | 3353 | FLAGGED (>500) |
| `src/components/dashboard/StudyMaterialsModule.tsx` | 2776 | FLAGGED (>500) |
| `src/components/dashboard/TimetableModule.tsx` | 2119 | FLAGGED (>500) |
| `src/components/dashboard/IdCardManagementModule.tsx` | 2019 | FLAGGED (>500) |
| `src/components/dashboard/ClassroomModule.tsx` | 1816 | FLAGGED (>500) |
| `src/components/dashboard/AttendanceModule.tsx` | 1308 | FLAGGED (>500) |
| `src/components/dashboard/DigitalIdCard.tsx` | 1160 | FLAGGED (>500) |
| `src/components/dashboard/AcademicSetupModule.tsx` | 1157 | FLAGGED (>500) |
| `src/components/common/Header.tsx` | 1134 | FLAGGED (>500) |
| `src/components/dashboard/AuditLogsModule.tsx` | 1119 | FLAGGED (>500) |
| `src/data/enrollmentFeeData.ts` | 1071 | FLAGGED (>500) |
| `src/data/dashboardModulesData.ts` | 989 | FLAGGED (>500) |
| `src/components/dashboard/RegistrationApprovalsModule.tsx` | 855 | FLAGGED (>500) |
| `src/components/auth/LoginForm.tsx` | 644 | FLAGGED (>500) |
| `src/components/auth/RegisterForm.tsx` | 639 | FLAGGED (>500) |
| `src/components/dashboard/NoticesModule.tsx` | 612 | FLAGGED (>500) |
| `src/lib/studyMaterialStorage.ts` | 605 | FLAGGED (>500) |
| `src/components/landing/EnquirySection.tsx` | 530 | FLAGGED (>500) |
| `src/lib/timetableUtils.ts` | 527 | FLAGGED (>500) |
| `src/lib/auth/demoAuthAdapter.ts` | 520 | FLAGGED (>500) |

### Remaining Files (<= 500 lines)

| File Path | Line Count | File Path | Line Count |
| :--- | :--- | :--- | :--- |
| `src/lib/attendanceCalculations.ts` | 496 | `src/lib/demoStorage.ts` | 441 |
| `src/components/landing/HeroGallery.tsx` | 420 | `src/components/common/CookieConsent.tsx` | 383 |
| `src/components/dashboard/BatchesModule.tsx` | 342 | `src/components/dashboard/FeeReceiptModal.tsx` | 327 |
| `src/lib/auditService.ts` | 325 | `src/components/dashboard/ExamCertificateModal.tsx` | 321 |
| `src/lib/auth/AuthContext.tsx` | 278 | `src/content/landing.ts` | 269 |
| `src/data/mockExamData.ts` | 249 | `src/components/common/Footer.tsx` | 230 |
| `src/components/landing/Courses.tsx` | 229 | `src/components/dashboard/TimetableEventCard.tsx` | 226 |
| `src/components/landing/Pricing.tsx` | 224 | `src/lib/onlineClassUtils.ts` | 209 |
| `src/data/classroomData.ts` | 207 | `src/components/landing/WhatWeTeach.tsx` | 188 |
| `src/data/studentIdCardsData.ts` | 184 | `src/content/media.ts` | 171 |
| `src/content/legal.ts` | 170 | `src/components/landing/AcademyIntro.tsx` | 155 |
| `src/content/types.ts` | 155 | `src/lib/auth/authTypes.ts` | 153 |
| `src/components/landing/Faculty.tsx` | 149 | `src/components/landing/Hero.tsx` | 147 |
| `src/lib/motion/MotionProvider.tsx` | 142 | `src/data/academicMasterData.ts` | 140 |
| `src/components/landing/FaqPreview.tsx` | 135 | `src/components/landing/HowItWorks.tsx` | 123 |
| `src/content/site.ts` | 123 | `src/components/landing/Features.tsx` | 122 |
| `src/components/ui/Button.tsx` | 103 | `src/lib/studyMaterialDownload.ts` | 91 |
| `src/lib/auth/demoAccounts.ts` | 83 | `src/components/ui/Badge.tsx` | 71 |
| `src/components/common/Reveal.tsx` | 63 | `src/components/landing/FinalCta.tsx` | 57 |
| `src/content/enquiry.ts` | 57 | `src/content/index.ts` | 51 |
| `src/components/ui/Card.tsx` | 49 | `src/lib/assessmentVisibility.ts` | 38 |
| `src/components/dashboard/MetricCard.tsx` | 37 | `src/lib/siteUrl.ts` | 11 |

## Step 3: Storage, BroadcastChannel & Cookie Key Inventory

Static scan across all files in `src/` and `scripts/`.

### 1. localStorage Keys

| Storage Key | Defining File & Line | Usage Location(s) | Purpose |
| :--- | :--- | :--- | :--- |
| `aroushh_cookie_preferences_v1` | `src/components/common/CookieConsent.tsx:7` | `src/components/common/CookieConsent.tsx:29,85`<br>`scripts/qa-browser.mjs:604,806,920,1221`<br>`scripts/compare-dashboard-regression.mjs:26,41` | Cookie banner preference state |
| `aroush_demo_auth_user` | `src/lib/auth/demoAuthAdapter.ts:15` | `src/lib/auth/demoAuthAdapter.ts:91,103,105` | Active logged-in demo user session |
| `aroush_demo_registration_requests_v1` | `src/lib/auth/demoAuthAdapter.ts:16` | `src/lib/auth/demoAuthAdapter.ts:115,117,136` | Student/parent account registration submissions |
| `aroush_demo_account_invitations_v1` | `src/lib/auth/demoAuthAdapter.ts:17` | `src/lib/auth/demoAuthAdapter.ts:146,148,167` | Staff/faculty invitation tokens & status |
| `aroush_motion_preference` | `src/lib/motion/MotionProvider.tsx:19` | `src/lib/motion/MotionProvider.tsx:38,61` | Reduced motion mode preference (`full` / `reduced`) |
| `__aroush_storage_test__` | `src/lib/demoStorage.ts:80` | `src/lib/demoStorage.ts:81-82` | Runtime availability probe (ephemeral test) |
| `aroush_demo_*` (28 keys below) | `src/lib/demoStorage.ts:22-49` | `src/lib/demoStorage.ts:118,171,197,221,265` | Dual-written / mirrored to `localStorage` for cross-tab sync |

### 2. sessionStorage Keys

All keys under `DEMO_STORAGE_KEYS` in `src/lib/demoStorage.ts` are stored in `sessionStorage` (scoped to browser tab) and mirrored to `localStorage` for multi-tab synchronization:

| Storage Key | Defining File & Line | Usage Location(s) | Entity / Module |
| :--- | :--- | :--- | :--- |
| `aroush_demo_payments_v2` | `src/lib/demoStorage.ts:22` | `src/lib/demoStorage.ts:113,168` | Fees & Transactions |
| `aroush_demo_assessments_v1` | `src/lib/demoStorage.ts:23` | `src/lib/demoStorage.ts:113,168` | Assessments |
| `aroush_demo_mock_exams_v1` | `src/lib/demoStorage.ts:24` | `src/lib/demoStorage.ts:113,168` | Mock Exams |
| `aroush_demo_exam_results_v1` | `src/lib/demoStorage.ts:25` | `src/lib/demoStorage.ts:113,168` | Exam Grades & Results |
| `aroush_demo_batches_v1` | `src/lib/demoStorage.ts:26` | `src/lib/demoStorage.ts:113,168` | Academic Batches |
| `aroush_demo_attendance_v1` | `src/lib/demoStorage.ts:27` | `src/lib/demoStorage.ts:113,168` | Daily Attendance Logs |
| `aroush_demo_notices_v1` | `src/lib/demoStorage.ts:28` | `src/lib/demoStorage.ts:113,168` | Notice Board Circulars |
| `aroush_demo_study_materials_v1` | `src/lib/demoStorage.ts:29` | `src/lib/demoStorage.ts:113,168` | Study Material Uploads |
| `aroush_demo_classroom_sessions_v1` | `src/lib/demoStorage.ts:30` | `src/lib/demoStorage.ts:113,168` | Classroom / Live Links |
| `aroush_demo_students_v1` | `src/lib/demoStorage.ts:31` | `src/lib/demoStorage.ts:113,168` | Student Directory |
| `aroush_demo_enrollments_v1` | `src/lib/demoStorage.ts:32` | `src/lib/demoStorage.ts:113,168` | Subject Enrollments |
| `aroush_demo_obligations_v2` | `src/lib/demoStorage.ts:33` | `src/lib/demoStorage.ts:113,168` | Fee Obligations |
| `aroush_demo_academic_classes_v1` | `src/lib/demoStorage.ts:34` | `src/lib/demoStorage.ts:113,168` | Classes (V - XII) |
| `aroush_demo_academic_boards_v1` | `src/lib/demoStorage.ts:35` | `src/lib/demoStorage.ts:113,168` | Boards (ICSE, CBSE, WBBSE) |
| `aroush_demo_academic_subjects_v1` | `src/lib/demoStorage.ts:36` | `src/lib/demoStorage.ts:113,168` | Academic Subjects |
| `aroush_demo_faculty_v1` | `src/lib/demoStorage.ts:37` | `src/lib/demoStorage.ts:113,168` | Faculty Directory |
| `aroush_demo_account_invitations_v1`| `src/lib/demoStorage.ts:38` | `src/lib/demoStorage.ts:113,168` | Staff Invitations |
| `aroush_demo_timetable_v1` | `src/lib/demoStorage.ts:39` | `src/lib/demoStorage.ts:113,168` | Weekly Timetable Slots |
| `aroush_demo_issued_certificates_v1`| `src/lib/demoStorage.ts:40` | `src/lib/demoStorage.ts:113,168` | Issued Certificates |
| `aroush_demo_teacher_cert_permission_v1` | `src/lib/demoStorage.ts:41` | `src/lib/demoStorage.ts:113,168` | Faculty Cert Permissions |
| `aroush_demo_audit_logs_v1` | `src/lib/demoStorage.ts:42` | `src/lib/demoStorage.ts:113,168` | Audit Log Entries |
| `aroush_demo_study_material_types_v1` | `src/lib/demoStorage.ts:43` | `src/lib/demoStorage.ts:113,168` | Material Types |
| `aroush_demo_student_id_cards_v1` | `src/lib/demoStorage.ts:44` | `src/lib/demoStorage.ts:113,168` | Digital ID Cards |
| `aroush_demo_payment_destinations_v2`| `src/lib/demoStorage.ts:45` | `src/lib/demoStorage.ts:113,168` | Bank / UPI Payment Destinations |
| `aroush_demo_payment_submissions_v2` | `src/lib/demoStorage.ts:46` | `src/lib/demoStorage.ts:113,168` | Parent Payment Submissions |
| `aroush_demo_fee_adjustments_v2` | `src/lib/demoStorage.ts:47` | `src/lib/demoStorage.ts:113,168` | Fee Adjustments & Waivers |
| `aroush_demo_fee_receipts_v2` | `src/lib/demoStorage.ts:48` | `src/lib/demoStorage.ts:113,168` | Issued Fee Receipts |
| `aroush_demo_fee_configurations_v2` | `src/lib/demoStorage.ts:49` | `src/lib/demoStorage.ts:113,168` | Fee Structure Rules |

### 3. BroadcastChannel Keys

| Channel Name | Defining File & Line | Usage |
| :--- | :--- | :--- |
| `aroush_demo_cross_tab_sync` | `src/lib/demoStorage.ts:66` | Instantiated via `new BroadcastChannel("aroush_demo_cross_tab_sync")` for instantaneous tab-to-tab state sync on mutations. |

### 4. Cookie Keys

- **Static finding**: Zero usage of `document.cookie` or Next.js `cookies()` in the repository.
- Cookie management is simulated on the client via `localStorage` key `aroushh_cookie_preferences_v1`.

## Step 4: Package Dependency Audit

Scan of `package.json` dependencies vs imports in `src/` and `scripts/`:

| Package Name | Type | Imported In | Status |
| :--- | :--- | :--- | :--- |
| `lucide-react` | dependency | Widely across `src/components/` and `src/app/` | Used |
| `next` | dependency | `src/app/`, `src/lib/siteUrl.ts`, `next/font/google`, etc. | Used |
| `qrcode-svg` | dependency | `src/components/dashboard/DigitalIdCard.tsx:4`, `scripts/verify-digital-id.ts:2` | Used |
| `react` | dependency | Widely across `src/` components and hooks | Used |
| `react-dom` | dependency | None in `src/` or `scripts/` (peer dependency of React 19/Next.js) | FLAGGED (Not directly imported) |
| `@axe-core/playwright` | devDependency | `scripts/qa-browser.mjs:2` | Used (QA scripts) |
| `@types/node` | devDependency | Referenced by TypeScript compiler (`tsconfig.json`) | Used (Tooling) |
| `@types/qrcode-svg` | devDependency | Referenced by TypeScript compiler (`tsconfig.json`) | Used (Tooling) |
| `@types/react` | devDependency | Referenced by TypeScript compiler (`tsconfig.json`) | Used (Tooling) |
| `@types/react-dom` | devDependency | Referenced by TypeScript compiler (`tsconfig.json`) | Used (Tooling) |
| `eslint` | devDependency | `eslint.config.mjs:1`, npm lint script | Used (Linting) |
| `eslint-config-next` | devDependency | `eslint.config.mjs:2,3` | Used (Linting) |
| `playwright` | devDependency | `scripts/qa-browser.mjs:1`, `scripts/compare-dashboard-regression.mjs:1` | Used (QA scripts) |
| `typescript` | devDependency | npm typecheck script and Next.js compiler | Used (Tooling) |

## Step 5: Verification & Build Scripts Execution

All commands executed locally in the current session.

| Command | Exit Code | Status | Last 5 Lines of Output |
| :--- | :--- | :--- | :--- |
| `npm run typecheck` | 0 | PASS | `> aroush-academy@0.1.0 typecheck`<br>`> tsc --noEmit` |
| `npm run lint` | 0 | PASS | `> aroush-academy@0.1.0 lint`<br>`> eslint` |
| `npm run build` (Run 1) | 1 | FAIL (Security Stop) | `Error [SecurityFatalError]: Your version of Next.js is affected by a known security vulnerability.`<br>`**We strongly recommend you upgrade Next.js.**`<br>`This command stopped to show the upgrade recommendation. Retry the same command to continue the original task.`<br>`Reference: https://registry.npmjs.org/-/npm/v1/security/advisories/bulk`<br>`  exitCode: 1` |
| `npm run build` (Run 2 Retry) | 0 | PASS (with warning) | `Route (app)`<br>`┌ ○ /`<br>`...`<br>`○ (Static) prerendered as static content`<br>`⚠ Your version of Next.js is affected by a known security vulnerability.` |
| `npm run test:attendance` | 0 | PASS | `Case 16: Status toggle, custom date persistence and duplicate prevention...`<br>`  ✓ Passed: Status toggle, custom date persistence, and duplicate prevention verified`<br>`==================================================================`<br>`   ALL 16 VERIFICATION TEST CASES PASSED SUCCESSFULLY (16/16)   `<br>`==================================================================` |
| `npm run test:timetable` | 0 | PASS | `Point 20: Timetable Session Deletion & Management Verification...`<br>`  ✓ Passed: Session deletion, calendar consistency, recurring vs special session handling & persistence verified`<br>`==================================================================`<br>`   ALL 20 TIMETABLE TEST CASES PASSED SUCCESSFULLY (20/20)   `<br>`==================================================================` |
| `npm run test:online-classes` | 0 | PASS | `Case 10: Cancellation Disables Meeting Joining...`<br>`  ✓ Passed: Cancelled meetings cannot be joined through the interface`<br>`==================================================================`<br>`   ALL 10 ONLINE CLASSROOM VERIFICATION TESTS PASSED (10/10)     `<br>`==================================================================` |
| `npm run test:examinations` | 0 | PASS | `Case 22: unpublish hides again...`<br>`  ✓ Passed: unpublish hides again`<br>`==================================================================`<br>`   ALL 22 EXAMINATIONS & CERTIFICATE TESTS PASSED SUCCESSFULLY!   `<br>`==================================================================` |
| `npm run test:cross-portal` | 0 | PASS | `Scenario 16: Academic Setup Consistency, Batch Fee Overrides & Paid Record Protection...`<br>`  ✓ Passed: Batch-specific fee overrides, faculty allocation, and paid record protection verified`<br>`==================================================================`<br>`   ALL 16 MASTER CROSS-PORTAL VERIFICATION SCENARIOS PASSED!     `<br>`==================================================================` |
| `npm run test:digital-id` | 0 | PASS | `10. Testing Demo Storage serialization and round-trip retrieval...`<br>`  ✓ Passed: Successfully persisted and retrieved 5 ID cards from demo storage`<br>`==================================================================`<br>`   ALL DIGITAL STUDENT ID MANAGEMENT CHECKS PASSED SUCCESSFULLY!  `<br>`==================================================================` |
| `npm run test:audit-logs` | 0 | PASS | `Test 15: Search and filter indexing across recorded audit events...`<br>`  ✓ Passed: Multi-dimensional audit log search and filter indexing verified`<br>`==================================================================`<br>`   ALL 15 CENTRAL AUDIT SYSTEM VERIFICATION CHECKS PASSED (15/15)  `<br>`==================================================================` |
| `npm run test:fees` | 0 | PASS | `Test 17: Multi-teacher destination resolution, actual student receipt metadata, role guard & dynamic billing...`<br>`  ✓ Verified: Multi-teacher destination resolution, actual student receipt metadata, role guard & dynamic billing.`<br>`==================================================================`<br>`   ALL 17 FEE MANAGEMENT VERIFICATION TESTS PASSED SUCCESSFULLY!  `<br>`==================================================================` |
| `npm run test:browser-qa` | 0 | PASS | `--- Section 4: Responsive UI Layout & Viewport Safety ---`<br>`  ✓ Passed [Check 15]: All modal dialog containers provide maxHeight and overflowY constraints for mobile screens < 640px`<br>`==================================================================`<br>`   ALL 15/15 BROWSER QA WORKFLOW CHECKS PASSED SUCCESSFULLY!`<br>`==================================================================` |
| `npm run test:content` | 0 | PASS | `PASS: All 13 MediaItems have valid unique IDs, distinct Unsplash photo IDs, honest alt, and isStock: true.`<br>`PASS: All 15 subjects across all courses have an explicit verified boolean flag.`<br>`PASS: Zero em dash, zero en dash, zero emojis across src/content, src/components/landing, src/components/common, and src/app.`<br>`PASS: Found 6 documented REPLACE_ME occurrences in src/content/legal.ts, and zero outside.`<br>`All content verification checks passed successfully!` |
| `npm run test:contrast` | 0 | PASS | `--- Non-Text UI and Accents (Threshold >= 3.0:1) ---`<br>`[PASS] Accent (#007AFF) on surface (#FFFFFF) [non-text UI]: 4.02:1 (Min 3:1)`<br>`[PASS] Accent (#007AFF) on page background (#F5F5F7) [non-text UI]: 3.69:1 (Min 3:1)`<br>`All CSS token pairs meet or exceed their required WCAG contrast thresholds!` |
| `npm run test:media` | 0 | PASS | `[PASS 200 OK] media-course-science [url] -> https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=form...`<br>`[PASS 200 OK] media-course-higher-secondary [url] -> https://images.unsplash.com/photo-1596495577886-d920f1fb7238?auto=form...`<br>`[PASS 200 OK] media-og-cover [url] -> https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=form...`<br>`All 13 media & poster URLs verified successfully with HTTP 200 OK!` |

## Phase 0 Findings

- **P0-001** | high | `package.json:27` | Next.js version 16.4.0 is affected by a known security vulnerability that halts builds with `SecurityFatalError` unless explicitly retried. | Evidence: First execution of `npm run build` returned exit code 1 with message `Error [SecurityFatalError]: Your version of Next.js is affected by a known security vulnerability`. | Upgrade Next.js to the recommended patched release.
- **P0-002** | low | `package.json:30` | `react-dom` is declared as an explicit dependency but is not directly imported in any project file. | Evidence: `grep -rn "react-dom" src scripts` returned 0 matches. | Evaluate whether `react-dom` can be safely removed from explicit top-level dependencies if handled by Next.js.
- **P0-003** | medium | `src/components/dashboard/DirectoryModule.tsx:1-6056` | Monolithic file size of 6,056 lines violates the project code organization principle favoring small files. | Evidence: Line count command `wc -l src/components/dashboard/DirectoryModule.tsx` returned `6056`. | Decompose directory table, filters, student forms, and export logic into modular subcomponents under a dedicated directory.
- **P0-004** | medium | `src/components/dashboard/DashboardShell.tsx:1-4550` | DashboardShell file size of 4,550 lines violates the project code organization principle favoring small files. | Evidence: Line count command `wc -l src/components/dashboard/DashboardShell.tsx` returned `4550`. | Refactor role-based tab routing and header bar into dedicated child components.

## Not Checked (Phase 0)

1. Runtime behavior of `qa:browser` script (requires running Playwright browser automation on live server, deferred to Phase 1/6).
2. Live production server container execution on port 3001 (will be evaluated when production testing is conducted).
3. Cross-browser testing beyond Chromium (e.g. WebKit and Firefox on macOS).



