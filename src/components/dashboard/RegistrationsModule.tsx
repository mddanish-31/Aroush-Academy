"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useMotion } from "@/lib/motion/MotionProvider";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Check, X, Clock, RefreshCw } from "lucide-react";

interface AdminRegistrationRow {
  id: string;
  name: string;
  identifier: string;
  role: string;
  class_id: string | null;
  board_id: string | null;
  guardian_name: string | null;
  guardian_identifier: string | null;
  guardian_email: string | null;
  guardian_phone: string | null;
  class_grade: string | null;
  ward_name: string | null;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  reviewed_at: string | null;
  submitted_at: string;
  created_at: string;
}

interface AcademicOption {
  id: string;
  name: string;
}

interface RowFeedback {
  type: "success" | "error";
  text: string;
}

function formatSubmittedDate(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function RegistrationsModule() {
  const { user } = useAuth();
  const { motion } = useMotion();
  const isServerMode = process.env.NEXT_PUBLIC_AUTH_MODE === "server";

  const transitionValue =
    motion === "reduced"
      ? "none"
      : "background-color 150ms ease-out, border-color 150ms ease-out";

  const [rows, setRows] = useState<AdminRegistrationRow[]>([]);
  const [parentAccounts, setParentAccounts] = useState<{ id: string; name: string; phone: string }[]>([]);
  const [reviewedParents, setReviewedParents] = useState<Record<string, string>>({});
  const [classMap, setClassMap] = useState<Record<string, string>>({});
  const [boardMap, setBoardMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [busyRowId, setBusyRowId] = useState<string | null>(null);
  const [rowFeedback, setRowFeedback] = useState<Record<string, RowFeedback>>({});
  const [rejectingRowId, setRejectingRowId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [rejectReasonError, setRejectReasonError] = useState<string | null>(null);
  const [isNarrowScreen, setIsNarrowScreen] = useState<boolean>(false);
  const [refreshTick, setRefreshTick] = useState<number>(0);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }
    const mql = window.matchMedia("(max-width: 768px)");
    const updateMatch = () => setIsNarrowScreen(mql.matches);
    updateMatch();
    mql.addEventListener("change", updateMatch);
    return () => {
      mql.removeEventListener("change", updateMatch);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadRegistrations = async () => {
      if (!isServerMode) {
        if (active) {
          setIsLoading(false);
        }
        return;
      }
      try {
        const [regRes, acadRes] = await Promise.all([
          fetch("/api/admin/registrations", {
            method: "GET",
            credentials: "same-origin",
          }),
          fetch("/api/public/academics", {
            method: "GET",
            credentials: "same-origin",
          }),
        ]);

        if (!active) {
          return;
        }

        if (acadRes.ok) {
          const acadData = await acadRes.json().catch(() => null);
          if (active && acadData) {
            const nextClasses: Record<string, string> = {};
            const nextBoards: Record<string, string> = {};
            if (Array.isArray(acadData.classes)) {
              for (const item of acadData.classes as AcademicOption[]) {
                nextClasses[item.id] = item.name;
              }
            }
            if (Array.isArray(acadData.boards)) {
              for (const item of acadData.boards as AcademicOption[]) {
                nextBoards[item.id] = item.name;
              }
            }
            setClassMap(nextClasses);
            setBoardMap(nextBoards);
          }
        }

        if (!regRes.ok) {
          if (active) {
            setLoadError("Could not load registration requests.");
          }
          return;
        }

        const regData = await regRes.json().catch(() => null);
        if (!active) {
          return;
        }
        if (regData && regData.ok && Array.isArray(regData.registrations)) {
          setLoadError(null);
          setRows(regData.registrations);
          setParentAccounts(Array.isArray(regData.parentAccounts) ? regData.parentAccounts : []);
        } else {
          setLoadError("Could not load registration requests.");
        }
      } catch {
        if (active) {
          setLoadError("Could not load registration requests.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadRegistrations();
    return () => {
      active = false;
    };
  }, [isServerMode, refreshTick]);

  const sortedRows = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const aPending = a.status === "pending" ? 0 : 1;
      const bPending = b.status === "pending" ? 0 : 1;
      if (aPending !== bPending) {
        return aPending - bPending;
      }
      const aTime = new Date(a.submitted_at).getTime() || 0;
      const bTime = new Date(b.submitted_at).getTime() || 0;
      return bTime - aTime;
    });
    return copy;
  }, [rows]);

  const pendingCount = useMemo(
    () => rows.filter((r) => r.status === "pending").length,
    [rows]
  );

  if (!isServerMode || user?.role !== "academy-admin") {
    return null;
  }

  const resolveClassName = (row: AdminRegistrationRow): string => {
    if (row.class_id && classMap[row.class_id]) {
      return classMap[row.class_id];
    }
    if (row.class_grade) {
      return row.class_grade;
    }
    return "-";
  };

  const resolveBoardName = (row: AdminRegistrationRow): string => {
    if (row.board_id && boardMap[row.board_id]) {
      return boardMap[row.board_id];
    }
    return "-";
  };

  const handleApprove = async (id: string) => {
    if (busyRowId) {
      return;
    }
    setBusyRowId(id);
    setRowFeedback((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    try {
      const res = await fetch(`/api/admin/registrations/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ parentUserId: reviewedParents[id] || undefined }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || !data.ok) {
        setRowFeedback((prev) => ({
          ...prev,
          [id]: {
            type: "error",
            text:
              typeof data?.error === "string"
                ? data.error
                : "Could not approve registration request.",
          },
        }));
        return;
      }

      const admissionLabel =
        typeof data.admissionNumber === "string"
          ? `Approved (${data.admissionNumber}).`
          : "Registration request approved.";

      setRowFeedback((prev) => ({
        ...prev,
        [id]: {
          type: "success",
           text: data.activationToken
             ? `${admissionLabel} Parent activation code (shown once, expires in 24 hours): ${data.activationToken}. Verify identity manually before handing it to the parent.`
             : admissionLabel,
        },
      }));
      if (rejectingRowId === id) {
        setRejectingRowId(null);
        setRejectReason("");
        setRejectReasonError(null);
      }
      setRefreshTick((prev) => prev + 1);
    } catch {
      setRowFeedback((prev) => ({
        ...prev,
        [id]: {
          type: "error",
          text: "Could not approve registration request.",
        },
      }));
    } finally {
      setBusyRowId(null);
    }
  };

  const openRejectForm = (id: string) => {
    if (busyRowId) {
      return;
    }
    setRejectingRowId(id);
    setRejectReason("");
    setRejectReasonError(null);
  };

  const cancelRejectForm = () => {
    if (busyRowId) {
      return;
    }
    setRejectingRowId(null);
    setRejectReason("");
    setRejectReasonError(null);
  };

  const handleConfirmReject = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (busyRowId) {
      return;
    }
    const trimmedReason = rejectReason.trim();
    if (trimmedReason.length < 5) {
      setRejectReasonError("Reason must be at least 5 characters.");
      return;
    }

    setRejectReasonError(null);
    setBusyRowId(id);
    setRowFeedback((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    try {
      const res = await fetch(`/api/admin/registrations/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ reason: trimmedReason }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || !data.ok) {
        setRowFeedback((prev) => ({
          ...prev,
          [id]: {
            type: "error",
            text:
              typeof data?.error === "string"
                ? data.error
                : "Could not reject registration request.",
          },
        }));
        return;
      }

      setRowFeedback((prev) => ({
        ...prev,
        [id]: {
          type: "success",
          text: "Registration request rejected.",
        },
      }));
      setRejectingRowId(null);
      setRejectReason("");
      setRefreshTick((prev) => prev + 1);
    } catch {
      setRowFeedback((prev) => ({
        ...prev,
        [id]: {
          type: "error",
          text: "Could not reject registration request.",
        },
      }));
    } finally {
      setBusyRowId(null);
    }
  };

  const renderRowActions = (row: AdminRegistrationRow) => {
    const isRowBusy = busyRowId === row.id;
    const isAnyBusy = busyRowId !== null;
    const isRejecting = rejectingRowId === row.id;

    if (row.status !== "pending") {
      return (
        <span
          style={{
            fontSize: "var(--text-xs)",
            fontWeight: 600,
            textTransform: "capitalize",
            color:
              row.status === "approved"
                ? "var(--color-success)"
                : "var(--color-danger)",
          }}
        >
          {row.status}
        </span>
      );
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        <p style={{ fontSize: "var(--text-xs)" }}>Review guardian: {row.guardian_name}, {row.guardian_phone ?? row.guardian_identifier}. Confirm the relationship and identity before approval.</p>
        <label htmlFor={`parent-account-${row.id}`} style={{ fontSize: "var(--text-xs)" }}>Parent account for this student</label>
        <select id={`parent-account-${row.id}`} value={reviewedParents[row.id] ?? ""}
          onChange={(event) => setReviewedParents((previous) => ({ ...previous, [row.id]: event.target.value }))}
          style={{ padding: "var(--space-2)", border: "1px solid var(--color-border)", background: "var(--color-surface)", maxWidth: "100%" }}>
          <option value="">Create new parent account</option>
          {parentAccounts.filter((parent) => parent.phone === (row.guardian_phone ?? row.guardian_identifier)).map((parent) => (
            <option key={parent.id} value={parent.id}>{parent.name} - {parent.phone}</option>
          ))}
        </select>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={isAnyBusy}
            onClick={() => handleApprove(row.id)}
            style={{ transition: transitionValue }}
          >
            <Check size={14} aria-hidden="true" />
            <span>{isRowBusy && !isRejecting ? "Approving..." : "Approve"}</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isAnyBusy}
            onClick={() => openRejectForm(row.id)}
            style={{
              border: "1px solid var(--color-border)",
              transition: transitionValue,
            }}
          >
            <X size={14} aria-hidden="true" />
            <span>Reject</span>
          </Button>
        </div>

        {isRejecting && (
          <form
            onSubmit={(e) => handleConfirmReject(e, row.id)}
            noValidate
            style={{
              marginTop: "var(--space-1)",
              padding: "var(--space-3)",
              backgroundColor: "var(--color-surface-muted)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-2)",
            }}
          >
            <label
              htmlFor={`reject-reason-${row.id}`}
              style={{
                fontSize: "var(--text-xs)",
                fontWeight: 600,
                color: "var(--color-primary)",
              }}
            >
              Rejection Reason (minimum 5 characters)
            </label>
            <input
              id={`reject-reason-${row.id}`}
              name="reason"
              type="text"
              required
              disabled={isRowBusy}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              aria-invalid={!!rejectReasonError}
              aria-describedby={
                rejectReasonError ? `reject-reason-error-${row.id}` : undefined
              }
              placeholder="Enter reason for rejection"
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-surface)",
                fontSize: "var(--text-xs)",
                color: "var(--color-primary)",
                outline: "none",
                transition: transitionValue,
              }}
            />
            {rejectReasonError && (
              <div
                id={`reject-reason-error-${row.id}`}
                role="alert"
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-danger)",
                }}
              >
                {rejectReasonError}
              </div>
            )}
            <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isRowBusy}
                style={{ transition: transitionValue }}
              >
                {isRowBusy ? "Rejecting..." : "Confirm Reject"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isRowBusy}
                onClick={cancelRejectForm}
                style={{
                  border: "1px solid var(--color-border)",
                  transition: transitionValue,
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    );
  };

  const renderFeedbackLine = (id: string) => {
    const fb = rowFeedback[id];
    if (!fb) {
      return null;
    }
    return (
      <div
        role={fb.type === "error" ? "alert" : "status"}
        style={{
          marginTop: "var(--space-2)",
          fontSize: "var(--text-xs)",
          fontWeight: 600,
          color:
            fb.type === "error"
              ? "var(--color-danger)"
              : "var(--color-success)",
        }}
      >
        {fb.text}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <Card padding="lg">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "var(--space-3)",
            marginBottom: "var(--space-4)",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "var(--text-xl)",
                fontWeight: 700,
                color: "var(--color-primary)",
                marginBottom: "4px",
              }}
            >
              Student & Guardian Registrations
            </h2>
            <p
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--color-neutral-dark)",
              }}
            >
              Pending requests are shown first. Approving creates student and guardian accounts.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isLoading || busyRowId !== null}
            onClick={() => setRefreshTick((prev) => prev + 1)}
            style={{
              border: "1px solid var(--color-border)",
              transition: transitionValue,
            }}
          >
            <RefreshCw size={14} aria-hidden="true" />
            <span>Refresh List</span>
          </Button>
        </div>

        {loadError && (
          <div
            role="alert"
            style={{
              padding: "var(--space-3)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-surface-muted)",
              color: "var(--color-danger)",
              fontSize: "var(--text-xs)",
              marginBottom: "var(--space-4)",
            }}
          >
            {loadError}
          </div>
        )}

        {!isLoading && pendingCount === 0 && (
          <div
            role="status"
            style={{
              padding: "var(--space-4)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-surface-muted)",
              display: "flex",
              alignItems: "center",
              gap: "var(--space-3)",
              marginBottom: sortedRows.length > 0 ? "var(--space-4)" : 0,
            }}
          >
            <Clock size={18} aria-hidden="true" style={{ color: "var(--brand-teal)" }} />
            <span
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--color-primary)",
                fontWeight: 500,
              }}
            >
              No pending registration requests at this time.
            </span>
          </div>
        )}

        {isLoading ? (
          <div
            style={{
              padding: "var(--space-6)",
              textAlign: "center",
              fontSize: "var(--text-sm)",
              color: "var(--color-neutral-dark)",
            }}
          >
            Loading registration requests...
          </div>
        ) : sortedRows.length > 0 ? (
          isNarrowScreen ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {sortedRows.map((row) => (
                <div
                  key={row.id}
                  style={{
                    padding: "var(--space-4)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-border)",
                    backgroundColor: "var(--color-surface)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-2)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "var(--space-2)",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "var(--text-sm)",
                          fontWeight: 700,
                          color: "var(--color-primary)",
                        }}
                      >
                        {row.name}
                      </div>
                      <div
                        style={{
                          fontSize: "var(--text-xs)",
                          color: "var(--color-neutral-dark)",
                          wordBreak: "break-word",
                        }}
                      >
                        {row.identifier}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: "var(--text-xs)",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        padding: "2px 8px",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--color-border)",
                        backgroundColor: "var(--color-surface-muted)",
                        color: "var(--color-primary)",
                      }}
                    >
                      {row.status}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "var(--space-2)",
                      fontSize: "var(--text-xs)",
                    }}
                  >
                    <div>
                      <span style={{ color: "var(--color-neutral-dark)", display: "block" }}>
                        Class
                      </span>
                      <strong style={{ color: "var(--color-primary)" }}>
                        {resolveClassName(row)}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: "var(--color-neutral-dark)", display: "block" }}>
                        Board
                      </span>
                      <strong style={{ color: "var(--color-primary)" }}>
                        {resolveBoardName(row)}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: "var(--color-neutral-dark)", display: "block" }}>
                        Guardian Name
                      </span>
                      <strong style={{ color: "var(--color-primary)" }}>
                        {row.guardian_name || "-"}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: "var(--color-neutral-dark)", display: "block" }}>
                        Submitted Date
                      </span>
                      <strong style={{ color: "var(--color-primary)" }}>
                        {formatSubmittedDate(row.submitted_at)}
                      </strong>
                    </div>
                  </div>

                  <div style={{ marginTop: "var(--space-2)" }}>
                    {renderRowActions(row)}
                    {renderFeedbackLine(row.id)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                tableLayout: "fixed",
                fontSize: "var(--text-xs)",
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid var(--color-border)",
                    textAlign: "left",
                    color: "var(--color-neutral-dark)",
                  }}
                >
                  <th style={{ padding: "10px 8px", width: "22%" }}>Student Name</th>
                  <th style={{ padding: "10px 8px", width: "12%" }}>Class</th>
                  <th style={{ padding: "10px 8px", width: "14%" }}>Board</th>
                  <th style={{ padding: "10px 8px", width: "18%" }}>Guardian Name</th>
                  <th style={{ padding: "10px 8px", width: "14%" }}>Submitted Date</th>
                  <th style={{ padding: "10px 8px", width: "20%" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row) => (
                  <tr
                    key={row.id}
                    style={{
                      borderBottom: "1px solid var(--color-border)",
                      verticalAlign: "top",
                    }}
                  >
                    <td style={{ padding: "12px 8px", wordBreak: "break-word" }}>
                      <div style={{ fontWeight: 600, color: "var(--color-primary)" }}>
                        {row.name}
                      </div>
                      <div style={{ color: "var(--color-neutral-dark)", marginTop: "2px" }}>
                        {row.identifier}
                      </div>
                    </td>
                    <td style={{ padding: "12px 8px", color: "var(--color-primary)" }}>
                      {resolveClassName(row)}
                    </td>
                    <td style={{ padding: "12px 8px", color: "var(--color-primary)" }}>
                      {resolveBoardName(row)}
                    </td>
                    <td style={{ padding: "12px 8px", wordBreak: "break-word", color: "var(--color-primary)" }}>
                      {row.guardian_name || "-"}
                    </td>
                    <td style={{ padding: "12px 8px", color: "var(--color-primary)" }}>
                      {formatSubmittedDate(row.submitted_at)}
                    </td>
                    <td style={{ padding: "12px 8px" }}>
                      {renderRowActions(row)}
                      {renderFeedbackLine(row.id)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : null}
      </Card>
    </div>
  );
}
