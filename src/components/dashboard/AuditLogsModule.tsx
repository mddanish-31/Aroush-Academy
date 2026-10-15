"use client";

import React, { useState, useMemo } from "react";
import { AuditLogEntry } from "@/types";
import { SAMPLE_AUDIT_LOGS } from "@/data/dashboardModulesData";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useDemoStorage, DEMO_STORAGE_KEYS } from "@/lib/demoStorage";

export function AuditLogsModule() {
  const [logs] = useDemoStorage<AuditLogEntry[]>(
    DEMO_STORAGE_KEYS.AUDIT_LOGS,
    SAMPLE_AUDIT_LOGS
  );

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
          log.details.toLowerCase().includes(q) ||
          log.timestamp.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [logs, filterType, searchQuery]);

  const metrics = useMemo(() => {
    const total = logs.length;
    const financial = logs.filter((l) => l.type === "financial").length;
    const enrollment = logs.filter((l) => l.type === "enrollment").length;
    const system = logs.filter((l) => l.type === "system").length;
    return { total, financial, enrollment, system };
  }, [logs]);

  const isFiltered = filterType !== "all" || searchQuery.trim().length > 0;

  const handleResetFilters = () => {
    setFilterType("all");
    setSearchQuery("");
  };

  const renderCategoryBadge = (type: AuditLogEntry["type"]) => {
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      {/* Header Card */}
      <Card padding="md">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "var(--space-4)",
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
              Chronological activity record of academic, financial, attendance, and administrative operations.
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
            <div
              style={{
                backgroundColor: "var(--color-surface-muted)",
                padding: "4px 10px",
                borderRadius: "var(--radius-sm)",
                fontSize: "11px",
                color: "var(--color-neutral-dark)",
                border: "1px solid var(--color-border-subtle)",
              }}
            >
              Total Events: <strong style={{ color: "var(--color-primary)" }}>{metrics.total}</strong>
            </div>
            <div
              style={{
                backgroundColor: "var(--color-surface-muted)",
                padding: "4px 10px",
                borderRadius: "var(--radius-sm)",
                fontSize: "11px",
                color: "var(--color-neutral-dark)",
                border: "1px solid var(--color-border-subtle)",
              }}
            >
              Financial: <strong style={{ color: "var(--color-accent)" }}>{metrics.financial}</strong>
            </div>
            <div
              style={{
                backgroundColor: "var(--color-surface-muted)",
                padding: "4px 10px",
                borderRadius: "var(--radius-sm)",
                fontSize: "11px",
                color: "var(--color-neutral-dark)",
                border: "1px solid var(--color-border-subtle)",
              }}
            >
              Academic &amp; System: <strong style={{ color: "var(--color-primary)" }}>{metrics.enrollment + metrics.system}</strong>
            </div>
          </div>
        </div>
      </Card>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: "flex",
          gap: "var(--space-3)",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", flex: "1 1 340px", alignItems: "center" }}>
          {/* Search Box */}
          <div style={{ position: "relative", flex: "1 1 240px" }}>
            <input
              type="text"
              placeholder="Search by actor, action, target entity, or details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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

          {/* Category Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", fontWeight: 500 }}>
              Category:
            </span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              aria-label="Filter events by category"
              style={{
                fontSize: "var(--text-xs)",
                padding: "7px 10px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-surface)",
                color: "var(--color-primary)",
                fontWeight: 500,
              }}
            >
              <option value="all">All Events ({logs.length})</option>
              <option value="financial">Financial Collections ({metrics.financial})</option>
              <option value="enrollment">Academic &amp; Attendance ({metrics.enrollment})</option>
              <option value="system">Administrative &amp; System ({metrics.system})</option>
            </select>
          </div>
        </div>

        {/* Counter and Clear Button */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)" }}>
            Showing <strong>{visibleLogs.length}</strong> of {logs.length} events
          </span>
          {isFiltered && (
            <Button variant="ghost" size="sm" onClick={handleResetFilters} style={{ padding: "4px 8px", height: "28px" }}>
              Reset Filters
            </Button>
          )}
        </div>
      </div>

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
              minWidth: "820px",
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
                <th style={{ padding: "10px 14px", fontWeight: 600, width: "150px" }}>Timestamp</th>
                <th style={{ padding: "10px 14px", fontWeight: 600, width: "160px" }}>Actor</th>
                <th style={{ padding: "10px 14px", fontWeight: 600, width: "170px" }}>Action</th>
                <th style={{ padding: "10px 14px", fontWeight: 600, width: "160px" }}>Target Entity</th>
                <th style={{ padding: "10px 14px", fontWeight: 600, minWidth: "240px" }}>Event Details</th>
                <th style={{ padding: "10px 14px", fontWeight: 600, width: "100px", textAlign: "right" }}>Category</th>
              </tr>
            </thead>
            <tbody>
              {visibleLogs.length === 0 ? (
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
                          : "No activity entries found for the selected category."}
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
                visibleLogs.map((log) => (
                  <tr
                    key={log.id}
                    style={{
                      borderBottom: "1px solid var(--color-border-subtle)",
                      transition: "background-color var(--transition-fast)",
                    }}
                  >
                    {/* Timestamp */}
                    <td
                      style={{
                        padding: "12px 14px",
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px",
                        whiteSpace: "nowrap",
                        color: "var(--color-neutral-dark)",
                      }}
                    >
                      {log.timestamp}
                    </td>

                    {/* Actor */}
                    <td
                      style={{
                        padding: "12px 14px",
                        fontWeight: 600,
                        color: "var(--color-primary)",
                      }}
                    >
                      {log.performedBy}
                    </td>

                    {/* Action */}
                    <td
                      style={{
                        padding: "12px 14px",
                        fontWeight: 600,
                        color: "var(--color-primary)",
                      }}
                    >
                      {log.action}
                    </td>

                    {/* Target Entity */}
                    <td
                      style={{
                        padding: "12px 14px",
                        color: "var(--color-neutral-dark)",
                        fontSize: "11px",
                      }}
                    >
                      <code
                        style={{
                          backgroundColor: "var(--color-surface-muted)",
                          padding: "2px 6px",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--color-border-subtle)",
                          fontFamily: "var(--font-mono)",
                          fontSize: "11px",
                        }}
                      >
                        {log.target}
                      </code>
                    </td>

                    {/* Details */}
                    <td
                      style={{
                        padding: "12px 14px",
                        color: "var(--color-primaryLight)",
                        lineHeight: 1.5,
                        overflowWrap: "break-word",
                        wordBreak: "break-word",
                      }}
                    >
                      {log.details}
                    </td>

                    {/* Category */}
                    <td
                      style={{
                        padding: "12px 14px",
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
      </div>
    </div>
  );
}
