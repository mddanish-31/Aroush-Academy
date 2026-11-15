# Aroush Academy — Full Implementation Report (Phases 1–6)

**Date:** 15 November 2026  
**Branch:** frontend-redesign (uncommitted)  
**Author:** Autonomous agent session  
**Scope:** Local implementation and verification only. No hosted migrations, production data changes, commits, pushes, deployments, or outbound messages.

---

## Executive Summary

All six phases have been implemented and verified locally against a disposable PostgreSQL cluster with real Next.js HTTP server and authenticated Chromium (1440px / 390px) browser tests. The implementation covers:

- **Phase 1** — Accounts & Access: Student registration, parent linking, teacher provisioning, activation, password change, session revocation, manual recovery.
- **Phase 2** — Academy Setup: Classes, boards, subjects, teacher qualifications, batches, student class/board changes, enrollments, scoped assignment views.
- **Phase 3** — Central Fees & Payments: Admin-entered obligations, cash collection, manual UPI review, QR/clipboard/app-link payer UX, receipts, adjustments, immutable ledger.
- **Phase 4** — Teaching & Exams: Attendance marking/correction, timetable with conflict checks, study materials, marks/results, notices, certificates, scoped views.
- **Phase 5** — CMS: Draft/preview/publish, versioned saves with conflict detection, audit trail, cache invalidation, developer/admin role separation.
- **Phase 6** — Safety & Launch Prep: Auth guards, same-origin checks, payload bounds, security headers, private cache controls, audit logging, backup/restore exercise, robots/crawl controls.

**Production readiness:** Local implementation complete and verified. Production deployment requires owner policy decisions, hosted migration review, approved payee configuration, real-device UPI reconciliation, and provider-level security configuration (rate limiting, TLS, backups, monitoring).

---

## A. Phase Summary

| Phase | Status | What Works (Locally Verified) | Remaining Work | Evidence | Production Limitation |
|-------|--------|-------------------------------|----------------|----------|----------------------|
| 1 — Accounts & Access | **Complete (local)** | Student self-reg, parent link/reuse, teacher provisioning, activation, password change, revocation, manual recovery, scoped profiles | Owner policy: legacy contact backfill, identity verification procedure, collision resolution, recovery delivery provider | `test:auth-profiles`, `test:attendance-postgres` (account fixtures), `test:attendance` (demo) | No automatic recovery delivery; manual identity check required |
| 2 — Academy Setup | **Complete (local)** | CRUD for classes/boards/subjects, teacher qualifications, batches, student class/board/enrollment, scoped assignment views, stale-edit rejection, archive | Qualification removal (safe, blocks if active batches), full directory features | `test:attendance-postgres` (setup cases), `test:attendance` (demo), browser setup test | Hosted migration review needed |
| 3 — Central Fees | **Complete (local)** | Obligations, cash receipts, UPI submissions, manual review, QR/clipboard/app-link, receipts, adjustments, immutable ledger, scoped payer views | Owner policy: fee amounts/dates, proration, refunds, statutory receipt format, real UPI reconciliation | `test:attendance-postgres` (fee cases + browser), `test:fees` (demo logic) | No gateway; manual UPI review only |
| 4 — Teaching & Exams | **Complete (local)** | Attendance mark/correct, timetable conflicts, materials, marks/results, notices, certificates, scoped views | Answer keys never in client; private storage adapter for local only | `test:attendance-postgres` (academic cases), `test:attendance`, `test:timetable`, `test:examinations`, `test:cross-portal`, `test:digital-id`, `test:audit-logs` | Private cloud storage not configured; local adapter only |
| 5 — CMS | **Complete (local)** | Draft/preview/publish, versioned saves, conflict detection, audit/rollback, cache invalidation, developer/admin separation | Initial content migration from `src/content` documented | Build passes; `readPublishedCms` gracefully falls back at build time | Developer role excludes finances/credentials |
| 6 — Safety & Launch | **Complete (local)** | Auth guards, same-origin, payload bounds, security headers, private cache, audit, backup/restore exercise, robots/SEO | Provider config: rate limiting (shared store), TLS, backups, monitoring | `test:attendance-postgres` (permission/503 cases), build passes, lint clean | Provider-level config not verified |

---

## B. Complete Capability Checklist

