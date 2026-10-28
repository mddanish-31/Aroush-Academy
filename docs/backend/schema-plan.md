# PostgreSQL (Neon) Database Schema Plan for Drizzle ORM

## 1. Overview and Core Architectural Rules

This document specifies the target PostgreSQL (Neon) relational schema for Aroush Academy, designed for implementation with Drizzle ORM. The schema directly maps to the existing frontend TypeScript types, client storage structures, and verified domain requirements.

### Core Architecture Rules
1. Single academy deployment. There is no academy_id column and no academies table. Academy contact details stay in src/content/site.ts and academy configuration lives in the settings table.
2. Identifiers: Every table uses UUID primary keys with automatic generation: `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`.
3. Timestamps: All timestamps use `timestamptz` with UTC default: `created_at timestamptz NOT NULL DEFAULT now()`.
4. Monetary Values: All fee amounts, balances, payments, and discounts are stored as integer paise (1 INR = 100 paise) to eliminate floating point rounding errors.
5. Server-Side Exam Security: MCQ answer keys (`correct_option_index`) and explanations reside strictly in a separate `question_keys` table. No student or parent endpoint may query `question_keys`. Grading occurs exclusively server-side.
6. Binary File Storage: Payment proof screenshots, ID card photographs, study material documents, and payment QR images are stored in object storage (S3/R2/GCS). The database stores only object storage keys (`storage_key`), never file URLs or raw base64 data. Time-limited signed URLs are generated dynamically at read time by server endpoints and are never stored in the database.
7. Immutable Audit Trail: `audit_logs` is append-only. Mutation and deletion are prevented via PostgreSQL triggers and restricted role privileges.
8. Credential Protection: Passwords are encrypted as salted hashes (`password_hash`) using Node.js built-in scrypt crypto. Plaintext passwords are never stored. OWASP recommended minimum: N=131072, r=8, p=1; maxmem must be above 128*N*r bytes (128 MiB minimum), with 256 MiB recommended for N=131072, r=8, p=1. Login endpoints must be rate limited using `login_attempts` because each hash computation costs about 128 MB of memory. Final production parameters are marked TO CONFIRM after a timing test on the host system.
9. Parent Authorization: Parent access to student records is strictly governed by verified rows in `parent_student_links`. Client-controlled identifiers are never trusted.
10. User Immutability: Users are never hard deleted, only status changes (e.g. status = 'inactive' or 'suspended'). Hard deletion with foreign key SET NULL or CASCADE would fail against append-only audit tables because the BEFORE UPDATE OR DELETE trigger blocks foreign key cascades and mutations on audit_logs.
11. Atomic Number Generation: Sequential identifiers for student admissions, fee receipts, and merit certificates are incremented atomically via the `number_sequences` table within the same transaction that inserts the consuming row. Target tables retain unique indexes.

---

## 2. Entity Schema Specifications

### Table 1: removed (single academy)


### Table 2: users
- Purpose: Core user credentials, authentication identities, and portal access roles.
- Columns:
  - id: uuid, NOT NULL, DEFAULT gen_random_uuid()
  - identifier: varchar(255), NOT NULL
  - email: varchar(255), NULL (NEW: optional verified email)
  - phone: varchar(20), NULL (NEW: optional verified mobile number)
  - password_hash: varchar(255), NOT NULL
  - role: varchar(50), NOT NULL
  - name: varchar(255), NOT NULL
  - avatar_url: text, NULL
  - status: varchar(50), NOT NULL, DEFAULT 'active'
  - last_login_at: timestamptz, NULL
  - created_at: timestamptz, NOT NULL, DEFAULT now()
  - updated_at: timestamptz, NOT NULL, DEFAULT now()
- Primary Key: id
- Foreign Keys: None
- Indexes:
  - UNIQUE INDEX idx_users_identifier ON users(identifier)
  - UNIQUE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL
  - UNIQUE INDEX idx_users_phone ON users(phone) WHERE phone IS NOT NULL
  - INDEX idx_users_role ON users(role)
- Normalization Rule: identifier is stored strictly normalized (email addresses lowercase and trimmed, phone numbers formatted in E.164 e.g. +91XXXXXXXXXX).
- Read Access: Self, academy-admin
- Write Access: Self (profile update, password change), academy-admin
- Frontend Source: AuthUser in src/lib/auth/authTypes.ts:8 (storage key aroush_demo_auth_user)

### Table 3: sessions
- Purpose: Server-side authenticated user session records and tokens.
- Columns:
  - id: uuid, NOT NULL, DEFAULT gen_random_uuid()
  - user_id: uuid, NOT NULL
  - token_hash: varchar(255), NOT NULL
  - ip_address: varchar(45), NULL
  - user_agent: text, NULL
  - expires_at: timestamptz, NOT NULL
  - created_at: timestamptz, NOT NULL, DEFAULT now()
- Primary Key: id
- Foreign Keys:
  - user_id REFERENCES users(id) ON DELETE CASCADE
- Indexes:
  - UNIQUE INDEX idx_sessions_token_hash ON sessions(token_hash)
  - INDEX idx_sessions_user_id ON sessions(user_id)
  - INDEX idx_sessions_expires_at ON sessions(expires_at)
- Read Access: Self
- Write Access: Server authentication system
- Frontend Source: NEW (resolves P4-002; replaces vulnerable client-only AuthContext session state)

### Table 4: login_attempts
- Purpose: Record of authentication attempts for brute-force defense, rate limiting, and security monitoring.
- Columns:
  - id: uuid, NOT NULL, DEFAULT gen_random_uuid()
  - identifier: varchar(255), NOT NULL
  - ip_address: varchar(45), NULL
  - success: boolean, NOT NULL
  - created_at: timestamptz, NOT NULL, DEFAULT now()
- Primary Key: id
- Foreign Keys: None
- Indexes:
  - INDEX idx_login_attempts_created ON login_attempts(identifier, created_at DESC)
- Read Access: academy-admin
- Write Access: Server authentication system
- Frontend Source: NEW (security audit finding prerequisite for production login endpoints)

### Table 5: password_reset_tokens
- Purpose: Single-use cryptographic tokens for password reset verification.
- Columns:
  - id: uuid, NOT NULL, DEFAULT gen_random_uuid()
  - user_id: uuid, NOT NULL
  - token_hash: varchar(255), NOT NULL
  - expires_at: timestamptz, NOT NULL
  - used_at: timestamptz, NULL
  - created_at: timestamptz, NOT NULL, DEFAULT now()
- Primary Key: id
- Foreign Keys:
  - user_id REFERENCES users(id) ON DELETE CASCADE
- Indexes:
  - UNIQUE INDEX idx_reset_tokens_hash ON password_reset_tokens(token_hash)
- Read Access: Self (token verification)
- Write Access: Server authentication system
- Frontend Source: NEW (replaces simulated password reset in src/lib/auth/authTypes.ts:83-91)

### Table 6: registrations
- Purpose: Admissions and account registration requests awaiting administrator verification.
- Columns:
  - id: uuid, NOT NULL, DEFAULT gen_random_uuid()
  - name: varchar(255), NOT NULL
  - identifier: varchar(255), NOT NULL
  - password_hash: varchar(255), NOT NULL
  - role: varchar(50), NOT NULL
  - class_id: uuid, NOT NULL
  - board_id: uuid, NOT NULL
  - guardian_name: varchar(255), NOT NULL
  - guardian_identifier: varchar(255), NOT NULL
  - guardian_email: varchar(255), NULL
  - guardian_password_hash: varchar(255), NOT NULL
  - class_grade: varchar(50), NULL
  - ward_name: varchar(255), NULL
  - linked_student_id: uuid, NULL
  - approved_user_id: uuid, NULL (NEW: points to user record created upon approval)
  - status: varchar(50), NOT NULL, DEFAULT 'pending'
  - rejection_reason: text, NULL
  - reviewed_by_id: uuid, NULL
  - reviewed_at: timestamptz, NULL
  - submitted_at: timestamptz, NOT NULL, DEFAULT now()
  - created_at: timestamptz, NOT NULL, DEFAULT now()
  - updated_at: timestamptz, NOT NULL, DEFAULT now()
- Primary Key: id
- Foreign Keys:
  - class_id REFERENCES academic_classes(id) ON DELETE RESTRICT
  - board_id REFERENCES academic_boards(id) ON DELETE RESTRICT
  - linked_student_id REFERENCES students(id) ON DELETE SET NULL
  - approved_user_id REFERENCES users(id) ON DELETE SET NULL
  - reviewed_by_id REFERENCES users(id) ON DELETE SET NULL
- Indexes:
  - UNIQUE INDEX idx_registrations_pending_identifier ON registrations(identifier) WHERE status = 'pending'
  - INDEX idx_registrations_status ON registrations(status)
  - INDEX idx_registrations_identifier ON registrations(identifier)
- Read Access: academy-admin, applicant (own request status)
- Write Access: Applicant (create), academy-admin (approve/reject)
- Frontend Source: RegistrationRequest in src/lib/auth/authTypes.ts:41 (storage key aroush_demo_registration_requests_v1)

### Table 7: students
- Purpose: Official student demographic and academic profile records.
- Columns:
  - id: uuid, NOT NULL, DEFAULT gen_random_uuid()
  - user_id: uuid, NULL
  - admission_number: varchar(100), NOT NULL
  - name: varchar(255), NOT NULL
  - class_id: uuid, NOT NULL
  - board_id: uuid, NOT NULL
  - school_name: varchar(255), NULL
  - guardian_name: varchar(255), NOT NULL
  - guardian_phone: varchar(20), NOT NULL
  - guardian_email: varchar(255), NULL
  - address: text, NULL
  - joining_date: date, NOT NULL, DEFAULT CURRENT_DATE
  - status: varchar(50), NOT NULL, DEFAULT 'active'
  - created_at: timestamptz, NOT NULL, DEFAULT now()
  - updated_at: timestamptz, NOT NULL, DEFAULT now()
- Primary Key: id
- Foreign Keys:
  - user_id REFERENCES users(id) ON DELETE SET NULL
  - class_id REFERENCES academic_classes(id) ON DELETE RESTRICT
  - board_id REFERENCES academic_boards(id) ON DELETE RESTRICT
- Indexes:
  - UNIQUE INDEX idx_students_admission_number ON students(admission_number)
  - UNIQUE INDEX idx_students_user_id ON students(user_id)
  - INDEX idx_students_class_board ON students(class_id, board_id)
- Seed Data Migration Note: Historical frontend string values for class_grade ('Class IX', 'Class X', 'Class XI', 'Class XII') map directly to academic_classes rows by code ('cls-9', 'cls-10', 'cls-11', 'cls-12'). Curriculum strings ('ICSE', 'CBSE', 'West Bengal Board') map directly to academic_boards rows by code ('ICSE', 'CBSE', 'WBBSE').
- Read Access: academy-admin, assigned teachers, self student, linked parent
- Write Access: academy-admin
- Frontend Source: StudentProfile in src/types/index.ts:24 (storage key aroush_demo_students_v1)

