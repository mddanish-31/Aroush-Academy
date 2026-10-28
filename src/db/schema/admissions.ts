import { sql } from "drizzle-orm";
import { index, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { invitation_activation_status, registration_role, registration_status, user_role } from "./enums";
import { users } from "./identity";
import { students } from "./people";

export const registrations = pgTable(
  "registrations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    identifier: varchar("identifier", { length: 255 }).notNull(),
    password_hash: varchar("password_hash", { length: 255 }).notNull(),
    role: registration_role("role").notNull(),
    class_grade: varchar("class_grade", { length: 50 }),
    ward_name: varchar("ward_name", { length: 255 }),
    linked_student_id: uuid("linked_student_id").references(() => students.id, { onDelete: "set null" }),
    approved_user_id: uuid("approved_user_id").references(() => users.id, { onDelete: "set null" }),
    status: registration_status("status").notNull().default("pending"),
    rejection_reason: text("rejection_reason"),
    reviewed_by_id: uuid("reviewed_by_id").references(() => users.id, { onDelete: "set null" }),
    reviewed_at: timestamp("reviewed_at", { withTimezone: true }),
    submitted_at: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_registrations_pending_identifier")
      .on(table.identifier)
      .where(sql`${table.status} = 'pending'`),
    index("idx_registrations_status").on(table.status),
    index("idx_registrations_identifier").on(table.identifier),
  ]
);

export const account_invitations = pgTable(
  "account_invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    student_id: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    target_role: user_role("target_role").notNull(),
    recipient_identifier: varchar("recipient_identifier", { length: 255 }).notNull(),
    invitation_code: varchar("invitation_code", { length: 100 }).notNull(),
    activation_status: invitation_activation_status("activation_status").notNull().default("invited"),
    activated_at: timestamp("activated_at", { withTimezone: true }),
    activated_user_id: uuid("activated_user_id").references(() => users.id, { onDelete: "set null" }),
    expires_at: timestamp("expires_at", { withTimezone: true }).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_account_invitations_code").on(table.invitation_code),
    index("idx_account_invitations_student").on(table.student_id),
  ]
);

export const accountInvitations = account_invitations;
