# Phase 5: Money, Documents, and Admin Audit

Audit date: 2026-10-26 10:05 IST
Scope: `FeesModule`, `FeeReceiptModal`, `DigitalIdCard`, `IdCardManagementModule`, `ExamCertificateModal`, `AuditLogsModule`, `NoticesModule`, `RegistrationApprovalsModule`, `auditService.ts`, `enrollmentFeeData.ts`, `studentIdCardsData.ts`.

---

## 1. Module Analysis (7 Steps Per Module)

### Module 1: FeesModule & FeeReceiptModal
1. **Purpose**: Manages tuition fee accounting, monthly obligations, payment submissions (UPI/cash/NEFT), offline cash collection recording, receipts generation, fee structure rules, and balance ledgers across all roles.
2. **Entities**:
   - `PaymentTransaction`: `id: string`, `studentId: string`, `enrollmentId: string`, `obligationId: string`, `amount: number`, `paymentMethod: 'cash' | 'upi' | 'bank_transfer'`, `referenceId?: string`, `paymentDate: string`, `collectedByName: string`, `collectedByRole: UserRole`, `receiptNumber: string`, `notes?: string`
   - `MonthlyFeeObligation`: `id: string`, `enrollmentId: string`, `studentId: string`, `monthLabel: string`, `year: number`, `feeAmount: number`, `status: 'paid' | 'partial' | 'pending' | 'overdue'`, `dueDate: string`, `paidAmount: number`
   - `PaymentSubmission`: `id: string`, `studentId: string`, `studentName: string`, `subjectName: string`, `teacherId: string`, `teacherName: string`, `enrollmentId: string`, `obligationId: string`, `monthLabel: string`, `amount: number`, `paymentMethod: 'upi' | 'bank_transfer'`, `referenceId?: string`, `transferDate: string`, `status: 'pending' | 'approved' | 'rejected'`, `submittedByRole: 'student' | 'parent'`, `proofFileName?: string`, `proofFileSize?: number`, `proofFileType?: string`, `proofFileData?: string`
   - `FeeAdjustment`: `id: string`, `studentId: string`, `enrollmentId: string`, `adjustmentType: 'discount' | 'scholarship' | 'waiver' | 'penalty'`, `amount: number`, `reason: string`, `appliedDate: string`, `approvedBy: string`
   - `FeeConfigurationRule`: `id: string`, `classGrade: string`, `board: string`, `subjectName: string`, `monthlyTuitionFee: number`, `effectiveDate: string`
   - `VerifiedFeeReceipt`: `receiptNumber: string`, `transactionId: string`, `studentId: string`, `issuedDate: string`, `amount: number`, `isVerified: boolean`
   - `PaymentDestination`: `id: string`, `subjectName: string`, `teacherId?: string`, `accountHolderName: string`, `bankName: string`, `accountNumber: string`, `ifscCode: string`, `upiId: string`, `isActive: boolean`
3. **Data Storage**: Stored in `localStorage` keys `aroush_demo_payments_v1`, `aroush_demo_obligations_v1`, `aroush_demo_payment_submissions_v1`, `aroush_demo_fee_adjustments_v1`, `aroush_demo_fee_receipts_v1`, `aroush_demo_fee_configurations_v1`, `aroush_demo_payment_destinations_v1`, seeded from `src/data/enrollmentFeeData.ts`.
4. **Role Permissions**: Admin has full ledger read/write and approvals; teachers can view assigned subject fees and record cash; students/parents view own/ward obligations and submit payment proof. Enforced at `FeesModule.tsx:1127`, `1177`, `2068`.
5. **States**: Inline error message string (`payFormError`); empty transaction/submission states present; no async network loading or server error states.
6. **Bugs / Fake items**: Base64 screenshots stored in localStorage; offline cash collection accepted without receipt verification; unverified UPI transfer references.
7. **Mobile 390**: Verified and captured at `qa-output/audit/module-fees-390.png`.

### Module 2: DigitalIdCard & IdCardManagementModule
1. **Purpose**: Generates, manages, and previews official student identity cards with SVG QR codes and barcode representations, supporting admin issuance, approval, deactivation, and print-ready card layouts.
2. **Entities**:
   - `StudentIdCardRecord`: `id: string`, `studentId: string`, `studentFormattedId: string`, `session: string`, `classGrade: string`, `board: string`, `status: 'approved' | 'pending' | 'draft' | 'deactivated'`, `validThru: string`, `photoUrl?: string`, `enrolledSubjects: string[]`, `issueDate?: string`, `history?: IdCardHistoryEntry[]`
   - `IdCardHistoryEntry`: `timestamp: string`, `action: string`, `actor: string`, `notes?: string`
