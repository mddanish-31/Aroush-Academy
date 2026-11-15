# Read-only attendance endpoint

`GET /api/attendance` is available only in server auth mode. It uses `getCurrentIdentity` and the validated session cookie. Students can request their own student profile only. Parents must request a child returned by their authorized, verified parent-child links. Teachers and admins receive 403 from this endpoint. No attendance or dashboard writing is included.

## Request

| Parameter | Rules |
| --- | --- |
| `studentId` | UUID. Optional for students, but must match their profile if supplied. Required for parents and checked against their authorized children. |
| `from` | Inclusive calendar date, exactly `YYYY-MM-DD`. Defaults to 30 days before `to`. |
| `to` | Inclusive calendar date. Defaults to today in `Asia/Kolkata`. |
| `limit` | Integer from 1 to 200. Defaults to 100. |
| `cursor` | Next-page position returned by the endpoint, formatted `YYYY-MM-DD:UUID`. Must be inside the requested date range. |

The range cannot exceed 366 inclusive calendar days and `from` must not follow `to`. Impossible dates, unknown or duplicate parameters, malformed cursors and query strings over 2048 serialized characters return 400. Date filters use the stored date directly, without timestamp conversion. The default window includes 31 dates.

Results sort by date descending, then record UUID descending. The query fetches at most `limit + 1` rows to detect another page. Continue with the returned cursor and the same student and date filters. A cursor never authorizes a student. Pagination is not a frozen snapshot if records change between requests.

## Response

Success returns `ok`, the authorized `studentId`, `records`, `summary`, `summaryScope: "page"`, the effective `filters: { from, to }`, and `nextCursor` (null on the last page).

Each record contains only `id`, `batchId`, `date`, `status`, `subjectId`, `subject` and `batch`. Subject and batch names come from the current linked database rows. Recorder identity, remarks, audit timestamps, contact data and other students' details are excluded.

The summary covers only the records on this page, not the whole date range or a lifetime total. It reuses `calculateAttendanceStats` without the demo normalizer. Present and late count as attended. Absent and excused count toward total classes but not attended classes. Percentage is `Math.round(attendedClasses / totalClasses * 100)`, or zero for an empty page. The helper also returns its established compatibility counters.

The schema plan has no draft/session-finalization state. Each persisted row is treated as a finalized student mark, with one mark per student, batch and date. Separate batches on the same date count separately. No absent mark is inferred from an enrollment or a missing record.

| HTTP status | Body or meaning |
| --- | --- |
| 200 | Real records, or a successful empty list with zero summary and null cursor. |
| 400 | `{ "ok": false, "reason": "invalid_request" }` |
| 401 | `{ "ok": false, "reason": "unauthorized" }` for missing, invalid, expired or inactive sessions. |
| 403 | `{ "ok": false, "reason": "forbidden" }` for unsupported roles, another student's ID or an unauthorized child. Nonexistent and unlinked children receive the same response. |
| 409 | `{ "ok": false, "reason": "incomplete_setup" }` for a missing required account profile or a parent without authorized linked children. |
| 503 | `{ "ok": false, "reason": "server_error" }` for database, configuration or unavailable-schema errors. |
| 404 | `{ "ok": false, "reason": "not_found" }` outside server auth mode. |

Authentication, supported role and required profile checks precede filter validation. Responses use `Cache-Control: private, no-store`. Queries use Drizzle-bound parameters, and an authorization failure never starts an attendance query. There is no demo fallback. Only GET is implemented; Next.js supplies normal method handling.

## Migration and verification boundary

`drizzle/0004_attendance_read.sql` adds only the planned attendance table, referencing the existing students, batches and users tables. It adds the four-status check constraint, unique student/batch/date index, batch/date index and student/date/id index for this read path. The schema export, migration journal and generated snapshot are included. It requires the existing migrations through 0003. No migration has been applied by this task.

`npm run test:attendance-api` exercises the real route, session and profile resolution, Drizzle query generation, date parsing, pagination and summary calculations with isolated in-memory query responses. It checks bound authorization predicates, including verified parent links, and simulates unavailable database/schema responses. It does not execute PostgreSQL or validate database-enforced constraints, foreign keys, query plans or migration execution. No hosted database or environment-file credentials are used by the test.

