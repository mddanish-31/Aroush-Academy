ALTER TABLE "registrations" ALTER COLUMN "guardian_password_hash" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD COLUMN "purpose" varchar(20) DEFAULT 'recovery' NOT NULL;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "guardian_phone" varchar(20);