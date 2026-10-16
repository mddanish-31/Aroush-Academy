"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  StudentProfile,
  TeacherProfile,
  SubjectEnrollment,
  MonthlyFeeObligation,
  PaymentTransaction,
  AttendanceRecord,
  AssessmentRecord,
  ExamAttemptResult,
  AcademicCertificateData,
  FeePaymentStatus,
  BatchDefinition,
} from "@/types";
import {
  SAMPLE_STUDENTS,
  SAMPLE_TEACHERS,
  SAMPLE_ENROLLMENTS,
  SAMPLE_OBLIGATIONS,
  SAMPLE_PAYMENTS,
  buildEnrollmentSummaries,
} from "@/data/enrollmentFeeData";
import {
  SAMPLE_ATTENDANCE,
  SAMPLE_ASSESSMENTS,
  SAMPLE_BATCHES,
} from "@/data/dashboardModulesData";
import { SAMPLE_EXAM_RESULTS } from "@/data/mockExamData";
import {
  DEFAULT_CLASSES,
  DEFAULT_BOARDS,
  DEFAULT_SUBJECTS,
  AcademicClass,
  AcademicBoard,
  AcademicSubject,
} from "@/data/academicMasterData";
import { useDemoStorage, DEMO_STORAGE_KEYS } from "@/lib/demoStorage";
import { useAuth } from "@/lib/auth/AuthContext";
import { recordCreate, recordUpdate } from "@/lib/auditService";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "./MetricCard";
import { ExamCertificateModal } from "./ExamCertificateModal";
import { FeeReceiptModal } from "./FeeReceiptModal";

interface DirectoryModuleProps {
  onOpenDigitalId?: (student: StudentProfile, autoPrint?: boolean) => void;
  onViewFeeLedger?: (studentId: string) => void;
}

