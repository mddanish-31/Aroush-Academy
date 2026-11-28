"use client";

import { useEffect, useState } from "react";
import { Card } from "../ui/Card";

type Batch = { id: string; name: string; status: string; className: string; boardName: string | null; subjectName: string; teacherName?: string; enrollmentStatus?: string };
type Student = { id: string; name: string; admissionNumber: string; batchId: string };

export function ServerAssignments({ role, studentId }: { role: "teacher" | "student" | "parent"; studentId?: string }) {
  const [state, setState] = useState<{ batches: Batch[]; students: Student[] } | null>(null);
  const [error, setError] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (role === "parent" && studentId) params.set("studentId", studentId);
    void fetch(`/api/assignments?${params}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || result.ok !== true) throw new Error(response.status === 401 ? "Sign in to view assignments." : response.status === 403 ? "This assignment is not available to your account." : response.status === 409 ? "Your account setup is incomplete." : "Could not load assignments.");
        if (!controller.signal.aborted) setState({ batches: result.batches, students: result.students ?? [] });
      })
      .catch((cause) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Could not load assignments."); });
    return () => controller.abort();
  }, [role, studentId, revision]);

  return <Card>
    <h2 style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-3)" }}>{role === "teacher" ? "Assigned batches and students" : "Enrolled subjects and batches"}</h2>
    {role === "teacher" && <label>Batch<br /><select value={selectedBatch} onChange={(event) => setSelectedBatch(event.target.value)} style={{ padding: "var(--space-3)", border: "1px solid var(--color-input-border)", borderRadius: "var(--radius-sm)", background: "var(--color-surface)", maxWidth: "100%" }}>
      <option value="">All assigned batches</option>{state?.batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}
    </select></label>}
    {!state && !error && <p role="status">Loading assignments...</p>}
    {error && <p role="alert">{error} <button type="button" onClick={() => { setState(null); setError(""); setRevision((value) => value + 1); }}>Retry</button></p>}
    {state && !state.batches.length && <p role="status">No assignments available.</p>}
    {state?.batches.filter((batch) => role !== "teacher" || !selectedBatch || batch.id === selectedBatch).map((batch) => <section key={batch.id} style={{ borderTop: "1px solid var(--color-border)", marginTop: "var(--space-4)", paddingTop: "var(--space-3)" }}>
      <h3>{batch.name}</h3>
      <p>{batch.className} - {batch.boardName ?? "Board not recorded"} - {batch.subjectName} - {batch.status}</p>
      {role !== "teacher" && <p>Teacher: {batch.teacherName}. Enrollment: {batch.enrollmentStatus}.</p>}
      {role === "teacher" && <p>{state.students.filter((student) => student.batchId === batch.id).map((student) => `${student.name} (${student.admissionNumber})`).join(", ") || "No active students enrolled."}</p>}
    </section>)}
  </Card>;
}
