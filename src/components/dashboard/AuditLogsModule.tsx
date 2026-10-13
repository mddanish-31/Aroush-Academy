"use client";

import React, { useState, useMemo } from "react";
import { AuditLogEntry } from "@/types";
import { SAMPLE_AUDIT_LOGS } from "@/data/dashboardModulesData";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function AuditLogsModule() {
  const [logs] = useState<AuditLogEntry[]>(SAMPLE_AUDIT_LOGS);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const visibleLogs = useMemo(() => {
    return logs.filter((log) => {
      if (filterType !== "all" && log.type !== filterType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          log.action.toLowerCase().includes(q) ||
          log.target.toLowerCase().includes(q) ||
          log.performedBy.toLowerCase().includes(q) ||
          log.details.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [logs, filterType, searchQuery]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      {/* Header Card */}
      <Card padding="md">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-3)" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "4px" }}>
              <h2 style={{ fontSize: "var(--text-lg)" }}>
                Institutional Audit &amp; Activity Trail
              </h2>
              <Badge variant="accent" size="sm">
                Immutable Ledger
              </Badge>
            </div>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)" }}>
              Chronological ledger of cash transactions, receipt issuances, attendance marking, and administrative notices.
            </p>
          </div>
        </div>
      </Card>

      {/* Filter and Search Bar */}
      <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="text"
          placeholder="Search audit trail by actor, action, or target..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: "1 1 260px",
            padding: "8px 12px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-surface)",
            fontSize: "var(--text-xs)",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", fontWeight: 500 }}>Category:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{ fontSize: "var(--text-xs)", padding: "6px 8px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)" }}
          >
            <option value="all">All Events</option>
            <option value="financial">Financial Collections</option>
            <option value="enrollment">Academic &amp; Attendance</option>
            <option value="system">Administrative &amp; System</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div style={{ backgroundColor: "var(--color-surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "var(--text-xs)" }}>
            <thead>
              <tr style={{ backgroundColor: "var(--color-surface-muted)", borderBottom: "1px solid var(--color-border)" }}>
                <th style={{ padding: "10px 14px", fontWeight: 600 }}>Timestamp</th>
                <th style={{ padding: "10px 14px", fontWeight: 600 }}>Actor</th>
                <th style={{ padding: "10px 14px", fontWeight: 600 }}>Action</th>
                <th style={{ padding: "10px 14px", fontWeight: 600 }}>Target Entity</th>
                <th style={{ padding: "10px 14px", fontWeight: 600 }}>Event Details</th>
                <th style={{ padding: "10px 14px", fontWeight: 600 }}>Category</th>
              </tr>
            </thead>
            <tbody>
              {visibleLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--color-neutral-dark)" }}>
                    No audit records match the selected filters.
                  </td>
                </tr>
              ) : (
                visibleLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)", fontSize: "11px", whiteSpace: "nowrap", color: "var(--color-neutral-dark)" }}>
                      {log.timestamp}
                    </td>
                    <td style={{ padding: "10px 14px", fontWeight: 600 }}>
                      {log.performedBy}
                    </td>
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: "var(--color-primary)" }}>
                      {log.action}
                    </td>
                    <td style={{ padding: "10px 14px", color: "var(--color-neutral-dark)" }}>
                      {log.target}
                    </td>
                    <td style={{ padding: "10px 14px", color: "var(--color-primary)", lineHeight: 1.4 }}>
                      {log.details}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <Badge variant={log.type === "financial" ? "accent" : "neutral"} size="sm">
                        {log.type}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
