CREATE TABLE "teacher_subjects" (
	"teacher_id" uuid NOT NULL,
	"subject_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "batches" ADD COLUMN "board_id" uuid;--> statement-breakpoint
ALTER TABLE "teacher_subjects" ADD CONSTRAINT "teacher_subjects_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_subjects" ADD CONSTRAINT "teacher_subjects_subject_id_academic_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."academic_subjects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_teacher_subjects_pair" ON "teacher_subjects" USING btree ("teacher_id","subject_id");--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_board_id_academic_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."academic_boards"("id") ON DELETE restrict ON UPDATE no action;