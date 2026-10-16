"use client";

import React, { useState, useMemo, useEffect } from "react";
import type { UserRole, DayOfWeek, TimetableSlot } from "@/types";
import { SAMPLE_TIMETABLE } from "@/data/dashboardModulesData";
import { SAMPLE_TEACHERS } from "@/data/enrollmentFeeData";
import { SAMPLE_BATCHES } from "@/data/dashboardModulesData";
import { DEFAULT_SUBJECTS } from "@/data/academicMasterData";
import { SAMPLE_ENROLLMENTS } from "@/data/enrollmentFeeData";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useDemoStorage, DEMO_STORAGE_KEYS } from "@/lib/demoStorage";
import {
  DAYS_OF_WEEK,
  getSubjectTheme,
  parseTimeToMinutes,
  formatMinutesTo12Hour,
  formatMinutesTo24Hour,
  getSlotTimeMinutes,
  checkTimetableConflict,
  getStudentTimetableSlots,
  computeDaySlotPositions,
  getMondayOfWeek,
  getWeekDays,
  formatWeekRange,
  isSlotOnDate,
  formatDateToISO,
  getDayOfWeekFromDate,
} from "@/lib/timetableUtils";
import {
  recordCreate,
  recordUpdate,
  recordDelete,
  recordAuditEvent,
} from "@/lib/auditService";
import { TimetableEventCard } from "./TimetableEventCard";

interface TimetableModuleProps {
  role: UserRole;
  currentTeacherId?: string;
  currentStudentId?: string;
}

// Grid hours: 08:00 AM to 08:00 PM (12 hour span, 60px per hour = 720px total)
const GRID_START_HOUR = 8;
const GRID_END_HOUR = 20;

