import type { AttendanceStatus } from "@/types";
import type { AttendanceStats } from "../attendanceCalculations";

export interface AttendanceQuery {
  studentId: string | null;
  from: string;
  to: string;
  limit: number;
  cursor: { date: string; id: string } | null;
}

export interface AttendanceReadRecord {
  id: string;
  batchId: string;
  date: string;
  status: AttendanceStatus;
  subjectId: string;
  subject: string;
  batch: string;
}

export type AttendanceReadError = "unauthorized" | "forbidden" | "incomplete_setup" | "invalid_request";

export type AttendanceReadResult =
  | { ok: false; reason: AttendanceReadError }
  | {
      ok: true;
      studentId: string;
      records: AttendanceReadRecord[];
      summary: AttendanceStats;
      summaryScope: "page";
      filters: { from: string; to: string };
      nextCursor: string | null;
    };