Also run `npm run test:auth-profiles`, `npm run test:attendance`, `npm run typecheck` and `npm run lint`. Dashboard identity and admin Registrations files are preserved. The dashboard attendance module was subsequently connected in the work recorded in `docs/backend/account-access.md`.

Local PostgreSQL integration subsequently passed as recorded below. The next smallest task is to connect only the read-only student/parent attendance view to this endpoint. Phase 1 remains open.

## Earlier blocked inspection: 2026-11-11

At 14:24 UTC, local tooling inspection found no suitable PostgreSQL runtime. The command lookup and filesystem checks produced:

```text
psql: not found
postgres: not found
initdb: not found
pg_ctl: not found
docker: not found
podman: not found
colima: not found
/Applications/Postgres.app: absent
/Applications/Docker.app: absent
/Applications/OrbStack.app: absent
/Library/PostgreSQL: absent
/usr/local/pgsql/bin: absent
/opt/homebrew/Cellar: no PostgreSQL/container runtime packages
/opt/homebrew/opt: no PostgreSQL/container runtime packages
/usr/local/opt: no PostgreSQL/container runtime packages
```

Homebrew is available at `/opt/homebrew/bin/brew`, but no software installation was authorized or performed. No connection string was used, no local database or fixture was created, and no migration from 0000 through 0004 was applied. There are no task-created database resources to clean up.

All real PostgreSQL integration cases remain unrun: HTTP/session/profile authorization; multi-child and unrelated-parent fixtures; inactive, expired and missing-profile accounts; inclusive/default/timezone/range filtering; equal-date pagination; page summaries and empty results; PostgreSQL constraint enforcement and index inspection; and real database/schema failure responses. The existing mock/query tests were not substituted for these cases. No concrete database defect was established and no application fix was made.

The smallest setup step is an explicitly authorized installation of a local PostgreSQL distribution providing `postgres`, `initdb`, `pg_ctl` and `psql`. The test run can then create a fresh temporary cluster on loopback, establish ownership of that disposable database, and apply the repository migrations in order. The existing application driver uses Neon WebSockets rather than PostgreSQL TCP; the installed driver README and CONFIG documentation describe a local WebSocket proxy for non-Neon instances. That local transport must also be supplied by the integration harness before exercising the real HTTP endpoint. No hosted database is required.

Attendance is not yet ready for UI integration under this verification gate. Local database integration remains blocked on the runtime prerequisite; production verification and Phase 1 completion are not claimed.

Documentation-only checks in this session: `npm run typecheck` exited 0 and `npm run lint` exited 0. Lint reported the six existing image warnings, with no errors. No identity or attendance regression tests were rerun because no application code was changed; their previous results are not new integration evidence.

```text
> aroush-academy@0.1.0 typecheck
> tsc --noEmit

> aroush-academy@0.1.0 lint
> eslint

✖ 6 problems (0 errors, 6 warnings)
```

## Successful local PostgreSQL integration: 2026-11-11

This later run supersedes the runtime blocker above. The host was macOS 27.2 on arm64 with Homebrew 7.0.13. The initial sandboxed installation was blocked by Homebrew directory write permissions. After explicit installation authorization and execution approval, `HOMEBREW_NO_AUTO_UPDATE=1 brew install homebrew/core/postgresql@17` completed from official Homebrew core packages. The installed server reported `postgres (PostgreSQL) 17.11 (Homebrew)`. Required Homebrew dependencies were installed, including icu4c, OpenSSL and krb5; ca-certificates and lz4 were upgraded by Homebrew. No Homebrew database service was started.

The reproducible command is `npm run test:attendance-postgres`. It requires installed PostgreSQL tools, defaulting to `/opt/homebrew/opt/postgresql@17/bin`; `LOCAL_POSTGRES_BIN` can specify their location. The harness is currently macOS-oriented and may need execution approval for shared memory and loopback listeners. It does not load environment-file database credentials or accept an existing connection string.

