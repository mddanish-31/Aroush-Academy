"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

type Named = { id: string; name: string; is_active?: boolean; code?: string; status?: string };
type Batch = Named & { class_id: string; board_id: string | null; subject_id: string; teacher_id: string; capacity: number; updated_at: string };
type Student = Named & { admission_number: string; class_id: string; board_id: string; updated_at: string };
type Enrollment = { id: string; student_id: string; batch_id: string; status: string; updated_at: string };
type Setup = { classes: Named[]; boards: Named[]; subjects: Named[]; teachers: Named[]; students: Student[]; teacherSubjects: { teacher_id: string; subject_id: string }[]; batches: Batch[]; enrollments: Enrollment[] };
const inputStyle = { padding: "var(--space-3)", border: "1px solid var(--color-border)", background: "var(--color-surface)", width: "100%", maxWidth: 420 };

export function ServerSetup() {
  const [data, setData] = useState<Setup | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const latest = useRef(0);
  const [classId, setClassId] = useState("");
  const [boardId, setBoardId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [batchId, setBatchId] = useState("");

  const load = useCallback(async (signal?: AbortSignal) => {
    const current = ++latest.current;
    try {
      const response = await fetch("/api/admin/setup", { cache: "no-store", signal });
      const result = await response.json();
      if (!response.ok || result.ok !== true) throw new Error(response.status === 401 ? "Sign in to manage academy setup." : response.status === 403 ? "You cannot manage academy setup." : "Could not load academy setup.");
      if (current === latest.current && !signal?.aborted) { setData(result); setError(""); }
    } catch (cause) {
      if (current === latest.current && !signal?.aborted) setError(cause instanceof Error ? cause.message : "Could not load academy setup.");
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => load(controller.signal));
    return () => controller.abort();
  }, [load]);

  async function save(payload: Record<string, unknown>, method: "POST" | "PATCH" = "POST") {
    if (pending.current) return false;
    pending.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/setup", { method, credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok || result.ok !== true) throw new Error(response.status === 409 ? "This record changed or already exists. Reload before editing." : response.status === 400 ? "Check the selected records and required fields." : response.status === 401 ? "Sign in before saving." : response.status === 403 ? "You cannot change academy setup." : "Could not save. Try again later.");
      setNotice("Saved to the academy database.");
      await load();
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save.");
      return false;
    } finally { pending.current = false; setBusy(false); }
  }

  const options = (items: Named[], placeholder: string) => <><option value="">{placeholder}</option>{items.map((item) => <option key={item.id} value={item.id}>{item.name}{item.status === "inactive" || item.is_active === false ? " (inactive)" : ""}</option>)}</>;
  const active = (items: Named[]) => items.filter((item) => item.is_active !== false && item.status !== "inactive");
  const selectedStudent = data?.students.find((item) => item.id === studentId);
  const eligibleBatches = data?.batches.filter((item) => item.status === "active" && item.class_id === selectedStudent?.class_id && item.board_id === selectedStudent?.board_id) ?? [];
  const teacherOptions = data?.teachers.filter((item) => item.status === "active" && data.teacherSubjects.some((entry) => entry.teacher_id === item.id && entry.subject_id === subjectId)) ?? [];

  return <div style={{ display: "grid", gap: "var(--space-4)" }}>
    <h2>Academy setup and assignments</h2>
    <p>Student accounts come from Registrations. Provision teacher accounts in Account before assigning their subjects. Existing fee and payment history is not changed here.</p>
    {error && <p role="alert">{error} <button type="button" onClick={() => { void load(); }}>Retry loading</button></p>}
    {notice && <p role="status">{notice}</p>}
    {!data && !error && <p role="status">Loading academy setup...</p>}
    {data && <>
      {(["class", "board", "subject"] as const).map((kind) => <Card key={kind}><h3 style={{ fontSize: "var(--text-lg)" }}>Academic {kind}</h3>
        <p>{(kind === "class" ? data.classes : kind === "board" ? data.boards : data.subjects).map((item) => `${item.name}${item.is_active ? "" : " (inactive)"}`).join(", ") || `No ${kind} records yet.`}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>{(kind === "class" ? data.classes : kind === "board" ? data.boards : data.subjects).filter((item) => item.is_active).map((item) => <Button key={item.id} variant="secondary" disabled={busy} onClick={() => { void save({ kind, id: item.id, version: "active", status: "inactive" }, "PATCH"); }}>Archive {item.name}</Button>)}</div>
        <form onSubmit={(event) => { event.preventDefault(); const form = event.currentTarget; void save({ kind, ...Object.fromEntries(new FormData(form)) }).then((ok) => { if (ok) form.reset(); }); }} style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)", marginTop: "var(--space-3)" }}>
          <label>Name<br /><input style={inputStyle} required minLength={2} maxLength={100} name="name" /></label>
          <label>Code<br /><input style={inputStyle} required minLength={2} maxLength={50} name="code" /></label>
          <Button type="submit" disabled={busy}>Add {kind}</Button>
        </form>
      </Card>)}
      <Card><h3 style={{ fontSize: "var(--text-lg)" }}>Teacher subject qualifications</h3>
        <p>{data.teachers.length ? data.teachers.map((teacher) => `${teacher.name}: ${data.teacherSubjects.filter((row) => row.teacher_id === teacher.id).map((row) => data.subjects.find((subject) => subject.id === row.subject_id)?.name).join(", ") || "No subjects"}`).join("; ") : "No teacher profiles yet."}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>{data.teachers.filter((teacher) => teacher.status === "active").map((teacher) => <Button key={teacher.id} variant="secondary" disabled={busy} onClick={() => { void save({ kind: "teacher", id: teacher.id, version: "active", status: "inactive" }, "PATCH"); }}>Deactivate {teacher.name}</Button>)}</div>
        <form onSubmit={(event) => { event.preventDefault(); void save({ kind: "teacherSubject", ...Object.fromEntries(new FormData(event.currentTarget)) }); }} style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)", marginTop: "var(--space-3)" }}>
          <label>Teacher<br /><select required name="teacherId" style={inputStyle} defaultValue="">{options(active(data.teachers), "Select teacher")}</select></label>
          <label>Subject<br /><select required name="subjectId" style={inputStyle} defaultValue="">{options(active(data.subjects), "Select subject")}</select></label>
          <Button type="submit" disabled={busy}>Add qualification</Button>
        </form>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", marginTop: "var(--space-3)" }}>
          {data.teacherSubjects.map((row) => {
            const assigned = data.batches.some((batch) => batch.teacher_id === row.teacher_id && batch.subject_id === row.subject_id && (batch.status === "active" || batch.status === "upcoming"));
            const teacher = data.teachers.find((item) => item.id === row.teacher_id)?.name ?? "Teacher";
            const subject = data.subjects.find((item) => item.id === row.subject_id)?.name ?? "Subject";
            return <Button key={`${row.teacher_id}:${row.subject_id}`} variant="secondary" disabled={busy || assigned} title={assigned ? "Reassign or archive active batches first" : undefined} onClick={() => { void save({ kind: "teacherSubject", teacherId: row.teacher_id, subjectId: row.subject_id, version: "present", status: "removed" }, "PATCH"); }}>Remove {teacher} - {subject}</Button>;
          })}
        </div>
      </Card>
      <Card><h3 style={{ fontSize: "var(--text-lg)" }}>Batches</h3>
        <p>{data.batches.length ? `${data.batches.length} batch records` : "No batches yet."}</p>
        <form onSubmit={(event) => { event.preventDefault(); const form = event.currentTarget; const fields = Object.fromEntries(new FormData(form)); void save({ kind: "batch", ...fields, capacity: Number(fields.capacity) }).then((ok) => { if (ok) form.reset(); }); }} style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)", marginTop: "var(--space-3)" }}>
          <label>Name<br /><input style={inputStyle} required minLength={2} maxLength={255} name="name" /></label>
          <label>Class<br /><select required name="classId" style={inputStyle} value={classId} onChange={(event) => { setClassId(event.target.value); setBoardId(""); }}>{options(active(data.classes), "Select class")}</select></label>
          <label>Board<br /><select required name="boardId" style={inputStyle} value={boardId} onChange={(event) => setBoardId(event.target.value)} disabled={!classId}>{options(active(data.boards), "Select board")}</select></label>
          <label>Subject<br /><select required name="subjectId" style={inputStyle} value={subjectId} onChange={(event) => setSubjectId(event.target.value)}>{options(active(data.subjects), "Select subject")}</select></label>
          <label>Teacher<br /><select required name="teacherId" style={inputStyle} defaultValue="" key={subjectId} disabled={!subjectId}>{options(teacherOptions, "Select qualified teacher")}</select></label>
          <label>Capacity<br /><input style={inputStyle} type="number" min={1} max={500} required name="capacity" /></label>
          <Button type="submit" disabled={busy}>Create batch</Button>
        </form>
        {data.batches.map((batch) => <div key={batch.id} style={{ marginTop: "var(--space-4)", borderTop: "1px solid var(--color-border)", paddingTop: "var(--space-3)" }}>
          <strong>{batch.name}</strong> - {data.subjects.find((subject) => subject.id === batch.subject_id)?.name} - {data.teachers.find((teacher) => teacher.id === batch.teacher_id)?.name} - {batch.status}
          {batch.status !== "archived" && <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", marginTop: "var(--space-2)" }}>
            <select aria-label={`Reassign ${batch.name}`} style={inputStyle} defaultValue={batch.teacher_id} key={`${batch.id}:${batch.teacher_id}`} onChange={(event) => { if (event.target.value !== batch.teacher_id) void save({ kind: "batch", id: batch.id, version: batch.updated_at, teacherId: event.target.value }, "PATCH"); }}>{options(data.teachers.filter((teacher) => teacher.id === batch.teacher_id || (teacher.status === "active" && data.teacherSubjects.some((row) => row.teacher_id === teacher.id && row.subject_id === batch.subject_id))), "Select teacher")}</select>
            <Button variant="secondary" disabled={busy} onClick={() => { void save({ kind: "batch", id: batch.id, version: batch.updated_at, status: "archived" }, "PATCH"); }}>Archive batch</Button>
          </div>}
        </div>)}
      </Card>
      <Card><h3 style={{ fontSize: "var(--text-lg)" }}>Students and enrollments</h3>
        <label>Student<br /><select name="studentId" style={inputStyle} value={studentId} onChange={(event) => { setStudentId(event.target.value); setBatchId(""); }}>{options(data.students.map((item) => ({ ...item, name: `${item.name} (${item.admission_number})` })), "Select student")}</select></label>
        {selectedStudent && <div style={{ marginTop: "var(--space-3)", display: "grid", gap: "var(--space-3)" }}>
          <p>Status: {selectedStudent.status}. Enrollments: {data.enrollments.filter((entry) => entry.student_id === selectedStudent.id).map((entry) => `${data.batches.find((item) => item.id === entry.batch_id)?.name ?? "Unknown batch"} (${entry.status})`).join(", ") || "None"}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>{data.enrollments.filter((entry) => entry.student_id === selectedStudent.id && entry.status === "active").map((entry) => <Button key={entry.id} variant="secondary" disabled={busy} onClick={() => { void save({ kind: "enrollment", id: entry.id, version: entry.updated_at, status: "paused" }, "PATCH"); }}>Pause {data.batches.find((item) => item.id === entry.batch_id)?.name ?? "enrollment"}</Button>)}</div>
          <form onSubmit={(event) => { event.preventDefault(); const fields = Object.fromEntries(new FormData(event.currentTarget)); void save({ kind: "student", id: selectedStudent.id, version: selectedStudent.updated_at, classId: fields.classId, boardId: fields.boardId }, "PATCH").then((ok) => { if (ok) setBatchId(""); }); }} style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)" }}>
            <label>Class<br /><select style={inputStyle} required name="classId" defaultValue={selectedStudent.class_id} key={`${selectedStudent.id}:class`}>{options(active(data.classes), "Select class")}</select></label>
            <label>Board<br /><select style={inputStyle} required name="boardId" defaultValue={selectedStudent.board_id} key={`${selectedStudent.id}:board`}>{options(active(data.boards), "Select board")}</select></label>
            <Button type="submit" disabled={busy}>Update student</Button>
          </form>
          {selectedStudent.status === "active" && <Button variant="secondary" disabled={busy} onClick={() => { void save({ kind: "student", id: selectedStudent.id, version: selectedStudent.updated_at, classId: selectedStudent.class_id, boardId: selectedStudent.board_id, status: "inactive" }, "PATCH"); }}>Deactivate student</Button>}
          <form onSubmit={(event) => { event.preventDefault(); const fields = Object.fromEntries(new FormData(event.currentTarget)); void save({ kind: "enrollment", studentId: selectedStudent.id, batchId, monthlyFeePaise: Math.round(Number(fields.monthlyFee) * 100) }).then((ok) => { if (ok) setBatchId(""); }); }} style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)" }}>
            <label>Batch matching class and board<br /><select name="batchId" style={inputStyle} value={batchId} required onChange={(event) => setBatchId(event.target.value)}>{options(eligibleBatches, "Select batch")}</select></label>
            <label>Monthly fee in rupees (enter explicitly)<br /><input style={inputStyle} required type="number" min={0} step="0.01" name="monthlyFee" /></label>
            <Button type="submit" disabled={busy || selectedStudent.status !== "active"}>Enroll student</Button>
          </form>
        </div>}
      </Card>
    </>}
  </div>;
}
