# Phase 2: Authentication Audit

Audit Date: 2026-10-26
Branch: frontend-redesign
Scope: `src/components/auth`, `src/lib/auth`, `src/app/{login,register}`, demo account data

## Step 1: Authentication & Account Lifecycle Flows

All flows traced through source code with exact file and line references:

### 1. Login Flow

1. User opens `/login` (`src/app/login/page.tsx:10-24`), which renders `<LoginForm />` inside `<Suspense>`.
2. `LoginForm` reads `?role=` query parameter via `useSearchParams()` (`src/components/auth/LoginForm.tsx:21-25`). In demo mode, it pre-fills demo credentials into form state (`LoginForm.tsx:31-44`).
3. User submits form (`LoginForm.tsx:90-124`), triggering `handleSubmit`.
4. Client validates inputs (`LoginForm.tsx:94-101`): checks non-empty identifier and password.
5. Invokes `login()` from `AuthContext` (`src/lib/auth/AuthContext.tsx:128-139`), which delegates to `demoAuthAdapter.login()` (`src/lib/auth/demoAuthAdapter.ts:308-410`).
6. `demoAuthAdapter` checks credentials against:
   - Predefined demo accounts (`demoAuthAdapter.ts:320-338`)
   - Approved registration requests in localStorage (`demoAuthAdapter.ts:341-391`)
   - Activated invitations in localStorage (`demoAuthAdapter.ts:394-403`)
7. On match, sets user object into `localStorage.setItem("aroush_demo_auth_user", ...)` (`demoAuthAdapter.ts:103, 331, 388`).
8. Updates React state `setUser(user)` (`AuthContext.tsx:133`) and redirects to role route via `router.push(ROLE_DEFAULT_ROUTES[role])` (`LoginForm.tsx:112-113`).

### 2. Registration Flow

1. User opens `/register` (`src/app/register/page.tsx:10-24`), rendering `<RegisterForm />` inside `<Suspense>`.
2. `RegisterForm` initializes selected role (`student` or `parent`; restricted roles `academy-admin` and `teacher` rejected) (`src/components/auth/RegisterForm.tsx:16-19`).
3. User submits registration form (`RegisterForm.tsx:32-74`).
4. Client validates: name length >= 2, valid email/mobile, password >= 6 chars, password === confirmPassword (`RegisterForm.tsx:36-51`).
5. Calls `register()` from `AuthContext` (`AuthContext.tsx:141-154`), delegating to `demoAuthAdapter.register()` (`demoAuthAdapter.ts:412-494`).
6. Creates `RegistrationRequest` object with status `pending`, saves to `localStorage.setItem("aroush_demo_registration_requests_v1", ...)` (`demoAuthAdapter.ts:476-489`).
7. User is NOT automatically authenticated; UI transitions to "Status: Pending Academy Admin Approval" screen (`RegisterForm.tsx:89-130`).
8. Academy Admin reviews and approves registration from Directory / Approvals module, linking an academic student record ID (`demoAuthAdapter.ts:263-305`), which allows future login.

### 3. Logout Flow

1. User clicks "Sign Out" in Header or Dashboard Shell.
2. Invokes `logout()` from `AuthContext` (`AuthContext.tsx:209-220`).
3. Calls `demoAuthAdapter.logout()` (`demoAuthAdapter.ts:496-498`), which executes `localStorage.removeItem("aroush_demo_auth_user")` (`demoAuthAdapter.ts:105`).
4. Resets React state `setUser(null)` (`AuthContext.tsx:213`).
5. Navigates user to `/` via `router.replace("/")` (`AuthContext.tsx:215`).

## Step 2: Client-Side Credentials & Token Inventory

Static scan of client-side credentials, roles, tokens, and IDs:

