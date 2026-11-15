import { integer, jsonb, pgTable, timestamp, uuid, varchar, index } from "drizzle-orm/pg-core";
import { users } from "./identity";

export const cms_documents = pgTable("cms_documents", {
  key: varchar("key", { length: 40 }).primaryKey(),
  draft: jsonb("draft").notNull(),
  published: jsonb("published").notNull(),
  version: integer("version").notNull().default(1),
  published_version: integer("published_version").notNull().default(1),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const cms_revisions = pgTable("cms_revisions", {
  id: uuid("id").primaryKey().defaultRandom(),
  document_key: varchar("document_key", { length: 40 }).notNull().references(() => cms_documents.key),
  version: integer("version").notNull(),
  action: varchar("action", { length: 20 }).notNull(),
  snapshot: jsonb("snapshot").notNull(),
  performed_by_id: uuid("performed_by_id").notNull().references(() => users.id),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("idx_cms_revisions_document_created").on(table.document_key, table.created_at.desc())]);
