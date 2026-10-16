/**
 * AROUSH ACADEMY — Central Attendance Domain Logic & Calculations
 *
 * Provides shared, consistent, and strictly validated attendance functions across:
 * 1. Academy Admin Workspace
 * 2. Teacher Session Marking & History
 * 3. Student Attendance Portal
 * 4. Parent Ward Tracking Portal
 */

import type {
  AttendanceRecord,
  AttendanceStatus,
  AttendanceAuditEntry,
  UserRole,
  StudentProfile,
  SubjectEnrollment,
  BatchDefinition,
  TimetableSlot,
} from "@/types";

export const ATTENDANCE_POLICY = {
  formula: "Attendance Percentage = (Attended Classes ÷ Total Classes) × 100",
  targetThreshold: 80,
  rules: [
    "Total Classes: Number of finalized attendance sessions for that student and subject.",
    "Attended Classes: Number of sessions marked Present.",
    "Absent Classes: Total Classes minus Attended Classes.",
    "Attendance Percentage: (Attended Classes ÷ Total Classes) × 100 (0% if zero sessions recorded).",
    "Each finalized session is counted exactly once.",
  ],
} as const;

export interface AttendanceStats {
  totalClasses: number;
  attendedClasses: number;
  absentClasses: number;
  percentage: number; // 0 - 100
  // Compatibility aliases
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attended: number;
  rate: number;
}

/**
 * Normalizes an individual attendance record safely to support legacy or partial entries.
 */
export function normalizeAttendanceRecord(r: AttendanceRecord): AttendanceRecord {
  const status: AttendanceStatus =
    r.status === "present" || r.status === "absent" || r.status === "late" || r.status === "excused"
      ? r.status
      : "present";

  const safeBatch = r.batch || "Batch Alpha (Class IX-X)";
  const safeDate = r.date || new Date().toISOString().split("T")[0];
  const sessionId =
    r.sessionId ||
    `sess-${(r.batchId || safeBatch).toLowerCase().replace(/[^a-z0-9]/g, "-")}-${safeDate}`;

  return {
    ...r,
    sessionId,
    status,
    batch: safeBatch,
    date: safeDate,
    auditTrail: Array.isArray(r.auditTrail) ? r.auditTrail : [],
  };
}

/**
 * Normalizes a list of attendance records.
 */
export function normalizeAttendanceList(list: unknown): AttendanceRecord[] {
  if (!Array.isArray(list)) return [];
  return list.map((item) => normalizeAttendanceRecord(item as AttendanceRecord));
}

/**
 * Shared calculation helper for attendance statistics.
 * Computes:
 * - Total Classes: Number of finalized attendance sessions applicable to that student/subject.
 * - Attended Classes: Number of sessions marked Present.
 * - Absent Classes: Total Classes minus Attended Classes.
 * - Attendance Percentage: (Attended Classes / Total Classes) * 100.
 * Handles zero sessions cleanly with 0% instead of NaN.
 */
export function calculateAttendanceStats(records: AttendanceRecord[]): AttendanceStats {
  // Deduplicate records by unique session and student
  const uniqueRecords: AttendanceRecord[] = [];
  const seenSessions = new Set<string>();

  for (const r of records) {
    const key = r.sessionId ? `${r.sessionId}::${r.studentId}` : r.id;
    if (!seenSessions.has(key)) {
      seenSessions.add(key);
      uniqueRecords.push(r);
    }
  }

  const totalClasses = uniqueRecords.length;
  let attendedClasses = 0;
  let late = 0;
  let excused = 0;

  for (const r of uniqueRecords) {
    if (r.status === "present") {
      attendedClasses++;
    } else if (r.status === "late") {
      // Legacy compatibility: count late as attended
      attendedClasses++;
      late++;
    } else if (r.status === "excused") {
      excused++;
    }
  }

  // Absent Classes = Total Classes minus Attended Classes
  const absentClasses = Math.max(0, totalClasses - attendedClasses);
  const percentage = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;

  return {
    totalClasses,
    attendedClasses,
    absentClasses,
    percentage,
    total: totalClasses,
    present: attendedClasses,
    absent: absentClasses,
    late,
    excused,
    attended: attendedClasses,
    rate: percentage,
  };
}

export interface SubjectAttendanceSummary {
  subject: string;
  subjectId?: string;
  teacherName?: string;
  stats: AttendanceStats;
  recentStatus?: AttendanceStatus;
  lastSessionDate?: string;
}

/**
 * Generates subject-wise attendance summaries.
 */