export function DirectoryModule({
  onOpenDigitalId,
  onViewFeeLedger,
}: DirectoryModuleProps) {
  const { invitations, createInvitation, activateInvitation } = useAuth();

  // Navigation tabs within directory
  const [activeSubTab, setActiveSubTab] = useState<"students" | "teachers">(
    "students",
  );

  // Master records
  const [academicClasses] = useDemoStorage<AcademicClass[]>(
    DEMO_STORAGE_KEYS.ACADEMIC_CLASSES,
    DEFAULT_CLASSES,
  );
  const [academicBoards] = useDemoStorage<AcademicBoard[]>(
    DEMO_STORAGE_KEYS.ACADEMIC_BOARDS,
    DEFAULT_BOARDS,
  );
  const [academicSubjects] = useDemoStorage<AcademicSubject[]>(
    DEMO_STORAGE_KEYS.ACADEMIC_SUBJECTS,
    DEFAULT_SUBJECTS,
  );
  const [faculty, setFaculty] = useDemoStorage<TeacherProfile[]>(
    DEMO_STORAGE_KEYS.FACULTY,
    SAMPLE_TEACHERS,
  );
  const [batches] = useDemoStorage<BatchDefinition[]>(
    DEMO_STORAGE_KEYS.BATCHES,
    SAMPLE_BATCHES,
  );

  // Simulated account invitation modal state (Flow A)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteIdentifier, setInviteIdentifier] = useState("");
  const [inviteRole, setInviteRole] = useState<"student" | "parent">("student");
  const [isInviting, setIsInviting] = useState(false);

  // Reactive demo data sources (persisted in session storage across reloads)
  const [students, setStudents] = useDemoStorage<StudentProfile[]>(
    DEMO_STORAGE_KEYS.STUDENTS,
    SAMPLE_STUDENTS,
  );
  const [enrollments, setEnrollments] = useDemoStorage<SubjectEnrollment[]>(
    DEMO_STORAGE_KEYS.ENROLLMENTS,
    SAMPLE_ENROLLMENTS,
  );
  const [obligations, setObligations] = useDemoStorage<MonthlyFeeObligation[]>(
    DEMO_STORAGE_KEYS.OBLIGATIONS,
    SAMPLE_OBLIGATIONS,
  );
  const [payments] = useDemoStorage<PaymentTransaction[]>(
    DEMO_STORAGE_KEYS.PAYMENTS,
    SAMPLE_PAYMENTS,
  );
  const [attendanceRecords] = useDemoStorage<AttendanceRecord[]>(
    DEMO_STORAGE_KEYS.ATTENDANCE,
    SAMPLE_ATTENDANCE,
  );
  const [assessments] = useDemoStorage<AssessmentRecord[]>(
    DEMO_STORAGE_KEYS.ASSESSMENTS,
    SAMPLE_ASSESSMENTS,
  );
  const [examResults] = useDemoStorage<ExamAttemptResult[]>(
    DEMO_STORAGE_KEYS.EXAM_RESULTS,
    SAMPLE_EXAM_RESULTS,
  );

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [filterBoard, setFilterBoard] = useState("all");
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterTeacher, setFilterTeacher] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Notification Toast / Banner State
  const [actionAlert, setActionAlert] = useState<{
    type: "success" | "info" | "warning";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!actionAlert) return;
    const timer = setTimeout(() => setActionAlert(null), 5000);
    return () => clearTimeout(timer);
  }, [actionAlert]);

  // Selected Profile Modal State
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(
    null,
  );
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherProfile | null>(
    null,
  );
  const [profileActiveTab, setProfileActiveTab] = useState<
    "overview" | "subjects" | "attendance" | "academics" | "fees"
  >("overview");

  // Add Student Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addFormName, setAddFormName] = useState("");
  const [addFormClass, setAddFormClass] = useState("Class X");
  const [addFormBoard, setAddFormBoard] = useState<
    "ICSE" | "CBSE" | "West Bengal Board"
  >("ICSE");
  const [addFormGuardian, setAddFormGuardian] = useState("");
  const [addFormPhone, setAddFormPhone] = useState("");
  const [addFormJoiningDate, setAddFormJoiningDate] = useState("2026-10-12");
  const [addFormStatus, setAddFormStatus] = useState<
    "active" | "inactive" | "on-leave"
  >("active");
  const [addFormSubjects, setAddFormSubjects] = useState<
    {
      subjectName: string;
      teacherId: string;
      batchName: string;
      feeAmount: number;
    }[]
  >([
    {
      subjectName: "Mathematics",
      teacherId: "tch-azhar",
      batchName: "Batch Alpha (Class IX-X)",
      feeAmount: 1500,
    },
  ]);
  const [addFormError, setAddFormError] = useState("");

  // Edit Student Modal State
  const [editingStudent, setEditingStudent] = useState<StudentProfile | null>(
    null,
  );
  const [editFormName, setEditFormName] = useState("");
  const [editFormClass, setEditFormClass] = useState("Class X");
  const [editFormBoard, setEditFormBoard] = useState<
    "ICSE" | "CBSE" | "West Bengal Board"
  >("ICSE");
  const [editFormGuardian, setEditFormGuardian] = useState("");
  const [editFormPhone, setEditFormPhone] = useState("");
  const [editFormJoiningDate, setEditFormJoiningDate] = useState("");
  const [editFormStatus, setEditFormStatus] = useState<
    "active" | "inactive" | "on-leave"
  >("active");
  const [editFormSubjects, setEditFormSubjects] = useState<
    {
      id?: string;
      subjectName: string;
      teacherId: string;
      batchName: string;
      feeAmount: number;
    }[]
  >([]);
  const [editFormError, setEditFormError] = useState("");

  // Dynamic Subjects based on selected grade
  const activeSubjectsForAdd = useMemo(() => {
    const currentClassObj = academicClasses.find(
      (c) => c.name === addFormClass,
    );
    return academicSubjects.filter(
      (s) =>
        s.isActive &&
        (!s.applicableClassIds ||
          s.applicableClassIds.length === 0 ||
          (currentClassObj &&
            s.applicableClassIds.includes(currentClassObj.id))),
    );
  }, [academicSubjects, academicClasses, addFormClass]);

  const activeSubjectsForEdit = useMemo(() => {
    const currentClassObj = academicClasses.find(
      (c) => c.name === editFormClass,
    );
    return academicSubjects.filter(
      (s) =>
        s.isActive &&
        (!s.applicableClassIds ||
          s.applicableClassIds.length === 0 ||
          (currentClassObj &&
            s.applicableClassIds.includes(currentClassObj.id))),
    );
  }, [academicSubjects, academicClasses, editFormClass]);

  // Status Change Confirmation Dialog State
  const [statusConfirmStudent, setStatusConfirmStudent] = useState<{
    student: StudentProfile;
    targetStatus: "active" | "inactive";
  } | null>(null);

  // In-Profile Fee Audit Ledger Modal State
  const [auditLedgerModal, setAuditLedgerModal] = useState<{
    isOpen: boolean;
    studentName: string;
    subjectName: string;
    monthLabel: string;
    feeAmount: number;
    paidAmount: number;
    balance: number;
    status: FeePaymentStatus;
    payments: PaymentTransaction[];
    obligation: MonthlyFeeObligation;
    enrollment: SubjectEnrollment;
  } | null>(null);

  // Printable Document Modals State
  const [activeCertificate, setActiveCertificate] =
    useState<AcademicCertificateData | null>(null);
  const [activeReceipt, setActiveReceipt] = useState<{
    isOpen: boolean;
    transaction: PaymentTransaction;
    obligation: MonthlyFeeObligation;
    student: StudentProfile;
    enrollment: SubjectEnrollment;
    remainingBalanceAfterPayment: number;
  } | null>(null);

  // Escape key listener for modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (activeReceipt) {
          setActiveReceipt(null);
          return;
        }
        if (activeCertificate) {
          setActiveCertificate(null);
          return;
        }
        if (auditLedgerModal) {
          setAuditLedgerModal(null);
          return;
        }
        if (statusConfirmStudent) {
          setStatusConfirmStudent(null);
          return;
        }
        if (editingStudent) {
          setEditingStudent(null);
          return;
        }
        if (isAddModalOpen) {
          setIsAddModalOpen(false);
          return;
        }
        if (selectedStudent) {
          setSelectedStudent(null);
          return;
        }
        if (selectedTeacher) {
          setSelectedTeacher(null);
          return;
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    activeReceipt,
    activeCertificate,
    auditLedgerModal,
    statusConfirmStudent,
    editingStudent,
    isAddModalOpen,
    selectedStudent,
    selectedTeacher,
  ]);

  // Reactive fee summaries calculation using shared buildEnrollmentSummaries
  const allSummaries = useMemo(() => {
    return buildEnrollmentSummaries(enrollments, obligations, payments);
  }, [enrollments, obligations, payments]);

  // Student Directory KPIs (Replacing duplicate financial KPI cards)
  const studentMetrics = useMemo(() => {
    const totalStudents = students.length;
    const activeStudents = students.filter(
      (s) => s.studentStatus === "active",
    ).length;
    const inactiveStudents = students.filter(
      (s) => s.studentStatus !== "active",
    ).length;
    const pendingEnrollments = enrollments.filter(
      (e) => e.status !== "active",
    ).length;

    return {
      total: totalStudents,
      active: activeStudents,
      inactive: inactiveStudents,
      pending: pendingEnrollments,
    };
  }, [students, enrollments]);

  // Filtered Students List
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Class filter
      if (filterClass !== "all" && s.classGrade !== filterClass) return false;

      // Board filter
      if (filterBoard !== "all" && s.board !== filterBoard) return false;

      // Status filter
      if (filterStatus !== "all" && s.studentStatus !== filterStatus)
        return false;

      // Subject filter
      if (filterSubject !== "all") {
        const studentEnrs = enrollments.filter((e) => e.studentId === s.id);
        const hasSubject = studentEnrs.some(
          (e) => e.subjectName === filterSubject,
        );
        if (!hasSubject) return false;
      }

      // Faculty filter
      if (filterTeacher !== "all") {
        const studentEnrs = enrollments.filter((e) => e.studentId === s.id);
        const hasFaculty = studentEnrs.some(
          (e) => e.teacherId === filterTeacher,
        );
        if (!hasFaculty) return false;
      }

      // Search query (Student Name, Student ID, or Guardian Name)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const formattedId = `aa-2026-${s.id.replace("std-", "")}`.toLowerCase();
        const matchesName = s.name.toLowerCase().includes(query);
        const matchesId =
          s.id.toLowerCase().includes(query) || formattedId.includes(query);
        const matchesGuardian = s.guardianName.toLowerCase().includes(query);

        if (!matchesName && !matchesId && !matchesGuardian) return false;
      }

      return true;
    });
  }, [
    students,
    enrollments,
    filterClass,
    filterBoard,
    filterSubject,
    filterTeacher,
    filterStatus,
    searchQuery,
  ]);

  // Filtered Faculty List (synchronous with shared faculty storage)
  const filteredTeachers = useMemo(() => {
    return faculty.filter((t) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = t.name.toLowerCase().includes(query);
        const matchesSubject = (t.assignedSubjects || []).some((s) =>
          s.toLowerCase().includes(query),
        );
        const matchesId = t.id.toLowerCase().includes(query);
        const matchesEmail = (t.email || "").toLowerCase().includes(query);
        if (!matchesName && !matchesSubject && !matchesId && !matchesEmail)
          return false;
      }
      return true;
    });
  }, [faculty, searchQuery]);

  const isFiltered =
    searchQuery.trim() !== "" ||
    filterClass !== "all" ||
    filterBoard !== "all" ||
    filterSubject !== "all" ||
    filterTeacher !== "all" ||
    filterStatus !== "all";

  const handleClearFilters = () => {
    setSearchQuery("");
    setFilterClass("all");
    setFilterBoard("all");
    setFilterSubject("all");
    setFilterTeacher("all");
    setFilterStatus("all");
  };

  // Helper: Open Edit Modal for a student
  const handleOpenEditModal = (student: StudentProfile) => {
    const studentEnrs = enrollments.filter((e) => e.studentId === student.id);
    setEditingStudent(student);
    setEditFormName(student.name);
    setEditFormClass(student.classGrade);
    setEditFormBoard(student.board);
    setEditFormGuardian(student.guardianName);
    setEditFormPhone(student.guardianPhone);
    setEditFormJoiningDate(student.joiningDate);
    setEditFormStatus(student.studentStatus);
    setEditFormSubjects(
      studentEnrs.map((e) => ({
        id: e.id,
        subjectName: e.subjectName,
        teacherId: e.teacherId,
        batchName: e.batchName,
        feeAmount: e.monthlyFeeAmount,
      })),
    );
    setEditFormError("");
  };

  // Helper: Save Edited Student
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    if (!editFormName.trim()) {
      setEditFormError("Please enter the student's full name.");
      return;
    }
    if (!editFormGuardian.trim()) {
      setEditFormError("Please enter the guardian's name.");
      return;
    }
    if (!editFormPhone.trim() || editFormPhone.trim().length < 6) {
      setEditFormError("Please enter a valid guardian contact phone number.");
      return;
    }
    if (editFormSubjects.length === 0) {
      setEditFormError("Please assign at least one subject enrollment.");
      return;
    }

    const updatedProfile: StudentProfile = {
      ...editingStudent,
      name: editFormName.trim(),
      classGrade: editFormClass,
      board: editFormBoard,
      guardianName: editFormGuardian.trim(),
      guardianPhone: editFormPhone.trim(),
      joiningDate: editFormJoiningDate || editingStudent.joiningDate,
      studentStatus: editFormStatus,
    };

    // Update Students List
    setStudents((prev) =>
      prev.map((s) => (s.id === editingStudent.id ? updatedProfile : s)),
    );

    // Update Subject Enrollments for this student
    const otherEnrollments = enrollments.filter(
      (e) => e.studentId !== editingStudent.id,
    );
    const updatedEnrollments: SubjectEnrollment[] = editFormSubjects.map(
      (sub, index) => {
        const teacher =
          faculty.find((t) => t.id === sub.teacherId) ||
          faculty[0] ||
          SAMPLE_TEACHERS[0];
        const enrId =
          sub.id ||
          `enr-${editingStudent.id.replace("std-", "")}-${sub.subjectName.toLowerCase().slice(0, 4)}-${Date.now() + index}`;
        return {
          id: enrId,
          studentId: editingStudent.id,
          studentName: updatedProfile.name,
          classGrade: updatedProfile.classGrade,
          subjectName: sub.subjectName,
          teacherId: teacher.id,
          teacherName: teacher.name,
          batchName: sub.batchName || teacher.batches[0] || "General Batch",
          enrollmentDate: editingStudent.joiningDate,
          monthlyFeeAmount: sub.feeAmount || 1500,
          status:
            updatedProfile.studentStatus === "active" ? "active" : "paused",
        };
      },
    );

    setEnrollments([...otherEnrollments, ...updatedEnrollments]);

    // Ensure obligations exist for any newly added subject
    const existingObligations = obligations.filter(
      (o) => o.studentId === editingStudent.id,
    );
    const newObligations: MonthlyFeeObligation[] = [];

    updatedEnrollments.forEach((enr) => {
      const hasOb = existingObligations.some(
        (o) => o.subjectName === enr.subjectName && o.month === "2026-10",
      );
      if (!hasOb) {
        newObligations.push({
          id: `ob-${enr.id}-2026-10`,
          enrollmentId: enr.id,
          studentId: editingStudent.id,
          studentName: updatedProfile.name,
          subjectName: enr.subjectName,
          teacherId: enr.teacherId,
          month: "2026-10",
          monthLabel: "October 2026",
          feeAmount: enr.monthlyFeeAmount,
          dueDate: "2026-10-15",
        });
      }
    });

    if (newObligations.length > 0) {
      setObligations((prev) => [...prev, ...newObligations]);
    }

    // Keep selectedStudent state in sync if inspected
    if (selectedStudent && selectedStudent.id === editingStudent.id) {
      setSelectedStudent(updatedProfile);
    }

    setEditingStudent(null);
    recordUpdate({
      action: "Update Student Profile",
      type: "enrollment",
      target: `${updatedProfile.name} · ${updatedProfile.id.toUpperCase()}`,
      details: `Updated student record. Class: ${updatedProfile.classGrade}, Board: ${updatedProfile.board}, Status: ${updatedProfile.studentStatus}, Guardian: ${updatedProfile.guardianName}.`,
      performedBy: "Academy Administrator",
      actorRole: "academy-admin",
      entityType: "student",
      entityId: updatedProfile.id,
      outcome: "SUCCESS",
      changedFields: ["name", "classGrade", "board", "studentStatus", "guardianName"],
      sourcePortal: "academy-admin",
    });
    setActionAlert({
      type: "success",
      message: `Profile for ${updatedProfile.name} (${updatedProfile.id.toUpperCase()}) updated successfully.`,
    });
  };

  // Helper: Toggle Faculty Active/Inactive Status
  const handleToggleTeacherStatus = (teacherId: string) => {
    setFaculty((prev) =>
      prev.map((t) =>
        t.id === teacherId
          ? {
              ...t,
              status:
                (t.status || "active") === "active" ? "inactive" : "active",
            }
          : t,
      ),
    );
    setSelectedTeacher((prev) =>
      prev && prev.id === teacherId
        ? {
            ...prev,
            status:
              (prev.status || "active") === "active" ? "inactive" : "active",
          }
        : prev,
    );
    const teacher = faculty.find((t) => t.id === teacherId);
    const newStatus = (teacher?.status || "active") === "active" ? "inactive" : "active";
    recordUpdate({
      action: "Toggle Faculty Status",
      type: "system",
      target: teacher ? teacher.name : teacherId,
      details: `Updated faculty status to: ${newStatus}.`,
      performedBy: "Academy Administrator",
      actorRole: "academy-admin",
      entityType: "faculty",
      entityId: teacherId,
      outcome: "SUCCESS",
      changedFields: ["status"],
      diff: [{ fieldName: "status", before: teacher?.status || "active", after: newStatus }],
      sourcePortal: "academy-admin",
    });
    setActionAlert({
      type: "success",
      message: "Faculty member status updated successfully.",
    });
  };

  // Helper: Open Add Student Modal
  const handleOpenAddModal = () => {
    const firstClass =
      academicClasses.find((c) => c.isActive)?.name || "Class X";
    const firstBoard = (academicBoards.find((b) => b.isActive)?.name ||
      "ICSE") as "ICSE" | "CBSE" | "West Bengal Board";
    const currentClassObj = academicClasses.find((c) => c.name === firstClass);
    const firstSub = academicSubjects.find(
      (s) =>
        s.isActive &&
        (!s.applicableClassIds?.length ||
          (currentClassObj &&
            s.applicableClassIds.includes(currentClassObj.id))),
    );
    const firstTeacher = faculty[0] || SAMPLE_TEACHERS[0];
    setAddFormName("");
    setAddFormClass(firstClass);
    setAddFormBoard(firstBoard);
    setAddFormGuardian("");
    setAddFormPhone("");
    setAddFormJoiningDate("2026-10-12");
    setAddFormStatus("active");
    setAddFormSubjects([
      {
        subjectName: firstSub?.name || "Mathematics",
        teacherId: firstTeacher.id,
        batchName:
          (firstTeacher.batches && firstTeacher.batches[0]) ||
          "Batch Alpha (Class IX-X)",
        feeAmount: firstSub?.defaultMonthlyFee || 1500,
      },
    ]);
    setAddFormError("");
    setIsAddModalOpen(true);
  };

  // Helper: Provision Portal Account via Flow A
  const handleInitiateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !inviteIdentifier.trim()) return;
    setIsInviting(true);
    try {
      const inv = await createInvitation({
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        targetRole: inviteRole,
        identifier: inviteIdentifier.trim(),
      });

      // Update student record link status
      setStudents((prev) =>
        prev.map((s) =>
          s.id === selectedStudent.id
            ? {
                ...s,
                accountLinkStatus: "invited",
                linkedUserIdentifier: inviteIdentifier.trim(),
              }
            : s,
        ),
      );
      setSelectedStudent((prev) =>
        prev && prev.id === selectedStudent.id
          ? {
              ...prev,
              accountLinkStatus: "invited",
              linkedUserIdentifier: inviteIdentifier.trim(),
            }
          : prev,
      );

      setIsInviteModalOpen(false);
      recordCreate({
        action: "Send Portal Account Invitation",
        type: "security",
        target: `${selectedStudent.name} (${inviteRole})`,
        details: `Dispatched portal account invitation for ${selectedStudent.name} with target role ${inviteRole}.`,
        performedBy: "Academy Administrator",
        actorRole: "academy-admin",
        entityType: "invitation",
        entityId: inv.id,
        outcome: "SUCCESS",
        changedFields: ["accountLinkStatus"],
        sourcePortal: "academy-admin",
      });
      setActionAlert({
        type: "success",
        message: `Simulated invitation provisioned (Code: ${inv.invitationCode}) for ${selectedStudent.name}. Ready for simulated activation.`,
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to provision invitation";
      setActionAlert({ type: "warning", message: msg });
    } finally {
      setIsInviting(false);
    }
  };

  // Helper: Create New Student
  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();

    if (!addFormName.trim()) {
      setAddFormError("Please enter the student's full name.");
      return;
    }
    if (!addFormGuardian.trim()) {
      setAddFormError("Please enter the guardian's name.");
      return;
    }
    if (!addFormPhone.trim() || addFormPhone.trim().length < 6) {
      setAddFormError("Please enter a valid guardian phone number.");
      return;
    }
    if (addFormSubjects.length === 0) {
      setAddFormError("Please enroll the student in at least one subject.");
      return;
    }

    // Generate collision-safe student ID (e.g. std-106)
    const existingNums = students
      .map((s) => parseInt(s.id.replace("std-", ""), 10))
      .filter((n) => !isNaN(n));
    const nextNum =
      existingNums.length > 0 ? Math.max(...existingNums) + 1 : 106;
    const newStudentId = `std-${nextNum}`;

    const newStudent: StudentProfile = {
      id: newStudentId,
      name: addFormName.trim(),
      classGrade: addFormClass,
      board: addFormBoard,
      guardianName: addFormGuardian.trim(),
      guardianPhone: addFormPhone.trim(),
      joiningDate: addFormJoiningDate || "2026-10-12",
      studentStatus: addFormStatus,
      accountLinkStatus: "unlinked",
    };

    // Generate enrollments for selected subjects
    const newEnrollments: SubjectEnrollment[] = addFormSubjects.map(
      (sub, idx) => {
        const teacher =
          faculty.find((t) => t.id === sub.teacherId) ||
          faculty[0] ||
          SAMPLE_TEACHERS[0];
        const enrId = `enr-${nextNum}-${sub.subjectName.toLowerCase().slice(0, 4)}-${idx + 1}`;
        return {
          id: enrId,
          studentId: newStudentId,
          studentName: newStudent.name,
          classGrade: newStudent.classGrade,
          subjectName: sub.subjectName,
          teacherId: teacher.id,
          teacherName: teacher.name,
          batchName:
            sub.batchName ||
            (teacher.batches && teacher.batches[0]) ||
            "Standard Batch",
          enrollmentDate: newStudent.joiningDate,
          monthlyFeeAmount: sub.feeAmount || 1500,
          status: newStudent.studentStatus === "active" ? "active" : "paused",
        };
      },
    );

    // Generate October 2026 fee obligations
    const newObligations: MonthlyFeeObligation[] = newEnrollments.map(
      (enr) => ({
        id: `ob-${enr.id}-2026-10`,
        enrollmentId: enr.id,
        studentId: newStudentId,
        studentName: newStudent.name,
        subjectName: enr.subjectName,
        teacherId: enr.teacherId,
        month: "2026-10",
        monthLabel: "October 2026",
        feeAmount: enr.monthlyFeeAmount,
        dueDate: "2026-10-15",
      }),
    );

    // Update demo storage
    setStudents((prev) => [newStudent, ...prev]);
    setEnrollments((prev) => [...prev, ...newEnrollments]);
    setObligations((prev) => [...prev, ...newObligations]);

    setIsAddModalOpen(false);
    setSelectedStudent(newStudent);
    setProfileActiveTab("overview");

    recordCreate({
      action: "Register Student",
      type: "enrollment",
      target: `${newStudent.name} · AA-2026-${nextNum}`,
      details: `Registered student ${newStudent.name} (${newStudent.classGrade}, ${newStudent.board}) with ${newEnrollments.length} enrolled subjects.`,
      performedBy: "Academy Administrator",
      actorRole: "academy-admin",
      entityType: "student",
      entityId: newStudent.id,
      outcome: "SUCCESS",
      changedFields: ["name", "classGrade", "board", "guardianName", "enrollments"],
      sourcePortal: "academy-admin",
    });

    setActionAlert({
      type: "success",
      message: `Student ${newStudent.name} (AA-2026-${nextNum}) registered with ${newEnrollments.length} subject enrollments.`,
    });
  };

  // Helper: Execute Confirmed Status Change
  const handleConfirmStatusChange = () => {
    if (!statusConfirmStudent) return;
    const { student, targetStatus } = statusConfirmStudent;

    const updated: StudentProfile = {
      ...student,
      studentStatus: targetStatus,
    };

    setStudents((prev) => prev.map((s) => (s.id === student.id ? updated : s)));

    // Synchronize enrollment statuses safely
    setEnrollments((prev) =>
      prev.map((e) =>
        e.studentId === student.id
          ? { ...e, status: targetStatus === "active" ? "active" : "paused" }
          : e,
      ),
    );

    if (selectedStudent && selectedStudent.id === student.id) {
      setSelectedStudent(updated);
    }

    recordUpdate({
      action: "Change Student Status",
      type: "enrollment",
      target: `${student.name} · ${student.id.toUpperCase()}`,
      details: `Changed student status from ${student.studentStatus} to ${targetStatus}.`,
      performedBy: "Academy Administrator",
      actorRole: "academy-admin",
      entityType: "student",
      entityId: student.id,
      outcome: "SUCCESS",
      changedFields: ["studentStatus"],
      diff: [{ fieldName: "studentStatus", before: student.studentStatus, after: targetStatus }],
      sourcePortal: "academy-admin",
    });

    setStatusConfirmStudent(null);
    setActionAlert({
      type: "info",
      message: `${student.name}'s status changed to ${targetStatus === "active" ? "Active" : "Inactive"}.`,
    });
  };

  // Helper: Open Verified Merit Certificate Modal
  const handleOpenCertificate = (
    assessmentTitle: string,
    subject: string,
    date: string,
    score: number,
    total: number,
    pct: number,
    student: StudentProfile,
  ) => {
    const dateClean = date.replace(/[^0-9]/g, "");
    const certData: AcademicCertificateData = {
      id: `cert-${student.id}-${dateClean}`,
      certificateNumber: `AA-CERT-${student.id.replace("std-", "")}-${pct}-${dateClean.slice(0, 4) || "2026"}`,
      certificateType: "merit",
      title: "Certificate of Academic Distinction",
      studentId: student.id,
      studentName: student.name,
      classGrade: student.classGrade,
      board: student.board,
      subject,
      assessmentName: assessmentTitle,
      assessmentDate: date,
      scoreObtained: score,
      totalMarks: total,
      percentage: pct,
      criteriaMet: `Achieved ${pct}% marks in ICSE/CBSE board standard periodic assessment.`,
      issuedDate: "2026-10-12",
      facultyName: "Azhar Sir (Academic Director)",
    };
    setActiveCertificate(certData);
  };

  // Helper: Open Official Fee Receipt Modal
  const handleOpenReceiptModal = (
    tx: PaymentTransaction,
    obligation: MonthlyFeeObligation,
    enrollment: SubjectEnrollment,
    student: StudentProfile,
  ) => {
    const txsForObligation = payments.filter(
      (p) => p.obligationId === obligation.id,
    );
    const totalPaid = txsForObligation.reduce((sum, p) => sum + p.amount, 0);
    const remaining = Math.max(0, obligation.feeAmount - totalPaid);

    setActiveReceipt({
      isOpen: true,
      transaction: tx,
      obligation,
      student,
      enrollment,
      remainingBalanceAfterPayment: remaining,
    });
  };

  // Helper: Status badge generator
  const getStudentStatusBadge = (
    status: "active" | "inactive" | "on-leave",
  ) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="success" size="sm">
            Active
          </Badge>
        );
      case "on-leave":
        return (
          <Badge variant="warning" size="sm">
            On-Leave
          </Badge>
        );
      case "inactive":
      default:
        return (
          <Badge variant="neutral" size="sm">
            Inactive
          </Badge>
        );
    }
  };

  const getPaymentStatusBadge = (status: FeePaymentStatus) => {
    switch (status) {
      case "paid":
        return (
          <Badge variant="success" size="sm">
            Paid
          </Badge>
        );
      case "partially-paid":
        return (
          <Badge variant="warning" size="sm">
            Partial
          </Badge>
        );
      case "overdue":
        return (
          <Badge variant="danger" size="sm">
            Overdue
          </Badge>
        );
      case "unpaid":
      default:
        return (
          <Badge variant="neutral" size="sm">
            Unpaid
          </Badge>
        );
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-6)",
      }}
    >
      {/* Action Notification Alert Banner */}
      {actionAlert && (
        <div
          role="status"
          style={{
            backgroundColor:
              actionAlert.type === "success"
                ? "rgba(52, 199, 89, 0.12)"
                : actionAlert.type === "warning"
                  ? "rgba(255, 149, 0, 0.12)"
                  : "rgba(0, 122, 255, 0.12)",
            border: `1px solid ${
              actionAlert.type === "success"
                ? "var(--color-success)"
                : actionAlert.type === "warning"
                  ? "var(--color-warning)"
                  : "var(--color-accent)"
            }`,
            color: "var(--color-primary)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-3) var(--space-4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "var(--text-xs)",
            fontWeight: 500,
          }}
        >
          <span>{actionAlert.message}</span>
          <button
            type="button"
            onClick={() => setActionAlert(null)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <Card padding="md">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "var(--space-3)",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
                marginBottom: "4px",
              }}
            >
              <h2 style={{ fontSize: "var(--text-lg)", margin: 0 }}>
                Institutional Directory &amp; Central Registry
              </h2>
              <Badge variant="accent" size="sm">
                Active Roll: {students.length}
              </Badge>
            </div>
            <p
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--color-neutral-dark)",
                margin: 0,
              }}
            >
              Search student admissions, manage subject enrollments, inspect fee
              standing, and provision certified digital student IDs.
            </p>
          </div>

          {/* Sub-Tab Selector & Add Student Action */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-3)",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "var(--space-1)",
                backgroundColor: "var(--color-surface-muted)",
                padding: "4px",
                borderRadius: "var(--radius-full)",
              }}
            >
              <button
                type="button"
                onClick={() => setActiveSubTab("students")}
                style={{
                  padding: "6px 14px",
                  borderRadius: "var(--radius-full)",
                  fontSize: "var(--text-xs)",
                  fontWeight: activeSubTab === "students" ? 600 : 400,
                  backgroundColor:
                    activeSubTab === "students"
                      ? "var(--color-primary)"
                      : "transparent",
                  color:
                    activeSubTab === "students"
                      ? "#FFFFFF"
                      : "var(--color-neutral-dark)",
                  border: "none",
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
                }}
              >
                Students Directory ({students.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab("teachers")}
                style={{
                  padding: "6px 14px",
                  borderRadius: "var(--radius-full)",
                  fontSize: "var(--text-xs)",
                  fontWeight: activeSubTab === "teachers" ? 600 : 400,
                  backgroundColor:
                    activeSubTab === "teachers"
                      ? "var(--color-primary)"
                      : "transparent",
                  color:
                    activeSubTab === "teachers"
                      ? "#FFFFFF"
                      : "var(--color-neutral-dark)",
                  border: "none",
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
                }}
              >
                Faculty Directory ({faculty.length})
              </button>
            </div>

            {activeSubTab === "students" && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenAddModal}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>+</span> Add Student
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* STUDENT SPECIFIC DIRECTORY KPI METRICS (Replacing duplicate financial KPI cards) */}
      {activeSubTab === "students" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: "var(--space-4)",
          }}
        >
          <MetricCard
            metric={{
              id: "dir-total",
              label: "Total Registered Students",
              value: `${studentMetrics.total} Students`,
              delta: "Institutional Roll",
              deltaType: "neutral",
            }}
          />
          <MetricCard
            metric={{
              id: "dir-active",
              label: "Active Enrollments",
              value: `${studentMetrics.active} Active`,
              delta: `${Math.round((studentMetrics.active / (studentMetrics.total || 1)) * 100)}% Standing`,
              deltaType: "positive",
            }}
          />
          <MetricCard
            metric={{
              id: "dir-pending",
              label: "Pending Subject Seats",
              value: `${studentMetrics.pending} Pending`,
              delta:
                studentMetrics.pending === 0
                  ? "All Seats Active"
                  : "Action Required",
              deltaType: studentMetrics.pending === 0 ? "neutral" : "warning",
            }}
          />
          <MetricCard
            metric={{
              id: "dir-inactive",
              label: "Inactive / On-Leave",
              value: `${studentMetrics.inactive} Students`,
              delta:
                studentMetrics.inactive === 0
                  ? "Zero Inactive"
                  : "Archived Status",
              deltaType: studentMetrics.inactive === 0 ? "positive" : "neutral",
            }}
          />
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card padding="sm">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-3)",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "var(--space-3)",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {/* Search Input */}
            <div style={{ position: "relative", flex: "1 1 240px" }}>
              <input
                type="text"
                placeholder={
                  activeSubTab === "students"
                    ? "Search by student name, ID (e.g. STD-101), or guardian..."
                    : "Search faculty by name, ID, email, or subject..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 32px 8px 12px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-surface)",
                  fontSize: "var(--text-xs)",
                  color: "var(--color-primary)",
                  boxSizing: "border-box",
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  style={{
                    position: "absolute",
                    right: "8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--color-neutral-dark)",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                  title="Clear search text"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Students Directory Specific Dropdown Filters */}
            {activeSubTab === "students" && (
              <div
                style={{
                  display: "flex",
                  gap: "var(--space-2)",
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                {/* Grade Filter */}
                <select
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  style={{
                    fontSize: "var(--text-xs)",
                    padding: "6px 10px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-border)",
                    backgroundColor: "var(--color-surface)",
                    color: "var(--color-primary)",
                  }}
                  aria-label="Filter by grade"
                >
                  <option value="all">All Grades</option>
                  {academicClasses
                    .filter((c) => c.isActive)
                    .map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                </select>

                {/* Board Filter */}
                <select
                  value={filterBoard}
                  onChange={(e) => setFilterBoard(e.target.value)}
                  style={{
                    fontSize: "var(--text-xs)",
                    padding: "6px 10px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-border)",
                    backgroundColor: "var(--color-surface)",
                    color: "var(--color-primary)",
                  }}
                  aria-label="Filter by board"
                >
                  <option value="all">All Boards</option>
                  {academicBoards
                    .filter((b) => b.isActive)
                    .map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                </select>

                {/* Subject Filter */}
                <select
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  style={{
                    fontSize: "var(--text-xs)",
                    padding: "6px 10px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-border)",
                    backgroundColor: "var(--color-surface)",
                    color: "var(--color-primary)",
                  }}
                  aria-label="Filter by enrolled subject"
                >
                  <option value="all">All Subjects</option>
                  {academicSubjects
                    .filter((s) => s.isActive)
                    .map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                </select>

                {/* Faculty Filter */}
                <select
                  value={filterTeacher}
                  onChange={(e) => setFilterTeacher(e.target.value)}
                  style={{
                    fontSize: "var(--text-xs)",
                    padding: "6px 10px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-border)",
                    backgroundColor: "var(--color-surface)",
                    color: "var(--color-primary)",
                  }}
                  aria-label="Filter by assigned faculty"
                >
                  <option value="all">All Faculty</option>
                  {faculty.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{
                    fontSize: "var(--text-xs)",
                    padding: "6px 10px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-border)",
                    backgroundColor: "var(--color-surface)",
                    color: "var(--color-primary)",
                  }}
                  aria-label="Filter by student status"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="on-leave">On-Leave</option>
                </select>
              </div>
            )}
          </div>

          {/* Results Count & Clear Filter Action */}
          {activeSubTab === "students" && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "11px",
                color: "var(--color-neutral-dark)",
              }}
            >
              <span>
                Showing <strong>{filteredStudents.length}</strong> of{" "}
                <strong>{students.length}</strong> registered students
                {isFiltered && " (filtered)"}
              </span>

              {isFiltered && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--color-accent)",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: "11px",
                    padding: 0,
                  }}
                >
                  Reset / Clear Filters ✕
                </button>
              )}
            </div>
          )}

          {activeSubTab === "teachers" && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "11px",
                color: "var(--color-neutral-dark)",
              }}
            >
              <span>
                Showing <strong>{filteredTeachers.length}</strong> of{" "}
                <strong>{faculty.length}</strong> registered faculty
                {searchQuery.trim() && " (filtered)"}
              </span>

              {searchQuery.trim() && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--color-accent)",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: "11px",
                    padding: 0,
                  }}
                >
                  Reset / Clear Search ✕
                </button>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* STUDENTS DIRECTORY TABLE */}
      {activeSubTab === "students" && (
        <div
          style={{
            backgroundColor: "var(--color-surface)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--color-border)",
            overflow: "hidden",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                fontSize: "var(--text-xs)",
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: "var(--color-surface-muted)",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <th style={{ padding: "10px 14px", fontWeight: 600 }}>
                    Student ID
                  </th>
                  <th style={{ padding: "10px 14px", fontWeight: 600 }}>
                    Student Name
                  </th>
                  <th style={{ padding: "10px 14px", fontWeight: 600 }}>
                    Grade &amp; Board
                  </th>
                  <th style={{ padding: "10px 14px", fontWeight: 600 }}>
                    Enrolled Subjects
                  </th>
                  <th style={{ padding: "10px 14px", fontWeight: 600 }}>
                    Guardian Info
                  </th>
                  <th style={{ padding: "10px 14px", fontWeight: 600 }}>
                    Admission Date
                  </th>
                  <th style={{ padding: "10px 14px", fontWeight: 600 }}>
                    Status
                  </th>
                  <th
                    style={{
                      padding: "10px 14px",
                      fontWeight: 600,
                      textAlign: "right",
                    }}
                  >
                    Management Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      style={{
                        padding: "var(--space-8)",
                        textAlign: "center",
                        color: "var(--color-neutral-dark)",
                      }}
                    >
                      <div style={{ fontSize: "28px", marginBottom: "8px" }}>
                        🔍
                      </div>
                      <div
                        style={{
                          fontSize: "var(--text-sm)",
                          fontWeight: 600,
                          color: "var(--color-primary)",
                          marginBottom: "4px",
                        }}
                      >
                        No students match the current filter criteria
                      </div>
                      <div
                        style={{
                          fontSize: "var(--text-xs)",
                          marginBottom: "var(--space-3)",
                        }}
                      >
                        Try broadening your search term or clearing one of your
                        filter dropdowns.
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleClearFilters}
                      >
                        Reset All Filters
                      </Button>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => {
                    const studentEnrs = enrollments.filter(
                      (e) => e.studentId === s.id,
                    );
                    const formattedId = `AA-2026-${s.id.replace("std-", "")}`;

                    return (
                      <tr
                        key={s.id}
                        style={{
                          borderBottom: "1px solid var(--color-border)",
                          transition: "background-color var(--transition-fast)",
                        }}
                      >
                        {/* Student ID */}
                        <td
                          style={{
                            padding: "10px 14px",
                            fontFamily: "var(--font-mono)",
                            color: "var(--color-neutral-dark)",
                          }}
                        >
                          <span
                            style={{
                              backgroundColor: "var(--color-surface-muted)",
                              padding: "2px 6px",
                              borderRadius: "var(--radius-sm)",
                              border: "1px solid var(--color-border)",
                            }}
                          >
                            {formattedId}
                          </span>
                        </td>

                        {/* Name with initials badge */}
                        <td style={{ padding: "10px 14px" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <div
                              style={{
                                width: "26px",
                                height: "26px",
                                borderRadius: "var(--radius-full)",
                                backgroundColor: "var(--color-accent-subtle)",
                                color: "var(--color-accent)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 700,
                                fontSize: "11px",
                                flexShrink: 0,
                              }}
                            >
                              {s.name.slice(0, 2).toUpperCase()}
                            </div>
                            <span
                              style={{
                                fontWeight: 600,
                                color: "var(--color-primary)",
                              }}
                            >
                              {s.name}
                            </span>
                          </div>
                        </td>

                        {/* Grade and Board */}
                        <td style={{ padding: "10px 14px" }}>
                          <span style={{ fontWeight: 500 }}>
                            {s.classGrade}
                          </span>
                          <span
                            style={{
                              display: "block",
                              fontSize: "10px",
                              color: "var(--color-neutral-dark)",
                            }}
                          >
                            {s.board}
                          </span>
                        </td>

                        {/* Enrolled Subjects with Count */}
                        <td style={{ padding: "10px 14px" }}>
                          <div
                            style={{
                              display: "flex",
                              gap: "4px",
                              flexWrap: "wrap",
                              alignItems: "center",
                            }}
                          >
                            {studentEnrs.map((enr) => (
                              <Badge key={enr.id} variant="accent" size="sm">
                                {enr.subjectName}
                              </Badge>
                            ))}
                            {studentEnrs.length === 0 && (
                              <span
                                style={{
                                  color: "var(--color-neutral-dark)",
                                  fontStyle: "italic",
                                  fontSize: "10px",
                                }}
                              >
                                No active subjects
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Guardian */}
                        <td style={{ padding: "10px 14px" }}>
                          <div style={{ fontWeight: 500 }}>
                            {s.guardianName}
                          </div>
                          <div
                            style={{
                              fontSize: "10px",
                              color: "var(--color-neutral-dark)",
                            }}
                          >
                            📞 {s.guardianPhone}
                          </div>
                        </td>

                        {/* Joining Date */}
                        <td
                          style={{
                            padding: "10px 14px",
                            color: "var(--color-neutral-dark)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {s.joiningDate}
                        </td>

                        {/* Status */}
                        <td style={{ padding: "10px 14px" }}>
                          {getStudentStatusBadge(s.studentStatus)}
                        </td>

                        {/* Management Actions */}
                        <td
                          style={{
                            padding: "10px 14px",
                            textAlign: "right",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <div
                            style={{
                              display: "inline-flex",
                              gap: "4px",
                              alignItems: "center",
                            }}
                          >
                            <Button
                              variant="accent"
                              size="sm"
                              onClick={() => {
                                setSelectedStudent(s);
                                setProfileActiveTab("overview");
                              }}
                              style={{
                                fontSize: "11px",
                                padding: "4px 8px",
                                height: "26px",
                              }}
                            >
                              Inspect Profile →
                            </Button>

                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleOpenEditModal(s)}
                              style={{
                                fontSize: "11px",
                                padding: "4px 8px",
                                height: "26px",
                              }}
                              title="Edit student records"
                            >
                              Edit
                            </Button>

                            {onOpenDigitalId && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => onOpenDigitalId(s, false)}
                                style={{
                                  fontSize: "11px",
                                  padding: "4px 8px",
                                  height: "26px",
                                }}
                                title="Open certified Digital ID Card"
                              >
                                🪪 ID
                              </Button>
                            )}

                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() =>
                                setStatusConfirmStudent({
                                  student: s,
                                  targetStatus:
                                    s.studentStatus === "active"
                                      ? "inactive"
                                      : "active",
                                })
                              }
                              style={{
                                fontSize: "10px",
                                padding: "4px 6px",
                                height: "26px",
                                color:
                                  s.studentStatus === "active"
                                    ? "var(--color-warning)"
                                    : "var(--color-success)",
                              }}
                              title={
                                s.studentStatus === "active"
                                  ? "Deactivate student account"
                                  : "Activate student account"
                              }
                            >
                              {s.studentStatus === "active"
                                ? "Deactivate"
                                : "Activate"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FACULTY DIRECTORY TABLE */}
      {activeSubTab === "teachers" && (
        <div
          style={{
            backgroundColor: "var(--color-surface)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--color-border)",
            overflow: "hidden",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                fontSize: "var(--text-xs)",
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: "var(--color-surface-muted)",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <th style={{ padding: "10px 14px", fontWeight: 600 }}>
                    Faculty ID
                  </th>
                  <th style={{ padding: "10px 14px", fontWeight: 600 }}>
                    Faculty Name
                  </th>
                  <th style={{ padding: "10px 14px", fontWeight: 600 }}>
                    Assigned Subjects
                  </th>
                  <th style={{ padding: "10px 14px", fontWeight: 600 }}>
                    Active Batches
                  </th>
                  <th style={{ padding: "10px 14px", fontWeight: 600 }}>
                    Official Email
                  </th>
                  <th style={{ padding: "10px 14px", fontWeight: 600 }}>
                    Status
                  </th>
                  <th
                    style={{
                      padding: "10px 14px",
                      fontWeight: 600,
                      textAlign: "right",
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.map((t) => (
                  <tr
                    key={t.id}
                    style={{ borderBottom: "1px solid var(--color-border)" }}
                  >
                    <td
                      style={{
                        padding: "10px 14px",
                        fontFamily: "var(--font-mono)",
                        color: "var(--color-neutral-dark)",
                      }}
                    >
                      {t.id.toUpperCase()}
                    </td>
                    <td
                      style={{
                        padding: "10px 14px",
                        fontWeight: 600,
                        color: "var(--color-primary)",
                      }}
                    >
                      {t.name}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: "4px",
                          flexWrap: "wrap",
                        }}
                      >
                        {t.assignedSubjects && t.assignedSubjects.length > 0 ? (
                          t.assignedSubjects.map((sub) => (
                            <Badge key={sub} variant="accent" size="sm">
                              {sub}
                            </Badge>
                          ))
                        ) : (
                          <span
                            style={{
                              color: "var(--color-neutral-dark)",
                              fontStyle: "italic",
                              fontSize: "11px",
                            }}
                          >
                            None assigned
                          </span>
                        )}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "10px 14px",
                        color: "var(--color-neutral-dark)",
                      }}
                    >
                      {t.batches && t.batches.length > 0 ? (
                        t.batches.join(" • ")
                      ) : (
                        <span style={{ fontStyle: "italic", fontSize: "11px" }}>
                          No batches assigned
                        </span>
                      )}
                    </td>
                    <td
                      style={{
                        padding: "10px 14px",
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px",
                      }}
                    >
                      {t.email}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <Badge
                        variant={
                          (t.status || "active") === "active"
                            ? "success"
                            : "neutral"
                        }
                        size="sm"
                      >
                        {(t.status || "active") === "active"
                          ? "Active"
                          : "Inactive"}
                      </Badge>
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleToggleTeacherStatus(t.id)}
                          style={{ fontSize: "11px", padding: "4px 8px" }}
                        >
                          {(t.status || "active") === "active"
                            ? "Deactivate"
                            : "Activate"}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedTeacher(t)}
                          style={{ fontSize: "11px", padding: "4px 8px" }}
                        >
                          Inspect Profile →
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

      {/* ========================================================================= */}
      {/* 1. COMPLETE STUDENT PROFILE INSPECTION MODAL                              */}
      {/* ========================================================================= */}
      {selectedStudent && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedStudent(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "var(--space-4)",
          }}
          role="dialog"
          aria-modal="true"
          aria-label={`Student Profile: ${selectedStudent.name}`}
        >
          <div
            style={{
              backgroundColor: "var(--color-surface)",
              borderRadius: "var(--radius-xl)",
              maxWidth: "840px",
              width: "100%",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "var(--shadow-xl)",
              border: "1px solid var(--color-border)",
              overflow: "hidden",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "var(--space-4) var(--space-6)",
                borderBottom: "1px solid var(--color-border)",
                backgroundColor: "var(--color-surface-muted)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "var(--space-3)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-3)",
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "var(--radius-full)",
                    backgroundColor: "var(--color-accent)",
                    color: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "var(--text-base)",
                  }}
                >
                  {selectedStudent.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-2)",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "var(--text-lg)",
                        fontWeight: 700,
                        margin: 0,
                      }}
                    >
                      {selectedStudent.name}
                    </h3>
                    {getStudentStatusBadge(selectedStudent.studentStatus)}
                  </div>
                  <span
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--color-neutral-dark)",
                      display: "block",
                      marginTop: "2px",
                    }}
                  >
                    ID:{" "}
                    <strong>
                      AA-2026-{selectedStudent.id.replace("std-", "")}
                    </strong>{" "}
                    ({selectedStudent.id}) &bull; Enrolled Since{" "}
                    {selectedStudent.joiningDate}
                  </span>
                </div>
              </div>

              {/* Action Buttons in Modal Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                }}
              >
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleOpenEditModal(selectedStudent)}
                  style={{ fontSize: "11px" }}
                >
                  ✏️ Edit Profile
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setStatusConfirmStudent({
                      student: selectedStudent,
                      targetStatus:
                        selectedStudent.studentStatus === "active"
                          ? "inactive"
                          : "active",
                    })
                  }
                  style={{ fontSize: "11px" }}
                >
                  {selectedStudent.studentStatus === "active"
                    ? "Deactivate"
                    : "Activate"}
                </Button>

                {onOpenDigitalId && (
                  <Button
                    variant="accent"
                    size="sm"
                    onClick={() => {
                      const s = selectedStudent;
                      setSelectedStudent(null);
                      onOpenDigitalId(s, false);
                    }}
                    style={{ fontSize: "11px" }}
                  >
                    🪪 Digital ID
                  </Button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "20px",
                    color: "var(--color-neutral-dark)",
                    cursor: "pointer",
                    padding: "4px",
                    marginLeft: "4px",
                  }}
                  aria-label="Close profile modal"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Profile Sub-Tab Bar */}
            <div
              style={{
                display: "flex",
                gap: "4px",
                padding: "8px var(--space-6)",
                borderBottom: "1px solid var(--color-border)",
                backgroundColor: "var(--color-surface)",
                overflowX: "auto",
              }}
            >
              {[
                { id: "overview", label: "Overview & Personal" },
                {
                  id: "subjects",
                  label: `Subject Enrollments (${enrollments.filter((e) => e.studentId === selectedStudent.id).length})`,
                },
                {
                  id: "attendance",
                  label: `Attendance Record (${attendanceRecords.filter((a) => a.studentId === selectedStudent.id).length})`,
                },
                {
                  id: "academics",
                  label: `Academic Performance (${
                    assessments.flatMap((exam) =>
                      (exam.studentScores || []).filter(
                        (s) => s.studentId === selectedStudent.id,
                      ),
                    ).length +
                    examResults.filter(
                      (r) => r.studentId === selectedStudent.id,
                    ).length
                  })`,
                },
                {
                  id: "fees",
                  label: `Fee Summary & Ledger (${allSummaries.filter((s) => s.enrollment.studentId === selectedStudent.id).length})`,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() =>
                    setProfileActiveTab(
                      tab.id as
                        | "overview"
                        | "subjects"
                        | "attendance"
                        | "academics"
                        | "fees",
                    )
                  }
                  style={{
                    padding: "6px 12px",
                    borderRadius: "var(--radius-md)",
                    fontSize: "var(--text-xs)",
                    fontWeight: profileActiveTab === tab.id ? 600 : 500,
                    backgroundColor:
                      profileActiveTab === tab.id
                        ? "var(--color-surface-muted)"
                        : "transparent",
                    color:
                      profileActiveTab === tab.id
                        ? "var(--color-primary)"
                        : "var(--color-neutral-dark)",
                    border: "none",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Scrollable Modal Body */}
            <div
              style={{ padding: "var(--space-6)", overflowY: "auto", flex: 1 }}
            >
              {/* TAB 1: OVERVIEW & PERSONAL */}
              {profileActiveTab === "overview" && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-4)",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "var(--space-4)",
                    }}
                  >
                    {/* Personal Card */}
                    <div
                      style={{
                        padding: "var(--space-4)",
                        backgroundColor: "var(--color-surface-muted)",
                        borderRadius: "var(--radius-lg)",
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          color: "var(--color-neutral-dark)",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        Personal &amp; Academic Info
                      </span>
                      <div
                        style={{
                          marginTop: "var(--space-2)",
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                          fontSize: "var(--text-xs)",
                        }}
                      >
                        <div>
                          <strong>Full Name:</strong> {selectedStudent.name}
                        </div>
                        <div>
                          <strong>Student ID:</strong>{" "}
                          {selectedStudent.id.toUpperCase()}
                        </div>
                        <div>
                          <strong>Class / Grade:</strong>{" "}
                          {selectedStudent.classGrade}
                        </div>
                        <div>
                          <strong>Affiliated Board:</strong>{" "}
                          {selectedStudent.board}
                        </div>
                        <div>
                          <strong>Registration Date:</strong>{" "}
                          {selectedStudent.joiningDate}
                        </div>
                        <div>
                          <strong>Account Standing:</strong>{" "}
                          {getStudentStatusBadge(selectedStudent.studentStatus)}
                        </div>
                      </div>
                    </div>

                    {/* Guardian Card */}
                    <div
                      style={{
                        padding: "var(--space-4)",
                        backgroundColor: "var(--color-surface-muted)",
                        borderRadius: "var(--radius-lg)",
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          color: "var(--color-neutral-dark)",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        Guardian &amp; Emergency Contact
                      </span>
                      <div
                        style={{
                          marginTop: "var(--space-2)",
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                          fontSize: "var(--text-xs)",
                        }}
                      >
                        <div>
                          <strong>Guardian Name:</strong>{" "}
                          {selectedStudent.guardianName}
                        </div>
                        <div>
                          <strong>Relationship:</strong> Primary Guardian /
                          Parent
                        </div>
                        <div>
                          <strong>Phone Number:</strong>{" "}
                          <a
                            href={`tel:${selectedStudent.guardianPhone}`}
                            style={{
                              color: "var(--color-accent)",
                              textDecoration: "none",
                              fontWeight: 600,
                            }}
                          >
                            📞 {selectedStudent.guardianPhone}
                          </a>
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "var(--color-neutral-dark)",
                            marginTop: "4px",
                          }}
                        >
                          Guardian is linked for fee notifications, monthly
                          progress circulars, and attendance alerts.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Summary Grid */}
                  {(() => {
                    const studentEnrs = enrollments.filter(
                      (e) => e.studentId === selectedStudent.id,
                    );
                    const studentSummaries = allSummaries.filter(
                      (s) => s.enrollment.studentId === selectedStudent.id,
                    );
                    const target = studentSummaries.reduce(
                      (sum, s) => sum + s.currentMonthObligation.feeAmount,
                      0,
                    );
                    const paid = studentSummaries.reduce(
                      (sum, s) => sum + s.currentMonthPaid,
                      0,
                    );
                    const balance = studentSummaries.reduce(
                      (sum, s) => sum + s.currentMonthBalance,
                      0,
                    );

                    const studentAtt = attendanceRecords.filter(
                      (a) => a.studentId === selectedStudent.id,
                    );
                    const attRate =
                      studentAtt.length > 0
                        ? Math.round(
                            (studentAtt.filter((a) => a.status === "present")
                              .length /
                              studentAtt.length) *
                              100,
                          )
                        : null;

                    return (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(170px, 1fr))",
                          gap: "var(--space-3)",
                        }}
                      >
                        <div
                          style={{
                            padding: "var(--space-3)",
                            backgroundColor: "var(--color-surface)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius-md)",
                            textAlign: "center",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "10px",
                              color: "var(--color-neutral-dark)",
                              textTransform: "uppercase",
                            }}
                          >
                            Enrolled Subjects
                          </span>
                          <div
                            style={{
                              fontSize: "var(--text-xl)",
                              fontWeight: 700,
                              color: "var(--color-primary)",
                              marginTop: "2px",
                            }}
                          >
                            {studentEnrs.length}
                          </div>
                        </div>
                        <div
                          style={{
                            padding: "var(--space-3)",
                            backgroundColor: "var(--color-surface)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius-md)",
                            textAlign: "center",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "10px",
                              color: "var(--color-neutral-dark)",
                              textTransform: "uppercase",
                            }}
                          >
                            Monthly Fee Target
                          </span>
                          <div
                            style={{
                              fontSize: "var(--text-xl)",
                              fontWeight: 700,
                              color: "var(--color-primary)",
                              marginTop: "2px",
                            }}
                          >
                            ₹{target.toLocaleString()}
                          </div>
                        </div>
                        <div
                          style={{
                            padding: "var(--space-3)",
                            backgroundColor: "var(--color-surface)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius-md)",
                            textAlign: "center",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "10px",
                              color: "var(--color-neutral-dark)",
                              textTransform: "uppercase",
                            }}
                          >
                            Oct Amount Paid
                          </span>
                          <div
                            style={{
                              fontSize: "var(--text-xl)",
                              fontWeight: 700,
                              color: "var(--color-success)",
                              marginTop: "2px",
                            }}
                          >
                            ₹{paid.toLocaleString()}
                          </div>
                        </div>
                        <div
                          style={{
                            padding: "var(--space-3)",
                            backgroundColor: "var(--color-surface)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius-md)",
                            textAlign: "center",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "10px",
                              color: "var(--color-neutral-dark)",
                              textTransform: "uppercase",
                            }}
                          >
                            Oct Outstanding
                          </span>
                          <div
                            style={{
                              fontSize: "var(--text-xl)",
                              fontWeight: 700,
                              color:
                                balance > 0
                                  ? "var(--color-warning)"
                                  : "var(--color-neutral-dark)",
                              marginTop: "2px",
                            }}
                          >
                            ₹{balance.toLocaleString()}
                          </div>
                        </div>
                        <div
                          style={{
                            padding: "var(--space-3)",
                            backgroundColor: "var(--color-surface)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius-md)",
                            textAlign: "center",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "10px",
                              color: "var(--color-neutral-dark)",
                              textTransform: "uppercase",
                            }}
                          >
                            Attendance Rate
                          </span>
                          <div
                            style={{
                              fontSize: "var(--text-xl)",
                              fontWeight: 700,
                              color: "var(--color-accent)",
                              marginTop: "2px",
                            }}
                          >
                            {attRate !== null ? `${attRate}%` : "No Data"}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Flow A: Portal Account Provisioning & Identity Link Status */}
                  {(() => {
                    const existingInv = invitations.find(
                      (i) => i.studentId === selectedStudent.id,
                    );
                    const isLinked =
                      selectedStudent.accountLinkStatus === "linked" ||
                      existingInv?.activationStatus === "activated";
                    const isInvited =
                      !isLinked &&
                      (selectedStudent.accountLinkStatus === "invited" ||
                        existingInv?.activationStatus === "activation_pending");

                    return (
                      <div
                        style={{
                          padding: "var(--space-4)",
                          backgroundColor: "var(--color-surface)",
                          borderRadius: "var(--radius-lg)",
                          border: "1px solid var(--color-border)",
                          display: "flex",
                          flexDirection: "column",
                          gap: "var(--space-2)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: "var(--space-2)",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "var(--space-2)",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 700,
                                color: "var(--color-neutral-dark)",
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                              }}
                            >
                              Student Portal Account (Flow A)
                            </span>
                            <Badge
                              variant={
                                isLinked
                                  ? "success"
                                  : isInvited
                                    ? "warning"
                                    : "neutral"
                              }
                              size="sm"
                            >
                              {isLinked
                                ? "Activated & Linked"
                                : isInvited
                                  ? "Invited (Activation Pending)"
                                  : "Unlinked (No Credentials)"}
                            </Badge>
                          </div>

                          <div>
                            {isLinked ? (
                              <span
                                style={{
                                  fontSize: "11px",
                                  color: "var(--color-positive)",
                                  fontWeight: 600,
                                }}
                              >
                                ✓ Linked:{" "}
                                {selectedStudent.linkedUserIdentifier ||
                                  existingInv?.recipientIdentifier ||
                                  `${selectedStudent.id}@student.aroush.in`}
                              </span>
                            ) : isInvited && existingInv ? (
                              <Button
                                type="button"
                                variant="accent"
                                size="sm"
                                onClick={async () => {
                                  const res = await activateInvitation(
                                    existingInv.id,
                                  );
                                  if (res.success) {
                                    setStudents((prev) =>
                                      prev.map((s) =>
                                        s.id === selectedStudent.id
                                          ? {
                                              ...s,
                                              accountLinkStatus: "linked",
                                              linkedUserIdentifier:
                                                existingInv.recipientIdentifier,
                                            }
                                          : s,
                                      ),
                                    );
                                    setSelectedStudent((prev) =>
                                      prev
                                        ? {
                                            ...prev,
                                            accountLinkStatus: "linked",
                                            linkedUserIdentifier:
                                              existingInv.recipientIdentifier,
                                          }
                                        : null,
                                    );
                                    recordUpdate({
                                      action: "Activate Portal Account",
                                      type: "security",
                                      target: `${selectedStudent.name} (Student)`,
                                      details: `Activated portal login account for student ${selectedStudent.name}.`,
                                      performedBy: "Academy Administrator",
                                      actorRole: "academy-admin",
                                      entityType: "student",
                                      entityId: selectedStudent.id,
                                      outcome: "SUCCESS",
                                      changedFields: ["accountLinkStatus"],
                                      sourcePortal: "academy-admin",
                                    });
                                    setActionAlert({
                                      type: "success",
                                      message: `Student account activated! Log in at /login with "${existingInv.recipientIdentifier}" and password "student2026".`,
                                    });
                                  }
                                }}
                                style={{
                                  fontSize: "11px",
                                  padding: "3px 10px",
                                }}
                              >
                                ⚡ Simulate Student Account Activation
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                variant="primary"
                                size="sm"
                                onClick={() => {
                                  setInviteIdentifier(
                                    `${selectedStudent.name.toLowerCase().replace(/[^a-z0-9]/g, "")}@student.aroush.in`,
                                  );
                                  setInviteRole("student");
                                  setIsInviteModalOpen(true);
                                }}
                                style={{
                                  fontSize: "11px",
                                  padding: "3px 10px",
                                }}
                              >
                                + Provision Portal Account (Flow A)
                              </Button>
                            )}
                          </div>
                        </div>

                        <p
                          style={{
                            fontSize: "11px",
                            color: "var(--color-neutral-dark)",
                            margin: 0,
                            lineHeight: 1.4,
                          }}
                        >
                          {isLinked
                            ? "This academic record is explicitly linked to an active student login account. Authenticating with these credentials grants exclusive access to this student's timetable, classes, exams, and fee receipts."
                            : isInvited && existingInv
                              ? `Demo invitation generated with code "${existingInv.invitationCode}" for ${existingInv.recipientIdentifier}. In production, an email verification token is dispatched. Click "Simulate Student Account Activation" to authorize sign-in immediately.`
                              : "Academic admission record is currently unlinked. Provision a student or guardian portal account to generate credentials for the personal workspace."}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* TAB 2: SUBJECT ENROLLMENTS */}
              {profileActiveTab === "subjects" && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-4)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "var(--text-xs)",
                        fontWeight: 600,
                        color: "var(--color-primary)",
                      }}
                    >
                      Active Subject Obligations &amp; Faculty Assignments:
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleOpenEditModal(selectedStudent)}
                      style={{ fontSize: "11px" }}
                    >
                      + Manage / Add Subjects
                    </Button>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "var(--space-3)",
                    }}
                  >
                    {enrollments
                      .filter((e) => e.studentId === selectedStudent.id)
                      .map((enr) => (
                        <div
                          key={enr.id}
                          style={{
                            padding: "var(--space-4)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius-lg)",
                            backgroundColor: "var(--color-surface)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: "var(--space-3)",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "var(--space-2)",
                                marginBottom: "4px",
                              }}
                            >
                              <Badge variant="accent" size="sm">
                                {enr.subjectName}
                              </Badge>
                              <strong style={{ fontSize: "var(--text-sm)" }}>
                                {enr.batchName}
                              </strong>
                            </div>
                            <div
                              style={{
                                fontSize: "var(--text-xs)",
                                color: "var(--color-neutral-dark)",
                              }}
                            >
                              Assigned Faculty:{" "}
                              <strong>{enr.teacherName}</strong> &bull; Enrolled
                              Since {enr.enrollmentDate}
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div
                              style={{
                                fontSize: "var(--text-base)",
                                fontWeight: 700,
                                color: "var(--color-primary)",
                              }}
                            >
                              ₹{enr.monthlyFeeAmount.toLocaleString()}{" "}
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 400,
                                  color: "var(--color-neutral-dark)",
                                }}
                              >
                                / mo
                              </span>
                            </div>
                            <span
                              style={{
                                fontSize: "10px",
                                color: "var(--color-success)",
                                fontWeight: 600,
                              }}
                            >
                              ● {enr.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      ))}

                    {enrollments.filter(
                      (e) => e.studentId === selectedStudent.id,
                    ).length === 0 && (
                      <div
                        style={{
                          padding: "var(--space-6)",
                          textAlign: "center",
                          color: "var(--color-neutral-dark)",
                          border: "1px dashed var(--color-border)",
                          borderRadius: "var(--radius-md)",
                        }}
                      >
                        No subject enrollments assigned to this student.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: ATTENDANCE RECORD */}
              {profileActiveTab === "attendance" && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-4)",
                  }}
                >
                  {(() => {
                    const studentAtt = attendanceRecords.filter(
                      (a) => a.studentId === selectedStudent.id,
                    );
                    const presentCount = studentAtt.filter(
                      (a) => a.status === "present",
                    ).length;
                    const absentCount = studentAtt.filter(
                      (a) => a.status === "absent",
                    ).length;
                    const excusedCount = studentAtt.filter(
                      (a) => a.status === "excused",
                    ).length;
                    const rate =
                      studentAtt.length > 0
                        ? Math.round((presentCount / studentAtt.length) * 100)
                        : 0;

                    if (studentAtt.length === 0) {
                      return (
                        <div
                          style={{
                            padding: "var(--space-8)",
                            textAlign: "center",
                            color: "var(--color-neutral-dark)",
                          }}
                        >
                          <div
                            style={{ fontSize: "28px", marginBottom: "8px" }}
                          >
                            📅
                          </div>
                          <div
                            style={{
                              fontSize: "var(--text-sm)",
                              fontWeight: 600,
                              color: "var(--color-primary)",
                              marginBottom: "4px",
                            }}
                          >
                            No attendance records logged for this student yet
                          </div>
                          <div style={{ fontSize: "var(--text-xs)" }}>
                            Classroom attendance logs will appear here once
                            faculty registers sessions.
                          </div>
                        </div>
                      );
                    }

                    return (
                      <>
                        {/* Attendance Summary */}
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fit, minmax(130px, 1fr))",
                            gap: "var(--space-2)",
                          }}
                        >
                          <div
                            style={{
                              padding: "var(--space-2) var(--space-3)",
                              backgroundColor: "var(--color-surface-muted)",
                              borderRadius: "var(--radius-md)",
                              textAlign: "center",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "10px",
                                color: "var(--color-neutral-dark)",
                              }}
                            >
                              Rate
                            </span>
                            <div
                              style={{
                                fontSize: "var(--text-lg)",
                                fontWeight: 700,
                                color: "var(--color-accent)",
                              }}
                            >
                              {rate}%
                            </div>
                          </div>
                          <div
                            style={{
                              padding: "var(--space-2) var(--space-3)",
                              backgroundColor: "var(--color-surface-muted)",
                              borderRadius: "var(--radius-md)",
                              textAlign: "center",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "10px",
                                color: "var(--color-neutral-dark)",
                              }}
                            >
                              Total Sessions
                            </span>
                            <div
                              style={{
                                fontSize: "var(--text-lg)",
                                fontWeight: 700,
                              }}
                            >
                              {studentAtt.length}
                            </div>
                          </div>
                          <div
                            style={{
                              padding: "var(--space-2) var(--space-3)",
                              backgroundColor: "var(--color-surface-muted)",
                              borderRadius: "var(--radius-md)",
                              textAlign: "center",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "10px",
                                color: "var(--color-success)",
                              }}
                            >
                              Present
                            </span>
                            <div
                              style={{
                                fontSize: "var(--text-lg)",
                                fontWeight: 700,
                                color: "var(--color-success)",
                              }}
                            >
                              {presentCount}
                            </div>
                          </div>
                          <div
                            style={{
                              padding: "var(--space-2) var(--space-3)",
                              backgroundColor: "var(--color-surface-muted)",
                              borderRadius: "var(--radius-md)",
                              textAlign: "center",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "10px",
                                color: "var(--color-warning)",
                              }}
                            >
                              Absent
                            </span>
                            <div
                              style={{
                                fontSize: "var(--text-lg)",
                                fontWeight: 700,
                                color: "var(--color-warning)",
                              }}
                            >
                              {absentCount}
                            </div>
                          </div>
                          <div
                            style={{
                              padding: "var(--space-2) var(--space-3)",
                              backgroundColor: "var(--color-surface-muted)",
                              borderRadius: "var(--radius-md)",
                              textAlign: "center",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "10px",
                                color: "var(--color-neutral-dark)",
                              }}
                            >
                              Excused
                            </span>
                            <div
                              style={{
                                fontSize: "var(--text-lg)",
                                fontWeight: 700,
                              }}
                            >
                              {excusedCount}
                            </div>
                          </div>
                        </div>

                        {/* Attendance Log Table */}
                        <div style={{ overflowX: "auto" }}>
                          <table
                            style={{
                              width: "100%",
                              borderCollapse: "collapse",
                              fontSize: "var(--text-xs)",
                              textAlign: "left",
                            }}
                          >
                            <thead>
                              <tr
                                style={{
                                  borderBottom: "1px solid var(--color-border)",
                                  color: "var(--color-neutral-dark)",
                                  fontSize: "11px",
                                }}
                              >
                                <th style={{ padding: "8px 10px" }}>Date</th>
                                <th style={{ padding: "8px 10px" }}>Subject</th>
                                <th style={{ padding: "8px 10px" }}>Batch</th>
                                <th style={{ padding: "8px 10px" }}>Status</th>
                                <th style={{ padding: "8px 10px" }}>Remarks</th>
                              </tr>
                            </thead>
                            <tbody>
                              {studentAtt.map((att) => (
                                <tr
                                  key={att.id}
                                  style={{
                                    borderBottom:
                                      "1px solid var(--color-border-subtle)",
                                  }}
                                >
                                  <td
                                    style={{
                                      padding: "8px 10px",
                                      fontWeight: 500,
                                    }}
                                  >
                                    {att.date}
                                  </td>
                                  <td
                                    style={{
                                      padding: "8px 10px",
                                      color: "var(--color-accent)",
                                    }}
                                  >
                                    {att.subject}
                                  </td>
                                  <td
                                    style={{
                                      padding: "8px 10px",
                                      color: "var(--color-neutral-dark)",
                                    }}
                                  >
                                    {att.batch}
                                  </td>
                                  <td style={{ padding: "8px 10px" }}>
                                    <Badge
                                      variant={
                                        att.status === "present"
                                          ? "success"
                                          : att.status === "excused"
                                            ? "neutral"
                                            : "warning"
                                      }
                                      size="sm"
                                    >
                                      {att.status.toUpperCase()}
                                    </Badge>
                                  </td>
                                  <td
                                    style={{
                                      padding: "8px 10px",
                                      color: "var(--color-neutral-dark)",
                                    }}
                                  >
                                    {att.remarks || "—"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* TAB 4: ACADEMIC PERFORMANCE */}
              {profileActiveTab === "academics" && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-4)",
                  }}
                >
                  {(() => {
                    // Extract all tests where student has a score
                    const assessmentScores = assessments.flatMap((exam) =>
                      (exam.studentScores || [])
                        .filter((s) => s.studentId === selectedStudent.id)
                        .map((s) => ({
                          id: `${exam.id}-${s.studentId}`,
                          title: exam.title,
                          subject: exam.subject,
                          date: exam.date,
                          totalMarks: exam.totalMarks,
                          marksObtained: s.marksObtained,
                          feedback: s.feedback,
                          percentage: Math.round(
                            (s.marksObtained / (exam.totalMarks || 1)) * 100,
                          ),
                        })),
                    );

                    // Pre-recorded mock exam attempts
                    const mockAttempts = examResults
                      .filter((r) => r.studentId === selectedStudent.id)
                      .map((r) => ({
                        id: `attempt-${r.examId}`,
                        title: "Online Physics Mechanics & Optics Mock Exam",
                        subject: "Physics",
                        date: r.submittedAt.split(" ")[0],
                        totalMarks: r.totalMarks,
                        marksObtained: r.scoreObtained,
                        feedback:
                          "Strong conceptual understanding of wave optics.",
                        percentage: r.percentage,
                      }));

                    const allTests = [...assessmentScores, ...mockAttempts];

                    if (allTests.length === 0) {
                      return (
                        <div
                          style={{
                            padding: "var(--space-8)",
                            textAlign: "center",
                            color: "var(--color-neutral-dark)",
                          }}
                        >
                          <div
                            style={{ fontSize: "28px", marginBottom: "8px" }}
                          >
                            📊
                          </div>
                          <div
                            style={{
                              fontSize: "var(--text-sm)",
                              fontWeight: 600,
                              color: "var(--color-primary)",
                              marginBottom: "4px",
                            }}
                          >
                            No periodic test scores or mock examination records
                            found for this student
                          </div>
                          <div style={{ fontSize: "var(--text-xs)" }}>
                            Evaluations and scorecards will populate once
                            classroom mock exams are completed.
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "var(--space-3)",
                        }}
                      >
                        {allTests.map((test) => {
                          const isMerit = test.percentage >= 75;

                          return (
                            <div
                              key={test.id}
                              style={{
                                padding: "var(--space-4)",
                                border: "1px solid var(--color-border)",
                                borderRadius: "var(--radius-lg)",
                                backgroundColor: "var(--color-surface)",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                flexWrap: "wrap",
                                gap: "var(--space-3)",
                              }}
                            >
                              <div>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "var(--space-2)",
                                    marginBottom: "2px",
                                  }}
                                >
                                  <Badge variant="accent" size="sm">
                                    {test.subject}
                                  </Badge>
                                  <strong
                                    style={{ fontSize: "var(--text-sm)" }}
                                  >
                                    {test.title}
                                  </strong>
                                </div>
                                <div
                                  style={{
                                    fontSize: "11px",
                                    color: "var(--color-neutral-dark)",
                                    marginBottom: "4px",
                                  }}
                                >
                                  Conducted on {test.date} &bull; Feedback:{" "}
                                  <em>{test.feedback || "Good effort"}</em>
                                </div>
                                {isMerit && (
                                  <Badge variant="success" size="sm">
                                    ★ Merit Certificate Qualified (≥ 75%)
                                  </Badge>
                                )}
                              </div>

                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "var(--space-3)",
                                }}
                              >
                                <div style={{ textAlign: "right" }}>
                                  <div
                                    style={{
                                      fontSize: "var(--text-lg)",
                                      fontWeight: 700,
                                      color: "var(--color-primary)",
                                    }}
                                  >
                                    {test.marksObtained} / {test.totalMarks}
                                  </div>
                                  <span
                                    style={{
                                      fontSize: "11px",
                                      fontWeight: 600,
                                      color:
                                        test.percentage >= 75
                                          ? "var(--color-success)"
                                          : "var(--color-accent)",
                                    }}
                                  >
                                    {test.percentage}% Score
                                  </span>
                                </div>

                                {isMerit && (
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() =>
                                      handleOpenCertificate(
                                        test.title,
                                        test.subject,
                                        test.date,
                                        test.marksObtained,
                                        test.totalMarks,
                                        test.percentage,
                                        selectedStudent,
                                      )
                                    }
                                    style={{ fontSize: "11px" }}
                                  >
                                    🎓 View Certificate
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* TAB 5: FEE SUMMARY & LEDGER */}
              {profileActiveTab === "fees" && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-4)",
                  }}
                >
                  {(() => {
                    const studentSummaries = allSummaries.filter(
                      (s) => s.enrollment.studentId === selectedStudent.id,
                    );
                    const studentTxs = payments.filter(
                      (p) => p.studentId === selectedStudent.id,
                    );

                    const target = studentSummaries.reduce(
                      (sum, s) => sum + s.currentMonthObligation.feeAmount,
                      0,
                    );
                    const paid = studentSummaries.reduce(
                      (sum, s) => sum + s.currentMonthPaid,
                      0,
                    );
                    const balance = studentSummaries.reduce(
                      (sum, s) => sum + s.currentMonthBalance,
                      0,
                    );

                    return (
                      <>
                        {/* Financial Overview Cards */}
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fit, minmax(180px, 1fr))",
                            gap: "var(--space-3)",
                          }}
                        >
                          <div
                            style={{
                              padding: "var(--space-3)",
                              backgroundColor: "var(--color-surface-muted)",
                              borderRadius: "var(--radius-md)",
                              textAlign: "center",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "10px",
                                color: "var(--color-neutral-dark)",
                                textTransform: "uppercase",
                              }}
                            >
                              Monthly Fee Target
                            </span>
                            <div
                              style={{
                                fontSize: "var(--text-xl)",
                                fontWeight: 700,
                                marginTop: "2px",
                              }}
                            >
                              ₹{target.toLocaleString()}
                            </div>
                          </div>
                          <div
                            style={{
                              padding: "var(--space-3)",
                              backgroundColor: "var(--color-surface-muted)",
                              borderRadius: "var(--radius-md)",
                              textAlign: "center",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "10px",
                                color: "var(--color-success)",
                                textTransform: "uppercase",
                              }}
                            >
                              October Realized
                            </span>
                            <div
                              style={{
                                fontSize: "var(--text-xl)",
                                fontWeight: 700,
                                color: "var(--color-success)",
                                marginTop: "2px",
                              }}
                            >
                              ₹{paid.toLocaleString()}
                            </div>
                          </div>
                          <div
                            style={{
                              padding: "var(--space-3)",
                              backgroundColor: "var(--color-surface-muted)",
                              borderRadius: "var(--radius-md)",
                              textAlign: "center",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "10px",
                                color:
                                  balance > 0
                                    ? "var(--color-warning)"
                                    : "var(--color-neutral-dark)",
                                textTransform: "uppercase",
                              }}
                            >
                              Remaining Due
                            </span>
                            <div
                              style={{
                                fontSize: "var(--text-xl)",
                                fontWeight: 700,
                                color:
                                  balance > 0
                                    ? "var(--color-warning)"
                                    : "var(--color-neutral-dark)",
                                marginTop: "2px",
                              }}
                            >
                              ₹{balance.toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {/* Subject-Wise Obligations Table */}
                        <div>
                          <span
                            style={{
                              fontSize: "var(--text-xs)",
                              fontWeight: 600,
                              display: "block",
                              marginBottom: "var(--space-2)",
                            }}
                          >
                            October 2026 Subject Ledger Standing:
                          </span>
                          <div style={{ overflowX: "auto" }}>
                            <table
                              style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                fontSize: "var(--text-xs)",
                                textAlign: "left",
                              }}
                            >
                              <thead>
                                <tr
                                  style={{
                                    borderBottom:
                                      "1px solid var(--color-border)",
                                    color: "var(--color-neutral-dark)",
                                    fontSize: "11px",
                                  }}
                                >
                                  <th style={{ padding: "8px 10px" }}>
                                    Subject
                                  </th>
                                  <th style={{ padding: "8px 10px" }}>
                                    Assigned Faculty
                                  </th>
                                  <th style={{ padding: "8px 10px" }}>
                                    Monthly Obligation
                                  </th>
                                  <th style={{ padding: "8px 10px" }}>
                                    Oct Status
                                  </th>
                                  <th style={{ padding: "8px 10px" }}>Paid</th>
                                  <th style={{ padding: "8px 10px" }}>
                                    Balance
                                  </th>
                                  <th
                                    style={{
                                      padding: "8px 10px",
                                      textAlign: "right",
                                    }}
                                  >
                                    Actions
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {studentSummaries.map((summary) => {
                                  const {
                                    enrollment,
                                    currentMonthObligation,
                                    currentMonthPaid,
                                    currentMonthBalance,
                                    currentMonthStatus,
                                    currentMonthPayments,
                                  } = summary;

                                  return (
                                    <tr
                                      key={enrollment.id}
                                      style={{
                                        borderBottom:
                                          "1px solid var(--color-border-subtle)",
                                      }}
                                    >
                                      <td
                                        style={{
                                          padding: "8px 10px",
                                          fontWeight: 600,
                                          color: "var(--color-accent)",
                                        }}
                                      >
                                        {enrollment.subjectName}
                                      </td>
                                      <td
                                        style={{
                                          padding: "8px 10px",
                                          color: "var(--color-neutral-dark)",
                                        }}
                                      >
                                        {enrollment.teacherName}
                                      </td>
                                      <td
                                        style={{
                                          padding: "8px 10px",
                                          fontWeight: 600,
                                        }}
                                      >
                                        ₹
                                        {currentMonthObligation.feeAmount.toLocaleString()}
                                      </td>
                                      <td style={{ padding: "8px 10px" }}>
                                        {getPaymentStatusBadge(
                                          currentMonthStatus,
                                        )}
                                      </td>
                                      <td
                                        style={{
                                          padding: "8px 10px",
                                          color: "var(--color-success)",
                                          fontWeight: 600,
                                        }}
                                      >
                                        ₹{currentMonthPaid.toLocaleString()}
                                      </td>
                                      <td
                                        style={{
                                          padding: "8px 10px",
                                          color:
                                            currentMonthBalance > 0
                                              ? "var(--color-warning)"
                                              : "var(--color-neutral-dark)",
                                          fontWeight: 600,
                                        }}
                                      >
                                        ₹{currentMonthBalance.toLocaleString()}
                                      </td>
                                      <td
                                        style={{
                                          padding: "8px 10px",
                                          textAlign: "right",
                                        }}
                                      >
                                        <Button
                                          variant="secondary"
                                          size="sm"
                                          onClick={() =>
                                            setAuditLedgerModal({
                                              isOpen: true,
                                              studentName: selectedStudent.name,
                                              subjectName:
                                                enrollment.subjectName,
                                              monthLabel:
                                                currentMonthObligation.monthLabel,
                                              feeAmount:
                                                currentMonthObligation.feeAmount,
                                              paidAmount: currentMonthPaid,
                                              balance: currentMonthBalance,
                                              status: currentMonthStatus,
                                              payments: currentMonthPayments,
                                              obligation:
                                                currentMonthObligation,
                                              enrollment,
                                            })
                                          }
                                          style={{
                                            fontSize: "11px",
                                            padding: "3px 8px",
                                          }}
                                        >
                                          Audit Ledger
                                        </Button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Recent Payment Receipts */}
                        {studentTxs.length > 0 && (
                          <div style={{ marginTop: "var(--space-2)" }}>
                            <span
                              style={{
                                fontSize: "var(--text-xs)",
                                fontWeight: 600,
                                display: "block",
                                marginBottom: "var(--space-2)",
                              }}
                            >
                              Logged Payment Transactions ({studentTxs.length}):
                            </span>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "6px",
                              }}
                            >
                              {studentTxs.map((tx) => {
                                const enr = enrollments.find(
                                  (e) => e.id === tx.enrollmentId,
                                );
                                const ob = obligations.find(
                                  (o) => o.id === tx.obligationId,
                                );

                                return (
                                  <div
                                    key={tx.id}
                                    style={{
                                      padding: "8px 12px",
                                      border: "1px solid var(--color-border)",
                                      borderRadius: "var(--radius-sm)",
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      fontSize: "var(--text-xs)",
                                      backgroundColor: "var(--color-surface)",
                                    }}
                                  >
                                    <div>
                                      <span
                                        style={{
                                          fontFamily: "var(--font-mono)",
                                          fontWeight: 600,
                                        }}
                                      >
                                        {tx.referenceId}
                                      </span>{" "}
                                      &bull; {tx.paymentDate} &bull;{" "}
                                      <Badge variant="neutral" size="sm">
                                        {tx.paymentMethod.toUpperCase()}
                                      </Badge>
                                      <div
                                        style={{
                                          fontSize: "10px",
                                          color: "var(--color-neutral-dark)",
                                          marginTop: "2px",
                                        }}
                                      >
                                        Collected by: {tx.collectedByName}{" "}
                                        {tx.notes ? `(${tx.notes})` : ""}
                                      </div>
                                    </div>
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "var(--space-2)",
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontWeight: 700,
                                          color: "var(--color-success)",
                                        }}
                                      >
                                        ₹{tx.amount.toLocaleString()}
                                      </span>
                                      {enr && ob && (
                                        <Button
                                          variant="secondary"
                                          size="sm"
                                          onClick={() =>
                                            handleOpenReceiptModal(
                                              tx,
                                              ob,
                                              enr,
                                              selectedStudent,
                                            )
                                          }
                                          style={{
                                            fontSize: "10px",
                                            padding: "2px 6px",
                                          }}
                                        >
                                          View Receipt
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {onViewFeeLedger && (
                          <div
                            style={{
                              marginTop: "var(--space-2)",
                              textAlign: "right",
                            }}
                          >
                            <Button
                              variant="accent"
                              size="sm"
                              onClick={() => {
                                setSelectedStudent(null);
                                onViewFeeLedger(selectedStudent.id);
                              }}
                            >
                              Open in Overview &amp; Fee Ledger →
                            </Button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "var(--space-3) var(--space-6)",
                borderTop: "1px solid var(--color-border)",
                backgroundColor: "var(--color-surface-muted)",
                display: "flex",
                justifyContent: "flex-end",
                gap: "var(--space-2)",
              }}
            >
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedStudent(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ADD STUDENT MODAL                                                      */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddModalOpen(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 110,
            padding: "var(--space-4)",
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Add Student"
        >
          <div
            style={{
              backgroundColor: "var(--color-surface)",
              borderRadius: "var(--radius-xl)",
              maxWidth: "680px",
              width: "100%",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "var(--shadow-xl)",
              border: "1px solid var(--color-border)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "var(--space-4) var(--space-6)",
                borderBottom: "1px solid var(--color-border)",
                backgroundColor: "var(--color-surface-muted)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: "var(--text-lg)",
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  Register New Student
                </h3>
                <span
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-neutral-dark)",
                  }}
                >
                  Assign class grade, guardian emergency contact, and subject
                  fee obligations.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "18px",
                  color: "var(--color-neutral-dark)",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSaveAdd}
              style={{
                padding: "var(--space-6)",
                overflowY: "auto",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-4)",
              }}
            >
              {addFormError && (
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: "rgba(255, 59, 48, 0.1)",
                    border: "1px solid rgba(255, 59, 48, 0.3)",
                    color: "#D32F2F",
                    fontSize: "var(--text-xs)",
                  }}
                >
                  {addFormError}
                </div>
              )}

              {/* Personal Details */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "var(--space-3)",
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Student Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ayan Qureshi"
                    value={addFormName}
                    onChange={(e) => setAddFormName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      fontSize: "var(--text-xs)",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border)",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Class Grade *
                  </label>
                  <select
                    value={addFormClass}
                    onChange={(e) => setAddFormClass(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      fontSize: "var(--text-xs)",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border)",
                      boxSizing: "border-box",
                    }}
                  >
                    {academicClasses
                      .filter((c) => c.isActive)
                      .map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Board *
                  </label>
                  <select
                    value={addFormBoard}
                    onChange={(e) =>
                      setAddFormBoard(
                        e.target.value as "ICSE" | "CBSE" | "West Bengal Board",
                      )
                    }
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      fontSize: "var(--text-xs)",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border)",
                      boxSizing: "border-box",
                    }}
                  >
                    {academicBoards
                      .filter((b) => b.isActive)
                      .map((b) => (
                        <option key={b.id} value={b.name}>
                          {b.name} ({b.code})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Status
                  </label>
                  <select
                    value={addFormStatus}
                    onChange={(e) =>
                      setAddFormStatus(
                        e.target.value as "active" | "inactive" | "on-leave",
                      )
                    }
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      fontSize: "var(--text-xs)",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border)",
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="active">Active</option>
                    <option value="on-leave">On-Leave</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Guardian Info */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "var(--space-3)",
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Guardian Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Imran Qureshi"
                    value={addFormGuardian}
                    onChange={(e) => setAddFormGuardian(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      fontSize: "var(--text-xs)",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border)",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Guardian Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 098830 77889"
                    value={addFormPhone}
                    onChange={(e) => setAddFormPhone(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      fontSize: "var(--text-xs)",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border)",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Admission Date
                  </label>
                  <input
                    type="date"
                    value={addFormJoiningDate}
                    onChange={(e) => setAddFormJoiningDate(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      fontSize: "var(--text-xs)",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border)",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Subject Enrollments */}
              <div
                style={{
                  borderTop: "1px solid var(--color-border)",
                  paddingTop: "var(--space-3)",
                }}
              >
                <span
                  style={{
                    fontSize: "var(--text-xs)",
                    fontWeight: 700,
                    display: "block",
                    marginBottom: "var(--space-2)",
                  }}
                >
                  Subject Selection &amp; Faculty Assignments:
                </span>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-2)",
                  }}
                >
                  {activeSubjectsForAdd.map((subOpt) => {
                    const isChecked = addFormSubjects.some(
                      (s) => s.subjectName === subOpt.name,
                    );
                    const currentEntry = addFormSubjects.find(
                      (s) => s.subjectName === subOpt.name,
                    );
                    const activeFaculty = faculty.filter(
                      (f) => (f.status || "active") === "active",
                    );
                    const eligibleTeachers = activeFaculty.filter(
                      (f) =>
                        !f.assignedSubjects ||
                        f.assignedSubjects.length === 0 ||
                        f.assignedSubjects.includes(subOpt.name),
                    );
                    const teachersList =
                      eligibleTeachers.length > 0 ? eligibleTeachers : activeFaculty;
                    const matchingBatches = batches.filter(
                      (b) =>
                        b.status === "active" &&
                        (!b.subject || b.subject === subOpt.name),
                    );

                    return (
                      <div
                        key={subOpt.name}
                        style={{
                          padding: "10px 12px",
                          borderRadius: "var(--radius-md)",
                          border: `1px solid ${isChecked ? "var(--color-accent)" : "var(--color-border)"}`,
                          backgroundColor: isChecked
                            ? "rgba(0, 122, 255, 0.04)"
                            : "var(--color-surface)",
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <label
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              cursor: "pointer",
                              fontSize: "var(--text-xs)",
                              fontWeight: 600,
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  const teacher = teachersList[0] || faculty[0];
                                  setAddFormSubjects((prev) => [
                                    ...prev,
                                    {
                                      subjectName: subOpt.name,
                                      teacherId: teacher?.id || "tch-azhar",
                                      batchName:
                                        (teacher?.batches &&
                                          teacher.batches[0]) ||
                                        matchingBatches[0]?.name ||
                                        "General Batch",
                                      feeAmount: subOpt.defaultMonthlyFee,
                                    },
                                  ]);
                                } else {
                                  setAddFormSubjects((prev) =>
                                    prev.filter(
                                      (s) => s.subjectName !== subOpt.name,
                                    ),
                                  );
                                }
                              }}
                            />
                            <span>{subOpt.name}</span>
                          </label>
                          <span
                            style={{
                              fontSize: "11px",
                              color: "var(--color-neutral-dark)",
                            }}
                          >
                            Default Fee: ₹{subOpt.defaultMonthlyFee}/mo
                          </span>
                        </div>

                        {isChecked && currentEntry && (
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1.2fr 1fr 1fr",
                              gap: "var(--space-2)",
                              marginTop: "4px",
                            }}
                          >
                            <div>
                              <span
                                style={{
                                  fontSize: "10px",
                                  color: "var(--color-neutral-dark)",
                                  display: "block",
                                }}
                              >
                                Faculty
                              </span>
                              <select
                                value={currentEntry.teacherId}
                                onChange={(e) => {
                                  const tId = e.target.value;
                                  const teacher =
                                    faculty.find((t) => t.id === tId) ||
                                    faculty[0];
                                  setAddFormSubjects((prev) =>
                                    prev.map((s) =>
                                      s.subjectName === subOpt.name
                                        ? {
                                            ...s,
                                            teacherId: tId,
                                            batchName:
                                              (teacher?.batches &&
                                                teacher.batches[0]) ||
                                              matchingBatches[0]?.name ||
                                              "Standard Batch",
                                          }
                                        : s,
                                    ),
                                  );
                                }}
                                style={{
                                  width: "100%",
                                  fontSize: "11px",
                                  padding: "4px 6px",
                                  borderRadius: "var(--radius-sm)",
                                  border: "1px solid var(--color-border)",
                                }}
                              >
                                {teachersList.map((t) => (
                                  <option key={t.id} value={t.id}>
                                    {t.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <span
                                style={{
                                  fontSize: "10px",
                                  color: "var(--color-neutral-dark)",
                                  display: "block",
                                }}
                              >
                                Batch
                              </span>
                              <select
                                value={currentEntry.batchName}
                                onChange={(e) => {
                                  const bVal = e.target.value;
                                  setAddFormSubjects((prev) =>
                                    prev.map((s) =>
                                      s.subjectName === subOpt.name
                                        ? { ...s, batchName: bVal }
                                        : s,
                                    ),
                                  );
                                }}
                                style={{
                                  width: "100%",
                                  fontSize: "11px",
                                  padding: "4px 6px",
                                  borderRadius: "var(--radius-sm)",
                                  border: "1px solid var(--color-border)",
                                  boxSizing: "border-box",
                                }}
                              >
                                {matchingBatches.length > 0 ? (
                                  matchingBatches.map((b) => (
                                    <option key={b.id} value={b.name}>
                                      {b.name}
                                    </option>
                                  ))
                                ) : (
                                  <option value={currentEntry.batchName}>
                                    {currentEntry.batchName || "Standard Batch"}
                                  </option>
                                )}
                              </select>
                            </div>

                            <div>
                              <span
                                style={{
                                  fontSize: "10px",
                                  color: "var(--color-neutral-dark)",
                                  display: "block",
                                }}
                              >
                                Monthly Fee (₹)
                              </span>
                              <input
                                type="number"
                                min={500}
                                step={100}
                                value={currentEntry.feeAmount}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10) || 0;
                                  setAddFormSubjects((prev) =>
                                    prev.map((s) =>
                                      s.subjectName === subOpt.name
                                        ? { ...s, feeAmount: val }
                                        : s,
                                    ),
                                  );
                                }}
                                style={{
                                  width: "100%",
                                  fontSize: "11px",
                                  padding: "4px 6px",
                                  borderRadius: "var(--radius-sm)",
                                  border: "1px solid var(--color-border)",
                                  boxSizing: "border-box",
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "var(--space-2)",
                  borderTop: "1px solid var(--color-border)",
                  paddingTop: "var(--space-3)",
                }}
              >
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Register Student
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. EDIT STUDENT MODAL                                                     */}
      {/* ========================================================================= */}
      {editingStudent && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingStudent(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 110,
            padding: "var(--space-4)",
          }}
          role="dialog"
          aria-modal="true"
          aria-label={`Edit Student: ${editingStudent.name}`}
        >
          <div
            style={{
              backgroundColor: "var(--color-surface)",
              borderRadius: "var(--radius-xl)",
              maxWidth: "680px",
              width: "100%",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "var(--shadow-xl)",
              border: "1px solid var(--color-border)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "var(--space-4) var(--space-6)",
                borderBottom: "1px solid var(--color-border)",
                backgroundColor: "var(--color-surface-muted)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: "var(--text-lg)",
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  Edit Student Profile &bull; {editingStudent.id.toUpperCase()}
                </h3>
                <span
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-neutral-dark)",
                  }}
                >
                  Update student identity, guardian contact details, and
                  enrolled subjects.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "18px",
                  color: "var(--color-neutral-dark)",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSaveEdit}
              style={{
                padding: "var(--space-6)",
                overflowY: "auto",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-4)",
              }}
            >
              {editFormError && (
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: "rgba(255, 59, 48, 0.1)",
                    border: "1px solid rgba(255, 59, 48, 0.3)",
                    color: "#D32F2F",
                    fontSize: "var(--text-xs)",
                  }}
                >
                  {editFormError}
                </div>
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "var(--space-3)",
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormName}
                    onChange={(e) => setEditFormName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      fontSize: "var(--text-xs)",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border)",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Class Grade
                  </label>
                  <select
                    value={editFormClass}
                    onChange={(e) => setEditFormClass(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      fontSize: "var(--text-xs)",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border)",
                      boxSizing: "border-box",
                    }}
                  >
                    {academicClasses
                      .filter((c) => c.isActive)
                      .map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Board
                  </label>
                  <select
                    value={editFormBoard}
                    onChange={(e) =>
                      setEditFormBoard(
                        e.target.value as "ICSE" | "CBSE" | "West Bengal Board",
                      )
                    }
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      fontSize: "var(--text-xs)",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border)",
                      boxSizing: "border-box",
                    }}
                  >
                    {academicBoards
                      .filter((b) => b.isActive)
                      .map((b) => (
                        <option key={b.id} value={b.name}>
                          {b.name} ({b.code})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Status
                  </label>
                  <select
                    value={editFormStatus}
                    onChange={(e) =>
                      setEditFormStatus(
                        e.target.value as "active" | "inactive" | "on-leave",
                      )
                    }
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      fontSize: "var(--text-xs)",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border)",
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="active">Active</option>
                    <option value="on-leave">On-Leave</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Guardian Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormGuardian}
                    onChange={(e) => setEditFormGuardian(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      fontSize: "var(--text-xs)",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border)",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Guardian Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={editFormPhone}
                    onChange={(e) => setEditFormPhone(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      fontSize: "var(--text-xs)",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border)",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Subject Enrollments Management */}
              <div
                style={{
                  borderTop: "1px solid var(--color-border)",
                  paddingTop: "var(--space-3)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "var(--space-2)",
                  }}
                >
                  <span style={{ fontSize: "var(--text-xs)", fontWeight: 700 }}>
                    Subject Enrollments ({editFormSubjects.length}):
                  </span>

                  {/* Add additional subject trigger */}
                  {editFormSubjects.length < activeSubjectsForEdit.length && (
                    <select
                      onChange={(e) => {
                        const subName = e.target.value;
                        if (!subName) return;
                        const subOpt = activeSubjectsForEdit.find(
                          (s) => s.name === subName,
                        );
                        if (!subOpt) return;
                        const teacher =
                          faculty.find((t) =>
                            t.assignedSubjects?.includes(subOpt.name),
                          ) ||
                          faculty[0] ||
                          SAMPLE_TEACHERS[0];
                        setEditFormSubjects((prev) => [
                          ...prev,
                          {
                            subjectName: subOpt.name,
                            teacherId: teacher.id,
                            batchName:
                              (teacher.batches && teacher.batches[0]) ||
                              "General Batch",
                            feeAmount: subOpt.defaultMonthlyFee,
                          },
                        ]);
                        e.target.value = "";
                      }}
                      defaultValue=""
                      style={{
                        fontSize: "11px",
                        padding: "4px 8px",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--color-border)",
                        backgroundColor: "var(--color-surface-muted)",
                        color: "var(--color-accent)",
                        fontWeight: 600,
                      }}
                    >
                      <option value="" disabled>
                        + Add Another Subject
                      </option>
                      {activeSubjectsForEdit
                        .filter(
                          (opt) =>
                            !editFormSubjects.some(
                              (s) => s.subjectName === opt.name,
                            ),
                        )
                        .map((opt) => (
                          <option key={opt.name} value={opt.name}>
                            {opt.name} (₹{opt.defaultMonthlyFee})
                          </option>
                        ))}
                    </select>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-2)",
                  }}
                >
                  {editFormSubjects.map((sub, idx) => (
                    <div
                      key={sub.subjectName}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--color-border)",
                        backgroundColor: "var(--color-surface-muted)",
                        display: "grid",
                        gridTemplateColumns: "1.2fr 1fr 1fr 1fr auto",
                        gap: "var(--space-2)",
                        alignItems: "center",
                      }}
                    >
                      <strong style={{ fontSize: "var(--text-xs)" }}>
                        {sub.subjectName}
                      </strong>

                      <select
                        value={sub.teacherId}
                        onChange={(e) => {
                          const tId = e.target.value;
                          setEditFormSubjects((prev) =>
                            prev.map((s, i) =>
                              i === idx ? { ...s, teacherId: tId } : s,
                            ),
                          );
                        }}
                        style={{
                          fontSize: "11px",
                          padding: "4px 6px",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--color-border)",
                        }}
                      >
                        {faculty
                          .filter((t) => (t.status || "active") === "active" || t.id === sub.teacherId)
                          .map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name} {(t.status || "active") === "inactive" ? "(Inactive)" : ""}
                            </option>
                          ))}
                      </select>

                      <input
                        type="text"
                        value={sub.batchName}
                        onChange={(e) => {
                          const bVal = e.target.value;
                          setEditFormSubjects((prev) =>
                            prev.map((s, i) =>
                              i === idx ? { ...s, batchName: bVal } : s,
                            ),
                          );
                        }}
                        placeholder="Batch name"
                        style={{
                          fontSize: "11px",
                          padding: "4px 6px",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--color-border)",
                          boxSizing: "border-box",
                        }}
                      />

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "2px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "11px",
                            color: "var(--color-neutral-dark)",
                          }}
                        >
                          ₹
                        </span>
                        <input
                          type="number"
                          step={100}
                          value={sub.feeAmount}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 0;
                            setEditFormSubjects((prev) =>
                              prev.map((s, i) =>
                                i === idx ? { ...s, feeAmount: val } : s,
                              ),
                            );
                          }}
                          style={{
                            width: "100%",
                            fontSize: "11px",
                            padding: "4px 6px",
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid var(--color-border)",
                            boxSizing: "border-box",
                          }}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (editFormSubjects.length <= 1) {
                            alert(
                              "A student must remain enrolled in at least one subject.",
                            );
                            return;
                          }
                          setEditFormSubjects((prev) =>
                            prev.filter((_, i) => i !== idx),
                          );
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#D32F2F",
                          cursor: "pointer",
                          fontSize: "14px",
                          padding: "2px",
                        }}
                        title="Remove subject enrollment"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "var(--space-2)",
                  borderTop: "1px solid var(--color-border)",
                  paddingTop: "var(--space-3)",
                }}
              >
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => setEditingStudent(null)}
                >
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. STATUS CHANGE CONFIRMATION DIALOG                                      */}
      {/* ========================================================================= */}
      {statusConfirmStudent && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setStatusConfirmStudent(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 120,
            padding: "var(--space-4)",
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Confirm Status Change"
        >
          <div
            style={{
              backgroundColor: "var(--color-surface)",
              borderRadius: "var(--radius-lg)",
              maxWidth: "460px",
              width: "100%",
              padding: "var(--space-6)",
              boxShadow: "var(--shadow-xl)",
              border: "1px solid var(--color-border)",
            }}
          >
            <h3
              style={{
                fontSize: "var(--text-base)",
                fontWeight: 700,
                margin: "0 0 var(--space-2)",
              }}
            >
              Confirm Status Transition
            </h3>
            <p
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--color-neutral-dark)",
                lineHeight: 1.5,
                margin: "0 0 var(--space-4)",
              }}
            >
              Are you sure you want to transition{" "}
              <strong>{statusConfirmStudent.student.name}</strong> from{" "}
              <Badge variant="neutral" size="sm">
                {statusConfirmStudent.student.studentStatus}
              </Badge>{" "}
              to{" "}
              <Badge
                variant={
                  statusConfirmStudent.targetStatus === "active"
                    ? "success"
                    : "neutral"
                }
                size="sm"
              >
                {statusConfirmStudent.targetStatus}
              </Badge>
              ? Their historical payment ledger records, classroom test marks,
              and attendance archives will remain safely intact.
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "var(--space-2)",
              }}
            >
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setStatusConfirmStudent(null)}
              >
                Cancel
              </Button>
              <Button
                variant={
                  statusConfirmStudent.targetStatus === "active"
                    ? "primary"
                    : "secondary"
                }
                size="sm"
                onClick={handleConfirmStatusChange}
              >
                Confirm{" "}
                {statusConfirmStudent.targetStatus === "active"
                  ? "Activation"
                  : "Deactivation"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. IN-PROFILE PAYMENT AUDIT LEDGER MODAL                                  */}
      {/* ========================================================================= */}
      {auditLedgerModal && auditLedgerModal.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setAuditLedgerModal(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--space-4)",
            zIndex: 120,
          }}
        >
          <div
            style={{
              backgroundColor: "var(--color-surface)",
              borderRadius: "var(--radius-xl)",
              maxWidth: "600px",
              width: "100%",
              boxShadow: "var(--shadow-xl)",
              border: "1px solid var(--color-border)",
              padding: "var(--space-6)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "var(--space-3)",
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: "var(--text-lg)",
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  Payment Audit History
                </h3>
                <span
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-neutral-dark)",
                  }}
                >
                  {auditLedgerModal.studentName} &bull;{" "}
                  {auditLedgerModal.subjectName} ({auditLedgerModal.monthLabel})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAuditLedgerModal(null)}
                style={{
                  fontSize: "18px",
                  color: "var(--color-neutral-dark)",
                  cursor: "pointer",
                  background: "none",
                  border: "none",
                }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "var(--space-2)",
                padding: "var(--space-3)",
                backgroundColor: "var(--color-surface-muted)",
                borderRadius: "var(--radius-md)",
                marginBottom: "var(--space-4)",
                textAlign: "center",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--color-neutral-dark)",
                  }}
                >
                  Obligation
                </div>
                <div style={{ fontSize: "var(--text-sm)", fontWeight: 700 }}>
                  ₹{auditLedgerModal.feeAmount.toLocaleString()}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--color-neutral-dark)",
                  }}
                >
                  Total Paid
                </div>
                <div
                  style={{
                    fontSize: "var(--text-sm)",
                    fontWeight: 700,
                    color: "var(--color-success)",
                  }}
                >
                  ₹{auditLedgerModal.paidAmount.toLocaleString()}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--color-neutral-dark)",
                  }}
                >
                  Balance
                </div>
                <div
                  style={{
                    fontSize: "var(--text-sm)",
                    fontWeight: 700,
                    color:
                      auditLedgerModal.balance > 0
                        ? "var(--color-warning)"
                        : "var(--color-neutral-dark)",
                  }}
                >
                  ₹{auditLedgerModal.balance.toLocaleString()}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: "var(--space-4)" }}>
              <span
                style={{
                  fontSize: "var(--text-xs)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--color-neutral-dark)",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                Individual Transaction Records (
                {auditLedgerModal.payments.length})
              </span>

              {auditLedgerModal.payments.length === 0 ? (
                <p
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-neutral-dark)",
                    margin: "4px 0",
                  }}
                >
                  No cash or online payments recorded for this monthly
                  obligation yet.
                </p>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  {auditLedgerModal.payments.map((tx) => (
                    <div
                      key={tx.id}
                      style={{
                        padding: "8px 12px",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-sm)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: "var(--text-xs)",
                      }}
                    >
                      <div>
                        <strong>{tx.referenceId}</strong> &bull;{" "}
                        {tx.paymentDate}
                        <div
                          style={{
                            fontSize: "10px",
                            color: "var(--color-neutral-dark)",
                          }}
                        >
                          Collector: {tx.collectedByName} (
                          {tx.paymentMethod.toUpperCase()})
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            color: "var(--color-success)",
                          }}
                        >
                          ₹{tx.amount.toLocaleString()}
                        </span>
                        {selectedStudent && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              handleOpenReceiptModal(
                                tx,
                                auditLedgerModal.obligation,
                                auditLedgerModal.enrollment,
                                selectedStudent,
                              )
                            }
                            style={{ fontSize: "10px", padding: "2px 6px" }}
                          >
                            Receipt
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setAuditLedgerModal(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TEACHER PROFILE INSPECTION MODAL (Faculty Directory)                   */}
      {/* ========================================================================= */}
      {selectedTeacher && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedTeacher(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "var(--space-4)",
          }}
          role="dialog"
          aria-modal="true"
          aria-label={`Faculty Profile: ${selectedTeacher.name}`}
        >
          <div
            style={{
              backgroundColor: "var(--color-surface)",
              borderRadius: "var(--radius-xl)",
              maxWidth: "520px",
              width: "100%",
              padding: "var(--space-6)",
              boxShadow: "var(--shadow-xl)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "var(--space-4)",
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-2)",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "var(--text-lg)",
                      fontWeight: 700,
                      margin: 0,
                    }}
                  >
                    {selectedTeacher.name}
                  </h3>
                  <Badge
                    variant={
                      (selectedTeacher.status || "active") === "active"
                        ? "success"
                        : "neutral"
                    }
                    size="sm"
                  >
                    {(selectedTeacher.status || "active") === "active"
                      ? "Active Staff"
                      : "Inactive"}
                  </Badge>
                </div>
                <span
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-neutral-dark)",
                    display: "block",
                    marginTop: "2px",
                  }}
                >
                  Faculty ID: {selectedTeacher.id.toUpperCase()} &bull;{" "}
                  {selectedTeacher.email}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTeacher(null)}
                style={{
                  fontSize: "18px",
                  color: "var(--color-neutral-dark)",
                  cursor: "pointer",
                  background: "none",
                  border: "none",
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: "var(--space-3)" }}>
              <span
                style={{
                  fontSize: "var(--text-xs)",
                  fontWeight: 600,
                  display: "block",
                  marginBottom: "4px",
                }}
              >
                Teaching Specializations:
              </span>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {selectedTeacher.assignedSubjects &&
                selectedTeacher.assignedSubjects.length > 0 ? (
                  selectedTeacher.assignedSubjects.map((sub) => (
                    <Badge key={sub} variant="accent" size="sm">
                      {sub}
                    </Badge>
                  ))
                ) : (
                  <span
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--color-neutral-dark)",
                      fontStyle: "italic",
                    }}
                  >
                    No subjects assigned
                  </span>
                )}
              </div>
            </div>

            <div style={{ marginBottom: "var(--space-4)" }}>
              <span
                style={{
                  fontSize: "var(--text-xs)",
                  fontWeight: 600,
                  display: "block",
                  marginBottom: "4px",
                }}
              >
                Assigned Batches:
              </span>
              {selectedTeacher.batches && selectedTeacher.batches.length > 0 ? (
                <ul
                  style={{
                    paddingLeft: "var(--space-4)",
                    fontSize: "var(--text-xs)",
                    color: "var(--color-neutral-dark)",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {selectedTeacher.batches.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              ) : (
                <span
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-neutral-dark)",
                    fontStyle: "italic",
                  }}
                >
                  No batches assigned
                </span>
              )}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleToggleTeacherStatus(selectedTeacher.id)}
                style={{ fontSize: "11px" }}
              >
                {(selectedTeacher.status || "active") === "active"
                  ? "Deactivate Faculty"
                  : "Activate Faculty"}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedTeacher(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. PRINTABLE ACADEMIC MERIT CERTIFICATE MODAL                             */}
      {/* ========================================================================= */}
      {activeCertificate && (
        <ExamCertificateModal
          isOpen={Boolean(activeCertificate)}
          onClose={() => setActiveCertificate(null)}
          certificate={activeCertificate}
        />
      )}

      {/* ========================================================================= */}
      {/* 9. FLOW A: SIMULATED ACCOUNT INVITATION MODAL                              */}
      {/* ========================================================================= */}
      {isInviteModalOpen && selectedStudent && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsInviteModalOpen(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 130,
            padding: "var(--space-4)",
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Provision Portal Account (Flow A)"
        >
          <div
            style={{
              backgroundColor: "var(--color-surface)",
              borderRadius: "var(--radius-xl)",
              maxWidth: "500px",
              width: "100%",
              padding: "var(--space-6)",
              boxShadow: "var(--shadow-xl)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "var(--space-4)",
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: "var(--text-lg)",
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  Provision Portal Account (Flow A)
                </h3>
                <span
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-neutral-dark)",
                  }}
                >
                  Academic Record: <strong>{selectedStudent.name}</strong> (
                  {selectedStudent.id.toUpperCase()})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                style={{
                  fontSize: "18px",
                  color: "var(--color-neutral-dark)",
                  cursor: "pointer",
                  background: "none",
                  border: "none",
                }}
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleInitiateInvitation}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-4)",
              }}
            >
              <div
                style={{
                  padding: "8px 12px",
                  backgroundColor: "rgba(0, 122, 255, 0.08)",
                  border: "1px solid rgba(0, 122, 255, 0.25)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "11px",
                  color: "var(--color-primary)",
                  lineHeight: 1.5,
                }}
              >
                ℹ️ <strong>Demo Simulation Note:</strong> In this frontend
                environment, no external email service or real SMTP provider is
                invoked. An honest demo invitation code will be registered in
                local state, ready for 1-click activation simulation.
              </div>

              <div>
                <label
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Account Role *
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) =>
                    setInviteRole(e.target.value as "student" | "parent")
                  }
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    fontSize: "var(--text-xs)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <option value="student">Student Portal Account</option>
                  <option value="parent">
                    Parent / Guardian Portal Account
                  </option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Login Identifier (Email or Phone) *
                </label>
                <input
                  type="text"
                  required
                  value={inviteIdentifier}
                  onChange={(e) => setInviteIdentifier(e.target.value)}
                  placeholder={
                    inviteRole === "student"
                      ? "e.g. ayan@student.aroush.in"
                      : "e.g. imran.parent@example.com"
                  }
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    fontSize: "var(--text-xs)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-border)",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "var(--space-2)",
                  borderTop: "1px solid var(--color-border)",
                  paddingTop: "var(--space-3)",
                }}
              >
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={isInviting}
                >
                  {isInviting
                    ? "Provisioning..."
                    : "Generate Simulated Invitation"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. PRINTABLE OFFICIAL FEE RECEIPT MODAL                                   */}
      {/* ========================================================================= */}
      {activeReceipt && (
        <FeeReceiptModal
          isOpen={activeReceipt.isOpen}
          onClose={() => setActiveReceipt(null)}
          transaction={activeReceipt.transaction}
          obligation={activeReceipt.obligation}
          student={activeReceipt.student}
          enrollment={activeReceipt.enrollment}
          remainingBalanceAfterPayment={
            activeReceipt.remainingBalanceAfterPayment
          }
        />
      )}
    </div>
  );
}
