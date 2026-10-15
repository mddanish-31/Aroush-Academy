"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  UserRole,
  StudyMaterialItem,
  StudyMaterialType,
  MaterialPublicationStatus,
  StudentProfile,
  TeacherProfile,
  SubjectEnrollment,
  BatchDefinition,
  AuditLogEntry,
} from "@/types";
import {
  SAMPLE_MATERIALS,
  SAMPLE_BATCHES,
  SAMPLE_AUDIT_LOGS,
} from "@/data/dashboardModulesData";
import {
  SAMPLE_STUDENTS,
  SAMPLE_TEACHERS,
  SAMPLE_ENROLLMENTS,
} from "@/data/enrollmentFeeData";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useDemoStorage, DEMO_STORAGE_KEYS } from "@/lib/demoStorage";
import {
  validateStudyMaterialFile,
  formatFileSize,
  demoStudyMaterialStorage,
  SUPPORTED_FILE_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
} from "@/lib/studyMaterialStorage";

interface StudyMaterialsModuleProps {
  role: UserRole;
  currentTeacherId?: string;
  currentStudentId?: string;
}

export function StudyMaterialsModule({
  role,
  currentTeacherId = "tch-azhar",
  currentStudentId,
}: StudyMaterialsModuleProps) {
  // Shared Demo Stores
  const [materials, setMaterials] = useDemoStorage<StudyMaterialItem[]>(
    DEMO_STORAGE_KEYS.STUDY_MATERIALS,
    SAMPLE_MATERIALS
  );
  const [enrollments] = useDemoStorage<SubjectEnrollment[]>(
    DEMO_STORAGE_KEYS.ENROLLMENTS,
    SAMPLE_ENROLLMENTS
  );
  const [students] = useDemoStorage<StudentProfile[]>(
    DEMO_STORAGE_KEYS.STUDENTS,
    SAMPLE_STUDENTS
  );
  const [faculty] = useDemoStorage<TeacherProfile[]>(
    DEMO_STORAGE_KEYS.FACULTY,
    SAMPLE_TEACHERS
  );
  const [batches] = useDemoStorage<BatchDefinition[]>(
    DEMO_STORAGE_KEYS.BATCHES,
    SAMPLE_BATCHES
  );
  const [, setAuditLogs] = useDemoStorage<AuditLogEntry[]>(
    DEMO_STORAGE_KEYS.AUDIT_LOGS,
    SAMPLE_AUDIT_LOGS
  );

  // Filter & Search State
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Form Fields
  const [titleInput, setTitleInput] = useState("");
  const [subjectInput, setSubjectInput] = useState("Mathematics");
  const [classGradeInput, setClassGradeInput] = useState("Class X");
  const [batchInput, setBatchInput] = useState("All Batches in Class");
  const [typeInput, setTypeInput] = useState<StudyMaterialType>("PDF Notes");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [statusInput, setStatusInput] = useState<MaterialPublicationStatus>("published");

  // Catalog / Details Preview Modal
  const [inspectItem, setInspectItem] = useState<StudyMaterialItem | null>(null);

  // Feedback Notification Banner
  const [actionNotification, setActionNotification] = useState<{
    type: "success" | "warning" | "error";
    message: string;
    note?: string;
  } | null>(null);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsUploadModalOpen(false);
        setInspectItem(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Teacher Profile reference
  const currentTeacher = useMemo(() => {
    return faculty.find((t) => t.id === currentTeacherId) || faculty[0] || null;
  }, [faculty, currentTeacherId]);

  // Student Profile reference (for student/parent view)
  const currentStudent = useMemo(() => {
    if (!currentStudentId) return null;
    return students.find((s) => s.id === currentStudentId) || null;
  }, [students, currentStudentId]);

  // Active student enrollments
  const studentEnrollments = useMemo(() => {
    if (!currentStudentId) return [];
    return enrollments.filter(
      (e) => e.studentId === currentStudentId && e.status === "active"
    );
  }, [enrollments, currentStudentId]);

  // Available subjects for upload
  const availableUploadSubjects = useMemo(() => {
    if (role === "teacher" && currentTeacher?.assignedSubjects?.length) {
      return currentTeacher.assignedSubjects;
    }
    return ["Mathematics", "Physics", "Chemistry", "Accountancy", "Economics", "Computer Applications"];
  }, [role, currentTeacher]);

  // Available batches for selected class and subject
  const availableBatchesForClass = useMemo(() => {
    return batches.filter(
      (b) => b.classGrade === classGradeInput && (b.subject === subjectInput || b.subject.includes(subjectInput))
    );
  }, [batches, classGradeInput, subjectInput]);

  // Scoped & Filtered Materials
  const visibleMaterials = useMemo(() => {
    return materials.filter((m) => {
      // 1. Role-based scoping & publication status
      if (role === "student" || role === "parent") {
        if (!currentStudentId || !currentStudent) return false;

        // Students and parents ONLY see published materials
        if (m.status === "draft") return false;

        // Subject check
        const enrolledSubjs = new Set(
          studentEnrollments.map((e) => e.subjectName.toLowerCase())
        );
        const matchesSubject = enrolledSubjs.has(m.subject.toLowerCase());

        // Class check
        const matchesClass = !m.classGrade || m.classGrade === currentStudent.classGrade;

        if (!matchesSubject || !matchesClass) return false;

        // Batch scoping: if material is restricted to a specific batch, verify student enrollment
        if (m.batchName && m.batchName !== "All Batches" && m.batchName !== "All Batches in Class") {
          const studentBatches = new Set(studentEnrollments.map((e) => e.batchName));
          if (!studentBatches.has(m.batchName)) return false;
        }
      } else if (role === "teacher") {
        // Teacher sees materials for assigned subjects or uploaded by self
        if (currentTeacher?.assignedSubjects?.length) {
          const teacherSubjs = new Set(
            currentTeacher.assignedSubjects.map((s) => s.toLowerCase())
          );
          const isOwnSubject = teacherSubjs.has(m.subject.toLowerCase());
          const isOwnUpload = m.teacherId === currentTeacherId;
          if (!isOwnSubject && !isOwnUpload) return false;
        }

        // Drafts filter for teacher
        if (filterStatus !== "all" && (m.status || "published") !== filterStatus) {
          return false;
        }
      } else if (role === "academy-admin") {
        // Admin sees all, respects status filter
        if (filterStatus !== "all" && (m.status || "published") !== filterStatus) {
          return false;
        }
      }

      // 2. Form Filters
      if (filterSubject !== "all" && m.subject !== filterSubject) return false;
      if (filterType !== "all" && m.type !== filterType) return false;

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = m.title.toLowerCase().includes(q);
        const matchesDesc = m.description?.toLowerCase().includes(q);
        const matchesFile = m.fileName?.toLowerCase().includes(q);
        const matchesAuthor = m.uploadedBy.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesFile && !matchesAuthor) {
          return false;
        }
      }

      return true;
    });
  }, [
    materials,
    role,
    currentStudentId,
    currentStudent,
    studentEnrollments,
    currentTeacher,
    currentTeacherId,
    filterStatus,
    filterSubject,
    filterType,
    searchQuery,
  ]);

  // Handle File Input Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      setFileError(null);
      return;
    }

    const validation = validateStudyMaterialFile(file);
    if (!validation.isValid) {
      setFileError(validation.error || "Invalid file format or size.");
      setSelectedFile(null);
    } else {
      setFileError(null);
      setSelectedFile(file);
      // Auto-populate title if empty
      if (!titleInput.trim()) {
        const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
        setTitleInput(nameWithoutExt.replace(/[-_]/g, " "));
      }
    }
  };

  // Submit Upload Handler
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setFileError("Please choose a file to upload.");
      return;
    }

    if (!titleInput.trim()) {
      setFileError("Please provide a title for the study resource.");
      return;
    }

    setIsUploading(true);
    setFileError(null);

    const teacherName =
      role === "teacher"
        ? currentTeacher
          ? currentTeacher.name
          : "Faculty"
        : "Academy Administration";

    const uploadResult = await demoStudyMaterialStorage.uploadFile({
      file: selectedFile,
      metadata: {
        title: titleInput.trim(),
        subject: subjectInput,
        classGrade: classGradeInput,
        batchName: batchInput,
        type: typeInput,
        description: descriptionInput.trim(),
        teacherId: currentTeacherId,
        uploadedBy: teacherName,
        status: statusInput,
      },
    });

    setIsUploading(false);

    if (!uploadResult.success || !uploadResult.item) {
      setFileError(uploadResult.error || "Failed to upload file.");
      return;
    }

    const newItem = uploadResult.item;
    setMaterials((prev) => [newItem, ...prev]);

    // Record activity in shared audit logs
    const auditEntry: AuditLogEntry = {
      id: `log-mat-${Date.now()}`,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      performedBy: teacherName,
      action: "Study Material Uploaded",
      target: `${newItem.subject} (${newItem.classGrade})`,
      details: `Uploaded ${newItem.type}: "${newItem.title}" (${newItem.fileName}, ${newItem.size}) — ${newItem.status}.`,
      type: "enrollment",
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);

    // Reset Modal Form
    setIsUploadModalOpen(false);
    setSelectedFile(null);
    setTitleInput("");
    setDescriptionInput("");
    setStatusInput("published");
    if (fileInputRef.current) fileInputRef.current.value = "";

    setActionNotification({
      type: "success",
      message: `Uploaded "${newItem.title}" (${newItem.fileName}) successfully.`,
      note: "Simulated client demo session storage: file is directly downloadable and viewable in this browser session.",
    });
    setTimeout(() => setActionNotification(null), 6000);
  };

  // Download Handler (Only when physical file exists)
  const handleDownload = async (item: StudyMaterialItem) => {
    if (!item.hasPhysicalFile || !item.fileName) {
      setInspectItem(item);
      return;
    }

    const success = await demoStudyMaterialStorage.downloadFile(item);
    if (success) {
      setActionNotification({
        type: "success",
        message: `Downloaded "${item.fileName}" (${item.size}) successfully.`,
      });
    } else {
      setActionNotification({
        type: "error",
        message: `Download failed for "${item.title}". File reference may have expired in this session.`,
      });
    }
    setTimeout(() => setActionNotification(null), 5000);
  };

  // View / Open File in Browser
  const handleViewFile = (item: StudyMaterialItem) => {
    if (item.fileUrl) {
      window.open(item.fileUrl, "_blank", "noopener,noreferrer");
    } else {
      setInspectItem(item);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      {/* Header Card */}
      <Card padding="md">
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
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "4px" }}>
              <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 700, margin: 0 }}>
                {role === "parent"
                  ? "Ward's Study Materials & Resource Repository"
                  : role === "student"
                  ? "My Study Materials & Courseware"
                  : "Curriculum & Study Resource Bank"}
              </h2>
              <Badge variant="accent" size="sm">
                {visibleMaterials.length} Resources
              </Badge>
            </div>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", margin: 0 }}>
              {role === "student" || role === "parent"
                ? "Download lecture handouts, syllabus formula sheets, and practice sets for enrolled subjects."
                : "Manage and distribute official syllabus notes, PDF worksheets, slides, and chapter problem sets."}
            </p>
          </div>

          {(role === "teacher" || role === "academy-admin") && (
            <Button
              variant="accent"
              size="sm"
              onClick={() => {
                setIsUploadModalOpen(true);
                setSelectedFile(null);
                setFileError(null);
              }}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <span>+</span>
              <span>Upload Study Material</span>
            </Button>
          )}
        </div>
      </Card>

      {/* Action Notification Banner */}
      {actionNotification && (
        <div
          style={{
            backgroundColor:
              actionNotification.type === "success"
                ? "rgba(52, 199, 89, 0.08)"
                : actionNotification.type === "warning"
                ? "rgba(255, 149, 0, 0.08)"
                : "rgba(255, 59, 48, 0.08)",
            border: `1px solid ${
              actionNotification.type === "success"
                ? "rgba(52, 199, 89, 0.25)"
                : actionNotification.type === "warning"
                ? "rgba(255, 149, 0, 0.25)"
                : "rgba(255, 59, 48, 0.25)"
            }`,
            borderRadius: "var(--radius-md)",
            padding: "10px 14px",
            fontSize: "var(--text-xs)",
            color: "var(--color-primary)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "var(--space-2)",
          }}
          role="status"
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  color:
                    actionNotification.type === "success"
                      ? "var(--color-success)"
                      : actionNotification.type === "warning"
                      ? "var(--color-warning)"
                      : "#FF3B30",
                  fontWeight: 700,
                }}
              >
                {actionNotification.type === "success" ? "✓" : "ℹ"}
              </span>
              <strong style={{ fontWeight: 600 }}>{actionNotification.message}</strong>
            </div>
            {actionNotification.note && (
              <p style={{ margin: "2px 0 0 18px", fontSize: "11px", color: "var(--color-neutral-dark)" }}>
                {actionNotification.note}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setActionNotification(null)}
            style={{
              fontSize: "12px",
              color: "var(--color-neutral-dark)",
              cursor: "pointer",
              background: "none",
              border: "none",
              padding: "2px",
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Unlinked Student / Parent Guard */}
      {(role === "student" || role === "parent") && !currentStudentId && (
        <Card padding="lg" style={{ textAlign: "center", color: "var(--color-neutral-dark)" }}>
          <div style={{ fontSize: "28px", marginBottom: "var(--space-2)" }}>🔒</div>
          <h3 style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-primary)", margin: "0 0 4px" }}>
            No Student Account Associated
          </h3>
          <p style={{ fontSize: "var(--text-xs)", margin: 0 }}>
            There is currently no student record linked with this account to display enrolled study materials.
          </p>
        </Card>
      )}

      {/* Search and Filters Bar */}
      {((role !== "student" && role !== "parent") || currentStudentId) && (
        <div
          style={{
            display: "flex",
            gap: "var(--space-3)",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", flex: "1 1 300px", alignItems: "center" }}>
            <input
              type="text"
              placeholder="Search resources by title, chapter, or file..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: "1 1 200px",
                padding: "8px 12px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-surface)",
                fontSize: "var(--text-xs)",
              }}
            />

            {/* Subject Filter */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", fontWeight: 500 }}>
                Subject:
              </span>
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                style={{
                  fontSize: "var(--text-xs)",
                  padding: "7px 10px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-surface)",
                }}
              >
                <option value="all">All Subjects</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Accountancy">Accountancy</option>
                <option value="Economics">Economics</option>
                <option value="Computer Applications">Computer Applications</option>
              </select>
            </div>

            {/* Type Filter */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", fontWeight: 500 }}>
                Type:
              </span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                style={{
                  fontSize: "var(--text-xs)",
                  padding: "7px 10px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-surface)",
                }}
              >
                <option value="all">All Types</option>
                <option value="PDF Notes">PDF Notes</option>
                <option value="Formula Sheet">Formula Sheets</option>
                <option value="Worksheet">Worksheets</option>
                <option value="Practice Paper">Practice Papers</option>
                <option value="Assignment">Assignments</option>
                <option value="Handout">Handouts</option>
              </select>
            </div>

            {/* Status Filter (Teachers and Admin) */}
            {(role === "teacher" || role === "academy-admin") && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", fontWeight: 500 }}>
                  Status:
                </span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{
                    fontSize: "var(--text-xs)",
                    padding: "7px 10px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-border)",
                    backgroundColor: "var(--color-surface)",
                  }}
                >
                  <option value="all">All (Published &amp; Drafts)</option>
                  <option value="published">Published Only</option>
                  <option value="draft">Drafts Only</option>
                </select>
              </div>
            )}
          </div>

          {(filterSubject !== "all" || filterType !== "all" || filterStatus !== "all" || searchQuery) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterSubject("all");
                setFilterType("all");
                setFilterStatus("all");
                setSearchQuery("");
              }}
              style={{ fontSize: "11px", padding: "4px 8px", height: "28px" }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}

      {/* Materials Grid */}
      {((role !== "student" && role !== "parent") || currentStudentId) && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "var(--space-4)",
          }}
        >
          {visibleMaterials.length === 0 ? (
            <div
              style={{
                gridColumn: "1 / -1",
                padding: "var(--space-10) var(--space-4)",
                textAlign: "center",
                backgroundColor: "var(--color-surface)",
                borderRadius: "var(--radius-lg)",
                border: "1px dashed var(--color-border)",
                color: "var(--color-neutral-dark)",
              }}
            >
              <div style={{ fontSize: "28px", marginBottom: "var(--space-2)" }}>📚</div>
              <h4 style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-primary)", margin: "0 0 4px" }}>
                No study materials found
              </h4>
              <p style={{ fontSize: "var(--text-xs)", margin: "0 0 var(--space-3)" }}>
                {role === "student" || role === "parent"
                  ? "There are currently no published study materials for your enrolled subjects and batches."
                  : "No resources match the selected criteria."}
              </p>
              {(filterSubject !== "all" || filterType !== "all" || searchQuery) && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setFilterSubject("all");
                    setFilterType("all");
                    setFilterStatus("all");
                    setSearchQuery("");
                  }}
                >
                  Reset Filters
                </Button>
              )}
            </div>
          ) : (
            visibleMaterials.map((mat) => {
              const isDraft = mat.status === "draft";
              const hasFile = Boolean(mat.hasPhysicalFile && mat.fileUrl);

              return (
                <article
                  key={mat.id}
                  style={{
                    backgroundColor: "var(--color-surface)",
                    borderRadius: "var(--radius-lg)",
                    border: isDraft
                      ? "1px dashed rgba(255, 149, 0, 0.5)"
                      : "1px solid var(--color-border)",
                    padding: "var(--space-4)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "var(--space-3)",
                    boxShadow: "var(--shadow-sm)",
                    position: "relative",
                  }}
                >
                  <div>
                    {/* Top Badges Row */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "var(--space-2)",
                        flexWrap: "wrap",
                        gap: "6px",
                      }}
                    >
                      <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                        <Badge variant="neutral" size="sm">
                          {mat.type}
                        </Badge>
                        {isDraft && (
                          <Badge variant="warning" size="sm">
                            Draft (Unpublished)
                          </Badge>
                        )}
                        {hasFile ? (
                          <Badge variant="success" size="sm">
                            {mat.fileName?.split(".").pop()?.toUpperCase() || "FILE"} &bull; {mat.size}
                          </Badge>
                        ) : (
                          <Badge variant="default" size="sm">
                            Catalog Entry &bull; {mat.size}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <h3
                      style={{
                        fontSize: "var(--text-sm)",
                        fontWeight: 600,
                        color: "var(--color-primary)",
                        lineHeight: 1.4,
                        margin: "0 0 4px",
                        overflowWrap: "break-word",
                        wordBreak: "break-word",
                      }}
                    >
                      {mat.title}
                    </h3>

                    {/* Subject & Class Details */}
                    <div style={{ fontSize: "11px", color: "var(--color-neutral-dark)", marginBottom: "6px" }}>
                      <strong>{mat.subject}</strong> &bull; {mat.classGrade}
                      {mat.batchName && mat.batchName !== "All Batches" && (
                        <span> &bull; <em style={{ fontStyle: "normal", color: "var(--color-accent)" }}>{mat.batchName}</em></span>
                      )}
                    </div>

                    {/* Description excerpt */}
                    {mat.description && (
                      <p
                        style={{
                          fontSize: "11px",
                          color: "var(--color-neutral-dark)",
                          margin: "0 0 8px",
                          lineHeight: 1.4,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {mat.description}
                      </p>
                    )}
                  </div>

                  {/* Card Footer: Metadata and Actions */}
                  <div
                    style={{
                      borderTop: "1px solid var(--color-border-subtle)",
                      paddingTop: "var(--space-3)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "var(--space-2)",
                    }}
                  >
                    <span style={{ fontSize: "10px", color: "var(--color-neutral-dark)" }}>
                      By {mat.uploadedBy} &bull; {mat.date}
                    </span>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {hasFile ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleViewFile(mat)}
                            aria-label={`Open ${mat.title} in new tab`}
                            style={{
                              fontSize: "11px",
                              fontWeight: 600,
                              color: "var(--color-primary)",
                              backgroundColor: "var(--color-surface-muted)",
                              border: "1px solid var(--color-border)",
                              cursor: "pointer",
                              padding: "4px 8px",
                              borderRadius: "var(--radius-sm)",
                            }}
                          >
                            Open ↗
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownload(mat)}
                            aria-label={`Download ${mat.fileName}`}
                            style={{
                              fontSize: "11px",
                              fontWeight: 600,
                              color: "#FFFFFF",
                              backgroundColor: "var(--color-accent)",
                              border: "none",
                              cursor: "pointer",
                              padding: "4px 10px",
                              borderRadius: "var(--radius-sm)",
                            }}
                          >
                            Download ↓
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setInspectItem(mat)}
                          aria-label={`Inspect overview for ${mat.title}`}
                          style={{
                            fontSize: "11px",
                            fontWeight: 500,
                            color: "var(--color-neutral-dark)",
                            backgroundColor: "var(--color-surface-muted)",
                            border: "1px solid var(--color-border-subtle)",
                            cursor: "pointer",
                            padding: "4px 8px",
                            borderRadius: "var(--radius-sm)",
                          }}
                        >
                          Overview ℹ
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      )}

      {/* INSPECT / CATALOG OVERVIEW MODAL */}
      {inspectItem && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setInspectItem(null);
          }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.45)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "var(--space-4)",
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="material-preview-modal-title"
        >
          <div
            style={{
              backgroundColor: "var(--color-surface)",
              borderRadius: "var(--radius-lg)",
              maxWidth: "560px",
              width: "100%",
              padding: "var(--space-6)",
              boxShadow: "var(--shadow-lg)",
              border: "1px solid var(--color-border)",
              maxHeight: "85vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "var(--space-3)",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                  <Badge variant="accent" size="sm">
                    {inspectItem.type}
                  </Badge>
                  <Badge variant={inspectItem.hasPhysicalFile ? "success" : "neutral"} size="sm">
                    {inspectItem.hasPhysicalFile ? "Uploaded File" : "Catalog Entry"}
                  </Badge>
                </div>
                <h3
                  id="material-preview-modal-title"
                  style={{ fontSize: "var(--text-base)", fontWeight: 700, margin: 0, color: "var(--color-primary)" }}
                >
                  {inspectItem.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectItem(null)}
                aria-label="Close dialog"
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "18px",
                  color: "var(--color-neutral-dark)",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                backgroundColor: "var(--color-surface-muted)",
                padding: "10px 14px",
                borderRadius: "var(--radius-md)",
                fontSize: "var(--text-xs)",
                color: "var(--color-neutral-dark)",
                marginBottom: "var(--space-4)",
                lineHeight: 1.5,
              }}
            >
              <div>
                <strong>Subject:</strong> {inspectItem.subject} &bull; <strong>Class:</strong> {inspectItem.classGrade}
              </div>
              <div>
                <strong>Faculty:</strong> {inspectItem.uploadedBy} &bull; <strong>Catalog Date:</strong> {inspectItem.date}
              </div>
              {inspectItem.batchName && (
                <div>
                  <strong>Target Batch:</strong> {inspectItem.batchName}
                </div>
              )}
            </div>

            {inspectItem.description && (
              <div style={{ marginBottom: "var(--space-4)" }}>
                <h4 style={{ fontSize: "var(--text-xs)", fontWeight: 700, margin: "0 0 4px" }}>
                  Resource Description &amp; Syllabus Coverage:
                </h4>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-primary)", lineHeight: 1.5, margin: 0 }}>
                  {inspectItem.description}
                </p>
              </div>
            )}

            {inspectItem.content && (
              <div style={{ marginBottom: "var(--space-4)" }}>
                <h4 style={{ fontSize: "var(--text-xs)", fontWeight: 700, margin: "0 0 4px" }}>
                  Syllabus Excerpt &amp; Formula Guide:
                </h4>
                <pre
                  style={{
                    backgroundColor: "var(--color-surface-muted)",
                    padding: "10px 12px",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "11px",
                    fontFamily: "var(--font-mono)",
                    color: "var(--color-primary)",
                    whiteSpace: "pre-wrap",
                    maxHeight: "220px",
                    overflowY: "auto",
                    lineHeight: 1.5,
                  }}
                >
                  {inspectItem.content}
                </pre>
              </div>
            )}

            {!inspectItem.hasPhysicalFile && (
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border-subtle)",
                  backgroundColor: "rgba(0, 122, 255, 0.04)",
                  fontSize: "11px",
                  color: "var(--color-primary)",
                  marginBottom: "var(--space-4)",
                }}
              >
                ℹ <strong>Catalog Notice:</strong> This resource is an administrative index reference.
                Physical study booklets, printed exercise sheets, and lecture notes are distributed in classroom batches.
                No downloadable digital file has been attached to this catalog entry.
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)" }}>
              {inspectItem.hasPhysicalFile && inspectItem.fileUrl && (
                <Button
                  variant="accent"
                  size="sm"
                  onClick={() => handleDownload(inspectItem)}
                >
                  Download {inspectItem.fileName} ↓
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={() => setInspectItem(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TEACHER / ADMIN FILE UPLOAD MODAL */}
      {isUploadModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !isUploading) {
              setIsUploadModalOpen(false);
            }
          }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.45)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "var(--space-4)",
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="upload-material-modal-title"
        >
          <div
            style={{
              backgroundColor: "var(--color-surface)",
              borderRadius: "var(--radius-lg)",
              maxWidth: "540px",
              width: "100%",
              padding: "var(--space-6)",
              boxShadow: "var(--shadow-lg)",
              border: "1px solid var(--color-border)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            {/* Modal Title */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "var(--space-4)",
              }}
            >
              <div>
                <h3
                  id="upload-material-modal-title"
                  style={{ fontSize: "var(--text-base)", fontWeight: 700, margin: "0 0 2px" }}
                >
                  Upload Study Material
                </h3>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", margin: 0 }}>
                  Upload syllabus PDFs, lecture slides, worksheets, or chapter formula sheets.
                </p>
              </div>
              <button
                type="button"
                disabled={isUploading}
                onClick={() => setIsUploadModalOpen(false)}
                aria-label="Close upload modal"
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "18px",
                  color: "var(--color-neutral-dark)",
                  cursor: isUploading ? "not-allowed" : "pointer",
                  padding: "4px",
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit}>
              {/* File Picker Zone */}
              <div style={{ marginBottom: "var(--space-4)" }}>
                <label
                  style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "6px" }}
                >
                  Select Document or Image File *
                </label>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: fileError
                      ? "2px dashed #FF3B30"
                      : selectedFile
                      ? "2px solid var(--color-accent)"
                      : "2px dashed var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    padding: "var(--space-4)",
                    textAlign: "center",
                    cursor: "pointer",
                    backgroundColor: selectedFile
                      ? "rgba(0, 122, 255, 0.03)"
                      : "var(--color-surface-muted)",
                    transition: "border-color var(--transition-fast)",
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.pptx,.jpg,.jpeg,.png,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,image/jpeg,image/png"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />

                  {selectedFile ? (
                    <div>
                      <div style={{ fontSize: "24px", marginBottom: "4px" }}>📄</div>
                      <div style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-primary)" }}>
                        {selectedFile.name}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--color-neutral-dark)", marginTop: "2px" }}>
                        Size: {formatFileSize(selectedFile.size)} &bull; Format:{" "}
                        {selectedFile.name.split(".").pop()?.toUpperCase()}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                          setFileError(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        style={{
                          marginTop: "8px",
                          fontSize: "11px",
                          color: "#FF3B30",
                          backgroundColor: "transparent",
                          border: "none",
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                      >
                        ✕ Remove File
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: "24px", marginBottom: "4px" }}>📎</div>
                      <div style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-primary)" }}>
                        Click to browse file from your device
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--color-neutral-dark)", marginTop: "4px" }}>
                        Supported formats: <strong>{SUPPORTED_FILE_EXTENSIONS.join(", ").toUpperCase()}</strong> (Max {MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB)
                      </div>
                    </div>
                  )}
                </div>

                {fileError && (
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#FF3B30",
                      marginTop: "4px",
                      fontWeight: 500,
                    }}
                  >
                    ⚠ {fileError}
                  </div>
                )}
              </div>

              {/* Title Input */}
              <div style={{ marginBottom: "var(--space-3)" }}>
                <label
                  htmlFor="material-title-input"
                  style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "4px" }}
                >
                  Resource Title *
                </label>
                <input
                  id="material-title-input"
                  type="text"
                  required
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder="e.g. Class X Quadratic Equations High-Yield Practice Sheet"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-border)",
                    fontSize: "var(--text-xs)",
                    backgroundColor: "var(--color-surface)",
                  }}
                />
              </div>

              {/* Grid 1: Subject & Target Class */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "var(--space-3)",
                  marginBottom: "var(--space-3)",
                }}
              >
                <div>
                  <label
                    htmlFor="material-subject-input"
                    style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "4px" }}
                  >
                    Subject
                  </label>
                  <select
                    id="material-subject-input"
                    value={subjectInput}
                    onChange={(e) => setSubjectInput(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border)",
                      fontSize: "var(--text-xs)",
                      backgroundColor: "var(--color-surface)",
                    }}
                  >
                    {availableUploadSubjects.map((subj) => (
                      <option key={subj} value={subj}>
                        {subj}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="material-class-input"
                    style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "4px" }}
                  >
                    Target Class / Grade
                  </label>
                  <select
                    id="material-class-input"
                    value={classGradeInput}
                    onChange={(e) => setClassGradeInput(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border)",
                      fontSize: "var(--text-xs)",
                      backgroundColor: "var(--color-surface)",
                    }}
                  >
                    <option value="Class IX">Class IX</option>
                    <option value="Class X">Class X</option>
                    <option value="Class XI">Class XI</option>
                    <option value="Class XII">Class XII</option>
                  </select>
                </div>
              </div>

              {/* Grid 2: Applicable Batch & Resource Type */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "var(--space-3)",
                  marginBottom: "var(--space-3)",
                }}
              >
                <div>
                  <label
                    htmlFor="material-batch-input"
                    style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "4px" }}
                  >
                    Applicable Batch
                  </label>
                  <select
                    id="material-batch-input"
                    value={batchInput}
                    onChange={(e) => setBatchInput(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border)",
                      fontSize: "var(--text-xs)",
                      backgroundColor: "var(--color-surface)",
                    }}
                  >
                    <option value="All Batches in Class">All Batches in Class</option>
                    {availableBatchesForClass.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="material-type-input"
                    style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "4px" }}
                  >
                    Resource Type
                  </label>
                  <select
                    id="material-type-input"
                    value={typeInput}
                    onChange={(e) => setTypeInput(e.target.value as StudyMaterialType)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border)",
                      fontSize: "var(--text-xs)",
                      backgroundColor: "var(--color-surface)",
                    }}
                  >
                    <option value="PDF Notes">PDF Notes</option>
                    <option value="Formula Sheet">Formula Sheet</option>
                    <option value="Worksheet">Worksheet</option>
                    <option value="Practice Paper">Practice Paper</option>
                    <option value="Assignment">Assignment</option>
                    <option value="Handout">Handout</option>
                  </select>
                </div>
              </div>

              {/* Publication Status Selector */}
              <div style={{ marginBottom: "var(--space-3)" }}>
                <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "6px" }}>
                  Publication Status
                </label>
                <div style={{ display: "flex", gap: "var(--space-3)" }}>
                  <label
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "var(--text-xs)",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="material-status"
                      value="published"
                      checked={statusInput === "published"}
                      onChange={() => setStatusInput("published")}
                    />
                    <span>
                      🟢 <strong>Publish Now</strong> (Visible to enrolled students &amp; parents)
                    </span>
                  </label>

                  <label
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "var(--text-xs)",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="material-status"
                      value="draft"
                      checked={statusInput === "draft"}
                      onChange={() => setStatusInput("draft")}
                    />
                    <span>
                      🟡 <strong>Save as Draft</strong> (Hidden from students)
                    </span>
                  </label>
                </div>
              </div>

              {/* Description Input (Optional) */}
              <div style={{ marginBottom: "var(--space-4)" }}>
                <label
                  htmlFor="material-desc-input"
                  style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "4px" }}
                >
                  Chapter Notes / Instructions (Optional):
                </label>
                <textarea
                  id="material-desc-input"
                  rows={3}
                  value={descriptionInput}
                  onChange={(e) => setDescriptionInput(e.target.value)}
                  placeholder="Outline topics covered, homework instructions, or board syllabus references..."
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-border)",
                    fontSize: "var(--text-xs)",
                    backgroundColor: "var(--color-surface)",
                    color: "var(--color-primary)",
                    lineHeight: 1.4,
                  }}
                />
              </div>

              {/* Upload Notice */}
              <div
                style={{
                  backgroundColor: "rgba(0, 122, 255, 0.05)",
                  border: "1px solid rgba(0, 122, 255, 0.2)",
                  borderRadius: "var(--radius-sm)",
                  padding: "8px 12px",
                  fontSize: "11px",
                  color: "var(--color-primary)",
                  marginBottom: "var(--space-4)",
                }}
              >
                ℹ <strong>Coaching Academy Storage Note:</strong> Uploaded documents are stored in client demo session memory.
                Students and parents can download and open this exact file during this session.
              </div>

              {/* Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)" }}>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={isUploading}
                  onClick={() => setIsUploadModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="accent"
                  size="sm"
                  disabled={isUploading}
                >
                  {isUploading ? "Uploading File..." : statusInput === "published" ? "Publish to Repository" : "Save as Draft"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