### Table 8: teachers
- Purpose: Faculty profile, academic designations, and institutional details.
- Columns:
  - id: uuid, NOT NULL, DEFAULT gen_random_uuid()
  - user_id: uuid, NULL
  - name: varchar(255), NOT NULL
  - email: varchar(255), NOT NULL
  - phone: varchar(20), NULL
  - bio: text, NULL
  - status: varchar(50), NOT NULL, DEFAULT 'active'
  - created_at: timestamptz, NOT NULL, DEFAULT now()
  - updated_at: timestamptz, NOT NULL, DEFAULT now()
- Primary Key: id
- Foreign Keys:
  - user_id REFERENCES users(id) ON DELETE SET NULL
- Indexes:
  - UNIQUE INDEX idx_teachers_user_id ON teachers(user_id)
  - INDEX idx_teachers_status ON teachers(status)
- Read Access: All authenticated roles
- Write Access: academy-admin
- Frontend Source: TeacherProfile in src/types/index.ts:13 (storage key aroush_demo_faculty_v1)

### Table 9: parents
- Purpose: Normalized parent and guardian identity profiles.
- Columns:
  - id: uuid, NOT NULL, DEFAULT gen_random_uuid()
  - user_id: uuid, NULL
  - name: varchar(255), NOT NULL
  - phone: varchar(20), NOT NULL
  - email: varchar(255), NULL
  - address: text, NULL
  - created_at: timestamptz, NOT NULL, DEFAULT now()
  - updated_at: timestamptz, NOT NULL, DEFAULT now()
- Primary Key: id
- Foreign Keys:
  - user_id REFERENCES users(id) ON DELETE SET NULL
- Indexes:
  - UNIQUE INDEX idx_parents_user_id ON parents(user_id)
  - INDEX idx_parents_phone ON parents(phone)
- Read Access: academy-admin, self parent
- Write Access: academy-admin, self parent
- Frontend Source: NEW (normalized from guardian fields in StudentProfile, src/types/index.ts:29-30)

### Table 10: parent_student_links
- Purpose: Explicit mapping table governing parent access to student ward records.
- Columns:
  - id: uuid, NOT NULL, DEFAULT gen_random_uuid()
  - parent_id: uuid, NOT NULL
  - student_id: uuid, NOT NULL
  - relationship: varchar(50), NOT NULL, DEFAULT 'parent'
  - is_verified: boolean, NOT NULL, DEFAULT true
  - linked_at: timestamptz, NOT NULL, DEFAULT now()
- Primary Key: id
- Foreign Keys:
  - parent_id REFERENCES parents(id) ON DELETE CASCADE
  - student_id REFERENCES students(id) ON DELETE CASCADE
- Indexes:
  - UNIQUE INDEX idx_parent_student_link ON parent_student_links(parent_id, student_id)
  - INDEX idx_ps_links_student ON parent_student_links(student_id)
- Read Access: academy-admin, self parent, linked student
- Write Access: academy-admin
- Frontend Source: NEW (resolves P4-002 and P5-003; replaces arbitrary client localStorage student links)

### Table 11: academic_classes
- Purpose: Grade level divisions offered by the academy (Class V through Class XII).
- Columns:
  - id: uuid, NOT NULL, DEFAULT gen_random_uuid()
  - name: varchar(100), NOT NULL
  - code: varchar(50), NOT NULL
  - display_order: integer, NOT NULL, DEFAULT 0
  - is_active: boolean, NOT NULL, DEFAULT true
  - created_at: timestamptz, NOT NULL, DEFAULT now()
- Primary Key: id
- Foreign Keys: None
- Indexes:
  - UNIQUE INDEX idx_academic_classes_code ON academic_classes(code)
- Read Access: All roles
- Write Access: academy-admin
- Frontend Source: AcademicClass in src/data/academicMasterData.ts:3 (storage key aroush_demo_academic_classes_v1)

### Table 12: academic_boards
- Purpose: Educational curriculum boards (ICSE, CBSE, West Bengal Board).
- Columns:
  - id: uuid, NOT NULL, DEFAULT gen_random_uuid()
  - name: varchar(100), NOT NULL
  - code: varchar(50), NOT NULL
  - is_active: boolean, NOT NULL, DEFAULT true
  - created_at: timestamptz, NOT NULL, DEFAULT now()
- Primary Key: id
- Foreign Keys: None
- Indexes:
  - UNIQUE INDEX idx_academic_boards_code ON academic_boards(code)
- Read Access: All roles
- Write Access: academy-admin
- Frontend Source: AcademicBoard in src/data/academicMasterData.ts:10 (storage key aroush_demo_academic_boards_v1)

### Table 13: academic_subjects
- Purpose: Master subjects list with default tuition fee baselines.
- Columns:
  - id: uuid, NOT NULL, DEFAULT gen_random_uuid()
  - name: varchar(100), NOT NULL
  - code: varchar(50), NOT NULL
  - default_monthly_fee_paise: integer, NOT NULL, DEFAULT 0
  - description: text, NULL
  - is_active: boolean, NOT NULL, DEFAULT true
  - created_at: timestamptz, NOT NULL, DEFAULT now()
- Primary Key: id
- Foreign Keys: None
- Indexes:
  - UNIQUE INDEX idx_academic_subjects_code ON academic_subjects(code)
- Read Access: All roles
- Write Access: academy-admin
- Frontend Source: AcademicSubject in src/data/academicMasterData.ts:17 (storage key aroush_demo_academic_subjects_v1)

### Table 14: batches
- Purpose: Class cohorts assigned to a subject, teacher, and schedule routine.
- Columns:
  - id: uuid, NOT NULL, DEFAULT gen_random_uuid()
  - name: varchar(255), NOT NULL
  - subject_id: uuid, NOT NULL
  - class_id: uuid, NOT NULL
  - teacher_id: uuid, NOT NULL
  - capacity: integer, NOT NULL, DEFAULT 30
  - schedule_summary: varchar(255), NULL
  - monthly_fee_paise: integer, NOT NULL, DEFAULT 0
  - status: varchar(50), NOT NULL, DEFAULT 'active'
  - created_at: timestamptz, NOT NULL, DEFAULT now()
  - updated_at: timestamptz, NOT NULL, DEFAULT now()
- Primary Key: id
- Foreign Keys:
  - subject_id REFERENCES academic_subjects(id) ON DELETE RESTRICT
  - class_id REFERENCES academic_classes(id) ON DELETE RESTRICT
  - teacher_id REFERENCES teachers(id) ON DELETE RESTRICT
- Indexes:
  - INDEX idx_batches_teacher_id ON batches(teacher_id)
  - INDEX idx_batches_class_subject ON batches(class_id, subject_id)
- Read Access: academy-admin, assigned teacher, enrolled students and parents
- Write Access: academy-admin
- Frontend Source: BatchDefinition in src/types/index.ts:514 (storage key aroush_demo_batches_v1)

### Table 15: enrollments
- Purpose: Student admissions into specific subject batches with monthly tuition obligations.
- Columns:
  - id: uuid, NOT NULL, DEFAULT gen_random_uuid()
  - student_id: uuid, NOT NULL
  - batch_id: uuid, NOT NULL
  - monthly_fee_paise: integer, NOT NULL
  - enrollment_date: date, NOT NULL, DEFAULT CURRENT_DATE
  - status: varchar(50), NOT NULL, DEFAULT 'active'
  - created_at: timestamptz, NOT NULL, DEFAULT now()
  - updated_at: timestamptz, NOT NULL, DEFAULT now()
- Primary Key: id
- Foreign Keys:
  - student_id REFERENCES students(id) ON DELETE CASCADE
  - batch_id REFERENCES batches(id) ON DELETE RESTRICT
- Indexes:
  - UNIQUE INDEX idx_enrollments_student_batch ON enrollments(student_id, batch_id)
  - INDEX idx_enrollments_batch_id ON enrollments(batch_id)
- Read Access: academy-admin, batch teacher, self student, linked parent
- Write Access: academy-admin
- Frontend Source: SubjectEnrollment in src/types/index.ts:37 (storage key aroush_demo_enrollments_v1)

### Table 16: attendance
- Purpose: Daily session student attendance marks with remarks and audit history.
- Columns:
  - id: uuid, NOT NULL, DEFAULT gen_random_uuid()
  - student_id: uuid, NOT NULL
  - batch_id: uuid, NOT NULL
  - date: date, NOT NULL
  - status: varchar(50), NOT NULL
  - recorded_by_id: uuid, NOT NULL
  - remarks: text, NULL
  - created_at: timestamptz, NOT NULL, DEFAULT now()
  - updated_at: timestamptz, NOT NULL, DEFAULT now()
- Primary Key: id
- Foreign Keys:
  - student_id REFERENCES students(id) ON DELETE CASCADE
  - batch_id REFERENCES batches(id) ON DELETE RESTRICT
  - recorded_by_id REFERENCES users(id) ON DELETE RESTRICT
- Indexes:
  - UNIQUE INDEX idx_attendance_student_batch_date ON attendance(student_id, batch_id, date)
  - INDEX idx_attendance_batch_date ON attendance(batch_id, date)
- Read Access: academy-admin, batch teacher, self student, linked parent
- Write Access: batch teacher, academy-admin
- Frontend Source: AttendanceRecord in src/types/index.ts:382 (storage key aroush_demo_attendance_v1)

### Table 17: timetable_events
- Purpose: Weekly recurring class slots and calendar room assignments.
- Columns:
  - id: uuid, NOT NULL, DEFAULT gen_random_uuid()
  - batch_id: uuid, NOT NULL
  - day_of_week: varchar(20), NOT NULL
  - start_time: time, NOT NULL
  - end_time: time, NOT NULL
  - room: varchar(100), NULL
  - schedule_type: varchar(50), NOT NULL, DEFAULT 'recurring'
  - specific_date: date, NULL
  - status: varchar(50), NOT NULL, DEFAULT 'active'
  - effective_from: date, NULL
  - effective_until: date, NULL
  - created_at: timestamptz, NOT NULL, DEFAULT now()
- Primary Key: id
- Foreign Keys:
  - batch_id REFERENCES batches(id) ON DELETE CASCADE
- Indexes:
  - INDEX idx_timetable_events_batch_id ON timetable_events(batch_id)
  - INDEX idx_timetable_events_day ON timetable_events(day_of_week)
- Read Access: All authenticated roles (scoped by batch for students and parents)
- Write Access: academy-admin
- Frontend Source: TimetableSlot in src/types/index.ts:346 (storage key aroush_demo_timetable_v1)

### Table 18: online_classes
- Purpose: Live virtual classroom meetings with platform links and instructions.
- Columns:
  - id: uuid, NOT NULL, DEFAULT gen_random_uuid()
  - batch_id: uuid, NOT NULL
  - teacher_id: uuid, NOT NULL
  - timetable_event_id: uuid, NULL
  - title: varchar(255), NOT NULL
  - date: date, NOT NULL
  - start_time: time, NOT NULL
  - end_time: time, NOT NULL
  - duration_minutes: integer, NULL
  - meeting_provider: varchar(50), NOT NULL, DEFAULT 'google-meet'
  - meeting_url: text, NOT NULL
  - instructions: text, NULL
  - recording_url: text, NULL
  - status: varchar(50), NOT NULL, DEFAULT 'scheduled'
  - created_at: timestamptz, NOT NULL, DEFAULT now()
