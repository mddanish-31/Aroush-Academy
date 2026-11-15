# Dashboard profile identity

Phase 1, task 1 connects server-mode dashboard identity to database profiles. It does not complete Phase 1 or add academic record backends.

`GET /api/auth/me` reads only the session cookie. `src/lib/auth/profile.ts` validates it through `getSessionUser`, then queries the role's profile by `user_id`. Parent children come from that parent's `parent_student_links` with `is_verified = true`. Query parameters and supplied identity headers are ignored. Admins use the session's account identity without a student or teacher profile.

The response contains account ID, name, identifier, role, a profile with ID and name, authorized children, and `profileStatus`. Student profiles and children also contain their admission number. No session token, password hash, profile contact details or academic records are returned. Responses use `Cache-Control: private, no-store`.

Missing or invalid sessions return 401. Database errors return 503 with a generic error. An authenticated account without a required profile, or a parent without authorized children, returns `profileStatus: "missing"`. The dashboard displays "Your account setup is incomplete. Contact the academy."

The client validates the response shape and distinguishes loading, unauthenticated, authenticated and error states. Login succeeds in the client only after current-user loading succeeds. Stale identity requests cannot restore a user after logout or a newer refresh.

`DashboardShell` chooses the server workspace before mounting any demo hooks. Unsupported modules display an unavailable state. The existing server-backed admin Registrations screen remains accessible through Registrations and Registration Approvals. Demo mode keeps the existing demo workspace. Server-mode invitation activation cannot enter demo authentication.

Parents select from the children in the server response. Selection is presentation state, not authorization. Future academic endpoints must independently validate the session and authorize the requested child on every request.

## Local checks

`npm run test:auth-profiles` exercises real Drizzle query generation and session validation using an in-memory query adapter. It does not execute PostgreSQL or contact a hosted database.

`npm run test:auth-profiles:browser` uses an isolated Chrome profile against a dedicated local Next.js server. It intercepts all API responses, blocks external browser requests, checks role identity and empty/error states, tests authorized child selection, and traps demo storage access. `PROFILE_TEST_URL` defaults to `http://127.0.0.1:3017` and accepts only localhost. `PROFILE_TEST_BROWSER` defaults to `chrome`.

Start a dedicated server with disposable localhost database settings:

```sh
NEXT_PUBLIC_AUTH_MODE=server DATABASE_URL=postgresql://profile_test:profile_test@127.0.0.1:1/profile_test DATABASE_URL_UNPOOLED=postgresql://profile_test:profile_test@127.0.0.1:1/profile_test TEST_DATABASE_URL=postgresql://profile_test:profile_test@127.0.0.1:1/profile_test NEXT_DIST_DIR=.next-test/profile-identity node node_modules/next/dist/bin/next dev --webpack --hostname 127.0.0.1 --port 3017
```

The closed database port prevents accidental access to a real database. Do not use the hosted-database test scripts for these checks. Next.js may add temporary test-output includes to `tsconfig.json`; restore those exact additions after stopping the server and move its generated output to a temporary directory before running lint.

Real PostgreSQL execution, real account/profile provisioning and the production build remain separate checks. The local browser run also reported the existing `qrcode-svg` dependency warning about resolving `fs` through the demo component bundle.

The read-only attendance endpoint and its student/parent view were subsequently implemented. See `docs/backend/attendance-read.md` and `docs/backend/account-access.md`. This historical note does not claim Phase 1 is complete.

The mock browser procedure above is now historical: its fabricated cookie cannot pass the server-side `/dashboard` session guard. Do not use `test:auth-profiles:browser` as a current acceptance check until it uses a real database session. The disposable PostgreSQL browser cases in `npm run test:attendance-postgres` exercise the current login and dashboard path instead.