3. **Data Storage**: `localStorage` key `aroush_demo_id_cards_v1`, seeded from `src/data/studentIdCardsData.ts`.
4. **Role Permissions**: Admin manages, approves, and edits cards; students and parents view own/ward card modal. Enforced at `DashboardShell.tsx:2419`.
5. **States**: Empty query search state present; image fallback renders student initials; no async network loading states.
6. **Bugs / Fake items**: QR code encodes fake external verification URL `https://aroush.academy/verify/id`; photo uploads saved as base64 in localStorage; hardcoded validity fallback `31 MAR 2027`.
7. **Mobile 390**: Verified and captured at `qa-output/audit/module-id-card-390.png`.

### Module 3: ExamCertificateModal
1. **Purpose**: Displays an official academic merit and qualification certificate voucher with crest, seal, evaluator signature blocks, and browser print trigger.
2. **Entities**:
   - `AcademicCertificateData`: `certificateNumber: string`, `studentId: string`, `studentName: string`, `classGrade: string`, `board: string`, `assessmentId: string`, `assessmentName: string`, `subject: string`, `assessmentDate: string`, `scoreObtained: number`, `totalMarks: number`, `percentage: number`, `criteriaMet: string`, `facultyName: string`, `issuedDate: string`, `title: string`
3. **Data Storage**: Instantiated dynamically in client memory from `mockExamData.ts` and `AssessmentsModule.tsx`.
4. **Role Permissions**: Displayed to students, parents, and teachers for exam scores meeting pass thresholds.
5. **States**: Renders `null` when modal is inactive; no remote fetch state.
6. **Bugs / Fake items**: Certificate displays "Academic Directorate SEAL" and official accreditation text printable directly to PDF (`window.print()`) despite being backed purely by client mock data.
7. **Mobile 390**: Tested in browser; modal scrolls vertically on mobile.

### Module 4: AuditLogsModule & auditService.ts
1. **Purpose**: Displays searchable, filterable chronological audit records of state mutations (creations, approvals, rejections, updates) performed across the application.
2. **Entities**:
   - `AuditLogEntry`: `id: string`, `timestamp: string`, `action: string`, `actionType: AuditActionType`, `target: string`, `details: string`, `performedBy: string`, `actorRole: UserRole | 'system'`, `type: AuditCategory`, `entityType?: string`, `entityId?: string`, `outcome?: 'SUCCESS' | 'FAILURE'`, `diff?: AuditFieldChange[]`, `sourcePortal?: UserRole`
3. **Data Storage**: `localStorage` key `aroush_demo_audit_logs_v1`, seeded from `src/data/dashboardModulesData.ts`.
4. **Role Permissions**: Rendered exclusively under `academy-admin` role in `DashboardShell.tsx:2418`.
5. **States**: "No audit logs found matching criteria" empty state; pagination controls present; no async error or remote loading states.
6. **Bugs / Fake items**: "Confirm Reset" button clears all newly logged audit entries and resets storage back to default sample records; stored on client without tamper protection.
7. **Mobile 390**: Verified and captured at `qa-output/audit/module-audit-390.png`.

### Module 5: NoticesModule
1. **Purpose**: Broadcasts administrative, academic, exam, and emergency notices to selected roles (admin, faculty, students, parents) with category filters and admin publish dialog.
2. **Entities**:
   - `NoticeItem`: `id: string`, `title: string`, `category: 'Academic' | 'Exam' | 'Fee' | 'Holiday' | 'Emergency'`, `priority: 'normal' | 'urgent'`, `content: string`, `publishDate: string`, `targetRoles: UserRole[]`, `publishedBy: string`
3. **Data Storage**: `localStorage` key `aroush_demo_notices_v1`, seeded from `src/data/dashboardModulesData.ts`.
4. **Role Permissions**: Admin can publish circulars and view all notices; teachers, students, and parents view role-scoped notices. Enforced at `NoticesModule.tsx:81-86`.
5. **States**: Empty state when no notices match category; form validation errors inline; no network loading state.
6. **Bugs / Fake items**: Published circulars only exist in local browser storage; other devices/users cannot see them.
7. **Mobile 390**: Verified and captured at `qa-output/audit/module-notices-390.png`.

