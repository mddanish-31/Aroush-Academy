# Aroush-Academy context

Read this before changing code. Built from a read-only session on 2026-10-26.

## Stack and versions

- Next.js 16.4.1, App Router, TypeScript. React 19.3.0, eslint-config-next 16.4.1.
- Other deps: lucide-react 1.59.0, qrcode-svg. No database or ORM dependency installed.
- Commands: `npm run dev`, `build`, `lint` (eslint), `typecheck` (tsc --noEmit), `test:*` (node --experimental-strip-types + scripts/loader.mjs), `qa:browser` (real browser, needs care).

## Routes (src/app)

- page.tsx - public landing page (hero gallery, courses, faculty, pricing, enquiry).
- dashboard/page.tsx - role dashboards, reads ?role=, no server guard (guest can open).
- login/page.tsx, register/page.tsx - demo auth forms.
- faq, privacy, terms - static legal and help pages.
- layout.tsx - root layout, skip link, metadata. globals.css - all global styles.
- robots.ts, sitemap.ts - SEO files.

## Folders

- src/components/auth - LoginForm, RegisterForm.
- src/components/common - CookieConsent, Footer, Header, Reveal (scroll reveal helper).
- src/components/dashboard - DashboardShell plus one module per feature (Attendance, Fees, Timetable, Directory, Assessments, StudyMaterials, Classroom, Notices, Batches, AuditLogs, IdCard, DigitalId, RegistrationApprovals, AcademicSetup) and FeeReceiptModal, ExamCertificateModal, MetricCard, TimetableEventCard.
- src/components/landing - one file per landing section (Hero, HeroGallery, Courses, WhatWeTeach, Faculty, Pricing, EnquirySection, FAQ preview, etc).
- src/components/ui - Badge, Button, Card.
- src/lib - feature helpers: demoStorage (localStorage/sessionStorage layer), auditService, attendanceCalculations, timetableUtils, onlineClassUtils, studyMaterialStorage, studyMaterialDownload, assessmentVisibility, siteUrl.
- src/lib/auth - AuthContext, authTypes, demoAccounts, demoAuthAdapter, authGuard.
- src/data - seeded demo datasets (academicMasterData, classroomData, dashboardModulesData, enrollmentFeeData, mockExamData, studentIdCardsData).
- src/content - the source of public copy: site, landing, legal, enquiry, media, types, index.
- scripts - 15 files: verify-*.ts are the test scripts, qa-browser.mjs is browser QA, loader.mjs is the TS loader, compare-dashboard-regression.mjs.

## Auth and storage facts (file and line)

- Demo user stored in localStorage key `aroush_demo_auth_user`: src/lib/auth/demoAuthAdapter.ts:16 (write at line 102, read at 85).
- Registration requests key `aroush_demo_registration_requests_v1`: demoAuthAdapter.ts:17. Invitations key `aroush_demo_account_invitations_v1`: demoAuthAdapter.ts:18.
- Roles defined: src/types/index.ts:3-7 (UserRole = academy-admin | teacher | student | parent), duplicated as VALID_USER_ROLES in src/lib/auth/authGuard.ts:4-9, route and label maps in src/lib/auth/authTypes.ts:123-140.
- Demo accounts live in src/lib/auth/demoAccounts.ts (DEMO_ACCOUNTS keyed by role, identifiers like admin@aroushacademy.in). Passwords exist in the file, not listed here.
- Storage keys, all written through src/lib/demoStorage.ts: DEMO_STORAGE_KEYS (lines 8-35) covers payments, assessments, mock exams, exam results, batches, attendance, notices, study materials, classroom sessions, students, enrollments, obligations, academic classes/boards/subjects, faculty, account invitations, timetable, issued certificates, teacher cert permission, audit logs, study material types, student id cards, payment destinations/submissions, fee adjustments/receipts/configurations. All start with `aroush_demo_`.
- Legacy v1 keys cleaned on load: demoStorage.ts:222-228. BroadcastChannel `aroush_demo_cross_tab_sync`: demoStorage.ts:52.
- Two keys that do NOT start with aroush_demo_: `aroush_motion_preference` (src/lib/motion/MotionProvider.tsx:19, localStorage) and `aroushh_cookie_preferences_v1` (src/components/common/CookieConsent.tsx:7, localStorage, note the double h typo).
- demoStorage.ts writes sessionStorage first and mirrors to localStorage (lines 146-149), reads session first (line 94).

## npm scripts and what the checks do