- Primary Key: id
- Foreign Keys:
  - batch_id REFERENCES batches(id) ON DELETE CASCADE
  - teacher_id REFERENCES teachers(id) ON DELETE RESTRICT
  - timetable_event_id REFERENCES timetable_events(id) ON DELETE SET NULL
- Indexes:
  - INDEX idx_online_classes_batch_date ON online_classes(batch_id, date)
- Read Access: academy-admin, batch teacher, enrolled students and parents
- Write Access: batch teacher, academy-admin
- Frontend Source: ClassroomSession in src/types/index.ts:578 (storage key aroush_demo_classroom_sessions_v1)

### Table 19: assessments
- Purpose: Class tests, unit tests, mock examinations, and evaluation papers.
- Columns:
  - id: uuid, NOT NULL, DEFAULT gen_random_uuid()
  - batch_id: uuid, NOT NULL
  - class_id: uuid, NOT NULL
  - subject_id: uuid, NOT NULL
  - created_by_id: uuid, NOT NULL
  - title: varchar(255), NOT NULL
  - mode: varchar(50), NOT NULL, DEFAULT 'offline_test'
  - assessment_type: varchar(50), NOT NULL, DEFAULT 'regular-class-test'
  - date: date, NOT NULL
  - duration_minutes: integer, NOT NULL, DEFAULT 60
  - total_marks: integer, NOT NULL
  - passing_marks: integer, NULL
  - status: varchar(50), NOT NULL, DEFAULT 'draft'
  - certificate_policy: jsonb, NULL
  - instructions: jsonb, NULL
  - created_at: timestamptz, NOT NULL, DEFAULT now()
  - updated_at: timestamptz, NOT NULL, DEFAULT now()
- Primary Key: id
- Foreign Keys:
  - batch_id REFERENCES batches(id) ON DELETE CASCADE
  - class_id REFERENCES academic_classes(id) ON DELETE RESTRICT
  - subject_id REFERENCES academic_subjects(id) ON DELETE RESTRICT
  - created_by_id REFERENCES users(id) ON DELETE RESTRICT
- Indexes:
  - INDEX idx_assessments_batch_id ON assessments(batch_id)
  - INDEX idx_assessments_class_subject ON assessments(class_id, subject_id)
  - INDEX idx_assessments_created_by ON assessments(created_by_id)
  - INDEX idx_assessments_status ON assessments(status)
  - INDEX idx_assessments_mode ON assessments(mode)
- Read Access: academy-admin, author teacher, enrolled students/parents (published only)
- Write Access: author teacher, academy-admin
- Frontend Source: AssessmentRecord & MockExam in src/types/index.ts:419,634 (storage keys aroush_demo_assessments_v1, aroush_demo_mock_exams_v1)

### Table 20: questions
- Purpose: Individual assessment problems and option choices. Contains no answers; safe to project to students during tests.
- Columns:
  - id: uuid, NOT NULL, DEFAULT gen_random_uuid()
  - assessment_id: uuid, NOT NULL
  - question_number: integer, NOT NULL
  - question_text: text, NOT NULL
  - question_type: varchar(50), NOT NULL, DEFAULT 'mcq_single'
  - options: jsonb, NOT NULL
  - marks: integer, NOT NULL, DEFAULT 1
  - created_at: timestamptz, NOT NULL, DEFAULT now()
- Primary Key: id
- Foreign Keys:
  - assessment_id REFERENCES assessments(id) ON DELETE CASCADE
- Indexes:
  - INDEX idx_questions_assessment_no ON questions(assessment_id, question_number)
- Read Access: academy-admin, author teacher, enrolled students and parents
- Write Access: author teacher, academy-admin
- Frontend Source: MockExamQuestion in src/types/index.ts:624 (excluding answer keys)

### Table 21: question_keys
- Purpose: Isolated server-only storage for MCQ correct answer indices and explanations. No student or parent endpoint may query question_keys (resolves P4-001).
- Columns:
  - question_id: uuid, NOT NULL
  - correct_option_index: integer, NOT NULL
  - explanation: text, NULL
  - created_at: timestamptz, NOT NULL, DEFAULT now()
  - updated_at: timestamptz, NOT NULL, DEFAULT now()
- Primary Key: question_id
- Foreign Keys:
  - question_id REFERENCES questions(id) ON DELETE CASCADE
- Indexes: None
- Read Access: academy-admin, author teacher (server grading engine and authoring view only). No student or parent endpoint may query question_keys.
- Write Access: author teacher, academy-admin
- Frontend Source: NEW (segregated from MockExamQuestion in src/types/index.ts:629,631; resolves P4-001)

### Table 22: attempts
- Purpose: Student online mock exam submissions, answer records, and completion scores.
- Columns:
  - id: uuid, NOT NULL, DEFAULT gen_random_uuid()
  - assessment_id: uuid, NOT NULL
  - student_id: uuid, NOT NULL
  - attempt_number: integer, NOT NULL, DEFAULT 1
  - started_at: timestamptz, NOT NULL, DEFAULT now()
  - submitted_at: timestamptz, NULL
  - status: varchar(50), NOT NULL, DEFAULT 'in_progress'
  - total_questions: integer, NOT NULL
  - total_marks: integer, NOT NULL
  - score_obtained: integer, NOT NULL, DEFAULT 0
  - percentage: numeric(5,2), NOT NULL, DEFAULT 0.00
  - correct_count: integer, NOT NULL, DEFAULT 0
  - incorrect_count: integer, NOT NULL, DEFAULT 0
  - unanswered_count: integer, NOT NULL, DEFAULT 0
  - is_passed: boolean, NOT NULL, DEFAULT false
  - time_taken_seconds: integer, NULL
  - submission_type: varchar(50), NOT NULL, DEFAULT 'manual'
  - submitted_answers: jsonb, NOT NULL
- Primary Key: id
- Foreign Keys:
  - assessment_id REFERENCES assessments(id) ON DELETE CASCADE
  - student_id REFERENCES students(id) ON DELETE CASCADE
- Indexes:
  - UNIQUE INDEX idx_attempts_assessment_student_attempt ON attempts(assessment_id, student_id, attempt_number)
  - INDEX idx_attempts_student_id ON attempts(student_id)
  - INDEX idx_attempts_status ON attempts(status)
- Retake Rule: In src/components/dashboard/AssessmentsModule.tsx:971, the frontend supports re-submitting an online mock exam (`setExamResults((prev) => [result, ...prev.filter((r) => r.examId !== selectedExam.id)])`), overwriting previous client result state. The relational schema supports multiple historical attempts via attempt_number.
- Server-Side Timing and Deadline Invariant: When an attempt starts, the server records started_at = now() and status = 'in_progress'. The exam deadline is computed and strictly enforced by the server as: deadline = started_at + (assessments.duration_minutes * 60) + 30 seconds grace period. Upon submission, the server verifies that now() <= deadline, computes time_taken_seconds = EXTRACT(EPOCH FROM (now() - started_at)), sets submitted_at = now(), and transitions status to 'completed'. Late submissions are rejected or marked with submission_type = 'timeout'. Client-supplied time_taken_seconds values are never trusted.
- Read Access: academy-admin, batch teacher, self student, linked parent
- Write Access: self student (submission), server evaluation engine
- Frontend Source: ExamAttemptResult in src/types/index.ts:650 (storage key aroush_demo_exam_results_v1)

### Table 23: marks
- Purpose: Student score ledger entries for offline classroom tests and evaluated papers.
- Columns:
  - id: uuid, NOT NULL, DEFAULT gen_random_uuid()
  - assessment_id: uuid, NOT NULL
  - student_id: uuid, NOT NULL
  - marks_obtained: integer, NOT NULL
  - status: varchar(50), NOT NULL, DEFAULT 'evaluated'
  - feedback: text, NULL
  - evaluated_by_id: uuid, NULL
  - created_at: timestamptz, NOT NULL, DEFAULT now()
  - updated_at: timestamptz, NOT NULL, DEFAULT now()
- Primary Key: id
- Foreign Keys:
  - assessment_id REFERENCES assessments(id) ON DELETE CASCADE
  - student_id REFERENCES students(id) ON DELETE CASCADE
  - evaluated_by_id REFERENCES users(id) ON DELETE SET NULL
- Indexes:
  - UNIQUE INDEX idx_marks_assessment_student ON marks(assessment_id, student_id)
- Read Access: academy-admin, batch teacher, self student, linked parent
- Write Access: batch teacher, academy-admin
- Frontend Source: studentScores in AssessmentRecord, src/types/index.ts:431

### Table 24: certificates
- Purpose: Official verifiable merit and mock-completion certificates issued to students.
- Columns:
  - id: uuid, NOT NULL, DEFAULT gen_random_uuid()
  - certificate_number: varchar(100), NOT NULL
  - certificate_type: varchar(50), NOT NULL, DEFAULT 'merit'
  - title: varchar(255), NOT NULL
  - student_id: uuid, NOT NULL
  - assessment_id: uuid, NOT NULL
  - score_obtained: integer, NOT NULL
  - total_marks: integer, NOT NULL
  - percentage: numeric(5,2), NOT NULL
  - criteria_met: text, NOT NULL
  - issued_date: date, NOT NULL, DEFAULT CURRENT_DATE
  - issued_by_id: uuid, NOT NULL
  - faculty_name: varchar(255), NOT NULL
  - status: varchar(50), NOT NULL, DEFAULT 'issued'
  - revoked_at: timestamptz, NULL
  - revoked_by_id: uuid, NULL
  - revocation_reason: text, NULL
  - verification_hash: varchar(255), NULL
  - created_at: timestamptz, NOT NULL, DEFAULT now()
- Primary Key: id
- Foreign Keys:
  - student_id REFERENCES students(id) ON DELETE CASCADE
  - assessment_id REFERENCES assessments(id) ON DELETE RESTRICT
  - issued_by_id REFERENCES users(id) ON DELETE RESTRICT
  - revoked_by_id REFERENCES users(id) ON DELETE SET NULL
- Indexes:
  - UNIQUE INDEX idx_certificates_number ON certificates(certificate_number)
  - INDEX idx_certificates_student_id ON certificates(student_id)
- Read Access: academy-admin, teacher, self student, linked parent, public verify endpoint
- Write Access: academy-admin
- Frontend Source: IssuedCertificateRecord in src/types/index.ts:441 (storage key aroush_demo_issued_certificates_v1)

### Table 25: fee_structures
- Purpose: Tuition fee rules configured by class, board, and subject.
- Columns:
  - id: uuid, NOT NULL, DEFAULT gen_random_uuid()
  - class_id: uuid, NOT NULL
  - board_id: uuid, NOT NULL
  - subject_id: uuid, NOT NULL
  - monthly_tuition_fee_paise: integer, NOT NULL
  - effective_from: date, NOT NULL
  - billing_due_day: integer, NOT NULL, DEFAULT 10
  - notes: text, NULL
  - created_at: timestamptz, NOT NULL, DEFAULT now()
  - updated_at: timestamptz, NOT NULL, DEFAULT now()
