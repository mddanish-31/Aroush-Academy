"use client";

import React, { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { RegistrationRequest } from "@/lib/auth/authTypes";
import { StudentProfile } from "@/types";
import { SAMPLE_STUDENTS } from "@/data/enrollmentFeeData";
import { useDemoStorage, DEMO_STORAGE_KEYS } from "@/lib/demoStorage";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type FilterTab = "all" | "pending" | "approved" | "rejected";

export function RegistrationApprovalsModule() {
  const { registrationRequests, approveRegistration, rejectRegistration } = useAuth();

  // Academic student records for explicit identity matching
  const [students] = useDemoStorage<StudentProfile[]>(
    DEMO_STORAGE_KEYS.STUDENTS,
    SAMPLE_STUDENTS
  );

  const [activeTab, setActiveTab] = useState<FilterTab>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Review & Match modal state (Flow B)
  const [reviewModalReq, setReviewModalReq] = useState<RegistrationRequest | null>(null);
  const [matchedStudentId, setMatchedStudentId] = useState<string>("");

  // Reject confirmation modal state
  const [rejectModalReq, setRejectModalReq] = useState<RegistrationRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("Incomplete verification details. Please re-apply with required documents.");

  // Metric counts
  const counts = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    for (const req of registrationRequests) {
      if (req.status === "pending") pending++;
      else if (req.status === "approved") approved++;
      else if (req.status === "rejected") rejected++;
    }
    return {
      pending,
      approved,
      rejected,
      all: registrationRequests.length,
    };
  }, [registrationRequests]);

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return registrationRequests.filter((req) => {
      if (activeTab !== "all" && req.status !== activeTab) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = req.name.toLowerCase().includes(q);
        const matchId = req.identifier.toLowerCase().includes(q);
        const matchRole = req.role.toLowerCase().includes(q);
        const matchRef = req.id.toLowerCase().includes(q);
        const matchExtra = (req.classGrade || req.wardName || "").toLowerCase().includes(q);
        if (!matchName && !matchId && !matchRole && !matchRef && !matchExtra) {
          return false;
        }
      }
      return true;
    });
  }, [registrationRequests, activeTab, searchQuery]);

  // Open Review & Match Modal
  const openReviewModal = (req: RegistrationRequest) => {
    setReviewModalReq(req);
    setActionNotice(null);

    // Intelligent match suggestion based on applicant name or ward name
    const targetName = req.role === "parent" ? (req.wardName || req.name) : req.name;
    const cleanTarget = targetName.toLowerCase().trim();
    const candidate = students.find(
      (s) =>
        s.name.toLowerCase().includes(cleanTarget) ||
        cleanTarget.includes(s.name.toLowerCase()) ||
        (req.classGrade && s.classGrade.toLowerCase() === req.classGrade.toLowerCase())
    );

    setMatchedStudentId(req.linkedStudentId || candidate?.id || "");
  };

  const handleConfirmApproval = async () => {
    if (!reviewModalReq || processingId) return;
    const req = reviewModalReq;
    setProcessingId(req.id);
    setActionNotice(null);

    try {
      const res = await approveRegistration(
        req.id,
        matchedStudentId || undefined,
        matchedStudentId ? [matchedStudentId] : undefined
      );

      if (res.success) {
        const matched = students.find((s) => s.id === matchedStudentId);
        setActionNotice({
          type: "success",
          text: matched
            ? `Application for "${req.name}" approved and explicitly linked to academic record ${matched.name} (${matched.id.toUpperCase()}). The user may now sign in.`
            : `Application for "${req.name}" approved without academic record link (Requires Review). Portal access remains restricted until linked.`,
        });
        setReviewModalReq(null);
      } else {
        setActionNotice({
          type: "error",
          text: res.error || "Failed to approve registration request.",
        });
      }
    } catch {
      setActionNotice({
        type: "error",
        text: "An unexpected error occurred while processing registration approval.",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (req: RegistrationRequest) => {
    setRejectModalReq(req);
    setRejectionReason("Incomplete verification details. Please contact the front office.");
    setActionNotice(null);
  };

  const handleConfirmReject = async () => {
    if (!rejectModalReq || processingId) return;
    const req = rejectModalReq;
    setProcessingId(req.id);
    try {
      const res = await rejectRegistration(req.id, rejectionReason.trim());
      if (res.success) {
        setActionNotice({
          type: "success",
          text: `Application for "${req.name}" (${req.identifier}) has been rejected. Login access is blocked.`,
        });
        setRejectModalReq(null);
      } else {
        setActionNotice({
          type: "error",
          text: res.error || "Failed to reject registration request.",
        });
      }
    } catch {
      setActionNotice({
        type: "error",
        text: "An unexpected error occurred while rejecting registration.",
      });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      {/* Header and Summary Stats */}
      <Card padding="md">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "4px" }}>
              <h2 style={{ fontSize: "var(--text-lg)", margin: 0 }}>
                Applicant Registration &amp; Identity Matching
              </h2>
              <Badge variant="accent" size="sm">
                Administrative Gatekeeper (Flow B)
              </Badge>
            </div>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", margin: 0 }}>
              Review self-registration submissions, verify identity, and explicitly bind user accounts to official academic student records before granting portal access.
            </p>
          </div>
        </div>

        {/* Metric Summary Counters */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "var(--space-3)",
            borderTop: "1px solid var(--color-border)",
            paddingTop: "var(--space-4)",
          }}
        >
          <div
            onClick={() => setActiveTab("pending")}
            style={{
              padding: "var(--space-3)",
              borderRadius: "var(--radius-md)",
              backgroundColor: activeTab === "pending" ? "rgba(255, 149, 0, 0.12)" : "var(--color-surface-muted)",
              border: `1px solid ${activeTab === "pending" ? "var(--color-warning)" : "var(--color-border)"}`,
              cursor: "pointer",
              transition: "all var(--transition-fast)",
            }}
          >
            <div style={{ fontSize: "11px", color: "var(--color-neutral-dark)", fontWeight: 500 }}>
              Pending Review
            </div>
            <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--color-warning)", marginTop: "2px" }}>
              {counts.pending}
            </div>
          </div>

          <div
            onClick={() => setActiveTab("approved")}
            style={{
              padding: "var(--space-3)",
              borderRadius: "var(--radius-md)",
              backgroundColor: activeTab === "approved" ? "rgba(52, 199, 89, 0.12)" : "var(--color-surface-muted)",
              border: `1px solid ${activeTab === "approved" ? "var(--color-positive)" : "var(--color-border)"}`,
              cursor: "pointer",
              transition: "all var(--transition-fast)",
            }}
          >
            <div style={{ fontSize: "11px", color: "var(--color-neutral-dark)", fontWeight: 500 }}>
              Approved &amp; Linked
            </div>
            <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--color-positive)", marginTop: "2px" }}>
              {counts.approved}
            </div>
          </div>

          <div
            onClick={() => setActiveTab("rejected")}
            style={{
              padding: "var(--space-3)",
              borderRadius: "var(--radius-md)",
              backgroundColor: activeTab === "rejected" ? "rgba(255, 59, 48, 0.1)" : "var(--color-surface-muted)",
              border: `1px solid ${activeTab === "rejected" ? "#D32F2F" : "var(--color-border)"}`,
              cursor: "pointer",
              transition: "all var(--transition-fast)",
            }}
          >
            <div style={{ fontSize: "11px", color: "var(--color-neutral-dark)", fontWeight: 500 }}>
              Rejected Submissions
            </div>
            <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "#D32F2F", marginTop: "2px" }}>
              {counts.rejected}
            </div>
          </div>

          <div
            onClick={() => setActiveTab("all")}
            style={{
              padding: "var(--space-3)",
              borderRadius: "var(--radius-md)",
              backgroundColor: activeTab === "all" ? "var(--color-primary)" : "var(--color-surface-muted)",
              border: "1px solid var(--color-border)",
              color: activeTab === "all" ? "#fff" : "inherit",
              cursor: "pointer",
              transition: "all var(--transition-fast)",
            }}
          >
            <div style={{ fontSize: "11px", color: activeTab === "all" ? "rgba(255,255,255,0.8)" : "var(--color-neutral-dark)", fontWeight: 500 }}>
              Total Applications
            </div>
            <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, marginTop: "2px" }}>
              {counts.all}
            </div>
          </div>
        </div>
      </Card>

      {/* Action Notification Alert */}
      {actionNotice && (
        <div
          style={{
            backgroundColor: actionNotice.type === "success" ? "rgba(52, 199, 89, 0.1)" : "rgba(255, 59, 48, 0.1)",
            border: `1px solid ${actionNotice.type === "success" ? "rgba(52, 199, 89, 0.3)" : "rgba(255, 59, 48, 0.3)"}`,
            borderRadius: "var(--radius-md)",
            padding: "var(--space-3) var(--space-4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "var(--text-xs)",
            fontWeight: 500,
            color: actionNotice.type === "success" ? "var(--color-positive)" : "#D32F2F",
          }}
          role="status"
        >
          <span>{actionNotice.text}</span>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            style={{ border: "none", background: "none", cursor: "pointer", fontSize: "14px", color: "inherit" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter Tabs and Search Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-3)" }}>
        <div
          style={{
            display: "flex",
            gap: "var(--space-1)",
            backgroundColor: "var(--color-surface-muted)",
            padding: "3px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border)",
          }}
          role="tablist"
        >
          {(
            [
              { id: "pending", label: `Pending (${counts.pending})` },
              { id: "approved", label: `Approved (${counts.approved})` },
              { id: "rejected", label: `Rejected (${counts.rejected})` },
              { id: "all", label: `All (${counts.all})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "6px 12px",
                borderRadius: "var(--radius-sm)",
                border: "none",
                fontSize: "var(--text-xs)",
                fontWeight: activeTab === tab.id ? 600 : 400,
                backgroundColor: activeTab === tab.id ? "var(--color-surface)" : "transparent",
                color: activeTab === tab.id ? "var(--color-primary)" : "var(--color-neutral-dark)",
                boxShadow: activeTab === tab.id ? "var(--shadow-sm)" : "none",
                cursor: "pointer",
                transition: "all var(--transition-fast)",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search applicant name, email, or role..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: "1 1 240px",
            maxWidth: "360px",
            padding: "7px 12px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-surface)",
            fontSize: "var(--text-xs)",
            outline: "none",
          }}
        />
      </div>

      {/* Registrations List Table */}
      <div style={{ backgroundColor: "var(--color-surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "var(--text-xs)" }}>
            <thead>
              <tr style={{ backgroundColor: "var(--color-surface-muted)", borderBottom: "1px solid var(--color-border)" }}>
                <th style={{ padding: "10px 14px", fontWeight: 600 }}>Applicant</th>
                <th style={{ padding: "10px 14px", fontWeight: 600 }}>Contact Identifier</th>
                <th style={{ padding: "10px 14px", fontWeight: 600 }}>Role &amp; Scope</th>
                <th style={{ padding: "10px 14px", fontWeight: 600 }}>Linked Academic Record</th>
                <th style={{ padding: "10px 14px", fontWeight: 600 }}>Submitted On</th>
                <th style={{ padding: "10px 14px", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "10px 14px", fontWeight: 600, textAlign: "right" }}>Administrative Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "var(--space-10) var(--space-4)", textAlign: "center" }}>
                    <div style={{ fontSize: "28px", marginBottom: "var(--space-2)" }}>
                      {activeTab === "pending" ? "✓" : "🔍"}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--color-primary)", marginBottom: "4px" }}>
                      {activeTab === "pending"
                        ? "No Pending Registrations"
                        : "No Applications Found"}
                    </div>
                    <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", margin: 0 }}>
                      {activeTab === "pending"
                        ? "All submitted registration requests have been processed. New applicant submissions will appear here automatically."
                        : searchQuery.trim()
                        ? `No applications match the search term "${searchQuery}".`
                        : `There are currently no registration applications with status "${activeTab}".`}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const isProcessing = processingId === req.id;
                  const matchedStudent = req.linkedStudentId
                    ? students.find((s) => s.id === req.linkedStudentId)
                    : null;

                  return (
                    <tr
                      key={req.id}
                      style={{
                        borderBottom: "1px solid var(--color-border)",
                        transition: "background-color var(--transition-fast)",
                      }}
                    >
                      {/* Applicant Name & Ref */}
                      <td style={{ padding: "12px 14px", verticalAlign: "middle" }}>
                        <div style={{ fontWeight: 600, color: "var(--color-primary)" }}>
                          {req.name}
                        </div>
                        <div style={{ fontSize: "10px", color: "var(--color-neutral-dark)", fontFamily: "monospace" }}>
                          Ref: {req.id}
                        </div>
                      </td>

                      {/* Contact Identifier */}
                      <td style={{ padding: "12px 14px", verticalAlign: "middle" }}>
                        <div style={{ color: "var(--color-primary)", wordBreak: "break-all" }}>
                          {req.identifier}
                        </div>
                      </td>

                      {/* Role & Academic Details */}
                      <td style={{ padding: "12px 14px", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Badge
                            variant={req.role === "student" ? "accent" : "default"}
                            size="sm"
                          >
                            {req.role === "student" ? "Student" : "Parent"}
                          </Badge>
                          {req.classGrade && (
                            <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)" }}>
                              {req.classGrade}
                            </span>
                          )}
                          {req.wardName && (
                            <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)" }}>
                              Ward: {req.wardName}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Linked Academic Record */}
                      <td style={{ padding: "12px 14px", verticalAlign: "middle" }}>
                        {matchedStudent ? (
                          <div>
                            <Badge variant="success" size="sm">
                              {matchedStudent.id.toUpperCase()} &bull; {matchedStudent.name}
                            </Badge>
                            <div style={{ fontSize: "10px", color: "var(--color-neutral-dark)", marginTop: "2px" }}>
                              {matchedStudent.classGrade} ({matchedStudent.board})
                            </div>
                          </div>
                        ) : req.status === "approved" ? (
                          <Badge variant="warning" size="sm">
                            Unlinked (Requires Review)
                          </Badge>
                        ) : (
                          <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)" }}>
                            Pending Match
                          </span>
                        )}
                      </td>

                      {/* Submitted On */}
                      <td style={{ padding: "12px 14px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                        <div style={{ color: "var(--color-neutral-dark)" }}>
                          {req.submittedAt}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td style={{ padding: "12px 14px", verticalAlign: "middle" }}>
                        {req.status === "pending" && (
                          <Badge variant="warning" size="sm">
                            Pending Review
                          </Badge>
                        )}
                        {req.status === "approved" && (
                          <div>
                            <Badge variant="success" size="sm">
                              Approved
                            </Badge>
                            {req.reviewedAt && (
                              <div style={{ fontSize: "10px", color: "var(--color-neutral-dark)", marginTop: "2px" }}>
                                {req.reviewedAt}
                              </div>
                            )}
                          </div>
                        )}
                        {req.status === "rejected" && (
                          <div>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "2px 8px",
                                borderRadius: "var(--radius-sm)",
                                fontSize: "11px",
                                fontWeight: 600,
                                backgroundColor: "rgba(255, 59, 48, 0.12)",
                                color: "#D32F2F",
                                border: "1px solid rgba(255, 59, 48, 0.25)",
                              }}
                            >
                              Rejected
                            </span>
                            {req.rejectionReason && (
                              <div
                                style={{
                                  fontSize: "10px",
                                  color: "var(--color-neutral-dark)",
                                  marginTop: "2px",
                                  maxWidth: "200px",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                                title={req.rejectionReason}
                              >
                                {req.rejectionReason}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Administrative Actions */}
                      <td style={{ padding: "12px 14px", verticalAlign: "middle", textAlign: "right" }}>
                        {req.status === "pending" ? (
                          <div style={{ display: "inline-flex", gap: "var(--space-2)", alignItems: "center" }}>
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              disabled={isProcessing}
                              onClick={() => openReviewModal(req)}
                              style={{ padding: "4px 10px", fontSize: "11px" }}
                            >
                              Review &amp; Match
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              disabled={isProcessing}
                              onClick={() => openRejectModal(req)}
                              style={{
                                padding: "4px 10px",
                                fontSize: "11px",
                                color: "#D32F2F",
                                borderColor: "rgba(255, 59, 48, 0.3)",
                              }}
                            >
                              Reject
                            </Button>
                          </div>
                        ) : req.status === "approved" ? (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => openReviewModal(req)}
                            style={{ padding: "3px 8px", fontSize: "10px" }}
                          >
                            Edit Link
                          </Button>
                        ) : (
                          <span style={{ fontSize: "11px", color: "#D32F2F", fontWeight: 500 }}>
                            Sign-In Blocked
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- REVIEW & IDENTITY MATCHING MODAL (Flow B) --- */}
      {reviewModalReq && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 110,
            padding: "var(--space-4)",
          }}
        >
          <div
            style={{
              backgroundColor: "var(--color-surface)",
              borderRadius: "var(--radius-xl)",
              maxWidth: "560px",
              width: "100%",
              padding: "var(--space-6)",
              border: "1px solid var(--color-border)",
              boxShadow: "var(--shadow-xl)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
              <div>
                <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, margin: 0 }}>
                  Review Applicant &amp; Bind Academic Record
                </h3>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)" }}>
                  Flow B: Validate applicant identity before approving portal access.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setReviewModalReq(null)}
                style={{ border: "none", background: "none", cursor: "pointer", fontSize: "18px" }}
              >
                ✕
              </button>
            </div>

            {/* Applicant Summary Card */}
            <div
              style={{
                padding: "var(--space-3) var(--space-4)",
                backgroundColor: "var(--color-surface-muted)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                marginBottom: "var(--space-4)",
                fontSize: "var(--text-xs)",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <div><strong>Applicant Name:</strong> {reviewModalReq.name}</div>
              <div><strong>Email / Phone:</strong> {reviewModalReq.identifier}</div>
              <div><strong>Requested Portal:</strong> {reviewModalReq.role === "student" ? "Student Portal" : "Parent Portal"}</div>
              {reviewModalReq.classGrade && <div><strong>Grade / Level:</strong> {reviewModalReq.classGrade}</div>}
              {reviewModalReq.wardName && <div><strong>Stated Ward Name:</strong> {reviewModalReq.wardName}</div>}
            </div>

            {/* Record Matcher Dropdown */}
            <div style={{ marginBottom: "var(--space-4)" }}>
              <label style={{ fontSize: "var(--text-xs)", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                Select Matching Academic Student Record *
              </label>
              <select
                value={matchedStudentId}
                onChange={(e) => setMatchedStudentId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border)",
                  fontSize: "var(--text-xs)",
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-primary)",
                  boxSizing: "border-box",
                }}
              >
                <option value="">-- No Match (Keep Unlinked / Requires Review) --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.id.toUpperCase()} &bull; {s.classGrade} &bull; {s.board})
                  </option>
                ))}
              </select>

              {matchedStudentId ? (
                <div style={{ marginTop: "8px", padding: "8px 12px", backgroundColor: "rgba(52, 199, 89, 0.08)", border: "1px solid rgba(52, 199, 89, 0.25)", borderRadius: "var(--radius-sm)", fontSize: "11px", color: "var(--color-positive)" }}>
                  ✓ This account will be securely bound to <strong>{students.find((s) => s.id === matchedStudentId)?.name} ({matchedStudentId.toUpperCase()})</strong>. Portal sign-in will exclusively resolve this student&apos;s records.
                </div>
              ) : (
                <div style={{ marginTop: "8px", padding: "8px 12px", backgroundColor: "rgba(255, 149, 0, 0.08)", border: "1px solid rgba(255, 149, 0, 0.3)", borderRadius: "var(--radius-sm)", fontSize: "11px", color: "var(--color-warning)" }}>
                  ⚠️ Notice: If approved without an academic student link, this account cannot access personal student modules. It will remain in &quot;Requires Review&quot; state until linked.
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", borderTop: "1px solid var(--color-border)", paddingTop: "var(--space-3)" }}>
              <Button type="button" variant="secondary" size="sm" onClick={() => setReviewModalReq(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={processingId !== null}
                onClick={handleConfirmApproval}
              >
                {processingId ? "Processing..." : matchedStudentId ? "Approve & Bind Record" : "Approve Unlinked"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- REJECTION CONFIRMATION MODAL --- */}
      {rejectModalReq && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 110,
            padding: "var(--space-4)",
          }}
        >
          <div
            style={{
              backgroundColor: "var(--color-surface)",
              borderRadius: "var(--radius-xl)",
              maxWidth: "460px",
              width: "100%",
              padding: "var(--space-6)",
              border: "1px solid var(--color-border)",
              boxShadow: "var(--shadow-xl)",
            }}
          >
            <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, margin: "0 0 var(--space-2) 0", color: "#D32F2F" }}>
              Reject Registration Application
            </h3>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", margin: "0 0 var(--space-4) 0" }}>
              Are you sure you want to reject the application for <strong>{rejectModalReq.name}</strong> ({rejectModalReq.identifier})? Login access will be strictly blocked.
            </p>
            <div style={{ marginBottom: "var(--space-4)" }}>
              <label style={{ fontSize: "11px", fontWeight: 600, display: "block", marginBottom: "4px" }}>
                Reason for Rejection
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  fontSize: "var(--text-xs)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border)",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)" }}>
              <Button type="button" variant="secondary" size="sm" onClick={() => setRejectModalReq(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleConfirmReject}
                style={{ backgroundColor: "#D32F2F", borderColor: "#D32F2F" }}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
