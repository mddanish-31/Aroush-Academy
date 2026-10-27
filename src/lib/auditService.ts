"use client";



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


interface DedupeRecord {
  signature: string;
  timestamp: number;
  entry: AuditLogEntry;
}

let lastDedupe: DedupeRecord | null = null;
const DEDUPE_WINDOW_MS = 350;
const MAX_STORED_AUDIT_ENTRIES = 500;


export function sanitizeAuditText(input: string): string {
  if (!input) return "";
  let text = input;

  
  text = text.replace(
    /\b(password|token|secret|key|apikey|bearer)\b\s*[:=]\s*(?:["'][^"']*["']|[^\s,;]+)/gi,
    "$1=[REDACTED]"
  );

  
  text = text.replace(/(?<!\d)(?:(?:\+?91|0)[\s-]?)?[6-9](?:[\s-]?\d){9}(?!\d)/g, (match) => {
    
    const digits = match.replace(/\D/g, "");
    const last10 = digits.slice(-10);
    if (last10.length === 10) {
      return `+91 ${last10.slice(0, 2)}••••••${last10.slice(-2)}`;
    }
    return "[PHONE REDACTED]";
  });

  return text;
}


export function sanitizeDiff(diff?: AuditFieldChange[]): AuditFieldChange[] | undefined {
  if (!diff || !Array.isArray(diff)) return undefined;

  const forbiddenFields = [
    "password",
    "token",
    "secret",
    "phone",
    "contactnumber",
    "emergencycontact",
    "pin",
    "credential",
    "apikey",
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


export function recordAuditEvent(input: AuditEventInput): AuditLogEntry {
  const now = new Date();
  const timestamp = input.timestamp || now.toISOString();

  
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

  
  lastDedupe = {
    signature,
    timestamp: nowMs,
    entry: newEntry,
  };

  
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


export function recordCreate(params: Omit<AuditEventInput, "actionType">): AuditLogEntry {
  return recordAuditEvent({ ...params, actionType: "CREATE" });
}


export function recordUpdate(params: Omit<AuditEventInput, "actionType">): AuditLogEntry {
  return recordAuditEvent({ ...params, actionType: "UPDATE" });
}


export function recordDelete(params: Omit<AuditEventInput, "actionType">): AuditLogEntry {
  return recordAuditEvent({ ...params, actionType: "DELETE" });
}


export function recordApprove(params: Omit<AuditEventInput, "actionType">): AuditLogEntry {
  return recordAuditEvent({ ...params, actionType: "APPROVE" });
}


export function recordReject(params: Omit<AuditEventInput, "actionType">): AuditLogEntry {
  return recordAuditEvent({ ...params, actionType: "REJECT" });
}


export function recordCancel(params: Omit<AuditEventInput, "actionType">): AuditLogEntry {
  return recordAuditEvent({ ...params, actionType: "CANCEL" });
}


export function getStoredAuditLogs(): AuditLogEntry[] {
  return getDemoStorage<AuditLogEntry[]>(
    DEMO_STORAGE_KEYS.AUDIT_LOGS,
    SAMPLE_AUDIT_LOGS
  );
}


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
