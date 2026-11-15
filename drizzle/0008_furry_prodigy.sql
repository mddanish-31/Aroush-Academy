CREATE TABLE "fee_adjustments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"obligation_id" uuid NOT NULL,
	"kind" varchar(20) NOT NULL,
	"amount_paise" integer NOT NULL,
	"reason" text NOT NULL,
	"request_key" uuid NOT NULL,
	"authorized_by_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fee_adjustments_kind" CHECK ("fee_adjustments"."kind" IN ('discount','waiver')),
	CONSTRAINT "fee_adjustments_positive" CHECK ("fee_adjustments"."amount_paise" > 0)
);
--> statement-breakpoint
CREATE TABLE "fee_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"obligation_id" uuid NOT NULL,
	"amount_paise" integer NOT NULL,
	CONSTRAINT "fee_allocations_positive" CHECK ("fee_allocations"."amount_paise" > 0)
);
--> statement-breakpoint
CREATE TABLE "fee_obligations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"period_key" varchar(80) NOT NULL,
	"amount_paise" integer NOT NULL,
	"due_on" date NOT NULL,
	"request_key" uuid NOT NULL,
	"created_by_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fee_obligations_positive" CHECK ("fee_obligations"."amount_paise" > 0)
);
--> statement-breakpoint
CREATE TABLE "fee_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"obligation_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"amount_paise" integer NOT NULL,
	"method" varchar(10) NOT NULL,
	"collected_on" date NOT NULL,
	"reference_id" varchar(100),
	"submission_id" uuid,
	"request_key" uuid NOT NULL,
	"collected_by_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fee_payments_positive" CHECK ("fee_payments"."amount_paise" > 0),
	CONSTRAINT "fee_payments_method" CHECK ("fee_payments"."method" IN ('cash','upi'))
);
--> statement-breakpoint
CREATE TABLE "fee_receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"receipt_number" varchar(100) NOT NULL,
	"student_id" uuid NOT NULL,
	"student_name" varchar(255) NOT NULL,
	"amount_paise" integer NOT NULL,
	"method" varchar(10) NOT NULL,
	"collected_on" date NOT NULL,
	"issued_by_id" uuid NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fee_receipts_positive" CHECK ("fee_receipts"."amount_paise" > 0)
);
--> statement-breakpoint
CREATE TABLE "payment_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"obligation_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"amount_paise" integer NOT NULL,
	"reference_id" varchar(100) NOT NULL,
	"transfer_on" date NOT NULL,
	"request_key" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"submitted_by_id" uuid NOT NULL,
	"reviewed_by_id" uuid,
	"review_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone,
	CONSTRAINT "payment_submissions_positive" CHECK ("payment_submissions"."amount_paise" > 0),
	CONSTRAINT "payment_submissions_state" CHECK ("payment_submissions"."status" IN ('pending','verified','rejected'))
);
--> statement-breakpoint
ALTER TABLE "fee_adjustments" ADD CONSTRAINT "fee_adjustments_obligation_id_fee_obligations_id_fk" FOREIGN KEY ("obligation_id") REFERENCES "public"."fee_obligations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_adjustments" ADD CONSTRAINT "fee_adjustments_authorized_by_id_users_id_fk" FOREIGN KEY ("authorized_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_allocations" ADD CONSTRAINT "fee_allocations_payment_id_fee_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."fee_payments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_allocations" ADD CONSTRAINT "fee_allocations_obligation_id_fee_obligations_id_fk" FOREIGN KEY ("obligation_id") REFERENCES "public"."fee_obligations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_obligations" ADD CONSTRAINT "fee_obligations_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_obligations" ADD CONSTRAINT "fee_obligations_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_obligations" ADD CONSTRAINT "fee_obligations_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_obligation_id_fee_obligations_id_fk" FOREIGN KEY ("obligation_id") REFERENCES "public"."fee_obligations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_submission_id_payment_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."payment_submissions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_collected_by_id_users_id_fk" FOREIGN KEY ("collected_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_receipts" ADD CONSTRAINT "fee_receipts_payment_id_fee_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."fee_payments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_receipts" ADD CONSTRAINT "fee_receipts_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_receipts" ADD CONSTRAINT "fee_receipts_issued_by_id_users_id_fk" FOREIGN KEY ("issued_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_submissions" ADD CONSTRAINT "payment_submissions_obligation_id_fee_obligations_id_fk" FOREIGN KEY ("obligation_id") REFERENCES "public"."fee_obligations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_submissions" ADD CONSTRAINT "payment_submissions_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_submissions" ADD CONSTRAINT "payment_submissions_submitted_by_id_users_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_submissions" ADD CONSTRAINT "payment_submissions_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_fee_adjustments_obligation" ON "fee_adjustments" USING btree ("obligation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_fee_adjustments_request" ON "fee_adjustments" USING btree ("request_key");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_fee_allocations_payment" ON "fee_allocations" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "idx_fee_allocations_obligation" ON "fee_allocations" USING btree ("obligation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_fee_obligations_period" ON "fee_obligations" USING btree ("enrollment_id","period_key");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_fee_obligations_request" ON "fee_obligations" USING btree ("request_key");--> statement-breakpoint
CREATE INDEX "idx_fee_obligations_student" ON "fee_obligations" USING btree ("student_id","created_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "idx_fee_payments_request" ON "fee_payments" USING btree ("request_key");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_fee_payments_submission" ON "fee_payments" USING btree ("submission_id") WHERE "fee_payments"."submission_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_fee_payments_obligation" ON "fee_payments" USING btree ("obligation_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_fee_payments_reference" ON "fee_payments" USING btree ("reference_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_fee_payments_upi_reference" ON "fee_payments" USING btree ("reference_id") WHERE "method" = 'upi';--> statement-breakpoint
CREATE UNIQUE INDEX "idx_fee_receipts_payment" ON "fee_receipts" USING btree ("payment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_fee_receipts_number" ON "fee_receipts" USING btree ("receipt_number");--> statement-breakpoint
CREATE INDEX "idx_fee_receipts_student" ON "fee_receipts" USING btree ("student_id","issued_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "idx_payment_submissions_request" ON "payment_submissions" USING btree ("request_key");--> statement-breakpoint
CREATE INDEX "idx_payment_submissions_status" ON "payment_submissions" USING btree ("status","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_payment_submissions_student" ON "payment_submissions" USING btree ("student_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_payment_submissions_reference" ON "payment_submissions" USING btree ("reference_id");
--> statement-breakpoint
CREATE FUNCTION prevent_financial_posting_mutation() RETURNS trigger AS $$ BEGIN RAISE EXCEPTION 'financial postings are immutable'; END; $$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER fee_obligations_immutable BEFORE UPDATE OR DELETE ON fee_obligations FOR EACH ROW EXECUTE FUNCTION prevent_financial_posting_mutation();
--> statement-breakpoint
CREATE TRIGGER fee_adjustments_immutable BEFORE UPDATE OR DELETE ON fee_adjustments FOR EACH ROW EXECUTE FUNCTION prevent_financial_posting_mutation();
--> statement-breakpoint
CREATE TRIGGER fee_payments_immutable BEFORE UPDATE OR DELETE ON fee_payments FOR EACH ROW EXECUTE FUNCTION prevent_financial_posting_mutation();
--> statement-breakpoint
CREATE TRIGGER fee_allocations_immutable BEFORE UPDATE OR DELETE ON fee_allocations FOR EACH ROW EXECUTE FUNCTION prevent_financial_posting_mutation();
--> statement-breakpoint
CREATE TRIGGER fee_receipts_immutable BEFORE UPDATE OR DELETE ON fee_receipts FOR EACH ROW EXECUTE FUNCTION prevent_financial_posting_mutation();
--> statement-breakpoint
CREATE TRIGGER fee_obligations_no_truncate BEFORE TRUNCATE ON fee_obligations FOR EACH STATEMENT EXECUTE FUNCTION prevent_financial_posting_mutation();
--> statement-breakpoint
CREATE TRIGGER fee_adjustments_no_truncate BEFORE TRUNCATE ON fee_adjustments FOR EACH STATEMENT EXECUTE FUNCTION prevent_financial_posting_mutation();
--> statement-breakpoint
CREATE TRIGGER fee_payments_no_truncate BEFORE TRUNCATE ON fee_payments FOR EACH STATEMENT EXECUTE FUNCTION prevent_financial_posting_mutation();
--> statement-breakpoint
CREATE TRIGGER fee_allocations_no_truncate BEFORE TRUNCATE ON fee_allocations FOR EACH STATEMENT EXECUTE FUNCTION prevent_financial_posting_mutation();
--> statement-breakpoint
CREATE TRIGGER fee_receipts_no_truncate BEFORE TRUNCATE ON fee_receipts FOR EACH STATEMENT EXECUTE FUNCTION prevent_financial_posting_mutation();
