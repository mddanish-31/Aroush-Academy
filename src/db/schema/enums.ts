import { pgEnum } from "drizzle-orm/pg-core";

export const user_role = pgEnum("user_role", [
  "academy-admin",
  "teacher",
  "student",
  "parent",
]);

export const user_status = pgEnum("user_status", [
  "active",
  "inactive",
  "suspended",
]);

export const userRole = user_role;
export const userStatus = user_status;