- Primary Key: id
- Foreign Keys:
  - class_id REFERENCES academic_classes(id) ON DELETE RESTRICT
  - board_id REFERENCES academic_boards(id) ON DELETE RESTRICT
  - subject_id REFERENCES academic_subjects(id) ON DELETE RESTRICT
- Indexes:
  - UNIQUE INDEX idx_fee_structures_rule ON fee_structures(class_id, board_id, subject_id, effective_from)
- Read Access: All authenticated roles
- Write Access: academy-admin
- Frontend Source: FeeConfigurationRule in src/types/index.ts:163 (storage key aroush_demo_fee_configurations_v2)

### Table 26: fee_records
- Purpose: Monthly tuition obligations generated per enrolled student.
- Columns:
  - id: uuid, NOT NULL, DEFAULT gen_random_uuid()
  - enrollment_id: uuid, NOT NULL
  - student_id: uuid, NOT NULL
  - month: varchar(20), NOT NULL
  - month_label: varchar(50), NOT NULL
  - fee_amount_paise: integer, NOT NULL
  - paid_amount_paise: integer, NOT NULL, DEFAULT 0
  - balance_amount_paise: integer, NOT NULL
  - is_prorated: boolean, NOT NULL, DEFAULT false (NEW: flags mid-month pro-rated enrollments)
  - due_date: date, NOT NULL
  - status: varchar(50), NOT NULL, DEFAULT 'unpaid'
  - created_at: timestamptz, NOT NULL, DEFAULT now()
  - updated_at: timestamptz, NOT NULL, DEFAULT now()
- Primary Key: id
- Foreign Keys:
  - enrollment_id REFERENCES enrollments(id) ON DELETE CASCADE
  - student_id REFERENCES students(id) ON DELETE CASCADE
- Constraints:
  - CHECK (balance_amount_paise = fee_amount_paise - paid_amount_paise AND paid_amount_paise >= 0 AND fee_amount_paise >= 0)
- Indexes:
  - UNIQUE INDEX idx_fee_records_obligation ON fee_records(enrollment_id, month)
  - INDEX idx_fee_records_student_status ON fee_records(student_id, status)
- Fee Adjustment Ledger Invariant: When fee_adjustments are applied: discount and waiver types decrement fee_amount_paise and decrement balance_amount_paise; penalty types increment fee_amount_paise and increment balance_amount_paise; refund types decrement paid_amount_paise and increment balance_amount_paise; correction types apply a signed delta to fee_amount_paise (positive increments fee_amount_paise and increments balance_amount_paise; negative decrements fee_amount_paise and decrements balance_amount_paise, leaving paid_amount_paise unchanged).
- Atomic Settlement Invariant: Payment verification (payment_submissions status transition to 'verified'), payment ledger logging (fee_payments), receipt generation (fee_receipts), and obligation balance updates (fee_records.paid_amount_paise incremented, balance_amount_paise decremented) execute inside one atomic database transaction.
- Read Access: academy-admin, batch teacher, self student, linked parent
- Write Access: academy-admin (automated billing generator)
- Frontend Source: MonthlyFeeObligation in src/types/index.ts:52 (storage key aroush_demo_obligations_v2)

### Table 27: fee_payments
- Purpose: Official payment transaction ledger recording money collected.
- Columns:
  - id: uuid, NOT NULL, DEFAULT gen_random_uuid()
  - student_id: uuid, NOT NULL
  - enrollment_id: uuid, NOT NULL
  - fee_record_id: uuid, NOT NULL
  - amount_paise: integer, NOT NULL
  - payment_method: varchar(50), NOT NULL
  - reference_id: varchar(100), NULL
  - payment_date: date, NOT NULL, DEFAULT CURRENT_DATE
  - collected_by_id: uuid, NOT NULL
  - receipt_number: varchar(100), NOT NULL
  - notes: text, NULL
  - created_at: timestamptz, NOT NULL, DEFAULT now()
- Primary Key: id
- Foreign Keys:
  - student_id REFERENCES students(id) ON DELETE CASCADE
  - enrollment_id REFERENCES enrollments(id) ON DELETE CASCADE
  - fee_record_id REFERENCES fee_records(id) ON DELETE RESTRICT
  - collected_by_id REFERENCES users(id) ON DELETE RESTRICT
- Indexes:
  - INDEX idx_fee_payments_receipt ON fee_payments(receipt_number)
  - INDEX idx_fee_payments_student ON fee_payments(student_id)
  - INDEX idx_fee_payments_record ON fee_payments(fee_record_id)
- Receipt Uniqueness Invariant: receipt_number is enforced as unique in ONE table only: fee_receipts. In fee_payments, receipt_number is a non-unique audit reference linking to the issued receipt.
- Read Access: academy-admin, batch teacher, self student, linked parent
- Write Access: academy-admin, authorized teacher (cash receipt entry)
- Frontend Source: PaymentTransaction in src/types/index.ts:65 (storage key aroush_demo_payments_v2)

### Table 28: payment_submissions
- Purpose: Student and parent online payment transfer claims awaiting administrative verification.
- Columns:
  - id: uuid, NOT NULL, DEFAULT gen_random_uuid()
  - student_id: uuid, NOT NULL
  - enrollment_id: uuid, NOT NULL
  - fee_record_id: uuid, NOT NULL
  - amount_paise: integer, NOT NULL
  - payment_method: varchar(50), NOT NULL
  - reference_id: varchar(100), NULL
  - transfer_date: date, NOT NULL
  - status: varchar(50), NOT NULL, DEFAULT 'pending'
  - submitted_by_id: uuid, NOT NULL
  - rejection_reason: text, NULL
  - verified_at: timestamptz, NULL
  - verified_by_id: uuid, NULL
  - receipt_number: varchar(100), NULL
  - submitted_at: timestamptz, NOT NULL, DEFAULT now()
- Primary Key: id
- Foreign Keys:
  - student_id REFERENCES students(id) ON DELETE CASCADE
  - enrollment_id REFERENCES enrollments(id) ON DELETE CASCADE
  - fee_record_id REFERENCES fee_records(id) ON DELETE RESTRICT
  - submitted_by_id REFERENCES users(id) ON DELETE RESTRICT
  - verified_by_id REFERENCES users(id) ON DELETE SET NULL
- Indexes:
  - INDEX idx_payment_submissions_status ON payment_submissions(status)
  - INDEX idx_payment_submissions_student ON payment_submissions(student_id)
- Read Access: academy-admin, self student, linked parent
- Write Access: student/parent (submit), academy-admin (verify/reject)
- Frontend Source: PaymentSubmission in src/types/index.ts:114 (storage key aroush_demo_payment_submissions_v2)

### Table 29: payment_proofs
- Purpose: Object storage metadata for payment receipt screenshots, replacing browser base64 storage (resolves P5-001). Signed URLs are generated on demand at read time and never stored in the database.
- Columns:
  - id: uuid, NOT NULL, DEFAULT gen_random_uuid()
  - submission_id: uuid, NOT NULL
  - storage_key: varchar(500), NOT NULL
  - file_name: varchar(255), NOT NULL
  - file_size_bytes: integer, NOT NULL
  - mime_type: varchar(100), NOT NULL
  - uploaded_at: timestamptz, NOT NULL, DEFAULT now()
- Primary Key: id
- Foreign Keys:
  - submission_id REFERENCES payment_submissions(id) ON DELETE CASCADE
- Indexes:
  - INDEX idx_payment_proofs_submission ON payment_proofs(submission_id)
- Read Access: academy-admin, submitting student and parent
- Write Access: submitting student/parent (upload), academy-admin
- Frontend Source: NEW (replaces proofFileData base64 string in PaymentSubmission, resolves P5-001)

### Table 30: fee_adjustments
- Purpose: Fee discounts, waivers, corrections, and penalties applied to student obligations.
- Columns:
  - id: uuid, NOT NULL, DEFAULT gen_random_uuid()
  - student_id: uuid, NOT NULL
  - enrollment_id: uuid, NOT NULL
  - fee_record_id: uuid, NOT NULL
  - adjustment_type: varchar(50), NOT NULL
  - amount_paise: integer, NOT NULL
  - reason: text, NOT NULL
  - authorized_by_id: uuid, NOT NULL
  - created_at: timestamptz, NOT NULL, DEFAULT now()
- Primary Key: id
- Foreign Keys:
  - student_id REFERENCES students(id) ON DELETE CASCADE
  - enrollment_id REFERENCES enrollments(id) ON DELETE CASCADE
  - fee_record_id REFERENCES fee_records(id) ON DELETE CASCADE
  - authorized_by_id REFERENCES users(id) ON DELETE RESTRICT
- Indexes:
  - INDEX idx_fee_adjustments_record ON fee_adjustments(fee_record_id)
- Adjustment Calculation Invariant: discount and waiver decrement fee_amount_paise and balance_amount_paise; penalty increments fee_amount_paise and balance_amount_paise; refund decrements paid_amount_paise and increments balance_amount_paise; correction applies a signed delta to fee_amount_paise (positive increments fee_amount_paise and balance_amount_paise; negative decrements fee_amount_paise and balance_amount_paise; paid_amount_paise is unaffected).
- Read Access: academy-admin, self student, linked parent
- Write Access: academy-admin
- Frontend Source: FeeAdjustment in src/types/index.ts:148 (storage key aroush_demo_fee_adjustments_v2)

### Table 31: fee_receipts
- Purpose: Official verifiable tuition payment receipts issued to families.
- Columns:
  - id: uuid, NOT NULL, DEFAULT gen_random_uuid()
  - receipt_number: varchar(100), NOT NULL
  - payment_transaction_id: uuid, NOT NULL
  - submission_id: uuid, NULL
  - student_id: uuid, NOT NULL
  - enrollment_id: uuid, NOT NULL
  - fee_record_id: uuid, NOT NULL
  - amount_received_paise: integer, NOT NULL
  - payment_method: varchar(50), NOT NULL
  - reference_id: varchar(100), NULL
  - remaining_balance_paise: integer, NOT NULL, DEFAULT 0
  - issued_by_id: uuid, NOT NULL
  - verification_hash: varchar(255), NULL
  - created_at: timestamptz, NOT NULL, DEFAULT now()
- Primary Key: id
- Foreign Keys:
  - payment_transaction_id REFERENCES fee_payments(id) ON DELETE RESTRICT
  - submission_id REFERENCES payment_submissions(id) ON DELETE SET NULL
  - student_id REFERENCES students(id) ON DELETE CASCADE
  - enrollment_id REFERENCES enrollments(id) ON DELETE RESTRICT
  - fee_record_id REFERENCES fee_records(id) ON DELETE RESTRICT
  - issued_by_id REFERENCES users(id) ON DELETE RESTRICT
- Indexes:
  - UNIQUE INDEX idx_fee_receipts_number ON fee_receipts(receipt_number)
  - INDEX idx_fee_receipts_student ON fee_receipts(student_id)
