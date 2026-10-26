# Phase 6: Cross-Cutting Audit

Audit date: 2026-10-26 10:12 IST
Scope: Accessibility (axe-core on all routes), dashboard visual consistency, git worktree pixel comparison against baseline `8dde8d8`, TypeScript type safety, duplicate logic, and bundle chunk analysis.

---

## 1. Accessibility (axe-core Scan Results)

Automated axe scans were executed using `@axe-core/playwright` across `/`, `/login`, `/register`, and `/dashboard?role=<role>` for all 4 roles at both 390px (mobile) and 1440px (desktop) viewports. Raw JSON report saved to `docs/audit/raw/axe-audit-results.json`.

### Critical & Serious Violations Summary

| Route | Viewport | Serious Violations | Critical Violations | Incomplete Items | Key Issue IDs |
|---|---|---|---|---|---|
| `/` (Landing) | 390px | 0 | 0 | 1 | `label-content-name-mismatch` (incomplete) |
| `/` (Landing) | 1440px | 0 | 0 | 2 | `aria-valid-attr-value` (critical incomplete) |
| `/login` | 390px | 0 | 0 | 2 | `color-contrast`, `label-content-name-mismatch` |
| `/login` | 1440px | 0 | 0 | 3 | `aria-valid-attr-value`, `color-contrast` |
| `/register` | 390px | 0 | 0 | 2 | `color-contrast`, `label-content-name-mismatch` |
| `/register` | 1440px | 0 | 0 | 3 | `aria-valid-attr-value`, `color-contrast` |
| `/dashboard` (admin) | 390px | 2 | 0 | 3 | `color-contrast` (34 nodes), `scrollable-region-focusable` (2 nodes) |
| `/dashboard` (admin) | 1440px | 1 | 0 | 3 | `color-contrast` (45 nodes) |
| `/dashboard` (teacher) | 390px | 1 | 0 | 3 | `color-contrast` (28 nodes) |
| `/dashboard` (teacher) | 1440px | 1 | 0 | 2 | `color-contrast` (26 nodes) |
| `/dashboard` (student) | 390px | 1 | 1 | 3 | `select-name` (1 node - Critical), `color-contrast` (10 nodes) |
| `/dashboard` (student) | 1440px | 1 | 0 | 2 | `color-contrast` (2 nodes) |
| `/dashboard` (parent) | 390px | 1 | 0 | 3 | `color-contrast` (11 nodes) |
| `/dashboard` (parent) | 1440px | 1 | 0 | 2 | `color-contrast` (2 nodes) |

### Key Accessibility Highlights
- **Critical Violation (`select-name`)**: On mobile viewports (390px), the dashboard module switcher dropdown `<select id="mobile-module-select">` lacks an associated `<label>` or `aria-label`.
- **Serious Violation (`color-contrast`)**: Light neutral text (`#AAAAAA`, `rgba(29, 29, 31, 0.4)`) used for subheadings, timestamps, and card secondary meta across dashboard tables fails the WCAG 2 AA minimum 4.5:1 contrast threshold against white or `#F5F5F7` surfaces.
- **Serious Violation (`scrollable-region-focusable`)**: Mobile tables with horizontal overflow in admin views cannot be scrolled via keyboard in Safari.

---

## 2. Dashboard Visual Consistency

- **Typography**: The design system defines `Fraunces` (display serif) and `Manrope` (body sans-serif). While `globals.css` applies these globally, several dashboard components use inline `fontFamily: "var(--font-sans)"` or fall back to system defaults.
- **Spacing**: Modules exhibit inconsistent spacing tokens. Some modules use CSS variables (`var(--space-4)`), while others use hardcoded inline pixel values (`padding: "10px 14px"` or `margin: "12px 0"`).
- **Buttons**: A standardized `<Button>` component exists in `src/components/ui/Button.tsx`, but several modules instantiate raw `<button>` elements with inline style overrides, including capsule/pill rounded buttons.
- **Tables**: Directory, Attendance, and Fees modules format tables differently (some with zebra borders, others borderless, and varying column header capitalization).
- **Empty States**: Inconsistently handled across modules. Study Materials renders a centered Lucide icon and card wrapper, whereas Audit Logs renders an empty table row and Attendance renders an alert card.

---

## 3. Pixel Comparison Against Baseline Commit 8dde8d8

A git worktree was created for baseline commit `8dde8d8` outside the repo, served on port 3002 via webpack, and compared with current branch `frontend-redesign` on port 3001/3000 using Sharp pixel-by-pixel image diffing across 1440x900 viewports. The worktree was removed immediately after testing.

