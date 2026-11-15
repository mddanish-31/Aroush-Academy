CREATE TABLE "attendance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"batch_id" uuid NOT NULL,
	"date" date NOT NULL,
	"status" varchar(50) NOT NULL,
	"recorded_by_id" uuid NOT NULL,
	"remarks" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attendance_status_check" CHECK ("attendance"."status" in ('present', 'absent', 'late', 'excused'))
);

ALTER TABLE "attendance" ADD CONSTRAINT "attendance_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_recorded_by_id_users_id_fk" FOREIGN KEY ("recorded_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
CREATE UNIQUE INDEX "idx_attendance_student_batch_date" ON "attendance" USING btree ("student_id","batch_id","date");
CREATE INDEX "idx_attendance_batch_date" ON "attendance" USING btree ("batch_id","date");
CREATE INDEX "idx_attendance_student_date_id" ON "attendance" USING btree ("student_id","date" DESC NULLS LAST,"id" DESC NULLS LAST);