- Receipt Uniqueness: receipt_number is enforced as unique strictly in fee_receipts.
- Read Access: academy-admin, batch teacher, self student, linked parent
- Write Access: academy-admin
- Frontend Source: VerifiedFeeReceipt in src/types/index.ts:177 (storage key aroush_demo_fee_receipts_v2)

### Table 32: payment_destinations
- Purpose: Authorized banking and UPI accounts configured for receiving tuition fees.
- Columns:
  - id: uuid, NOT NULL, DEFAULT gen_random_uuid()
  - subject_id: uuid, NULL
  - teacher_id: uuid, NULL
  - account_holder_name: varchar(255), NOT NULL
  - bank_name: varchar(255), NOT NULL
  - account_number: varchar(100), NOT NULL
  - ifsc_code: varchar(50), NOT NULL
  - branch_name: varchar(255), NULL
  - upi_id: varchar(255), NOT NULL
  - qr_storage_key: varchar(500), NULL
  - is_active: boolean, NOT NULL, DEFAULT true
  - notes: text, NULL
  - updated_by_id: uuid, NULL
  - created_at: timestamptz, NOT NULL, DEFAULT now()
  - updated_at: timestamptz, NOT NULL, DEFAULT now()
- Primary Key: id
- Foreign Keys:
  - subject_id REFERENCES academic_subjects(id) ON DELETE SET NULL
  - teacher_id REFERENCES teachers(id) ON DELETE SET NULL
  - updated_by_id REFERENCES users(id) ON DELETE SET NULL
- Indexes:
  - INDEX idx_payment_destinations_active ON payment_destinations(is_active)
- Read Access: All authenticated roles
- Write Access: academy-admin
- Frontend Source: PaymentDestination in src/types/index.ts:94 (storage key aroush_demo_payment_destinations_v2)

### Table 33: notices
- Purpose: Announcements, academic circulars, and urgent schedule notices.
- Columns:
  - id: uuid, NOT NULL, DEFAULT gen_random_uuid()
  - title: varchar(255), NOT NULL
  - category: varchar(100), NOT NULL
  - content: text, NOT NULL
  - priority: varchar(50), NOT NULL, DEFAULT 'normal'
  - target_roles: jsonb, NOT NULL
  - published_by_id: uuid, NOT NULL
  - publish_date: date, NOT NULL, DEFAULT CURRENT_DATE
  - is_active: boolean, NOT NULL, DEFAULT true
  - created_at: timestamptz, NOT NULL, DEFAULT now()
  - updated_at: timestamptz, NOT NULL, DEFAULT now()
- Primary Key: id
- Foreign Keys:
  - published_by_id REFERENCES users(id) ON DELETE RESTRICT
- Indexes:
  - INDEX idx_notices_priority_date ON notices(priority, publish_date)
- Read Access: Authenticated users whose role is in target_roles
- Write Access: academy-admin
- Frontend Source: NoticeItem in src/types/index.ts:503 (storage key aroush_demo_notices_v1)

### Table 34: study_materials
- Purpose: Uploaded class notes, formula sheets, homework assignments, and practice worksheets. Signed download URLs are generated dynamically at read time and never stored in the database.
- Columns:
  - id: uuid, NOT NULL, DEFAULT gen_random_uuid()
  - batch_id: uuid, NOT NULL
  - teacher_id: uuid, NOT NULL
  - title: varchar(255), NOT NULL
  - material_type: varchar(100), NOT NULL
  - description: text, NULL
  - storage_key: varchar(500), NOT NULL
  - file_name: varchar(255), NOT NULL
  - file_size_bytes: integer, NOT NULL, DEFAULT 0
  - mime_type: varchar(100), NOT NULL, DEFAULT 'application/pdf'
  - status: varchar(50), NOT NULL, DEFAULT 'published'
  - download_count: integer, NOT NULL, DEFAULT 0
  - created_at: timestamptz, NOT NULL, DEFAULT now()
  - updated_at: timestamptz, NOT NULL, DEFAULT now()
- Primary Key: id
- Foreign Keys:
  - batch_id REFERENCES batches(id) ON DELETE CASCADE
  - teacher_id REFERENCES teachers(id) ON DELETE RESTRICT
- Indexes:
  - INDEX idx_study_materials_batch ON study_materials(batch_id, status)
- Read Access: academy-admin, author teacher, enrolled students and parents (published only)
- Write Access: author teacher, academy-admin
- Frontend Source: StudyMaterialItem in src/types/index.ts:479 (storage key aroush_demo_study_materials_v1)

### Table 35: id_cards
- Purpose: Student digital identification credentials with lifecycle states and issuance logs.
- Columns:
  - id: uuid, NOT NULL, DEFAULT gen_random_uuid()
  - student_id: uuid, NOT NULL
  - student_formatted_id: varchar(100), NOT NULL
  - session: varchar(50), NOT NULL
  - photo_storage_key: varchar(500), NULL
  - status: varchar(50), NOT NULL, DEFAULT 'draft'
  - valid_from: date, NOT NULL
  - valid_thru: date, NOT NULL
  - issued_at: timestamptz, NULL
  - issued_by_id: uuid, NULL
  - rejection_reason: text, NULL
  - history: jsonb, NOT NULL, DEFAULT '[]'
  - created_at: timestamptz, NOT NULL, DEFAULT now()
  - updated_at: timestamptz, NOT NULL, DEFAULT now()
- Primary Key: id
- Foreign Keys:
  - student_id REFERENCES students(id) ON DELETE CASCADE
  - issued_by_id REFERENCES users(id) ON DELETE SET NULL
- Indexes:
  - UNIQUE INDEX idx_id_cards_student_id ON id_cards(student_id)
  - UNIQUE INDEX idx_id_cards_formatted_id ON id_cards(student_formatted_id)
  - INDEX idx_id_cards_status ON id_cards(status)
- Read Access: academy-admin, self student, linked parent, QR verification route
- Write Access: academy-admin
- Frontend Source: StudentIdCardRecord in src/types/index.ts:715 (storage key aroush_demo_student_id_cards_v1)

### Table 36: audit_logs
- Purpose: Append-only, tamper-evident security, operations, and financial audit ledger (resolves P5-002).
- Columns:
  - id: uuid, NOT NULL, DEFAULT gen_random_uuid()
  - performed_by_id: uuid, NULL
  - performed_by_name: varchar(255), NOT NULL
  - actor_role: varchar(50), NOT NULL
  - action: varchar(100), NOT NULL
  - action_type: varchar(50), NOT NULL
  - category: varchar(50), NOT NULL
  - target: varchar(255), NOT NULL
  - entity_type: varchar(100), NULL
  - entity_id: varchar(100), NULL
  - details: text, NOT NULL
  - outcome: varchar(50), NOT NULL, DEFAULT 'SUCCESS'
  - diff: jsonb, NULL
  - source_portal: varchar(50), NOT NULL, DEFAULT 'system'
  - ip_address: varchar(45), NULL
  - timestamp: timestamptz, NOT NULL, DEFAULT now()
- Primary Key: id
- Foreign Keys: None
- Indexes:
  - INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC)
  - INDEX idx_audit_logs_category ON audit_logs(category)
- Foreign Key Immutability Note: performed_by_id is stored as a plain uuid without a foreign key. A foreign key with ON DELETE SET NULL or CASCADE would attempt an UPDATE or DELETE on audit_logs when a user is removed, which would be rejected by the BEFORE UPDATE OR DELETE immutability trigger.
- Read Access: academy-admin only
- Write Access: Append-only via server service. No UPDATE or DELETE allowed.
- Append-Only Enforcement Mechanism:
  1. Trigger Guard: A PostgreSQL trigger executes BEFORE UPDATE OR DELETE ON audit_logs and executes RAISE EXCEPTION 'audit_logs entries are immutable and append-only'.
  2. Database Role Grants: The database role used by Next.js backend services is granted INSERT and SELECT only on audit_logs. UPDATE, DELETE, and TRUNCATE privileges are revoked.
- Frontend Source: AuditLogEntry in src/types/index.ts:550 (storage key aroush_demo_audit_logs_v1)

### Table 37: reviews
- Purpose: Student and parent course and faculty ratings and testimonials.
- Columns:
  - id: uuid, NOT NULL, DEFAULT gen_random_uuid()
  - user_id: uuid, NULL
  - author_name: varchar(255), NOT NULL
  - author_role: varchar(50), NOT NULL
  - class_grade: varchar(50), NULL
  - subject_id: uuid, NULL
  - teacher_id: uuid, NULL
  - rating: integer, NOT NULL
  - comment: text, NOT NULL
  - status: varchar(50), NOT NULL, DEFAULT 'pending'
  - moderated_by_id: uuid, NULL
  - moderated_at: timestamptz, NULL
  - created_at: timestamptz, NOT NULL, DEFAULT now()
- Primary Key: id
- Foreign Keys:
  - user_id REFERENCES users(id) ON DELETE SET NULL
  - subject_id REFERENCES academic_subjects(id) ON DELETE SET NULL
  - teacher_id REFERENCES teachers(id) ON DELETE SET NULL
  - moderated_by_id REFERENCES users(id) ON DELETE SET NULL
- Indexes:
  - INDEX idx_reviews_status ON reviews(status)
- Read Access: Public (approved reviews only), academy-admin (all)
- Write Access: Authenticated student/parent (submit), academy-admin (moderate)
- Frontend Source: NEW (implements showSampleReviews feature flag in src/content/site.ts:12 and moderation terms in src/content/legal.ts:135)

### Table 38: enquiries
- Purpose: Public admissions inquiry submissions from prospective students and parents.
- Columns:
  - id: uuid, NOT NULL, DEFAULT gen_random_uuid()
  - student_name: varchar(255), NOT NULL
  - contact_number: varchar(20), NOT NULL
  - target_class: varchar(50), NOT NULL
  - target_board: varchar(50), NOT NULL
  - notes: text, NULL
  - status: varchar(50), NOT NULL, DEFAULT 'new'
  - assigned_to_id: uuid, NULL
  - follow_up_notes: text, NULL
  - submitted_at: timestamptz, NOT NULL, DEFAULT now()
  - updated_at: timestamptz, NOT NULL, DEFAULT now()
- Primary Key: id
- Foreign Keys:
  - assigned_to_id REFERENCES users(id) ON DELETE SET NULL
- Indexes:
  - INDEX idx_enquiries_status ON enquiries(status, submitted_at DESC)
- Read Access: academy-admin
- Write Access: Public (create), academy-admin (update/follow-up)
- Frontend Source: EnquiryPayload in src/content/enquiry.ts:1, submitted via submitEnquiry

### Table 39: media_assets
- Purpose: Central catalog of uploaded and hosted images, video previews, and documents.
- Columns:
  - id: uuid, NOT NULL, DEFAULT gen_random_uuid()
  - kind: varchar(50), NOT NULL
  - storage_key: varchar(500), NULL
  - url: text, NULL
  - poster_url: text, NULL
  - alt_text: varchar(255), NULL
  - width: integer, NULL
  - height: integer, NULL
  - size_bytes: integer, NOT NULL, DEFAULT 0
  - mime_type: varchar(100), NOT NULL
  - is_stock: boolean, NOT NULL, DEFAULT false
  - is_private: boolean, NOT NULL, DEFAULT false
  - caption: text, NULL
  - credit: text, NULL
  - credit_url: text, NULL
  - uploaded_by_id: uuid, NULL
  - created_at: timestamptz, NOT NULL, DEFAULT now()
