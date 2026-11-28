import type {
  ClassroomSession,
  MeetingProvider,
  SubjectEnrollment,
} from "@/types";


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


export function detectMeetingProvider(url: string): MeetingProvider {
  if (!url) return "other";
  const lower = url.toLowerCase();
  if (lower.includes("meet.google.com")) return "google-meet";
  if (lower.includes("zoom.us")) return "zoom";
  return "other";
}


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
        bg: "var(--color-success-bg)",
        color: "var(--color-success)",
        border: "var(--color-success-border)",
        label: "Google Meet",
        icon: "Video",
      };
    case "zoom":
      return {
        bg: "var(--brand-sky-subtle)",
        color: "var(--brand-navy)",
        border: "var(--color-accent-border)",
        label: "Zoom Meeting",
        icon: "Video",
      };
    case "other":
    default:
      return {
        bg: "var(--brand-beige)",
        color: "var(--brand-navy)",
        border: "var(--color-border)",
        label: "External Video Link",
        icon: "Link",
      };
  }
}


export function getStudentOnlineClasses(
  studentId: string,
  enrollments: SubjectEnrollment[],
  sessions: ClassroomSession[]
): ClassroomSession[] {
  if (!studentId) return [];

  
  const studentEnrollments = enrollments.filter(
    (e) => e.studentId === studentId && e.status === "active"
  );

  if (studentEnrollments.length === 0) return [];

  return sessions.filter((session) => {
    return studentEnrollments.some((enr) => {
      
      const subjectMatches =
        enr.subjectName.toLowerCase().trim() === session.subject.toLowerCase().trim();

      
      const batchMatches =
        enr.batchName.toLowerCase().trim() === session.batchName.toLowerCase().trim() ||
        Boolean(session.batchId && enr.batchId && enr.batchId === session.batchId);

      return subjectMatches && batchMatches;
    });
  });
}


export function isMeetingJoinable(session: ClassroomSession): boolean {
  if (session.status === "cancelled") return false;
  const url = session.meetingUrl || session.meetingLinkDemo;
  if (!url) return false;
  return isValidMeetingUrl(url);
}


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

  
  if (payload.startTime >= payload.endTime) {
    return { isValid: false, error: "Meeting end time must be after the start time." };
  }

  return { isValid: true };
}


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
