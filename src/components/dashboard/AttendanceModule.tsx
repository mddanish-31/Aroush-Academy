"use client";

import React, { useState, useMemo } from "react";
import { UserRole, AttendanceRecord } from "@/types";
import { SAMPLE_ATTENDANCE } from "@/data/dashboardModulesData";
import { SAMPLE_STUDENTS } from "@/data/enrollmentFeeData";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useDemoStorage, DEMO_STORAGE_KEYS } from "@/lib/demoStorage";

interface AttendanceModuleProps {
  role: UserRole;
  currentTeacherId?: string;
  currentStudentId?: string;
}

export function AttendanceModule({
  role,
  currentTeacherId = "tch-azhar",
  currentStudentId = "std-101",
}: AttendanceModuleProps) {
  const [records, setRecords] = useDemoStorage<AttendanceRecord[]>(
    DEMO_STORAGE_KEYS.ATTENDANCE,
    SAMPLE_ATTENDANCE
  );
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Modal State for Teacher / Admin marking attendance
  const [isMarkModalOpen, setIsMarkModalOpen] = useState(false);
  const [markStudentId, setMarkStudentId] = useState(SAMPLE_STUDENTS[0].id);
  const [markSubject, setMarkSubject] = useState("Mathematics");
  const [markStatus, setMarkStatus] = useState<"present" | "absent" | "excused">("present");
  const [markRemarks, setMarkRemarks] = useState("");
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);

  React.useEffect(() => {
    if (!isMarkModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMarkModalOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMarkModalOpen]);

  // Role-isolated filtering
  const visibleRecords = useMemo(() => {
    return records.filter((r) => {
      if (role === "teacher" && r.teacherId !== currentTeacherId) return false;
      if ((role === "student" || role === "parent") && r.studentId !== currentStudentId) return false;
      if (filterSubject !== "all" && r.subject !== filterSubject) return false;
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      return true;
    });
  }, [records, role, currentTeacherId, currentStudentId, filterSubject, filterStatus]);

  // Statistics calculation
  const totalClasses = visibleRecords.length;
  const presentCount = visibleRecords.filter((r) => r.status === "present").length;
  const excusedCount = visibleRecords.filter((r) => r.status === "excused").length;
  const attendanceRate = totalClasses > 0 ? Math.round(((presentCount + excusedCount) / totalClasses) * 100) : 100;

  const handleMarkAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    const student = SAMPLE_STUDENTS.find((s) => s.id === markStudentId);
    if (!student) return;

    const newRec: AttendanceRecord = {
      id: `att-new-${Date.now()}`,
      studentId: markStudentId,
      studentName: student.name,
      subject: markSubject,
      batch: student.classGrade === "Class X" ? "Batch Alpha (Class IX-X)" : "Batch Higher Secondary (Class XI-XII)",
      date: new Date().toISOString().split("T")[0],
      status: markStatus,
      teacherId: currentTeacherId,
      remarks: markRemarks.trim() || undefined,
    };

    setRecords((prev) => [newRec, ...prev]);
    setIsMarkModalOpen(false);
    setMarkRemarks("");
    setActionSuccessNotice(`Marked ${student.name} as ${markStatus.toUpperCase()} for ${markSubject} in session record.`);
    setTimeout(() => setActionSuccessNotice(null), 5000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      {/* Top Header Card */}
      <Card padding="md">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-3)" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "4px" }}>
              <h2 style={{ fontSize: "var(--text-lg)" }}>
                {role === "parent" ? "Ward's Attendance Tracker" : role === "student" ? "My Class Attendance" : "Session Attendance Roster"}
              </h2>
              <Badge variant="accent" size="sm">
                {role === "teacher" ? "Faculty Scope" : role === "student" ? "Student Scope" : role === "parent" ? "Guardian Scope" : "Academy-Wide"}
              </Badge>
            </div>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)" }}>
              {role === "parent"
                ? "Verified session attendance records for linked ward Taha Rahman (AA-2026-101)."
                : role === "student"
                ? "Physical & classroom attendance history across all enrolled subjects."
                : "Real-time session attendance logging and automated monthly compliance metrics."}
            </p>
          </div>

          {(role === "teacher" || role === "academy-admin") && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsMarkModalOpen(true)}
            >
              + Mark Session Attendance
            </Button>
          )}
        </div>

        {/* Attendance Summary Metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "var(--space-3)", marginTop: "var(--space-4)" }}>
          <div style={{ padding: "var(--space-3)", backgroundColor: "var(--color-surface-muted)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
            <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)", textTransform: "uppercase" }}>Attendance Rate</span>
            <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: attendanceRate >= 85 ? "var(--color-success)" : "var(--color-warning)", marginTop: "2px" }}>
              {attendanceRate}%
            </div>
            <span style={{ fontSize: "10px", color: "var(--color-neutral-dark)" }}>Target: $\ge$ 80%</span>
          </div>
          <div style={{ padding: "var(--space-3)", backgroundColor: "var(--color-surface-muted)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
            <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)", textTransform: "uppercase" }}>Recorded Sessions</span>
            <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--color-primary)", marginTop: "2px" }}>
              {totalClasses} Classes
            </div>
            <span style={{ fontSize: "10px", color: "var(--color-neutral-dark)" }}>October 2026</span>
          </div>
          <div style={{ padding: "var(--space-3)", backgroundColor: "var(--color-surface-muted)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
            <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)", textTransform: "uppercase" }}>Present Sessions</span>
            <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--color-success)", marginTop: "2px" }}>
              {presentCount} Present
            </div>
            <span style={{ fontSize: "10px", color: "var(--color-neutral-dark)" }}>{excusedCount} Excused Leaves</span>
          </div>
        </div>
      </Card>

      {/* Success Notice Banner */}
      {actionSuccessNotice && (
        <div
          style={{
            backgroundColor: "rgba(52, 199, 89, 0.1)",
            border: "1px solid rgba(52, 199, 89, 0.3)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-3)",
            fontSize: "var(--text-xs)",
            color: "var(--color-primary)",
          }}
          role="status"
        >
          ✓ {actionSuccessNotice} (Stored in local demo session state)
        </div>
      )}

      {/* Filter Strip */}
      <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", fontWeight: 500 }}>Subject:</span>
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            style={{ fontSize: "var(--text-xs)", padding: "4px 8px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)" }}
          >
            <option value="all">All Subjects</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Physics">Physics</option>
            <option value="Chemistry">Chemistry</option>
            <option value="Accountancy">Accountancy</option>
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", fontWeight: 500 }}>Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ fontSize: "var(--text-xs)", padding: "4px 8px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)" }}
          >
            <option value="all">All Statuses</option>
            <option value="present">Present Only</option>
            <option value="absent">Absent Only</option>
            <option value="excused">Excused Only</option>
          </select>
        </div>
      </div>

      {/* Attendance Records Table */}
      <div style={{ backgroundColor: "var(--color-surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "var(--text-xs)" }}>
            <thead>
              <tr style={{ backgroundColor: "var(--color-surface-muted)", borderBottom: "1px solid var(--color-border)" }}>
                <th style={{ padding: "10px 14px", fontWeight: 600 }}>Date</th>
                <th style={{ padding: "10px 14px", fontWeight: 600 }}>Student Name</th>
                <th style={{ padding: "10px 14px", fontWeight: 600 }}>Subject &amp; Batch</th>
                <th style={{ padding: "10px 14px", fontWeight: 600 }}>Attendance Status</th>
                <th style={{ padding: "10px 14px", fontWeight: 600 }}>Session Notes</th>
              </tr>
            </thead>
            <tbody>
              {visibleRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--color-neutral-dark)" }}>
                    No attendance records match the selected filters.
                  </td>
                </tr>
              ) : (
                visibleRecords.map((r) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "10px 14px", whiteSpace: "nowrap", fontWeight: 500 }}>
                      {r.date}
                    </td>
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: "var(--color-primary)" }}>
                      {r.studentName}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ fontWeight: 600 }}>{r.subject}</span>
                      <span style={{ display: "block", fontSize: "10px", color: "var(--color-neutral-dark)" }}>{r.batch}</span>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      {r.status === "present" ? (
                        <Badge variant="success" size="sm">Present</Badge>
                      ) : r.status === "excused" ? (
                        <Badge variant="neutral" size="sm">Excused</Badge>
                      ) : (
                        <Badge variant="warning" size="sm">Absent</Badge>
                      )}
                    </td>
                    <td style={{ padding: "10px 14px", color: "var(--color-neutral-dark)" }}>
                      {r.remarks || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MARK ATTENDANCE MODAL */}
      {isMarkModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsMarkModalOpen(false);
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
            zIndex: 100,
            padding: "var(--space-4)",
          }}
          role="dialog"
          aria-modal="true"
        >
          <div style={{ backgroundColor: "var(--color-surface)", borderRadius: "var(--radius-lg)", maxWidth: "480px", width: "100%", padding: "var(--space-6)", boxShadow: "var(--shadow-lg)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
              <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700 }}>Mark Session Attendance</h3>
              <button onClick={() => setIsMarkModalOpen(false)} style={{ fontSize: "18px", color: "var(--color-neutral-dark)", cursor: "pointer" }}>✕</button>
            </div>

            <form onSubmit={handleMarkAttendance}>
              <div style={{ marginBottom: "var(--space-3)" }}>
                <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "4px" }}>Select Student:</label>
                <select
                  value={markStudentId}
                  onChange={(e) => setMarkStudentId(e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "var(--text-xs)" }}
                >
                  {SAMPLE_STUDENTS.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.classGrade})</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "var(--space-3)" }}>
                <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "4px" }}>Subject:</label>
                <select
                  value={markSubject}
                  onChange={(e) => setMarkSubject(e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "var(--text-xs)" }}
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Accountancy">Accountancy</option>
                </select>
              </div>

              <div style={{ marginBottom: "var(--space-3)" }}>
                <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "4px" }}>Status:</label>
                <div style={{ display: "flex", gap: "var(--space-2)" }}>
                  {(["present", "absent", "excused"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setMarkStatus(st)}
                      style={{
                        flex: 1,
                        padding: "8px",
                        borderRadius: "var(--radius-sm)",
                        border: `1px solid ${markStatus === st ? "var(--color-primary)" : "var(--color-border)"}`,
                        backgroundColor: markStatus === st ? "var(--color-primary)" : "var(--color-surface)",
                        color: markStatus === st ? "#FFFFFF" : "var(--color-primary)",
                        textTransform: "capitalize",
                        fontSize: "var(--text-xs)",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: "var(--space-4)" }}>
                <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "4px" }}>Session Notes / Remarks (Optional):</label>
                <input
                  type="text"
                  value={markRemarks}
                  onChange={(e) => setMarkRemarks(e.target.value)}
                  placeholder="e.g. Completed Chapter 4 practice sheet"
                  style={{ width: "100%", padding: "8px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "var(--text-xs)" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)" }}>
                <Button type="button" variant="secondary" size="sm" onClick={() => setIsMarkModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Save Attendance
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