- Primary Key: id
- Foreign Keys:
  - uploaded_by_id REFERENCES users(id) ON DELETE SET NULL
- Constraints:
  - CHECK ((is_stock = true AND url IS NOT NULL) OR (storage_key IS NOT NULL))
- Indexes:
  - UNIQUE INDEX idx_media_assets_storage_key ON media_assets(storage_key) WHERE storage_key IS NOT NULL
  - INDEX idx_media_assets_kind ON media_assets(kind)
- Read Access: Public (public assets), authenticated (private assets)
- Write Access: academy-admin, teacher
- Frontend Source: MediaItem in src/content/types.ts:8 and src/content/media.ts:3

### Table 40: offers
- Purpose: Admissions fee concession campaigns, sibling discounts, and early-enrollment vouchers.
- Columns:
  - id: uuid, NOT NULL, DEFAULT gen_random_uuid()
  - code: varchar(50), NOT NULL
  - title: varchar(255), NOT NULL
  - description: text, NULL
  - discount_type: varchar(50), NOT NULL
  - discount_value: integer, NOT NULL
  - applicable_class_ids: jsonb, NULL
  - applicable_subject_ids: jsonb, NULL
  - valid_from: date, NOT NULL
  - valid_until: date, NOT NULL
  - is_active: boolean, NOT NULL, DEFAULT true
  - created_at: timestamptz, NOT NULL, DEFAULT now()
- Primary Key: id
- Foreign Keys: None
- Indexes:
  - UNIQUE INDEX idx_offers_code ON offers(code)
- Read Access: All authenticated roles, public (active offers)
- Write Access: academy-admin
- Frontend Source: NEW (formalizes non-binding pricing disclaimer in src/components/landing/Pricing.tsx:123)

### Table 41: account_invitations
- Purpose: Pre-created invitation tokens allowing students and parents to activate accounts linked to existing student records.
- Columns:
  - id: uuid, NOT NULL, DEFAULT gen_random_uuid()
  - student_id: uuid, NOT NULL
  - target_role: varchar(50), NOT NULL
  - recipient_identifier: varchar(255), NOT NULL
  - invitation_code: varchar(100), NOT NULL
  - activation_status: varchar(50), NOT NULL, DEFAULT 'invited'
  - activated_at: timestamptz, NULL
  - activated_user_id: uuid, NULL
  - expires_at: timestamptz, NOT NULL
  - created_at: timestamptz, NOT NULL, DEFAULT now()
- Primary Key: id
- Foreign Keys:
  - student_id REFERENCES students(id) ON DELETE CASCADE
  - activated_user_id REFERENCES users(id) ON DELETE SET NULL
- Indexes:
  - UNIQUE INDEX idx_account_invitations_code ON account_invitations(invitation_code)
  - INDEX idx_account_invitations_student ON account_invitations(student_id)
- Read Access: academy-admin, recipient (via invitation code)
- Write Access: academy-admin (create), recipient (activate)
- Frontend Source: AccountInvitation in src/lib/auth/authTypes.ts:59 (storage key aroush_demo_account_invitations_v1)

### Table 42: number_sequences
- Purpose: Atomic sequence counter for generating gapless, sequential admission numbers, receipt vouchers, and certificate codes. Numbers are issued by an atomic increment inside the same transaction as the consuming row.
- Columns:
  - id: uuid, NOT NULL, DEFAULT gen_random_uuid()
  - kind: varchar(50), NOT NULL
  - year: integer, NOT NULL
  - last_value: integer, NOT NULL, DEFAULT 0
  - created_at: timestamptz, NOT NULL, DEFAULT now()
  - updated_at: timestamptz, NOT NULL, DEFAULT now()
- Primary Key: id
- Foreign Keys: None
- Indexes:
  - UNIQUE INDEX idx_number_sequences_kind_year ON number_sequences(kind, year)
- Read Access: academy-admin, system transaction routines
- Write Access: system transaction routines (atomic update), academy-admin
- Frontend Source: NEW (formalizes counter generation for admissions, receipts, and certificates)

### Table 43: settings
- Purpose: Dynamic institutional key-value configuration storage. Stores structured JSON data for academy configuration, including teacher certificate permissions and custom study material types.
- Columns:
  - id: uuid, NOT NULL, DEFAULT gen_random_uuid()
  - key: varchar(100), NOT NULL
  - value: jsonb, NOT NULL
  - created_at: timestamptz, NOT NULL, DEFAULT now()
  - updated_at: timestamptz, NOT NULL, DEFAULT now()
- Primary Key: id
- Foreign Keys: None
- Indexes:
  - UNIQUE INDEX idx_settings_key ON settings(key)
- Read Access: All authenticated roles
- Write Access: academy-admin
- Frontend Source: NEW (persists teacher_cert_permission from aroush_demo_teacher_cert_permission_v1 and custom study_material_types from aroush_demo_study_material_types_v1)

---

## 3. Enumerations

The following table lists every role, status, and categorical column across all database entities. In PostgreSQL and Drizzle ORM, these will be implemented as native Postgres enums (`pgEnum`) or database CHECK constraints to enforce strict domain validation at the persistence boundary.

| Table | Column | Allowed Values | Source Citation |
|:---|:---|:---|:---|
| users | role | 'academy-admin', 'teacher', 'student', 'parent' | src/types/index.ts:3-7 |
| users | status | 'active', 'inactive', 'suspended' | src/lib/auth/authTypes.ts:13 |
| registrations | role | 'student', 'parent' | src/lib/auth/authTypes.ts:46 |
| registrations | status | 'pending', 'approved', 'rejected' | src/lib/auth/authTypes.ts:39 |
| students | status | 'active', 'inactive', 'on-leave' | src/types/index.ts:32 |
| teachers | status | 'active', 'inactive' | src/types/index.ts:19 |
| batches | status | 'active', 'upcoming', 'completed', 'archived' | src/data/dashboardModulesData.ts:10 |
| enrollments | status | 'active', 'paused', 'completed' | src/types/index.ts:49 |
| attendance | status | 'present', 'absent', 'late', 'excused' | src/types/index.ts:368 |
| timetable_events | status | 'active', 'cancelled' | src/types/index.ts:361 |
| online_classes | meeting_provider | 'google-meet', 'zoom', 'teams', 'other' | src/types/index.ts:585 |
| online_classes | status | 'scheduled', 'live', 'completed', 'cancelled' | src/types/index.ts:588 |
| assessments | mode | 'online_mock', 'offline_test' | src/types/index.ts:408,634 |
| assessments | assessment_type | 'regular-class-test', 'periodic-unit-test', 'board-mock-test', 'online-mock-exam' | src/types/index.ts:404-408 |
| assessments | status | 'draft', 'scheduled', 'completed', 'published' | src/types/index.ts:410 |
| attempts | submission_type | 'manual', 'timeout' | src/components/dashboard/AssessmentsModule.tsx:918 |
| attempts | status | 'in_progress', 'completed' | src/components/dashboard/AssessmentsModule.tsx:971 |
| marks | status | 'evaluated', 'absent', 'pending' | src/types/index.ts:435 |
| certificates | certificate_type | 'merit', 'mock-completion' | src/types/index.ts:416,444 |
| certificates | status | 'issued', 'revoked' | src/types/index.ts:686-696 |
| fee_records | status | 'paid', 'partially-paid', 'unpaid', 'overdue' | src/types/index.ts:11 |
| fee_payments | payment_method | 'cash', 'upi', 'bank_transfer' | src/types/index.ts:9,125 |
| payment_submissions | payment_method | 'cash', 'upi', 'bank_transfer' | src/types/index.ts:125 |
| payment_submissions | status | 'pending', 'verified', 'rejected', 'cancelled' | src/types/index.ts:112 |
| fee_adjustments | adjustment_type | 'discount', 'waiver', 'correction', 'penalty', 'refund' | src/types/index.ts:156 |
| notices | priority | 'normal', 'urgent' | src/types/index.ts:510 |
| notices | category | 'Academic', 'Examination', 'Holiday', 'Administration' | src/types/index.ts:506 |
| study_materials | status | 'draft', 'published' | src/types/index.ts:477 |
| id_cards | status | 'draft', 'pending-approval', 'approved', 'rejected', 'expired', 'inactive' | src/types/index.ts:690-696 |
| audit_logs | action | 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'SUBMIT', 'VERIFY', 'REJECT', 'REVOKE' | src/types/index.ts:701-709 |
| reviews | author_role | 'student', 'parent', 'alumni' | src/types/index.ts:241 |
| reviews | status | 'pending', 'approved', 'rejected' | src/content/legal.ts:135 |
| enquiries | status | 'new', 'contacted', 'resolved', 'closed' | src/content/enquiry.ts:1 |
| media_assets | kind | 'photo', 'video', 'document', 'logo' | src/content/types.ts:9 |
| offers | discount_type | 'percentage', 'flat_paise' | src/components/landing/Pricing.tsx:123 |
| account_invitations | target_role | 'academy-admin', 'teacher', 'student', 'parent' | src/types/index.ts:3-7 |
| account_invitations | activation_status | 'invited', 'activation_pending', 'activated' | src/lib/auth/authTypes.ts:5 |
| number_sequences | kind | 'admission', 'receipt', 'certificate' | docs/backend/schema-plan.md:18 (Table 42) |

---

## 4. Frontend Field Coverage

The following coverage tables map every TypeScript field from the 8 primary frontend types to its corresponding database column, or document the rationale for dropping client-side transient fields.

### 4.1 StudentProfile (src/types/index.ts:24-35)
| TypeScript Field | Database Mapping | Status / Justification |
|:---|:---|:---|
| id | students.id | Mapped (uuid primary key) |
| name | students.name | Mapped (varchar(255)) |
| classGrade | students.class_id | Mapped (foreign key to academic_classes.id; legacy strings 'Class IX'-'Class XII' map via seed migration) |
| board | students.board_id | Mapped (foreign key to academic_boards.id; legacy strings 'ICSE', 'CBSE', 'West Bengal Board' map via seed migration) |
| guardianName | students.guardian_name | Mapped (varchar(255)) |
| guardianPhone | students.guardian_phone | Mapped (varchar(20)) |
| joiningDate | students.joining_date | Mapped (date) |
| studentStatus | students.status | Mapped (varchar(50), active / inactive / on-leave) |
| accountLinkStatus | dropped | Dropped: Client UI derived state computed by checking if students.user_id IS NOT NULL |
| linkedUserIdentifier | dropped | Dropped: Client display cache; resolved dynamically via JOIN users ON students.user_id = users.id |

