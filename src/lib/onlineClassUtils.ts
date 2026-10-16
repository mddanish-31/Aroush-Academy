import type {
  ClassroomSession,
  MeetingProvider,
  SubjectEnrollment,
} from "@/types";

/**
 * Validates that a meeting URL is present, uses HTTPS, and is a well-formed web URL.
 */
export function isValidMeetingUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith("https://")) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:" && parsed.hostname.length > 3;
  } catch {
    return false;
  }
}

/**
 * Automatically identifies the meeting provider from the URL hostname if not explicitly selected.
 */
export function detectMeetingProvider(url: string): MeetingProvider {
  if (!url) return "other";
  const lower = url.toLowerCase();
  if (lower.includes("meet.google.com")) return "google-meet";
  if (lower.includes("zoom.us")) return "zoom";
  return "other";
}

/**
 * Human-readable display label for supported external meeting providers.
 */
export function getProviderLabel(provider?: MeetingProvider): string {
  switch (provider) {
    case "google-meet":
      return "Google Meet";
    case "zoom":
      return "Zoom";
    case "other":
    default:
      return "External Meeting";
  }
}

/**
 * Accessible badges and branding colors for meeting providers.
 */
export function getProviderBadgeStyle(provider?: MeetingProvider): {
  bg: string;
  color: string;
  border: string;
  label: string;
  icon: string;
} {
  switch (provider) {
    case "google-meet":
      return {
        bg: "rgba(52, 168, 83, 0.12)",
        color: "#1E8E3E",
        border: "rgba(52, 168, 83, 0.35)",
        label: "Google Meet",
        icon: "🟢",
      };
    case "zoom":
      return {
        bg: "rgba(45, 140, 255, 0.12)",
        color: "#0B5CFF",
        border: "rgba(45, 140, 255, 0.35)",
        label: "Zoom Meeting",
        icon: "🔵",
      };
    case "other":
    default:
      return {
        bg: "rgba(110, 110, 115, 0.12)",
        color: "#424245",
        border: "rgba(110, 110, 115, 0.35)",
        label: "External Video Link",
        icon: "🔗",
      };
  }
}

/**
 * Derives student-scoped online classes from verified enrollments.
 * A student sees only classes for their active enrolled subjects and matching batch.
 */
export function getStudentOnlineClasses(
  studentId: string,
  enrollments: SubjectEnrollment[],
  sessions: ClassroomSession[]
): ClassroomSession[] {
  if (!studentId) return [];

  // Active enrollments for this student
  const studentEnrollments = enrollments.filter(
    (e) => e.studentId === studentId && e.status === "active"
  );

  if (studentEnrollments.length === 0) return [];

  return sessions.filter((session) => {
    return studentEnrollments.some((enr) => {
      // Must match subject
      const subjectMatches =
        enr.subjectName.toLowerCase().trim() === session.subject.toLowerCase().trim();

      // Must match batch
      const batchMatches =
        enr.batchName.toLowerCase().trim() === session.batchName.toLowerCase().trim() ||
        Boolean(session.batchId && enr.batchId && enr.batchId === session.batchId);

      return subjectMatches && batchMatches;
    });
  });
}

/**
 * Checks whether an online class is currently joinable.
 * Cancelled meetings and meetings with missing/invalid URLs CANNOT be joined.
 */
export function isMeetingJoinable(session: ClassroomSession): boolean {
  if (session.status === "cancelled") return false;
  const url = session.meetingUrl || session.meetingLinkDemo;
  if (!url) return false;
  return isValidMeetingUrl(url);
}

/**
 * Validates scheduling form inputs for required fields, HTTPS URL, and valid time bounds.
 */
export function validateOnlineClassPayload(payload: {
  topic: string;
  subject: string;
  batch: string;
  meetingUrl: string;
  date: string;
  startTime: string;
  endTime: string;
}): { isValid: boolean; error?: string } {
  if (!payload.topic || payload.topic.trim().length < 3) {
    return { isValid: false, error: "Class title / topic is required (min 3 characters)." };
  }
  if (!payload.subject || payload.subject === "all") {
    return { isValid: false, error: "Please select an authorized subject." };
  }
  if (!payload.batch || payload.batch === "all") {
    return { isValid: false, error: "Please select an assigned batch." };
  }
  if (!payload.meetingUrl || !payload.meetingUrl.trim()) {
    return { isValid: false, error: "External meeting URL is required." };
  }
  if (!isValidMeetingUrl(payload.meetingUrl)) {
    return {
      isValid: false,
      error: "Please enter a valid external meeting URL starting with https:// (e.g., https://meet.google.com/... or https://zoom.us/j/...)",
    };
  }
  if (!payload.date) {
    return { isValid: false, error: "Scheduled date is required." };
  }
  if (!payload.startTime) {
    return { isValid: false, error: "Start time is required." };
  }
  if (!payload.endTime) {
    return { isValid: false, error: "End time is required." };
  }

  // Check end time > start time if 24hr or comparable
  if (payload.startTime >= payload.endTime) {
    return { isValid: false, error: "Meeting end time must be after the start time." };
  }

  return { isValid: true };
}

/**
 * Extracts distinct valid recurring meeting URLs previously used by a teacher.
 * Allows quick 1-click reuse of recurring Google Meet or Zoom room URLs.
 */
export function getTeacherRecentMeetingUrls(
  teacherId: string,
  sessions: ClassroomSession[]
): { url: string; provider: MeetingProvider; label: string }[] {
  const teacherSessions = sessions.filter(
    (s) => s.teacherId === teacherId && (s.meetingUrl || s.meetingLinkDemo)
  );

  const seen = new Set<string>();
  const list: { url: string; provider: MeetingProvider; label: string }[] = [];

  for (const s of teacherSessions) {
    const rawUrl = (s.meetingUrl || s.meetingLinkDemo || "").trim();
    if (isValidMeetingUrl(rawUrl) && !seen.has(rawUrl)) {
      seen.add(rawUrl);
      const prov = s.meetingProvider || detectMeetingProvider(rawUrl);
      list.push({
        url: rawUrl,
        provider: prov,
        label: `${getProviderLabel(prov)}: ${s.batchName} (${s.subject})`,
      });
    }
  }

  return list;
}
