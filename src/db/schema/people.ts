import { sql } from "drizzle-orm";
import { boolean, date, index, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { student_status, teacher_status } from "./enums";
import { users } from "./identity";
import { academic_boards, academic_classes } from "./taxonomy";

export const teachers = pgTable(
  "teachers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    bio: text("bio"),
    status: teacher_status("status").notNull().default("active"),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_teachers_user_id").on(table.user_id),
    index("idx_teachers_status").on(table.status),
  ]
);

export const students = pgTable(
  "students",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    admission_number: varchar("admission_number", { length: 100 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    class_id: uuid("class_id")
      .notNull()
      .references(() => academic_classes.id, { onDelete: "restrict" }),
    board_id: uuid("board_id")
      .notNull()
      .references(() => academic_boards.id, { onDelete: "restrict" }),
    school_name: varchar("school_name", { length: 255 }),
    guardian_name: varchar("guardian_name", { length: 255 }).notNull(),
    guardian_phone: varchar("guardian_phone", { length: 20 }).notNull(),
    guardian_email: varchar("guardian_email", { length: 255 }),
    address: text("address"),
    joining_date: date("joining_date").notNull().default(sql`CURRENT_DATE`),
    status: student_status("status").notNull().default("active"),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_students_admission_number").on(table.admission_number),
    uniqueIndex("idx_students_user_id").on(table.user_id),
    index("idx_students_class_board").on(table.class_id, table.board_id),
  ]
);

export const parents = pgTable(
  "parents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    name: varchar("name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 20 }).notNull(),
    email: varchar("email", { length: 255 }),
    address: text("address"),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_parents_user_id").on(table.user_id),
    index("idx_parents_phone").on(table.phone),
  ]
);

export const parent_student_links = pgTable(
  "parent_student_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    parent_id: uuid("parent_id")
      .notNull()
      .references(() => parents.id, { onDelete: "cascade" }),
    student_id: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    relationship: varchar("relationship", { length: 50 }).notNull().default("parent"),
    is_verified: boolean("is_verified").notNull().default(true),
    linked_at: timestamp("linked_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_parent_student_link").on(table.parent_id, table.student_id),
    index("idx_ps_links_student").on(table.student_id),
  ]
);

export const parentStudentLinks = parent_student_links;