### 4.2 TeacherProfile (src/types/index.ts:13-20)
| TypeScript Field | Database Mapping | Status / Justification |
|:---|:---|:---|
| id | teachers.id | Mapped (uuid primary key) |
| name | teachers.name | Mapped (varchar(255)) |
| assignedSubjects | dropped | Dropped: Denormalized string array in demo; normalized to relational lookups via batches and academic_subjects |
| batches | dropped | Dropped: Denormalized string array in demo; normalized to relational lookups via batches.teacher_id |
| email | teachers.email | Mapped (varchar(255)) |
| status | teachers.status | Mapped (varchar(50), active / inactive) |

### 4.3 AuthUser (src/lib/auth/authTypes.ts:8-22)
| TypeScript Field | Database Mapping | Status / Justification |
|:---|:---|:---|
| id | users.id | Mapped (uuid primary key) |
| name | users.name | Mapped (varchar(255)) |
| identifier | users.identifier | Mapped (varchar(255) unique login identity) |
| role | users.role | Mapped (varchar(50)) |
| profileId | dropped | Dropped: Client transient pointer; resolved server-side via students.user_id or teachers.user_id |
| linkedStudentId | dropped | Dropped: Client active-ward selector; resolved server-side via parent_student_links |
| linkedTeacherId | dropped | Dropped: Client transient pointer; resolved server-side via teachers.user_id |
| linkedStudentIds | dropped | Dropped: Client array; normalized to relational rows in parent_student_links |
| activationStatus | dropped | Dropped: Client invitation flag; managed server-side via users.status and account_invitations.activation_status |
| linkStatus | dropped | Dropped: Client verification flag; resolved server-side via parent_student_links.is_verified |
| avatarUrl | users.avatar_url | Mapped (text) |
| email | users.email | Mapped (varchar(255)) |
| createdAt | users.created_at | Mapped (timestamptz) |

### 4.4 RegistrationRequest (src/lib/auth/authTypes.ts:41-57)
| TypeScript Field | Database Mapping | Status / Justification |
|:---|:---|:---|
| id | registrations.id | Mapped (uuid primary key) |
| name | registrations.name | Mapped (varchar(255)) |
| identifier | registrations.identifier | Mapped (varchar(255)) |
| password | registrations.password_hash | Mapped: Transformed from plaintext to salted scrypt hash on the server; plaintext discarded |
| role | registrations.role | Mapped (varchar(50), student / parent) |
| classGrade | registrations.class_grade | Mapped (varchar(50)) |
| wardName | registrations.ward_name | Mapped (varchar(255)) |
| status | registrations.status | Mapped (varchar(50), pending / approved / rejected) |
| linkStatus | dropped | Dropped: Client UI helper flag; verified linkages established upon approval via parent_student_links |
| linkedStudentId | registrations.linked_student_id | Mapped (uuid foreign key to students.id) |
| linkedStudentIds | dropped | Dropped: Multi-ward demo array; primary linked student stored in linked_student_id, additional wards linked via parent_student_links post-approval |
| submittedAt | registrations.submitted_at | Mapped (timestamptz) |
| reviewedAt | registrations.reviewed_at | Mapped (timestamptz) |
| reviewedBy | registrations.reviewed_by_id | Mapped (uuid foreign key to users.id) |
| rejectionReason | registrations.rejection_reason | Mapped (text) |

### 4.5 MockExam (src/types/index.ts:634-648)
| TypeScript Field | Database Mapping | Status / Justification |
|:---|:---|:---|
| id | assessments.id | Mapped (uuid primary key) |
| title | assessments.title | Mapped (varchar(255)) |
| subject | assessments.subject_id | Mapped (uuid foreign key to academic_subjects.id) |
| classGrade | assessments.class_id | Mapped (uuid foreign key to academic_classes.id) |
| batchName | assessments.batch_id | Mapped (uuid foreign key to batches.id) |
| teacherId | assessments.created_by_id | Mapped (uuid foreign key to users.id) |
| teacherName | dropped | Dropped: Denormalized UI display string; resolved dynamically via JOIN users ON assessments.created_by_id = users.id |
| durationMinutes | assessments.duration_minutes | Mapped (integer) |
| totalMarks | assessments.total_marks | Mapped (integer) |
| passingMarks | assessments.passing_marks | Mapped (integer) |
| questions | dropped | Dropped from parent entity: Normalized into separate child records in questions table |
| instructions | assessments.instructions | Mapped (jsonb array of strings) |
| status | assessments.status | Mapped (varchar(50), 'draft', 'scheduled', 'completed', 'published') |

### 4.6 MockExamQuestion (src/types/index.ts:624-632)
| TypeScript Field | Database Mapping | Status / Justification |
|:---|:---|:---|
| id | questions.id | Mapped (uuid primary key) |
| questionNumber | questions.question_number | Mapped (integer) |
| questionText | questions.question_text | Mapped (text) |
| options | questions.options | Mapped (jsonb array of strings) |
| correctOptionIndex | question_keys.correct_option_index | Mapped: Segregated into dedicated server-only question_keys table; inaccessible to student endpoints (resolves P4-001) |
| marks | questions.marks | Mapped (integer) |
| explanation | question_keys.explanation | Mapped: Segregated into dedicated server-only question_keys table (resolves P4-001) |

### 4.7 PaymentSubmission (src/types/index.ts:114-146)
| TypeScript Field | Database Mapping | Status / Justification |
|:---|:---|:---|
| id | payment_submissions.id | Mapped (uuid primary key) |
| studentId | payment_submissions.student_id | Mapped (uuid foreign key to students.id) |
| studentName | dropped | Dropped: Denormalized display name; resolved dynamically via JOIN students |
| subjectName | dropped | Dropped: Denormalized display name; resolved dynamically via enrollments -> batches -> academic_subjects |
| teacherId | dropped | Dropped: Denormalized foreign key; resolved dynamically via enrollments -> batches.teacher_id |
| teacherName | dropped | Dropped: Denormalized display name; resolved dynamically via JOIN teachers |
| enrollmentId | payment_submissions.enrollment_id | Mapped (uuid foreign key to enrollments.id) |
| obligationId | payment_submissions.fee_record_id | Mapped (uuid foreign key to fee_records.id) |
| monthLabel | dropped | Dropped: Denormalized display string; resolved dynamically via JOIN fee_records.month_label |
| amount | payment_submissions.amount_paise | Mapped (integer paise, amount * 100) |
| paymentMethod | payment_submissions.payment_method | Mapped (varchar(50), unified values: 'cash', 'upi', 'bank_transfer') |
| referenceId | payment_submissions.reference_id | Mapped (varchar(100)) |
| transferDate | payment_submissions.transfer_date | Mapped (date) |
| proofFileName | payment_proofs.file_name | Mapped: Normalized into child asset row in payment_proofs |
| proofFileSize | payment_proofs.file_size_bytes | Mapped: Normalized into payment_proofs.file_size_bytes |
| proofFileType | payment_proofs.mime_type | Mapped: Normalized into payment_proofs.mime_type |
| proofFileData | payment_proofs.storage_key | Mapped: Raw base64 data completely eliminated (resolves P5-001); replaced with object storage key in payment_proofs |
| status | payment_submissions.status | Mapped (varchar(50), pending / verified / rejected / cancelled) |
| submittedAt | payment_submissions.submitted_at | Mapped (timestamptz) |
| submittedByRole | dropped | Dropped: Denormalized role string; resolved dynamically via JOIN users.role ON payment_submissions.submitted_by_id = users.id |
| submittedByName | dropped | Dropped: Denormalized display name; resolved dynamically via JOIN users.name |
| rejectionReason | payment_submissions.rejection_reason | Mapped (text) |
| verifiedAt | payment_submissions.verified_at | Mapped (timestamptz) |
| verifiedBy | payment_submissions.verified_by_id | Mapped (uuid foreign key to users.id) |
| receiptNumber | payment_submissions.receipt_number | Mapped (varchar(100)) |
| destinationSnapshot | dropped | Dropped: Transient UI confirmation snapshot; canonical banking coordinates recorded in payment_destinations and fee_payments |

### 4.8 AssessmentRecord (src/types/index.ts:419-439)
| TypeScript Field | Database Mapping | Status / Justification |
|:---|:---|:---|
| id | assessments.id | Mapped (uuid primary key) |
| title | assessments.title | Mapped (varchar(255)) |
| subject | assessments.subject_id | Mapped (uuid foreign key to academic_subjects.id) |
| batch | assessments.batch_id | Mapped (uuid foreign key to batches.id) |
| classGrade | assessments.class_id | Mapped (uuid foreign key to academic_classes.id) |
| date | assessments.date | Mapped (date) |
| totalMarks | assessments.total_marks | Mapped (integer) |
| teacherId | assessments.created_by_id | Mapped (uuid foreign key to users.id) |
| type | assessments.assessment_type | Mapped (varchar(50), 'regular-class-test', 'periodic-unit-test', 'board-mock-test', 'online-mock-exam') |
| status | assessments.status | Mapped (varchar(50), 'draft', 'scheduled', 'completed', 'published') |
| certificatePolicy | assessments.certificate_policy | Mapped (jsonb; stores { enabled, minPercentage, certificateTitle?, certificateType? }) |
| studentScores | dropped | Dropped from parent entity: Normalized into child records in marks table (marks_obtained, status, feedback) |
| linkedMockExamId | dropped | Dropped: Unified entity architecture; offline tests and online mocks share the unified assessments table with mode = 'online_mock' or 'offline_test' |

---

## 5. Dependency Creation Order and Migration Phases

### 5.1 Topological Dependency Levels

Tables must be created in the following order to satisfy all foreign key references:

- Level 1 (Master metadata and atomic sequences):
  1. academic_classes
  2. academic_boards
  3. academic_subjects
  4. number_sequences
  5. settings
  6. offers

- Level 2 (User identities, rate limits, and fee configuration rules):
  7. users
  8. login_attempts
  9. fee_structures

- Level 3 (User credentials, sessions, profiles, media, and audit trails):
  10. password_reset_tokens
  11. sessions
  12. teachers
  13. students
  14. parents
  15. media_assets
  16. notices
  17. enquiries
  18. audit_logs

- Level 4 (Entity linkages, cohorts, invitations, and payment destinations):
  19. parent_student_links
  20. registrations
  21. account_invitations
  22. id_cards
  23. payment_destinations
  24. batches
  25. reviews

- Level 5 (Cohort routines, curriculum schedules, and enrollments):
  26. enrollments
  27. timetable_events
  28. online_classes
  29. assessments
  30. study_materials
  31. attendance

- Level 6 (Evaluations, question items, answer keys, certificates, and billing obligations):
  32. questions
  33. question_keys
  34. attempts
  35. marks
  36. certificates
  37. fee_records

- Level 7 (Payment ledger transactions, submissions, and adjustments):
  38. fee_payments
  39. payment_submissions
  40. fee_adjustments

- Level 8 (Receipts and binary proof assets):
  41. payment_proofs
  42. fee_receipts

### 5.2 Independent Migration Phases

The schema is partitioned into 5 decoupled migration phases (A through E). Each phase is independently migratable in a valid topological order without cyclic dependencies.

