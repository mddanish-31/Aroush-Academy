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

export const student_status = pgEnum("student_status", [
  "active",
  "inactive",
  "on-leave",
]);

export const teacher_status = pgEnum("teacher_status", [
  "active",
  "inactive",
]);

export const batch_status = pgEnum("batch_status", [
  "active",
  "upcoming",
  "completed",
  "archived",
]);

export const enrollment_status = pgEnum("enrollment_status", [
  "active",
  "paused",
  "completed",
]);

export const registration_role = pgEnum("registration_role", [
  "student",
  "parent",
]);

export const registration_status = pgEnum("registration_status", [
  "pending",
  "approved",
  "rejected",
]);

export const invitation_activation_status = pgEnum("invitation_activation_status", [
  "invited",
  "activation_pending",
  "activated",
]);

export const userRole = user_role;
export const userStatus = user_status;
export const studentStatus = student_status;
export const teacherStatus = teacher_status;
export const batchStatus = batch_status;
export const enrollmentStatus = enrollment_status;
export const registrationRole = registration_role;
export const registrationStatus = registration_status;
export const invitationActivationStatus = invitation_activation_status;