### Pixel Diff Measurements
- `academy-admin`: **7.45% difference** (96,508 of 1,296,000 pixels differ)
- `teacher`: **6.51% difference** (84,343 of 1,296,000 pixels differ)
- `student`: **6.29% difference** (81,579 of 1,296,000 pixels differ)
- `parent`: **6.54% difference** (84,726 of 1,296,000 pixels differ)

Screenshots generated in `qa-output/audit/`:
- `regression-baseline-<role>-1440.png`
- `regression-current-<role>-1440.png`
- `regression-diff-<role>-1440.png`

### Root Causes of Regression Drift
1. **Font Family & Metrics Migration**:
   - Commit `8dde8d8`: Headings used `Georgia, serif`; body used `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto`.
   - Current branch: Headings use `Fraunces, serif`; body uses `Manrope, system-ui`.
   - The differing x-heights, letter spacing, and line metrics shift every line of text, table cell, and card label.
2. **Header Navigation Restructure**:
   - `Header.tsx` added `LOGIN_ROLES` and `REGISTER_ROLES` flyout dropdown panels with Lucide icons and descriptions.
   - Button specificity tightened (`.btn-primary` enforcing `!important`).
3. **Motion & Spacing Resets**:
   - Transition rules in `globals.css` were updated to target specific hero and reveal classes rather than universal `*`.

---

## 4. Type Safety Review

Grep commands were executed across `src/` to count type safety escapes:

```bash
# Count TS 'any' type occurrences:
grep -rnE "(:[[:space:]]*any|\<any\>|as[[:space:]]+any)" src/ | wc -l
# Result: 13

# Count 'as' type assertion casts:
grep -rnE "[[:space:]]as[[:space:]]+[A-Z][A-Za-z0-9_]*" src/ | wc -l
# Result: 43

# Count @ts-ignore / @ts-expect-error:
grep -rnE "@ts-(ignore|expect-error|nocheck)" src/ | wc -l
# Result: 0

# Count eslint-disable comments:
grep -rn "eslint-disable" src/ | wc -l
# Result: 6
```

All 6 `eslint-disable` occurrences are `/* eslint-disable-next-line @next/next/no-img-element */` in `IdCardManagementModule.tsx`, `FeesModule.tsx`, and `DigitalIdCard.tsx` where raw `<img>` tags were used for student avatars and receipt screenshots instead of Next.js `<Image>`.

---

## 5. Duplicate Logic and Merge Candidates

1. **Attendance Calculation Duplication**:
   - `src/lib/attendanceCalculations.ts` vs `src/components/dashboard/DirectoryModule.tsx:550-590`.
   - `DirectoryModule` locally recalculates attendance and hardcodes `>= 75%` qualification, ignoring the dynamic thresholds in `AssessmentsModule`.
2. **Initials Extractor Duplication**:
   - Extracted identically in `DigitalIdCard.tsx:59`, `DirectoryModule.tsx:120`, and `DashboardShell.tsx:500`. Should be unified into a single helper `getInitials(name: string)`.
3. **Modal Keyboard & Backdrop Listeners**:
   - Every modal (`FeeReceiptModal`, `ExamCertificateModal`, `NoticesModule`, `AssessmentsModule`, `ClassroomModule`, `TimetableModule`) re-implements an identical `Escape` key event listener. Should be extracted into a shared `useEscapeKey` hook or standard `<Modal>` wrapper.
4. **Document Print Trigger**:
   - `FeeReceiptModal`, `ExamCertificateModal`, and `DigitalIdCard` repeat identical `handlePrint` logic and `.printable-document` CSS classes.
5. **Metric Card Markup**:
   - Several modules manually construct inline KPI stat cards instead of consuming `src/components/dashboard/MetricCard.tsx`.

---

## 6. Bundle & Client Chunk Analysis

Inspecting production build artifacts in `.next/static/chunks/`:
- Largest chunk: `.next/static/chunks/2wqq-uyfnloyc.js` (**763.7 KB**).
- Bundle analysis reveals this single chunk contains the entirety of `DashboardShell.tsx` along with all 10+ dashboard submodules (`FeesModule`, `DirectoryModule`, `AssessmentsModule`, `AttendanceModule`, `ClassroomModule`, `TimetableModule`, `StudyMaterialsModule`, `IdCardManagementModule`, `DigitalIdCard`, and `qrcode-svg`).
- Because `DashboardShell.tsx` imports every module statically, every authenticated user (regardless of whether they are a student, teacher, parent, or admin) must download 764 KB of client JavaScript upfront.
- **Recommendation**: Dynamic imports (`next/dynamic`) should be applied to all major role modules so that students only load student code, parents only load parent code, and admin tooling remains code-split.