#### Phase A: Identity and Directory (18 tables)
- Scope: Authentication, user accounts, academic taxonomy, cohorts, enrollments, audit logging, and institutional configuration.
- Tables:
  1. academic_classes
  2. academic_boards
  3. academic_subjects
  4. number_sequences
  5. settings
  6. users
  7. login_attempts
  8. password_reset_tokens
  9. sessions
  10. teachers
  11. students
  12. parents
  13. parent_student_links
  14. registrations
  15. account_invitations
  16. batches
  17. enrollments
  18. audit_logs
- Execution Rationale: Forms the foundational directory. All foreign keys are self-contained within Phase A.

#### Phase B: Academic Operations (6 tables)
- Scope: Classroom day-to-day operations, attendance, timetable scheduling, live classes, notices, study material documents, and digital student ID credentials.
- Tables:
  19. attendance
  20. timetable_events
  21. online_classes
  22. notices
  23. study_materials
  24. id_cards
- Execution Rationale: Depends strictly on Phase A directory tables (batches, students, teachers, users). online_classes references timetable_events within Phase B.

#### Phase C: Assessments (6 tables)
- Scope: Class tests, unit tests, online mock exams, MCQ questions, segregated answer keys, student attempt tracking, teacher marks evaluations, and merit certificates.
- Tables:
  25. assessments
  26. questions
  27. question_keys
  28. attempts
  29. marks
  30. certificates
- Execution Rationale: Depends on Phase A (batches, students, teachers, users). question_keys references questions within Phase C. Answer keys are strictly segregated from public and student queries.

#### Phase D: Fees and Financial Ledger (8 tables)
- Scope: Tuition fee master rules, monthly student obligations, cash and online payment ledger, parent transfer submissions, binary payment proofs, billing adjustments, and official fee receipts.
- Tables:
  31. fee_structures
  32. payment_destinations
  33. fee_records
  34. fee_payments
  35. payment_submissions
  36. payment_proofs
  37. fee_adjustments
  38. fee_receipts
- Execution Rationale: Depends on Phase A (students, enrollments, users). payment_proofs, fee_payments, and fee_receipts reference Phase D fee_records and payment_submissions. Settlement and receipt generation execute in a single atomic transaction.

#### Phase E: Public Site and Marketing (4 tables)
- Scope: Public testimonial reviews, prospective student admissions enquiries, media asset metadata catalog, and discount voucher campaigns.
- Tables:
  39. media_assets
  40. reviews
  41. enquiries
  42. offers
- Execution Rationale: Depends only on Phase A (users). No table moves are required between phases because Phases B, C, D, and E depend exclusively on Phase A and their own internal tables. Storage key columns (study_materials.storage_key, id_cards.photo_storage_key, payment_destinations.qr_storage_key) store cloud object keys directly rather than foreign keys to media_assets, keeping the domains completely decoupled.

---

## 6. Resolution of Audit Blockers

The following table documents how the schema resolves the 5 critical audit blockers:

| Blocker ID | Core Vulnerability | Resolving Table and Column | Architectural Resolution |
|:---|:---|:---|:---|
| P2-001 | Plaintext passwords stored in browser localStorage | users.password_hash, registrations.password_hash | Plaintext passwords are completely eliminated. Passwords are sent over HTTPS, salted and hashed using scrypt via Node.js built-in crypto (no native binary dependency), and stored strictly in password_hash. No plaintext password is ever written to storage or returned in API responses. OWASP recommended minimum scrypt parameters: N=131072 (CPU/memory cost), r=8 (block size), p=1 (parallelization); maxmem must be above 128*N*r bytes (128 MiB minimum), with 256 MiB recommended for N=131072, r=8, p=1, using a 16-byte random salt (crypto.randomBytes(16)) and 64-byte key length. Login endpoints must be rate limited using login_attempts because each hash computation costs about 128 MB of memory. In constrained serverless runtimes with lower execution timeouts or memory limits, lower parameters such as N=16384 may be evaluated. The choice of scrypt via Node.js built-in crypto is a recommendation. Final parameters are marked TO CONFIRM after a timing test on the host system to benchmark hash computation latency (target: 200-500ms). |
| P4-001 | MCQ exam answer key (correctOptionIndex) delivered to client DevTools | question_keys.correct_option_index, question_keys.explanation | correct_option_index and explanation are segregated into a dedicated question_keys table that is never queryable by student or parent endpoints. Students only receive the sanitized questions table. Exam answer evaluation executes strictly on the backend upon submission. |
| P4-002 | Modifying linkedStudentId in localStorage allows viewing another student's private data | sessions, parent_student_links, students.user_id, parents.user_id | Client-side authorization is replaced with server-side authenticated sessions in sessions. Database queries strictly scope student records to the authenticated user ID. Parent access to student records is permitted exclusively via verified rows in parent_student_links. |
| P5-001 | Base64 payment proof uploads crash browser localStorage quota | payment_proofs.storage_key | Base64 data URLs in database rows and browser storage are replaced by binary multipart form uploads to secure cloud object storage (S3/R2/GCS). The database stores only object storage keys and metadata. Temporary signed URLs are generated at read time. |
| P5-002 | Administrative audit log stored in localStorage can be cleared or tampered with | audit_logs (immutable append-only table) | Audit events are stored in a dedicated server-side audit_logs table. Mutation and deletion are prohibited by a PostgreSQL BEFORE UPDATE OR DELETE trigger raising an uncatchable exception, combined with database role permissions granting only INSERT and SELECT. |

---

## 7. Questions for the Owner

### 7.1 Blocks the Schema Now

The following architectural questions directly block primary table structures, foreign key definitions, and security policies. Owner decisions are required before finalizing Drizzle migrations:

1. User Identifier Normalization (Q2): Demo login accepts either email addresses (admin@aroushacademy.in) or phone numbers (098830 05641). Should production login strictly enforce normalized E.164 phone numbers, email addresses, or support both as login identifiers? Blocks: users.identifier, users.phone, users.email.
2. Registration Approval Flow (Q3): When an admin approves a student or parent registration request, should the backend automatically create a student record, a parent record, and an account invitation, or does the admin manually select an existing student profile ID? Blocks: registrations.linked_student_id, registrations.approved_user_id.
3. Multiple Linked Parents (Q5): Can a student be linked to multiple parent accounts (e.g. father and mother with separate phone numbers and logins), and what relationship types should be allowed? Blocks: parent_student_links.relationship.
4. Central vs Teacher Direct Banking (Q8): In payment_destinations, UPI IDs and bank accounts are mapped per teacher and subject. Does Aroush Academy collect all fees centrally into an institutional account, or do teachers directly receive subject tuition payments from students? Blocks: payment_destinations.teacher_id, fee_payments.collected_by_id.
5. Public Testimonial Submission (Q12): Should reviews be submitted exclusively by authenticated students and parents, or should public website visitors be permitted to submit testimonials subject to admin moderation? Blocks: reviews.user_id, reviews.status.
6. Private File Access (Q14): Are study materials and ID card photographs publicly accessible via CDN URLs or do they require short-lived presigned URLs with access control checks? Blocks: study_materials.storage_key, media_assets.is_private.

### 7.2 Default Assumed, Confirm Later

The following operational questions have working defaults implemented in the schema. These can proceed into initial Drizzle schema definitions and be adjusted later upon owner confirmation:

1. Single Academy Deployment (Q1): DECIDED: single academy. Single academy deployment with no multi-tenancy.
2. Admission Number Generation (Q4): Frontend demo records use STU-001 and ID cards use AA-2026-STU-001. Is there an institutional numbering sequence formula for admissions, or should the database auto-generate AA-YYYY-NNNN? Blocks: students.admission_number, id_cards.student_formatted_id. Default ASSUMED: Generated sequentially as AA-YYYY-NNNN via atomic increment on number_sequences with kind = 'admission'.
3. Mid-Month Enrollment Pro-Rating (Q6): When a student enrolls mid-month (e.g. on the 20th), is the first monthly fee obligation calculated pro-rata, charged in full, or deferred to the next calendar month? Blocks: fee_records.fee_amount_paise, fee_records.is_prorated. Default ASSUMED: Full monthly tuition charged by default; manual or mid-month concessions flagged via is_prorated and adjusted through fee_adjustments.
4. Official Receipt Sequence (Q7): Receipt numbers in the demo use REC-2026-001. Is there a legally registered tax invoice sequence required for statutory compliance in West Bengal? Blocks: fee_receipts.receipt_number, fee_payments.receipt_number. Default ASSUMED: Sequentially incremented REC-YYYY-NNNN generated via atomic increment on number_sequences with kind = 'receipt'.
5. Certificate Grading Standards (Q9): CertificatePolicy currently uses minPercentage (75%). Are academic certificates issued purely on percentage thresholds, or do letter grades (A+, A, B) apply, and who holds statutory signing authority? Blocks: certificates.criteria_met, certificates.faculty_name. Default ASSUMED: Issued upon achieving minimum percentage threshold configured in assessment certificate_policy; faculty_name records issuing instructor.
6. Subjective Exam Question Types (Q10): MockExamQuestion currently supports 4-option MCQs. Does Aroush Academy require subjective, numerical entry, or file-upload answers for board exam simulations? Blocks: questions.options, question_keys.correct_option_index. Default ASSUMED: Standard 4-option MCQs stored in questions.options with server answer keys in question_keys; future question formats supported via jsonb.
7. Live Class Recording Hosting (Q11): Are Google Meet/Zoom class recordings stored in private cloud object storage buckets, or embedded as unlisted YouTube/Vimeo video links? Blocks: online_classes.recording_url, media_assets.storage_key. Default ASSUMED: External platform links stored in online_classes.recording_url; hosted private media files stored in media_assets.storage_key.
8. Concession Offer Rules (Q13): What commercial discount rules are authorized (percentage waiver, flat paise discount, sibling concession, referral credit), and do they attach to monthly obligations or batch enrollments? Blocks: offers.discount_type, offers.discount_value, offers.code. Default ASSUMED: Percentage or flat paise discounts stored in offers table, applied during batch enrollment or fee generation.
9. Audit Log Retention Period (Q15): What is the mandatory retention period for financial and administrative audit records (e.g. 7 years for financial records vs indefinite retention)? Blocks: database retention and partitioning policies (operational lifecycle, no table columns affected). Default ASSUMED: Indefinite retention in append-only audit_logs; table partitioning by year/month to be evaluated in production.

---

## 8. Table Count Summary

Total table count: 42 tables
- Phase A (Identity & Directory): 18 tables
- Phase B (Academic Operations): 6 tables
- Phase C (Assessments): 6 tables
- Phase D (Fees & Financial Ledger): 8 tables
- Phase E (Public Site & Marketing): 4 tables
- Grand Total: 42 tables

---

## 9. Deferred fixes

- attempts snapshot of per-question results for student review
- submitted_answers default
- partial unique index for one in_progress attempt per student and assessment
- CHECK between mode and assessment_type
- fee_records balance >= 0 or credit rule
- refund must write a ledger row
- overdue computed at read time
- unique fee_receipts.payment_transaction_id
- if branches are ever needed, add academy_id in a new migration
- Neon password reset not yet confirmed by the user