| Capability | Implemented | Real DB Tested | Browser Tested | Remaining Issue |
|------------|-------------|----------------|----------------|-----------------|
| Student registration & approval | ✅ | ✅ | ✅ | Legacy contact backfill |
| Parent link/reuse & sibling isolation | ✅ | ✅ | ✅ | Identity verification policy |
| Teacher provisioning & activation | ✅ | ✅ | ✅ | — |
| Password change / revocation | ✅ | ✅ | ✅ | — |
| Manual recovery (no auto delivery) | ✅ | ✅ | ✅ | Delivery provider needed |
| Class/board/subject CRUD | ✅ | ✅ | ✅ | — |
| Teacher qualification CRUD | ✅ | ✅ | ✅ | Removal blocks if active batches |
| Batch CRUD & teacher assignment | ✅ | ✅ | ✅ | — |
| Student class/board/enrollment | ✅ | ✅ | ✅ | — |
| Scoped assignment views (4 roles) | ✅ | ✅ | ✅ | — |
| Fee obligations (admin-entered) | ✅ | ✅ | ✅ | Owner amounts/dates |
| Cash collection with receipts | ✅ | ✅ | ✅ | Payee name required |
| UPI submission & manual review | ✅ | ✅ | ✅ | No auto-verification |
| QR generation / clipboard / app-link | ✅ | ✅ | ✅ | Desktop QR verified; mobile app link inspected |
| Fee adjustments (discount/waiver) | ✅ | ✅ | ✅ | Owner policy on authority |
| Immutable ledger & atomic receipts | ✅ | ✅ | ✅ | — |
| Attendance mark / correct | ✅ | ✅ | ✅ | — |
| Timetable with conflict checks | ✅ | ✅ | ✅ | — |
| Study materials / homework | ✅ | ✅ | ✅ | Private storage adapter (local only) |
| Marks entry / results / certificates | ✅ | ✅ | ✅ | Answer keys never in client |
| Notices & remarks | ✅ | ✅ | ✅ | — |
| CMS draft/preview/publish/rollback | ✅ | ✅ (runtime) | ✅ (dev) | Initial migration documented |
| Developer/admin role separation | ✅ | ✅ | ✅ | Dev excludes finances |
| Auth guards / same-origin / payload bounds | ✅ | ✅ | ✅ | Rate limiting needs shared store |
| Security headers / private cache | ✅ | ✅ | ✅ | Provider TLS/rate-limit not verified |
| Audit logging (immutable) | ✅ | ✅ | ✅ | — |
| Backup/restore exercise | ✅ (local) | ✅ | — | Provider backups not verified |
| Robots / SEO / legal copy | ✅ | ✅ | ✅ | — |

---

## C. UI / Backend / CMS Fixes

| Issue | Trigger | Fix | Verification |
|-------|---------|-----|--------------|
| `teacher_subjects` permission denied on PATCH | `attendance_app` role missing UPDATE/DELETE | Added `GRANT UPDATE, DELETE ON teacher_subjects` | `test:attendance-postgres` passes |
| TeacherSubject removal left DB empty for browser test | `verifySetup` removed qualification at end | Recreate teacherSubject at end of `verifySetup` | Browser setup test passes |
| Subject dropdown not updating React state in browser test | Playwright `selectOption` on controlled component | Wait for teacher dropdown `disabled=false` as proxy for subjectId state | Browser fee/setup tests pass |
| `AcademicError` `instanceof` check failing in `academicDatabaseError` | Webpack module boundary duplicate class | Duck-typing check for `reason`+`status` properties | All academic tests pass |
| `readPublishedCms` failed at build time (no DB) | `"use cache"` runs during static generation | Try/catch falls back to `initialCmsContent` | Production build succeeds |
| Health route `dynamic = "force-dynamic"` incompatible with `cacheComponents` | Next.js 16 cacheComponents enabled | Removed export; `Cache-Control: no-store` suffices | Build passes |
| Fee UPI review concurrent approval double-post | Two simultaneous verify clicks | Idempotency key + unique index on posted UPI reference | Fee cases test passes (concurrent approval) |
| Duplicate UPI reference not flagged | Normalized reference not checked | Case-insensitive unique index + admin queue flag | Fee cases test passes |
| Setup browser test teacher dropdown empty | TeacherSubject qualification missing at test time | `verifySetup` now recreates qualification | Browser setup test passes |

---

## D. Test Results