---

## 7. Findings

### P6-001 (Severity: High)
- **File**: `src/components/dashboard/DashboardShell.tsx:920`
- **What is wrong**: The mobile module navigation selector dropdown (`#mobile-module-select`) lacks an accessible name or label, failing axe-core critical rule `select-name`.
- **Evidence**:
  ```typescript
  920: <select id="mobile-module-select" value={activeTab} onChange={(e) => setActiveTab(e.target.value)}>
  ```
- **Suggested fix**: Add `aria-label="Select dashboard module"` to the `<select>` element.

### P6-002 (Severity: High)
- **File**: `src/components/dashboard/DashboardShell.tsx:1-40`
- **What is wrong**: Monolithic static imports in `DashboardShell` bundle all admin, faculty, and student dashboard code into a single 763.7 KB client chunk (`2wqq-uyfnloyc.js`).
- **Evidence**:
  `.next/static/chunks/2wqq-uyfnloyc.js` measures 763.7 KB and matches `[react, next, qrcode, DashboardShell]`.
- **Suggested fix**: Use `next/dynamic` to lazy-load dashboard modules conditionally on the active role and tab.

### P6-003 (Severity: Medium)
- **File**: `src/app/globals.css:415`
- **What is wrong**: Dashboard subheadings and table metadata text color (`#AAAAAA` and low-opacity dark) fail WCAG 2 AA minimum contrast ratios (34 to 45 serious violations detected by axe).
- **Evidence**:
  Axe reported 45 serious contrast failures on `/dashboard?role=academy-admin` at 1440px.
- **Suggested fix**: Adjust secondary text colors to a darker tone (e.g. `#555555`) that achieves at least a 4.5:1 contrast ratio against `#FFFFFF` and `#F5F5F7`.

### P6-004 (Severity: Medium)
- **File**: `src/components/dashboard/FeesModule.tsx:218`
- **What is wrong**: Horizontally scrollable mobile data tables cannot be navigated or scrolled via keyboard in Safari.
- **Evidence**:
  Axe reported `scrollable-region-focusable` violation on `/dashboard?role=academy-admin` at 390px.
- **Suggested fix**: Add `tabIndex={0}` and an `aria-label` to table scroll container wrappers.

### P6-005 (Severity: Medium)
- **File**: `src/components/dashboard/DirectoryModule.tsx:550`
- **What is wrong**: Attendance calculations and certificate qualification thresholds are duplicated between `DirectoryModule` and `attendanceCalculations.ts`.
- **Evidence**:
  `DirectoryModule.tsx:550-590` manually loops over attendance records, ignoring central utility functions.
- **Suggested fix**: Refactor `DirectoryModule` to use `calculateStudentAttendanceStats` from `src/lib/attendanceCalculations.ts`.

### P6-006 (Severity: Low)
- **File**: `src/components/dashboard/DigitalIdCard.tsx:373`
- **What is wrong**: Codebase contains 6 `eslint-disable-next-line @next/next/no-img-element` comments avoiding Next.js image optimization for avatars and payment screenshots.
- **Evidence**:
  `grep -rn "eslint-disable" src/` yields 6 matches across `IdCardManagementModule.tsx`, `FeesModule.tsx`, and `DigitalIdCard.tsx`.
- **Suggested fix**: Replace raw `<img>` tags with Next.js `<Image>` components with defined dimensions.

### P6-007 (Severity: Low)
- **File**: `src/app/globals.css:420`
- **What is wrong**: Visual regression diff against commit `8dde8d8` shows 6.29% to 7.45% pixel drift caused by font family replacement (`Fraunces`/`Manrope` vs `Georgia`/`-apple-system`) and header flyout menu additions.
- **Evidence**:
  Sharp diff comparison measured 7.45% diff on `academy-admin` and 6.51% on `teacher`.
- **Suggested fix**: Align typography scale and line-heights in `globals.css` to prevent layout shifts.

---

## 8. Not Checked

1. **Screen reader announcement audit (VoiceOver / NVDA)**: Tested via automated axe-core engine; physical keyboard audio readout was not manually verified with a blind user.
2. **Dynamic lazy-loaded bundle performance under slow 3G network conditions**: Static build chunk sizes were measured, but simulated network throttling profiles were not executed.
3. **Legacy browser rendering (e.g. IE11, old Safari versions)**: Only modern Chromium engine in Playwright was tested.
4. **Hardware color calibration variance**: Contrast calculations were evaluated against standard sRGB values rather than physical OLED/IPS display gamut variations.