| Storage / Comparison | Defining File & Line | Item Stored / Compared | Exposure Risk |
| :--- | :--- | :--- | :--- |
| **Demo Passwords** | `src/lib/auth/demoAccounts.ts:20,40,60,80` | `admin2026`, `teacher2026`, `student2026`, `parent2026` | Hardcoded plaintext passwords in client bundle |
| **Registration Passwords** | `src/lib/auth/demoAuthAdapter.ts:480` | Raw plaintext passwords stored in `localStorage` key `aroush_demo_registration_requests_v1` | High (plaintext password readable via devtools) |
| **Active User Session** | `src/lib/auth/demoAuthAdapter.ts:103` | User object (`id`, `name`, `identifier`, `role`, `profileId`, `linkedStudentId`) in `localStorage` key `aroush_demo_auth_user` | High (no HMAC signature, no tamper protection) |
| **Client Password Matching** | `src/lib/auth/demoAuthAdapter.ts:330,360` | Plaintext string equality `=== password` | High (evaluated entirely in client browser thread) |
| **Pre-filled Passwords** | `src/components/auth/LoginForm.tsx:41,60,69` | `setPassword(demo.demoPassword)` populated in React state | Exposed in DOM form input value |

## Step 3: `?role=` Query Parameter Behavior (Live Browser Execution)

Tested against local server `http://localhost:3000`:

| URL Tested | Resulting Rendered Role | Input Pre-population | Fallback Behavior |
| :--- | :--- | :--- | :--- |
| `/login` | Student (Default) | `taha.rahman@student.aroush.in` | Clean default to student |
| `/login?role=teacher` | Teacher | `azhar.maths@aroush.academy` | Correct role selection |
| `/login?role=academy-admin` | Academy Admin | `admin@aroushacademy.in` | Correct role selection |
| `/login?role=parent` | Parent | `amina.rahman@parent.aroush.in` | Correct role selection |
| `/login?role=invalid-role` | Student (Default) | `taha.rahman@student.aroush.in` | Clean fallback to student |
| `/register` | Student (Default) | Empty input fields | Clean default to student |
| `/register?role=parent` | Parent | Empty input fields | Correct role selection |
| `/register?role=academy-admin` | Student (Default) | Empty input fields | Institutional role blocked; fallback to student |
| `/register?role=invalid-role` | Student (Default) | Empty input fields | Clean fallback to student |

## Step 4: Form Validation & Keyboard Accessibility

- **Input Attributes**: All credentials inputs specify valid semantic autocomplete tags:
  - `autoComplete="username"` on login identifier (`LoginForm.tsx:247, 410`).
  - `autoComplete="current-password"` on login password (`LoginForm.tsx:469`).
  - `autoComplete="name"` on register full name (`RegisterForm.tsx:349`).
  - `autoComplete="new-password"` on register passwords (`RegisterForm.tsx:499, 553`).
- **Validation Messages**: Clear inline error banners rendered upon invalid submission without browser alert dialogs.
- **Double Submit Guard**: Submit buttons enforce `disabled={isSubmitting}` across login and registration flows.
- **Keyboard Navigation**: Form controls, role selection triggers, and toggle password visibility buttons are fully focusable with Enter/Space actuation.

## Step 5: Route Protection & Storage Tampering (Live Browser Execution)

Evaluated in browser automation sessions:

| Test Scenario | Action Performed | Observed Behavior | Security Status |
| :--- | :--- | :--- | :--- |
| **1. No Login Session** | Navigate to `/dashboard` with empty storage | Page loads HTTP 200 and renders "WORKSPACE PREVIEW Teacher (Guest Preview)". Does not redirect to `/login`. | Medium (open preview) |
| **2. Role Hijacking Query** | Logged in as student `std-101`, navigate to `/dashboard?role=academy-admin` | Dashboard ignores URL query, preserves authenticated student session ("ACTIVE WORKSPACE Student Taha Rahman"). | PASS (query override rejected) |
| **3. Malformed JSON Storage** | Set `aroush_demo_auth_user` to `"INVALID_JSON_%%"` | `demoAuthAdapter` catches JSON syntax error, clears corrupt user, falls back safely to Teacher Guest Preview without crashing. | PASS (fails safe) |
| **4. Fabricated Role Storage** | Set `aroush_demo_auth_user` to `{ role: "super-hacker" }` | Dashboard crashes with unhandled React boundary: "This page couldn’t load. Reload to try again, or go back." | High (crash vulnerability) |

## Step 6: Backend Contract Requirements

To transition authentication from client-side simulation to production-grade security:

1. **Session Management**:
   - Issue HTTP-only, secure, SameSite=Lax signed cookies containing cryptographically validated session IDs.
   - Eliminate all localStorage persistence of authentication sessions (`aroush_demo_auth_user`).
