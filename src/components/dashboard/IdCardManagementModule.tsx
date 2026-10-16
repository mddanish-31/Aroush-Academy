"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  StudentProfile,
  SubjectEnrollment,
  StudentIdCardRecord,
  StudentIdCardStatus,
  IdCardHistoryEntry,
  AuditActionType,
} from "@/types";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { DigitalIdCard } from "./DigitalIdCard";
import { recordAuditEvent } from "@/lib/auditService";

export interface IdCardManagementModuleProps {
  students: StudentProfile[];
  enrollments: SubjectEnrollment[];
  idCardRecords: StudentIdCardRecord[];
  onUpdateIdCards: (
    updater: (prev: StudentIdCardRecord[]) => StudentIdCardRecord[],
  ) => void;
  onOpenPrintModal?: (
    student: StudentProfile,
    cardRecord?: StudentIdCardRecord,
  ) => void;
  actorName?: string;
}

export function IdCardManagementModule({
  students,
  enrollments,
  idCardRecords,
  onUpdateIdCards,
  onOpenPrintModal,
  actorName = "Academy Administrator",
}: IdCardManagementModuleProps) {
  const logAudit = useCallback(
    (action: string, target: string, details: string) => {
      let actionType: AuditActionType = "UPDATE";
      if (action.includes("Create") || action.includes("Saved")) actionType = "CREATE";
      else if (action.includes("Issue") || action.includes("Approved")) actionType = "APPROVE";
      else if (action.includes("Reject")) actionType = "REJECT";
      else if (action.includes("Deactivate")) actionType = "CANCEL";
      else if (action.includes("Reissue")) actionType = "RESTORE";

      recordAuditEvent({
        action,
        actionType,
        target,
        details,
        performedBy: actorName,
        actorRole: "academy-admin",
        entityType: "id-card",
        type: "security",
        sourcePortal: "academy-admin",
      });
    },
    [actorName],
  );

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedBoard, setSelectedBoard] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Dialog & Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCardRecord, setEditingCardRecord] =
    useState<StudentIdCardRecord | null>(null);
  const [formSelectedStudentId, setFormSelectedStudentId] = useState("");

  // Preview Modal
  const [previewData, setPreviewData] = useState<{
    student: StudentProfile;
    cardRecord?: StudentIdCardRecord;
  } | null>(null);

  // Approve Confirmation Modal
  const [approveConfirmTarget, setApproveConfirmTarget] = useState<{
    student: StudentProfile;
    cardRecord: StudentIdCardRecord;
  } | null>(null);

  // Reject Modal
  const [rejectTarget, setRejectTarget] = useState<{
    student: StudentProfile;
    cardRecord: StudentIdCardRecord;
  } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Deactivate Modal
  const [deactivateTarget, setDeactivateTarget] = useState<{
    student: StudentProfile;
    cardRecord: StudentIdCardRecord;
  } | null>(null);
  const [deactivationReason, setDeactivationReason] = useState("");

  // Renew Modal
  const [renewTarget, setRenewTarget] = useState<{
    student: StudentProfile;
    cardRecord: StudentIdCardRecord;
  } | null>(null);
  const [renewDate, setRenewDate] = useState("2028-03-31");

  // History Modal
  const [historyTarget, setHistoryTarget] =
    useState<StudentIdCardRecord | null>(null);

  // Form Fields State
  const [formData, setFormData] = useState({
    studentName: "",
    formattedId: "",
    photoUrl: "",
    classGrade: "",
    board: "",
    session: "2026–2027",
    joiningDate: "",
    enrolledSubjects: [] as string[],
    batches: [] as string[],
    guardianName: "",
    guardianPhone: "",
    emergencyContact: "",
    campusName: "AROUSH Academy",
    campusAddress: "48/2 Circus Avenue, Park Circus, Kolkata, West Bengal 700017",
    campusPhone: "+91 98830 11221",
    campusEmail: "contact@aroush.academy",
    validFrom: "2026-04-01",
    validThru: "2027-03-31",
  });
  const [formErrors, setFormErrors] = useState<string[]>([]);

  // Compute Metrics Summary
  const metrics = useMemo(() => {
    const total = students.length;
    let approved = 0;
    let pending = 0;
    let draft = 0;
    let inactive = 0;

    idCardRecords.forEach((c) => {
      if (c.status === "approved") approved++;
      else if (c.status === "pending-approval") pending++;
      else if (c.status === "draft") draft++;
      else if (
        c.status === "inactive" ||
        c.status === "rejected" ||
        c.status === "expired"
      ) {
        inactive++;
      }
    });

    const notCreated = students.filter(
      (s) => !idCardRecords.some((c) => c.studentId === s.id),
    ).length;

    return {
      total,
      approved,
      pending,
      draft,
      notCreated,
      inactive,
    };
  }, [students, idCardRecords]);

  // Combined Directory Listing
  const directoryRows = useMemo(() => {
    return students.map((student) => {
      const cardRecord = idCardRecords.find((c) => c.studentId === student.id);
      const studentEnrollments = enrollments.filter(
        (e) => e.studentId === student.id,
      );
      const subjects =
        cardRecord?.enrolledSubjects ||
        studentEnrollments.map((e) => e.subjectName);
      const cardStatus: StudentIdCardStatus | "not-created" =
        cardRecord?.status || "not-created";

      return {
        student,
        cardRecord,
        enrollments: studentEnrollments,
        subjects,
        cardStatus,
        formattedId:
          cardRecord?.studentFormattedId ||
          `AA-2026-${student.id.replace("std-", "")}`,
      };
    });
  }, [students, idCardRecords, enrollments]);

  // Filtered Rows
  const filteredRows = useMemo(() => {
    return directoryRows.filter((row) => {
      // Search filter
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchName = row.student.name.toLowerCase().includes(q);
        const matchId = row.formattedId.toLowerCase().includes(q);
        const matchGuardian = row.student.guardianName
          .toLowerCase()
          .includes(q);
        if (!matchName && !matchId && !matchGuardian) return false;
      }

      // Class filter
      if (selectedClass !== "all" && row.student.classGrade !== selectedClass) {
        return false;
      }

      // Board filter
      if (selectedBoard !== "all" && row.student.board !== selectedBoard) {
        return false;
      }

      // Status filter
      if (selectedStatus !== "all" && row.cardStatus !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [
    directoryRows,
    searchQuery,
    selectedClass,
    selectedBoard,
    selectedStatus,
  ]);

  // Open Create Modal
  const openCreateModal = (targetStudent?: StudentProfile) => {
    const student = targetStudent || students[0];
    if (!student) return;

    const studentEnrollments = enrollments.filter(
      (e) => e.studentId === student.id,
    );
    const existingCard = idCardRecords.find((c) => c.studentId === student.id);

    setEditingCardRecord(existingCard || null);
    setFormSelectedStudentId(student.id);

    const initialSubjects = existingCard?.enrolledSubjects?.length
      ? existingCard.enrolledSubjects
      : Array.from(new Set(studentEnrollments.map((e) => e.subjectName)));

    const initialBatches = existingCard?.batches?.length
      ? existingCard.batches
      : Array.from(new Set(studentEnrollments.map((e) => e.batchName)));

    setFormData({
      studentName: existingCard?.studentName || student.name,
      formattedId:
        existingCard?.studentFormattedId ||
        `AA-2026-${student.id.replace("std-", "")}`,
      photoUrl: existingCard?.photoUrl || "",
      classGrade: existingCard?.classGrade || student.classGrade,
      board: existingCard?.board || student.board,
      session: existingCard?.session || "2026–2027",
      joiningDate: existingCard?.joiningDate || student.joiningDate,
      enrolledSubjects:
        initialSubjects.length > 0 ? initialSubjects : ["General Curriculum"],
      batches: initialBatches,
      guardianName: existingCard?.guardianName || student.guardianName,
      guardianPhone: existingCard?.guardianPhone || student.guardianPhone,
      emergencyContact:
        existingCard?.emergencyContact || student.guardianPhone,
      campusName: existingCard?.campusName || "AROUSH Academy",
      campusAddress:
        existingCard?.campusAddress ||
        "48/2 Circus Avenue, Park Circus, Kolkata, West Bengal 700017",
      campusPhone: existingCard?.campusPhone || "+91 98830 11221",
      campusEmail: existingCard?.campusEmail || "contact@aroush.academy",
      validFrom: existingCard?.validFrom || "2026-04-01",
      validThru: existingCard?.validThru || "2027-03-31",
    });

    setFormErrors([]);
    setIsFormModalOpen(true);
  };

  // Change Student Selection in Form
  const handleStudentSelectChange = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    const existingCard = idCardRecords.find((c) => c.studentId === student.id);
    const studentEnrollments = enrollments.filter(
      (e) => e.studentId === student.id,
    );

    setEditingCardRecord(existingCard || null);
    setFormSelectedStudentId(student.id);

    const initialSubjects = existingCard?.enrolledSubjects?.length
      ? existingCard.enrolledSubjects
      : Array.from(new Set(studentEnrollments.map((e) => e.subjectName)));

    setFormData((prev) => ({
      ...prev,
      studentName: student.name,
      formattedId: `AA-2026-${student.id.replace("std-", "")}`,
      classGrade: student.classGrade,
      board: student.board,
      joiningDate: student.joiningDate,
      enrolledSubjects:
        initialSubjects.length > 0 ? initialSubjects : ["General Curriculum"],
      guardianName: student.guardianName,
      guardianPhone: student.guardianPhone,
      emergencyContact: student.guardianPhone,
      photoUrl: existingCard?.photoUrl || "",
    }));
  };

  // Handle Photo File Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFormErrors(["Uploaded file must be a valid image (PNG, JPG, WebP)."]);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setFormData((prev) => ({ ...prev, photoUrl: dataUrl }));
      setFormErrors([]);
    };
    reader.readAsDataURL(file);
  };

  // Save Card (Draft, Pending, or Approved)
  const handleSaveCard = (targetStatus: StudentIdCardStatus) => {
    // Basic Form Validation
    const errors: string[] = [];
    if (!formData.studentName.trim()) {
      errors.push("Student full name is required.");
    }
    if (!formData.formattedId.trim()) {
      errors.push("Admission ID is required.");
    }
    if (!formData.validFrom || !formData.validThru) {
      errors.push("Both validity start and expiry dates are required.");
    }

    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    const now = new Date().toISOString();
    const student = students.find((s) => s.id === formSelectedStudentId);
    if (!student) return;

    const actionType: IdCardHistoryEntry["action"] =
      targetStatus === "approved"
        ? "approved"
        : targetStatus === "pending-approval"
        ? "submitted"
        : editingCardRecord
        ? "updated"
        : "created";

    const historyItem: IdCardHistoryEntry = {
      id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: now,
      action: actionType,
      actorRole: "academy-admin",
      actorName,
      notes:
        targetStatus === "approved"
          ? "ID card approved & officially issued by Academy Administrator."
          : targetStatus === "pending-approval"
          ? "ID card submitted for credential review."
          : editingCardRecord
          ? "ID card details updated in draft state."
          : "ID card draft created with student record data.",
    };

    const newRecord: StudentIdCardRecord = {
      id: editingCardRecord?.id || `idc-${student.id}`,
      studentId: student.id,
      studentName: formData.studentName,
      studentFormattedId: formData.formattedId,
      photoUrl: formData.photoUrl || undefined,
      classGrade: formData.classGrade,
      board: formData.board,
      session: formData.session,
      joiningDate: formData.joiningDate,
      enrolledSubjects: formData.enrolledSubjects,
      batches: formData.batches,
      guardianName: formData.guardianName,
      guardianPhone: formData.guardianPhone,
      emergencyContact: formData.emergencyContact,
      campusName: formData.campusName,
      campusAddress: formData.campusAddress,
      campusPhone: formData.campusPhone,
      campusEmail: formData.campusEmail,
      validFrom: formData.validFrom,
      validThru: formData.validThru,
      status: targetStatus,
      createdAt: editingCardRecord?.createdAt || now,
      updatedAt: now,
      issuedAt:
        targetStatus === "approved"
          ? editingCardRecord?.issuedAt || now
          : undefined,
      issuedBy: targetStatus === "approved" ? actorName : undefined,
      history: [historyItem, ...(editingCardRecord?.history || [])],
    };

    onUpdateIdCards((prev) => {
      const filtered = prev.filter((c) => c.studentId !== student.id);
      return [newRecord, ...filtered];
    });

    logAudit(
      targetStatus === "approved"
        ? "Issued Student ID Card"
        : targetStatus === "pending-approval"
        ? "Submitted Student ID Card for Approval"
        : "Saved Student ID Card Draft",
      formData.formattedId,
      `Student: ${formData.studentName} (${formData.classGrade} · ${formData.board})`,
    );

    setIsFormModalOpen(false);
    setEditingCardRecord(null);
  };

  // Approve & Issue Action
  const handleApproveConfirm = () => {
    if (!approveConfirmTarget) return;
    const { student, cardRecord } = approveConfirmTarget;
    const now = new Date().toISOString();

    const historyItem: IdCardHistoryEntry = {
      id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: now,
      action: "approved",
      actorRole: "academy-admin",
      actorName,
      notes: "Card approved and issued. Visible in student and parent portals.",
    };

    const updated: StudentIdCardRecord = {
      ...cardRecord,
      status: "approved",
      updatedAt: now,
      issuedAt: now,
      issuedBy: actorName,
      rejectionReason: undefined,
      history: [historyItem, ...(cardRecord.history || [])],
    };

    onUpdateIdCards((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c)),
    );

    logAudit(
      "Approved & Issued Student ID Card",
      updated.studentFormattedId,
      `Official credential released for ${student.name}.`,
    );

    setApproveConfirmTarget(null);
  };

  // Reject Action
  const handleRejectConfirm = () => {
    if (!rejectTarget) return;
    if (!rejectionReason.trim()) {
      alert("A mandatory reason for rejection must be provided.");
      return;
    }

    const { student, cardRecord } = rejectTarget;
    const now = new Date().toISOString();

    const historyItem: IdCardHistoryEntry = {
      id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: now,
      action: "rejected",
      actorRole: "academy-admin",
      actorName,
      notes: `Rejected: ${rejectionReason.trim()}`,
    };

    const updated: StudentIdCardRecord = {
      ...cardRecord,
      status: "rejected",
      updatedAt: now,
      rejectionReason: rejectionReason.trim(),
      history: [historyItem, ...(cardRecord.history || [])],
    };

    onUpdateIdCards((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c)),
    );

    logAudit(
      "Rejected Student ID Card",
      updated.studentFormattedId,
      `Student: ${student.name}. Reason: ${rejectionReason.trim()}`,
    );

    setRejectTarget(null);
    setRejectionReason("");
  };

  // Deactivate Action
  const handleDeactivateConfirm = () => {
    if (!deactivateTarget) return;
    if (!deactivationReason.trim()) {
      alert("A mandatory reason for deactivation must be provided.");
      return;
    }

    const { student, cardRecord } = deactivateTarget;
    const now = new Date().toISOString();

    const historyItem: IdCardHistoryEntry = {
      id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: now,
      action: "deactivated",
      actorRole: "academy-admin",
      actorName,
      notes: `Deactivated: ${deactivationReason.trim()}`,
    };

    const updated: StudentIdCardRecord = {
      ...cardRecord,
      status: "inactive",
      updatedAt: now,
      deactivationReason: deactivationReason.trim(),
      history: [historyItem, ...(cardRecord.history || [])],
    };

    onUpdateIdCards((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c)),
    );

    logAudit(
      "Deactivated Student ID Card",
      updated.studentFormattedId,
      `Student: ${student.name}. Reason: ${deactivationReason.trim()}`,
    );

    setDeactivateTarget(null);
    setDeactivationReason("");
  };

  // Renew Action
  const handleRenewConfirm = () => {
    if (!renewTarget) return;
    const { student, cardRecord } = renewTarget;
    const now = new Date().toISOString();

    const historyItem: IdCardHistoryEntry = {
      id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: now,
      action: "renewed",
      actorRole: "academy-admin",
      actorName,
      notes: `Renewed card validity through ${renewDate}.`,
    };

    const updated: StudentIdCardRecord = {
      ...cardRecord,
      status: "approved",
      validThru: renewDate,
      updatedAt: now,
      history: [historyItem, ...(cardRecord.history || [])],
    };

    onUpdateIdCards((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c)),
    );

    logAudit(
      "Renewed Student ID Card",
      updated.studentFormattedId,
      `Student: ${student.name}. New expiry: ${renewDate}.`,
    );

    setRenewTarget(null);
  };

  // Helper Badge Renderer
  const renderStatusBadge = (status: StudentIdCardStatus | "not-created") => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="success" size="sm">
            🟢 Active / Issued
          </Badge>
        );
      case "pending-approval":
        return (
          <Badge variant="warning" size="sm">
            🟡 Pending Approval
          </Badge>
        );
      case "draft":
        return (
          <Badge variant="accent" size="sm">
            🔵 Draft
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="danger" size="sm">
            🔴 Rejected
          </Badge>
        );
      case "inactive":
        return (
          <Badge variant="neutral" size="sm">
            ⚫ Inactive
          </Badge>
        );
      case "expired":
        return (
          <Badge variant="warning" size="sm">
            🟠 Expired
          </Badge>
        );
      case "not-created":
      default:
        return (
          <Badge variant="neutral" size="sm">
            ⚪ Not Created
          </Badge>
        );
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      {/* ---------------- 1. DASHBOARD HEADER & QUICK ACTION ---------------- */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "var(--space-4)",
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "var(--text-xl)",
              fontWeight: 800,
              color: "var(--color-primary)",
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            Student ID Card Management System
          </h2>
          <p
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--color-neutral-dark)",
              margin: "3px 0 0",
            }}
          >
            Author, review, issue, renew, and audit official AROUSH Academy digital student identity credentials.
          </p>
        </div>

        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <Button
            variant="accent"
            size="md"
            onClick={() => openCreateModal()}
            type="button"
          >
            <span style={{ marginRight: "6px", fontSize: "14px" }}>+</span>
            Create Student ID
          </Button>
        </div>
      </div>

      {/* ---------------- 2. SUMMARY METRICS CARDS ---------------- */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: "var(--space-4)",
        }}
      >
        <Card padding="md">
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", fontWeight: 500 }}>
            Total Students
          </div>
          <div style={{ fontSize: "var(--text-3xl)", fontWeight: 700, color: "var(--color-primary)", marginTop: "4px" }}>
            {metrics.total}
          </div>
          <div style={{ fontSize: "11px", color: "var(--color-neutral-dark)", marginTop: "4px" }}>
            Enrolled in academy
          </div>
        </Card>

        <Card padding="md">
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", fontWeight: 500 }}>
            Approved / Issued
          </div>
          <div style={{ fontSize: "var(--text-3xl)", fontWeight: 700, color: "var(--color-success)", marginTop: "4px" }}>
            {metrics.approved}
          </div>
          <div style={{ fontSize: "11px", color: "var(--color-neutral-dark)", marginTop: "4px" }}>
            Active verified cards
          </div>
        </Card>

        <Card padding="md">
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", fontWeight: 500 }}>
            Pending Approval
          </div>
          <div style={{ fontSize: "var(--text-3xl)", fontWeight: 700, color: "var(--color-warning)", marginTop: "4px" }}>
            {metrics.pending}
          </div>
          <div style={{ fontSize: "11px", color: "var(--color-neutral-dark)", marginTop: "4px" }}>
            Awaiting issuance
          </div>
        </Card>

        <Card padding="md">
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", fontWeight: 500 }}>
            Draft Cards
          </div>
          <div style={{ fontSize: "var(--text-3xl)", fontWeight: 700, color: "var(--color-accent)", marginTop: "4px" }}>
            {metrics.draft}
          </div>
          <div style={{ fontSize: "11px", color: "var(--color-neutral-dark)", marginTop: "4px" }}>
            Incomplete or authored
          </div>
        </Card>

        <Card padding="md">
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", fontWeight: 500 }}>
            Not Created
          </div>
          <div style={{ fontSize: "var(--text-3xl)", fontWeight: 700, color: "var(--color-neutral-dark)", marginTop: "4px" }}>
            {metrics.notCreated}
          </div>
          <div style={{ fontSize: "11px", color: "var(--color-neutral-dark)", marginTop: "4px" }}>
            Needs initial drafting
          </div>
        </Card>

        <Card padding="md">
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", fontWeight: 500 }}>
            Inactive / Revoked
          </div>
          <div style={{ fontSize: "var(--text-3xl)", fontWeight: 700, color: "#64748B", marginTop: "4px" }}>
            {metrics.inactive}
          </div>
          <div style={{ fontSize: "11px", color: "var(--color-neutral-dark)", marginTop: "4px" }}>
            Revoked or rejected
          </div>
        </Card>
      </div>

      {/* ---------------- 3. SEARCH & FILTERING BAR ---------------- */}
      <Card padding="md">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "var(--space-3)",
            alignItems: "center",
          }}
        >
          {/* Search Input */}
          <div>
            <label
              htmlFor="idc-search"
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--color-neutral-dark)",
                marginBottom: "4px",
              }}
            >
              Search Students
            </label>
            <input
              id="idc-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student, ID, or guardian..."
              style={{
                width: "100%",
                padding: "8px 12px",
                fontSize: "var(--text-xs)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-surface)",
                outline: "none",
              }}
            />
          </div>

          {/* Class Filter */}
          <div>
            <label
              htmlFor="idc-filter-class"
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--color-neutral-dark)",
                marginBottom: "4px",
              }}
            >
              Class Grade
            </label>
            <select
              id="idc-filter-class"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                fontSize: "var(--text-xs)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-surface)",
              }}
            >
              <option value="all">All Classes</option>
              <option value="Class IX">Class IX</option>
              <option value="Class X">Class X</option>
              <option value="Class XI">Class XI</option>
              <option value="Class XII">Class XII</option>
            </select>
          </div>

          {/* Board Filter */}
          <div>
            <label
              htmlFor="idc-filter-board"
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--color-neutral-dark)",
                marginBottom: "4px",
              }}
            >
              Curriculum Board
            </label>
            <select
              id="idc-filter-board"
              value={selectedBoard}
              onChange={(e) => setSelectedBoard(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                fontSize: "var(--text-xs)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-surface)",
              }}
            >
              <option value="all">All Boards</option>
              <option value="ICSE">ICSE</option>
              <option value="CBSE">CBSE</option>
              <option value="West Bengal Board">West Bengal Board</option>
            </select>
          </div>

          {/* Card Status Filter */}
          <div>
            <label
              htmlFor="idc-filter-status"
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--color-neutral-dark)",
                marginBottom: "4px",
              }}
            >
              ID Card Status
            </label>
            <select
              id="idc-filter-status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                fontSize: "var(--text-xs)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-surface)",
              }}
            >
              <option value="all">All Statuses</option>
              <option value="approved">Approved &amp; Issued</option>
              <option value="pending-approval">Pending Approval</option>
              <option value="draft">Draft</option>
              <option value="not-created">Not Created</option>
              <option value="rejected">Rejected</option>
              <option value="inactive">Inactive / Revoked</option>
            </select>
          </div>
        </div>
      </Card>

      {/* ---------------- 4. STUDENT DIRECTORY & ID LIFECYCLE TABLE ---------------- */}
      <Card padding="none">
        <div
          style={{
            padding: "var(--space-4) var(--space-5)",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h3 style={{ fontSize: "var(--text-sm)", fontWeight: 700, margin: 0 }}>
              Student Identity Registry
            </h3>
            <p style={{ fontSize: "11px", color: "var(--color-neutral-dark)", margin: "2px 0 0" }}>
              Showing {filteredRows.length} of {students.length} students
            </p>
          </div>
        </div>

        {filteredRows.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <span style={{ fontSize: "28px" }}>🔍</span>
            <h4 style={{ fontSize: "var(--text-sm)", fontWeight: 600, margin: "8px 0 4px" }}>
              No students match the selected filters
            </h4>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", margin: 0 }}>
              Try adjusting your search query, class, board, or card status filter.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "var(--text-xs)" }}>
              <thead>
                <tr style={{ backgroundColor: "var(--color-surface-muted)", borderBottom: "1px solid var(--color-border)" }}>
                  <th style={{ padding: "10px 16px", fontWeight: 600, color: "var(--color-neutral-dark)" }}>Student</th>
                  <th style={{ padding: "10px 16px", fontWeight: 600, color: "var(--color-neutral-dark)" }}>Class &amp; Board</th>
                  <th style={{ padding: "10px 16px", fontWeight: 600, color: "var(--color-neutral-dark)" }}>Guardian Details</th>
                  <th style={{ padding: "10px 16px", fontWeight: 600, color: "var(--color-neutral-dark)" }}>Card Status</th>
                  <th style={{ padding: "10px 16px", fontWeight: 600, color: "var(--color-neutral-dark)" }}>Validity / Updates</th>
                  <th style={{ padding: "10px 16px", fontWeight: 600, color: "var(--color-neutral-dark)", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const student = row.student;
                  const card = row.cardRecord;
                  const validThru = card?.validThru
                    ? new Date(card.validThru).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                    : "--";

                  return (
                    <tr
                      key={student.id}
                      style={{
                        borderBottom: "1px solid var(--color-border)",
                        transition: "background-color 0.1s ease",
                      }}
                    >
                      {/* Student Info */}
                      <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div
                            style={{
                              width: "34px",
                              height: "34px",
                              borderRadius: "50%",
                              backgroundColor: "var(--color-surface-muted)",
                              border: "1px solid var(--color-border)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: "12px",
                              color: "var(--color-accent)",
                              overflow: "hidden",
                              flexShrink: 0,
                            }}
                          >
                            {card?.photoUrl ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img src={card.photoUrl} alt={student.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              student.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: "var(--color-primary)" }}>
                              {student.name}
                            </div>
                            <div style={{ fontSize: "10.5px", color: "var(--color-accent)", fontFamily: "monospace", fontWeight: 600 }}>
                              {row.formattedId}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Class & Board */}
                      <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                        <div style={{ fontWeight: 600, color: "var(--color-primary)" }}>
                          {student.classGrade}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--color-neutral-dark)" }}>
                          {student.board} &bull; {row.subjects.length} Subjects
                        </div>
                      </td>

                      {/* Guardian Details */}
                      <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                        <div style={{ color: "var(--color-primary)", fontWeight: 500 }}>
                          {student.guardianName}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--color-neutral-dark)" }}>
                          {student.guardianPhone}
                        </div>
                      </td>

                      {/* Card Status */}
                      <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                        {renderStatusBadge(row.cardStatus)}
                      </td>

                      {/* Validity / Updates */}
                      <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                        <div style={{ color: "var(--color-primary)" }}>
                          {card?.status === "approved" ? `Thru: ${validThru}` : row.cardStatus === "not-created" ? "Not Issued" : "In Progress"}
                        </div>
                        <div style={{ fontSize: "10px", color: "var(--color-neutral-dark)", marginTop: "2px" }}>
                          {card?.updatedAt
                            ? `Updated: ${new Date(card.updatedAt).toLocaleDateString()}`
                            : `Joined: ${student.joiningDate}`}
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td style={{ padding: "12px 16px", verticalAlign: "middle", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                          {/* NOT CREATED */}
                          {row.cardStatus === "not-created" && (
                            <Button
                              variant="accent"
                              size="sm"
                              onClick={() => openCreateModal(student)}
                              type="button"
                            >
                              + Create Card
                            </Button>
                          )}

                          {/* DRAFT */}
                          {row.cardStatus === "draft" && (
                            <>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => openCreateModal(student)}
                                type="button"
                              >
                                Edit
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setPreviewData({ student, cardRecord: card })}
                                type="button"
                              >
                                Preview
                              </Button>
                              <Button
                                variant="accent"
                                size="sm"
                                onClick={() => {
                                  if (card) setApproveConfirmTarget({ student, cardRecord: card });
                                }}
                                type="button"
                              >
                                Approve
                              </Button>
                            </>
                          )}

                          {/* PENDING APPROVAL */}
                          {row.cardStatus === "pending-approval" && (
                            <>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setPreviewData({ student, cardRecord: card })}
                                type="button"
                              >
                                Preview
                              </Button>
                              <Button
                                variant="accent"
                                size="sm"
                                onClick={() => {
                                  if (card) setApproveConfirmTarget({ student, cardRecord: card });
                                }}
                                type="button"
                              >
                                Approve &amp; Issue
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  if (card) {
                                    setRejectTarget({ student, cardRecord: card });
                                    setRejectionReason("");
                                  }
                                }}
                                type="button"
                              >
                                Reject
                              </Button>
                            </>
                          )}

                          {/* APPROVED / ISSUED */}
                          {row.cardStatus === "approved" && (
                            <>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setPreviewData({ student, cardRecord: card })}
                                type="button"
                              >
                                Preview
                              </Button>
                              <Button
                                variant="accent"
                                size="sm"
                                onClick={() => {
                                  if (onOpenPrintModal) {
                                    onOpenPrintModal(student, card);
                                  } else {
                                    setPreviewData({ student, cardRecord: card });
                                  }
                                }}
                                type="button"
                              >
                                Print
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  if (card) {
                                    setRenewTarget({ student, cardRecord: card });
                                  }
                                }}
                                type="button"
                              >
                                Renew
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  if (card) {
                                    setDeactivateTarget({ student, cardRecord: card });
                                    setDeactivationReason("");
                                  }
                                }}
                                type="button"
                              >
                                Deactivate
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (card) setHistoryTarget(card);
                                }}
                                type="button"
                              >
                                History
                              </Button>
                            </>
                          )}

                          {/* REJECTED */}
                          {row.cardStatus === "rejected" && (
                            <>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  alert(`Rejection Reason: ${card?.rejectionReason || "Details not provided."}`);
                                }}
                                type="button"
                              >
                                Reason
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => openCreateModal(student)}
                                type="button"
                              >
                                Edit &amp; Resubmit
                              </Button>
                              <Button
                                variant="accent"
                                size="sm"
                                onClick={() => {
                                  if (card) setApproveConfirmTarget({ student, cardRecord: card });
                                }}
                                type="button"
                              >
                                Approve
                              </Button>
                            </>
                          )}

                          {/* INACTIVE */}
                          {row.cardStatus === "inactive" && (
                            <>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  alert(`Deactivation Reason: ${card?.deactivationReason || "Card was revoked."}`);
                                }}
                                type="button"
                              >
                                Reason
                              </Button>
                              <Button
                                variant="accent"
                                size="sm"
                                onClick={() => {
                                  if (card) setApproveConfirmTarget({ student, cardRecord: card });
                                }}
                                type="button"
                              >
                                Reissue
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ---------------- 5. CREATE / EDIT ID CARD MODAL ---------------- */}
      {isFormModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--space-4)",
            zIndex: 120,
            overflowY: "auto",
          }}
        >
          <div
            style={{
              backgroundColor: "var(--color-surface)",
              borderRadius: "var(--radius-xl)",
              border: "1px solid var(--color-border)",
              boxShadow: "var(--shadow-xl)",
              width: "100%",
              maxWidth: "680px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "var(--space-6)",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "var(--space-4)",
                paddingBottom: "var(--space-3)",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              <div>
                <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 700, margin: 0, color: "var(--color-primary)" }}>
                  {editingCardRecord ? "Edit Student ID Card" : "Create Official Student ID Card"}
                </h3>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", margin: "3px 0 0" }}>
                  Admin-controlled credential configuration with dynamic student data linkage.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "18px",
                  cursor: "pointer",
                  color: "var(--color-neutral-dark)",
                }}
              >
                &times;
              </button>
            </div>

            {/* Validation Errors Notice */}
            {formErrors.length > 0 && (
              <div
                style={{
                  padding: "var(--space-3) var(--space-4)",
                  backgroundColor: "rgba(255, 59, 48, 0.1)",
                  border: "1px solid rgba(255, 59, 48, 0.25)",
                  borderRadius: "var(--radius-md)",
                  marginBottom: "var(--space-4)",
                }}
              >
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-danger)", marginBottom: "2px" }}>
                  Please correct the following errors:
                </div>
                {formErrors.map((err, i) => (
                  <div key={i} style={{ fontSize: "var(--text-xs)", color: "var(--color-danger)" }}>
                    &bull; {err}
                  </div>
                ))}
              </div>
            )}

            {/* Form Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
              {/* Student Selection */}
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--color-neutral-dark)", marginBottom: "4px" }}>
                  Selected Student Record
                </label>
                <select
                  value={formSelectedStudentId}
                  onChange={(e) => handleStudentSelectChange(e.target.value)}
                  disabled={!!editingCardRecord}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: "var(--text-xs)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-border)",
                    backgroundColor: editingCardRecord ? "var(--color-surface-muted)" : "var(--color-surface)",
                  }}
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.classGrade} &bull; {s.board}) &mdash; {s.id}
                    </option>
                  ))}
                </select>
              </div>

              {/* Student Name */}
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--color-neutral-dark)", marginBottom: "4px" }}>
                  Student Full Name *
                </label>
                <input
                  type="text"
                  value={formData.studentName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, studentName: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: "var(--text-xs)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-border)",
                  }}
                />
              </div>

              {/* Formatted Admission ID */}
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--color-neutral-dark)", marginBottom: "4px" }}>
                  Unique Admission ID *
                </label>
                <input
                  type="text"
                  value={formData.formattedId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, formattedId: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: "var(--text-xs)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-border)",
                    fontFamily: "monospace",
                  }}
                />
              </div>

              {/* Class Grade */}
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--color-neutral-dark)", marginBottom: "4px" }}>
                  Class Grade
                </label>
                <input
                  type="text"
                  value={formData.classGrade}
                  onChange={(e) => setFormData((prev) => ({ ...prev, classGrade: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: "var(--text-xs)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-border)",
                  }}
                />
              </div>

              {/* Education Board */}
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--color-neutral-dark)", marginBottom: "4px" }}>
                  Education Board
                </label>
                <input
                  type="text"
                  value={formData.board}
                  onChange={(e) => setFormData((prev) => ({ ...prev, board: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: "var(--text-xs)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-border)",
                  }}
                />
              </div>

              {/* Academic Session */}
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--color-neutral-dark)", marginBottom: "4px" }}>
                  Academic Session
                </label>
                <input
                  type="text"
                  value={formData.session}
                  onChange={(e) => setFormData((prev) => ({ ...prev, session: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: "var(--text-xs)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-border)",
                  }}
                />
              </div>

              {/* Date of Admission */}
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--color-neutral-dark)", marginBottom: "4px" }}>
                  Admission Date
                </label>
                <input
                  type="date"
                  value={formData.joiningDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, joiningDate: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: "var(--text-xs)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-border)",
                  }}
                />
              </div>

              {/* Guardian Name */}
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--color-neutral-dark)", marginBottom: "4px" }}>
                  Guardian Name
                </label>
                <input
                  type="text"
                  value={formData.guardianName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, guardianName: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: "var(--text-xs)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-border)",
                  }}
                />
              </div>

              {/* Guardian Contact */}
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--color-neutral-dark)", marginBottom: "4px" }}>
                  Guardian Phone / Helpline
                </label>
                <input
                  type="text"
                  value={formData.guardianPhone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, guardianPhone: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: "var(--text-xs)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-border)",
                  }}
                />
              </div>

              {/* Validity Start Date */}
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--color-neutral-dark)", marginBottom: "4px" }}>
                  Valid From *
                </label>
                <input
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => setFormData((prev) => ({ ...prev, validFrom: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: "var(--text-xs)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-border)",
                  }}
                />
              </div>

              {/* Validity Expiry Date */}
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--color-neutral-dark)", marginBottom: "4px" }}>
                  Valid Thru (Expiry) *
                </label>
                <input
                  type="date"
                  value={formData.validThru}
                  onChange={(e) => setFormData((prev) => ({ ...prev, validThru: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: "var(--text-xs)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-border)",
                  }}
                />
              </div>

              {/* Photograph Upload with Preview */}
              <div style={{ gridColumn: "span 2", padding: "12px", backgroundColor: "var(--color-surface-muted)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--color-primary)", marginBottom: "6px" }}>
                  Student Photograph (File Selection &amp; Preview)
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  {/* Photo Preview Thumbnail */}
                  <div
                    style={{
                      width: "56px",
                      height: "68px",
                      borderRadius: "6px",
                      border: "1px solid var(--color-border)",
                      backgroundColor: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    {formData.photoUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={formData.photoUrl} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: "10px", color: "var(--color-neutral-dark)", fontWeight: 600 }}>No Photo</span>
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      style={{ fontSize: "11px" }}
                    />
                    <div style={{ fontSize: "10px", color: "var(--color-neutral-dark)", marginTop: "4px" }}>
                      Frontend demo mode: Uploaded photo is retained in browser session memory. Fallback monogram initials used if omitted.
                    </div>
                    {formData.photoUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, photoUrl: "" }))}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--color-danger)",
                          fontSize: "11px",
                          fontWeight: 600,
                          cursor: "pointer",
                          padding: "2px 0",
                          marginTop: "2px",
                        }}
                      >
                        Remove Uploaded Photo
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "var(--space-6)",
                paddingTop: "var(--space-4)",
                borderTop: "1px solid var(--color-border)",
                flexWrap: "wrap",
                gap: "var(--space-2)",
              }}
            >
              <Button variant="secondary" size="sm" onClick={() => setIsFormModalOpen(false)} type="button">
                Cancel
              </Button>

              <div style={{ display: "flex", gap: "var(--space-2)" }}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSaveCard("draft")}
                  type="button"
                >
                  Save as Draft
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSaveCard("pending-approval")}
                  type="button"
                >
                  Submit for Approval
                </Button>
                <Button
                  variant="accent"
                  size="sm"
                  onClick={() => handleSaveCard("approved")}
                  type="button"
                >
                  Approve &amp; Issue Directly
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 6. PREVIEW MODAL ---------------- */}
      {previewData && (
        <DigitalIdCard
          student={previewData.student}
          enrollments={enrollments.filter((e) => e.studentId === previewData.student.id)}
          cardRecord={previewData.cardRecord}
          onClose={() => setPreviewData(null)}
          isModal={true}
        />
      )}

      {/* ---------------- 7. APPROVE CONFIRMATION MODAL ---------------- */}
      {approveConfirmTarget && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--space-4)",
            zIndex: 130,
          }}
        >
          <div
            style={{
              backgroundColor: "var(--color-surface)",
              borderRadius: "var(--radius-lg)",
              padding: "var(--space-6)",
              maxWidth: "440px",
              width: "100%",
              boxShadow: "var(--shadow-xl)",
            }}
          >
            <h4 style={{ margin: "0 0 8px", fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-primary)" }}>
              Confirm ID Card Approval &amp; Issuance
            </h4>
            <p style={{ margin: "0 0 16px", fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", lineHeight: 1.5 }}>
              Are you sure you want to officially issue the student ID card for <strong>{approveConfirmTarget.student.name}</strong> ({approveConfirmTarget.cardRecord.studentFormattedId})?
              <br /><br />
              Once issued, this verified credential will be immediately available in both the Student Portal and the linked Parent Portal.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <Button variant="secondary" size="sm" onClick={() => setApproveConfirmTarget(null)} type="button">
                Cancel
              </Button>
              <Button variant="accent" size="sm" onClick={handleApproveConfirm} type="button">
                Confirm &amp; Issue Card
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 8. REJECT MODAL ---------------- */}
      {rejectTarget && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--space-4)",
            zIndex: 130,
          }}
        >
          <div
            style={{
              backgroundColor: "var(--color-surface)",
              borderRadius: "var(--radius-lg)",
              padding: "var(--space-6)",
              maxWidth: "440px",
              width: "100%",
              boxShadow: "var(--shadow-xl)",
            }}
          >
            <h4 style={{ margin: "0 0 8px", fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-danger)" }}>
              Reject Student ID Card
            </h4>
            <p style={{ margin: "0 0 12px", fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)" }}>
              Please provide a mandatory reason for rejecting this card for <strong>{rejectTarget.student.name}</strong>:
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Passport photograph clarity does not meet requirements, incorrect board name..."
              style={{
                width: "100%",
                padding: "8px 10px",
                fontSize: "var(--text-xs)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                marginBottom: "16px",
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <Button variant="secondary" size="sm" onClick={() => setRejectTarget(null)} type="button">
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleRejectConfirm} type="button">
                Reject Card
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 9. DEACTIVATE MODAL ---------------- */}
      {deactivateTarget && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--space-4)",
            zIndex: 130,
          }}
        >
          <div
            style={{
              backgroundColor: "var(--color-surface)",
              borderRadius: "var(--radius-lg)",
              padding: "var(--space-6)",
              maxWidth: "440px",
              width: "100%",
              boxShadow: "var(--shadow-xl)",
            }}
          >
            <h4 style={{ margin: "0 0 8px", fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-danger)" }}>
              Deactivate Official ID Card
            </h4>
            <p style={{ margin: "0 0 12px", fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)" }}>
              Deactivating will immediately invalidate the ID card for <strong>{deactivateTarget.student.name}</strong> and remove it from student &amp; parent access.
            </p>
            <textarea
              rows={3}
              value={deactivationReason}
              onChange={(e) => setDeactivationReason(e.target.value)}
              placeholder="e.g. Student transferred, suspended enrollment, lost card replacement..."
              style={{
                width: "100%",
                padding: "8px 10px",
                fontSize: "var(--text-xs)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                marginBottom: "16px",
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <Button variant="secondary" size="sm" onClick={() => setDeactivateTarget(null)} type="button">
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleDeactivateConfirm} type="button">
                Deactivate Card
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 10. RENEW MODAL ---------------- */}
      {renewTarget && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--space-4)",
            zIndex: 130,
          }}
        >
          <div
            style={{
              backgroundColor: "var(--color-surface)",
              borderRadius: "var(--radius-lg)",
              padding: "var(--space-6)",
              maxWidth: "420px",
              width: "100%",
              boxShadow: "var(--shadow-xl)",
            }}
          >
            <h4 style={{ margin: "0 0 8px", fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-primary)" }}>
              Renew ID Card Validity
            </h4>
            <p style={{ margin: "0 0 12px", fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)" }}>
              Extend credential validity for <strong>{renewTarget.student.name}</strong> ({renewTarget.cardRecord.studentFormattedId}):
            </p>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--color-neutral-dark)", marginBottom: "4px" }}>
              New Expiry Date
            </label>
            <input
              type="date"
              value={renewDate}
              onChange={(e) => setRenewDate(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                fontSize: "var(--text-xs)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                marginBottom: "16px",
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <Button variant="secondary" size="sm" onClick={() => setRenewTarget(null)} type="button">
                Cancel
              </Button>
              <Button variant="accent" size="sm" onClick={handleRenewConfirm} type="button">
                Confirm Renewal
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 11. HISTORY & AUDIT TRAIL MODAL ---------------- */}
      {historyTarget && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--space-4)",
            zIndex: 130,
          }}
        >
          <div
            style={{
              backgroundColor: "var(--color-surface)",
              borderRadius: "var(--radius-lg)",
              padding: "var(--space-6)",
              maxWidth: "520px",
              width: "100%",
              boxShadow: "var(--shadow-xl)",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div>
                <h4 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-primary)" }}>
                  Credential Audit History
                </h4>
                <div style={{ fontSize: "11px", color: "var(--color-neutral-dark)", marginTop: "2px" }}>
                  {historyTarget.studentName} &bull; {historyTarget.studentFormattedId}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHistoryTarget(null)}
                style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer" }}
              >
                &times;
              </button>
            </div>

            {historyTarget.history && historyTarget.history.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {historyTarget.history.map((h) => (
                  <div
                    key={h.id}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--color-surface-muted)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontWeight: 700, fontSize: "11px", color: "var(--color-accent)", textTransform: "uppercase" }}>
                        {h.action}
                      </span>
                      <span style={{ fontSize: "10px", color: "var(--color-neutral-dark)" }}>
                        {new Date(h.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--color-primary)" }}>
                      By: <strong>{h.actorName}</strong> ({h.actorRole})
                    </div>
                    {h.notes && (
                      <div style={{ fontSize: "11px", color: "var(--color-neutral-dark)", marginTop: "3px" }}>
                        {h.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: "20px", textAlign: "center", color: "var(--color-neutral-dark)", fontSize: "var(--text-xs)" }}>
                No recorded state changes yet.
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
              <Button variant="secondary" size="sm" onClick={() => setHistoryTarget(null)} type="button">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
