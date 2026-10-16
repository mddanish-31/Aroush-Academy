"use client";

import React, { useState } from "react";
import { BatchDefinition, TeacherProfile } from "@/types";
import { SAMPLE_BATCHES } from "@/data/dashboardModulesData";
import { SAMPLE_TEACHERS } from "@/data/enrollmentFeeData";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useDemoStorage, DEMO_STORAGE_KEYS } from "@/lib/demoStorage";
import { recordCreate } from "@/lib/auditService";

export function BatchesModule() {
  const [batches, setBatches] = useDemoStorage<BatchDefinition[]>(
    DEMO_STORAGE_KEYS.BATCHES,
    SAMPLE_BATCHES
  );
  const [faculty] = useDemoStorage<TeacherProfile[]>(
    DEMO_STORAGE_KEYS.FACULTY,
    SAMPLE_TEACHERS
  );

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [subjectInput, setSubjectInput] = useState("Mathematics");
  const [gradeInput, setGradeInput] = useState("Class X");
  const [teacherIdInput, setTeacherIdInput] = useState(SAMPLE_TEACHERS[0].id);
  const [capacityInput, setCapacityInput] = useState("25");
  const [scheduleInput, setScheduleInput] = useState("Mon, Wed, Fri (04:30 PM - 06:00 PM)");
  const [feeInput, setFeeInput] = useState("1500");
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);

  React.useEffect(() => {
    if (!isCreateModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsCreateModalOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCreateModalOpen]);

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    const teacher = faculty.find((t) => t.id === teacherIdInput) || faculty[0];
    if (!teacher) return;

    const newBatch: BatchDefinition = {
      id: `btc-new-${Date.now()}`,
      name: nameInput.trim(),
      subject: subjectInput,
      classGrade: gradeInput,
      teacherId: teacher.id,
      teacherName: teacher.name,
      capacity: parseInt(capacityInput) || 20,
      enrolledCount: 1,
      schedule: scheduleInput.trim(),
      monthlyFee: parseInt(feeInput) || 1500,
      status: "active",
    };

    setBatches((prev) => [newBatch, ...prev]);
    recordCreate({
      action: "Create Batch",
      type: "enrollment",
      target: `${newBatch.name} · ${newBatch.subject}`,
      details: `Created batch ${newBatch.name} (${newBatch.classGrade}). Teacher: ${newBatch.teacherName}, Capacity: ${newBatch.capacity}, Fee: ₹${newBatch.monthlyFee}/mo.`,
      performedBy: "Academy Administrator",
      actorRole: "academy-admin",
      entityType: "batch",
      entityId: newBatch.id,
      outcome: "SUCCESS",
      changedFields: ["name", "subject", "classGrade", "teacherName", "capacity", "monthlyFee"],
      sourcePortal: "academy-admin",
    });
    setIsCreateModalOpen(false);
    setNameInput("");
    setActionSuccessNotice(`Created batch "${newBatch.name}" assigned to ${newBatch.teacherName}.`);
    setTimeout(() => setActionSuccessNotice(null), 5000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      {/* Header Card */}
      <Card padding="md">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-3)" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "4px" }}>
              <h2 style={{ fontSize: "var(--text-lg)" }}>
                Subject &amp; Batch Management
              </h2>
              <Badge variant="accent" size="sm">
                Academic Roster
              </Badge>
            </div>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)" }}>
              Manage physical classroom batches, seating capacity, faculty allocations, and monthly subject fee rates.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
          >
            + Create New Batch
          </Button>
        </div>
      </Card>

      {/* Success Notification */}
      {actionSuccessNotice && (
        <div
          style={{
            backgroundColor: "rgba(52, 199, 89, 0.1)",
            border: "1px solid rgba(52, 199, 89, 0.3)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-3)",
            fontSize: "var(--text-xs)",
            color: "var(--color-primary)",
          }}
          role="status"
        >
          ✓ {actionSuccessNotice} (Local demo state)
        </div>
      )}

      {/* Batches Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "var(--space-4)" }}>
        {batches.map((b) => {
          const occupancyRate = Math.round((b.enrolledCount / b.capacity) * 100);

          return (
            <div
              key={b.id}
              style={{
                backgroundColor: "var(--color-surface)",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--color-border)",
                padding: "var(--space-5)",
                boxShadow: "var(--shadow-sm)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "var(--space-3)",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-2)" }}>
                  <Badge variant="accent" size="sm">
                    {b.subject}
                  </Badge>
                  <Badge variant={occupancyRate >= 90 ? "warning" : "success"} size="sm">
                    {b.status}
                  </Badge>
                </div>

                <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-primary)" }}>
                  {b.name}
                </h3>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", marginTop: "2px" }}>
                  {b.classGrade} &bull; Faculty: <strong>{b.teacherName}</strong>
                </div>

                <div style={{ marginTop: "var(--space-3)", padding: "var(--space-2) var(--space-3)", backgroundColor: "var(--color-surface-muted)", borderRadius: "var(--radius-md)", fontSize: "11px", color: "var(--color-primary)" }}>
                  🗓️ {b.schedule}
                </div>
              </div>

              <div>
                {/* Seating Occupancy Bar */}
                <div style={{ marginBottom: "var(--space-2)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
                    <span style={{ color: "var(--color-neutral-dark)" }}>Batch Occupancy:</span>
                    <span style={{ fontWeight: 600 }}>{b.enrolledCount} / {b.capacity} Seats ({occupancyRate}%)</span>
                  </div>
                  <div style={{ width: "100%", height: "6px", backgroundColor: "var(--color-border)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${occupancyRate}%`,
                        height: "100%",
                        backgroundColor: occupancyRate >= 90 ? "var(--color-warning)" : "var(--color-accent)",
                        borderRadius: "var(--radius-full)",
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--color-border)", paddingTop: "var(--space-2)", fontSize: "var(--text-xs)" }}>
                  <span style={{ color: "var(--color-neutral-dark)" }}>Subject Monthly Fee:</span>
                  <span style={{ fontWeight: 700, color: "var(--color-primary)", fontSize: "var(--text-sm)" }}>
                    ₹{b.monthlyFee}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE BATCH MODAL */}
      {isCreateModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCreateModalOpen(false);
          }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "var(--space-4)",
          }}
          role="dialog"
          aria-modal="true"
        >
          <div style={{ backgroundColor: "var(--color-surface)", borderRadius: "var(--radius-lg)", maxWidth: "480px", width: "100%", padding: "var(--space-6)", boxShadow: "var(--shadow-lg)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
              <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700 }}>Provision New Academic Batch</h3>
              <button onClick={() => setIsCreateModalOpen(false)} style={{ fontSize: "18px", color: "var(--color-neutral-dark)", cursor: "pointer" }}>✕</button>
            </div>

            <form onSubmit={handleCreateBatch}>
              <div style={{ marginBottom: "var(--space-3)" }}>
                <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "4px" }}>Batch Name:</label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. Batch Foundation (Class IX-X)"
                  style={{ width: "100%", padding: "8px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "var(--text-xs)" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
                <div>
                  <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "4px" }}>Subject:</label>
                  <select
                    value={subjectInput}
                    onChange={(e) => setSubjectInput(e.target.value)}
                    style={{ width: "100%", padding: "8px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "var(--text-xs)" }}
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Accountancy">Accountancy</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "4px" }}>Target Grade:</label>
                  <select
                    value={gradeInput}
                    onChange={(e) => setGradeInput(e.target.value)}
                    style={{ width: "100%", padding: "8px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "var(--text-xs)" }}
                  >
                    <option value="Class IX">Class IX</option>
                    <option value="Class X">Class X</option>
                    <option value="Class XI">Class XI</option>
                    <option value="Class XII">Class XII</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: "var(--space-3)" }}>
                <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "4px" }}>Assigned Faculty:</label>
                <select
                  value={teacherIdInput}
                  onChange={(e) => setTeacherIdInput(e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "var(--text-xs)" }}
                >
                  {faculty.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({(t.assignedSubjects || []).join(", ")})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
                <div>
                  <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "4px" }}>Seat Capacity:</label>
                  <input
                    type="number"
                    min="5"
                    max="50"
                    required
                    value={capacityInput}
                    onChange={(e) => setCapacityInput(e.target.value)}
                    style={{ width: "100%", padding: "8px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "var(--text-xs)" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "4px" }}>Monthly Fee (₹):</label>
                  <input
                    type="number"
                    min="500"
                    step="100"
                    required
                    value={feeInput}
                    onChange={(e) => setFeeInput(e.target.value)}
                    style={{ width: "100%", padding: "8px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "var(--text-xs)" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "var(--space-4)" }}>
                <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "4px" }}>Weekly Lecture Timing:</label>
                <input
                  type="text"
                  required
                  value={scheduleInput}
                  onChange={(e) => setScheduleInput(e.target.value)}
                  placeholder="e.g. Mon, Wed, Fri (04:30 PM - 06:00 PM)"
                  style={{ width: "100%", padding: "8px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "var(--text-xs)" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)" }}>
                <Button type="button" variant="secondary" size="sm" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Create Batch Roster
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
