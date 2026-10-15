"use client";

import React, { useState, useMemo, useEffect } from "react";
import type {
  UserRole,
  ClassroomSession,
  MeetingProvider,
  ClassroomSessionStatus,
} from "@/types";
import { SAMPLE_CLASSROOM_SESSIONS } from "@/data/classroomData";
import { SAMPLE_TEACHERS, SAMPLE_STUDENTS, SAMPLE_ENROLLMENTS } from "@/data/enrollmentFeeData";
import { SAMPLE_BATCHES } from "@/data/dashboardModulesData";
import { DEFAULT_SUBJECTS } from "@/data/academicMasterData";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useDemoStorage, DEMO_STORAGE_KEYS } from "@/lib/demoStorage";
import { getSubjectTheme } from "@/lib/timetableUtils";
import {
  detectMeetingProvider,
  getProviderLabel,
  getProviderBadgeStyle,
  getStudentOnlineClasses,
  isMeetingJoinable,
  validateOnlineClassPayload,
  getTeacherRecentMeetingUrls,
} from "@/lib/onlineClassUtils";

interface ClassroomModuleProps {
  role: UserRole;
  currentTeacherId?: string;
  currentStudentId?: string;
}

export function ClassroomModule({
  role,
  currentTeacherId = "tch-azhar",
  currentStudentId = "std-101",
}: ClassroomModuleProps) {
  // Shared persistent online class schedule dataset across all 4 roles
  const [sessions, setSessions] = useDemoStorage<ClassroomSession[]>(
    DEMO_STORAGE_KEYS.CLASSROOM_SESSIONS,
    SAMPLE_CLASSROOM_SESSIONS
  );

  // Dynamic catalogs from demo storage
  const [faculty] = useDemoStorage(DEMO_STORAGE_KEYS.FACULTY, SAMPLE_TEACHERS);
  const [batches] = useDemoStorage(DEMO_STORAGE_KEYS.BATCHES, SAMPLE_BATCHES);
  const [subjects] = useDemoStorage(DEMO_STORAGE_KEYS.ACADEMIC_SUBJECTS, DEFAULT_SUBJECTS);
  const [enrollments] = useDemoStorage(DEMO_STORAGE_KEYS.ENROLLMENTS, SAMPLE_ENROLLMENTS);
  const [students] = useDemoStorage(DEMO_STORAGE_KEYS.STUDENTS, SAMPLE_STUDENTS);

  // Active student object (for Student & Parent roles)
  const currentStudent = useMemo(() => {
    return students.find((s) => s.id === currentStudentId) || null;
  }, [students, currentStudentId]);

  // Active teacher object
  const activeTeacher = useMemo(() => {
    return faculty.find((t) => t.id === currentTeacherId) || faculty[0];
  }, [faculty, currentTeacherId]);

  // Teacher-eligible subjects and batches
  const teacherEligibleSubjects = useMemo(() => {
    if (role !== "teacher" || !activeTeacher) return subjects.map((s) => s.name);
    return activeTeacher.assignedSubjects.length > 0
      ? activeTeacher.assignedSubjects
      : ["Mathematics"];
  }, [role, activeTeacher, subjects]);

  const teacherEligibleBatches = useMemo(() => {
    if (role !== "teacher" || !activeTeacher) return batches;
    return batches.filter(
      (b) =>
        b.teacherId === activeTeacher.id ||
        activeTeacher.assignedSubjects.some((s) =>
          b.subject.toLowerCase().includes(s.toLowerCase())
        ) ||
        activeTeacher.batches.includes(b.name)
    );
  }, [role, activeTeacher, batches]);

  // Filters
  const [statusTab, setStatusTab] = useState<"all" | "scheduled" | "completed" | "cancelled">("all");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [filterBatch, setFilterBatch] = useState<string>("all");
  const [filterTeacher, setFilterTeacher] = useState<string>("all");
  const [filterProvider, setFilterProvider] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Notification Banner
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const showNotification = (message: string, type: "success" | "error" | "info" = "success") => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Modals
  const [detailsSession, setDetailsSession] = useState<ClassroomSession | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);

  // Scheduling Form State
  const [formTopic, setFormTopic] = useState<string>("");
  const [formSubject, setFormSubject] = useState<string>("Mathematics");
  const [formBatch, setFormBatch] = useState<string>("Batch Alpha (Class IX-X)");
  const [formProvider, setFormProvider] = useState<MeetingProvider>("google-meet");
  const [formUrl, setFormUrl] = useState<string>("https://meet.google.com/");
  const [formDate, setFormDate] = useState<string>("2026-10-14");
  const [formStartTime, setFormStartTime] = useState<string>("16:30");
  const [formEndTime, setFormEndTime] = useState<string>("18:00");
  const [formInstructions, setFormInstructions] = useState<string>("");
  const [formTeacherId, setFormTeacherId] = useState<string>(
    role === "teacher" ? currentTeacherId : faculty[0]?.id || "tch-azhar"
  );
  const [formStatus, setFormStatus] = useState<ClassroomSessionStatus>("scheduled");
  const [formError, setFormError] = useState<string | null>(null);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDetailsSession(null);
        setIsFormModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Recent meeting URLs used by the current teacher for 1-click reuse
  const recentMeetingUrls = useMemo(() => {
    const teacherId = role === "teacher" ? currentTeacherId : formTeacherId;
    return getTeacherRecentMeetingUrls(teacherId, sessions);
  }, [role, currentTeacherId, formTeacherId, sessions]);

  // Open Create Schedule Modal
  const openCreateModal = () => {
    setEditingSessionId(null);
    setFormTopic("");
    setFormSubject(teacherEligibleSubjects[0] || "Mathematics");
    setFormBatch(teacherEligibleBatches[0]?.name || "Batch Alpha (Class IX-X)");
    setFormProvider("google-meet");
    setFormUrl("https://meet.google.com/");
    setFormDate("2026-10-14");
    setFormStartTime("16:30");
    setFormEndTime("18:00");
    setFormInstructions("");
    setFormTeacherId(role === "teacher" ? currentTeacherId : faculty[0]?.id || "tch-azhar");
    setFormStatus("scheduled");
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Open Edit Schedule Modal
  const openEditModal = (session: ClassroomSession) => {
    setEditingSessionId(session.id);
    setFormTopic(session.topic);
    setFormSubject(session.subject);
    setFormBatch(session.batchName);
    const resolvedProvider = session.meetingProvider || detectMeetingProvider(session.meetingUrl || "");
    setFormProvider(resolvedProvider);
    setFormUrl(session.meetingUrl || session.meetingLinkDemo || "https://meet.google.com/");
    setFormDate(session.date);
    // Convert 12hr e.g. "04:30 PM" to 24hr for time inputs if needed
    setFormStartTime(session.startTime.includes("M") ? "16:30" : session.startTime);
    setFormEndTime(session.endTime.includes("M") ? "18:00" : session.endTime);
    const instr = Array.isArray(session.instructions)
      ? session.instructions.join("\n")
      : session.instructions || session.notes || "";
    setFormInstructions(instr);
    setFormTeacherId(session.teacherId);
    setFormStatus(session.status);
    setFormError(null);
    setDetailsSession(null);
    setIsFormModalOpen(true);
  };

  // Save Schedule Handler
  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validate Form Fields
    const validation = validateOnlineClassPayload({
      topic: formTopic,
      subject: formSubject,
      batch: formBatch,
      meetingUrl: formUrl,
      date: formDate,
      startTime: formStartTime,
      endTime: formEndTime,
    });

    if (!validation.isValid) {
      setFormError(validation.error || "Please check the form inputs.");
      return;
    }

    const teacherObj = faculty.find((t) => t.id === formTeacherId);
    const teacherName = teacherObj ? teacherObj.name : "Faculty";
    const batchObj = batches.find((b) => b.name === formBatch);
    const batchId = batchObj?.id || formBatch.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const classGrade = batchObj?.classGrade || "Class X";
    const subjectObj = subjects.find((s) => s.name === formSubject);
    const subjectId = subjectObj?.id || formSubject.toLowerCase().replace(/[^a-z0-9]/g, "-");

    const cleanUrl = formUrl.trim();
    const finalProvider = formProvider === "other" ? detectMeetingProvider(cleanUrl) : formProvider;

    if (editingSessionId) {
      // In-place update
      setSessions((prev) =>
        prev.map((s) =>
          s.id === editingSessionId
            ? {
                ...s,
                topic: formTopic.trim(),
                subject: formSubject,
                subjectId,
                batchName: formBatch,
                batchId,
                classGrade,
                teacherId: formTeacherId,
                teacherName,
                date: formDate,
                startTime: formStartTime,
                endTime: formEndTime,
                meetingProvider: finalProvider,
                meetingUrl: cleanUrl,
                meetingLinkDemo: cleanUrl,
                instructions: formInstructions.trim(),
                status: formStatus,
              }
            : s
        )
      );
      showNotification(`Updated online class for ${formSubject} (${formBatch}).`);
    } else {
      // Create new online class session
      const newSession: ClassroomSession = {
        id: `cls-online-${Date.now()}`,
        topic: formTopic.trim(),
        subject: formSubject,
        subjectId,
        batchName: formBatch,
        batchId,
        classGrade,
        teacherId: formTeacherId,
        teacherName,
        date: formDate,
        startTime: formStartTime,
        endTime: formEndTime,
        durationMinutes: 90,
        meetingProvider: finalProvider,
        meetingUrl: cleanUrl,
        meetingLinkDemo: cleanUrl,
        instructions: formInstructions.trim(),
        status: "scheduled",
      };
      setSessions((prev) => [newSession, ...prev]);
      showNotification(`Scheduled new online class: ${formTopic.trim()}`);
    }

    setIsFormModalOpen(false);
  };

  // Status Action Handlers
  const handleCancelSession = (session: ClassroomSession) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === session.id ? { ...s, status: "cancelled" } : s))
    );
    showNotification(`Cancelled online class: ${session.topic}`);
    if (detailsSession?.id === session.id) {
      setDetailsSession({ ...detailsSession, status: "cancelled" });
    }
  };

  const handleCompleteSession = (session: ClassroomSession) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === session.id ? { ...s, status: "completed" } : s))
    );
    showNotification(`Marked as completed: ${session.topic}`);
    if (detailsSession?.id === session.id) {
      setDetailsSession({ ...detailsSession, status: "completed" });
    }
  };

  const handleReactivateSession = (session: ClassroomSession) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === session.id ? { ...s, status: "scheduled" } : s))
    );
    showNotification(`Reactivated online class: ${session.topic}`);
    if (detailsSession?.id === session.id) {
      setDetailsSession({ ...detailsSession, status: "scheduled" });
    }
  };

  // Join Meeting Handler (Opens external URL in new browser tab)
  const handleJoinMeeting = (session: ClassroomSession) => {
    const url = session.meetingUrl || session.meetingLinkDemo;
    if (!url || session.status === "cancelled") return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Role-Isolated Base Sessions (Strict Scope Enforcement)
  const roleBaseSessions = useMemo(() => {
    if (role === "teacher") {
      return sessions.filter((s) => s.teacherId === currentTeacherId);
    }
    if (role === "student" || role === "parent") {
      if (!currentStudentId) return [];
      return getStudentOnlineClasses(currentStudentId, enrollments, sessions);
    }
    // Academy Admin sees complete academy schedule
    return sessions;
  }, [role, sessions, currentTeacherId, currentStudentId, enrollments]);

  // Filtered Visible Sessions
  const visibleSessions = useMemo(() => {
    return roleBaseSessions.filter((session) => {
      // Status Tab Filter
      if (statusTab !== "all") {
        if (statusTab === "scheduled" && session.status !== "scheduled" && session.status !== "upcoming") {
          return false;
        }
        if (statusTab === "completed" && session.status !== "completed") return false;
        if (statusTab === "cancelled" && session.status !== "cancelled") return false;
      }

      // Dropdown Filters
      if (filterSubject !== "all" && session.subject !== filterSubject) return false;
      if (filterBatch !== "all" && session.batchName !== filterBatch) return false;
      if (filterTeacher !== "all" && session.teacherId !== filterTeacher) return false;
      if (filterProvider !== "all") {
        const prov = session.meetingProvider || detectMeetingProvider(session.meetingUrl || "");
        if (prov !== filterProvider) return false;
      }

      // Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTopic = session.topic.toLowerCase().includes(q);
        const matchesTeacher = session.teacherName.toLowerCase().includes(q);
        const matchesBatch = session.batchName.toLowerCase().includes(q);
        const matchesSubject = session.subject.toLowerCase().includes(q);
        const instrText = Array.isArray(session.instructions)
          ? session.instructions.join(" ")
          : session.instructions || "";
        const matchesInstr = instrText.toLowerCase().includes(q);
        if (!matchesTopic && !matchesTeacher && !matchesBatch && !matchesSubject && !matchesInstr) {
          return false;
        }
      }

      return true;
    });
  }, [
    roleBaseSessions,
    statusTab,
    filterSubject,
    filterBatch,
    filterTeacher,
    filterProvider,
    searchQuery,
  ]);

  // Metric Counts calculated from actual underlying records
  const totalClassesCount = roleBaseSessions.length;
  const scheduledCount = roleBaseSessions.filter(
    (s) => s.status === "scheduled" || s.status === "upcoming"
  ).length;
  const completedCount = roleBaseSessions.filter((s) => s.status === "completed").length;
  const cancelledCount = roleBaseSessions.filter((s) => s.status === "cancelled").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      {/* Notification Banner */}
      {notification && (
        <div
          style={{
            padding: "10px 16px",
            backgroundColor:
              notification.type === "error"
                ? "rgba(255, 59, 48, 0.12)"
                : "rgba(52, 199, 89, 0.12)",
            color:
              notification.type === "error"
                ? "var(--color-danger, #FF3B30)"
                : "var(--color-success, #34C759)",
            border: `1px solid ${
              notification.type === "error"
                ? "rgba(255, 59, 48, 0.3)"
                : "rgba(52, 199, 89, 0.3)"
            }`,
            borderRadius: "var(--radius-md)",
            fontSize: "var(--text-xs)",
            fontWeight: 600,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
          role="status"
        >
          <span>{notification.message}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              color: "inherit",
              padding: "0 4px",
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Card */}
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
              <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--color-primary)" }}>
                {role === "parent"
                  ? "Ward's Online Classes & Meeting Links"
                  : role === "student"
                  ? "My Online Classes & Meeting Links"
                  : role === "teacher"
                  ? "Faculty Online Lectures & Meeting Links"
                  : "Online Classrooms Management"}
              </h2>
              <Badge variant="accent" size="sm">
                {role === "teacher"
                  ? `Faculty: ${activeTeacher?.name || "Assigned"}`
                  : role === "student"
                  ? currentStudent ? `${currentStudent.name} (${currentStudent.classGrade})` : "Student Scope"
                  : role === "parent"
                  ? currentStudent ? `Ward: ${currentStudent.name}` : "Guardian Scope"
                  : "Central Academy Directory"}
              </Badge>
            </div>
            <p
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--color-neutral-dark)",
              }}
            >
              {role === "parent"
                ? "View and join verified external Google Meet or Zoom class meetings for your enrolled ward."
                : role === "student"
                ? "Access verified external Google Meet or Zoom lectures for your enrolled subjects and batch."
                : role === "teacher"
                ? "Schedule and manage external meeting URLs (Google Meet or Zoom) for your assigned batches."
                : "Central institutional management of external video lecture links across all teachers and batches."}
            </p>
          </div>

          {/* Schedule Button for Teacher & Admin */}
          {(role === "teacher" || role === "academy-admin") && (
            <Button variant="primary" size="sm" onClick={openCreateModal}>
              + Schedule Online Class
            </Button>
          )}
        </div>

        {/* KPI Summary Metrics */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
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
            <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)", textTransform: "uppercase" }}>
              Total Meetings
            </span>
            <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--color-primary)", marginTop: "2px" }}>
              {totalClassesCount}
            </div>
            <span style={{ fontSize: "10px", color: "var(--color-neutral-dark)" }}>All records</span>
          </div>

          <div
            style={{
              padding: "var(--space-3)",
              backgroundColor: "var(--color-surface-muted)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
            }}
          >
            <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)", textTransform: "uppercase" }}>
              Upcoming
            </span>
            <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--color-accent)", marginTop: "2px" }}>
              {scheduledCount}
            </div>
            <span style={{ fontSize: "10px", color: "var(--color-neutral-dark)" }}>Ready to join</span>
          </div>

          <div
            style={{
              padding: "var(--space-3)",
              backgroundColor: "var(--color-surface-muted)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
            }}
          >
            <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)", textTransform: "uppercase" }}>
              Completed
            </span>
            <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--color-success, #34C759)", marginTop: "2px" }}>
              {completedCount}
            </div>
            <span style={{ fontSize: "10px", color: "var(--color-neutral-dark)" }}>Archived sessions</span>
          </div>

          <div
            style={{
              padding: "var(--space-3)",
              backgroundColor: "var(--color-surface-muted)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
            }}
          >
            <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)", textTransform: "uppercase" }}>
              Cancelled
            </span>
            <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: cancelledCount > 0 ? "var(--color-danger, #FF3B30)" : "var(--color-neutral-dark)", marginTop: "2px" }}>
              {cancelledCount}
            </div>
            <span style={{ fontSize: "10px", color: "var(--color-neutral-dark)" }}>Link disabled</span>
          </div>
        </div>

        {/* Filter Strip */}
        <div
          style={{
            display: "flex",
            gap: "var(--space-3)",
            flexWrap: "wrap",
            alignItems: "center",
            marginTop: "var(--space-4)",
            paddingTop: "var(--space-3)",
            borderTop: "1px solid var(--color-border)",
          }}
        >
          {/* Status Tabs */}
          <div
            style={{
              display: "flex",
              backgroundColor: "var(--color-surface-muted)",
              padding: "3px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
            }}
          >
            <button
              type="button"
              onClick={() => setStatusTab("all")}
              style={{
                padding: "4px 10px",
                borderRadius: "var(--radius-sm)",
                fontSize: "var(--text-xs)",
                fontWeight: statusTab === "all" ? 700 : 500,
                backgroundColor: statusTab === "all" ? "var(--color-surface)" : "transparent",
                color: "var(--color-primary)",
                border: "none",
                cursor: "pointer",
                boxShadow: statusTab === "all" ? "var(--shadow-sm)" : "none",
              }}
            >
              All ({totalClassesCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusTab("scheduled")}
              style={{
                padding: "4px 10px",
                borderRadius: "var(--radius-sm)",
                fontSize: "var(--text-xs)",
                fontWeight: statusTab === "scheduled" ? 700 : 500,
                backgroundColor: statusTab === "scheduled" ? "var(--color-surface)" : "transparent",
                color: "var(--color-primary)",
                border: "none",
                cursor: "pointer",
                boxShadow: statusTab === "scheduled" ? "var(--shadow-sm)" : "none",
              }}
            >
              Upcoming ({scheduledCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusTab("completed")}
              style={{
                padding: "4px 10px",
                borderRadius: "var(--radius-sm)",
                fontSize: "var(--text-xs)",
                fontWeight: statusTab === "completed" ? 700 : 500,
                backgroundColor: statusTab === "completed" ? "var(--color-surface)" : "transparent",
                color: "var(--color-primary)",
                border: "none",
                cursor: "pointer",
                boxShadow: statusTab === "completed" ? "var(--shadow-sm)" : "none",
              }}
            >
              Completed ({completedCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusTab("cancelled")}
              style={{
                padding: "4px 10px",
                borderRadius: "var(--radius-sm)",
                fontSize: "var(--text-xs)",
                fontWeight: statusTab === "cancelled" ? 700 : 500,
                backgroundColor: statusTab === "cancelled" ? "var(--color-surface)" : "transparent",
                color: "var(--color-primary)",
                border: "none",
                cursor: "pointer",
                boxShadow: statusTab === "cancelled" ? "var(--shadow-sm)" : "none",
              }}
            >
              Cancelled ({cancelledCount})
            </button>
          </div>

          {/* Admin Faculty Filter */}
          {role === "academy-admin" && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", fontWeight: 500 }}>
                Faculty:
              </span>
              <select
                value={filterTeacher}
                onChange={(e) => setFilterTeacher(e.target.value)}
                style={{
                  fontSize: "var(--text-xs)",
                  padding: "4px 8px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-surface)",
                }}
              >
                <option value="all">All Teachers</option>
                {faculty.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Subject Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", fontWeight: 500 }}>
              Subject:
            </span>
            <select
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
              {subjects.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Batch Filter */}
          {(role === "academy-admin" || role === "teacher") && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", fontWeight: 500 }}>
                Batch:
              </span>
              <select
                value={filterBatch}
                onChange={(e) => setFilterBatch(e.target.value)}
                style={{
                  fontSize: "var(--text-xs)",
                  padding: "4px 8px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-surface)",
                }}
              >
                <option value="all">All Batches</option>
                {(role === "teacher" ? teacherEligibleBatches : batches).map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Provider Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", fontWeight: 500 }}>
              Provider:
            </span>
            <select
              value={filterProvider}
              onChange={(e) => setFilterProvider(e.target.value)}
              style={{
                fontSize: "var(--text-xs)",
                padding: "4px 8px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-surface)",
              }}
            >
              <option value="all">All Providers</option>
              <option value="google-meet">Google Meet</option>
              <option value="zoom">Zoom</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Search Query */}
          <div style={{ flex: "1 1 200px" }}>
            <input
              type="text"
              placeholder="Search by topic, teacher, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                fontSize: "var(--text-xs)",
                padding: "5px 10px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-surface)",
              }}
            />
          </div>
        </div>
      </Card>

      {/* Online Classes Listing Grid */}
      {visibleSessions.length === 0 ? (
        <Card padding="lg">
          <div style={{ textAlign: "center", padding: "var(--space-8)" }}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>🌐</div>
            <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, marginBottom: "4px" }}>
              {role === "parent" && !currentStudent
                ? "No Linked Student Found"
                : "No Online Classes Found"}
            </h3>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", maxWidth: "420px", margin: "0 auto" }}>
              {role === "parent" && !currentStudent
                ? "Please ensure a valid student profile is linked to your parent account to view their online meetings."
                : role === "student" || role === "parent"
                ? "No online classes are currently scheduled for your enrolled subjects and batch."
                : "No online classes match the selected filter criteria. Use '+ Schedule Online Class' to create a new session."}
            </p>
          </div>
        </Card>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: "var(--space-4)",
          }}
        >
          {visibleSessions.map((session) => {
            const theme = getSubjectTheme(session.subject);
            const providerBadge = getProviderBadgeStyle(session.meetingProvider);
            const isJoinable = isMeetingJoinable(session);
            const isCancelled = session.status === "cancelled";
            const isCompleted = session.status === "completed";

            return (
              <div
                key={session.id}
                style={{
                  backgroundColor: "var(--color-surface)",
                  borderRadius: "var(--radius-lg)",
                  border: `1px solid ${
                    isCancelled ? "rgba(255, 59, 48, 0.25)" : "var(--color-border)"
                  }`,
                  borderLeft: `5px solid ${
                    isCancelled ? "var(--color-danger, #FF3B30)" : theme.primary
                  }`,
                  padding: "var(--space-4)",
                  boxShadow: "var(--shadow-sm)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "var(--space-3)",
                }}
              >
                <div>
                  {/* Top Badges: Subject, Provider, Status */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "6px",
                      marginBottom: "var(--space-2)",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "var(--radius-sm)",
                          backgroundColor: theme.badgeBg,
                          color: theme.badgeText,
                        }}
                      >
                        {session.subject}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: "var(--radius-sm)",
                          backgroundColor: providerBadge.bg,
                          color: providerBadge.color,
                          border: `1px solid ${providerBadge.border}`,
                        }}
                      >
                        {providerBadge.icon} {providerBadge.label}
                      </span>
                    </div>

                    {isCancelled ? (
                      <Badge variant="danger" size="sm">
                        Cancelled
                      </Badge>
                    ) : isCompleted ? (
                      <Badge variant="neutral" size="sm">
                        Completed
                      </Badge>
                    ) : (
                      <Badge variant="success" size="sm">
                        Scheduled
                      </Badge>
                    )}
                  </div>

                  {/* Topic / Title */}
                  <h3
                    style={{
                      fontSize: "var(--text-base)",
                      fontWeight: 700,
                      color: "var(--color-primary)",
                      marginBottom: "6px",
                      lineHeight: "1.3",
                      textDecoration: isCancelled ? "line-through" : "none",
                    }}
                  >
                    {session.topic}
                  </h3>

                  {/* Timing & Date */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      fontSize: "var(--text-xs)",
                      color: "var(--color-neutral-dark)",
                      marginBottom: "4px",
                    }}
                  >
                    <span>📅 {session.date}</span>
                    <span>⏰ {session.startTime} – {session.endTime}</span>
                  </div>

                  {/* Batch & Teacher */}
                  <div
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--color-neutral-dark)",
                      marginBottom: "6px",
                    }}
                  >
                    <span>👥 {session.batchName}</span> &bull; <span>👤 {session.teacherName}</span>
                  </div>

                  {/* Instructions Preview */}
                  {session.instructions && (
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--color-neutral-dark)",
                        backgroundColor: "var(--color-surface-muted)",
                        padding: "6px 8px",
                        borderRadius: "var(--radius-sm)",
                        marginTop: "4px",
                        lineHeight: "1.4",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      📝 {Array.isArray(session.instructions) ? session.instructions[0] : session.instructions}
                    </div>
                  )}
                </div>

                {/* Bottom Action Area */}
                <div>
                  <div
                    style={{
                      borderTop: "1px solid var(--color-border)",
                      paddingTop: "var(--space-3)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "var(--space-2)",
                      flexWrap: "wrap",
                    }}
                  >
                    {/* Primary Join Action (Disabled if cancelled or missing URL) */}
                    <div>
                      {isJoinable ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleJoinMeeting(session)}
                          title={`Open ${getProviderLabel(session.meetingProvider)} meeting in a new browser tab`}
                        >
                          Join Meeting ↗
                        </Button>
                      ) : isCancelled ? (
                        <span
                          style={{
                            fontSize: "var(--text-xs)",
                            color: "var(--color-danger, #FF3B30)",
                            fontWeight: 600,
                          }}
                        >
                          Meeting Cancelled
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: "var(--text-xs)",
                            color: "var(--color-neutral-dark)",
                          }}
                        >
                          Link Not Configured
                        </span>
                      )}
                    </div>

                    {/* Secondary & Admin/Teacher Controls */}
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setDetailsSession(session)}
                      >
                        Details
                      </Button>

                      {(role === "teacher" || role === "academy-admin") && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openEditModal(session)}
                          >
                            Edit
                          </Button>
                          {isCancelled ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleReactivateSession(session)}
                            >
                              Reactivate
                            </Button>
                          ) : (
                            <>
                              {!isCompleted && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleCompleteSession(session)}
                                >
                                  Complete
                                </Button>
                              )}
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleCancelSession(session)}
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. CLASS DETAILS MODAL                                                    */}
      {/* ========================================================================= */}
      {detailsSession && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setDetailsSession(null);
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
          <div
            style={{
              backgroundColor: "var(--color-surface)",
              borderRadius: "var(--radius-lg)",
              maxWidth: "500px",
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
                alignItems: "flex-start",
                marginBottom: "var(--space-4)",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: getSubjectTheme(detailsSession.subject).badgeBg,
                    color: getSubjectTheme(detailsSession.subject).badgeText,
                    display: "inline-block",
                    marginBottom: "4px",
                  }}
                >
                  {detailsSession.subject}
                </span>
                <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 700, margin: 0 }}>
                  {detailsSession.topic}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailsSession(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "18px",
                  color: "var(--color-neutral-dark)",
                  cursor: "pointer",
                  padding: "0 4px",
                }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-3)",
                backgroundColor: "var(--color-surface-muted)",
                padding: "var(--space-4)",
                borderRadius: "var(--radius-md)",
                fontSize: "var(--text-xs)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-neutral-dark)" }}>Meeting Provider:</span>
                <strong>{getProviderLabel(detailsSession.meetingProvider)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-neutral-dark)" }}>Scheduled Date:</span>
                <strong>{detailsSession.date}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-neutral-dark)" }}>Time Interval:</span>
                <strong>{detailsSession.startTime} – {detailsSession.endTime}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-neutral-dark)" }}>Batch &amp; Grade:</span>
                <strong>{detailsSession.batchName} ({detailsSession.classGrade})</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-neutral-dark)" }}>Faculty:</span>
                <strong>{detailsSession.teacherName}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "var(--color-neutral-dark)" }}>Status:</span>
                <span style={{ fontWeight: 700, textTransform: "capitalize" }}>
                  {detailsSession.status}
                </span>
              </div>
              {Boolean(detailsSession.meetingUrl || detailsSession.meetingLinkDemo) && (
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span style={{ color: "var(--color-neutral-dark)" }}>External URL:</span>
                  <a
                    href={detailsSession.meetingUrl || detailsSession.meetingLinkDemo}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "var(--color-accent)",
                      wordBreak: "break-all",
                      textDecoration: "underline",
                      fontSize: "11px",
                    }}
                  >
                    {detailsSession.meetingUrl || detailsSession.meetingLinkDemo}
                  </a>
                </div>
              )}
            </div>

            {/* Instructions / Notes Block */}
            {detailsSession.instructions && (
              <div style={{ marginTop: "var(--space-3)", fontSize: "var(--text-xs)" }}>
                <strong style={{ display: "block", marginBottom: "4px" }}>Instructions &amp; Prerequisites:</strong>
                <p style={{ color: "var(--color-neutral-dark)", margin: 0, lineHeight: "1.4" }}>
                  {Array.isArray(detailsSession.instructions)
                    ? detailsSession.instructions.join(" ")
                    : detailsSession.instructions}
                </p>
              </div>
            )}

            {/* Modal Actions */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "var(--space-2)",
                marginTop: "var(--space-5)",
              }}
            >
              {isMeetingJoinable(detailsSession) && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleJoinMeeting(detailsSession)}
                >
                  Join Meeting in New Tab ↗
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDetailsSession(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SCHEDULE / EDIT ONLINE CLASS MODAL                                     */}
      {/* ========================================================================= */}
      {isFormModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsFormModalOpen(false);
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
              <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, margin: 0 }}>
                {editingSessionId ? "Edit Online Class" : "Schedule Online Class"}
              </h3>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "18px",
                  color: "var(--color-neutral-dark)",
                  cursor: "pointer",
                  padding: "0 4px",
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSchedule}>
              {/* Validation Error Banner */}
              {formError && (
                <div
                  style={{
                    marginBottom: "var(--space-4)",
                    padding: "10px 12px",
                    backgroundColor: "rgba(255, 59, 48, 0.1)",
                    color: "var(--color-danger, #FF3B30)",
                    border: "1px solid rgba(255, 59, 48, 0.3)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "var(--text-xs)",
                    fontWeight: 600,
                  }}
                  role="alert"
                >
                  ⚠️ {formError}
                </div>
              )}

              {/* Class Topic / Title */}
              <div style={{ marginBottom: "var(--space-3)" }}>
                <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "4px" }}>
                  Class Title / Topic: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Quadratic Equations: Problem Solving Clinic"
                  value={formTopic}
                  onChange={(e) => {
                    setFormTopic(e.target.value);
                    setFormError(null);
                  }}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-border)",
                    fontSize: "var(--text-xs)",
                    backgroundColor: "var(--color-surface)",
                  }}
                />
              </div>

              {/* Subject & Batch Selectors (Restricted to teacher's permitted subjects/batches) */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "var(--space-3)",
                  marginBottom: "var(--space-3)",
                }}
              >
                <div>
                  <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "4px" }}>
                    Subject: *
                  </label>
                  <select
                    value={formSubject}
                    onChange={(e) => {
                      setFormSubject(e.target.value);
                      setFormError(null);
                    }}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border)",
                      fontSize: "var(--text-xs)",
                      backgroundColor: "var(--color-surface)",
                    }}
                  >
                    {teacherEligibleSubjects.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "4px" }}>
                    Batch / Class: *
                  </label>
                  <select
                    value={formBatch}
                    onChange={(e) => {
                      setFormBatch(e.target.value);
                      setFormError(null);
                    }}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border)",
                      fontSize: "var(--text-xs)",
                      backgroundColor: "var(--color-surface)",
                    }}
                  >
                    {teacherEligibleBatches.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Meeting Provider & Meeting URL */}
              <div style={{ marginBottom: "var(--space-3)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <label style={{ fontSize: "var(--text-xs)", fontWeight: 600 }}>
                    Meeting Provider: *
                  </label>
                  {/* Reuse Existing Recurring Meeting URL */}
                  {recentMeetingUrls.length > 0 && (
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          setFormUrl(e.target.value);
                          setFormProvider(detectMeetingProvider(e.target.value));
                          setFormError(null);
                        }
                      }}
                      defaultValue=""
                      style={{
                        fontSize: "11px",
                        padding: "2px 6px",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--color-border)",
                        backgroundColor: "var(--color-surface-muted)",
                        color: "var(--color-accent)",
                        cursor: "pointer",
                      }}
                    >
                      <option value="" disabled>
                        Reuse Recurring Link...
                      </option>
                      {recentMeetingUrls.map((r, i) => (
                        <option key={i} value={r.url}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Provider Radio Pills */}
                <div style={{ display: "flex", gap: "var(--space-2)", marginBottom: "8px" }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "5px 12px",
                      borderRadius: "var(--radius-sm)",
                      border: `1px solid ${
                        formProvider === "google-meet" ? "var(--color-accent)" : "var(--color-border)"
                      }`,
                      backgroundColor:
                        formProvider === "google-meet" ? "rgba(0, 122, 255, 0.08)" : "var(--color-surface)",
                      fontSize: "var(--text-xs)",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="meetingProvider"
                      checked={formProvider === "google-meet"}
                      onChange={() => {
                        setFormProvider("google-meet");
                        if (!formUrl || formUrl === "https://zoom.us/") {
                          setFormUrl("https://meet.google.com/");
                        }
                      }}
                    />
                    🟢 Google Meet
                  </label>

                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "5px 12px",
                      borderRadius: "var(--radius-sm)",
                      border: `1px solid ${
                        formProvider === "zoom" ? "var(--color-accent)" : "var(--color-border)"
                      }`,
                      backgroundColor:
                        formProvider === "zoom" ? "rgba(0, 122, 255, 0.08)" : "var(--color-surface)",
                      fontSize: "var(--text-xs)",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="meetingProvider"
                      checked={formProvider === "zoom"}
                      onChange={() => {
                        setFormProvider("zoom");
                        if (!formUrl || formUrl === "https://meet.google.com/") {
                          setFormUrl("https://zoom.us/j/");
                        }
                      }}
                    />
                    🔵 Zoom
                  </label>

                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "5px 12px",
                      borderRadius: "var(--radius-sm)",
                      border: `1px solid ${
                        formProvider === "other" ? "var(--color-accent)" : "var(--color-border)"
                      }`,
                      backgroundColor:
                        formProvider === "other" ? "rgba(0, 122, 255, 0.08)" : "var(--color-surface)",
                      fontSize: "var(--text-xs)",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="meetingProvider"
                      checked={formProvider === "other"}
                      onChange={() => setFormProvider("other")}
                    />
                    🔗 Other
                  </label>
                </div>

                {/* Meeting URL Input */}
                <input
                  type="url"
                  required
                  placeholder="https://meet.google.com/... or https://zoom.us/j/..."
                  value={formUrl}
                  onChange={(e) => {
                    setFormUrl(e.target.value);
                    setFormError(null);
                  }}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-border)",
                    fontSize: "var(--text-xs)",
                    backgroundColor: "var(--color-surface)",
                  }}
                />
                <span style={{ fontSize: "10px", color: "var(--color-neutral-dark)", marginTop: "2px", display: "block" }}>
                  Must start with <strong>https://</strong>. Students and parents will open this meeting link externally.
                </span>
              </div>

              {/* Date & Timings */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.2fr 1fr 1fr",
                  gap: "var(--space-3)",
                  marginBottom: "var(--space-3)",
                }}
              >
                <div>
                  <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "4px" }}>
                    Scheduled Date: *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => {
                      setFormDate(e.target.value);
                      setFormError(null);
                    }}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border)",
                      fontSize: "var(--text-xs)",
                      backgroundColor: "var(--color-surface)",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "4px" }}>
                    Start Time: *
                  </label>
                  <input
                    type="time"
                    required
                    value={formStartTime}
                    onChange={(e) => {
                      setFormStartTime(e.target.value);
                      setFormError(null);
                    }}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border)",
                      fontSize: "var(--text-xs)",
                      backgroundColor: "var(--color-surface)",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "4px" }}>
                    End Time: *
                  </label>
                  <input
                    type="time"
                    required
                    value={formEndTime}
                    onChange={(e) => {
                      setFormEndTime(e.target.value);
                      setFormError(null);
                    }}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border)",
                      fontSize: "var(--text-xs)",
                      backgroundColor: "var(--color-surface)",
                    }}
                  />
                </div>
              </div>

              {/* Admin Faculty Selector */}
              {role === "academy-admin" && (
                <div style={{ marginBottom: "var(--space-3)" }}>
                  <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "4px" }}>
                    Assigned Faculty: *
                  </label>
                  <select
                    value={formTeacherId}
                    onChange={(e) => setFormTeacherId(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border)",
                      fontSize: "var(--text-xs)",
                      backgroundColor: "var(--color-surface)",
                    }}
                  >
                    {faculty.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.assignedSubjects.join(", ")})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Instructions / Notes */}
              <div style={{ marginBottom: "var(--space-3)" }}>
                <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "4px" }}>
                  Instructions / Notes for Students: (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g., Have NCERT Chapter 4 open. Keep homework problem sheet handy."
                  value={formInstructions}
                  onChange={(e) => setFormInstructions(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-border)",
                    fontSize: "var(--text-xs)",
                    backgroundColor: "var(--color-surface)",
                    resize: "vertical",
                  }}
                />
              </div>

              {/* Status Selector (when editing) */}
              {editingSessionId && (
                <div style={{ marginBottom: "var(--space-4)" }}>
                  <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "4px" }}>
                    Status Lifecycle:
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ClassroomSessionStatus)}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border)",
                      fontSize: "var(--text-xs)",
                      backgroundColor: "var(--color-surface)",
                    }}
                  >
                    <option value="scheduled">Scheduled (Active Link)</option>
                    <option value="completed">Completed (Archived)</option>
                    <option value="cancelled">Cancelled (Link Disabled)</option>
                  </select>
                </div>
              )}

              {/* Form Buttons */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "var(--space-2)",
                  marginTop: "var(--space-4)",
                }}
              >
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsFormModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  {editingSessionId ? "Save Changes" : "Save & Schedule"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
