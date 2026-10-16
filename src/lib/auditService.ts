"use client";

/**
 * AROUSH ACADEMY — Centralized, Typed Audit Trail Service
 *
 * PURPOSE & ARCHITECTURE:
 * Provides a standardized, typed audit logging service recording all state-changing
 * operations across Academy Admin, Teacher, Student, and Parent portals.
 *
 * GUARANTEES:
 * 1. Consistent schema (ISO timestamp, actor, role, action, type, entity, diff, outcome).
 * 2. Strict sanitization (redacts credentials, passwords, tokens, private phone numbers).
 * 3. Idempotent de-duplication (guards against React strict-mode re-renders or double-clicks).
 * 4. Bounded demo persistence (persists up to 500 recent entries in demo session storage).
 * 5. Reactive sync via window storage event dispatch.
 * 6. Explicit demo boundary: Client-side storage is non-authoritative and not production-secure.
 */

import type {
  AuditLogEntry,
  AuditActionType,
  AuditCategory,
  AuditOutcome,
  AuditFieldChange,
  UserRole,
} from "@/types";
import {
  DEMO_STORAGE_KEYS,
  getDemoStorage,
  setDemoStorage,
} from "@/lib/demoStorage";
import { SAMPLE_AUDIT_LOGS } from "@/data/dashboardModulesData";

export interface AuditEventInput {
  action: string;
  actionType?: AuditActionType;
  target: string;
  details: string;
  type?: AuditCategory;
  performedBy?: string;
  actorRole?: UserRole | "system";
  entityType?: string;
  entityId?: string;
  outcome?: AuditOutcome;
  changedFields?: string[];
  diff?: AuditFieldChange[];
  sourcePortal?: UserRole;
  correlationId?: string;
  timestamp?: string;
}

// In-memory de-duplication cache
interface DedupeRecord {
  signature: string;
  timestamp: number;
  entry: AuditLogEntry;
}

let lastDedupe: DedupeRecord | null = null;
const DEDUPE_WINDOW_MS = 350;
const MAX_STORED_AUDIT_ENTRIES = 500;

/**
 * Strips sensitive tokens, credentials, and full phone numbers from audit text.
 */
export function sanitizeAuditText(input: string): string {
  if (!input) return "";
  let text = input;

  // Redact potential passwords or tokens
  text = text.replace(/(?:password|token|secret|key)\s*[:=]\s*["']?[^"'\s,;]+["']?/gi, "$1=[REDACTED]");

  // Mask guardian phone numbers (e.g. 10-digit Indian mobile numbers)
  text = text.replace(/(\+?91[\s-]?)?[6-9]\d{9}/g, (match) => {
    // Keep first 2 and last 2 digits, mask the rest
    const digits = match.replace(/\D/g, "");
    if (digits.length >= 10) {
      return `+91 ${digits.slice(0, 2)}••••••${digits.slice(-2)}`;
    }
    return "[PHONE REDACTED]";
  });

  return text;
}

/**
 * Sanitizes diff before/after values to prevent storing confidential data.
 */
export function sanitizeDiff(diff?: AuditFieldChange[]): AuditFieldChange[] | undefined {
  if (!diff || !Array.isArray(diff)) return undefined;

  const forbiddenFields = [
    "password",
    "passwordhash",
    "token",
    "secret",
    "guardianphone",
    "emergencycontact",
    "phonenumber",
  ];

  return diff.map((change) => {
    const isSensitive = forbiddenFields.some((f) =>
      change.fieldName.toLowerCase().includes(f)
    );

    if (isSensitive) {
      return {
        fieldName: change.fieldName,
        before: change.before ? "[REDACTED]" : undefined,
        after: change.after ? "[REDACTED]" : undefined,
      };
    }

    return {
      fieldName: change.fieldName,
      before: typeof change.before === "string" ? sanitizeAuditText(change.before) : change.before,
      after: typeof change.after === "string" ? sanitizeAuditText(change.after) : change.after,
    };
  });
}

/**
 * Automatically infers the Audit Category if not explicitly provided.
 */
export function inferCategory(entityType?: string, action?: string): AuditCategory {
  const combined = `${entityType || ""} ${action || ""}`.toLowerCase();
  if (
    combined.includes("payment") ||
    combined.includes("fee") ||
    combined.includes("obligation") ||
    combined.includes("financial")
  ) {
    return "financial";
  }
  if (
    combined.includes("attendance") ||
    combined.includes("student") ||
    combined.includes("enrollment") ||
    combined.includes("registration") ||
    combined.includes("mock-exam") ||
    combined.includes("assessment") ||
    combined.includes("marks") ||
    combined.includes("certificate") ||
    combined.includes("exam")
  ) {
    return "enrollment";
  }
  if (
    combined.includes("id-card") ||
    combined.includes("security") ||
    combined.includes("auth") ||
    combined.includes("invitation") ||
    combined.includes("login") ||
    combined.includes("logout")
  ) {
    return "security";
  }
  return "system";
}

/**
 * Records a single typed audit event to demo storage and dispatches change events.
 */
