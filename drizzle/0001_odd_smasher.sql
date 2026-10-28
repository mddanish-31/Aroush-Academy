CREATE TYPE "public"."batch_status" AS ENUM('active', 'upcoming', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."enrollment_status" AS ENUM('active', 'paused', 'completed');--> statement-breakpoint
CREATE TYPE "public"."invitation_activation_status" AS ENUM('invited', 'activation_pending', 'activated');--> statement-breakpoint
CREATE TYPE "public"."registration_role" AS ENUM('student', 'parent');--> statement-breakpoint
CREATE TYPE "public"."registration_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."student_status" AS ENUM('active', 'inactive', 'on-leave');--> statement-breakpoint
CREATE TYPE "public"."teacher_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TABLE "parent_student_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"relationship" varchar(50) DEFAULT 'parent' NOT NULL,
	"is_verified" boolean DEFAULT true NOT NULL,
	"linked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"name" varchar(255) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"email" varchar(255),
	"address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"admission_number" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"class_id" uuid NOT NULL,
	"board_id" uuid NOT NULL,
	"school_name" varchar(255),
	"guardian_name" varchar(255) NOT NULL,
	"guardian_phone" varchar(20) NOT NULL,
	"guardian_email" varchar(255),
	"address" text,
	"joining_date" date DEFAULT CURRENT_DATE NOT NULL,
	"status" "student_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teachers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20),
	"bio" text,
	"status" "teacher_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"target_role" "user_role" NOT NULL,
	"recipient_identifier" varchar(255) NOT NULL,
	"invitation_code" varchar(100) NOT NULL,
	"activation_status" "invitation_activation_status" DEFAULT 'invited' NOT NULL,
	"activated_at" timestamp with time zone,
	"activated_user_id" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"identifier" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" "registration_role" NOT NULL,
	"class_grade" varchar(50),
	"ward_name" varchar(255),
	"linked_student_id" uuid,
	"approved_user_id" uuid,
	"status" "registration_status" DEFAULT 'pending' NOT NULL,
	"rejection_reason" text,
	"reviewed_by_id" uuid,
	"reviewed_at" timestamp with time zone,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"subject_id" uuid NOT NULL,
	"class_id" uuid NOT NULL,
	"teacher_id" uuid NOT NULL,
	"capacity" integer DEFAULT 30 NOT NULL,
	"schedule_summary" varchar(255),
	"monthly_fee_paise" integer DEFAULT 0 NOT NULL,
	"status" "batch_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"batch_id" uuid NOT NULL,
	"monthly_fee_paise" integer NOT NULL,
	"enrollment_date" date DEFAULT CURRENT_DATE NOT NULL,
	"status" "enrollment_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"performed_by_id" uuid,
	"performed_by_name" varchar(255) NOT NULL,
	"actor_role" varchar(50) NOT NULL,
	"action" varchar(100) NOT NULL,
	"action_type" varchar(50) NOT NULL,
	"category" varchar(50) NOT NULL,
	"target" varchar(255) NOT NULL,
	"entity_type" varchar(100),
	"entity_id" varchar(100),
	"details" text NOT NULL,
	"outcome" varchar(50) DEFAULT 'SUCCESS' NOT NULL,
	"diff" jsonb,
	"source_portal" varchar(50) DEFAULT 'system' NOT NULL,
	"ip_address" varchar(45),
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "parent_student_links" ADD CONSTRAINT "parent_student_links_parent_id_parents_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."parents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_student_links" ADD CONSTRAINT "parent_student_links_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parents" ADD CONSTRAINT "parents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_class_id_academic_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."academic_classes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_board_id_academic_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."academic_boards"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_invitations" ADD CONSTRAINT "account_invitations_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_invitations" ADD CONSTRAINT "account_invitations_activated_user_id_users_id_fk" FOREIGN KEY ("activated_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_linked_student_id_students_id_fk" FOREIGN KEY ("linked_student_id") REFERENCES "public"."students"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_approved_user_id_users_id_fk" FOREIGN KEY ("approved_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_subject_id_academic_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."academic_subjects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_class_id_academic_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."academic_classes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_parent_student_link" ON "parent_student_links" USING btree ("parent_id","student_id");--> statement-breakpoint
CREATE INDEX "idx_ps_links_student" ON "parent_student_links" USING btree ("student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_parents_user_id" ON "parents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_parents_phone" ON "parents" USING btree ("phone");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_students_admission_number" ON "students" USING btree ("admission_number");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_students_user_id" ON "students" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_students_class_board" ON "students" USING btree ("class_id","board_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_teachers_user_id" ON "teachers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_teachers_status" ON "teachers" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_account_invitations_code" ON "account_invitations" USING btree ("invitation_code");--> statement-breakpoint
CREATE INDEX "idx_account_invitations_student" ON "account_invitations" USING btree ("student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_registrations_pending_identifier" ON "registrations" USING btree ("identifier") WHERE "registrations"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "idx_registrations_status" ON "registrations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_registrations_identifier" ON "registrations" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "idx_batches_teacher_id" ON "batches" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "idx_batches_class_subject" ON "batches" USING btree ("class_id","subject_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_enrollments_student_batch" ON "enrollments" USING btree ("student_id","batch_id");--> statement-breakpoint
CREATE INDEX "idx_enrollments_batch_id" ON "enrollments" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_timestamp" ON "audit_logs" USING btree ("timestamp" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_audit_logs_category" ON "audit_logs" USING btree ("category");