- typecheck: tsc --noEmit. lint: eslint.
- test:attendance, test:timetable, test:online-classes, test:examinations, test:cross-portal, test:digital-id, test:audit-logs, test:fees: run scripts/verify-*.ts, which exercise the pure lib calculations and data fixtures without a browser.
- test:browser-qa: scripts/verify-browser-qa-flows.ts, simulated workflow checks, no real browser.
- test:content: verify-content.ts, public copy shape. test:contrast: verify-contrast.ts, colour contrast. test:media: verify-media-urls.ts, media links.
- qa:browser: scripts/qa-browser.mjs, drives a real browser (not run in this session).

## Git and health state (updated 2026-10-27)

- Branch frontend-redesign. typecheck exit 0, lint exit 0 (6 pre-existing img warnings, 0 errors), build exit 0 (static prerender of all routes), all 12 test:* scripts exit 0 (run 2026-10-26).
- Untracked: docs/CONTEXT.md, src/lib/auth/authGuard.ts. qa-output/ holds QA logs and screenshots, not source.

## Damage from earlier mass edits - cleaned 2026-10-27

- The 541 empty `{}` JSX lines left by the comment strip were removed; the truncated ClassroomModule.tsx helper sentence was restored to the HEAD original; a follow-up scan found no suspicious empty braces left.
- The `, X` replacement check and the IXI check found nothing.

## Browser QA results (2026-10-27)

- Playwright 1.64.1 with a working Chromium. qa:browser run against dev (localhost:3000) and prod build (localhost:3001). Logs: qa-output/qa-dev.txt, qa-output/qa-prod.txt.
- Dev: 273 PASS, 96 FAIL. Prod: 271 PASS, 97 FAIL. Both runs exit 1.
- All 96 dev FAILs and 96 prod FAILs are Section 19 axe violations (serious/critical or incomplete color-contrast) across dashboard modules for all 4 roles at 390 and 1440. The 1 extra prod FAIL is Section 5, dropdown opacity sampled at 0.000 after 40ms (transition timing, likely flaky).
- Sections 1 to 18 otherwise pass, including anchor resolution, unlinked-parent Fees message, tampered-storage guard and real-login all-module axe runs.

## Known facts, verify before relying

- Branch is frontend-redesign. A public frontend redesign (landing page, header dropdowns, legal pages, SEO, hero gallery, What we teach) is committed. A read-only audit exists in docs/audit/ (AUDIT_REPORT.md has the findings and a backend contract). Still true: branch matches, log shows the redesign commits, docs/audit/AUDIT_REPORT.md exists.
- Four roles: academy-admin, teacher, student, parent. The app is currently demo only: data lives in browser localStorage and sessionStorage (keys start with aroush_demo_), login is checked in the browser, and /dashboard?role= opens a guest dashboard. Still true, with one caveat: two keys do not start with aroush_demo_ (motion preference, cookie preferences).
- A backend (Neon Postgres, Drizzle, server sessions) is planned but NOT built. Nothing server-side exists yet. Still true: no db dependency, no src/app/api, no server code.
- Pending fixes from the audit: Next 16.4.1 upgrade - still true, done (npm ls shows 16.4.1). Anchor link fixes - cannot tell (the #enquiry anchors and skip link resolve, but no audit re-run). Accessible names - cannot tell. Unlinked-parent fallback to students[0] in FeesModule - done (FeesModule.tsx:204 and 209). Role guard for tampered storage - done (src/lib/auth/authGuard.ts, used by demoAuthAdapter.ts:14). Removal of fake official seals on receipts and certificates - done (no seal text in FeeReceiptModal or ExamCertificateModal). Emoji and dash and comment cleanup in dashboard files - partially: no emoji or dash characters remain in dashboard files, but the comment strip damaged 541 spots (see damage section). #AAAAAA used as text colour - not true anymore, no var(--color-neutral) text colour remains, it is borders and dividers only. Code splitting in DashboardShell - done (dynamic imports at DashboardShell.tsx:26-32).
- Deliberately postponed until backend: exam answer key (correctOptionIndex) is still sent to the client - still true (src/types/index.ts:629). Plaintext passwords in registration requests - still true (demoAuthAdapter.ts has password fields). Base64 file uploads in localStorage - still true (readAsDataURL in IdCardManagementModule.tsx:338, FeesModule.tsx:791 and 3163). Audit log in localStorage - still true (auditService.ts:214). Route protection - still true (dashboard/page.tsx has no guard). Splitting DirectoryModule - still true (6048 lines, not split).
