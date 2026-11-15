"use client";

import { useEffect, useState } from "react";
import type { AttendanceReadRecord } from "@/lib/attendance/attendanceTypes";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

type Page = { records: AttendanceReadRecord[]; summary: { totalClasses: number; attendedClasses: number; percentage: number }; nextCursor: string | null };

export function ServerAttendance({ studentId }: { studentId: string }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [filters, setFilters] = useState({ from: "", to: "" });
  const [cursors, setCursors] = useState<string[]>([""]);
  const [result, setResult] = useState<{ key: string; page: Page } | null>(null);
  const [status, setStatus] = useState("loading");
  const index = cursors.length - 1;
  const key = `${studentId}:${filters.from}:${filters.to}:${cursors[index]}`;

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ studentId, limit: "20" });
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    if (cursors[index]) params.set("cursor", cursors[index]);
    fetch(`/api/attendance?${params}`, { credentials: "same-origin", cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          setStatus(response.status === 401 ? "expired" : response.status === 409 ? "setup" : "error");
          return;
        }
        const page = await response.json() as Page & { ok: boolean; summaryScope: string };
        if (!page.ok || page.summaryScope !== "page" || !Array.isArray(page.records)) throw new Error("Invalid attendance response");
        setResult({ key, page });
        setStatus("ready");
      }).catch(() => { if (!controller.signal.aborted) setStatus("error"); });
    return () => controller.abort();
  }, [studentId, filters, cursors, index, key]);

  const page = result?.key === key && status === "ready" ? result.page : null;
  return <Card>
    <h2 style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-4)" }}>Attendance</h2>
    <form onSubmit={(event) => { event.preventDefault(); setResult(null); setStatus("loading"); setCursors([""]); setFilters({ from, to }); }}
      style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)", alignItems: "end", marginBottom: "var(--space-4)" }}>
      <label>From<br /><input type="date" value={from} onChange={(event) => setFrom(event.target.value)} style={{ padding: "var(--space-2)" }} /></label>
      <label>To<br /><input type="date" value={to} onChange={(event) => setTo(event.target.value)} style={{ padding: "var(--space-2)" }} /></label>
      <Button type="submit">Apply dates</Button>
    </form>
    {!page && status === "loading" && <p role="status">Loading attendance...</p>}
    {status === "expired" && <p role="alert">Session expired. <a href="/login">Sign in again</a>.</p>}
    {status === "setup" && <p role="alert">Your account setup is incomplete. Contact the academy.</p>}
    {status === "error" && <p role="alert">Attendance could not be loaded. Try again.</p>}
    {page && <>
      <p role="status" style={{ marginBottom: "var(--space-3)" }}>Loaded page {index + 1}: {page.summary.attendedClasses} attended of {page.summary.totalClasses} classes ({page.summary.percentage}%). This summary covers only this page.</p>
      {page.records.length === 0 ? <p>No attendance marks in this date range.</p> : <ul style={{ listStyle: "none", padding: 0 }}>
        {page.records.map((record) => <li key={record.id} style={{ borderTop: "1px solid var(--color-border)", padding: "var(--space-3) 0" }}>
          <strong>{record.date}</strong> - {record.subject} / {record.batch}: {record.status}
        </li>)}
      </ul>}
      <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-4)" }}>
        {index > 0 && <Button variant="secondary" onClick={() => { setStatus("loading"); setCursors((previous) => previous.slice(0, -1)); }}>Previous page</Button>}
        {page.nextCursor && <Button onClick={() => { setStatus("loading"); setCursors((previous) => [...previous, page.nextCursor!]); }}>Next page</Button>}
      </div>
    </>}
  </Card>;
}