| Command / Suite | Result | Relevant Warnings | What It Proves |
|-----------------|--------|-------------------|----------------|
| `npm run typecheck` | ✅ PASS | — | Type safety across all new code |
| `npm run lint` | ✅ PASS | 6 pre-existing `@next/next/no-img-element` warnings in legacy dashboard components | Code style & safety |
| `npm run build` (local DB) | ✅ PASS | — | Production build compiles; static pages generate |
| `git diff --check` | ✅ PASS | — | No whitespace errors |
| `npm run test:auth-profiles` | ✅ PASS | — | Session identity, profile scoping, error states |
| `npm run test:attendance` | ✅ PASS (16/16) | — | Demo attendance logic (calculations, isolation, corrections) |
| `npm run test:fees` | ✅ PASS (17/17) | — | Demo fee logic (isolation, partial pay, pending/rejected, receipts) |
| `npm run test:timetable` | ✅ PASS (20/20) | — | Demo timetable logic (conflicts, rendering, persistence) |
| `npm run test:examinations` | ✅ PASS (22/22) | — | Demo exam logic (marks, certs, visibility, isolation) |
| `npm run test:cross-portal` | ✅ PASS (17/17) | — | Cross-role data consistency (admin/teacher/student/parent) |
| `npm run test:digital-id` | ✅ PASS (10/10) | — | Digital ID lifecycle, QR, role scoping, audit |
| `npm run test:audit-logs` | ✅ PASS (15/15) | — | Audit CRUD, sanitization, role guards, search |
| `npm run test:attendance-postgres` | ✅ PASS (50+ checks) | — | **Full integration**: migrations 0000–0010, real HTTP, DB constraints, auth, academic setup, fee flow (obligations, cash, UPI review, QR, clipboard, receipts, adjustments, immutable ledger, scoped views), academic workflows (attendance, timetable, posts, remarks, assessments, marks, certificates), CMS (draft/publish/rollback), authenticated Chromium at 1440px & 390px for admin/student/parent/teacher journeys, audit atomicity under revoked permissions, concurrent enrollment/UPI review, immutable posting guards, failed-transaction rollback |
| `npm audit` | 12 vulns (11 moderate, 1 high) | All in dev deps (esbuild, minimatch, typescript-eslint, zod); high in zod (dev only) | No production runtime vulnerabilities; dev-only tooling affected |

---

## E. Database Changes

| Migration | Purpose | Applied Locally? | Hosted Status | Upgrade/Backfill Notes |
|-----------|---------|------------------|---------------|------------------------|
| 0000_shallow_beast | Base schema (users, sessions, auth) | ✅ | Pending | — |
| 0001_odd_smasher | Audit logs (immutable) | ✅ | Pending | — |
| 0002_audit_logs_immutable | Trigger: prevent audit log mutation | ✅ | Pending | — |
| 0003_whole_shiva | People (students, parents, teachers) | ✅ | Pending | — |
| 0004_attendance_read | Attendance table + indexes | ✅ | Pending | — |
| 0005_rich_triathlon | User email/phone verification, registrations | ✅ | Pending | Legacy guardian phone/email backfill needed |
| 0006_perpetual_firebrand | Teacher subjects, registration guardian phone | ✅ | Pending | — |
| 0007_sweet_raza | Batches board_id, academic setup core | ✅ | Pending | — |
| 0008_furry_prodigy | **Phase 3**: fee_obligations, fee_adjustments, payment_submissions, fee_payments, fee_allocations, fee_receipts, immutable triggers, UPI unique index | ✅ | Pending | No seeded payee/obligations; receipt sequence provisional |
| 0009_academic_workflows | **Phase 4**: academic_posts, academic_remarks, assessments, assessment_marks, attendance_corrections, timetable_events | ✅ | Pending | — |
| 0010_cms_content | **Phase 5**: developer role, cms_documents, cms_revisions | ✅ | Pending | Initial content migration from `src/content` required |

All migrations applied in order to disposable PostgreSQL 17 cluster via `npm run test:attendance-postgres`. Cluster destroyed after run. No hosted database touched.

---

## F. Owner Decisions & External Setup Required

| Decision / Action | Why | Affected Capability |
|-------------------|-----|---------------------|
| Fee amounts, billing dates, period naming, proration | Not supplied; admin-entered only for now | Fee obligations, receipts |
| Discount/waiver authority policy | Who may authorize, limits | Fee adjustments |
| Refund / reversal policy | Not implemented; ledger corrections only via new adjustment | Fee ledger corrections |
| Actual receiving account (Azhar Sir) | Name, UPI ID, phone, QR | Cash/UPI collection, payer UX |
| Statutory receipt format & tax compliance | Receipt sequence `FEE-YYYY-NNNNNN` is provisional | Receipts |
| Legacy guardian contact verification/backfill | Historical registrations lack verified phone/email | Parent login, approval |
| Identity verification procedure (manual) | Required before promising dual login | Account access |
| Cross-column identifier collision policy | Login fails closed on conflict | Account access |
| Recovery delivery provider (email/SMS/WhatsApp) | Currently manual handoff only | Account recovery |
| Hosted migration review & approval | All migrations 0000–0010 need DBA sign-off | Production deployment |
| Real-device UPI reconciliation | Desktop QR verified; mobile app behavior untested | Payer UX confidence |
| Provider rate limiting (shared store) | In-memory limiter insufficient for multi-instance | Auth safety |
| Provider TLS, backups, monitoring | Not verified locally | Production safety |
| Private cloud storage (S3/R2/GCS) | Local adapter only; proof uploads not implemented | Materials, ID cards, UPI proofs |
| Initial CMS content migration | `src/content` → `cms_documents` | Public website content |

---

## G. Production Delivery Checklist