Each run initializes its own PostgreSQL cluster in a newly created `/private/tmp/aroush-attendance-pg-*` directory with a random password and ownership marker. It binds PostgreSQL and a small WebSocket-to-TCP bridge exclusively to loopback ports selected for the run. It creates a fresh `attendance_integration` database and an application role, establishes the database name/address through SQL, and configures the existing Neon driver to use only that local bridge. The app role can read attendance; its write grants cover only the existing login/session flow.

The harness runs real Next.js HTTP routes from an unchanged copy of repository `src` in its disposable workspace, with the existing Next.js config plus test-only output settings and externalized `@neondatabase/serverless`/`ws` packages. A worker preload configures both driver module formats for the local bridge. This avoids editing the repository database driver or Next.js config and prevents loading `.env.local`. The application clock is controlled at 20:00 UTC on the run's calendar date, when Kolkata is already on the following date; the Node process and PostgreSQL session timezone are UTC. This exercises the documented Kolkata date default through actual HTTP requests.

Migrations 0000, 0001, 0002, 0003 and 0004 all applied in order to a fresh database through the repository Drizzle migrator and the actual driver. Stored migration hashes matched the repository SQL files. No migration changes or extra database extensions were required. This establishes the fresh-database path; it does not test migration 0003 against an existing populated registrations table.

Synthetic fixtures covered four students, distinct marks, a parent with two verified children, an unrelated parent/child, an unverified link, accounts without profiles, a parent without linked children, inactive accounts and expired sessions. The following real database/HTTP checks passed:

- Password login, HTTP-only session cookies and current-user identity.
- Student ownership and parent access to each authorized child; denial of other students, unrelated/unverified/nonexistent children and supplied identity headers.
- Missing/invalid/expired/inactive sessions, unsupported roles, incomplete setup and successful empty attendance.
- Inclusive dates, the default 31-date window, a 366-date maximum, invalid dates, duplicate/unknown parameters and oversized requests.
- Equal-date keyset ordering with no missing or duplicated records across pages, and summaries limited to each returned page.
- Actual PostgreSQL rejection of duplicate primary/session keys, invalid statuses, null required values, impossible dates and missing student/batch/recorder foreign keys.
- Restricted batch/recorder deletes and student attendance cascade deletion, with the cascade check rolled back.
- Presence and validity of all attendance indexes, plus use of the ordered lookup index with sequential scans disabled only inside a test transaction. This is not a production performance benchmark.
- Private no-store responses; controlled generic 503 responses after renaming the actual attendance table and revoking the app role's actual users-table permission, followed by successful recovery.
- The existing admin Registrations GET remained functional with a real admin session.

No application query or authorization defect was found. Initial harness failures concerned Next.js worker/module configuration, WebSocket packaging and preserving Date static methods in the controlled clock; these were corrected only in test support files. Temporary diagnostic edits were removed before the successful final run, so its route source copy was unchanged.

At 14:46 UTC the final `node --import tsx scripts/verify-attendance-postgres.mjs` run had exited 0. `npm run test:auth-profiles`, `npm run test:attendance-api` and `npm run test:attendance` also exited 0; the existing attendance suite reported 16 successful cases. Typecheck exited 0, and lint exited 0 with the six existing image warnings. Raw output is retained in `qa-output/attendance-postgres-results.txt`, `attendance-postgres-identity.txt`, `attendance-postgres-api-regression.txt`, `attendance-postgres-calculations.txt` and `attendance-postgres-lint.txt`.

```text
PASS: disposable PostgreSQL attendance integration completed
PASS: stopped and removed only the task-owned PostgreSQL cluster, local bridge and temporary app workspace
postgres (PostgreSQL) 17.11 (Homebrew)
pg_ctl: no server running
PASS: no task-owned PostgreSQL clusters or temporary app workspaces remain
```

All test-owned clusters, fixtures, bridges and app workspaces, including stopped workspaces from earlier attempts, were removed after ownership/stopped-state checks. PostgreSQL remains installed; the Homebrew-created default cluster remains stopped. No hosted database, production data, commit, push, deployment or attendance UI connection was involved.

At the time of this earlier check, attendance UI integration was pending. It has since been connected and tested locally as recorded in `docs/backend/account-access.md`. Hosted migration/application, network-outage/load behavior and production verification remain untested. Phase 1 remains open.
