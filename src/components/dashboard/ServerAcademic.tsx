"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";

type Role = "academy-admin" | "teacher" | "student" | "parent";
type View = "attendance" | "timetable" | "posts" | "results" | "remarks";
type AcademicData = {
  batches: { id: string; name: string }[];
  posts: { id: string; kind: string; title: string; body: string; dueOn: string | null }[];
  events: { id: string; batchId: string; title: string; startsAt: string; endsAt: string; version: string }[];
  assessments: { id: string; batchId: string; title: string; maxMarks: number; status: string }[];
  marks: { assessmentId: string; studentId: string; marks: number }[];
  remarks: { id: string; body: string; createdAt: string }[];
  roster: { id: string; name: string; admissionNumber: string }[];
  dayMarks: { id: string; studentId: string; status: string; version: string }[];
  selectedBatch: string | null;
  date: string;
};

const field = { width: "100%", padding: "var(--space-3)", border: "1px solid var(--color-input-border)", borderRadius: "var(--radius-md)", background: "var(--color-surface)", color: "var(--color-primary)" };
const group = { display: "grid", gap: "var(--space-3)", marginBottom: "var(--space-6)" };

export function ServerAcademic({ role, studentId, view = "posts" }: { role: Role; studentId?: string; view?: View }) {
  const [data, setData] = useState<AcademicData | null>(null);
  const [batchId, setBatchId] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState("Loading academic records...");
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const [postKind, setPostKind] = useState("notice");
  const [postTitle, setPostTitle] = useState("");
  const [postBody, setPostBody] = useState("");
  const [postDueOn, setPostDueOn] = useState("");
  const [audience, setAudience] = useState("all");
  const [eventTitle, setEventTitle] = useState("");
  const [eventStart, setEventStart] = useState("");
  const [eventEnd, setEventEnd] = useState("");
  const [assessmentTitle, setAssessmentTitle] = useState("");
  const [maxMarks, setMaxMarks] = useState(100);
  const [remarkBody, setRemarkBody] = useState("");
  const [remarkStudentId, setRemarkStudentId] = useState("");
  const [correctionReason, setCorrectionReason] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (studentId) params.set("studentId", studentId);
    if (batchId) params.set("batchId", batchId);
    if (date) params.set("date", date);
    fetch(`/api/academic?${params}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => ({ response, body: await response.json() }))
      .then(({ response, body }) => {
        if (!response.ok || body.ok !== true) throw new Error(body.reason ?? "server_error");
        setData(body);
        setStatus("");
      })
      .catch((error) => { if (!controller.signal.aborted) { setData(null); setStatus(error.message === "forbidden" ? "You cannot access these academic records." : "Academic records could not be loaded. Please try again."); } });
    return () => controller.abort();
  }, [studentId, batchId, date, revision]);

  const submit = useCallback(async (method: "POST" | "PATCH", payload: Record<string, unknown>) => {
    if (busy) return false;
    setBusy(true);
    setStatus("Saving...");
    try {
      const response = await fetch("/api/academic", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), cache: "no-store" });
      const body = await response.json();
      if (!response.ok || body.ok !== true) {
        setStatus(body.reason === "conflict" ? "This record changed or conflicts with another entry. Reload and try again." : body.reason === "forbidden" ? "Your assignment no longer permits this action." : "Save failed. Check the fields and try again.");
        return false;
      }
      setStatus("Saved.");
      setRevision((value) => value + 1);
      return true;
    } catch {
      setStatus("Save failed. Please try again.");
      return false;
    } finally { setBusy(false); }
  }, [busy]);

  const currentBatch = batchId || data?.selectedBatch || "";
  const isWriter = role === "teacher" || role === "academy-admin";
  return <div style={{ display: "grid", gap: "var(--space-6)" }}>
    <Card>
      <h2 style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-3)" }}>Academic records</h2>
      <p role="status" aria-live="polite">{status}</p>
      {data && data.batches.length === 0 && <p>No current batches are available.</p>}
      {data && data.batches.length > 0 && <div style={group}>
        <label htmlFor="academic-batch">Batch</label>
        <select id="academic-batch" value={currentBatch} onChange={(event) => { setStatus("Loading academic records..."); setBatchId(event.target.value); }} style={field}>
          {data.batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}
        </select>
      </div>}
    </Card>
    {data && view === "attendance" && role === "teacher" && <Card>
      <h3>Mark attendance</h3>
      <div style={group}><label htmlFor="academic-date">Date</label><input id="academic-date" type="date" value={date || data.date} onChange={(event) => { setStatus("Loading academic records..."); setDate(event.target.value); }} style={field} /></div>
      {data.roster.length === 0 ? <p>No active students are enrolled in this batch.</p> : data.roster.map((student) => {
        const mark = data.dayMarks.find((row) => row.studentId === student.id);
        return <div key={student.id} style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "var(--space-3)", padding: "var(--space-3) 0", borderBottom: "1px solid var(--color-border)" }}>
          <span style={{ flex: "1 1 180px", overflowWrap: "anywhere" }}>{student.name} ({student.admissionNumber})</span>
          <label htmlFor={`mark-${student.id}`}>Status</label>
          <select id={`mark-${student.id}`} value={mark?.status ?? ""} style={{ ...field, width: "auto" }} onChange={(event) => {
            const next = event.target.value;
            if (!next) return;
            void submit("POST", { action: "attendance", batchId: currentBatch, studentId: student.id, date: date || data.date, status: next, version: mark?.version, reason: mark ? correctionReason : undefined });
          }} disabled={busy}>
            <option value="">Choose status</option><option value="present">Present</option><option value="absent">Absent</option><option value="late">Late</option><option value="excused">Excused</option>
          </select>
        </div>;
      })}
      <div style={group}><label htmlFor="correction-reason">Correction reason when changing an existing mark</label><input id="correction-reason" value={correctionReason} onChange={(event) => setCorrectionReason(event.target.value)} maxLength={500} style={field} /></div>
    </Card>}
    {data && view === "timetable" && <Card>
      <h3>Timetable</h3>
      {data.events.filter((event) => event.batchId === currentBatch).length === 0 ? <p>No scheduled events.</p> : data.events.filter((event) => event.batchId === currentBatch).map((event) => <div key={event.id} style={{ padding: "var(--space-3) 0", borderBottom: "1px solid var(--color-border)" }}>
        <strong>{event.title}</strong><p>{new Date(event.startsAt).toLocaleString()} to {new Date(event.endsAt).toLocaleString()}</p>
        {isWriter && <Button variant="secondary" disabled={busy} onClick={() => { const reason = window.prompt("Reason for cancellation"); if (reason) void submit("PATCH", { action: "cancelTimetable", id: event.id, version: event.version, reason }); }}>Cancel</Button>}
      </div>)}
      {isWriter && currentBatch && <form style={group} onSubmit={(event) => { event.preventDefault(); void submit("POST", { action: "timetable", batchId: currentBatch, title: eventTitle, startsAt: new Date(eventStart).toISOString(), endsAt: new Date(eventEnd).toISOString() }).then((ok) => { if (ok) { setEventTitle(""); setEventStart(""); setEventEnd(""); } }); }}>
        <label htmlFor="event-title">Event title</label><input id="event-title" value={eventTitle} onChange={(event) => setEventTitle(event.target.value)} required maxLength={160} style={field} />
        <label htmlFor="event-start">Starts</label><input id="event-start" type="datetime-local" value={eventStart} onChange={(event) => setEventStart(event.target.value)} required style={field} />
        <label htmlFor="event-end">Ends</label><input id="event-end" type="datetime-local" value={eventEnd} onChange={(event) => setEventEnd(event.target.value)} required style={field} />
        <Button type="submit" disabled={busy}>Schedule</Button>
      </form>}
    </Card>}
    {data && view === "posts" && <Card>
      <h3>Notices, materials and homework</h3>
      {data.posts.length === 0 ? <p>Nothing has been published yet.</p> : data.posts.map((post) => <article key={post.id} style={{ padding: "var(--space-3) 0", borderBottom: "1px solid var(--color-border)", overflowWrap: "anywhere" }}><strong>{post.title}</strong><p>{post.kind}{post.dueOn ? ` - Due ${post.dueOn}` : ""}</p><p style={{ whiteSpace: "pre-wrap" }}>{post.body}</p></article>)}
      {isWriter && <form style={group} onSubmit={(event) => { event.preventDefault(); void submit("POST", { action: "post", kind: postKind, title: postTitle, body: postBody, audience: postKind === "notice" ? audience : "all", batchId: currentBatch || undefined, dueOn: postKind === "homework" && postDueOn ? postDueOn : undefined }).then((ok) => { if (ok) { setPostTitle(""); setPostBody(""); setPostDueOn(""); } }); }}>
        <label htmlFor="post-kind">Type</label><select id="post-kind" value={postKind} onChange={(event) => setPostKind(event.target.value)} style={field}><option value="notice">Notice</option><option value="material">Study material text</option><option value="homework">Homework</option></select>
        {postKind === "notice" && <><label htmlFor="post-audience">Audience</label><select id="post-audience" value={audience} onChange={(event) => setAudience(event.target.value)} style={field}><option value="all">All</option><option value="students">Students</option><option value="parents">Parents</option><option value="teachers">Teachers</option></select></>}
        <label htmlFor="post-title">Title</label><input id="post-title" value={postTitle} onChange={(event) => setPostTitle(event.target.value)} required maxLength={160} style={field} />
        <label htmlFor="post-body">Text</label><textarea id="post-body" value={postBody} onChange={(event) => setPostBody(event.target.value)} required maxLength={10000} rows={5} style={field} />
        {postKind === "homework" && <><label htmlFor="post-due">Due date</label><input id="post-due" type="date" value={postDueOn} onChange={(event) => setPostDueOn(event.target.value)} style={field} /></>}
        <Button type="submit" disabled={busy}>Publish</Button>
      </form>}
      <p>File attachments are unavailable until private storage is configured.</p>
    </Card>}
    {data && view === "results" && <Card>
      <h3>Tests and marks</h3>
      {data.assessments.filter((item) => item.batchId === currentBatch).length === 0 ? <p>No results are available.</p> : data.assessments.filter((item) => item.batchId === currentBatch).map((item) => <div key={item.id} style={{ padding: "var(--space-3) 0", borderBottom: "1px solid var(--color-border)" }}>
        <strong>{item.title}</strong><p>{item.status === "draft" ? "Draft" : "Published"} - Maximum {item.maxMarks}</p>
        {role === "teacher" && item.status === "draft" && <><div style={group}>{data.roster.map((student) => <label key={student.id}>{student.name}<input type="number" min={0} max={item.maxMarks} defaultValue={data.marks.find((mark) => mark.assessmentId === item.id && mark.studentId === student.id)?.marks ?? ""} onBlur={(event) => { if (event.target.value !== "") void submit("POST", { action: "mark", assessmentId: item.id, studentId: student.id, marks: Number(event.target.value) }); }} style={field} disabled={busy} /></label>)}</div><Button variant="secondary" disabled={busy} onClick={() => { void submit("PATCH", { action: "publishAssessment", id: item.id, confirm: true }); }}>Publish complete results</Button></>}
        {(role === "student" || role === "parent") && <p>Marks: {data.marks.find((mark) => mark.assessmentId === item.id)?.marks ?? "Not recorded"}</p>}
      </div>)}
      {role === "teacher" && currentBatch && <form style={group} onSubmit={(event) => { event.preventDefault(); void submit("POST", { action: "assessment", batchId: currentBatch, title: assessmentTitle, maxMarks }).then((ok) => { if (ok) setAssessmentTitle(""); }); }}><label htmlFor="assessment-title">Assessment title</label><input id="assessment-title" value={assessmentTitle} onChange={(event) => setAssessmentTitle(event.target.value)} required maxLength={160} style={field} /><label htmlFor="assessment-max">Maximum marks</label><input id="assessment-max" type="number" min={1} max={1000} value={maxMarks} onChange={(event) => setMaxMarks(Number(event.target.value))} style={field} /><Button type="submit" disabled={busy}>Create draft</Button></form>}
      <p>Online exam attempts are currently unavailable.</p>
    </Card>}
    {data && view === "remarks" && <Card>
      <h3>Student remarks</h3>
      {data.remarks.length === 0 ? <p>No remarks are available.</p> : data.remarks.map((remark) => <p key={remark.id} style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{remark.body}</p>)}
      {role === "teacher" && currentBatch && <form style={group} onSubmit={(event) => { event.preventDefault(); void submit("POST", { action: "remark", batchId: currentBatch, studentId: remarkStudentId, body: remarkBody }).then((ok) => { if (ok) setRemarkBody(""); }); }}><label htmlFor="remark-student">Student</label><select id="remark-student" value={remarkStudentId} onChange={(event) => setRemarkStudentId(event.target.value)} required style={field}><option value="">Choose student</option>{data.roster.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}</select><label htmlFor="remark-body">Remark</label><textarea id="remark-body" value={remarkBody} onChange={(event) => setRemarkBody(event.target.value)} required maxLength={2000} style={field} /><Button type="submit" disabled={busy}>Record remark</Button></form>}
    </Card>}
  </div>;
}
