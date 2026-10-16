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
  AuditActionType,
  AuditCategory,
} from "@/types";
import { recordAuditEvent } from "@/lib/auditService";
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
import {
  DEFAULT_CLASSES,
  DEFAULT_SUBJECTS,
  AcademicClass,
  AcademicSubject,
} from "@/data/academicMasterData";
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
  DEFAULT_STUDY_MATERIAL_TYPES,
  isMaterialVisibleToRole,
  canManageMaterial,
  persistBinaryFile,
} from "@/lib/studyMaterialStorage";

interface StudyMaterialsModuleProps {
  role: UserRole;
  currentTeacherId?: string;
  currentStudentId?: string;
}

// Dependent field cascading helpers
function getValidSubjectsForTeacher(
  teacher: TeacherProfile | null,
  academicSubjects: AcademicSubject[],
  isAdmin: boolean
): string[] {
  if (isAdmin && !teacher) {
    return academicSubjects.filter((s) => s.isActive).map((s) => s.name);
  }
  if (teacher && teacher.assignedSubjects && teacher.assignedSubjects.length > 0) {
    return teacher.assignedSubjects;
  }
  return academicSubjects.filter((s) => s.isActive).map((s) => s.name);
}

function getValidClassesForSubject(
  subjectName: string,
  academicSubjects: AcademicSubject[],
  academicClasses: AcademicClass[]
): string[] {
  const activeClasses = academicClasses.filter((c) => c.isActive);
  const subjRecord = academicSubjects.find(
    (s) => s.name.toLowerCase() === subjectName.toLowerCase()
  );
  if (subjRecord && subjRecord.applicableClassIds && subjRecord.applicableClassIds.length > 0) {
    const matching = activeClasses.filter((c) => subjRecord.applicableClassIds.includes(c.id));
    if (matching.length > 0) {
      return matching.map((c) => c.name);
    }
  }
  return activeClasses.map((c) => c.name);
}

function getValidBatchesForClassAndSubject(
  classGrade: string,
  subjectName: string,
  batches: BatchDefinition[]
): BatchDefinition[] {
  return batches.filter(
    (b) =>
      b.classGrade === classGrade &&
      (b.subject.toLowerCase() === subjectName.toLowerCase() ||
        b.subject.toLowerCase().includes(subjectName.toLowerCase()))
  );
}