export function TimetableModule({
  role,
  currentTeacherId = "tch-azhar",
  currentStudentId = "std-101",
}: TimetableModuleProps) {
  // Shared persistent timetable dataset across all roles
  const [slots, setSlots] = useDemoStorage<TimetableSlot[]>(
    DEMO_STORAGE_KEYS.TIMETABLE,
    SAMPLE_TIMETABLE
  );

  // Dynamic catalogs from demo storage
  const [faculty] = useDemoStorage(DEMO_STORAGE_KEYS.FACULTY, SAMPLE_TEACHERS);
  const [batches] = useDemoStorage(DEMO_STORAGE_KEYS.BATCHES, SAMPLE_BATCHES);
  const [subjects] = useDemoStorage(DEMO_STORAGE_KEYS.ACADEMIC_SUBJECTS, DEFAULT_SUBJECTS);
  const [enrollments] = useDemoStorage(DEMO_STORAGE_KEYS.ENROLLMENTS, SAMPLE_ENROLLMENTS);

  // Calendar Week Navigation State (Canonical Monday-first indexing)
  const [currentWeekMonday, setCurrentWeekMonday] = useState<Date>(() =>
    getMondayOfWeek(new Date())
  );

  // View Controls
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [selectedDayFilter, setSelectedDayFilter] = useState<DayOfWeek | "all">("all");

  // Admin / General Filters (Room filter completely removed)
  const [filterTeacher, setFilterTeacher] = useState<string>("all");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [filterBatch, setFilterBatch] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Action Notification Banner
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const showNotification = (message: string, type: "success" | "error" | "info" = "success") => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Modals
  const [detailsSlot, setDetailsSlot] = useState<TimetableSlot | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [deletingSlot, setDeletingSlot] = useState<TimetableSlot | null>(null);

  // Routine Form State
  const [formScheduleType, setFormScheduleType] = useState<"recurring" | "specific_date">("recurring");
  const [formDay, setFormDay] = useState<DayOfWeek>("Monday");
  const [formSpecificDate, setFormSpecificDate] = useState<string>(() => formatDateToISO(new Date()));
  const [formStartTime, setFormStartTime] = useState<string>("16:30");
  const [formEndTime, setFormEndTime] = useState<string>("18:00");
  const [formTeacherId, setFormTeacherId] = useState<string>(
    role === "teacher" ? currentTeacherId : faculty[0]?.id || "tch-azhar"
  );
  const [formSubject, setFormSubject] = useState<string>("Mathematics");
  const [formBatch, setFormBatch] = useState<string>("Batch Alpha (Class IX-X)");
  const [formStatus, setFormStatus] = useState<"active" | "cancelled">("active");
  const [formError, setFormError] = useState<string | null>(null);

  // Keyboard shortcut for closing modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDeletingSlot(null);
        setDetailsSlot(null);
        setIsFormModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Compute 7 days for the active week
  const weekDays = useMemo(() => {
    return getWeekDays(currentWeekMonday);
  }, [currentWeekMonday]);

  const weekRangeLabel = useMemo(() => {
    return formatWeekRange(currentWeekMonday);
  }, [currentWeekMonday]);

  // Week Navigation Handlers
  const handlePrevWeek = () => {
    setCurrentWeekMonday((prev) => {
      const next = new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 7);
      return getMondayOfWeek(next);
    });
  };

  const handleNextWeek = () => {
    setCurrentWeekMonday((prev) => {
      const next = new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 7);
      return getMondayOfWeek(next);
    });
  };

  const handleTodayWeek = () => {
    const todayMonday = getMondayOfWeek(new Date());
    setCurrentWeekMonday(todayMonday);
  };

  // Current active teacher object
  const activeTeacher = useMemo(() => {
    return faculty.find((t) => t.id === currentTeacherId) || faculty[0];
  }, [faculty, currentTeacherId]);

  // Teacher-eligible subjects and batches (Enforce strict teacher assignment restrictions)
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
        activeTeacher.assignedSubjects.some((s) => b.subject.toLowerCase().includes(s.toLowerCase())) ||
        activeTeacher.batches.includes(b.name)
    );
  }, [role, activeTeacher, batches]);

  // Open Form Modal (Add Routine)
  const openCreateModal = () => {
    setEditingSlotId(null);
    setFormScheduleType("recurring");
    setFormDay("Monday");
    setFormSpecificDate(formatDateToISO(new Date()));
    setFormStartTime("16:30");
    setFormEndTime("18:00");
    setFormTeacherId(role === "teacher" ? currentTeacherId : faculty[0]?.id || "tch-azhar");
    setFormSubject(teacherEligibleSubjects[0] || "Mathematics");
    setFormBatch(teacherEligibleBatches[0]?.name || "Batch Alpha (Class IX-X)");
    setFormStatus("active");
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Open Form Modal (Edit Routine)
  const openEditModal = (slot: TimetableSlot) => {
    setEditingSlotId(slot.id);
    setFormScheduleType(slot.scheduleType || "recurring");
    setFormDay(slot.dayOfWeek);
    setFormSpecificDate(slot.specificDate || formatDateToISO(new Date()));
    const { start, end } = getSlotTimeMinutes(slot);
    setFormStartTime(formatMinutesTo24Hour(start));
    setFormEndTime(formatMinutesTo24Hour(end));
    setFormTeacherId(slot.teacherId);
    setFormSubject(slot.subject);
    setFormBatch(slot.batch);
    setFormStatus(slot.status || "active");
    setFormError(null);
    setDetailsSlot(null);
    setIsFormModalOpen(true);
  };

  // Save Schedule Handler (Create or Edit)
  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const teacherObj = faculty.find((t) => t.id === formTeacherId);
    const teacherName = teacherObj ? teacherObj.name : "Faculty";
    const batchObj = batches.find((b) => b.name === formBatch);
    const batchId = batchObj?.id || formBatch.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const classGrade = batchObj?.classGrade || "Class X";
    const subjectObj = subjects.find((s) => s.name === formSubject);
    const subjectId = subjectObj?.id || formSubject.toLowerCase().replace(/[^a-z0-9]/g, "-");

    // Resolve weekday for date-specific sessions
    let resolvedDay = formDay;
    if (formScheduleType === "specific_date") {
      if (!formSpecificDate) {
        setFormError("Please select a valid date for the date-specific lecture.");
        return;
      }
      const [year, month, day] = formSpecificDate.split("-").map(Number);
      const parsedDate = new Date(year, month - 1, day);
      resolvedDay = getDayOfWeekFromDate(parsedDate);
    }

    // Comprehensive Conflict Validation (Teacher & Batch; NO room check)
    const conflictResult = checkTimetableConflict(
      {
        dayOfWeek: resolvedDay,
        startTime: formStartTime,
        endTime: formEndTime,
        teacherId: formTeacherId,
        teacherName,
        batch: formBatch,
        batchId,
        subject: formSubject,
        scheduleType: formScheduleType,
        specificDate: formScheduleType === "specific_date" ? formSpecificDate : undefined,
      },
      slots,
      editingSlotId || undefined
    );

    if (conflictResult.hasConflict) {
      setFormError(conflictResult.reason || "Conflict detected with an existing schedule.");
      return;
    }

    const startMins = parseTimeToMinutes(formStartTime);
    const endMins = parseTimeToMinutes(formEndTime);
    const normalizedStartTime = formatMinutesTo24Hour(startMins);
    const normalizedEndTime = formatMinutesTo24Hour(endMins);
    const timeRangeStr = `${formatMinutesTo12Hour(startMins)} - ${formatMinutesTo12Hour(endMins)}`;

    if (editingSlotId) {
      // Update existing record in place
      setSlots((prev) =>
        prev.map((slot) =>
          slot.id === editingSlotId
            ? {
                ...slot,
                dayOfWeek: resolvedDay,
                startTime: normalizedStartTime,
                endTime: normalizedEndTime,
                time: timeRangeStr,
                teacherId: formTeacherId,
                teacherName,
                subject: formSubject,
                subjectId,
                batch: formBatch,
                batchId,
                classGrade,
                scheduleType: formScheduleType,
                specificDate: formScheduleType === "specific_date" ? formSpecificDate : undefined,
                status: formStatus,
              }
            : slot
        )
      );
      showNotification(`Updated routine for ${formSubject} (${formBatch}) on ${resolvedDay}.`);

      recordUpdate({
        action: "Update Timetable Routine",
        type: "enrollment",
        target: `${formSubject} · ${formBatch} (${resolvedDay} ${timeRangeStr})`,
        details: `Updated routine schedule for ${formSubject} (${formBatch}) on ${resolvedDay} to ${timeRangeStr}. Assigned Faculty: ${teacherName}.`,
        performedBy: role === "academy-admin" ? "Academy Administrator" : activeTeacher?.name || "Teacher",
        actorRole: role,
        entityType: "timetable",
        entityId: editingSlotId,
        outcome: "SUCCESS",
        changedFields: ["dayOfWeek", "time", "subject", "batch", "teacher"],
        diff: [
          { fieldName: "dayOfWeek", after: resolvedDay },
          { fieldName: "time", after: timeRangeStr },
          { fieldName: "teacher", after: teacherName },
          { fieldName: "subject", after: formSubject },
        ],
        sourcePortal: role,
      });
    } else {
      // Create new schedule record normalized to standard schema
      const newSlot: TimetableSlot = {
        id: `time-custom-${Date.now()}`,
        dayOfWeek: resolvedDay,
        startTime: normalizedStartTime,
        endTime: normalizedEndTime,
        time: timeRangeStr,
        teacherId: formTeacherId,
        teacherName,
        subject: formSubject,
        subjectId,
        batch: formBatch,
        batchId,
        classGrade,
        scheduleType: formScheduleType,
        specificDate: formScheduleType === "specific_date" ? formSpecificDate : undefined,
        status: formStatus,
      };
      setSlots((prev) => [...prev, newSlot]);
      showNotification(`Added new ${formSubject} schedule on ${resolvedDay} (${timeRangeStr}).`);

      recordCreate({
        action: "Create Timetable Routine",
        type: "enrollment",
        target: `${formSubject} · ${formBatch} (${resolvedDay} ${timeRangeStr})`,
        details: `Created new timetable schedule for ${formSubject} (${formBatch}) on ${resolvedDay} (${timeRangeStr}). Assigned Faculty: ${teacherName}.`,
        performedBy: role === "academy-admin" ? "Academy Administrator" : activeTeacher?.name || "Teacher",
        actorRole: role,
        entityType: "timetable",
        entityId: newSlot.id,
        outcome: "SUCCESS",
        changedFields: ["dayOfWeek", "time", "subject", "batch", "teacher", "status"],
        sourcePortal: role,
      });
    }

    setIsFormModalOpen(false);
  };

  // Toggle Slot Cancellation
  const handleToggleCancelSlot = (slot: TimetableSlot) => {
    const newStatus = slot.status === "cancelled" ? "active" : "cancelled";
    setSlots((prev) =>
      prev.map((s) => (s.id === slot.id ? { ...s, status: newStatus } : s))
    );
    showNotification(
      newStatus === "cancelled"
        ? `Cancelled ${slot.subject} lecture (${slot.dayOfWeek}, ${slot.time}).`
        : `Re-activated ${slot.subject} lecture (${slot.dayOfWeek}, ${slot.time}).`
    );
    if (detailsSlot && detailsSlot.id === slot.id) {
      setDetailsSlot({ ...detailsSlot, status: newStatus });
    }

    recordAuditEvent({
      action: newStatus === "cancelled" ? "Cancel Timetable Session" : "Reactivate Timetable Session",
      actionType: newStatus === "cancelled" ? "CANCEL" : "UPDATE",
      type: "enrollment",
      target: `${slot.subject} (${slot.dayOfWeek}, ${slot.time})`,
      details: `${newStatus === "cancelled" ? "Cancelled" : "Reactivated"} timetable lecture for ${slot.subject} (${slot.batch}) on ${slot.dayOfWeek}.`,
      performedBy: role === "academy-admin" ? "Academy Administrator" : activeTeacher?.name || "Teacher",
      actorRole: role,
      entityType: "timetable",
      entityId: slot.id,
      outcome: "SUCCESS",
      changedFields: ["status"],
      diff: [{ fieldName: "status", before: slot.status || "active", after: newStatus }],
      sourcePortal: role,
    });
  };

  // Permanently Delete Schedule Routine or Date-Specific Occurrence
  const handleConfirmDelete = () => {
    if (!deletingSlot) return;
    const targetId = deletingSlot.id;
    const isDateSpecific =
      deletingSlot.scheduleType === "specific_date" || Boolean(deletingSlot.specificDate);
    const label = `${deletingSlot.subject} (${deletingSlot.dayOfWeek}, ${deletingSlot.time})`;

    // Remove the target record from demo state (syncs to demo storage)
    setSlots((prev) => prev.filter((s) => s.id !== targetId));

    // Record Central Audit Entry
    recordDelete({
      action: isDateSpecific ? "Delete Special Session" : "Delete Recurring Routine",
      type: "enrollment",
      target: `${deletingSlot.subject} (${deletingSlot.dayOfWeek}, ${deletingSlot.time})`,
      details: `Permanently removed ${isDateSpecific ? "date-specific session" : "recurring routine"} for ${label} (${deletingSlot.batch}). Faculty: ${deletingSlot.teacherName}.`,
      performedBy: role === "academy-admin" ? "Academy Administrator" : activeTeacher?.name || "Teacher",
      actorRole: role,
      entityType: "timetable",
      entityId: targetId,
      outcome: "SUCCESS",
      changedFields: ["isDeleted"],
      sourcePortal: role,
    });

    // Reset modals
    setDeletingSlot(null);
    setDetailsSlot(null);
    if (editingSlotId === targetId) {
      setIsFormModalOpen(false);
      setEditingSlotId(null);
    }

    showNotification(
      isDateSpecific
        ? `Deleted date-specific session: ${label}.`
        : `Deleted recurring routine: ${label}.`
    );
  };

  // Role-Isolated Base Schedule Set (Derived from actual enrollments & assignments)
  const roleBaseSlots = useMemo(() => {
    if (role === "teacher") {
      return slots.filter((slot) => slot.teacherId === currentTeacherId);
    }
    if (role === "student" || role === "parent") {
      return getStudentTimetableSlots(currentStudentId, enrollments, slots);
    }
    // Academy Admin sees complete academy master timetable
    return slots;
  }, [role, slots, currentTeacherId, currentStudentId, enrollments]);

  // Filtered Visible Schedule Set
  const visibleSlots = useMemo(() => {
    return roleBaseSlots.filter((slot) => {
      if (selectedDayFilter !== "all" && slot.dayOfWeek !== selectedDayFilter) return false;
      if (filterTeacher !== "all" && slot.teacherId !== filterTeacher) return false;
      if (filterSubject !== "all" && slot.subject !== filterSubject) return false;
      if (filterBatch !== "all" && slot.batch !== filterBatch && slot.batchId !== filterBatch) return false;
      if (filterStatus !== "all" && (slot.status || "active") !== filterStatus) return false;
      return true;
    });
  }, [
    roleBaseSlots,
    selectedDayFilter,
    filterTeacher,
    filterSubject,
    filterBatch,
    filterStatus,
  ]);

  // Schedules occurring during the currently selected week
  const currentWeekVisibleSlots = useMemo(() => {
    return visibleSlots.filter((slot) =>
      weekDays.some((dayInfo) => isSlotOnDate(slot, dayInfo.dateString, dayInfo.dayOfWeek))
    );
  }, [visibleSlots, weekDays]);

  // Dynamic grid hours: Defaults to 08:00 AM - 08:00 PM (12h), expands dynamically if classes exist outside
  const { gridStartHour, gridEndHour } = useMemo(() => {
    let minH = GRID_START_HOUR;
    let maxH = GRID_END_HOUR;
    for (const slot of currentWeekVisibleSlots) {
      const { start, end } = getSlotTimeMinutes(slot);
      const startH = Math.floor(start / 60);
      const endH = Math.ceil(end / 60);
      if (startH < minH) minH = Math.max(0, startH);
      if (endH > maxH) maxH = Math.min(24, endH);
    }
    return { gridStartHour: minH, gridEndHour: maxH };
  }, [currentWeekVisibleSlots]);

  const totalGridHours = gridEndHour - gridStartHour;
  const totalGridHeightPx = totalGridHours * 60;

  // Summary Metrics based on actual schedule records for the selected week
  const totalClasses = currentWeekVisibleSlots.length;
  const activeClasses = currentWeekVisibleSlots.filter((s) => (s.status || "active") === "active").length;
  const cancelledClasses = currentWeekVisibleSlots.filter((s) => s.status === "cancelled").length;
  const uniqueSubjectsCount = new Set(currentWeekVisibleSlots.map((s) => s.subject)).size;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      {/* Action Notification Banner */}
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
            border: `1px solid ${notification.type === "error" ? "rgba(255, 59, 48, 0.3)" : "rgba(52, 199, 89, 0.3)"}`,
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

      {/* Main Header Card with Week Navigation */}
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
                  ? "Ward's Academic Timetable"
                  : role === "student"
                  ? "My Weekly Class Timetable"
                  : role === "teacher"
                  ? "Faculty Routine & Schedule Builder"
                  : "Consolidated Master Timetable"}
              </h2>
              <Badge variant="accent" size="sm">
                {role === "teacher"
                  ? `Faculty: ${activeTeacher?.name || "Assigned"}`
                  : role === "student"
                  ? "Student Scope"
                  : role === "parent"
                  ? "Guardian Scope"
                  : "All Faculty & Batches"}
              </Badge>
            </div>
            <p
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--color-neutral-dark)",
              }}
            >
              {role === "parent"
                ? "Personalized 7-day class schedule derived from enrolled subjects for ward (Mon–Sun)."
                : role === "student"
                ? "Your weekly class routine across all currently enrolled subjects and batches (Mon–Sun)."
                : role === "teacher"
                ? "Create and manage your weekly lectures, inspect timing conflicts, and schedule batch routines."
                : "Central institutional schedule management, cross-faculty timetable overview, and conflict tracking."}
            </p>
          </div>

          {/* Action & View Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
            {/* View Mode Toggle */}
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
                onClick={() => setViewMode("calendar")}
                style={{
                  padding: "4px 10px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "var(--text-xs)",
                  fontWeight: viewMode === "calendar" ? 700 : 500,
                  backgroundColor: viewMode === "calendar" ? "var(--color-surface)" : "transparent",
                  color: "var(--color-primary)",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: viewMode === "calendar" ? "var(--shadow-sm)" : "none",
                }}
              >
                📅 Weekly Calendar
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                style={{
                  padding: "4px 10px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "var(--text-xs)",
                  fontWeight: viewMode === "list" ? 700 : 500,
                  backgroundColor: viewMode === "list" ? "var(--color-surface)" : "transparent",
                  color: "var(--color-primary)",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: viewMode === "list" ? "var(--shadow-sm)" : "none",
                }}
              >
                📋 List View
              </button>
            </div>

            {/* Routine Creator for Teacher & Admin */}
            {(role === "teacher" || role === "academy-admin") && (
              <Button variant="primary" size="sm" onClick={openCreateModal}>
                + Add Routine Class
              </Button>
            )}
          </div>
        </div>

        {/* Calendar Navigation Bar: Previous, Today, Next, Date Range */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "var(--space-3)",
            marginTop: "var(--space-4)",
            padding: "var(--space-3)",
            backgroundColor: "var(--color-surface-muted)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <Button variant="secondary" size="sm" onClick={handlePrevWeek}>
              &larr; Previous Week
            </Button>
            <Button variant="secondary" size="sm" onClick={handleTodayWeek}>
              Today
            </Button>
            <Button variant="secondary" size="sm" onClick={handleNextWeek}>
              Next Week &rarr;
            </Button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <span
              style={{
                fontSize: "var(--text-sm)",
                fontWeight: 700,
                color: "var(--color-primary)",
                letterSpacing: "-0.2px",
              }}
            >
              📅 {weekRangeLabel}
            </span>
            <span
              style={{
                fontSize: "11px",
                padding: "2px 8px",
                borderRadius: "var(--radius-full)",
                backgroundColor: "var(--color-surface)",
                color: "var(--color-neutral-dark)",
                border: "1px solid var(--color-border)",
                fontWeight: 600,
              }}
            >
              7-Day Mon–Sun
            </span>
          </div>
        </div>

        {/* Timetable KPI Summary Metrics */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "var(--space-3)",
            marginTop: "var(--space-3)",
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
              Week Lectures
            </span>
            <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--color-primary)", marginTop: "2px" }}>
              {totalClasses} Classes
            </div>
            <span style={{ fontSize: "10px", color: "var(--color-neutral-dark)" }}>Scheduled in week</span>
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
              Active Sessions
            </span>
            <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--color-success, #34C759)", marginTop: "2px" }}>
              {activeClasses} Active
            </div>
            <span style={{ fontSize: "10px", color: "var(--color-neutral-dark)" }}>Confirmed slots</span>
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
            <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: cancelledClasses > 0 ? "var(--color-danger, #FF3B30)" : "var(--color-neutral-dark)", marginTop: "2px" }}>
              {cancelledClasses} Cancelled
            </div>
            <span style={{ fontSize: "10px", color: "var(--color-neutral-dark)" }}>Suspended slots</span>
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
              Curriculum
            </span>
            <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--color-accent)", marginTop: "2px" }}>
              {uniqueSubjectsCount} Subjects
            </div>
            <span style={{ fontSize: "10px", color: "var(--color-neutral-dark)" }}>Active this week</span>
          </div>
        </div>

        {/* Filter Strip (Focus on teacher, subject, batch, status - Room completely removed) */}
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

          {/* Batch Filter (for Admin / Teacher) */}
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

          {/* Status Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", fontWeight: 500 }}>
              Status:
            </span>
            <select
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
              <option value="all">All States</option>
              <option value="active">Active Only</option>
              <option value="cancelled">Cancelled Only</option>
            </select>
          </div>

          {/* Weekday Filter for List View */}
          {viewMode === "list" && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", fontWeight: 500 }}>
                Weekday:
              </span>
              <select
                value={selectedDayFilter}
                onChange={(e) => setSelectedDayFilter(e.target.value as DayOfWeek | "all")}
                style={{
                  fontSize: "var(--text-xs)",
                  padding: "4px 8px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-surface)",
                }}
              >
                <option value="all">All 7 Days</option>
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* 1. WEEKLY CALENDAR GRID VIEW (MONDAY THROUGH SUNDAY)                     */}
      {/* ========================================================================= */}
      {viewMode === "calendar" && (
        <div>
          {/* Desktop & Tablet 7-Day Calendar Grid */}
          <div
            style={{
              backgroundColor: "var(--color-surface)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-border)",
              boxShadow: "var(--shadow-sm)",
              overflow: "hidden",
            }}
          >
            {/* Scrollable grid wrapper */}
            <div style={{ overflowX: "auto" }}>
              <div
                style={{
                  minWidth: "1020px",
                  display: "grid",
                  gridTemplateColumns: "75px repeat(7, 1fr)",
                }}
              >
                {/* 1. Header Corner: Time */}
                <div
                  style={{
                    padding: "12px 8px",
                    textAlign: "center",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "var(--color-neutral-dark)",
                    backgroundColor: "var(--color-surface-muted)",
                    borderBottom: "1px solid var(--color-border)",
                    borderRight: "1px solid var(--color-border)",
                  }}
                >
                  Time
                </div>

                {/* 2. Seven Day Column Headers: Monday through Sunday */}
                {weekDays.map((dayInfo) => {
                  const daySlots = visibleSlots.filter((s) =>
                    isSlotOnDate(s, dayInfo.dateString, dayInfo.dayOfWeek)
                  );
                  return (
                    <div
                      key={dayInfo.dayOfWeek}
                      style={{
                        padding: "10px 8px",
                        textAlign: "center",
                        backgroundColor: dayInfo.isToday ? "rgba(0, 122, 255, 0.05)" : "var(--color-surface-muted)",
                        borderBottom: "1px solid var(--color-border)",
                        borderRight: dayInfo.dayOfWeek === "Sunday" ? "none" : "1px solid var(--color-border)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "var(--text-xs)",
                          fontWeight: 700,
                          color: dayInfo.isToday ? "var(--color-accent)" : "var(--color-primary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "4px",
                        }}
                      >
                        {dayInfo.dayOfWeek}
                        {dayInfo.isToday && (
                          <span
                            style={{
                              fontSize: "9px",
                              backgroundColor: "var(--color-accent)",
                              color: "#FFFFFF",
                              padding: "1px 5px",
                              borderRadius: "4px",
                              fontWeight: 700,
                            }}
                          >
                            Today
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "var(--color-neutral-dark)",
                          marginTop: "2px",
                        }}
                      >
                        {dayInfo.shortDateLabel}
                      </div>
                      <div
                        style={{
                          fontSize: "10px",
                          color: "var(--color-neutral-dark)",
                          marginTop: "2px",
                        }}
                      >
                        {daySlots.length === 0 ? "No classes" : `${daySlots.length} ${daySlots.length === 1 ? "class" : "classes"}`}
                      </div>
                    </div>
                  );
                })}

                {/* 3. Grid Body: Time Labels Column + 7 Day Columns */}
                {/* Time Axis Column */}
                <div
                  style={{
                    borderRight: "1px solid var(--color-border)",
                    backgroundColor: "var(--color-surface)",
                    display: "flex",
                    flexDirection: "column",
                    height: `${totalGridHeightPx}px`,
                  }}
                >
                  {Array.from({ length: totalGridHours }).map((_, i) => {
                    const hour = gridStartHour + i;
                    const label = formatMinutesTo12Hour(hour * 60);
                    return (
                      <div
                        key={hour}
                        style={{
                          height: "60px",
                          borderBottom: "1px dashed var(--color-border-subtle, rgba(0,0,0,0.06))",
                          fontSize: "10px",
                          fontWeight: 500,
                          color: "var(--color-neutral-dark)",
                          paddingTop: "2px",
                          paddingRight: "6px",
                          textAlign: "right",
                          boxSizing: "border-box",
                        }}
                      >
                        {label}
                      </div>
                    );
                  })}
                </div>

                {/* 7 Day Event Columns */}
                {weekDays.map((dayInfo) => {
                  const daySlots = visibleSlots.filter((s) =>
                    isSlotOnDate(s, dayInfo.dateString, dayInfo.dayOfWeek)
                  );
                  const positionedSlots = computeDaySlotPositions(daySlots);

                  return (
                    <div
                      key={dayInfo.dayOfWeek}
                      style={{
                        position: "relative",
                        height: `${totalGridHeightPx}px`,
                        borderRight: dayInfo.dayOfWeek === "Sunday" ? "none" : "1px solid var(--color-border)",
                        backgroundColor: dayInfo.isToday
                          ? "rgba(0, 122, 255, 0.02)"
                          : dayInfo.dayOfWeek === "Sunday"
                          ? "rgba(0,0,0,0.01)"
                          : "var(--color-surface)",
                      }}
                    >
                      {/* Background hourly guidelines */}
                      {Array.from({ length: totalGridHours }).map((_, i) => {
                        const hour = gridStartHour + i;
                        return (
                          <div
                            key={hour}
                            style={{
                              position: "absolute",
                              top: `${i * 60}px`,
                              left: 0,
                              right: 0,
                              height: "60px",
                              borderBottom: "1px dashed var(--color-border-subtle, rgba(0,0,0,0.06))",
                              pointerEvents: "none",
                            }}
                          />
                        );
                      })}

                      {/* Empty Day State */}
                      {daySlots.length === 0 && (
                        <div
                          style={{
                            position: "absolute",
                            top: "40%",
                            left: "8px",
                            right: "8px",
                            textAlign: "center",
                            fontSize: "11px",
                            color: "var(--color-neutral)",
                            userSelect: "none",
                            pointerEvents: "none",
                          }}
                        >
                          No scheduled lectures
                        </div>
                      )}

                      {/* Positioned Class Blocks with Unified TimetableEventCard */}
                      {positionedSlots.map(({ slot, startMinutes, endMinutes, colIndex, totalCols }) => (
                        <TimetableEventCard
                          key={slot.id}
                          slot={slot}
                          startMinutes={startMinutes}
                          endMinutes={endMinutes}
                          colIndex={colIndex}
                          totalCols={totalCols}
                          gridStartHour={gridStartHour}
                          gridEndHour={gridEndHour}
                          onClick={setDetailsSlot}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CHRONOLOGICAL LIST VIEW (TABLE / CARDS)                                */}
      {/* ========================================================================= */}
      {viewMode === "list" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "var(--space-4)",
          }}
        >
          {visibleSlots.length === 0 ? (
            <div
              style={{
                gridColumn: "1 / -1",
                padding: "var(--space-8)",
                textAlign: "center",
                backgroundColor: "var(--color-surface)",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--color-border)",
                color: "var(--color-neutral-dark)",
                fontSize: "var(--text-sm)",
              }}
            >
              No scheduled classes match the selected filter criteria.
            </div>
          ) : (
            visibleSlots.map((slot) => {
              const theme = getSubjectTheme(slot.subject);
              const isCancelled = slot.status === "cancelled";
              const isSpecificDate = slot.scheduleType === "specific_date";

              return (
                <div
                  key={slot.id}
                  style={{
                    backgroundColor: "var(--color-surface)",
                    borderRadius: "var(--radius-lg)",
                    border: `1px solid ${isCancelled ? "rgba(255, 59, 48, 0.3)" : "var(--color-border)"}`,
                    padding: "var(--space-4)",
                    boxShadow: "var(--shadow-sm)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "var(--space-3)",
                    borderLeft: `5px solid ${isCancelled ? "var(--color-danger, #FF3B30)" : theme.primary}`,
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "var(--space-2)",
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
                          {slot.subject}
                        </span>
                        {isCancelled && (
                          <Badge variant="danger" size="sm">
                            Cancelled
                          </Badge>
                        )}
                        {isSpecificDate && (
                          <span
                            style={{
                              fontSize: "10px",
                              padding: "2px 6px",
                              borderRadius: "var(--radius-sm)",
                              backgroundColor: "var(--color-surface-muted)",
                              color: "var(--color-neutral-dark)",
                              border: "1px solid var(--color-border)",
                            }}
                          >
                            Special Session
                          </span>
                        )}
                      </div>

                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "var(--color-primary)",
                          backgroundColor: "var(--color-surface-muted)",
                          padding: "2px 8px",
                          borderRadius: "var(--radius-sm)",
                        }}
                      >
                        {slot.specificDate ? `${slot.dayOfWeek} (${slot.specificDate})` : slot.dayOfWeek}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: "var(--text-base)",
                        fontWeight: 700,
                        color: "var(--color-primary)",
                        textDecoration: isCancelled ? "line-through" : "none",
                      }}
                    >
                      {slot.time}
                    </div>

                    <div style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", marginTop: "2px" }}>
                      {slot.batch} &bull; {slot.classGrade}
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        borderTop: "1px solid var(--color-border)",
                        paddingTop: "var(--space-2)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: "11px",
                        marginBottom: role === "teacher" || role === "academy-admin" ? "var(--space-2)" : 0,
                      }}
                    >
                      <span style={{ color: "var(--color-primary)", fontWeight: 500 }}>
                        Faculty: <strong>{slot.teacherName}</strong>
                      </span>
                      <span
                        style={{
                          color: "var(--color-neutral-dark)",
                          backgroundColor: "var(--color-surface-muted)",
                          padding: "2px 6px",
                          borderRadius: "var(--radius-sm)",
                        }}
                      >
                        {slot.scheduleType === "specific_date" ? "Date-Specific" : "Weekly Routine"}
                      </span>
                    </div>

                    {/* Controls for Teacher & Admin */}
                    {(role === "teacher" || role === "academy-admin") && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: "var(--space-2)",
                          marginTop: "6px",
                        }}
                      >
                        {role === "academy-admin" && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setDeletingSlot(slot)}
                            style={{
                              backgroundColor: "rgba(255, 59, 48, 0.08)",
                              color: "var(--color-danger, #FF3B30)",
                              borderColor: "rgba(255, 59, 48, 0.25)",
                            }}
                          >
                            Delete
                          </Button>
                        )}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleToggleCancelSlot(slot)}
                        >
                          {isCancelled ? "Reactivate" : "Cancel Class"}
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => openEditModal(slot)}
                        >
                          Edit Routine
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. CLASS DETAILS MODAL (POPUP ON BLOCK CLICK)                             */}
      {/* ========================================================================= */}
      {detailsSlot && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setDetailsSlot(null);
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
              maxWidth: "460px",
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
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, margin: 0 }}>
                  Lecture Details
                </h3>
                {detailsSlot.status === "cancelled" ? (
                  <Badge variant="danger" size="sm">
                    Cancelled
                  </Badge>
                ) : (
                  <Badge variant="success" size="sm">
                    Active Scheduled
                  </Badge>
                )}
              </div>
              <button
                type="button"
                onClick={() => setDetailsSlot(null)}
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
                <span style={{ color: "var(--color-neutral-dark)" }}>Subject:</span>
                <strong style={{ color: getSubjectTheme(detailsSlot.subject).primary }}>
                  {detailsSlot.subject}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-neutral-dark)" }}>Schedule Type:</span>
                <strong>{detailsSlot.scheduleType === "specific_date" ? "Date-Specific Session" : "Recurring Weekly Routine"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-neutral-dark)" }}>Day / Date:</span>
                <strong>
                  {detailsSlot.specificDate
                    ? `${detailsSlot.dayOfWeek} (${detailsSlot.specificDate})`
                    : detailsSlot.dayOfWeek}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-neutral-dark)" }}>Time Interval:</span>
                <strong>{detailsSlot.time}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-neutral-dark)" }}>Batch &amp; Grade:</span>
                <strong>
                  {detailsSlot.batch} ({detailsSlot.classGrade})
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-neutral-dark)" }}>Faculty Instructor:</span>
                <strong>{detailsSlot.teacherName}</strong>
              </div>
            </div>

            {/* Modal Actions */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "var(--space-2)",
                marginTop: "var(--space-6)",
              }}
            >
              {role === "academy-admin" && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setDeletingSlot(detailsSlot)}
                  style={{
                    backgroundColor: "rgba(255, 59, 48, 0.08)",
                    color: "var(--color-danger, #FF3B30)",
                    borderColor: "rgba(255, 59, 48, 0.25)",
                    marginRight: "auto",
                  }}
                >
                  Delete Session
                </Button>
              )}
              {(role === "teacher" || role === "academy-admin") && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleToggleCancelSlot(detailsSlot)}
                  >
                    {detailsSlot.status === "cancelled" ? "Reactivate Class" : "Cancel Class"}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => openEditModal(detailsSlot)}
                  >
                    Edit Routine
                  </Button>
                </>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDetailsSlot(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. CREATE / EDIT ROUTINE SCHEDULE MODAL                                   */}
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
              maxWidth: "520px",
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
                {editingSlotId ? "Edit Timetable Routine" : "Add Routine Lecture"}
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
              {/* Conflict / Validation Error Banner */}
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

              {/* Schedule Type Selection (Recurring Weekly vs Date-Specific) */}
              <div style={{ marginBottom: "var(--space-3)" }}>
                <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "4px" }}>
                  Schedule Type:
                </label>
                <div style={{ display: "flex", gap: "var(--space-3)" }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "var(--text-xs)",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="scheduleType"
                      checked={formScheduleType === "recurring"}
                      onChange={() => {
                        setFormScheduleType("recurring");
                        setFormError(null);
                      }}
                    />
                    Recurring Weekly Routine
                  </label>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "var(--text-xs)",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="scheduleType"
                      checked={formScheduleType === "specific_date"}
                      onChange={() => {
                        setFormScheduleType("specific_date");
                        setFormError(null);
                      }}
                    />
                    Date-Specific Special Session
                  </label>
                </div>
              </div>

              {/* Day / Date & Timing Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.2fr 1fr 1fr",
                  gap: "var(--space-3)",
                  marginBottom: "var(--space-3)",
                }}
              >
                {formScheduleType === "recurring" ? (
                  <div>
                    <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "4px" }}>
                      Day (Mon–Sun):
                    </label>
                    <select
                      value={formDay}
                      onChange={(e) => {
                        setFormDay(e.target.value as DayOfWeek);
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
                      {DAYS_OF_WEEK.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "4px" }}>
                      Scheduled Date:
                    </label>
                    <input
                      type="date"
                      required
                      value={formSpecificDate}
                      onChange={(e) => {
                        setFormSpecificDate(e.target.value);
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
                )}

                <div>
                  <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "4px" }}>
                    Start Time:
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
                    End Time:
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

              {/* Faculty Selector (Only Admin can reassign faculty; locked for teacher) */}
              <div style={{ marginBottom: "var(--space-3)" }}>
                <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "4px" }}>
                  Assigned Teacher:
                </label>
                {role === "academy-admin" ? (
                  <select
                    value={formTeacherId}
                    onChange={(e) => {
                      setFormTeacherId(e.target.value);
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
                    {faculty.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.assignedSubjects.join(", ")})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    disabled
                    value={`${activeTeacher.name} (Assigned Profile)`}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border)",
                      fontSize: "var(--text-xs)",
                      backgroundColor: "var(--color-surface-muted)",
                      color: "var(--color-neutral-dark)",
                    }}
                  />
                )}
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
                    Subject:
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
                    Batch / Class:
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

              {/* Schedule State */}
              <div style={{ marginBottom: "var(--space-6)" }}>
                <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "4px" }}>
                  Schedule State:
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as "active" | "cancelled")}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-border)",
                    fontSize: "var(--text-xs)",
                    backgroundColor: "var(--color-surface)",
                  }}
                >
                  <option value="active">Active (Confirmed Lecture)</option>
                  <option value="cancelled">Cancelled (Suspended)</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "var(--space-2)",
                }}
              >
                {editingSlotId && role === "academy-admin" && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const target = slots.find((s) => s.id === editingSlotId);
                      if (target) setDeletingSlot(target);
                    }}
                    style={{
                      backgroundColor: "rgba(255, 59, 48, 0.08)",
                      color: "var(--color-danger, #FF3B30)",
                      borderColor: "rgba(255, 59, 48, 0.25)",
                      marginRight: "auto",
                    }}
                  >
                    Delete Session
                  </Button>
                )}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsFormModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  {editingSlotId ? "Save Routine Changes" : "Create Routine Schedule"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. DELETE TIMETABLE SESSION CONFIRMATION MODAL                            */}
      {/* ========================================================================= */}
      {deletingSlot && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeletingSlot(null);
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
            zIndex: 200,
            padding: "var(--space-4)",
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-session-dialog-title"
        >
          <div
            style={{
              backgroundColor: "var(--color-surface)",
              borderRadius: "var(--radius-lg)",
              maxWidth: "480px",
              width: "100%",
              padding: "var(--space-6)",
              boxShadow: "var(--shadow-xl, 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04))",
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
                <h3
                  id="delete-session-dialog-title"
                  style={{
                    fontSize: "var(--text-lg)",
                    fontWeight: 700,
                    color: "var(--color-danger, #FF3B30)",
                    marginBottom: "4px",
                  }}
                >
                  {deletingSlot.scheduleType === "specific_date" || Boolean(deletingSlot.specificDate)
                    ? "Delete Special Session"
                    : "Delete Recurring Routine"}
                </h3>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", margin: 0 }}>
                  {deletingSlot.scheduleType === "specific_date" || Boolean(deletingSlot.specificDate)
                    ? "Confirm removing this date-specific class occurrence."
                    : "Confirm removing this weekly recurring routine rule."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeletingSlot(null)}
                aria-label="Close dialog"
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "var(--text-lg)",
                  cursor: "pointer",
                  color: "var(--color-neutral-dark)",
                  padding: "4px",
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>

            {/* Session Detail Summary Box */}
            <div
              style={{
                backgroundColor: "var(--color-surface-muted)",
                borderRadius: "var(--radius-md)",
                padding: "var(--space-4)",
                fontSize: "var(--text-xs)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-2)",
                marginBottom: "var(--space-4)",
                border: "1px solid var(--color-border)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-neutral-dark)" }}>Subject:</span>
                <strong style={{ color: getSubjectTheme(deletingSlot.subject).primary }}>
                  {deletingSlot.subject}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-neutral-dark)" }}>Schedule Type:</span>
                <strong>
                  {deletingSlot.scheduleType === "specific_date" || Boolean(deletingSlot.specificDate)
                    ? "Date-Specific Session (Single Occurrence)"
                    : "Recurring Weekly Routine (All Weeks)"}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-neutral-dark)" }}>Day / Date:</span>
                <strong>
                  {deletingSlot.specificDate
                    ? `${deletingSlot.dayOfWeek} (${deletingSlot.specificDate})`
                    : `Every ${deletingSlot.dayOfWeek}`}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-neutral-dark)" }}>Scheduled Time:</span>
                <strong>{deletingSlot.time}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-neutral-dark)" }}>Batch &amp; Class:</span>
                <strong>
                  {deletingSlot.batch} ({deletingSlot.classGrade})
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-neutral-dark)" }}>Faculty Instructor:</span>
                <strong>{deletingSlot.teacherName}</strong>
              </div>
            </div>

            {/* Explanatory Scope Notice */}
            <div
              style={{
                padding: "10px 12px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "rgba(255, 59, 48, 0.08)",
                border: "1px solid rgba(255, 59, 48, 0.2)",
                fontSize: "11px",
                lineHeight: "1.4",
                color: "var(--color-primary)",
                marginBottom: "var(--space-6)",
              }}
            >
              {deletingSlot.scheduleType === "specific_date" || Boolean(deletingSlot.specificDate) ? (
                <>
                  <strong>Occurrence scope:</strong> Deleting will remove only this special session on{" "}
                  <strong>{deletingSlot.specificDate}</strong>. Other classes and faculty assignments remain unaffected.
                </>
              ) : (
                <>
                  <strong>Routine rule scope:</strong> This session is stored as a weekly recurring routine rule. Deleting will remove this class from <strong>all weeks</strong> in the timetable.
                </>
              )}
            </div>

            {/* Modal Actions */}
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
                onClick={() => setDeletingSlot(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleConfirmDelete}
                style={{
                  backgroundColor: "var(--color-danger, #FF3B30)",
                  borderColor: "var(--color-danger, #FF3B30)",
                  color: "#FFFFFF",
                }}
              >
                {deletingSlot.scheduleType === "specific_date" || Boolean(deletingSlot.specificDate)
                  ? "Delete Special Session"
                  : "Delete Recurring Routine"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
