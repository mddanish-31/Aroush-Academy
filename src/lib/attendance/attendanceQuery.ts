import type { AttendanceQuery } from "./attendanceTypes";

const DAY_MS = 24 * 60 * 60 * 1000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000")) return false;
  const timestamp = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value;
}

export function parseAttendanceQuery(params: URLSearchParams, now = new Date()): AttendanceQuery | null {
  if (params.toString().length > 2048) return null;
  const keys = ["studentId", "from", "to", "limit", "cursor"];
  for (const key of params.keys()) {
    if (!keys.includes(key) || params.getAll(key).length !== 1) return null;
  }
  const studentId = params.get("studentId");
  if (studentId !== null && !UUID.test(studentId)) return null;
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now);
  const to = params.get("to") ?? today;
  if (!isDate(to)) return null;
  const from = params.get("from") ?? new Date(Date.parse(to) - 30 * DAY_MS).toISOString().slice(0, 10);
  if (!isDate(from) || from > to || Date.parse(to) - Date.parse(from) > 365 * DAY_MS) return null;
  const rawLimit = params.get("limit") ?? "100";
  if (!/^\d{1,3}$/.test(rawLimit)) return null;
  const limit = Number(rawLimit);
  if (limit < 1 || limit > 200) return null;
  let cursor: AttendanceQuery["cursor"] = null;
  if (params.has("cursor")) {
    const value = params.get("cursor")!;
    const date = value.slice(0, 10);
    const id = value.slice(11);
    if (value.length !== 47 || value[10] !== ":" || !isDate(date) || !UUID.test(id)
      || date < from || date > to) return null;
    cursor = { date, id: id.toLowerCase() };
  }
  return { studentId: studentId?.toLowerCase() ?? null, from, to, limit, cursor };
}
