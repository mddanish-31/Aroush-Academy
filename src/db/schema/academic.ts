import { sql } from "drizzle-orm";
import { check, date, index, integer, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { attendance } from "./attendance";
import { batches } from "./cohorts";
import { users } from "./identity";
import { students, teachers } from "./people";

export const attendance_corrections = pgTable("attendance_corrections", {
  id: uuid("id").primaryKey().defaultRandom(),
  attendance_id: uuid("attendance_id").notNull().references(() => attendance.id, { onDelete: "restrict" }),
  previous_status: varchar("previous_status", { length: 50 }).notNull(),
  next_status: varchar("next_status", { length: 50 }).notNull(),
  reason: text("reason").notNull(),
  corrected_by_id: uuid("corrected_by_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("idx_attendance_corrections_record").on(table.attendance_id, table.created_at.desc())]);

export const timetable_events = pgTable("timetable_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  batch_id: uuid("batch_id").notNull().references(() => batches.id, { onDelete: "restrict" }),
  teacher_id: uuid("teacher_id").notNull().references(() => teachers.id, { onDelete: "restrict" }),
  title: varchar("title", { length: 160 }).notNull(),
  starts_at: timestamp("starts_at", { withTimezone: true }).notNull(),
  ends_at: timestamp("ends_at", { withTimezone: true }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("scheduled"),
  created_by_id: uuid("created_by_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  check("timetable_event_interval", sql`${table.ends_at} > ${table.starts_at}`),
  check("timetable_event_status", sql`${table.status} in ('scheduled', 'cancelled')`),
  index("idx_timetable_batch_start").on(table.batch_id, table.starts_at),
  index("idx_timetable_teacher_start").on(table.teacher_id, table.starts_at),
]);

export const academic_posts = pgTable("academic_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  batch_id: uuid("batch_id").references(() => batches.id, { onDelete: "restrict" }),
  kind: varchar("kind", { length: 20 }).notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  body: text("body").notNull(),
  audience: varchar("audience", { length: 20 }).notNull().default("all"),
  due_on: date("due_on"),
  published_at: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
  author_id: uuid("author_id").notNull().references(() => users.id, { onDelete: "restrict" }),
}, (table) => [
  check("academic_posts_kind", sql`${table.kind} in ('notice', 'material', 'homework')`),
  check("academic_posts_audience", sql`${table.audience} in ('all', 'teachers', 'students', 'parents')`),
  index("idx_academic_posts_batch_time").on(table.batch_id, table.published_at.desc()),
]);

export const assessments = pgTable("assessments", {
  id: uuid("id").primaryKey().defaultRandom(),
  batch_id: uuid("batch_id").notNull().references(() => batches.id, { onDelete: "restrict" }),
  title: varchar("title", { length: 160 }).notNull(),
  max_marks: integer("max_marks").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  created_by_id: uuid("created_by_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  published_at: timestamp("published_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  check("assessment_marks_positive", sql`${table.max_marks} > 0 and ${table.max_marks} <= 1000`),
  check("assessment_status", sql`${table.status} in ('draft', 'published')`),
  index("idx_assessments_batch").on(table.batch_id, table.created_at.desc()),
]);

export const assessment_marks = pgTable("assessment_marks", {
  id: uuid("id").primaryKey().defaultRandom(),
  assessment_id: uuid("assessment_id").notNull().references(() => assessments.id, { onDelete: "restrict" }),
  student_id: uuid("student_id").notNull().references(() => students.id, { onDelete: "restrict" }),
  marks: integer("marks").notNull(),
  entered_by_id: uuid("entered_by_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  check("assessment_mark_nonnegative", sql`${table.marks} >= 0`),
  uniqueIndex("idx_assessment_mark_student").on(table.assessment_id, table.student_id),
]);

export const academic_remarks = pgTable("academic_remarks", {
  id: uuid("id").primaryKey().defaultRandom(),
  student_id: uuid("student_id").notNull().references(() => students.id, { onDelete: "restrict" }),
  batch_id: uuid("batch_id").notNull().references(() => batches.id, { onDelete: "restrict" }),
  body: text("body").notNull(),
  author_id: uuid("author_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("idx_academic_remarks_student").on(table.student_id, table.created_at.desc())]);