function createAuditLog(
  action: string,
  target: string,
  details: string,
  performedBy: string,
  type: AuditCategory = "enrollment"
): AuditLogEntry {
  let actionType: AuditActionType = "UPDATE";
  if (action.includes("Upload") || action.includes("Create") || action.includes("Add")) {
    actionType = "CREATE";
  } else if (action.includes("Delete") || action.includes("Remove")) {
    actionType = "DELETE";
  } else if (action.includes("Publish")) {
    actionType = "APPROVE";
  } else if (action.includes("Unpublish")) {
    actionType = "CANCEL";
  }

  return recordAuditEvent({
    action,
    actionType,
    target,
    details,
    performedBy,
    actorRole: performedBy.toLowerCase().includes("admin") ? "academy-admin" : "teacher",
    entityType: "study-material",
    type,
    outcome: "SUCCESS",
  });
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
  const [academicClasses] = useDemoStorage<AcademicClass[]>(
    DEMO_STORAGE_KEYS.ACADEMIC_CLASSES,
    DEFAULT_CLASSES
  );
  const [academicSubjects] = useDemoStorage<AcademicSubject[]>(
    DEMO_STORAGE_KEYS.ACADEMIC_SUBJECTS,
    DEFAULT_SUBJECTS
  );
  const [resourceTypes, setResourceTypes] = useDemoStorage<string[]>(
    DEMO_STORAGE_KEYS.STUDY_MATERIAL_TYPES,
    DEFAULT_STUDY_MATERIAL_TYPES
  );
  const [, setAuditLogs] = useDemoStorage<AuditLogEntry[]>(
    DEMO_STORAGE_KEYS.AUDIT_LOGS,
    SAMPLE_AUDIT_LOGS
  );

  // Active User Profiles
  const currentTeacher = useMemo(() => {
    return faculty.find((t) => t.id === currentTeacherId) || faculty[0] || null;
  }, [faculty, currentTeacherId]);

  const currentStudent = useMemo(() => {
    if (!currentStudentId) return null;
    return students.find((s) => s.id === currentStudentId) || null;
  }, [students, currentStudentId]);

  const studentEnrollments = useMemo(() => {
    if (!currentStudentId) return [];
    return enrollments.filter(
      (e) => e.studentId === currentStudentId && e.status === "active"
    );
  }, [enrollments, currentStudentId]);

  // Filter & Search State
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isTypeSettingsOpen, setIsTypeSettingsOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [typeSettingsError, setTypeSettingsError] = useState<string | null>(null);

  const [editingItem, setEditingItem] = useState<StudyMaterialItem | null>(null);
  const [inspectItem, setInspectItem] = useState<StudyMaterialItem | null>(null);

  // Upload Form State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [uploadTeacherId, setUploadTeacherId] = useState<string>(
    role === "teacher" ? currentTeacherId : "admin"
  );
  const [titleInput, setTitleInput] = useState("");
  const [subjectInput, setSubjectInput] = useState("");
  const [classGradeInput, setClassGradeInput] = useState("");
  const [batchInput, setBatchInput] = useState("All Batches in this Class");
  const [typeInput, setTypeInput] = useState<StudyMaterialType>("PDF Notes");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [statusInput, setStatusInput] = useState<MaterialPublicationStatus>("published");

  // Edit Form State
  const [editTitle, setEditTitle] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editClassGrade, setEditClassGrade] = useState("");
  const [editBatch, setEditBatch] = useState("All Batches in this Class");
  const [editType, setEditType] = useState<StudyMaterialType>("PDF Notes");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<MaterialPublicationStatus>("published");
  const [editSelectedFile, setEditSelectedFile] = useState<File | null>(null);
  const [editFileError, setEditFileError] = useState<string | null>(null);

  // Binary file cache hydration across page reloads
  const [activeBinaryIds, setActiveBinaryIds] = useState<string[]>(() =>
    demoStudyMaterialStorage.getAvailableFileIds()
  );

  useEffect(() => {
    let isMounted = true;
    demoStudyMaterialStorage.hydrateStoredFiles().then((ids) => {
      if (isMounted) {
        setActiveBinaryIds(ids);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Action Notification Banner
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
        setIsTypeSettingsOpen(false);
        setEditingItem(null);
        setInspectItem(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Upload: Compute Available Options & Derived Effective Selections (Zero setState in Effect)
  const uploadSelectedTeacher = useMemo(() => {
    if (role === "teacher") return currentTeacher;
    if (uploadTeacherId === "admin") return null;
    return faculty.find((f) => f.id === uploadTeacherId) || null;
  }, [role, currentTeacher, uploadTeacherId, faculty]);

  const uploadAvailableSubjects = useMemo(() => {
    return getValidSubjectsForTeacher(
      uploadSelectedTeacher,
      academicSubjects,
      role === "academy-admin" && uploadTeacherId === "admin"
    );
  }, [uploadSelectedTeacher, academicSubjects, role, uploadTeacherId]);

  const effectiveSubject = useMemo(() => {
    if (uploadAvailableSubjects.includes(subjectInput)) {
      return subjectInput;
    }
    return uploadAvailableSubjects[0] || "";
  }, [uploadAvailableSubjects, subjectInput]);

  const uploadAvailableClasses = useMemo(() => {
    return getValidClassesForSubject(effectiveSubject, academicSubjects, academicClasses);
  }, [effectiveSubject, academicSubjects, academicClasses]);

  const effectiveClass = useMemo(() => {
    if (uploadAvailableClasses.includes(classGradeInput)) {
      return classGradeInput;
    }
    return uploadAvailableClasses[0] || "";
  }, [uploadAvailableClasses, classGradeInput]);

  const uploadAvailableBatches = useMemo(() => {
    return getValidBatchesForClassAndSubject(effectiveClass, effectiveSubject, batches);
  }, [effectiveClass, effectiveSubject, batches]);

  const effectiveBatch = useMemo(() => {
    if (
      batchInput === "All Batches in this Class" ||
      batchInput === "All Batches in Class"
    ) {
      return "All Batches in this Class";
    }
    if (uploadAvailableBatches.some((b) => b.name === batchInput)) {
      return batchInput;
    }
    return "All Batches in this Class";
  }, [uploadAvailableBatches, batchInput]);

  // Edit: Compute Available Options with Cascading Dependencies
  const editSelectedTeacher = useMemo(() => {
    if (!editingItem) return null;
    return faculty.find((f) => f.id === editingItem.teacherId) || null;
  }, [editingItem, faculty]);

  const editAvailableSubjects = useMemo(() => {
    return getValidSubjectsForTeacher(
      editSelectedTeacher,
      academicSubjects,
      role === "academy-admin"
    );
  }, [editSelectedTeacher, academicSubjects, role]);

  const editAvailableClasses = useMemo(() => {
    return getValidClassesForSubject(editSubject, academicSubjects, academicClasses);
  }, [editSubject, academicSubjects, academicClasses]);

  const editAvailableBatches = useMemo(() => {
    return getValidBatchesForClassAndSubject(editClassGrade, editSubject, batches);
  }, [editClassGrade, editSubject, batches]);

  // Event handlers for cascading changes
  const handleEditSubjectChange = (newSubject: string) => {
    setEditSubject(newSubject);
    const validClasses = getValidClassesForSubject(newSubject, academicSubjects, academicClasses);
    const nextClass = validClasses.includes(editClassGrade) ? editClassGrade : validClasses[0] || "";
    setEditClassGrade(nextClass);

    const validBatches = getValidBatchesForClassAndSubject(nextClass, newSubject, batches);
    if (
      editBatch !== "All Batches in this Class" &&
      editBatch !== "All Batches in Class" &&
      !validBatches.some((b) => b.name === editBatch)
    ) {
      setEditBatch("All Batches in this Class");
    }
  };

  const handleEditClassChange = (newClass: string) => {
    setEditClassGrade(newClass);
    const validBatches = getValidBatchesForClassAndSubject(newClass, editSubject, batches);
    if (
      editBatch !== "All Batches in this Class" &&
      editBatch !== "All Batches in Class" &&
      !validBatches.some((b) => b.name === editBatch)
    ) {
      setEditBatch("All Batches in this Class");
    }
  };

  const handleUploadTeacherChange = (newTeacherId: string) => {
    setUploadTeacherId(newTeacherId);
    const tch = newTeacherId === "admin" ? null : faculty.find((f) => f.id === newTeacherId) || null;
    const validSubjs = getValidSubjectsForTeacher(
      tch,
      academicSubjects,
      role === "academy-admin" && newTeacherId === "admin"
    );
    const nextSubj = validSubjs.includes(subjectInput) ? subjectInput : validSubjs[0] || "";
    setSubjectInput(nextSubj);

    const validClasses = getValidClassesForSubject(nextSubj, academicSubjects, academicClasses);
    const nextClass = validClasses.includes(classGradeInput) ? classGradeInput : validClasses[0] || "";
    setClassGradeInput(nextClass);

    const validBatches = getValidBatchesForClassAndSubject(nextClass, nextSubj, batches);
    if (
      batchInput !== "All Batches in this Class" &&
      batchInput !== "All Batches in Class" &&
      !validBatches.some((b) => b.name === batchInput)
    ) {
      setBatchInput("All Batches in this Class");
    }
  };

  const handleUploadSubjectChange = (newSubject: string) => {
    setSubjectInput(newSubject);
    const validClasses = getValidClassesForSubject(newSubject, academicSubjects, academicClasses);
    const nextClass = validClasses.includes(classGradeInput) ? classGradeInput : validClasses[0] || "";
    setClassGradeInput(nextClass);

    const validBatches = getValidBatchesForClassAndSubject(nextClass, newSubject, batches);
    if (
      batchInput !== "All Batches in this Class" &&
      batchInput !== "All Batches in Class" &&
      !validBatches.some((b) => b.name === batchInput)
    ) {
      setBatchInput("All Batches in this Class");
    }
  };

  const handleUploadClassChange = (newClass: string) => {
    setClassGradeInput(newClass);
    const validBatches = getValidBatchesForClassAndSubject(newClass, effectiveSubject, batches);
    if (
      batchInput !== "All Batches in this Class" &&
      batchInput !== "All Batches in Class" &&
      !validBatches.some((b) => b.name === batchInput)
    ) {
      setBatchInput("All Batches in this Class");
    }
  };

  // Open Upload Modal with intelligent profile-based defaults
  const openUploadModal = () => {
    const defaultTeacherId = role === "teacher" ? currentTeacherId : "admin";
    setUploadTeacherId(defaultTeacherId);

    const tch =
      defaultTeacherId === "admin"
        ? null
        : faculty.find((f) => f.id === defaultTeacherId) || currentTeacher;
    const validSubjects = getValidSubjectsForTeacher(
      tch,
      academicSubjects,
      role === "academy-admin" && defaultTeacherId === "admin"
    );
    const chosenSubject = validSubjects[0] || "";
    setSubjectInput(chosenSubject);

    // Find classes applicable to this subject
    const validClasses = getValidClassesForSubject(chosenSubject, academicSubjects, academicClasses);

    // If teacher has assigned batches, find which class their batch belongs to (e.g. Class X for Azhar Sir)
    let defaultClass = validClasses[0] || "";
    if (tch && tch.batches && tch.batches.length > 0) {
      const teacherBatchDefs = batches.filter(
        (b) => b.teacherId === tch.id || tch.batches.includes(b.name)
      );
      const matchingClass = validClasses.find((cls) =>
        teacherBatchDefs.some((b) => b.classGrade === cls)
      );
      if (matchingClass) {
        defaultClass = matchingClass;
      }
    }
    setClassGradeInput(defaultClass);
    setBatchInput("All Batches in this Class");
    setTitleInput("");
    setDescriptionInput("");
    setStatusInput("published");
    setSelectedFile(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsUploadModalOpen(true);
  };

  // Open Edit Modal and Initialize Form
  const openEditModal = (item: StudyMaterialItem) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditSubject(item.subject);
    setEditClassGrade(item.classGrade);
    setEditBatch(item.batchName || "All Batches in this Class");
    setEditType(item.type);
    setEditDescription(item.description || "");
    setEditStatus(item.status || "published");
    setEditSelectedFile(null);
    setEditFileError(null);
  };

  // Save Edit Changes
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (!editTitle.trim()) {
      alert("Please provide a title for the study resource.");
      return;
    }

    let fileName = editingItem.fileName;
    let size = editingItem.size;
    let fileSizeBytes = editingItem.fileSizeBytes;
    let fileType = editingItem.fileType;
    let fileUrl = editingItem.fileUrl;
    let hasPhysicalFile = editingItem.hasPhysicalFile;

    if (editSelectedFile) {
      const validation = validateStudyMaterialFile(editSelectedFile);
      if (!validation.isValid) {
        setEditFileError(validation.error || "Invalid file format or size.");
        return;
      }
      if (typeof window !== "undefined" && typeof URL !== "undefined") {
        fileUrl = URL.createObjectURL(editSelectedFile);
        await persistBinaryFile(editingItem.id, editSelectedFile, editSelectedFile.name, editSelectedFile.type);
      }
      fileName = editSelectedFile.name;
      size = formatFileSize(editSelectedFile.size);
      fileSizeBytes = editSelectedFile.size;
      fileType = editSelectedFile.type || editSelectedFile.name.split(".").pop() || "application/octet-stream";
      hasPhysicalFile = true;
      setActiveBinaryIds(demoStudyMaterialStorage.getAvailableFileIds());
    }

    const updatedItem: StudyMaterialItem = {
      ...editingItem,
      title: editTitle.trim(),
      subject: editSubject,
      classGrade: editClassGrade,
      batchName: editBatch,
      type: editType,
      description: editDescription.trim() || undefined,
      status: editStatus,
      fileName,
      size,
      fileSizeBytes,
      fileType,
      fileUrl,
      hasPhysicalFile,
    };

    demoStudyMaterialStorage.saveMaterial(updatedItem);
    setMaterials((prev) =>
      prev.map((m) => (m.id === updatedItem.id ? updatedItem : m))
    );

    const actorName =
      role === "academy-admin"
        ? "Academy Administration"
        : currentTeacher?.name || "Teacher";

    setAuditLogs((prev) => [
      createAuditLog(
        "Study Material Updated",
        `${updatedItem.subject} (${updatedItem.classGrade})`,
        `Updated "${updatedItem.title}" — scope: ${updatedItem.batchName || "All Batches"}, status: ${updatedItem.status}.`,
        actorName,
        "enrollment"
      ),
      ...prev,
    ]);

    setEditingItem(null);
    setActionNotification({
      type: "success",
      message: `Updated "${updatedItem.title}" successfully.`,
    });
    setTimeout(() => setActionNotification(null), 5000);
  };

  // Explicit Publish Action
  const handlePublish = (item: StudyMaterialItem) => {
    const updated: StudyMaterialItem = { ...item, status: "published" };
    demoStudyMaterialStorage.saveMaterial(updated);
    setMaterials((prev) =>
      prev.map((m) => (m.id === item.id ? updated : m))
    );

    const actorName =
      role === "academy-admin"
        ? "Academy Administration"
        : currentTeacher?.name || "Teacher";

    setAuditLogs((prev) => [
      createAuditLog(
        "Study Material Published",
        `${item.subject} (${item.classGrade})`,
        `Published "${item.title}" — visible to enrolled students and parents.`,
        actorName,
        "enrollment"
      ),
      ...prev,
    ]);

    setActionNotification({
      type: "success",
      message: `Published "${item.title}" successfully. Visible to eligible students and parents.`,
    });
    setTimeout(() => setActionNotification(null), 5000);
  };

  // Explicit Unpublish Action (Move to Draft)
  const handleUnpublish = (item: StudyMaterialItem) => {
    const updated: StudyMaterialItem = { ...item, status: "draft" };
    demoStudyMaterialStorage.saveMaterial(updated);
    setMaterials((prev) =>
      prev.map((m) => (m.id === item.id ? updated : m))
    );

    const actorName =
      role === "academy-admin"
        ? "Academy Administration"
        : currentTeacher?.name || "Teacher";

    setAuditLogs((prev) => [
      createAuditLog(
        "Study Material Unpublished",
        `${item.subject} (${item.classGrade})`,
        `Moved "${item.title}" to draft — hidden from students and parents.`,
        actorName,
        "enrollment"
      ),
      ...prev,
    ]);

    setActionNotification({
      type: "warning",
      message: `Unpublished "${item.title}". Moved to draft and hidden from student/parent portals.`,
    });
    setTimeout(() => setActionNotification(null), 5000);
  };

  // Delete Study Material
  const handleDeleteMaterial = (item: StudyMaterialItem) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${item.title}"? This action removes the resource from student and parent views.`
    );
    if (!confirmed) return;

    demoStudyMaterialStorage.deleteMaterial(item.id);
    setActiveBinaryIds(demoStudyMaterialStorage.getAvailableFileIds());
    setMaterials((prev) => prev.filter((m) => m.id !== item.id));

    const actorName =
      role === "academy-admin"
        ? "Academy Administration"
        : currentTeacher?.name || "Teacher";

    setAuditLogs((prev) => [
      createAuditLog(
        "Study Material Deleted",
        `${item.subject} (${item.classGrade})`,
        `Deleted study material "${item.title}".`,
        actorName,
        "enrollment"
      ),
      ...prev,
    ]);

    setActionNotification({
      type: "warning",
      message: `Deleted "${item.title}" from academy repository.`,
    });
    setTimeout(() => setActionNotification(null), 5000);
  };

  // Configure Resource Types (Admin only)
  const handleAddResourceType = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTypeName.trim();
    if (!trimmed) {
      setTypeSettingsError("Please enter a valid resource type name.");
      return;
    }
    const exists = resourceTypes.some(
      (t) => t.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      setTypeSettingsError(`Resource type "${trimmed}" already exists.`);
      return;
    }

    setResourceTypes((prev) => [...prev, trimmed]);
    setNewTypeName("");
    setTypeSettingsError(null);

    setAuditLogs((prev) => [
      createAuditLog(
        "Resource Type Added",
        "Curriculum Repository",
        `Added new study material resource type: "${trimmed}".`,
        "Academy Administration",
        "system"
      ),
      ...prev,
    ]);

    setActionNotification({
      type: "success",
      message: `Added new resource type "${trimmed}".`,
    });
    setTimeout(() => setActionNotification(null), 4000);
  };

  const handleRemoveResourceType = (typeToRemove: string) => {
    if (resourceTypes.length <= 1) {
      alert("At least one resource type must remain configured.");
      return;
    }

    const inUseCount = materials.filter((m) => m.type === typeToRemove).length;
    if (inUseCount > 0) {
      const confirmRemove = window.confirm(
        `"${typeToRemove}" is currently assigned to ${inUseCount} resource(s). Are you sure you want to remove it from configured options?`
      );
      if (!confirmRemove) return;
    }

    setResourceTypes((prev) => prev.filter((t) => t !== typeToRemove));

    setAuditLogs((prev) => [
      createAuditLog(
        "Resource Type Removed",
        "Curriculum Repository",
        `Removed study material resource type: "${typeToRemove}".`,
        "Academy Administration",
        "system"
      ),
      ...prev,
    ]);

    setActionNotification({
      type: "warning",
      message: `Removed resource type "${typeToRemove}".`,
    });
    setTimeout(() => setActionNotification(null), 4000);
  };

  // Authoritative Filtered Materials
  const visibleMaterials = useMemo(() => {
    return materials.filter((m) => {
      // 1. Role-based scoping via shared authoritative selector
      const isVisible = isMaterialVisibleToRole(m, role, {
        student: currentStudent
          ? { id: currentStudent.id, classGrade: currentStudent.classGrade }
          : null,
        enrolledSubjects: studentEnrollments.map((e) => e.subjectName),
        enrolledBatches: studentEnrollments.map((e) => e.batchName),
        teacherId: currentTeacherId,
        teacherAssignedSubjects: currentTeacher?.assignedSubjects,
      });

      if (!isVisible) return false;

      // 2. Status filter (Admin & Teacher only)
      if (
        (role === "teacher" || role === "academy-admin") &&
        filterStatus !== "all" &&
        (m.status || "published") !== filterStatus
      ) {
        return false;
      }

      // 3. Subject filter
      if (filterSubject !== "all" && m.subject !== filterSubject) return false;

      // 4. Type filter
      if (filterType !== "all" && m.type !== filterType) return false;

      // 5. Search query
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

    const targetTeacher =
      role === "teacher"
        ? currentTeacher
        : uploadTeacherId !== "admin"
        ? faculty.find((f) => f.id === uploadTeacherId) || null
        : null;

    const teacherName =
      targetTeacher ? targetTeacher.name : "Academy Administration";
    const teacherId = targetTeacher ? targetTeacher.id : "tch-admin";

    const uploadResult = await demoStudyMaterialStorage.uploadFile({
      file: selectedFile,
      metadata: {
        title: titleInput.trim(),
        subject: effectiveSubject,
        classGrade: effectiveClass,
        batchName: effectiveBatch,
        type: typeInput,
        description: descriptionInput.trim(),
        teacherId,
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
    setActiveBinaryIds(demoStudyMaterialStorage.getAvailableFileIds());
    setMaterials((prev) => [newItem, ...prev.filter((m) => m.id !== newItem.id)]);

    // Record activity in shared audit logs
    setAuditLogs((prev) => [
      createAuditLog(
        "Study Material Uploaded",
        `${newItem.subject} (${newItem.classGrade})`,
        `Uploaded ${newItem.type}: "${newItem.title}" (${newItem.fileName}, ${newItem.size}) — ${newItem.status}.`,
        teacherName,
        "enrollment"
      ),
      ...prev,
    ]);

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
      note: "File is stored in browser storage (IndexedDB) and is directly downloadable and viewable across page reloads in this browser.",
    });
    setTimeout(() => setActionNotification(null), 6000);
  };

  // Download Handler (Only when physical file exists and binary bytes are available)
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
        type: "warning",
        message: `File binary for "${item.title}" is unavailable in browser storage. Record metadata is preserved.`,
        note: "Please re-upload the document to re-enable direct downloads in this browser session.",
      });
      setInspectItem(item);
    }
    setTimeout(() => setActionNotification(null), 5000);
  };

  // View / Open File in Browser
  const handleViewFile = async (item: StudyMaterialItem) => {
    let url = demoStudyMaterialStorage.getFileUrl(item.id);
    if (!url && item.hasPhysicalFile) {
      await demoStudyMaterialStorage.hydrateStoredFiles();
      url = demoStudyMaterialStorage.getFileUrl(item.id);
    }
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      setInspectItem(item);
    }
  };

  // Dynamic filter lists
  const filterSubjectOptions = useMemo(() => {
    const fromSubjects = academicSubjects.filter((s) => s.isActive).map((s) => s.name);
    const fromMaterials = materials.map((m) => m.subject);
    return Array.from(new Set([...fromSubjects, ...fromMaterials])).sort();
  }, [academicSubjects, materials]);

  const filterTypeOptions = useMemo(() => {
    const fromTypes = resourceTypes;
    const fromMaterials = materials.map((m) => m.type);
    return Array.from(new Set([...fromTypes, ...fromMaterials])).sort();
  }, [resourceTypes, materials]);

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
                : "Manage and distribute official syllabus notes, PDF worksheets, slides, and chapter problem sets with dynamic academic cascade."}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
            {role === "academy-admin" && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsTypeSettingsOpen(true);
                  setTypeSettingsError(null);
                  setNewTypeName("");
                }}
                style={{ fontSize: "var(--text-xs)" }}
              >
                ⚙ Manage Resource Types ({resourceTypes.length})
              </Button>
            )}

            {(role === "teacher" || role === "academy-admin") && (
              <Button
                variant="accent"
                size="sm"
                onClick={openUploadModal}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <span>+</span>
                <span>Upload Study Material</span>
              </Button>
            )}
          </div>
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

            {/* Subject Filter (Dynamic from Academy Subjects) */}
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
                {filterSubjectOptions.map((subj) => (
                  <option key={subj} value={subj}>
                    {subj}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter (Dynamic from Resource Types) */}
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
                {filterTypeOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
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
              const hasActiveBinary = Boolean(
                mat.hasPhysicalFile &&
                (activeBinaryIds.includes(mat.id) || demoStudyMaterialStorage.hasActiveSessionFile(mat.id))
              );
              const canManage = canManageMaterial(
                mat,
                role,
                currentTeacherId,
                currentTeacher?.assignedSubjects
              );

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
                        {isDraft ? (
                          <Badge variant="warning" size="sm">
                            Draft (Unpublished)
                          </Badge>
                        ) : (
                          <Badge variant="success" size="sm">
                            Published
                          </Badge>
                        )}
                        {hasActiveBinary ? (
                          <Badge variant="accent" size="sm">
                            {mat.fileName?.split(".").pop()?.toUpperCase() || "FILE"} &bull; {mat.size}
                          </Badge>
                        ) : mat.hasPhysicalFile ? (
                          <span title="File binary unavailable in this browser session. Re-upload during edit to enable direct download.">
                            <Badge variant="warning" size="sm">
                              {mat.fileName?.split(".").pop()?.toUpperCase() || "FILE"} &bull; File Unavailable
                            </Badge>
                          </span>
                        ) : (
                          <Badge variant="default" size="sm">
                            Catalog Entry &bull; {mat.size}
                          </Badge>
                        )}
                      </div>

                      {/* Management Quick Actions for Author/Admin */}
                      {canManage && (
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          {isDraft ? (
                            <button
                              type="button"
                              onClick={() => handlePublish(mat)}
                              title={`Publish "${mat.title}" to enrolled students and parents`}
                              style={{
                                fontSize: "11px",
                                padding: "2px 8px",
                                borderRadius: "var(--radius-sm)",
                                border: "1px solid rgba(52, 199, 89, 0.4)",
                                backgroundColor: "rgba(52, 199, 89, 0.12)",
                                color: "var(--color-success)",
                                cursor: "pointer",
                                fontWeight: 600,
                              }}
                            >
                              Publish 🟢
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleUnpublish(mat)}
                              title={`Unpublish "${mat.title}" (move to draft)`}
                              style={{
                                fontSize: "11px",
                                padding: "2px 8px",
                                borderRadius: "var(--radius-sm)",
                                border: "1px solid var(--color-border)",
                                backgroundColor: "var(--color-surface-muted)",
                                color: "var(--color-neutral-dark)",
                                cursor: "pointer",
                                fontWeight: 500,
                              }}
                            >
                              Unpublish
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openEditModal(mat)}
                            title="Edit study material properties"
                            style={{
                              fontSize: "11px",
                              padding: "2px 6px",
                              borderRadius: "var(--radius-sm)",
                              border: "1px solid var(--color-border)",
                              backgroundColor: "var(--color-surface-muted)",
                              color: "var(--color-primary)",
                              cursor: "pointer",
                            }}
                          >
                            Edit ✏
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMaterial(mat)}
                            title="Delete resource"
                            style={{
                              fontSize: "11px",
                              padding: "2px 6px",
                              borderRadius: "var(--radius-sm)",
                              border: "1px solid rgba(255, 59, 48, 0.3)",
                              backgroundColor: "rgba(255, 59, 48, 0.08)",
                              color: "#FF3B30",
                              cursor: "pointer",
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      )}
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
                      {mat.batchName &&
                        mat.batchName !== "All Batches" &&
                        mat.batchName !== "All Batches in Class" &&
                        mat.batchName !== "All Batches in this Class" && (
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
                      {hasActiveBinary ? (
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
                      ) : mat.hasPhysicalFile ? (
                        <button
                          type="button"
                          onClick={() => setInspectItem(mat)}
                          aria-label={`Inspect details for ${mat.title}`}
                          style={{
                            fontSize: "11px",
                            fontWeight: 500,
                            color: "var(--color-warning)",
                            backgroundColor: "rgba(255, 149, 0, 0.08)",
                            border: "1px solid rgba(255, 149, 0, 0.3)",
                            cursor: "pointer",
                            padding: "4px 8px",
                            borderRadius: "var(--radius-sm)",
                          }}
                        >
                          Unavailable ⚠
                        </button>
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

            {inspectItem.hasPhysicalFile && !demoStudyMaterialStorage.hasActiveSessionFile(inspectItem.id) && (
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border-subtle)",
                  backgroundColor: "rgba(255, 149, 0, 0.08)",
                  fontSize: "11px",
                  color: "var(--color-primary)",
                  marginBottom: "var(--space-4)",
                }}
              >
                ℹ <strong>Session Binary Notice:</strong> The file record and metadata for &quot;{inspectItem.fileName}&quot; ({inspectItem.size}) are preserved in your demo storage session. However, client-side in-memory browser blobs are cleared upon page reload. Re-upload during this active tab session to test live in-browser downloads.
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
              {inspectItem.hasPhysicalFile && demoStudyMaterialStorage.hasActiveSessionFile(inspectItem.id) && (
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
              maxWidth: "560px",
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

              {/* Admin-only: Author / Faculty Selector */}
              {role === "academy-admin" && (
                <div style={{ marginBottom: "var(--space-3)" }}>
                  <label
                    htmlFor="material-teacher-select"
                    style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "4px" }}
                  >
                    Authoring Faculty / Academy Dept *
                  </label>
                  <select
                    id="material-teacher-select"
                    value={uploadTeacherId}
                    onChange={(e) => handleUploadTeacherChange(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border)",
                      fontSize: "var(--text-xs)",
                      backgroundColor: "var(--color-surface)",
                    }}
                  >
                    <option value="admin">Academy Administration (All Active Subjects)</option>
                    {faculty
                      .filter((f) => f.status === "active")
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.assignedSubjects?.join(", ") || "No Subjects"})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Grid 1: Dynamic Subject & Dependent Target Class */}
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
                    Subject *
                  </label>
                  <select
                    id="material-subject-input"
                    value={effectiveSubject}
                    onChange={(e) => handleUploadSubjectChange(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border)",
                      fontSize: "var(--text-xs)",
                      backgroundColor: "var(--color-surface)",
                    }}
                  >
                    {uploadAvailableSubjects.map((subj) => (
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
                    Target Class / Grade *
                  </label>
                  <select
                    id="material-class-input"
                    value={effectiveClass}
                    onChange={(e) => handleUploadClassChange(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border)",
                      fontSize: "var(--text-xs)",
                      backgroundColor: "var(--color-surface)",
                    }}
                  >
                    {uploadAvailableClasses.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Grid 2: Dependent Batch & Configured Resource Type */}
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
                    Applicable Batch *
                  </label>
                  <select
                    id="material-batch-input"
                    value={effectiveBatch}
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
                    <option value="All Batches in this Class">All Batches in this Class</option>
                    {uploadAvailableBatches.map((b) => (
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
                    Resource Type *
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
                    {resourceTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Publication Status Selector */}
              <div style={{ marginBottom: "var(--space-3)" }}>
                <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "6px" }}>
                  Publication Status *
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
                      🟡 <strong>Save as Draft</strong> (Hidden from students &amp; parents)
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

      {/* EDIT STUDY MATERIAL MODAL */}
      {editingItem && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingItem(null);
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
          aria-labelledby="edit-material-modal-title"
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
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
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
                  id="edit-material-modal-title"
                  style={{ fontSize: "var(--text-base)", fontWeight: 700, margin: "0 0 2px" }}
                >
                  Edit Study Resource Properties
                </h3>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", margin: 0 }}>
                  Modify scope, publication status, or metadata. Original file ID and uploads are preserved.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                aria-label="Close edit modal"
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

            <form onSubmit={handleEditSubmit}>
              {/* Optional File Replacement */}
              <div style={{ marginBottom: "var(--space-3)" }}>
                <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "4px" }}>
                  Attached File
                </label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "6px 10px",
                    backgroundColor: "var(--color-surface-muted)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-border-subtle)",
                    fontSize: "11px",
                  }}
                >
                  <span style={{ color: "var(--color-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "340px" }}>
                    📄 {editSelectedFile ? editSelectedFile.name : editingItem.fileName || "No physical file attached (Catalog Entry)"}
                    {" "}({editSelectedFile ? formatFileSize(editSelectedFile.size) : editingItem.size || ""})
                  </span>
                  <label
                    style={{
                      color: "var(--color-accent)",
                      cursor: "pointer",
                      fontWeight: 600,
                      padding: "2px 6px",
                      borderRadius: "var(--radius-sm)",
                      backgroundColor: "rgba(0, 122, 255, 0.08)",
                      border: "1px solid rgba(0, 122, 255, 0.2)",
                    }}
                  >
                    {editSelectedFile ? "Change" : "Replace File"}
                    <input
                      type="file"
                      accept=".pdf,.docx,.pptx,.jpg,.jpeg,.png,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,image/jpeg,image/png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const val = validateStudyMaterialFile(file);
                          if (!val.isValid) {
                            setEditFileError(val.error || "Invalid file format or size.");
                            setEditSelectedFile(null);
                          } else {
                            setEditFileError(null);
                            setEditSelectedFile(file);
                          }
                        }
                      }}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>
                {editFileError && (
                  <div style={{ fontSize: "11px", color: "#FF3B30", marginTop: "4px" }}>
                    ⚠ {editFileError}
                  </div>
                )}
              </div>

              {/* Title */}
              <div style={{ marginBottom: "var(--space-3)" }}>
                <label
                  htmlFor="edit-material-title"
                  style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "4px" }}
                >
                  Title *
                </label>
                <input
                  id="edit-material-title"
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
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

              {/* Grid: Subject & Dependent Class */}
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
                    htmlFor="edit-material-subject"
                    style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "4px" }}
                  >
                    Subject
                  </label>
                  <select
                    id="edit-material-subject"
                    value={editSubject}
                    onChange={(e) => handleEditSubjectChange(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border)",
                      fontSize: "var(--text-xs)",
                      backgroundColor: "var(--color-surface)",
                    }}
                  >
                    {editAvailableSubjects.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="edit-material-class"
                    style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "4px" }}
                  >
                    Target Class
                  </label>
                  <select
                    id="edit-material-class"
                    value={editClassGrade}
                    onChange={(e) => handleEditClassChange(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border)",
                      fontSize: "var(--text-xs)",
                      backgroundColor: "var(--color-surface)",
                    }}
                  >
                    {editAvailableClasses.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Grid: Dependent Batch & Resource Type */}
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
                    htmlFor="edit-material-batch"
                    style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "4px" }}
                  >
                    Batch Scope
                  </label>
                  <select
                    id="edit-material-batch"
                    value={editBatch}
                    onChange={(e) => setEditBatch(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border)",
                      fontSize: "var(--text-xs)",
                      backgroundColor: "var(--color-surface)",
                    }}
                  >
                    <option value="All Batches in this Class">All Batches in this Class</option>
                    {editAvailableBatches.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="edit-material-type"
                    style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "4px" }}
                  >
                    Resource Type
                  </label>
                  <select
                    id="edit-material-type"
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as StudyMaterialType)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border)",
                      fontSize: "var(--text-xs)",
                      backgroundColor: "var(--color-surface)",
                    }}
                  >
                    {resourceTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Publication Status */}
              <div style={{ marginBottom: "var(--space-3)" }}>
                <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "6px" }}>
                  Publication Status
                </label>
                <div style={{ display: "flex", gap: "var(--space-3)" }}>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "var(--text-xs)", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="edit-material-status"
                      value="published"
                      checked={editStatus === "published"}
                      onChange={() => setEditStatus("published")}
                    />
                    <span>🟢 <strong>Published</strong> (Visible to eligible students &amp; parents)</span>
                  </label>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "var(--text-xs)", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="edit-material-status"
                      value="draft"
                      checked={editStatus === "draft"}
                      onChange={() => setEditStatus("draft")}
                    />
                    <span>🟡 <strong>Draft</strong> (Hidden from students &amp; parents)</span>
                  </label>
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: "var(--space-4)" }}>
                <label
                  htmlFor="edit-material-desc"
                  style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "4px" }}
                >
                  Notes / Syllabus Summary (Optional)
                </label>
                <textarea
                  id="edit-material-desc"
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-border)",
                    fontSize: "var(--text-xs)",
                    backgroundColor: "var(--color-surface)",
                    color: "var(--color-primary)",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)" }}>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditingItem(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="accent" size="sm">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN RESOURCE TYPE SETTINGS MODAL */}
      {isTypeSettingsOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsTypeSettingsOpen(false);
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
          aria-labelledby="type-settings-modal-title"
        >
          <div
            style={{
              backgroundColor: "var(--color-surface)",
              borderRadius: "var(--radius-lg)",
              maxWidth: "500px",
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
                alignItems: "center",
                marginBottom: "var(--space-4)",
              }}
            >
              <div>
                <h3
                  id="type-settings-modal-title"
                  style={{ fontSize: "var(--text-base)", fontWeight: 700, margin: "0 0 2px" }}
                >
                  Study Material Resource Types
                </h3>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", margin: 0 }}>
                  Configure permitted material classifications across the academy curriculum repository.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTypeSettingsOpen(false)}
                aria-label="Close settings"
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

            {/* Existing Types List */}
            <div style={{ marginBottom: "var(--space-4)" }}>
              <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "6px" }}>
                Active Resource Types ({resourceTypes.length}):
              </label>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  maxHeight: "200px",
                  overflowY: "auto",
                  border: "1px solid var(--color-border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  padding: "8px",
                  backgroundColor: "var(--color-surface-muted)",
                }}
              >
                {resourceTypes.map((t) => {
                  const count = materials.filter((m) => m.type === t).length;
                  return (
                    <div
                      key={t}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "6px 10px",
                        backgroundColor: "var(--color-surface)",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--color-border)",
                        fontSize: "var(--text-xs)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontWeight: 600, color: "var(--color-primary)" }}>{t}</span>
                        <span style={{ fontSize: "10px", color: "var(--color-neutral-dark)" }}>
                          ({count} items)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveResourceType(t)}
                        title={`Remove "${t}" resource type`}
                        style={{
                          fontSize: "11px",
                          color: "#FF3B30",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "2px 6px",
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Add New Type Form */}
            <form onSubmit={handleAddResourceType}>
              <div style={{ marginBottom: "var(--space-3)" }}>
                <label
                  htmlFor="new-type-input"
                  style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "4px" }}
                >
                  Add Custom Resource Type:
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    id="new-type-input"
                    type="text"
                    value={newTypeName}
                    onChange={(e) => {
                      setNewTypeName(e.target.value);
                      setTypeSettingsError(null);
                    }}
                    placeholder="e.g. Lab Manual, Revision Digest, Question Bank"
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: "var(--radius-sm)",
                      border: typeSettingsError ? "1px solid #FF3B30" : "1px solid var(--color-border)",
                      fontSize: "var(--text-xs)",
                      backgroundColor: "var(--color-surface)",
                    }}
                  />
                  <Button type="submit" variant="accent" size="sm">
                    Add Type
                  </Button>
                </div>
                {typeSettingsError && (
                  <div style={{ fontSize: "11px", color: "#FF3B30", marginTop: "4px" }}>
                    ⚠ {typeSettingsError}
                  </div>
                )}
              </div>
            </form>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "var(--space-4)" }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsTypeSettingsOpen(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
