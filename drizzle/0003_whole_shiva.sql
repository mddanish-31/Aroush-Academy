ALTER TABLE "registrations" ADD COLUMN "class_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "board_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "guardian_name" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "guardian_identifier" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "guardian_email" varchar(255);--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "guardian_password_hash" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_class_id_academic_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."academic_classes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_board_id_academic_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."academic_boards"("id") ON DELETE restrict ON UPDATE no action;