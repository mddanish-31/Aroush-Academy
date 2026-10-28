import { sql } from "drizzle-orm";
import { date, index, integer, pgTable, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { batch_status, enrollment_status } from "./enums";
import { students, teachers } from "./people";
import { academic_classes, academic_subjects } from "./taxonomy";

export const batches = pgTable(
  "batches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    subject_id: uuid("subject_id")
      .notNull()
      .references(() => academic_subjects.id, { onDelete: "restrict" }),
    class_id: uuid("class_id")
      .notNull()
      .references(() => academic_classes.id, { onDelete: "restrict" }),
    teacher_id: uuid("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "restrict" }),
    capacity: integer("capacity").notNull().default(30),
    schedule_summary: varchar("schedule_summary", { length: 255 }),
    monthly_fee_paise: integer("monthly_fee_paise").notNull().default(0),
    status: batch_status("status").notNull().default("active"),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_batches_teacher_id").on(table.teacher_id),
    index("idx_batches_class_subject").on(table.class_id, table.subject_id),
  ]
);

export const enrollments = pgTable(
  "enrollments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    student_id: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    batch_id: uuid("batch_id")
      .notNull()
      .references(() => batches.id, { onDelete: "restrict" }),
    monthly_fee_paise: integer("monthly_fee_paise").notNull(),
    enrollment_date: date("enrollment_date").notNull().default(sql`CURRENT_DATE`),
    status: enrollment_status("status").notNull().default("active"),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_enrollments_student_batch").on(table.student_id, table.batch_id),
    index("idx_enrollments_batch_id").on(table.batch_id),
  ]
);
