"use client";
import { Check, X } from "lucide-react";

import React, { useState, useMemo } from "react";
import { UserRole, AttendanceRecord, StudentProfile, TeacherProfile, SubjectEnrollment } from "@/types";
import { SAMPLE_ATTENDANCE } from "@/data/dashboardModulesData";
import { SAMPLE_STUDENTS, SAMPLE_TEACHERS, SAMPLE_ENROLLMENTS } from "@/data/enrollmentFeeData";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useDemoStorage, DEMO_STORAGE_KEYS } from "@/lib/demoStorage";
import { recordCreate, recordUpdate } from "@/lib/auditService";

interface AttendanceModuleProps {
  role: UserRole;
  currentTeacherId?: string;
  currentStudentId?: string;
}

function getTodayLocalDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function AttendanceModule({
  role,
  currentTeacherId = "tch-azhar",
  currentStudentId = "std-101",
}: AttendanceModuleProps) {
  const [records, setRecords] = useDemoStorage<AttendanceRecord[]>(
    DEMO_STORAGE_KEYS.ATTENDANCE,
    SAMPLE_ATTENDANCE,
  );
  const [students] = useDemoStorage<StudentProfile[]>(
    DEMO_STORAGE_KEYS.STUDENTS,
    SAMPLE_STUDENTS,
  );
  const [enrollments] = useDemoStorage<SubjectEnrollment[]>(
    DEMO_STORAGE_KEYS.ENROLLMENTS,
    SAMPLE_ENROLLMENTS,
  );
  const [faculty] = useDemoStorage<TeacherProfile[]>(
    DEMO_STORAGE_KEYS.FACULTY,
    SAMPLE_TEACHERS,
  );

  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  
  const teacherEnrollments = useMemo(() => {
    if (role === "teacher") {
      return enrollments.filter((e) => e.teacherId === currentTeacherId);
    }
    return enrollments;
  }, [enrollments, role, currentTeacherId]);

  const selectableStudents = useMemo(() => {
    if (role === "teacher") {
      const studentIds = new Set(teacherEnrollments.map((e) => e.studentId));
      return students.filter((s) => studentIds.has(s.id));
    }
    return students;
  }, [students, role, teacherEnrollments]);

  const availableSubjects = useMemo(() => {
    if (role === "teacher") {
      const activeTeacher = faculty.find((t) => t.id === currentTeacherId);
      if (activeTeacher && activeTeacher.assignedSubjects.length > 0) {
        return activeTeacher.assignedSubjects;
      }
      const subjSet = new Set(teacherEnrollments.map((e) => e.subjectName));
      return subjSet.size > 0 ? Array.from(subjSet) : ["Mathematics"];
    }
    const allSubjSet = new Set(enrollments.map((e) => e.subjectName));
    return allSubjSet.size > 0 ? Array.from(allSubjSet) : ["Mathematics", "Physics", "Chemistry", "Accountancy"];
  }, [role, faculty, currentTeacherId, teacherEnrollments, enrollments]);

  
  const [isMarkModalOpen, setIsMarkModalOpen] = useState(false);
  const [markDate, setMarkDate] = useState<string>(getTodayLocalDate());
  const [markStudentId, setMarkStudentId] = useState(students[0]?.id || "std-101");
  const [markSubject, setMarkSubject] = useState("Mathematics");
  const [markStatus, setMarkStatus] = useState<
    "present" | "absent" | "excused"
  >("present");
  const [markRemarks, setMarkRemarks] = useState("");
  const [markError, setMarkError] = useState<string | null>(null);
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(
    null,
  );

  
  const [editRecord, setEditRecord] = useState<AttendanceRecord | null>(null);
  const [editStatus, setEditStatus] = useState<"present" | "absent">("present");
  const [editDate, setEditDate] = useState<string>("");
  const [editError, setEditError] = useState<string | null>(null);

  React.useEffect(() => {
    if (!isMarkModalOpen && !editRecord) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMarkModalOpen(false);
        setMarkError(null);
        setEditRecord(null);
        setEditError(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMarkModalOpen, editRecord]);

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRecord) return;
    setEditError(null);

    const targetDate = (editDate || editRecord.date).trim();
    if (!targetDate) {
      setEditError("Please select a valid attendance date.");
      return;
    }

    
    const isDuplicate = records.some(
      (rec) =>
        rec.id !== editRecord.id &&
        rec.studentId === editRecord.studentId &&
        rec.batch === editRecord.batch &&
        rec.subject.toLowerCase() === editRecord.subject.toLowerCase() &&
        rec.date === targetDate,
    );

    if (isDuplicate) {
      setEditError(
        `Duplicate record: Attendance is already recorded for this session on ${targetDate}.`,
      );
      return;
    }

    const now = new Date().toISOString();
    setRecords((prev) =>
      prev.map((rec) =>
        rec.id === editRecord.id
          ? {
              ...rec,
              date: targetDate,
              status: editStatus,
              updatedAt: now,
            }
          : rec,
      ),
    );

    recordUpdate({
      action: "Update Attendance Record",
      type: "enrollment",
      target: `${editRecord.studentName} · ${editRecord.subject} (${editRecord.batch})`,
      details: `Updated attendance status for ${editRecord.studentName} from ${editRecord.status.toUpperCase()} to ${editStatus.toUpperCase()} on ${targetDate}.`,
      performedBy: role === "academy-admin" ? "Academy Administrator" : "Faculty Teacher",
      actorRole: role,
      entityType: "attendance",
      entityId: editRecord.id,
      outcome: "SUCCESS",
      changedFields: ["status", "date"],
      diff: [
        { fieldName: "status", before: editRecord.status, after: editStatus },
        { fieldName: "date", before: editRecord.date, after: targetDate },
      ],
      sourcePortal: role,
    });

    setActionSuccessNotice(
      `Updated attendance for ${editRecord.studentName} to ${editStatus.toUpperCase()}${targetDate !== editRecord.date ? ` on ${targetDate}` : ""}.`,
    );
    setEditRecord(null);
    setEditError(null);
    setTimeout(() => setActionSuccessNotice(null), 4000);
  };

  
  const visibleRecords = useMemo(() => {
    return records.filter((r) => {
      if (role === "teacher" && r.teacherId !== currentTeacherId) return false;
      if (
        (role === "student" || role === "parent") &&
        (!currentStudentId || r.studentId !== currentStudentId)
      )
        return false;
      if (filterSubject !== "all" && r.subject !== filterSubject) return false;
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      return true;
    });
  }, [
    records,
    role,
    currentTeacherId,
    currentStudentId,
    filterSubject,
    filterStatus,
  ]);

  
  const totalClasses = visibleRecords.length;
  const presentCount = visibleRecords.filter(
    (r) => r.status === "present",
  ).length;
  const excusedCount = visibleRecords.filter(
    (r) => r.status === "excused",
  ).length;
  const attendanceRate =
    totalClasses > 0
      ? Math.round(((presentCount + excusedCount) / totalClasses) * 100)
      : 0;

  const handleMarkAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    setMarkError(null);
    const student = students.find((s) => s.id === markStudentId);
    if (!student) return;

    const trimmedDate = markDate.trim();
    if (!trimmedDate) {
      setMarkError("Please select a valid attendance session date.");
      return;
    }

    const matchedEnrollment = enrollments.find(
      (enr) =>
        enr.studentId === markStudentId &&
        enr.subjectName.toLowerCase() === markSubject.toLowerCase(),
    );
    const batch =
      matchedEnrollment?.batchName ||
      (student.classGrade === "Class X"
        ? "Batch Alpha (Class IX-X)"
        : "Batch Higher Secondary (Class XI-XII)");

    
    const isDuplicate = records.some(
      (r) =>
        r.studentId === markStudentId &&
        r.batch === batch &&
        r.subject.toLowerCase() === markSubject.toLowerCase() &&
        r.date === trimmedDate,
    );

    if (isDuplicate) {
      setMarkError(
        `Duplicate record: Attendance is already marked for ${student.name} in ${markSubject} (${batch}) on ${trimmedDate}.`,
      );
      return;
    }

    const newRec: AttendanceRecord = {
      id: `att-new-${Date.now()}`,
      studentId: markStudentId,
      studentName: student.name,
      subject: markSubject,
      batch,
      date: trimmedDate,
      status: markStatus,
      teacherId: currentTeacherId,
      remarks: markRemarks.trim() || undefined,
    };

    setRecords((prev) => [newRec, ...prev]);

    recordCreate({
      action: "Mark Attendance",
      type: "enrollment",
      target: `${student.name} · ${markSubject} (${batch})`,
      details: `Marked attendance for ${student.name} as ${markStatus.toUpperCase()} in ${markSubject} (${batch}) on ${trimmedDate}.${markRemarks.trim() ? ` Remarks: ${markRemarks.trim()}` : ""}`,
      performedBy: role === "academy-admin" ? "Academy Administrator" : "Faculty Teacher",
      actorRole: role,
      entityType: "attendance",
      entityId: newRec.id,
      outcome: "SUCCESS",
      changedFields: ["status", "date", "subject", "batch"],
      sourcePortal: role,
    });

    setIsMarkModalOpen(false);
    setMarkRemarks("");
    setMarkError(null);
    setActionSuccessNotice(
      `Marked ${student.name} as ${markStatus.toUpperCase()} for ${markSubject} on ${trimmedDate}.`,
    );
    setTimeout(() => setActionSuccessNotice(null), 5000);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-6)",
      }}
    >
      {actionSuccessNotice && (
        <div
          style={{
            padding: "10px 16px",
            backgroundColor: "var(--color-success-bg)",
            color: "var(--color-success)",
            border: "1px solid var(--color-success-border)",
            borderRadius: "var(--radius-md)",
            fontSize: "var(--text-xs)",
            fontWeight: 600,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{actionSuccessNotice}</span>
          <button
            type="button"
            onClick={() => setActionSuccessNotice(null)}
            aria-label="Dismiss notice"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              color: "inherit",
              padding: "0 4px",
            }}
          >
            &times;
          </button>
        </div>
      )}

      <Card padding="md">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "var(--space-3)",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
                marginBottom: "4px",
              }}
            >
              <h2 style={{ fontSize: "var(--text-lg)" }}>
                {role === "parent"
                  ? "Ward's Attendance Tracker"
                  : role === "student"
                    ? "My Class Attendance"
                    : "Session Attendance Roster"}
              </h2>
              <Badge variant="accent" size="sm">
                {role === "teacher"
                  ? "Faculty Scope"
                  : role === "student"
                    ? "Student Scope"
                    : role === "parent"
                      ? "Guardian Scope"
                      : "Academy-Wide"}
              </Badge>
            </div>
            <p
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--color-neutral-dark)",
              }}
            >
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
              onClick={() => {
                setMarkError(null);
                setIsMarkModalOpen(true);
              }}
            >
              + Mark Session Attendance
            </Button>
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "var(--space-3)",
            marginTop: "var(--space-4)",
          }}
        >
          <div
            style={{
              padding: "var(--space-3)",
              backgroundColor: "var(--color-surface-muted)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                color: "var(--color-neutral-dark)",
                textTransform: "uppercase",
              }}
            >
              Attendance Rate
            </span>
            <div
              style={{
                fontSize: "var(--text-xl)",
                fontWeight: 700,
                color:
                  attendanceRate >= 85
                    ? "var(--color-success)"
                    : "var(--color-warning)",
                marginTop: "2px",
              }}
            >
              {attendanceRate}%
            </div>
            <span
              style={{ fontSize: "10px", color: "var(--color-neutral-dark)" }}
            >
              Target: $\ge$ 80%
            </span>
          </div>
          <div
            style={{
              padding: "var(--space-3)",
              backgroundColor: "var(--color-surface-muted)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                color: "var(--color-neutral-dark)",
                textTransform: "uppercase",
              }}
            >
              Recorded Sessions
            </span>
            <div
              style={{
                fontSize: "var(--text-xl)",
                fontWeight: 700,
                color: "var(--color-primary)",
                marginTop: "2px",
              }}
            >
              {totalClasses} Classes
            </div>
            <span
              style={{ fontSize: "10px", color: "var(--color-neutral-dark)" }}
            >
              October 2026
            </span>
          </div>
          <div
            style={{
              padding: "var(--space-3)",
              backgroundColor: "var(--color-surface-muted)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                color: "var(--color-neutral-dark)",
                textTransform: "uppercase",
              }}
            >
              Present Sessions
            </span>
            <div
              style={{
                fontSize: "var(--text-xl)",
                fontWeight: 700,
                color: "var(--color-success)",
                marginTop: "2px",
              }}
            >
              {presentCount} Present
            </div>
            <span
              style={{ fontSize: "10px", color: "var(--color-neutral-dark)" }}
            >
              {excusedCount} Excused Leaves
            </span>
          </div>
        </div>
      </Card>

      {actionSuccessNotice && (
        <div
          style={{
            backgroundColor: "var(--color-success-bg)",
            border: "1px solid var(--color-success-border)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-3)",
            fontSize: "var(--text-xs)",
            color: "var(--color-primary)",
          }}
          role="status"
        >
          <Check size={14} style={{ display: "inline-block", verticalAlign: "middle", marginRight: "4px" }} /> {actionSuccessNotice} (Stored in local demo session state)
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: "var(--space-3)",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
          }}
        >
          <span
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--color-neutral-dark)",
              fontWeight: 500,
            }}
          >
            Subject:
          </span>
          <select
            aria-label="Filter by subject"
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            style={{
              fontSize: "var(--text-xs)",
              padding: "4px 8px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-surface)",
            }}
          >
            <option value="all">All Subjects</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Physics">Physics</option>
            <option value="Chemistry">Chemistry</option>
            <option value="Accountancy">Accountancy</option>
          </select>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
          }}
        >
          <span
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--color-neutral-dark)",
              fontWeight: 500,
            }}
          >
            Status:
          </span>
          <select
            aria-label="Filter by status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              fontSize: "var(--text-xs)",
              padding: "4px 8px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-surface)",
            }}
          >
            <option value="all">All Statuses</option>
            <option value="present">Present Only</option>
            <option value="absent">Absent Only</option>
            <option value="excused">Excused Only</option>
          </select>
        </div>
      </div>

      <div
        style={{
          backgroundColor: "var(--color-surface)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--color-border)",
          overflow: "hidden",
        }}
      >
        <div tabIndex={0} role="region" aria-label="Attendance records table" style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
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
                }}
              >
                <th style={{ padding: "10px 14px", fontWeight: 600 }}>Date</th>
                <th style={{ padding: "10px 14px", fontWeight: 600 }}>
                  Student Name
                </th>
                <th style={{ padding: "10px 14px", fontWeight: 600 }}>
                  Subject &amp; Batch
                </th>
                <th style={{ padding: "10px 14px", fontWeight: 600 }}>
                  Attendance Status
                </th>
                <th style={{ padding: "10px 14px", fontWeight: 600 }}>
                  Session Notes
                </th>
                {(role === "academy-admin" || role === "teacher") && (
                  <th
                    style={{
                      padding: "10px 14px",
                      fontWeight: 600,
                      textAlign: "right",
                    }}
                  >
                    Action
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {visibleRecords.length === 0 ? (
                <tr>
                  <td
                    colSpan={
                      role === "academy-admin" || role === "teacher" ? 6 : 5
                    }
                    style={{
                      padding: "var(--space-8)",
                      textAlign: "center",
                      color: "var(--color-neutral-dark)",
                    }}
                  >
                    No attendance records match the selected filters.
                  </td>
                </tr>
              ) : (
                visibleRecords.map((r) => (
                  <tr
                    key={r.id}
                    style={{ borderBottom: "1px solid var(--color-border)" }}
                  >
                    <td
                      style={{
                        padding: "10px 14px",
                        whiteSpace: "nowrap",
                        fontWeight: 500,
                      }}
                    >
                      {r.date}
                    </td>
                    <td
                      style={{
                        padding: "10px 14px",
                        fontWeight: 600,
                        color: "var(--color-primary)",
                      }}
                    >
                      {r.studentName}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ fontWeight: 600 }}>{r.subject}</span>
                      <span
                        style={{
                          display: "block",
                          fontSize: "10px",
                          color: "var(--color-neutral-dark)",
                        }}
                      >
                        {r.batch}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      {r.status === "present" ? (
                        <Badge variant="success" size="sm">
                          Present
                        </Badge>
                      ) : r.status === "excused" ? (
                        <Badge variant="neutral" size="sm">
                          Excused
                        </Badge>
                      ) : (
                        <Badge variant="warning" size="sm">
                          Absent
                        </Badge>
                      )}
                    </td>
                    <td
                      style={{
                        padding: "10px 14px",
                        color: "var(--color-neutral-dark)",
                      }}
                    >
                      {r.remarks || "-"}
                    </td>
                    {(role === "academy-admin" || role === "teacher") && (
                      <td style={{ padding: "10px 14px", textAlign: "right" }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setEditRecord(r);
                            setEditStatus(
                              r.status === "absent" ? "absent" : "present",
                            );
                            setEditDate(r.date);
                            setEditError(null);
                          }}
                        >
                          Edit
                        </Button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
            backgroundColor: "var(--color-overlay)",
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
          <div
            style={{
              backgroundColor: "var(--color-surface)",
              borderRadius: "var(--radius-lg)",
              maxWidth: "480px",
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
              <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700 }}>
                Mark Session Attendance
              </h3>
              <button
                onClick={() => setIsMarkModalOpen(false)}
                aria-label="Close modal"
                style={{
                  fontSize: "18px",
                  color: "var(--color-neutral-dark)",
                  cursor: "pointer",
                }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleMarkAttendance}>
              <div style={{ marginBottom: "var(--space-3)" }}>
                <label
                  htmlFor="mark-session-date"
                  style={{
                    display: "block",
                    fontSize: "var(--text-xs)",
                    fontWeight: 600,
                    marginBottom: "4px",
                  }}
                >
                  Session Date:{" "}
                  <span style={{ color: "var(--color-danger)" }}>*</span>
                </label>
                <input
                  id="mark-session-date"
                  type="date"
                  required
                  value={markDate}
                  onChange={(e) => {
                    setMarkDate(e.target.value);
                    setMarkError(null);
                  }}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-input-border)",
                    fontSize: "var(--text-xs)",
                    backgroundColor: "var(--color-surface)",
                    color: "var(--color-primary)",
                  }}
                />
              </div>

              <div style={{ marginBottom: "var(--space-3)" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "var(--text-xs)",
                    fontWeight: 600,
                    marginBottom: "4px",
                  }}
                >
                  Select Student:
                </label>
                <select
                  aria-label="Select Student"
                  value={markStudentId}
                  onChange={(e) => setMarkStudentId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-input-border)",
                    fontSize: "var(--text-xs)",
                  }}
                >
                  {selectableStudents.length === 0 ? (
                    <option value="">No assigned students available</option>
                  ) : (
                    selectableStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.classGrade})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div style={{ marginBottom: "var(--space-3)" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "var(--text-xs)",
                    fontWeight: 600,
                    marginBottom: "4px",
                  }}
                >
                  Subject:
                </label>
                <select
                  aria-label="Subject"
                  value={markSubject}
                  onChange={(e) => setMarkSubject(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-input-border)",
                    fontSize: "var(--text-xs)",
                  }}
                >
                  {availableSubjects.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "var(--space-3)" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "var(--text-xs)",
                    fontWeight: 600,
                    marginBottom: "4px",
                  }}
                >
                  Status:
                </label>
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
                        backgroundColor:
                          markStatus === st
                            ? "var(--color-primary)"
                            : "var(--color-surface)",
                        color:
                          markStatus === st
                            ? "var(--brand-white)"
                            : "var(--color-primary)",
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
                <label
                  style={{
                    display: "block",
                    fontSize: "var(--text-xs)",
                    fontWeight: 600,
                    marginBottom: "4px",
                  }}
                >
                  Session Notes / Remarks (Optional):
                </label>
                <input
                  type="text"
                  value={markRemarks}
                  onChange={(e) => setMarkRemarks(e.target.value)}
                  placeholder="e.g. Completed Chapter 4 practice sheet"
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-input-border)",
                    fontSize: "var(--text-xs)",
                  }}
                />
              </div>

              {markError && (
                <div
                  style={{
                    marginBottom: "var(--space-3)",
                    padding: "8px 12px",
                    backgroundColor: "var(--color-danger-bg)",
                    color: "var(--color-danger)",
                    border: "1px solid var(--color-danger-border)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "var(--text-xs)",
                    fontWeight: 500,
                  }}
                  role="alert"
                >
                  {markError}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "var(--space-2)",
                }}
              >
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setIsMarkModalOpen(false);
                    setMarkError(null);
                  }}
                >
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

      {editRecord && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditRecord(null);
          }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "var(--color-overlay)",
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
          <div
            style={{
              backgroundColor: "var(--color-surface)",
              borderRadius: "var(--radius-lg)",
              maxWidth: "400px",
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
              <h3
                style={{
                  fontSize: "var(--text-base)",
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                Edit Attendance
              </h3>
              <button
                type="button"
                onClick={() => setEditRecord(null)}
                aria-label="Close modal"
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "18px",
                  color: "var(--color-neutral-dark)",
                  cursor: "pointer",
                  padding: "0 4px",
                }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div
                style={{
                  backgroundColor: "var(--color-surface-muted)",
                  padding: "var(--space-3)",
                  borderRadius: "var(--radius-md)",
                  marginBottom: "var(--space-4)",
                  fontSize: "var(--text-xs)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <div>
                  <span style={{ color: "var(--color-neutral-dark)" }}>
                    Student:{" "}
                  </span>
                  <strong>{editRecord.studentName}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--color-neutral-dark)" }}>
                    Subject:{" "}
                  </span>
                  <strong>{editRecord.subject}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--color-neutral-dark)" }}>
                    Original Date:{" "}
                  </span>
                  <strong>{editRecord.date}</strong>
                </div>
              </div>

              <div style={{ marginBottom: "var(--space-4)" }}>
                <label
                  htmlFor="edit-session-date"
                  style={{
                    display: "block",
                    fontSize: "var(--text-xs)",
                    fontWeight: 600,
                    marginBottom: "4px",
                  }}
                >
                  Session Date:
                </label>
                <input
                  id="edit-session-date"
                  type="date"
                  required
                  value={editDate}
                  onChange={(e) => {
                    setEditDate(e.target.value);
                    setEditError(null);
                  }}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-input-border)",
                    fontSize: "var(--text-xs)",
                    backgroundColor: "var(--color-surface)",
                    color: "var(--color-primary)",
                  }}
                />
              </div>

              <div style={{ marginBottom: "var(--space-6)" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "var(--text-xs)",
                    fontWeight: 600,
                    marginBottom: "var(--space-2)",
                  }}
                >
                  Status:
                </label>
                <div style={{ display: "flex", gap: "var(--space-2)" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setEditStatus("present");
                      setEditError(null);
                    }}
                    style={{
                      flex: 1,
                      padding: "10px 14px",
                      borderRadius: "var(--radius-sm)",
                      border:
                        editStatus === "present"
                          ? "2px solid var(--color-success)"
                          : "1px solid var(--color-border)",
                      backgroundColor:
                        editStatus === "present"
                          ? "var(--color-success)"
                          : "var(--color-surface)",
                      color:
                        editStatus === "present"
                          ? "var(--brand-white)"
                          : "var(--color-primary)",
                      fontSize: "var(--text-xs)",
                      fontWeight: editStatus === "present" ? 700 : 500,
                      cursor: "pointer",
                      boxShadow:
                        editStatus === "present"
                          ? "var(--shadow-sm)"
                          : "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span><Check size={14} /></span>
                    <span>Present</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditStatus("absent");
                      setEditError(null);
                    }}
                    style={{
                      flex: 1,
                      padding: "10px 14px",
                      borderRadius: "var(--radius-sm)",
                      border:
                        editStatus === "absent"
                          ? "2px solid var(--color-danger)"
                          : "1px solid var(--color-border)",
                      backgroundColor:
                        editStatus === "absent"
                          ? "var(--color-danger)"
                          : "var(--color-surface)",
                      color:
                        editStatus === "absent"
                          ? "var(--brand-white)"
                          : "var(--color-primary)",
                      fontSize: "var(--text-xs)",
                      fontWeight: editStatus === "absent" ? 700 : 500,
                      cursor: "pointer",
                      boxShadow:
                        editStatus === "absent"
                          ? "var(--shadow-sm)"
                          : "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span><X size={14} /></span>
                    <span>Absent</span>
                  </button>
                </div>
              </div>

              {editError && (
                <div
                  style={{
                    marginBottom: "var(--space-3)",
                    padding: "8px 12px",
                    backgroundColor: "var(--color-danger-bg)",
                    color: "var(--color-danger)",
                    border: "1px solid var(--color-danger-border)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "var(--text-xs)",
                    fontWeight: 500,
                  }}
                  role="alert"
                >
                  {editError}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "var(--space-2)",
                }}
              >
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setEditRecord(null);
                    setEditError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Save
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