2. **Password Storage**:
   - Hash all passwords using bcrypt (cost >= 12) or Argon2id with salted keys on backend.
   - Never serialize or store plaintext passwords in registration tables or responses.
3. **Server-Side Route Middleware**:
   - Implement Next.js `middleware.ts` to inspect session cookies on `/dashboard/:path*`.
   - Issue HTTP 307 redirect to `/login?redirect=/dashboard` when session is absent or expired.
4. **Strict Role Validation**:
   - Validate user roles strictly against database enum records.
   - Reject arbitrary role payloads and sanitize all client-submitted identity claims.
5. **Registration & Approval Endpoints**:
   - Implement `POST /api/auth/register` storing pending requests in Postgres.
   - Implement `POST /api/admin/registrations/:id/approve` with explicit admin audit log.
6. **Password Reset Service**:
   - Implement `POST /api/auth/forgot-password` generating timed HMAC tokens sent via authenticated SMTP/SMS gateways.

## Step 7: Style Rule Verification (Rule 7 & Rule 12)

| Rule | Grep Command Executed | Count | Status |
| :--- | :--- | :--- | :--- |
| **No em/en dash** | `grep -rn "—\\|–" src/components/auth/ src/lib/auth/ src/app/login/ src/app/register/` | 0 | PASS |
| **No emojis** | Node unicode regex scan on Phase 2 directories | 0 | PASS |
| **No code comments** | `grep -rn "// " src/components/auth/ src/lib/auth/ src/app/login/ src/app/register/` | 34 | VIOLATION (Flagged P2-005) |
| **Small files** | `wc -l` on `LoginForm.tsx` (644), `RegisterForm.tsx` (639), `demoAuthAdapter.ts` (520) | 3 files > 500 lines | VIOLATION (Flagged P2-004) |

## Phase 2 Findings

- **P2-001** | blocker | `src/lib/auth/demoAuthAdapter.ts:480` | Client-side registration stores raw plaintext passwords directly into browser localStorage key `aroush_demo_registration_requests_v1`. | Evidence: Line 480 `password: data.password` saved via `localStorage.setItem(STORAGE_KEY_REGISTRATIONS, ...)` on line 489. | Remove plaintext password persistence and transition to server-side salted hash verification.
- **P2-002** | high | `src/lib/auth/demoAuthAdapter.ts:90-108` | Injecting an invalid or arbitrary role string into localStorage causes the dashboard to crash with an unhandled React error boundary. | Evidence: Playwright test with `role: "super-hacker"` produced `"This page couldn't load. Reload to try again"`. | Add runtime Zod / TypeScript guard validating that `user.role` belongs to `["academy-admin", "teacher", "student", "parent"]` and fallback to null on invalid roles.
- **P2-003** | medium | `src/app/dashboard/page.tsx:1-25` | Unauthenticated requests to `/dashboard` do not redirect to `/login` but instead expose an interactive guest preview shell. | Evidence: Playwright request without session loaded `/dashboard` with status 200 and "WORKSPACE PREVIEW Teacher (Guest Preview)". | Implement Next.js middleware redirecting unauthenticated requests to `/login`.
- **P2-004** | medium | `src/components/auth/LoginForm.tsx:1-644` | LoginForm (644 lines) and RegisterForm (639 lines) exceed the 500-line modularity threshold. | Evidence: `wc -l` on both components returned 644 and 639 lines respectively. | Split role switcher tabs, forgot password modals, and success confirmation cards into subcomponents.
- **P2-005** | low | `src/lib/auth/demoAuthAdapter.ts:319` | 34 inline code comments exist across auth adapter and context files, violating the project style guideline prohibiting code comments. | Evidence: `grep -rn "// " src/components/auth/ src/lib/auth/ src/app/login/ src/app/register/` returned 34 matches. | Remove inline comments and document auth contracts in markdown specifications.

## Not Checked (Phase 2)

1. Hardware security keys / WebAuthn / FIDO2 authentication (not supported in current demo architecture).
2. Rate-limiting against automated brute-force password guessing (client demo has no network rate limiter).
3. Email delivery deliverability and bounce handling for password reset messages.
