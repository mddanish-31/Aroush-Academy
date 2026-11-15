CREATE TABLE "academic_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid,
	"kind" varchar(20) NOT NULL,
	"title" varchar(160) NOT NULL,
	"body" text NOT NULL,
	"audience" varchar(20) DEFAULT 'all' NOT NULL,
	"due_on" date,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"author_id" uuid NOT NULL,
	CONSTRAINT "academic_posts_kind" CHECK ("academic_posts"."kind" in ('notice', 'material', 'homework')),
	CONSTRAINT "academic_posts_audience" CHECK ("academic_posts"."audience" in ('all', 'teachers', 'students', 'parents'))
);
--> statement-breakpoint
CREATE TABLE "academic_remarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"batch_id" uuid NOT NULL,
	"body" text NOT NULL,
	"author_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_marks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assessment_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"marks" integer NOT NULL,
	"entered_by_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assessment_mark_nonnegative" CHECK ("assessment_marks"."marks" >= 0)
);
--> statement-breakpoint
CREATE TABLE "assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"title" varchar(160) NOT NULL,
	"max_marks" integer NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"created_by_id" uuid NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assessment_marks_positive" CHECK ("assessments"."max_marks" > 0 and "assessments"."max_marks" <= 1000),
	CONSTRAINT "assessment_status" CHECK ("assessments"."status" in ('draft', 'published'))
);
--> statement-breakpoint
CREATE TABLE "attendance_corrections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attendance_id" uuid NOT NULL,
	"previous_status" varchar(50) NOT NULL,
	"next_status" varchar(50) NOT NULL,
	"reason" text NOT NULL,
	"corrected_by_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timetable_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"teacher_id" uuid NOT NULL,
	"title" varchar(160) NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"status" varchar(20) DEFAULT 'scheduled' NOT NULL,
	"created_by_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "timetable_event_interval" CHECK ("timetable_events"."ends_at" > "timetable_events"."starts_at"),
	CONSTRAINT "timetable_event_status" CHECK ("timetable_events"."status" in ('scheduled', 'cancelled'))
);
--> statement-breakpoint
ALTER TABLE "academic_posts" ADD CONSTRAINT "academic_posts_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_posts" ADD CONSTRAINT "academic_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_remarks" ADD CONSTRAINT "academic_remarks_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_remarks" ADD CONSTRAINT "academic_remarks_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_remarks" ADD CONSTRAINT "academic_remarks_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_marks" ADD CONSTRAINT "assessment_marks_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_marks" ADD CONSTRAINT "assessment_marks_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_marks" ADD CONSTRAINT "assessment_marks_entered_by_id_users_id_fk" FOREIGN KEY ("entered_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_corrections" ADD CONSTRAINT "attendance_corrections_attendance_id_attendance_id_fk" FOREIGN KEY ("attendance_id") REFERENCES "public"."attendance"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_corrections" ADD CONSTRAINT "attendance_corrections_corrected_by_id_users_id_fk" FOREIGN KEY ("corrected_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_events" ADD CONSTRAINT "timetable_events_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_events" ADD CONSTRAINT "timetable_events_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_events" ADD CONSTRAINT "timetable_events_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_academic_posts_batch_time" ON "academic_posts" USING btree ("batch_id","published_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_academic_remarks_student" ON "academic_remarks" USING btree ("student_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "idx_assessment_mark_student" ON "assessment_marks" USING btree ("assessment_id","student_id");--> statement-breakpoint
CREATE INDEX "idx_assessments_batch" ON "assessments" USING btree ("batch_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_attendance_corrections_record" ON "attendance_corrections" USING btree ("attendance_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_timetable_batch_start" ON "timetable_events" USING btree ("batch_id","starts_at");--> statement-breakpoint
CREATE INDEX "idx_timetable_teacher_start" ON "timetable_events" USING btree ("teacher_id","starts_at");