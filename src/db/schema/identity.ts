import { sql } from "drizzle-orm";
import { boolean, index, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { user_role, user_status } from "./enums";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    identifier: varchar("identifier", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 20 }),
    email_verified_at: timestamp("email_verified_at", { withTimezone: true }),
    phone_verified_at: timestamp("phone_verified_at", { withTimezone: true }),
    password_hash: varchar("password_hash", { length: 255 }).notNull(),
    role: user_role("role").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    avatar_url: text("avatar_url"),
    status: user_status("status").notNull().default("active"),
    last_login_at: timestamp("last_login_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_users_identifier").on(table.identifier),
    uniqueIndex("idx_users_email").on(table.email).where(sql`${table.email} IS NOT NULL`),
    uniqueIndex("idx_users_phone").on(table.phone).where(sql`${table.phone} IS NOT NULL`),
    index("idx_users_role").on(table.role),
  ]
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token_hash: varchar("token_hash", { length: 255 }).notNull(),
    ip_address: varchar("ip_address", { length: 45 }),
    user_agent: text("user_agent"),
    expires_at: timestamp("expires_at", { withTimezone: true }).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_sessions_token_hash").on(table.token_hash),
    index("idx_sessions_user_id").on(table.user_id),
    index("idx_sessions_expires_at").on(table.expires_at),
  ]
);

export const login_attempts = pgTable(
  "login_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    identifier: varchar("identifier", { length: 255 }).notNull(),
    ip_address: varchar("ip_address", { length: 45 }),
    success: boolean("success").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_login_attempts_created").on(table.identifier, table.created_at.desc()),
  ]
);

export const password_reset_tokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token_hash: varchar("token_hash", { length: 255 }).notNull(),
    expires_at: timestamp("expires_at", { withTimezone: true }).notNull(),
    used_at: timestamp("used_at", { withTimezone: true }),
    purpose: varchar("purpose", { length: 20 }).notNull().default("recovery"),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_reset_tokens_hash").on(table.token_hash),
  ]
);

export const loginAttempts = login_attempts;
export const passwordResetTokens = password_reset_tokens;
