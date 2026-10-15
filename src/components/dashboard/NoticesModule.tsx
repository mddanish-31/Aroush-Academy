"use client";

import React, { useState, useMemo, useEffect } from "react";
import { UserRole, NoticeItem, AuditLogEntry } from "@/types";
import { SAMPLE_NOTICES, SAMPLE_AUDIT_LOGS } from "@/data/dashboardModulesData";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useDemoStorage, DEMO_STORAGE_KEYS } from "@/lib/demoStorage";

interface NoticesModuleProps {
  role: UserRole;
}

function formatNoticeDate(dateStr: string): string {
  try {
    const parts = dateStr.split("-").map(Number);
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      const date = new Date(parts[0], parts[1] - 1, parts[2]);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

function formatTargetRoles(roles: UserRole[]): string {
  if (!roles || roles.length === 0 || roles.length === 4) {
    return "All Roles (Admin, Faculty, Students, Parents)";
  }
  return roles
    .map((r) => {
      switch (r) {
        case "academy-admin":
          return "Admin";
        case "teacher":
          return "Faculty";
        case "student":
          return "Students";
        case "parent":
          return "Parents";
        default:
          return r;
      }
    })
    .join(", ");
}

export function NoticesModule({ role }: NoticesModuleProps) {
  const [notices, setNotices] = useDemoStorage<NoticeItem[]>(
    DEMO_STORAGE_KEYS.NOTICES,
    SAMPLE_NOTICES
  );
  const [, setAuditLogs] = useDemoStorage<AuditLogEntry[]>(
    DEMO_STORAGE_KEYS.AUDIT_LOGS,
    SAMPLE_AUDIT_LOGS
  );

  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Publish Modal State
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [categoryInput, setCategoryInput] = useState<NoticeItem["category"]>("Academic");
  const [priorityInput, setPriorityInput] = useState<"normal" | "urgent">("normal");
  const [contentInput, setContentInput] = useState("");
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!isPublishModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsPublishModalOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPublishModalOpen]);

  // Scoped strictly to user role
  const roleScopedNotices = useMemo(() => {
    return notices.filter((n) => {
      if (role !== "academy-admin" && !n.targetRoles.includes(role)) return false;
      return true;
    });
  }, [notices, role]);

  const visibleNotices = useMemo(() => {
    return roleScopedNotices.filter((n) => {
      if (selectedCategory !== "all" && n.category !== selectedCategory) return false;
      return true;
    });
  }, [roleScopedNotices, selectedCategory]);

  const urgentCount = useMemo(() => {
    return roleScopedNotices.filter((n) => n.priority === "urgent").length;
  }, [roleScopedNotices]);

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim() || !contentInput.trim()) return;

    const authorName =
      role === "teacher" ? "Azhar Sir (Faculty)" : "Academy Administration";

    const newNotice: NoticeItem = {
      id: `not-new-${Date.now()}`,
      title: titleInput.trim(),
      category: categoryInput,
      date: new Date().toISOString().split("T")[0],
      content: contentInput.trim(),
      author: authorName,
      priority: priorityInput,
      targetRoles: ["academy-admin", "teacher", "student", "parent"],
    };

    setNotices((prev) => [newNotice, ...prev]);

    // Record activity event in shared audit trail
    const auditEntry: AuditLogEntry = {
      id: `log-not-${Date.now()}`,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      performedBy: authorName,
      action: "Notice Published",
      target: "All Roles",
      details: `Published ${priorityInput === "urgent" ? "urgent " : ""}circular: "${newNotice.title}" (${categoryInput}).`,
      type: "system",
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);

    setIsPublishModalOpen(false);
    setTitleInput("");
    setContentInput("");
    setActionSuccessNotice(`Notice "${newNotice.title}" published successfully.`);
    setTimeout(() => setActionSuccessNotice(null), 5000);
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
                Notices &amp; Circulars
              </h2>
              <Badge variant="accent" size="sm">
                {roleScopedNotices.length} Total
              </Badge>
              {urgentCount > 0 && (
                <Badge variant="danger" size="sm">
                  {urgentCount} Urgent
                </Badge>
              )}
            </div>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", margin: 0 }}>
              Official administrative advisories, examination timetables, holiday schedules, and academic bulletins.
            </p>
          </div>

          {(role === "academy-admin" || role === "teacher") && (
            <Button
              variant="accent"
              size="sm"
              onClick={() => setIsPublishModalOpen(true)}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <span>+</span>
              <span>Publish Notice</span>
            </Button>
          )}
        </div>
      </Card>

      {/* Success Notification */}
      {actionSuccessNotice && (
        <div
          style={{
            backgroundColor: "rgba(52, 199, 89, 0.08)",
            border: "1px solid rgba(52, 199, 89, 0.25)",
            borderRadius: "var(--radius-md)",
            padding: "10px 14px",
            fontSize: "var(--text-xs)",
            color: "var(--color-primary)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
          role="status"
        >
          <span style={{ color: "var(--color-success)", fontWeight: 700 }}>✓</span>
          <span>{actionSuccessNotice}</span>
        </div>
      )}

      {/* Refined Category Filter Bar */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          padding: "4px",
          backgroundColor: "var(--color-surface-muted)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--color-border)",
          flexWrap: "wrap",
          width: "fit-content",
          maxWidth: "100%",
        }}
        role="tablist"
        aria-label="Filter notices by category"
      >
        {(["all", "Examination", "Academic", "Holiday", "Administration"] as const).map((cat) => {
          const count =
            cat === "all"
              ? roleScopedNotices.length
              : roleScopedNotices.filter((n) => n.category === cat).length;
          const isActive = selectedCategory === cat;

          return (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: "6px 14px",
                borderRadius: "var(--radius-sm)",
                fontSize: "var(--text-xs)",
                fontWeight: isActive ? 600 : 500,
                backgroundColor: isActive ? "var(--color-surface)" : "transparent",
                color: isActive ? "var(--color-primary)" : "var(--color-neutral-dark)",
                border: "none",
                boxShadow: isActive ? "var(--shadow-sm)" : "none",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                transition: "all var(--transition-fast)",
              }}
            >
              <span>{cat === "all" ? "All Notices" : cat}</span>
              <span
                style={{
                  fontSize: "10px",
                  padding: "1px 6px",
                  borderRadius: "var(--radius-full)",
                  backgroundColor: isActive ? "var(--color-surface-muted)" : "rgba(0, 0, 0, 0.05)",
                  color: isActive ? "var(--color-primary)" : "var(--color-neutral-dark)",
                  fontWeight: 600,
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Notices List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        {visibleNotices.length === 0 ? (
          <div
            style={{
              padding: "var(--space-10) var(--space-6)",
              textAlign: "center",
              backgroundColor: "var(--color-surface)",
              borderRadius: "var(--radius-lg)",
              border: "1px dashed var(--color-border)",
              color: "var(--color-neutral-dark)",
            }}
          >
            <div style={{ fontSize: "28px", marginBottom: "var(--space-2)" }}>📋</div>
            <h4 style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-primary)", margin: "0 0 4px" }}>
              No notices in this category
            </h4>
            <p style={{ fontSize: "var(--text-xs)", margin: "0 0 var(--space-4)" }}>
              There are currently no circulars published under &ldquo;{selectedCategory}&rdquo;.
            </p>
            <Button variant="secondary" size="sm" onClick={() => setSelectedCategory("all")}>
              View All Notices
            </Button>
          </div>
        ) : (
          visibleNotices.map((n) => {
            const isUrgent = n.priority === "urgent";

            return (
              <article
                key={n.id}
                style={{
                  backgroundColor: "var(--color-surface)",
                  borderRadius: "var(--radius-lg)",
                  border: isUrgent
                    ? "1px solid rgba(255, 59, 48, 0.25)"
                    : "1px solid var(--color-border)",
                  borderLeft: isUrgent
                    ? "4px solid #FF3B30"
                    : "1px solid var(--color-border)",
                  padding: "var(--space-5)",
                  boxShadow: "var(--shadow-sm)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-3)",
                }}
              >
                {/* Meta row: Category, Priority, Date, and Author */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "var(--space-2)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    {isUrgent && (
                      <Badge variant="danger" size="sm">
                        Urgent
                      </Badge>
                    )}
                    <Badge variant={n.category === "Examination" ? "accent" : "neutral"} size="sm">
                      {n.category}
                    </Badge>
                    <span style={{ fontSize: "12px", color: "var(--color-neutral-dark)", fontWeight: 400 }}>
                      {formatNoticeDate(n.date)}
                    </span>
                  </div>

                  <div style={{ fontSize: "12px", color: "var(--color-neutral-dark)", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    <span>Posted by:</span>
                    <strong style={{ color: "var(--color-primary)", fontWeight: 600 }}>{n.author}</strong>
                  </div>
                </div>

                {/* Title */}
                <h3
                  style={{
                    fontSize: "var(--text-base)",
                    fontWeight: 700,
                    color: "var(--color-primary)",
                    margin: 0,
                    lineHeight: 1.4,
                    overflowWrap: "break-word",
                    wordBreak: "break-word",
                  }}
                >
                  {n.title}
                </h3>

                {/* Content */}
                <p
                  style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--color-primaryLight)",
                    lineHeight: 1.6,
                    margin: 0,
                    whiteSpace: "pre-line",
                    overflowWrap: "break-word",
                    wordBreak: "break-word",
                  }}
                >
                  {n.content}
                </p>

                {/* Footer Metadata: Audience & ID */}
                <div
                  style={{
                    paddingTop: "var(--space-2)",
                    borderTop: "1px solid var(--color-border-subtle)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "var(--space-2)",
                    fontSize: "11px",
                    color: "var(--color-neutral-dark)",
                  }}
                >
                  <span>
                    Audience: <strong>{formatTargetRoles(n.targetRoles)}</strong>
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--color-neutral)" }}>
                    {n.id}
                  </span>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* PUBLISH NOTICE MODAL */}
      {isPublishModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsPublishModalOpen(false);
          }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.45)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "var(--space-4)",
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="publish-notice-modal-title"
        >
          <div
            style={{
              backgroundColor: "var(--color-surface)",
              borderRadius: "var(--radius-lg)",
              maxWidth: "540px",
              width: "100%",
              padding: "var(--space-6)",
              boxShadow: "var(--shadow-lg)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "var(--space-4)",
              }}
            >
              <div>
                <h3
                  id="publish-notice-modal-title"
                  style={{ fontSize: "var(--text-base)", fontWeight: 700, margin: "0 0 2px" }}
                >
                  Publish Academy Circular
                </h3>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", margin: 0 }}>
                  Broadcast a formal notice to faculty, students, and parents.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPublishModalOpen(false)}
                aria-label="Close modal"
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "18px",
                  color: "var(--color-neutral-dark)",
                  cursor: "pointer",
                  padding: "4px",
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePublish}>
              <div style={{ marginBottom: "var(--space-3)" }}>
                <label
                  htmlFor="notice-title"
                  style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "4px" }}
                >
                  Notice Title *
                </label>
                <input
                  id="notice-title"
                  type="text"
                  required
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder="e.g. Pre-Board Examination Schedule Released"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-border)",
                    fontSize: "var(--text-xs)",
                    backgroundColor: "var(--color-surface)",
                    color: "var(--color-primary)",
                  }}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "var(--space-3)",
                  marginBottom: "var(--space-3)",
                }}
              >
                <div>
                  <label
                    htmlFor="notice-category"
                    style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "4px" }}
                  >
                    Category
                  </label>
                  <select
                    id="notice-category"
                    value={categoryInput}
                    onChange={(e) => setCategoryInput(e.target.value as NoticeItem["category"])}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border)",
                      fontSize: "var(--text-xs)",
                      backgroundColor: "var(--color-surface)",
                    }}
                  >
                    <option value="Academic">Academic</option>
                    <option value="Examination">Examination</option>
                    <option value="Holiday">Holiday</option>
                    <option value="Administration">Administration</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="notice-priority"
                    style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "4px" }}
                  >
                    Priority
                  </label>
                  <select
                    id="notice-priority"
                    value={priorityInput}
                    onChange={(e) => setPriorityInput(e.target.value as "normal" | "urgent")}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border)",
                      fontSize: "var(--text-xs)",
                      backgroundColor: "var(--color-surface)",
                    }}
                  >
                    <option value="normal">Standard Notice</option>
                    <option value="urgent">Urgent Bulletin</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: "var(--space-4)" }}>
                <label
                  htmlFor="notice-content"
                  style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "4px" }}
                >
                  Notice Content *
                </label>
                <textarea
                  id="notice-content"
                  rows={4}
                  required
                  value={contentInput}
                  onChange={(e) => setContentInput(e.target.value)}
                  placeholder="Type official notification message and instructions..."
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-border)",
                    fontSize: "var(--text-xs)",
                    backgroundColor: "var(--color-surface)",
                    color: "var(--color-primary)",
                    lineHeight: 1.5,
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)" }}>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsPublishModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="accent" size="sm">
                  Broadcast Notice
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