### Module 6: RegistrationApprovalsModule
1. **Purpose**: Admin workflow to review, match with student database profiles, approve, or reject pending self-registrations submitted through `/register`.
2. **Entities**:
   - `RegistrationRequest`: `id: string`, `name: string`, `identifier: string`, `role: 'student' | 'parent'`, `status: 'pending' | 'approved' | 'rejected'`, `submittedAt: string`, `classGrade?: string`, `wardName?: string`, `linkedStudentId?: string`, `reviewedAt?: string`, `reviewedBy?: string`, `rejectionReason?: string`
3. **Data Storage**: `localStorage` key `aroush_demo_registration_requests_v1` via `AuthContext.tsx`.
4. **Role Permissions**: Rendered exclusively under `academy-admin` role in `DashboardShell.tsx:2307`.
5. **States**: Empty states per tab; button loading spinner during approval processing.
6. **Bugs / Fake items**: Plaintext unhashed passwords stored in registration request objects in `localStorage` (P2-001); loose heuristic name substring matching for ward linking.
7. **Mobile 390**: Verified in browser; approval queue cards stack cleanly.

---

## 2. Extra Checks

### (a) Fake Payments, Receipts, and Certificates That Could Pass As Real
- `src/components/dashboard/FeeReceiptModal.tsx:121-144`: Generates an official voucher stating "Govt. Regd. Coaching Institute • Park Circus / CIT Road, Kolkata", a receipt number, student name, fee breakdown, and collector details. It includes a `Print / Save as PDF` button calling `window.print()`.
- `src/components/dashboard/ExamCertificateModal.tsx:129-270`: Generates an ornate certificate with "Academic Directorate SEAL", "Official Record Notice", and evaluator signature blocks printable via `window.print()`.
- `src/components/dashboard/FeesModule.tsx:847`: Accepts manual UTR text and unverified screenshot uploads, allowing an admin to confirm transactions and issue valid receipt vouchers with zero banking or gateway reconciliation.

### (b) Audit Log Recording, Editing, and Clearing
- Records: ISO timestamp, actor name, actor role, action type (CREATE, UPDATE, APPROVE, REJECT, CANCEL, RESTORE), target entity, details, field diffs, outcome.
- Tamperability: Entire audit trail resides in `localStorage['aroush_demo_audit_logs_v1']`.
- Reset capability: `src/components/dashboard/AuditLogsModule.tsx:1102` provides a "Confirm Reset" button calling `resetAuditLogsToSample()`, permanently deleting all session audit events. Any user can also modify or delete records using browser DevTools.

### (c) Data Shown to Parents That Should Be Admin-Only
- In `src/components/dashboard/FeesModule.tsx:205`, when a parent account has no linked `parentStudent`, the module executes `return parentStudent || students[0];`, immediately binding to `std-101` (Zaid Khan) and exposing that student's complete fee ledger and payment history to the parent.
- While the dashboard shell conditionally hides administrative navigation tabs from the parent role, switching the URL parameter to `?role=academy-admin` or changing `aroush_demo_auth_user` gives parents instant unrestricted admin access due to the lack of server-side role authorization.

### (d) File and PDF Handling
- Print-to-PDF: All documents (Fee Receipts, Certificates, ID Cards) rely entirely on client-side CSS print media queries and `window.print()`. There is no backend PDF generation, digital signing, or tamper-evident hash verification.
- Screenshot & Photo Uploads: `FeesModule.tsx:781` and `IdCardManagementModule.tsx:331` read uploaded images using `FileReader.readAsDataURL()` and persist raw base64 strings directly into `localStorage`. This rapidly exhausts the 5MB browser quota (`QuotaExceededError`).
- File Downloads: Study materials trigger simulated mock downloads via client-generated blob URLs (`studyMaterialDownload.ts`).

---

## 3. Findings

### P5-001 (Severity: Blocker)
- **File**: `src/components/dashboard/FeesModule.tsx:860`
- **What is wrong**: Payment proof screenshot uploads are converted to raw base64 strings and written directly to client `localStorage`, causing storage quota crashes.
- **Evidence**:
  ```typescript
  860: proofFileData: payProofFile.dataUrl,
  ```
- **Suggested fix**: Upload binary files to secure object storage (e.g., S3/Cloud Storage) via multipart form data and store only the resulting secure asset URL in the database.

