import { index, jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const audit_logs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    performed_by_id: uuid("performed_by_id"),
    performed_by_name: varchar("performed_by_name", { length: 255 }).notNull(),
    actor_role: varchar("actor_role", { length: 50 }).notNull(),
    action: varchar("action", { length: 100 }).notNull(),
    action_type: varchar("action_type", { length: 50 }).notNull(),
    category: varchar("category", { length: 50 }).notNull(),
    target: varchar("target", { length: 255 }).notNull(),
    entity_type: varchar("entity_type", { length: 100 }),
    entity_id: varchar("entity_id", { length: 100 }),
    details: text("details").notNull(),
    outcome: varchar("outcome", { length: 50 }).notNull().default("SUCCESS"),
    diff: jsonb("diff"),
    source_portal: varchar("source_portal", { length: 50 }).notNull().default("system"),
    ip_address: varchar("ip_address", { length: 45 }),
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_audit_logs_timestamp").on(table.timestamp.desc()),
    index("idx_audit_logs_category").on(table.category),
  ]
);

export const auditLogs = audit_logs;
