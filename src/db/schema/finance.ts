import { sql } from "drizzle-orm";
import { check, date, index, integer, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { enrollments } from "./cohorts";
import { users } from "./identity";
import { students } from "./people";

export const fee_obligations = pgTable("fee_obligations", {
  id: uuid("id").primaryKey().defaultRandom(),
  enrollment_id: uuid("enrollment_id").notNull().references(() => enrollments.id, { onDelete: "restrict" }),
  student_id: uuid("student_id").notNull().references(() => students.id, { onDelete: "restrict" }),
  period_key: varchar("period_key", { length: 80 }).notNull(),
  amount_paise: integer("amount_paise").notNull(),
  due_on: date("due_on").notNull(),
  request_key: uuid("request_key").notNull(),
  created_by_id: uuid("created_by_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("idx_fee_obligations_period").on(table.enrollment_id, table.period_key),
  uniqueIndex("idx_fee_obligations_request").on(table.request_key),
  index("idx_fee_obligations_student").on(table.student_id, table.created_at.desc(), table.id.desc()),
  check("fee_obligations_positive", sql`${table.amount_paise} > 0`),
]);

export const fee_adjustments = pgTable("fee_adjustments", {
  id: uuid("id").primaryKey().defaultRandom(),
  obligation_id: uuid("obligation_id").notNull().references(() => fee_obligations.id, { onDelete: "restrict" }),
  kind: varchar("kind", { length: 20 }).notNull(),
  amount_paise: integer("amount_paise").notNull(),
  reason: text("reason").notNull(),
  request_key: uuid("request_key").notNull(),
  authorized_by_id: uuid("authorized_by_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_fee_adjustments_obligation").on(table.obligation_id),
  uniqueIndex("idx_fee_adjustments_request").on(table.request_key),
  check("fee_adjustments_kind", sql`${table.kind} IN ('discount','waiver')`),
  check("fee_adjustments_positive", sql`${table.amount_paise} > 0`),
]);

export const payment_submissions = pgTable("payment_submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  obligation_id: uuid("obligation_id").notNull().references(() => fee_obligations.id, { onDelete: "restrict" }),
  student_id: uuid("student_id").notNull().references(() => students.id, { onDelete: "restrict" }),
  amount_paise: integer("amount_paise").notNull(),
  reference_id: varchar("reference_id", { length: 100 }).notNull(),
  transfer_on: date("transfer_on").notNull(),
  request_key: uuid("request_key").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  submitted_by_id: uuid("submitted_by_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  reviewed_by_id: uuid("reviewed_by_id").references(() => users.id, { onDelete: "restrict" }),
  review_reason: text("review_reason"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  reviewed_at: timestamp("reviewed_at", { withTimezone: true }),
}, (table) => [
  uniqueIndex("idx_payment_submissions_request").on(table.request_key),
  index("idx_payment_submissions_status").on(table.status, table.created_at.desc()),
  index("idx_payment_submissions_student").on(table.student_id, table.created_at.desc()),
  index("idx_payment_submissions_reference").on(table.reference_id),
  check("payment_submissions_positive", sql`${table.amount_paise} > 0`),
  check("payment_submissions_state", sql`${table.status} IN ('pending','verified','rejected')`),
]);

export const fee_payments = pgTable("fee_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  obligation_id: uuid("obligation_id").notNull().references(() => fee_obligations.id, { onDelete: "restrict" }),
  student_id: uuid("student_id").notNull().references(() => students.id, { onDelete: "restrict" }),
  amount_paise: integer("amount_paise").notNull(),
  method: varchar("method", { length: 10 }).notNull(),
  collected_on: date("collected_on").notNull(),
  reference_id: varchar("reference_id", { length: 100 }),
  submission_id: uuid("submission_id").references(() => payment_submissions.id, { onDelete: "restrict" }),
  request_key: uuid("request_key").notNull(),
  collected_by_id: uuid("collected_by_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("idx_fee_payments_request").on(table.request_key),
  uniqueIndex("idx_fee_payments_submission").on(table.submission_id).where(sql`${table.submission_id} IS NOT NULL`),
  index("idx_fee_payments_obligation").on(table.obligation_id, table.created_at.desc()),
  index("idx_fee_payments_reference").on(table.reference_id),
  uniqueIndex("idx_fee_payments_upi_reference").on(table.reference_id).where(sql`${table.method} = 'upi'`),
  check("fee_payments_positive", sql`${table.amount_paise} > 0`),
  check("fee_payments_method", sql`${table.method} IN ('cash','upi')`),
]);

export const fee_allocations = pgTable("fee_allocations", {
  id: uuid("id").primaryKey().defaultRandom(),
  payment_id: uuid("payment_id").notNull().references(() => fee_payments.id, { onDelete: "restrict" }),
  obligation_id: uuid("obligation_id").notNull().references(() => fee_obligations.id, { onDelete: "restrict" }),
  amount_paise: integer("amount_paise").notNull(),
}, (table) => [
  uniqueIndex("idx_fee_allocations_payment").on(table.payment_id),
  index("idx_fee_allocations_obligation").on(table.obligation_id),
  check("fee_allocations_positive", sql`${table.amount_paise} > 0`),
]);

export const fee_receipts = pgTable("fee_receipts", {
  id: uuid("id").primaryKey().defaultRandom(),
  payment_id: uuid("payment_id").notNull().references(() => fee_payments.id, { onDelete: "restrict" }),
  receipt_number: varchar("receipt_number", { length: 100 }).notNull(),
  student_id: uuid("student_id").notNull().references(() => students.id, { onDelete: "restrict" }),
  student_name: varchar("student_name", { length: 255 }).notNull(),
  amount_paise: integer("amount_paise").notNull(),
  method: varchar("method", { length: 10 }).notNull(),
  collected_on: date("collected_on").notNull(),
  issued_by_id: uuid("issued_by_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  issued_at: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("idx_fee_receipts_payment").on(table.payment_id),
  uniqueIndex("idx_fee_receipts_number").on(table.receipt_number),
  index("idx_fee_receipts_student").on(table.student_id, table.issued_at.desc()),
  check("fee_receipts_positive", sql`${table.amount_paise} > 0`),
]);
