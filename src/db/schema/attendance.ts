import { sql } from "drizzle-orm";
import { check, date, index, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import type { AttendanceStatus } from "../../types";
import { batches } from "./cohorts";
import { users } from "./identity";
import { students } from "./people";

export const attendance = pgTable(
  "attendance",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    student_id: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
    batch_id: uuid("batch_id").notNull().references(() => batches.id, { onDelete: "restrict" }),
    date: date("date").notNull(),
    status: varchar("status", { length: 50 }).$type<AttendanceStatus>().notNull(),
    recorded_by_id: uuid("recorded_by_id").notNull().references(() => users.id, { onDelete: "restrict" }),
    remarks: text("remarks"),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("attendance_status_check", sql`${table.status} in ('present', 'absent', 'late', 'excused')`),
    uniqueIndex("idx_attendance_student_batch_date").on(table.student_id, table.batch_id, table.date),
    index("idx_attendance_batch_date").on(table.batch_id, table.date),
    index("idx_attendance_student_date_id").on(table.student_id, table.date.desc(), table.id.desc()),
  ],
);
