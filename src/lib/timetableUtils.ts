import type { DayOfWeek, TimetableSlot, SubjectEnrollment } from "@/types";

export const DAYS_OF_WEEK: DayOfWeek[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export interface SubjectTheme {
  primary: string;
  bgSubtle: string;
  border: string;
  badgeBg: string;
  badgeText: string;
}

export const SUBJECT_THEMES: Record<string, SubjectTheme> = {
  Mathematics: {
    primary: "#007AFF",
    bgSubtle: "rgba(0, 122, 255, 0.08)",
    border: "rgba(0, 122, 255, 0.45)",
    badgeBg: "rgba(0, 122, 255, 0.15)",
    badgeText: "#0062CC",
  },
  Physics: {
    primary: "#5856D6",
    bgSubtle: "rgba(88, 86, 214, 0.08)",
    border: "rgba(88, 86, 214, 0.45)",
    badgeBg: "rgba(88, 86, 214, 0.15)",
    badgeText: "#4B49B6",
  },
  Chemistry: {
    primary: "#34C759",
    bgSubtle: "rgba(52, 199, 89, 0.08)",
    border: "rgba(52, 199, 89, 0.45)",
    badgeBg: "rgba(52, 199, 89, 0.15)",
    badgeText: "#1E7E34",
  },
  Accountancy: {
    primary: "#FF9500",
    bgSubtle: "rgba(255, 149, 0, 0.08)",
    border: "rgba(255, 149, 0, 0.45)",
    badgeBg: "rgba(255, 149, 0, 0.15)",
    badgeText: "#B86B00",
  },
  Economics: {
    primary: "#30B0C7",
    bgSubtle: "rgba(48, 176, 199, 0.08)",
    border: "rgba(48, 176, 199, 0.45)",
    badgeBg: "rgba(48, 176, 199, 0.15)",
    badgeText: "#147283",
  },
  Biology: {
    primary: "#FF2D55",
    bgSubtle: "rgba(255, 45, 85, 0.08)",
    border: "rgba(255, 45, 85, 0.45)",
    badgeBg: "rgba(255, 45, 85, 0.15)",
    badgeText: "#B81435",
  },
  "Computer Science": {
    primary: "#AF52DE",
    bgSubtle: "rgba(175, 82, 222, 0.08)",
    border: "rgba(175, 82, 222, 0.45)",
    badgeBg: "rgba(175, 82, 222, 0.15)",
    badgeText: "#782E9C",
  },
};

export function getSubjectTheme(subjectName: string): SubjectTheme {
  return (
    SUBJECT_THEMES[subjectName] || {
      primary: "#6E6E73",
      bgSubtle: "rgba(110, 110, 115, 0.08)",
      border: "rgba(110, 110, 115, 0.45)",
      badgeBg: "rgba(110, 110, 115, 0.15)",
      badgeText: "#424245",
    }
  );
}


export function parseTimeToMinutes(tStr: string): number {
  if (!tStr) return 0;
  const clean = tStr.trim();

  
  if (clean.includes("-")) {
    const parts = clean.split("-");
    return parseTimeToMinutes(parts[0]);
  }

  
  const match12 = clean.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const meridiem = match12[3].toUpperCase();
    if (meridiem === "PM" && hours < 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  
  const match24 = clean.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    return hours * 60 + minutes;
  }

  return 0;
}


export function formatMinutesTo12Hour(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const meridiem = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const padM = String(m).padStart(2, "0");
  const padH = String(displayH).padStart(2, "0");
  return `${padH}:${padM} ${meridiem}`;
}


export function formatMinutesTo24Hour(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}


export function getSlotTimeMinutes(slot: TimetableSlot): { start: number; end: number } {
  if (slot.startTime && slot.endTime) {
    const start = parseTimeToMinutes(slot.startTime);
    const end = parseTimeToMinutes(slot.endTime);
    if (end > start) {
      return { start, end };
    }
  }

  if (slot.time && slot.time.includes("-")) {
    const [startPart, endPart] = slot.time.split("-");
    const start = parseTimeToMinutes(startPart);
    const end = parseTimeToMinutes(endPart);
    if (end > start) {
      return { start, end };
    }
  }

  return { start: 960, end: 1050 }; 
}


export function formatSlotTime(slot: TimetableSlot): string {
  const { start, end } = getSlotTimeMinutes(slot);
  return `${formatMinutesTo12Hour(start)} - ${formatMinutesTo12Hour(end)}`;
}






export function formatDateToISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}