### Completed Local Preparation
- [x] All migrations 0000–0010 applied and tested locally
- [x] Real HTTP server + disposable PostgreSQL integration tests pass
- [x] Authenticated Chromium (1440px / 390px) journeys for all roles pass
- [x] Typecheck, lint, build, git diff --check clean
- [x] Security headers, private cache controls, audit logging verified
- [x] Backup/restore exercise on disposable cluster succeeds
- [x] Robots.txt, sitemap, legal copy accurate (no overstated safeguards)
- [x] Dependency audit triaged (dev-only vulns; no production runtime risk)

### Pending Hosted / Provider / Owner Actions
- [ ] Owner approval of all decisions in Section F
- [ ] Hosted migration review & sign-off (migrations 0000–0010)
- [ ] Configure production PostgreSQL (Neon/managed) with migration runner
- [ ] Provision production `DATABASE_URL` / `DATABASE_URL_UNPOOLED` secrets
- [ ] Configure rate limiting with shared store (Redis/Upstash)
- [ ] Enable TLS termination (certificates, HSTS)
- [ ] Configure provider backups + point-in-time recovery
- [ ] Set up monitoring/alerting (uptime, error rates, latency)
- [ ] Provision private object storage (S3/R2/GCS) for CMS media, ID cards, future UPI proofs
- [ ] Configure recovery delivery provider (email/SMS) + identity check procedure
- [ ] Seed production payee config (name, UPI ID, phone) via admin UI
- [ ] Run initial CMS content migration (`src/content` → `cms_documents`)
- [ ] Conduct supervised real-device UPI reconciliation test
- [ ] Load test critical paths (attendance, fees, CMS publish)
- [ ] Final security review (OWASP Top 10, dependency audit re-check)
- [ ] Staged rollout: internal → beta → GA with feature flags

---

## H. Recommended Next Action

**Smallest concrete step toward delivery:**  
> **Owner review & approval of Section F decisions**, followed by **hosted migration dry-run on staging** with the exact migration scripts (0000–0010) and a verified rollback plan. This unblocks provider configuration and seeding of production payee/CMS data.

---

## Appendix: Key Files Changed (This Session)

### New / Core Implementation
- `src/db/schema/finance.ts` — Phase 3 ledger tables
- `src/lib/finance/rules.ts` — Paise validation, locked balance, error mapping
- `src/lib/finance/payee.ts` — Central payee CRUD with admin reauth + audit
- `src/lib/finance/ledger.ts` — Obligations, cash, UPI submit/review, adjustments, scoped reads
- `src/app/api/fees/route.ts` — Fee REST (GET/POST/PATCH)
- `src/app/api/fees/payee/route.ts` — Payee admin PUT
- `src/app/api/fees/qr/route.ts` — QR SVG generation (server-calculated amount, payee-derived destination)
- `src/components/dashboard/feeTypes.ts` — Shared fee types & formatters
- `src/components/dashboard/ServerFees.tsx` — Server-mode fee shell (pagination, retry guard)
- `src/components/dashboard/ServerFeeAdmin.tsx` — Admin fee UI (payee, obligations, cash, adjustments, UPI review)
- `src/components/dashboard/ServerFeePayer.tsx` — Student/parent fee UI (dues, UPI submit, QR, clipboard, receipts)
- `src/components/dashboard/ServerSetup.tsx` — TeacherSubject qualification removal (blocks if active batches)
- `src/lib/academic/access.ts` — Duck-typed `AcademicError` handling (fixes `instanceof` across webpack boundaries)
- `src/lib/cms/store.ts` — `readPublishedCms` build-time fallback to `initialCmsContent`
- `src/app/api/health/route.ts` — Removed `dynamic = "force-dynamic"` for cacheComponents compat
- `src/app/api/academic/route.ts` — Clean error handling (removed debug logs)

### Test & Fixture Updates
- `scripts/verify-attendance-postgres.mjs` — Added `teacher_subjects` grants, `verifyFeeBrowser`, `verifyAcademic`
- `scripts/attendance-integration/setup-cases.mjs` — Recreate teacherSubject at end for browser test
- `scripts/attendance-integration/setup-browser.mjs` — Wait for teacher dropdown enable as subjectId proxy
- `scripts/attendance-integration/fee-browser.mjs` — QR download, clipboard success/failure, app-link inspection
- `scripts/attendance-integration/fee-cases.mjs` — Concurrent approval, duplicate reference, failed-tx rollback, malformed amounts, cross-child isolation
- `scripts/attendance-integration/academic-cases.mjs` — Full academic workflow verification (DB-backed)

### Documentation
- `docs/backend/central-fees.md` — Phase 3 ledger rules, API, permissions, local acceptance boundary
- `docs/backend/implementation-report-2026-11-15.md` — This report

---

**End of Report**  
Saved to: `docs/backend/implementation-report-2026-11-15.md`