export function recordAuditEvent(input: AuditEventInput): AuditLogEntry {
  const now = new Date();
  const timestamp = input.timestamp || now.toISOString();

  // Resolve actor name
  const performedBy =
    input.performedBy?.trim() ||
    (input.actorRole === "academy-admin"
      ? "Academy Administrator"
      : input.actorRole === "teacher"
      ? "Faculty Teacher"
      : input.actorRole === "student"
      ? "Student"
      : input.actorRole === "parent"
      ? "Parent"
      : "System");

  const actionType = input.actionType || "UPDATE";
  const category = input.type || inferCategory(input.entityType, input.action);
  const outcome = input.outcome || "SUCCESS";

  const sanitizedDetails = sanitizeAuditText(input.details);
  const sanitizedTarget = sanitizeAuditText(input.target);
  const sanitizedDiff = sanitizeDiff(input.diff);

  // De-duplication check: identical signature within DEDUPE_WINDOW_MS
  const signature = `${input.actorRole || ""}|${input.action}|${input.entityId || ""}|${sanitizedDetails}`;
  const nowMs = now.getTime();
  if (
    lastDedupe &&
    lastDedupe.signature === signature &&
    nowMs - lastDedupe.timestamp < DEDUPE_WINDOW_MS
  ) {
    return lastDedupe.entry;
  }

  const newEntry: AuditLogEntry = {
    id: `audit-${nowMs}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp,
    performedBy,
    actorRole: input.actorRole,
    action: input.action,
    actionType,
    target: sanitizedTarget,
    entityType: input.entityType,
    entityId: input.entityId,
    details: sanitizedDetails,
    type: category,
    outcome,
    changedFields: input.changedFields,
    diff: sanitizedDiff,
    sourcePortal: input.sourcePortal || input.actorRole,
    correlationId: input.correlationId,
  };

  // Cache for de-duplication
  lastDedupe = {
    signature,
    timestamp: nowMs,
    entry: newEntry,
  };

  // Persist to Demo Storage
  try {
    const existing = getDemoStorage<AuditLogEntry[]>(
      DEMO_STORAGE_KEYS.AUDIT_LOGS,
      SAMPLE_AUDIT_LOGS
    );
    const updated = [newEntry, ...(Array.isArray(existing) ? existing : [])].slice(
      0,
      MAX_STORED_AUDIT_ENTRIES
    );
    setDemoStorage(DEMO_STORAGE_KEYS.AUDIT_LOGS, updated);

    // Dispatch custom event for real-time dashboard reactivity
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("aroush-demo-storage-change", {
          detail: { key: DEMO_STORAGE_KEYS.AUDIT_LOGS, value: updated },
        })
      );
    }
  } catch (err) {
    console.warn("[AuditService] Failed to persist audit entry to demo storage:", err);
  }

  return newEntry;
}

/**
 * Convenience helper: Record a CREATE operation
 */
export function recordCreate(params: Omit<AuditEventInput, "actionType">): AuditLogEntry {
  return recordAuditEvent({ ...params, actionType: "CREATE" });
}

/**
 * Convenience helper: Record an UPDATE operation
 */
export function recordUpdate(params: Omit<AuditEventInput, "actionType">): AuditLogEntry {
  return recordAuditEvent({ ...params, actionType: "UPDATE" });
}

/**
 * Convenience helper: Record a DELETE operation
 */
export function recordDelete(params: Omit<AuditEventInput, "actionType">): AuditLogEntry {
  return recordAuditEvent({ ...params, actionType: "DELETE" });
}

/**
 * Convenience helper: Record an APPROVE operation
 */
export function recordApprove(params: Omit<AuditEventInput, "actionType">): AuditLogEntry {
  return recordAuditEvent({ ...params, actionType: "APPROVE" });
}

/**
 * Convenience helper: Record a REJECT operation
 */
export function recordReject(params: Omit<AuditEventInput, "actionType">): AuditLogEntry {
  return recordAuditEvent({ ...params, actionType: "REJECT" });
}

/**
 * Convenience helper: Record a CANCEL operation
 */
export function recordCancel(params: Omit<AuditEventInput, "actionType">): AuditLogEntry {
  return recordAuditEvent({ ...params, actionType: "CANCEL" });
}

/**
 * Retrieves the current audit log history from demo storage.
 */
export function getStoredAuditLogs(): AuditLogEntry[] {
  return getDemoStorage<AuditLogEntry[]>(
    DEMO_STORAGE_KEYS.AUDIT_LOGS,
    SAMPLE_AUDIT_LOGS
  );
}

/**
 * Resets audit logs back to default sample records.
 */
export function resetAuditLogsToSample(): boolean {
  setDemoStorage(DEMO_STORAGE_KEYS.AUDIT_LOGS, SAMPLE_AUDIT_LOGS);
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("aroush-demo-storage-change", {
        detail: { key: DEMO_STORAGE_KEYS.AUDIT_LOGS, value: SAMPLE_AUDIT_LOGS },
      })
    );
  }
  return true;
}