export function getDayOfWeekFromDate(d: Date): DayOfWeek {
  const day = d.getDay(); 
  const map: Record<number, DayOfWeek> = {
    0: "Sunday",
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday",
  };
  return map[day];
}


export function getMondayOfWeek(d: Date): Date {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = date.getDay(); 
  const diffDays = day === 0 ? 6 : day - 1;
  date.setDate(date.getDate() - diffDays);
  date.setHours(0, 0, 0, 0);
  return date;
}

export interface WeekDayInfo {
  dayOfWeek: DayOfWeek;
  date: Date;
  dateString: string; 
  shortDateLabel: string; 
  dayNumber: number; 
  isToday: boolean;
}


export function getWeekDays(monday: Date, todayDate: Date = new Date()): WeekDayInfo[] {
  const todayStr = formatDateToISO(todayDate);
  return DAYS_OF_WEEK.map((dayOfWeek, idx) => {
    const date = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + idx);
    const dateString = formatDateToISO(date);
    const dayNumber = date.getDate();
    const shortDateLabel = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const isToday = dateString === todayStr;
    return {
      dayOfWeek,
      date,
      dateString,
      shortDateLabel,
      dayNumber,
      isToday,
    };
  });
}


export function formatWeekRange(monday: Date): string {
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
  const startStr = monday.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endStr = sunday.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${startStr} - ${endStr}`;
}


export function isSlotOnDate(
  slot: TimetableSlot,
  dateString: string,
  dayOfWeek: DayOfWeek
): boolean {
  
  if (slot.scheduleType === "specific_date" || slot.specificDate) {
    return slot.specificDate === dateString;
  }

  
  if (slot.dayOfWeek !== dayOfWeek) return false;

  
  if (slot.effectiveFrom && dateString < slot.effectiveFrom) return false;
  if (slot.effectiveUntil && dateString > slot.effectiveUntil) return false;

  return true;
}


export function checkTimetableConflict(
  candidate: {
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    teacherId: string;
    teacherName?: string;
    batch: string;
    batchId?: string;
    subject: string;
    scheduleType?: "recurring" | "specific_date";
    specificDate?: string;
  },
  existingSlots: TimetableSlot[],
  editingId?: string
): { hasConflict: boolean; reason?: string } {
  const candStart = parseTimeToMinutes(candidate.startTime);
  const candEnd = parseTimeToMinutes(candidate.endTime);

  if (candStart >= candEnd) {
    return {
      hasConflict: true,
      reason: "Class start time must be earlier than the end time.",
    };
  }

  if (candEnd - candStart < 15) {
    return {
      hasConflict: true,
      reason: "Class duration must be at least 15 minutes.",
    };
  }

  for (const slot of existingSlots) {
    
    if (editingId && slot.id === editingId) continue;

    
    if (slot.status === "cancelled") continue;

    
    const isCandidateDateSpecific = candidate.scheduleType === "specific_date" && Boolean(candidate.specificDate);
    const isSlotDateSpecific = slot.scheduleType === "specific_date" && Boolean(slot.specificDate);

    if (isCandidateDateSpecific && isSlotDateSpecific) {
      if (slot.specificDate !== candidate.specificDate) continue;
    } else {
      
      if (slot.dayOfWeek !== candidate.dayOfWeek) continue;
    }

    const { start: slotStart, end: slotEnd } = getSlotTimeMinutes(slot);

    
    const isOverlap = slotStart < candEnd && candStart < slotEnd;
    if (!isOverlap) continue;

    const slotTimeLabel = formatSlotTime(slot);

    
    if (slot.teacherId && candidate.teacherId && slot.teacherId === candidate.teacherId) {
      return {
        hasConflict: true,
        reason: `Teacher Conflict: ${slot.teacherName || "Faculty"} already has a lecture (${slot.subject}) from ${slotTimeLabel} on ${candidate.dayOfWeek}.`,
      };
    }

    
    const isSameBatch =
      (slot.batchId && candidate.batchId && slot.batchId === candidate.batchId) ||
      slot.batch.trim().toLowerCase() === candidate.batch.trim().toLowerCase();

    if (isSameBatch) {
      return {
        hasConflict: true,
        reason: `Batch Conflict: ${slot.batch} already has ${slot.subject} scheduled from ${slotTimeLabel} on ${candidate.dayOfWeek}.`,
      };
    }
  }

  return { hasConflict: false };
}


export function getStudentTimetableSlots(
  studentId: string,
  enrollments: SubjectEnrollment[],
  allSlots: TimetableSlot[]
): TimetableSlot[] {
  if (!studentId) return [];

  const activeStudentEnrollments = enrollments.filter(
    (e) => e.studentId === studentId && e.status === "active"
  );

  if (activeStudentEnrollments.length === 0) return [];

  return allSlots.filter((slot) => {
    
    if (slot.status === "cancelled") return false;

    
    return activeStudentEnrollments.some((enr) => {
      const subjectMatch = enr.subjectName.toLowerCase() === slot.subject.toLowerCase();
      const batchMatch =
        enr.batchName.toLowerCase() === slot.batch.toLowerCase() ||
        (enr.classGrade && slot.classGrade && enr.classGrade.toLowerCase() === slot.classGrade.toLowerCase());

      return subjectMatch && batchMatch;
    });
  });
}

export interface PositionedSlot {
  slot: TimetableSlot;
  startMinutes: number;
  endMinutes: number;
  colIndex: number;
  totalCols: number;
}

export interface SlotVerticalLayout {
  topPx: number;
  heightPx: number;
  isOutOfBounds: boolean;
}


export function calculateSlotLayout(
  startMinutes: number,
  endMinutes: number,
  gridStartHour = 8,
  gridEndHour = 20,
  minHeightPx = 30
): SlotVerticalLayout {
  const gridStartMinutes = gridStartHour * 60;
  const gridEndMinutes = gridEndHour * 60;
  const isOutOfBounds = endMinutes <= gridStartMinutes || startMinutes >= gridEndMinutes;
  const clampedStart = Math.max(startMinutes, gridStartMinutes);
  const clampedEnd = Math.min(endMinutes, gridEndMinutes);
  const topPx = clampedStart - gridStartMinutes;
  const heightPx = Math.max(clampedEnd - clampedStart, minHeightPx);

  return { topPx, heightPx, isOutOfBounds };
}


export function computeDaySlotPositions(slots: TimetableSlot[]): PositionedSlot[] {
  if (slots.length === 0) return [];

  const parsed = slots.map((slot) => {
    const { start, end } = getSlotTimeMinutes(slot);
    return {
      slot,
      startMinutes: start,
      endMinutes: end,
    };
  });

  
  parsed.sort((a, b) => a.startMinutes - b.startMinutes || b.endMinutes - a.endMinutes);

  
  const clusters: typeof parsed[] = [];
  let currentCluster: typeof parsed = [];
  let clusterEnd = -1;

  for (const item of parsed) {
    if (currentCluster.length === 0) {
      currentCluster.push(item);
      clusterEnd = item.endMinutes;
    } else if (item.startMinutes < clusterEnd) {
      
      currentCluster.push(item);
      clusterEnd = Math.max(clusterEnd, item.endMinutes);
    } else {
      
      clusters.push(currentCluster);
      currentCluster = [item];
      clusterEnd = item.endMinutes;
    }
  }
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  const result: PositionedSlot[] = [];

  for (const cluster of clusters) {
    
    const columnEnds: number[] = [];
    const clusterPositions: { item: (typeof parsed)[0]; colIndex: number }[] = [];

    for (const item of cluster) {
      let placedCol = -1;
      for (let i = 0; i < columnEnds.length; i++) {
        if (columnEnds[i] <= item.startMinutes) {
          placedCol = i;
          columnEnds[i] = item.endMinutes;
          break;
        }
      }
      if (placedCol === -1) {
        placedCol = columnEnds.length;
        columnEnds.push(item.endMinutes);
      }
      clusterPositions.push({ item, colIndex: placedCol });
    }

    const totalCols = columnEnds.length;
    for (const cp of clusterPositions) {
      result.push({
        slot: cp.item.slot,
        startMinutes: cp.item.startMinutes,
        endMinutes: cp.item.endMinutes,
        colIndex: cp.colIndex,
        totalCols,
      });
    }
  }

  return result;
}
