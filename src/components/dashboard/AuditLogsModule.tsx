"use client";

import React, { useState, useMemo } from "react";
import {
  AuditLogEntry,
  AuditActionType,
  AuditCategory,
  UserRole,
} from "@/types";
import { SAMPLE_AUDIT_LOGS } from "@/data/dashboardModulesData";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useDemoStorage, DEMO_STORAGE_KEYS } from "@/lib/demoStorage";
import { recordAuditEvent, resetAuditLogsToSample } from "@/lib/auditService";

export interface AuditLogsModuleProps {
  role?: UserRole;
}

export function AuditLogsModule({ role = "academy-admin" }: AuditLogsModuleProps) {
  const [logs] = useDemoStorage<AuditLogEntry[]>(
    DEMO_STORAGE_KEYS.AUDIT_LOGS,
    SAMPLE_AUDIT_LOGS
  );

  // Filters State
  const [filterType, setFilterType] = useState<string>("all");
  const [filterActionType, setFilterActionType] = useState<string>("all");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterDateRange, setFilterDateRange] = useState<string>("all");
  const [filterOutcome, setFilterOutcome] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 25;

  // Selected Log for Modal Details & Diff Inspection
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  // Reset Confirmation State
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return logs.filter((log) => {
      // Category Filter
      if (filterType !== "all" && log.type !== filterType) return false;

      // Action Type Filter
      if (filterActionType !== "all" && log.actionType !== filterActionType) return false;

      // Actor Role Filter
      if (filterRole !== "all") {
        if (filterRole === "system") {
          if (log.actorRole !== "system" && !log.performedBy.toLowerCase().includes("system")) return false;
        } else if (log.actorRole !== filterRole && !log.performedBy.toLowerCase().includes(filterRole)) {
          return false;
        }
      }

      // Outcome Filter
      if (filterOutcome !== "all") {
        const logOutcome = log.outcome || "SUCCESS";
        if (logOutcome !== filterOutcome) return false;
      }

      // Date Range Filter
      if (filterDateRange !== "all") {
        const logDate = new Date(log.timestamp);
        if (isNaN(logDate.getTime())) {
          // If unparseable date, allow it through
        } else if (filterDateRange === "today") {
          if (!log.timestamp.startsWith(todayStr)) return false;
        } else if (filterDateRange === "week") {
          if (logDate < weekAgo) return false;
        } else if (filterDateRange === "month") {
          if (logDate < monthStart) return false;
        }
      }

      // Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          log.action.toLowerCase().includes(q) ||
          log.target.toLowerCase().includes(q) ||
          log.performedBy.toLowerCase().includes(q) ||
          log.details.toLowerCase().includes(q) ||
          log.timestamp.toLowerCase().includes(q) ||
          (log.entityId && log.entityId.toLowerCase().includes(q)) ||
          (log.entityType && log.entityType.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [logs, filterType, filterActionType, filterRole, filterDateRange, filterOutcome, searchQuery]);

  // Total Pages & Paginated Slice
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredLogs.slice(start, start + PAGE_SIZE);
  }, [filteredLogs, currentPage]);

  // Overall Statistics Metrics
  const metrics = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const total = logs.length;
    const todayEvents = logs.filter((l) => l.timestamp.startsWith(todayStr)).length;
    const successes = logs.filter((l) => (l.outcome || "SUCCESS") === "SUCCESS").length;
    const failures = logs.filter((l) => l.outcome === "FAILURE").length;

    const financial = logs.filter((l) => l.type === "financial").length;
    const enrollment = logs.filter((l) => l.type === "enrollment").length;
    const system = logs.filter((l) => l.type === "system").length;
    const security = logs.filter((l) => l.type === "security").length;

    return { total, todayEvents, successes, failures, financial, enrollment, system, security };
  }, [logs]);

  // UNAUTHORIZED ROLE GUARD (rendered after all hooks)
  if (role !== "academy-admin") {
    return (
      <Card padding="lg" style={{ textAlign: "center", margin: "var(--space-6) 0" }}>
        <div style={{ fontSize: "40px", marginBottom: "var(--space-2)" }}>🔒</div>
        <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 700, margin: "0 0 var(--space-2)" }}>
          Access Restricted: Institutional Audit Logs
        </h3>
        <p
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--color-neutral-dark)",
            maxWidth: "540px",
            margin: "0 auto var(--space-4)",
            lineHeight: 1.5,
          }}
        >
          Access to institutional activity ledgers and security audit logs is strictly reserved for
          Academy Administrators. Your current session ({role}) is not authorized to inspect administrative audit records.
        </p>
      </Card>
    );
  }

  const isFiltered =
    filterType !== "all" ||
    filterActionType !== "all" ||
    filterRole !== "all" ||
    filterDateRange !== "all" ||
    filterOutcome !== "all" ||
    searchQuery.trim().length > 0;

  const handleResetFilters = () => {
    setFilterType("all");
    setFilterActionType("all");
    setFilterRole("all");
    setFilterDateRange("all");
    setFilterOutcome("all");
    setSearchQuery("");
    setCurrentPage(1);
  };

  // Export Filtered Audit Log to JSON file
  const handleExportLogs = () => {
    recordAuditEvent({
      action: "Export Audit Logs",
      actionType: "EXPORT",
      type: "system",
      target: "Audit Log Export",
      details: `Exported ${filteredLogs.length} audit trail records to JSON format.`,
      performedBy: "Academy Administrator",
      actorRole: "academy-admin",
    });

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `aroush-audit-log-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const renderCategoryBadge = (type: AuditCategory) => {
    switch (type) {
      case "financial":
        return <Badge variant="accent" size="sm">Financial</Badge>;
      case "enrollment":
        return <Badge variant="neutral" size="sm">Academic</Badge>;
      case "system":
        return <Badge variant="default" size="sm">System</Badge>;
      case "security":
        return <Badge variant="warning" size="sm">Security</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{type}</Badge>;
    }
  };

  const renderActionTypeBadge = (actionType?: AuditActionType) => {
    switch (actionType) {
      case "CREATE":
        return (
          <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "var(--radius-sm)", backgroundColor: "rgba(52, 199, 89, 0.12)", color: "var(--color-success, #34C759)", fontWeight: 700 }}>
            CREATE
          </span>
        );
      case "UPDATE":
        return (
          <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "var(--radius-sm)", backgroundColor: "rgba(0, 122, 255, 0.12)", color: "var(--color-accent, #007AFF)", fontWeight: 700 }}>
            UPDATE
          </span>
        );
      case "DELETE":
        return (
          <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "var(--radius-sm)", backgroundColor: "rgba(255, 59, 48, 0.12)", color: "var(--color-danger, #FF3B30)", fontWeight: 700 }}>
            DELETE
          </span>
        );
      case "APPROVE":
        return (
          <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "var(--radius-sm)", backgroundColor: "rgba(52, 199, 89, 0.15)", color: "var(--color-success, #34C759)", fontWeight: 700 }}>
            APPROVE
          </span>
        );
      case "REJECT":
      case "CANCEL":
        return (
          <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "var(--radius-sm)", backgroundColor: "rgba(255, 149, 0, 0.15)", color: "var(--color-warning, #FF9500)", fontWeight: 700 }}>
            {actionType}
          </span>
        );
      case "EXPORT":
        return (
          <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "var(--radius-sm)", backgroundColor: "rgba(110, 110, 115, 0.15)", color: "var(--color-neutral-dark)", fontWeight: 700 }}>
            EXPORT
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      {/* Demo Environment Notice Banner */}
      <div
        style={{
          padding: "10px 16px",
          backgroundColor: "rgba(0, 122, 255, 0.08)",
          border: "1px solid rgba(0, 122, 255, 0.2)",
          borderRadius: "var(--radius-md)",
          fontSize: "var(--text-xs)",
          color: "var(--color-primary)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "var(--space-2)",
        }}
      >
        <span>
          ℹ️ <strong>Client-Side Demo Storage Notice:</strong> Audit entries are persisted in browser demo session storage. While fully reactive across dashboard modules and browser reloads, this frontend demo is not an immutable, server-authoritative audit database.
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsResetConfirmOpen(true)}
          style={{ fontSize: "11px", height: "24px", padding: "0 8px" }}
        >
          Reset Logs
        </Button>
      </div>

      {/* Main Header & KPI Metric Summary Cards */}
      <Card padding="md">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "var(--space-4)",
            marginBottom: "var(--space-4)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "4px" }}>
              <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 700, margin: 0 }}>
                Institutional Activity &amp; Audit Log
              </h2>
              <Badge variant="accent" size="sm">
                System Activity
              </Badge>
            </div>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", margin: 0 }}>
              Immutable record of academic, financial, attendance, ID card, timetable, and administrative actions.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <Button variant="secondary" size="sm" onClick={handleExportLogs}>
              📥 Export Audit Log
            </Button>
          </div>
        </div>

        {/* Top Metric Cards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: "var(--space-3)",
          }}
        >
          <div
            style={{
              backgroundColor: "var(--color-surface-muted)",
              padding: "10px 14px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div style={{ fontSize: "11px", color: "var(--color-neutral-dark)", marginBottom: "2px" }}>
              Total Events
            </div>
            <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--color-primary)" }}>
              {metrics.total}
            </div>
          </div>

          <div
            style={{
              backgroundColor: "var(--color-surface-muted)",
              padding: "10px 14px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div style={{ fontSize: "11px", color: "var(--color-neutral-dark)", marginBottom: "2px" }}>
              Events Today
            </div>
            <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--color-accent)" }}>
              {metrics.todayEvents}
            </div>
          </div>

          <div
            style={{
              backgroundColor: "var(--color-surface-muted)",
              padding: "10px 14px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div style={{ fontSize: "11px", color: "var(--color-neutral-dark)", marginBottom: "2px" }}>
              Successful Changes
            </div>
            <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--color-success, #34C759)" }}>
              {metrics.successes}
            </div>
          </div>

          <div
            style={{
              backgroundColor: "var(--color-surface-muted)",
              padding: "10px 14px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div style={{ fontSize: "11px", color: "var(--color-neutral-dark)", marginBottom: "2px" }}>
              Failed Actions
            </div>
            <div
              style={{
                fontSize: "var(--text-xl)",
                fontWeight: 700,
                color: metrics.failures > 0 ? "var(--color-danger, #FF3B30)" : "var(--color-neutral-dark)",
              }}
            >
              {metrics.failures}
            </div>
          </div>

          <div
            style={{
              backgroundColor: "var(--color-surface-muted)",
              padding: "10px 14px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div style={{ fontSize: "11px", color: "var(--color-neutral-dark)", marginBottom: "2px" }}>
              Financial Events
            </div>
            <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--color-accent)" }}>
              {metrics.financial}
            </div>
          </div>
        </div>
      </Card>

      {/* Filter and Search Bar */}
      <Card padding="sm">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-3)",
          }}
        >
          {/* Row 1: Search Box */}
          <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <input
                type="text"
                placeholder="Search by action, actor, entity ID, target, or details..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  width: "100%",
                  padding: "8px 30px 8px 12px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-surface)",
                  fontSize: "var(--text-xs)",
                  color: "var(--color-primary)",
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  style={{
                    position: "absolute",
                    right: "8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "12px",
                    color: "var(--color-neutral-dark)",
                    padding: "2px",
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {isFiltered && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                style={{ padding: "4px 10px", height: "32px", fontSize: "11px" }}
              >
                Reset Filters
              </Button>
            )}
          </div>

          {/* Row 2: Granular Filter Dropdowns */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "var(--space-2)",
            }}
          >
            {/* Category */}
            <div>
              <label style={{ display: "block", fontSize: "10px", color: "var(--color-neutral-dark)", marginBottom: "2px" }}>
                Category:
              </label>
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  width: "100%",
                  fontSize: "var(--text-xs)",
                  padding: "6px 8px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-primary)",
                }}
              >
                <option value="all">All Categories</option>
                <option value="financial">Financial</option>
                <option value="enrollment">Academic &amp; Attendance</option>
                <option value="system">Administrative &amp; System</option>
                <option value="security">Security &amp; Credentials</option>
              </select>
            </div>

            {/* Action Type */}
            <div>
              <label style={{ display: "block", fontSize: "10px", color: "var(--color-neutral-dark)", marginBottom: "2px" }}>
                Action Type:
              </label>
              <select
                value={filterActionType}
                onChange={(e) => {
                  setFilterActionType(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  width: "100%",
                  fontSize: "var(--text-xs)",
                  padding: "6px 8px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-primary)",
                }}
              >
                <option value="all">All Action Types</option>
                <option value="CREATE">CREATE</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DELETE">DELETE</option>
                <option value="APPROVE">APPROVE</option>
                <option value="REJECT">REJECT</option>
                <option value="CANCEL">CANCEL</option>
                <option value="EXPORT">EXPORT</option>
              </select>
            </div>

            {/* Role */}
            <div>
              <label style={{ display: "block", fontSize: "10px", color: "var(--color-neutral-dark)", marginBottom: "2px" }}>
                Actor Role:
              </label>
              <select
                value={filterRole}
                onChange={(e) => {
                  setFilterRole(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  width: "100%",
                  fontSize: "var(--text-xs)",
                  padding: "6px 8px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-primary)",
                }}
              >
                <option value="all">All Roles</option>
                <option value="academy-admin">Academy Admin</option>
                <option value="teacher">Teacher</option>
                <option value="student">Student</option>
                <option value="parent">Parent</option>
                <option value="system">System</option>
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label style={{ display: "block", fontSize: "10px", color: "var(--color-neutral-dark)", marginBottom: "2px" }}>
                Date Range:
              </label>
              <select
                value={filterDateRange}
                onChange={(e) => {
                  setFilterDateRange(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  width: "100%",
                  fontSize: "var(--text-xs)",
                  padding: "6px 8px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-primary)",
                }}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Past 7 Days</option>
                <option value="month">This Month</option>
              </select>
            </div>

            {/* Outcome */}
            <div>
              <label style={{ display: "block", fontSize: "10px", color: "var(--color-neutral-dark)", marginBottom: "2px" }}>
                Outcome:
              </label>
              <select
                value={filterOutcome}
                onChange={(e) => {
                  setFilterOutcome(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  width: "100%",
                  fontSize: "var(--text-xs)",
                  padding: "6px 8px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-primary)",
                }}
              >
                <option value="all">All Outcomes</option>
                <option value="SUCCESS">Success Only</option>
                <option value="FAILURE">Failures Only</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Activity Table Card */}
      <div
        style={{
          backgroundColor: "var(--color-surface)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--color-border)",
          boxShadow: "var(--shadow-sm)",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              minWidth: "860px",
              borderCollapse: "collapse",
              textAlign: "left",
              fontSize: "var(--text-xs)",
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: "var(--color-surface-muted)",
                  borderBottom: "1px solid var(--color-border)",
                  color: "var(--color-neutral-dark)",
                }}
              >
                <th style={{ padding: "10px 14px", fontWeight: 600, width: "140px" }}>Timestamp</th>
                <th style={{ padding: "10px 14px", fontWeight: 600, width: "150px" }}>Actor &amp; Role</th>
                <th style={{ padding: "10px 14px", fontWeight: 600, width: "170px" }}>Action</th>
                <th style={{ padding: "10px 14px", fontWeight: 600, width: "160px" }}>Target Entity</th>
                <th style={{ padding: "10px 14px", fontWeight: 600, minWidth: "220px" }}>Event Details</th>
                <th style={{ padding: "10px 14px", fontWeight: 600, width: "110px", textAlign: "right" }}>Category</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "var(--space-10) var(--space-4)", textAlign: "center" }}>
                    <div style={{ color: "var(--color-neutral-dark)" }}>
                      <div style={{ fontSize: "24px", marginBottom: "var(--space-2)" }}>🔍</div>
                      <h4 style={{ fontSize: "var(--text-sm)", fontWeight: 600, margin: "0 0 4px", color: "var(--color-primary)" }}>
                        No audit records found
                      </h4>
                      <p style={{ fontSize: "var(--text-xs)", margin: "0 0 var(--space-3)" }}>
                        {searchQuery
                          ? `No activity entries matched the search query "${searchQuery}".`
                          : "No activity entries match the selected filter combination."}
                      </p>
                      {isFiltered && (
                        <Button variant="secondary" size="sm" onClick={handleResetFilters}>
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    style={{
                      borderBottom: "1px solid var(--color-border-subtle)",
                      cursor: "pointer",
                      transition: "background-color var(--transition-fast)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--color-surface-muted)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    {/* Timestamp */}
                    <td
                      style={{
                        padding: "10px 14px",
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px",
                        whiteSpace: "nowrap",
                        color: "var(--color-neutral-dark)",
                      }}
                    >
                      {log.timestamp.includes("T")
                        ? log.timestamp.replace("T", " ").slice(0, 19)
                        : log.timestamp}
                    </td>

                    {/* Actor & Role */}
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ fontWeight: 600, color: "var(--color-primary)" }}>
                        {log.performedBy}
                      </div>
                      {log.actorRole && (
                        <span
                          style={{
                            fontSize: "10px",
                            color: "var(--color-neutral-dark)",
                            textTransform: "capitalize",
                          }}
                        >
                          {log.actorRole.replace("-", " ")}
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                        {renderActionTypeBadge(log.actionType)}
                        <span style={{ fontWeight: 600, color: "var(--color-primary)" }}>
                          {log.action}
                        </span>
                      </div>
                      {log.outcome === "FAILURE" && (
                        <span style={{ fontSize: "10px", color: "var(--color-danger, #FF3B30)", fontWeight: 700 }}>
                          ✕ Failed
                        </span>
                      )}
                    </td>

                    {/* Target Entity */}
                    <td style={{ padding: "10px 14px", fontSize: "11px" }}>
                      <code
                        style={{
                          backgroundColor: "var(--color-surface-muted)",
                          padding: "2px 6px",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--color-border-subtle)",
                          fontFamily: "var(--font-mono)",
                          fontSize: "11px",
                          color: "var(--color-primary)",
                        }}
                      >
                        {log.target}
                      </code>
                    </td>

                    {/* Details */}
                    <td
                      style={{
                        padding: "10px 14px",
                        color: "var(--color-neutral-dark)",
                        lineHeight: 1.4,
                      }}
                    >
                      <div>{log.details}</div>
                      {log.diff && log.diff.length > 0 && (
                        <span
                          style={{
                            display: "inline-block",
                            marginTop: "2px",
                            fontSize: "10px",
                            color: "var(--color-accent)",
                            fontWeight: 600,
                          }}
                        >
                          Diff available ({log.diff.length} fields) &rarr;
                        </span>
                      )}
                    </td>

                    {/* Category */}
                    <td
                      style={{
                        padding: "10px 14px",
                        textAlign: "right",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {renderCategoryBadge(log.type)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 16px",
            borderTop: "1px solid var(--color-border)",
            backgroundColor: "var(--color-surface-muted)",
            fontSize: "var(--text-xs)",
            color: "var(--color-neutral-dark)",
            flexWrap: "wrap",
            gap: "var(--space-2)",
          }}
        >
          <div>
            Showing <strong>{filteredLogs.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}</strong>–
            <strong>{Math.min(currentPage * PAGE_SIZE, filteredLogs.length)}</strong> of <strong>{filteredLogs.length}</strong> events
            {isFiltered && ` (filtered from ${logs.length} total)`}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              style={{ height: "28px", padding: "0 10px", fontSize: "11px" }}
            >
              &larr; Previous
            </Button>
            <span>
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              style={{ height: "28px", padding: "0 10px", fontSize: "11px" }}
            >
              Next &rarr;
            </Button>
          </div>
        </div>
      </div>

      {/* EVENT DETAILS & DIFF MODAL */}
      {selectedLog && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedLog(null);
          }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
            padding: "var(--space-4)",
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="audit-details-title"
        >
          <div
            style={{
              backgroundColor: "var(--color-surface)",
              borderRadius: "var(--radius-lg)",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "var(--space-6)",
              boxShadow: "var(--shadow-xl)",
              border: "1px solid var(--color-border)",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "var(--space-4)",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "4px" }}>
                  <h3 id="audit-details-title" style={{ fontSize: "var(--text-lg)", fontWeight: 700, margin: 0 }}>
                    {selectedLog.action}
                  </h3>
                  {renderActionTypeBadge(selectedLog.actionType)}
                  {renderCategoryBadge(selectedLog.type)}
                </div>
                <div style={{ fontSize: "11px", color: "var(--color-neutral-dark)", fontFamily: "var(--font-mono)" }}>
                  Event ID: {selectedLog.id}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                aria-label="Close details"
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "18px",
                  cursor: "pointer",
                  color: "var(--color-neutral-dark)",
                  padding: "4px",
                }}
              >
                ✕
              </button>
            </div>

            {/* Metadata Summary Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "var(--space-2)",
                backgroundColor: "var(--color-surface-muted)",
                padding: "var(--space-4)",
                borderRadius: "var(--radius-md)",
                fontSize: "var(--text-xs)",
                marginBottom: "var(--space-4)",
              }}
            >
              <div>
                <span style={{ color: "var(--color-neutral-dark)" }}>Timestamp:</span>{" "}
                <strong>{selectedLog.timestamp}</strong>
              </div>
              <div>
                <span style={{ color: "var(--color-neutral-dark)" }}>Outcome:</span>{" "}
                <strong style={{ color: selectedLog.outcome === "FAILURE" ? "var(--color-danger, #FF3B30)" : "var(--color-success, #34C759)" }}>
                  {selectedLog.outcome || "SUCCESS"}
                </strong>
              </div>
              <div>
                <span style={{ color: "var(--color-neutral-dark)" }}>Actor:</span>{" "}
                <strong>{selectedLog.performedBy}</strong>
              </div>
              <div>
                <span style={{ color: "var(--color-neutral-dark)" }}>Role:</span>{" "}
                <strong style={{ textTransform: "capitalize" }}>
                  {(selectedLog.actorRole || "unspecified").replace("-", " ")}
                </strong>
              </div>
              <div>
                <span style={{ color: "var(--color-neutral-dark)" }}>Target Entity:</span>{" "}
                <strong>{selectedLog.target}</strong>
              </div>
              <div>
                <span style={{ color: "var(--color-neutral-dark)" }}>Entity Type:</span>{" "}
                <strong>{selectedLog.entityType || "general"}</strong>
              </div>
              {selectedLog.entityId && (
                <div>
                  <span style={{ color: "var(--color-neutral-dark)" }}>Entity ID:</span>{" "}
                  <code>{selectedLog.entityId}</code>
                </div>
              )}
              {selectedLog.sourcePortal && (
                <div>
                  <span style={{ color: "var(--color-neutral-dark)" }}>Source Portal:</span>{" "}
                  <strong style={{ textTransform: "capitalize" }}>{selectedLog.sourcePortal.replace("-", " ")}</strong>
                </div>
              )}
            </div>

            {/* Narrative Details */}
            <div style={{ marginBottom: "var(--space-4)" }}>
              <h4 style={{ fontSize: "var(--text-xs)", fontWeight: 700, margin: "0 0 4px", color: "var(--color-primary)" }}>
                Event Description
              </h4>
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-primary)",
                  backgroundColor: "var(--color-surface-muted)",
                  padding: "10px 12px",
                  borderRadius: "var(--radius-sm)",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {selectedLog.details}
              </p>
            </div>

            {/* Before-and-After Diff Table (if diff is present) */}
            {selectedLog.diff && selectedLog.diff.length > 0 && (
              <div style={{ marginBottom: "var(--space-4)" }}>
                <h4 style={{ fontSize: "var(--text-xs)", fontWeight: 700, margin: "0 0 6px", color: "var(--color-primary)" }}>
                  Field Changes &amp; Before/After Diff
                </h4>
                <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                    <thead>
                      <tr style={{ backgroundColor: "var(--color-surface-muted)", borderBottom: "1px solid var(--color-border)" }}>
                        <th style={{ padding: "6px 10px", textAlign: "left", width: "30%" }}>Field</th>
                        <th style={{ padding: "6px 10px", textAlign: "left", width: "35%" }}>Before</th>
                        <th style={{ padding: "6px 10px", textAlign: "left", width: "35%" }}>After</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedLog.diff.map((change, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                          <td style={{ padding: "6px 10px", fontWeight: 600 }}>{change.fieldName}</td>
                          <td style={{ padding: "6px 10px", color: "var(--color-neutral-dark)", fontFamily: "var(--font-mono)" }}>
                            {change.before !== undefined ? String(change.before) : "—"}
                          </td>
                          <td style={{ padding: "6px 10px", color: "var(--color-accent)", fontWeight: 600, fontFamily: "var(--font-mono)" }}>
                            {change.after !== undefined ? String(change.after) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "var(--space-4)" }}>
              <Button variant="secondary" size="sm" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* RESET CONFIRMATION MODAL */}
      {isResetConfirmOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsResetConfirmOpen(false);
          }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1200,
            padding: "var(--space-4)",
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            style={{
              backgroundColor: "var(--color-surface)",
              borderRadius: "var(--radius-lg)",
              maxWidth: "420px",
              width: "100%",
              padding: "var(--space-6)",
              boxShadow: "var(--shadow-xl)",
              border: "1px solid var(--color-border)",
            }}
          >
            <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, margin: "0 0 var(--space-2)" }}>
              Reset Demo Audit Logs?
            </h3>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", margin: "0 0 var(--space-4)", lineHeight: 1.5 }}>
              This will reset the client session audit trail back to the baseline sample records. All newly recorded demo events in this browser session will be cleared.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)" }}>
              <Button variant="secondary" size="sm" onClick={() => setIsResetConfirmOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  resetAuditLogsToSample();
                  setIsResetConfirmOpen(false);
                }}
                style={{
                  backgroundColor: "var(--color-danger, #FF3B30)",
                  borderColor: "var(--color-danger, #FF3B30)",
                  color: "#FFFFFF",
                }}
              >
                Confirm Reset
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