### P5-002 (Severity: Blocker)
- **File**: `src/components/dashboard/AuditLogsModule.tsx:1102`
- **What is wrong**: The administrative audit log is stored in client `localStorage` and can be completely wiped via a "Confirm Reset" button or manipulated in DevTools.
- **Evidence**:
  ```typescript
  1102: resetAuditLogsToSample();
  1103: setIsResetConfirmOpen(false);
  ```
- **Suggested fix**: Store audit records in an append-only, tamper-evident server-side database table with restricted access and no client deletion endpoints.

### P5-003 (Severity: High)
- **File**: `src/components/dashboard/FeesModule.tsx:205`
- **What is wrong**: Unlinked parent accounts fall back to displaying the first student in the database (`students[0]`), leaking private fee records of unrelated families.
- **Evidence**:
  ```typescript
  204: if (role === "parent") {
  205:   return parentStudent || students[0];
  206: }
  ```
- **Suggested fix**: Return `null` when a parent account has no linked student and render an explicit unlinked prompt rather than falling back to `students[0]`.

### P5-004 (Severity: High)
- **File**: `src/components/dashboard/FeeReceiptModal.tsx:46`
- **What is wrong**: Printable digital receipts and merit certificates display official government registration claims and directorate seals generated without server validation.
- **Evidence**:
  ```typescript
  46: window.print();
  122: Govt. Regd. Coaching Institute • Park Circus / CIT Road, Kolkata
  ```
- **Suggested fix**: Generate downloadable official receipts and certificates only via a backend service with cryptographic signatures, verification hashes, and persistent ledger backing.

### P5-005 (Severity: High)
- **File**: `src/components/dashboard/IdCardManagementModule.tsx:331`
- **What is wrong**: Student ID card photo uploads convert images to base64 strings stored in client `localStorage`.
- **Evidence**:
  ```typescript
  331: const reader = new FileReader();
  ```
- **Suggested fix**: Replace client-side base64 storage with an authenticated image upload endpoint that stores optimized photos in a CDN or asset bucket.

### P5-006 (Severity: Medium)
- **File**: `src/components/dashboard/FeesModule.tsx:1`
- **What is wrong**: Six Phase 5 modules severely violate the project size guideline by exceeding 500 lines of code.
- **Evidence**:
  - `FeesModule.tsx`: 3,354 lines
  - `IdCardManagementModule.tsx`: 2,020 lines
  - `DigitalIdCard.tsx`: 1,161 lines
  - `AuditLogsModule.tsx`: 1,120 lines
  - `RegistrationApprovalsModule.tsx`: 856 lines
  - `NoticesModule.tsx`: 613 lines
- **Suggested fix**: Decompose large monolithic modules into smaller, focused domain components under 500 lines.

### P5-007 (Severity: Low)
- **File**: `src/components/dashboard/ExamCertificateModal.tsx:314`
- **What is wrong**: Prohibited emoji character `🖨️` is used in the certificate print button label.
- **Evidence**:
  ```typescript
  314: <Button variant="primary" size="sm" onClick={handlePrint} type="button">
  315:   🖨️ Print / Save as PDF
  316: </Button>
  ```
- **Suggested fix**: Replace the emoji with a Lucide React `<Printer className="w-4 h-4" />` icon.

### P5-008 (Severity: Low)
- **File**: `src/components/dashboard/FeesModule.tsx:1061`
- **What is wrong**: Phase 5 components contain 22 prohibited em/en dash occurrences, 25 emojis, and 364 lines of code comments.
- **Evidence**:
  - Command: `grep -nE "[—–]" src/components/dashboard/FeesModule.tsx src/components/dashboard/FeeReceiptModal.tsx ... | wc -l` -> 22
  - Node emoji regex count: 25 emojis
  - Command: `grep -nE "(^\s*//|/\*)" ... | wc -l` -> 364
- **Suggested fix**: Replace em/en dashes with hyphens, replace emojis with Lucide icons, and strip all unnecessary code comments.

---

## 4. Not Checked

1. **Physical print formatting on specialized ID card printers**: Static and browser viewport review only; actual thermal or plastic card printing hardware was not tested.
2. **Live payment gateway webhooks (Razorpay/PayTM/Stripe)**: Static review only; the application currently lacks backend payment gateway integrations and uses mock UTR entries.
3. **Real-world image file size exhaustion threshold**: Not tested with multi-megabyte DSLR student photo uploads in localStorage due to read-only constraints.
4. **Third-party QR scanner physical camera resolution**: QR code vector SVG generation was verified in code, but scanning with an external hardware phone camera was not performed.