export function calculateSubjectBreakdown(records: AttendanceRecord[]): SubjectAttendanceSummary[] {
  const map = new Map<string, AttendanceRecord[]>();
  for (const r of records) {
    const key = r.subject || "General";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }

  const results: SubjectAttendanceSummary[] = [];
  for (const [subject, subRecords] of map.entries()) {
    const sorted = [...subRecords].sort((a, b) => b.date.localeCompare(a.date));
    results.push({
      subject,
      subjectId: sorted[0]?.subjectId,
      teacherName: sorted[0]?.recordedBy || sorted[0]?.teacherId,
      stats: calculateAttendanceStats(sorted),
      recentStatus: sorted[0]?.status,
      lastSessionDate: sorted[0]?.date,
    });
  }

  return results.sort((a, b) => a.subject.localeCompare(b.subject));
}

export interface MonthlyAttendanceSummary {
  monthKey: string; // e.g. "2026-10"
  monthLabel: string; // e.g. "October 2026"
  stats: AttendanceStats;
}

/**
 * Aggregates attendance records by month.
 */
export function calculateMonthlyBreakdown(records: AttendanceRecord[]): MonthlyAttendanceSummary[] {
  const map = new Map<string, AttendanceRecord[]>();
  for (const r of records) {
    const key = r.date ? r.date.slice(0, 7) : "Unknown";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }

  const results: MonthlyAttendanceSummary[] = [];
  for (const [monthKey, mRecords] of map.entries()) {
    const [year, month] = monthKey.split("-");
    let monthLabel = monthKey;
    if (year && month) {
      const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      monthLabel = d.toLocaleString("en-US", { month: "long", year: "numeric" });
    }
    results.push({
      monthKey,
      monthLabel,
      stats: calculateAttendanceStats(mRecords),
    });
  }

  return results.sort((a, b) => b.monthKey.localeCompare(a.monthKey));
}

export interface StudentAttendanceSummary {
  studentId: string;
  studentName: string;
  classGrade?: string;
  board?: string;
  stats: AttendanceStats;
  recentStatus?: AttendanceStatus;
  lastDate?: string;
}

/**
 * Aggregates attendance statistics by student across all enrolled subjects.
 */
export function calculateStudentBreakdown(
  records: AttendanceRecord[],
  students: StudentProfile[]
): StudentAttendanceSummary[] {
  const map = new Map<string, AttendanceRecord[]>();
  for (const r of records) {
    if (!map.has(r.studentId)) map.set(r.studentId, []);
    map.get(r.studentId)!.push(r);
  }

  const results: StudentAttendanceSummary[] = [];
  const seenIds = new Set<string>();

  for (const [studentId, sRecords] of map.entries()) {
    seenIds.add(studentId);
    const sProfile = students.find((s) => s.id === studentId);
    const sorted = [...sRecords].sort((a, b) => b.date.localeCompare(a.date));
    results.push({
      studentId,
      studentName: sProfile?.name || sRecords[0]?.studentName || studentId,
      classGrade: sProfile?.classGrade,
      board: sProfile?.board,
      stats: calculateAttendanceStats(sorted),
      recentStatus: sorted[0]?.status,
      lastDate: sorted[0]?.date,
    });
  }

  for (const s of students) {
    if (!seenIds.has(s.id)) {
      results.push({
        studentId: s.id,
        studentName: s.name,
        classGrade: s.classGrade,
        board: s.board,
        stats: calculateAttendanceStats([]),
      });
    }
  }

  return results.sort((a, b) => a.studentName.localeCompare(b.studentName));
}

/**
 * Stable Session ID generator.
 * Format: sess-{batch-slug}-{date}
 */
export function generateSessionId(batchIdentifier: string, date: string): string {
  const slug = batchIdentifier
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `sess-${slug}-${date}`;
}

/**
 * Enforces exactly one record per student per session.
 * Reopening and resaving updates existing records without duplication.
 */
