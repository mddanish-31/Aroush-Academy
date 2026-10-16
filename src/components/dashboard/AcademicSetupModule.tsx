"use client";

import React, { useState } from "react";
import {
  BatchDefinition,
  TeacherProfile,
  AcademicClass,
  AcademicBoard,
  AcademicSubject,
} from "@/types";
import { SAMPLE_BATCHES } from "@/data/dashboardModulesData";
import { SAMPLE_TEACHERS } from "@/data/enrollmentFeeData";
import {
  DEFAULT_CLASSES,
  DEFAULT_BOARDS,
  DEFAULT_SUBJECTS,
} from "@/data/academicMasterData";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useDemoStorage, DEMO_STORAGE_KEYS } from "@/lib/demoStorage";
import { recordCreate, recordUpdate } from "@/lib/auditService";

type SetupSubTab = "classes" | "subjects" | "batches" | "faculty";

export function AcademicSetupModule() {
  const [activeSubTab, setActiveSubTab] = useState<SetupSubTab>("batches");

  // Reactive master storage
  const [classes, setClasses] = useDemoStorage<AcademicClass[]>(
    DEMO_STORAGE_KEYS.ACADEMIC_CLASSES,
    DEFAULT_CLASSES
  );
  const [boards, setBoards] = useDemoStorage<AcademicBoard[]>(
    DEMO_STORAGE_KEYS.ACADEMIC_BOARDS,
    DEFAULT_BOARDS
  );
  const [subjects, setSubjects] = useDemoStorage<AcademicSubject[]>(
    DEMO_STORAGE_KEYS.ACADEMIC_SUBJECTS,
    DEFAULT_SUBJECTS
  );
  const [faculty, setFaculty] = useDemoStorage<TeacherProfile[]>(
    DEMO_STORAGE_KEYS.FACULTY,
    SAMPLE_TEACHERS
  );
  const [batches, setBatches] = useDemoStorage<BatchDefinition[]>(
    DEMO_STORAGE_KEYS.BATCHES,
    SAMPLE_BATCHES
  );

  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modal states
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassBoards, setNewClassBoards] = useState<string[]>(["ICSE", "CBSE"]);

  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [newSubName, setNewSubName] = useState("");
  const [newSubCode, setNewSubCode] = useState("");
  const [newSubClasses, setNewSubClasses] = useState<string[]>(["cls-9", "cls-10"]);
  const [newSubFee, setNewSubFee] = useState("1500");
  const [newSubDesc, setNewSubDesc] = useState("");

  const [isAddBatchModalOpen, setIsAddBatchModalOpen] = useState(false);
  const [batchNameInput, setBatchNameInput] = useState("");
  const [batchClassInput, setBatchClassInput] = useState(classes[0]?.name || "Class X");
  const [batchSubjectInput, setBatchSubjectInput] = useState(subjects[0]?.name || "Mathematics");
  const [batchTeacherIdInput, setBatchTeacherIdInput] = useState(faculty[0]?.id || "");
  const [batchCapacityInput, setBatchCapacityInput] = useState("25");
  const [batchScheduleInput, setBatchScheduleInput] = useState("Mon, Wed, Fri (04:30 PM - 06:00 PM)");
  const [batchFeeInput, setBatchFeeInput] = useState("1500");

  const [isAddTeacherModalOpen, setIsAddTeacherModalOpen] = useState(false);
  const [newTeacherName, setNewTeacherName] = useState("");
  const [newTeacherEmail, setNewTeacherEmail] = useState("");
  const [newTeacherSubjects, setNewTeacherSubjects] = useState<string[]>(["Mathematics"]);
  const [newTeacherBatches, setNewTeacherBatches] = useState("");

  // Dismiss notification helper
  const showNotice = (message: string, type: "success" | "error" = "success") => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4500);
  };

  // --- CLASS & BOARD ACTIONS ---
  const handleToggleClassStatus = (clsId: string) => {
    const targetCls = classes.find((c) => c.id === clsId);
    const newStatus = !targetCls?.isActive;
    setClasses((prev) =>
      prev.map((c) => (c.id === clsId ? { ...c, isActive: !c.isActive } : c))
    );
    recordUpdate({
      action: "Toggle Class Status",
      type: "system",
      target: targetCls ? targetCls.name : clsId,
      details: `Updated class active status to: ${newStatus ? "Active" : "Inactive"}.`,
      performedBy: "Academy Administrator",
      actorRole: "academy-admin",
      entityType: "setting",
      entityId: clsId,
      outcome: "SUCCESS",
      changedFields: ["isActive"],
      diff: [{ fieldName: "isActive", before: String(targetCls?.isActive), after: String(newStatus) }],
      sourcePortal: "academy-admin",
    });
    showNotice("Class status updated.");
  };

  const handleToggleBoardStatus = (boardId: string) => {
    const targetBoard = boards.find((b) => b.id === boardId);
    const newStatus = !targetBoard?.isActive;
    setBoards((prev) =>
      prev.map((b) => (b.id === boardId ? { ...b, isActive: !b.isActive } : b))
    );
    recordUpdate({
      action: "Toggle Board Status",
      type: "system",
      target: targetBoard ? targetBoard.name : boardId,
      details: `Updated educational board active status to: ${newStatus ? "Active" : "Inactive"}.`,
      performedBy: "Academy Administrator",
      actorRole: "academy-admin",
      entityType: "setting",
      entityId: boardId,
      outcome: "SUCCESS",
      changedFields: ["isActive"],
      diff: [{ fieldName: "isActive", before: String(targetBoard?.isActive), after: String(newStatus) }],
      sourcePortal: "academy-admin",
    });
    showNotice("Board status updated.");
  };

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    const cleanName = newClassName.trim();
    if (classes.some((c) => c.name.toLowerCase() === cleanName.toLowerCase())) {
      showNotice(`A class named "${cleanName}" already exists.`, "error");
      return;
    }
    const cleanId = `cls-${cleanName.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
    const newRecord: AcademicClass = {
      id: cleanId,
      name: cleanName,
      supportedBoards: newClassBoards.length > 0 ? newClassBoards : ["ICSE", "CBSE"],
      isActive: true,
    };
    setClasses((prev) => [...prev, newRecord]);
    recordCreate({
      action: "Create Academic Class",
      type: "system",
      target: cleanName,
      details: `Created new academic grade tier "${cleanName}" with boards: ${newRecord.supportedBoards.join(", ")}.`,
      performedBy: "Academy Administrator",
      actorRole: "academy-admin",
      entityType: "setting",
      entityId: cleanId,
      outcome: "SUCCESS",
      changedFields: ["name", "supportedBoards", "isActive"],
      sourcePortal: "academy-admin",
    });
    setIsAddClassModalOpen(false);
    setNewClassName("");
    showNotice(`Added master record for "${cleanName}".`);
  };

  // --- SUBJECT ACTIONS ---
  const handleToggleSubjectStatus = (subId: string) => {
    const targetSub = subjects.find((s) => s.id === subId);
    const newStatus = !targetSub?.isActive;
    setSubjects((prev) =>
      prev.map((s) => (s.id === subId ? { ...s, isActive: !s.isActive } : s))
    );
    recordUpdate({
      action: "Toggle Subject Status",
      type: "system",
      target: targetSub ? targetSub.name : subId,
      details: `Updated curriculum subject active status to: ${newStatus ? "Active" : "Inactive"}.`,
      performedBy: "Academy Administrator",
      actorRole: "academy-admin",
      entityType: "setting",
      entityId: subId,
      outcome: "SUCCESS",
      changedFields: ["isActive"],
      diff: [{ fieldName: "isActive", before: String(targetSub?.isActive), after: String(newStatus) }],
      sourcePortal: "academy-admin",
    });
    showNotice("Subject status updated.");
  };

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim() || !newSubCode.trim()) return;
    const cleanName = newSubName.trim();
    if (subjects.some((s) => s.name.toLowerCase() === cleanName.toLowerCase())) {
      showNotice(`A subject named "${cleanName}" already exists.`, "error");
      return;
    }
    const cleanId = `sub-${newSubCode.trim().toLowerCase().slice(0, 4)}`;
    const newSub: AcademicSubject = {
      id: cleanId,
      name: cleanName,
      code: newSubCode.trim().toUpperCase(),
      applicableClassIds: newSubClasses.length > 0 ? newSubClasses : classes.map((c) => c.id),
      defaultMonthlyFee: parseInt(newSubFee, 10) || 1500,
      isActive: true,
      description: newSubDesc.trim(),
    };
    setSubjects((prev) => [...prev, newSub]);
    recordCreate({
      action: "Create Curriculum Subject",
      type: "system",
      target: `${cleanName} (${newSub.code})`,
      details: `Added curriculum catalog subject ${cleanName} (${newSub.code}). Default Fee: ₹${newSub.defaultMonthlyFee}/mo.`,
      performedBy: "Academy Administrator",
      actorRole: "academy-admin",
      entityType: "setting",
      entityId: cleanId,
      outcome: "SUCCESS",
      changedFields: ["name", "code", "defaultMonthlyFee", "isActive"],
      sourcePortal: "academy-admin",
    });
    setIsAddSubjectModalOpen(false);
    setNewSubName("");
    setNewSubCode("");
    setNewSubDesc("");
    showNotice(`Added subject "${cleanName}" to the catalog.`);
  };

  // --- BATCH ACTIONS ---
  const handleToggleBatchStatus = (batchId: string) => {
    const targetBatch = batches.find((b) => b.id === batchId);
    const newStatus = targetBatch?.status === "active" ? "upcoming" : "active";
    setBatches((prev) =>
      prev.map((b) => (b.id === batchId ? { ...b, status: b.status === "active" ? "upcoming" : "active" } : b))
    );
    recordUpdate({
      action: "Toggle Batch Status",
      type: "system",
      target: targetBatch ? targetBatch.name : batchId,
      details: `Updated batch operational status to: ${newStatus}.`,
      performedBy: "Academy Administrator",
      actorRole: "academy-admin",
      entityType: "batch",
      entityId: batchId,
      outcome: "SUCCESS",
      changedFields: ["status"],
      diff: [{ fieldName: "status", before: targetBatch?.status || "active", after: newStatus }],
      sourcePortal: "academy-admin",
    });
    showNotice("Batch status updated.");
  };

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchNameInput.trim()) return;
    const teacher = faculty.find((t) => t.id === batchTeacherIdInput) || faculty[0];
    const newBatch: BatchDefinition = {
      id: `btc-${Date.now().toString().slice(-6)}`,
      name: batchNameInput.trim(),
      subject: batchSubjectInput,
      classGrade: batchClassInput,
      teacherId: teacher.id,
      teacherName: teacher.name,
      capacity: parseInt(batchCapacityInput, 10) || 25,
      enrolledCount: 0,
      schedule: batchScheduleInput.trim(),
      monthlyFee: parseInt(batchFeeInput, 10) || 1500,
      status: "active",
    };
    setBatches((prev) => [newBatch, ...prev]);

    // Support legitimate additional assignments: ensure the assigned instructor's profile reflects this subject
    if (teacher && !teacher.assignedSubjects.some((s) => s.toLowerCase() === batchSubjectInput.toLowerCase())) {
      const updatedTeacher: TeacherProfile = {
        ...teacher,
        assignedSubjects: [...teacher.assignedSubjects, batchSubjectInput],
        batches: [...(teacher.batches || []), newBatch.name],
      };
      setFaculty((prev) => prev.map((t) => (t.id === teacher.id ? updatedTeacher : t)));
    }
    recordCreate({
      action: "Create Batch",
      type: "enrollment",
      target: `${newBatch.name} · ${newBatch.subject}`,
      details: `Created batch ${newBatch.name} (${newBatch.classGrade}). Teacher: ${newBatch.teacherName}, Fee: ₹${newBatch.monthlyFee}/mo.`,
      performedBy: "Academy Administrator",
      actorRole: "academy-admin",
      entityType: "batch",
      entityId: newBatch.id,
      outcome: "SUCCESS",
      changedFields: ["name", "subject", "classGrade", "teacherName", "capacity", "monthlyFee"],
      sourcePortal: "academy-admin",
    });
    setIsAddBatchModalOpen(false);
    setBatchNameInput("");
    showNotice(`Created batch "${newBatch.name}" assigned to ${newBatch.teacherName}.`);
  };

  // --- TEACHER ACTIONS ---
  const handleToggleTeacherStatus = (teacherId: string) => {
    const targetTeacher = faculty.find((t) => t.id === teacherId);
    const newStatus = (targetTeacher?.status || "active") === "active" ? "inactive" : "active";
    setFaculty((prev) =>
      prev.map((t) =>
        t.id === teacherId
          ? { ...t, status: (t.status || "active") === "active" ? "inactive" : "active" }
          : t
      )
    );
    recordUpdate({
      action: "Toggle Faculty Status",
      type: "system",
      target: targetTeacher ? targetTeacher.name : teacherId,
      details: `Updated faculty member status to: ${newStatus}.`,
      performedBy: "Academy Administrator",
      actorRole: "academy-admin",
      entityType: "faculty",
      entityId: teacherId,
      outcome: "SUCCESS",
      changedFields: ["status"],
      diff: [{ fieldName: "status", before: targetTeacher?.status || "active", after: newStatus }],
      sourcePortal: "academy-admin",
    });
    showNotice("Faculty member status updated.");
  };

  const handleCreateTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherName.trim()) return;
    const cleanId = `tch-${newTeacherName.trim().toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8)}`;
    const parsedBatches = newTeacherBatches
      ? newTeacherBatches.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    const newProf: TeacherProfile = {
      id: cleanId,
      name: newTeacherName.trim(),
      assignedSubjects: newTeacherSubjects.length > 0 ? newTeacherSubjects : ["Mathematics"],
      batches: parsedBatches,
      email: newTeacherEmail.trim() || `${cleanId}@aroush.academy`,
      status: "active",
    };
    setFaculty((prev) => [...prev, newProf]);
    recordCreate({
      action: "Register Faculty Member",
      type: "system",
      target: `${newProf.name} (${newProf.assignedSubjects.join(", ")})`,
      details: `Registered faculty member ${newProf.name} with assigned subjects: ${newProf.assignedSubjects.join(", ")}.`,
      performedBy: "Academy Administrator",
      actorRole: "academy-admin",
      entityType: "faculty",
      entityId: cleanId,
      outcome: "SUCCESS",
      changedFields: ["name", "assignedSubjects", "batches", "status"],
      sourcePortal: "academy-admin",
    });
    setIsAddTeacherModalOpen(false);
    setNewTeacherName("");
    setNewTeacherEmail("");
    setNewTeacherBatches("");
    showNotice(`Registered faculty member "${newProf.name}".`);
  };

  // Filter eligible teachers for selected batch subject
  const eligibleTeachersForBatch = faculty.filter(
    (t) => t.assignedSubjects.includes(batchSubjectInput) || t.assignedSubjects.length === 0
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      {/* Module Header Card */}
      <Card padding="md">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--space-3)" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "4px" }}>
              <h2 style={{ fontSize: "var(--text-lg)", margin: 0 }}>
                Academic Setup &amp; Master Catalogs
              </h2>
              <Badge variant="accent" size="sm">
                Academy Admin Master Data
              </Badge>
            </div>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", margin: 0 }}>
              Configure master records for Grades, Boards, Subject catalogs, Faculty allocations, and Physical Classroom Batches. Changes propagate dynamically to admission forms.
            </p>
          </div>

          <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
            {activeSubTab === "classes" && (
              <Button variant="primary" size="sm" onClick={() => setIsAddClassModalOpen(true)}>
                + Add Grade Record
              </Button>
            )}
            {activeSubTab === "subjects" && (
              <Button variant="primary" size="sm" onClick={() => setIsAddSubjectModalOpen(true)}>
                + Add Catalog Subject
              </Button>
            )}
            {activeSubTab === "faculty" && (
              <Button variant="primary" size="sm" onClick={() => setIsAddTeacherModalOpen(true)}>
                + Add Faculty Record
              </Button>
            )}
            {activeSubTab === "batches" && (
              <Button variant="primary" size="sm" onClick={() => setIsAddBatchModalOpen(true)}>
                + Create New Batch
              </Button>
            )}
          </div>
        </div>

        {/* Sub-Tab Navigation Bar */}
        <div
          style={{
            display: "flex",
            gap: "var(--space-2)",
            borderTop: "1px solid var(--color-border)",
            marginTop: "var(--space-4)",
            paddingTop: "var(--space-3)",
            overflowX: "auto",
          }}
          role="tablist"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeSubTab === "batches"}
            onClick={() => setActiveSubTab("batches")}
            style={{
              padding: "6px 14px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              fontSize: "var(--text-xs)",
              fontWeight: activeSubTab === "batches" ? 600 : 400,
              backgroundColor: activeSubTab === "batches" ? "var(--color-primary)" : "var(--color-surface-muted)",
              color: activeSubTab === "batches" ? "#fff" : "var(--color-primary)",
              cursor: "pointer",
              transition: "all var(--transition-fast)",
            }}
          >
            Classroom Batches ({batches.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeSubTab === "classes"}
            onClick={() => setActiveSubTab("classes")}
            style={{
              padding: "6px 14px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              fontSize: "var(--text-xs)",
              fontWeight: activeSubTab === "classes" ? 600 : 400,
              backgroundColor: activeSubTab === "classes" ? "var(--color-primary)" : "var(--color-surface-muted)",
              color: activeSubTab === "classes" ? "#fff" : "var(--color-primary)",
              cursor: "pointer",
              transition: "all var(--transition-fast)",
            }}
          >
            Grades &amp; Boards ({classes.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeSubTab === "subjects"}
            onClick={() => setActiveSubTab("subjects")}
            style={{
              padding: "6px 14px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              fontSize: "var(--text-xs)",
              fontWeight: activeSubTab === "subjects" ? 600 : 400,
              backgroundColor: activeSubTab === "subjects" ? "var(--color-primary)" : "var(--color-surface-muted)",
              color: activeSubTab === "subjects" ? "#fff" : "var(--color-primary)",
              cursor: "pointer",
              transition: "all var(--transition-fast)",
            }}
          >
            Subjects Catalog ({subjects.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeSubTab === "faculty"}
            onClick={() => setActiveSubTab("faculty")}
            style={{
              padding: "6px 14px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              fontSize: "var(--text-xs)",
              fontWeight: activeSubTab === "faculty" ? 600 : 400,
              backgroundColor: activeSubTab === "faculty" ? "var(--color-primary)" : "var(--color-surface-muted)",
              color: activeSubTab === "faculty" ? "#fff" : "var(--color-primary)",
              cursor: "pointer",
              transition: "all var(--transition-fast)",
            }}
          >
            Faculty Allocations ({faculty.length})
          </button>
        </div>
      </Card>

      {/* Action Notification */}
      {notification && (
        <div
          style={{
            backgroundColor: notification.type === "success" ? "rgba(52, 199, 89, 0.12)" : "rgba(255, 59, 48, 0.12)",
            border: `1px solid ${notification.type === "success" ? "rgba(52, 199, 89, 0.3)" : "rgba(255, 59, 48, 0.3)"}`,
            borderRadius: "var(--radius-md)",
            padding: "var(--space-3) var(--space-4)",
            fontSize: "var(--text-xs)",
            fontWeight: 500,
            color: notification.type === "success" ? "var(--color-positive)" : "#D32F2F",
          }}
          role="status"
        >
          {notification.message}
        </div>
      )}

      {/* --- SUBTAB 1: BATCHES MANAGEMENT --- */}
      {activeSubTab === "batches" && (
        <div style={{ backgroundColor: "var(--color-surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "var(--text-xs)" }}>
              <thead>
                <tr style={{ backgroundColor: "var(--color-surface-muted)", borderBottom: "1px solid var(--color-border)" }}>
                  <th style={{ padding: "10px 14px", fontWeight: 600 }}>Batch Name</th>
                  <th style={{ padding: "10px 14px", fontWeight: 600 }}>Subject &amp; Class</th>
                  <th style={{ padding: "10px 14px", fontWeight: 600 }}>Assigned Instructor</th>
                  <th style={{ padding: "10px 14px", fontWeight: 600 }}>Weekly Schedule</th>
                  <th style={{ padding: "10px 14px", fontWeight: 600 }}>Capacity</th>
                  <th style={{ padding: "10px 14px", fontWeight: 600 }}>Monthly Rate</th>
                  <th style={{ padding: "10px 14px", fontWeight: 600 }}>Status</th>
                  <th style={{ padding: "10px 14px", fontWeight: 600, textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr key={b.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "12px 14px", fontWeight: 600, color: "var(--color-primary)" }}>
                      {b.name}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ fontWeight: 600, color: "var(--color-accent)" }}>{b.subject}</span>
                      <div style={{ fontSize: "11px", color: "var(--color-neutral-dark)" }}>{b.classGrade}</div>
                    </td>
                    <td style={{ padding: "12px 14px", color: "var(--color-primary)" }}>
                      {b.teacherName}
                    </td>
                    <td style={{ padding: "12px 14px", color: "var(--color-neutral-dark)" }}>
                      {b.schedule}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      {b.enrolledCount} / {b.capacity} seats
                    </td>
                    <td style={{ padding: "12px 14px", fontWeight: 600 }}>
                      ₹{b.monthlyFee.toLocaleString()}/mo
                      {(() => {
                        const matchingSub = subjects.find(
                          (s) => s.name.toLowerCase() === b.subject.toLowerCase(),
                        );
                        if (
                          matchingSub &&
                          b.monthlyFee !== matchingSub.defaultMonthlyFee
                        ) {
                          return (
                            <div
                              style={{
                                fontSize: "10px",
                                color: "var(--color-accent)",
                                marginTop: "2px",
                              }}
                            >
                              Batch Rate (Catalog: ₹{matchingSub.defaultMonthlyFee}/mo)
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <Badge variant={b.status === "active" ? "success" : "neutral"} size="sm">
                        {b.status}
                      </Badge>
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "right" }}>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleToggleBatchStatus(b.id)}
                        style={{ fontSize: "11px", padding: "3px 8px" }}
                      >
                        {b.status === "active" ? "Mark Upcoming" : "Mark Active"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- SUBTAB 2: CLASSES & BOARDS --- */}
      {activeSubTab === "classes" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--space-6)" }}>
          {/* Grades Card */}
          <Card padding="md">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-3)" }}>
              <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, margin: 0 }}>
                Academic Grades / Classes
              </h3>
              <Badge variant="neutral" size="sm">
                {classes.filter((c) => c.isActive).length} Active
              </Badge>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "var(--space-3)",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "var(--color-surface-muted)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--color-primary)" }}>{cls.name}</div>
                    <div style={{ display: "flex", gap: "4px", marginTop: "4px" }}>
                      {cls.supportedBoards.map((b) => (
                        <Badge key={b} variant="neutral" size="sm" style={{ fontSize: "10px" }}>
                          {b}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <Badge variant={cls.isActive ? "success" : "neutral"} size="sm">
                      {cls.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => handleToggleClassStatus(cls.id)}
                      style={{ fontSize: "11px", padding: "2px 8px" }}
                    >
                      {cls.isActive ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Boards Card */}
          <Card padding="md">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-3)" }}>
              <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, margin: 0 }}>
                Supported Education Boards
              </h3>
              <Badge variant="neutral" size="sm">
                {boards.length} Boards
              </Badge>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              {boards.map((brd) => (
                <div
                  key={brd.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "var(--space-3)",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "var(--color-surface-muted)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--color-primary)" }}>{brd.name}</div>
                    <div style={{ fontSize: "11px", color: "var(--color-neutral-dark)", marginTop: "2px" }}>
                      Curriculum Standard: {brd.code}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <Badge variant={brd.isActive ? "success" : "neutral"} size="sm">
                      {brd.isActive ? "Supported" : "Inactive"}
                    </Badge>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => handleToggleBoardStatus(brd.id)}
                      style={{ fontSize: "11px", padding: "2px 8px" }}
                    >
                      {brd.isActive ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* --- SUBTAB 3: SUBJECTS CATALOG --- */}
      {activeSubTab === "subjects" && (
        <div style={{ backgroundColor: "var(--color-surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "var(--text-xs)" }}>
              <thead>
                <tr style={{ backgroundColor: "var(--color-surface-muted)", borderBottom: "1px solid var(--color-border)" }}>
                  <th style={{ padding: "10px 14px", fontWeight: 600 }}>Subject Name</th>
                  <th style={{ padding: "10px 14px", fontWeight: 600 }}>Code</th>
                  <th style={{ padding: "10px 14px", fontWeight: 600 }}>Applicable Grades</th>
                  <th style={{ padding: "10px 14px", fontWeight: 600 }}>Default Monthly Fee</th>
                  <th style={{ padding: "10px 14px", fontWeight: 600 }}>Status</th>
                  <th style={{ padding: "10px 14px", fontWeight: 600, textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((s) => (
                  <tr key={s.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontWeight: 600, color: "var(--color-primary)" }}>{s.name}</div>
                      {s.description && (
                        <div style={{ fontSize: "11px", color: "var(--color-neutral-dark)", marginTop: "2px" }}>
                          {s.description}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)" }}>
                      {s.code}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                        {s.applicableClassIds.map((cid) => {
                          const cls = classes.find((c) => c.id === cid);
                          return (
                            <Badge key={cid} variant="neutral" size="sm" style={{ fontSize: "10px" }}>
                              {cls?.name || cid}
                            </Badge>
                          );
                        })}
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px", fontWeight: 600 }}>
                      ₹{s.defaultMonthlyFee.toLocaleString()}/mo
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <Badge variant={s.isActive ? "success" : "neutral"} size="sm">
                        {s.isActive ? "Active" : "Deactivated"}
                      </Badge>
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "right" }}>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleToggleSubjectStatus(s.id)}
                        style={{ fontSize: "11px", padding: "3px 8px" }}
                      >
                        {s.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- SUBTAB 4: FACULTY ALLOCATIONS --- */}
      {activeSubTab === "faculty" && (
        <div style={{ backgroundColor: "var(--color-surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "var(--text-xs)" }}>
              <thead>
                <tr style={{ backgroundColor: "var(--color-surface-muted)", borderBottom: "1px solid var(--color-border)" }}>
                  <th style={{ padding: "10px 14px", fontWeight: 600 }}>Faculty Member</th>
                  <th style={{ padding: "10px 14px", fontWeight: 600 }}>Assigned Subjects</th>
                  <th style={{ padding: "10px 14px", fontWeight: 600 }}>Assigned Batches</th>
                  <th style={{ padding: "10px 14px", fontWeight: 600 }}>Contact Email</th>
                  <th style={{ padding: "10px 14px", fontWeight: 600 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {faculty.map((t) => (
                  <tr key={t.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "12px 14px", fontWeight: 600, color: "var(--color-primary)" }}>
                      {t.name}
                      <div style={{ fontSize: "10px", color: "var(--color-neutral-dark)", fontFamily: "monospace" }}>
                        ID: {t.id}
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                        {t.assignedSubjects.map((sub) => (
                          <Badge key={sub} variant="accent" size="sm">
                            {sub}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px", color: "var(--color-neutral-dark)" }}>
                      {t.batches && t.batches.length > 0 ? (
                        t.batches.join(" • ")
                      ) : (
                        <span style={{ fontStyle: "italic", color: "var(--color-neutral-dark)" }}>No batches assigned</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      {t.email}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                        <Badge variant={(t.status || "active") === "active" ? "success" : "neutral"} size="sm">
                          {(t.status || "active") === "active" ? "Active Staff" : "Inactive"}
                        </Badge>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleToggleTeacherStatus(t.id)}
                          style={{ fontSize: "11px", padding: "2px 8px" }}
                        >
                          {(t.status || "active") === "active" ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- MODAL 1: ADD CLASS --- */}
      {isAddClassModalOpen && (
        <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 110, padding: "var(--space-4)" }}>
          <div style={{ backgroundColor: "var(--color-surface)", borderRadius: "var(--radius-xl)", maxWidth: "440px", width: "100%", padding: "var(--space-6)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-lg)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
              <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, margin: 0 }}>Add Academic Grade Record</h3>
              <button type="button" onClick={() => setIsAddClassModalOpen(false)} style={{ border: "none", background: "none", cursor: "pointer", fontSize: "18px" }}>✕</button>
            </div>
            <form onSubmit={handleCreateClass} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              <div>
                <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, display: "block", marginBottom: "4px" }}>Grade / Class Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Class VIII"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "var(--text-sm)" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, display: "block", marginBottom: "6px" }}>Supported Education Boards</label>
                <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
                  {boards.map((b) => (
                    <label key={b.name} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "var(--text-xs)", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={newClassBoards.includes(b.name)}
                        onChange={(e) => {
                          if (e.target.checked) setNewClassBoards((prev) => [...prev, b.name]);
                          else setNewClassBoards((prev) => prev.filter((name) => name !== b.name));
                        }}
                      />
                      {b.name}
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
                <Button type="button" variant="secondary" size="sm" onClick={() => setIsAddClassModalOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary" size="sm">Save Grade</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: ADD SUBJECT --- */}
      {isAddSubjectModalOpen && (
        <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 110, padding: "var(--space-4)" }}>
          <div style={{ backgroundColor: "var(--color-surface)", borderRadius: "var(--radius-xl)", maxWidth: "480px", width: "100%", padding: "var(--space-6)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-lg)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
              <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, margin: 0 }}>Add Catalog Subject</h3>
              <button type="button" onClick={() => setIsAddSubjectModalOpen(false)} style={{ border: "none", background: "none", cursor: "pointer", fontSize: "18px" }}>✕</button>
            </div>
            <form onSubmit={handleCreateSubject} style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <div>
                <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, display: "block", marginBottom: "4px" }}>Subject Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Statistics &amp; Analytics"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "var(--text-sm)" }}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
                <div>
                  <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, display: "block", marginBottom: "4px" }}>Short Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="STAT"
                    value={newSubCode}
                    onChange={(e) => setNewSubCode(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "var(--text-sm)" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, display: "block", marginBottom: "4px" }}>Default Monthly Fee (₹) *</label>
                  <input
                    type="number"
                    required
                    min="100"
                    value={newSubFee}
                    onChange={(e) => setNewSubFee(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "var(--text-sm)" }}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, display: "block", marginBottom: "4px" }}>Applicable Grades</label>
                <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
                  {classes.map((c) => (
                    <label key={c.id} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "var(--text-xs)", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={newSubClasses.includes(c.id)}
                        onChange={(e) => {
                          if (e.target.checked) setNewSubClasses((prev) => [...prev, c.id]);
                          else setNewSubClasses((prev) => prev.filter((id) => id !== c.id));
                        }}
                      />
                      {c.name}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, display: "block", marginBottom: "4px" }}>Description (Optional)</label>
                <input
                  type="text"
                  placeholder="Curriculum scope, focus topics..."
                  value={newSubDesc}
                  onChange={(e) => setNewSubDesc(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "var(--text-sm)" }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
                <Button type="button" variant="secondary" size="sm" onClick={() => setIsAddSubjectModalOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary" size="sm">Save Subject</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: CREATE BATCH --- */}
      {isAddBatchModalOpen && (
        <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 110, padding: "var(--space-4)" }}>
          <div style={{ backgroundColor: "var(--color-surface)", borderRadius: "var(--radius-xl)", maxWidth: "520px", width: "100%", padding: "var(--space-6)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-lg)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
              <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, margin: 0 }}>Create Classroom Batch</h3>
              <button type="button" onClick={() => setIsAddBatchModalOpen(false)} style={{ border: "none", background: "none", cursor: "pointer", fontSize: "18px" }}>✕</button>
            </div>
            <form onSubmit={handleCreateBatch} style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <div>
                <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, display: "block", marginBottom: "4px" }}>Batch Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Batch Delta (Class X Weekend)"
                  value={batchNameInput}
                  onChange={(e) => setBatchNameInput(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "var(--text-sm)" }}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
                <div>
                  <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, display: "block", marginBottom: "4px" }}>Target Grade *</label>
                  <select
                    value={batchClassInput}
                    onChange={(e) => setBatchClassInput(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "var(--text-sm)" }}
                  >
                    {classes.filter((c) => c.isActive).map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, display: "block", marginBottom: "4px" }}>Subject *</label>
                  <select
                    value={batchSubjectInput}
                    onChange={(e) => {
                      const newSub = e.target.value;
                      setBatchSubjectInput(newSub);
                      const foundSub = subjects.find((s) => s.name === newSub);
                      if (foundSub) {
                        setBatchFeeInput(String(foundSub.defaultMonthlyFee));
                      }
                    }}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "var(--text-sm)" }}
                  >
                    {subjects.filter((s) => s.isActive).map((s) => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, display: "block", marginBottom: "4px" }}>Assigned Instructor *</label>
                <select
                  value={batchTeacherIdInput}
                  onChange={(e) => setBatchTeacherIdInput(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "var(--text-sm)" }}
                >
                  {eligibleTeachersForBatch.length > 0 ? (
                    eligibleTeachersForBatch.map((t) => (
                      <option key={t.id} value={t.id}>{t.name} ({t.assignedSubjects.join(", ")})</option>
                    ))
                  ) : (
                    faculty.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))
                  )}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
                <div>
                  <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, display: "block", marginBottom: "4px" }}>Seating Capacity</label>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={batchCapacityInput}
                    onChange={(e) => setBatchCapacityInput(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "var(--text-sm)" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, display: "block", marginBottom: "4px" }}>Monthly Subject Rate (₹)</label>
                  <input
                    type="number"
                    min="100"
                    value={batchFeeInput}
                    onChange={(e) => setBatchFeeInput(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "var(--text-sm)" }}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, display: "block", marginBottom: "4px" }}>Weekly Schedule</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tue, Thu, Sat (05:00 PM - 06:30 PM)"
                  value={batchScheduleInput}
                  onChange={(e) => setBatchScheduleInput(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "var(--text-sm)" }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
                <Button type="button" variant="secondary" size="sm" onClick={() => setIsAddBatchModalOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary" size="sm">Create Batch</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 4: ADD FACULTY --- */}
      {isAddTeacherModalOpen && (
        <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 110, padding: "var(--space-4)" }}>
          <div style={{ backgroundColor: "var(--color-surface)", borderRadius: "var(--radius-xl)", maxWidth: "460px", width: "100%", padding: "var(--space-6)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-lg)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
              <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, margin: 0 }}>Register Faculty Record</h3>
              <button type="button" onClick={() => setIsAddTeacherModalOpen(false)} style={{ border: "none", background: "none", cursor: "pointer", fontSize: "18px" }}>✕</button>
            </div>
            <form onSubmit={handleCreateTeacher} style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <div>
                <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, display: "block", marginBottom: "4px" }}>Faculty Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. S. Sen (Senior Lecturer)"
                  value={newTeacherName}
                  onChange={(e) => setNewTeacherName(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "var(--text-sm)" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, display: "block", marginBottom: "4px" }}>Institutional Email</label>
                <input
                  type="email"
                  placeholder="e.g. s.sen@aroush.academy"
                  value={newTeacherEmail}
                  onChange={(e) => setNewTeacherEmail(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "var(--text-sm)" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, display: "block", marginBottom: "4px" }}>Assigned Subjects</label>
                <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
                  {subjects.map((sub) => (
                    <label key={sub.id} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "var(--text-xs)", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={newTeacherSubjects.includes(sub.name)}
                        onChange={(e) => {
                          if (e.target.checked) setNewTeacherSubjects((prev) => [...prev, sub.name]);
                          else setNewTeacherSubjects((prev) => prev.filter((name) => name !== sub.name));
                        }}
                      />
                      {sub.name}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, display: "block", marginBottom: "4px" }}>Assigned Batches (Comma Separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Batch Delta, Batch Alpha"
                  value={newTeacherBatches}
                  onChange={(e) => setNewTeacherBatches(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "var(--text-sm)" }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
                <Button type="button" variant="secondary" size="sm" onClick={() => setIsAddTeacherModalOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary" size="sm">Register Faculty</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