export function upsertSessionAttendance(
  existingRecords: AttendanceRecord[],
  newSessionRecords: AttendanceRecord[]
): AttendanceRecord[] {
  const recordMap = new Map<string, AttendanceRecord>();

  // Load existing records keyed by sessionId + studentId
  for (const r of existingRecords) {
    const key = `${r.sessionId}::${r.studentId}`;
    recordMap.set(key, r);
  }

  const now = new Date().toISOString();
  for (const incoming of newSessionRecords) {
    const key = `${incoming.sessionId}::${incoming.studentId}`;
    const prev = recordMap.get(key);

    if (prev) {
      // Retain original record ID and audit history, update status/remarks and timestamp
      recordMap.set(key, {
        ...prev,
        ...incoming,
        id: prev.id,
        createdAt: prev.createdAt || now,
        updatedAt: now,
        auditTrail: prev.auditTrail || [],
      });
    } else {
      recordMap.set(key, {
        ...incoming,
        createdAt: incoming.createdAt || now,
        updatedAt: now,
        auditTrail: incoming.auditTrail || [],
      });
    }
  }

  // Preserve descending date ordering
  return Array.from(recordMap.values()).sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Admin Correction with mandatory reason and immutable audit trail.
 */
export function applyAttendanceCorrection(
  records: AttendanceRecord[],
  recordId: string,
  newStatus: AttendanceStatus,
  reason: string,
  correctedBy: string,
  correctedByRole: UserRole,
  newRemarks?: string
): { success: boolean; updatedRecords: AttendanceRecord[]; error?: string } {
  if (!reason || !reason.trim()) {
    return {
      success: false,
      updatedRecords: records,
      error: "A mandatory correction reason is required to modify attendance records.",
    };
  }

  const index = records.findIndex((r) => r.id === recordId);
  if (index === -1) {
    return {
      success: false,
      updatedRecords: records,
      error: "Selected attendance record was not found in active session state.",
    };
  }

  const target = records[index];
  const timestamp = new Date().toISOString();

  const auditEntry: AttendanceAuditEntry = {
    id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp,
    performedBy: correctedBy,
    performedByRole: correctedByRole,
    previousStatus: target.status,
    newStatus,
    reason: reason.trim(),
    previousRemarks: target.remarks,
    newRemarks: newRemarks !== undefined ? newRemarks.trim() : target.remarks,
  };

  const updated: AttendanceRecord = {
    ...target,
    status: newStatus,
    remarks: newRemarks !== undefined ? newRemarks.trim() || undefined : target.remarks,
    updatedAt: timestamp,
    auditTrail: [auditEntry, ...(target.auditTrail || [])],
  };

  const nextRecords = [...records];
  nextRecords[index] = updated;

  return { success: true, updatedRecords: nextRecords };
}

export interface ScheduledSessionItem {
  sessionId: string;
  slotId: string;
  batchId: string;
  batchName: string;
  subject: string;
  classGrade: string;
  teacherId: string;
  teacherName: string;
  date: string;
  dayOfWeek: string;
  time: string;
  room?: string;
  enrolledStudents: StudentProfile[];
  markedRecords: AttendanceRecord[];
  status: "completed" | "incomplete" | "pending";
  stats: AttendanceStats;
}

/**
 * Builds scheduled academic sessions based on timetable slots and October 2026 dates,
 * cross-referenced against saved attendance records and active student enrollments.
 */
export function getScheduledAcademicSessions(
  timetable: TimetableSlot[],
  batches: BatchDefinition[],
  enrollments: SubjectEnrollment[],
  students: StudentProfile[],
  attendanceRecords: AttendanceRecord[],
  targetDates: string[] = [
    "2026-10-05",
    "2026-10-06",
    "2026-10-07",
    "2026-10-08",
    "2026-10-09",
    "2026-10-10",
    "2026-10-12",
    "2026-10-13",
    "2026-10-14",
    "2026-10-15",
    "2026-10-16",
  ]
): ScheduledSessionItem[] {
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const sessions: ScheduledSessionItem[] = [];

  for (const dateStr of targetDates) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayOfWeek = dayNames[dateObj.getDay()];

    const daySlots = timetable.filter((slot) => slot.dayOfWeek === dayOfWeek);

    for (const slot of daySlots) {
      // Find matching batch
      const matchedBatch = batches.find(
        (b) => b.name === slot.batch || b.subject.includes(slot.subject)
      );
      const batchId = matchedBatch?.id || slot.batch.toLowerCase().replace(/[^a-z0-9]/g, "-");
      const sessionId = generateSessionId(batchId, dateStr);

      // Find enrolled students in this subject and batch
      const matchingEnrollments = enrollments.filter(
        (e) =>
          (e.batchName === slot.batch || e.subjectName === slot.subject) &&
          e.subjectName === slot.subject &&
          e.status === "active"
      );

      const enrolledStudentIds = Array.from(new Set(matchingEnrollments.map((e) => e.studentId)));
      const enrolledStudentList = students.filter((s) => enrolledStudentIds.includes(s.id));

      // Find attendance records matching this session (by sessionId or batch+subject+date)
      const matchingRecords = attendanceRecords.filter(
        (r) =>
          r.sessionId === sessionId ||
          (r.date === dateStr && r.subject === slot.subject && r.batch === slot.batch)
      );

      let status: "completed" | "incomplete" | "pending" = "pending";
      if (matchingRecords.length === 0) {
        status = "pending";
      } else if (
        enrolledStudentList.length > 0 &&
        matchingRecords.length >= enrolledStudentList.length
      ) {
        status = "completed";
      } else {
        status = "incomplete";
      }

      sessions.push({
        sessionId,
        slotId: slot.id,
        batchId,
        batchName: slot.batch,
        subject: slot.subject,
        classGrade: slot.classGrade,
        teacherId: slot.teacherId,
        teacherName: slot.teacherName,
        date: dateStr,
        dayOfWeek,
        time: slot.time,
        room: slot.room,
        enrolledStudents: enrolledStudentList,
        markedRecords: matchingRecords,
        status,
        stats: calculateAttendanceStats(matchingRecords),
      });
    }
  }

  return sessions.sort((a, b) => b.date.localeCompare(a.date));
}
