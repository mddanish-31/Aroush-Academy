"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  UserRole,
  MetricItem,
  PaymentTransaction,
  FeePaymentStatus,
  StudentProfile,
  TeacherProfile,
  MonthlyFeeObligation,
  SubjectEnrollment,
} from "@/types";
import { MetricCard } from "./MetricCard";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { DigitalIdCard } from "./DigitalIdCard";
import { IdCardManagementModule } from "./IdCardManagementModule";
import { SAMPLE_ID_CARDS } from "@/data/studentIdCardsData";
import { StudentIdCardRecord } from "@/types";
import { FeeReceiptModal } from "./FeeReceiptModal";
import { AttendanceModule } from "./AttendanceModule";
import { TimetableModule } from "./TimetableModule";
import { AssessmentsModule } from "./AssessmentsModule";
import { StudyMaterialsModule } from "./StudyMaterialsModule";
import { NoticesModule } from "./NoticesModule";
import { DirectoryModule } from "./DirectoryModule";
import { AcademicSetupModule } from "./AcademicSetupModule";
import { AuditLogsModule } from "./AuditLogsModule";
import { ClassroomModule } from "./ClassroomModule";
import { RegistrationApprovalsModule } from "./RegistrationApprovalsModule";
import { FeesModule } from "./FeesModule";
import { useDemoStorage, DEMO_STORAGE_KEYS } from "@/lib/demoStorage";
import { recordCreate } from "@/lib/auditService";
import {
  SAMPLE_TEACHERS,
  SAMPLE_STUDENTS,
  SAMPLE_ENROLLMENTS,
  SAMPLE_OBLIGATIONS,
  SAMPLE_PAYMENTS,
  buildEnrollmentSummaries,
} from "@/data/enrollmentFeeData";

function generateReceiptCode(
  enrollmentId: string,
  obligationId: string,
): string {
  const seed = (enrollmentId + obligationId)
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 1000);
  return `CSH-2026-${(seed % 9000) + 1000}`;
}

interface DashboardShellProps {
  initialRole?: UserRole;
}

const ROLE_METRICS: Record<UserRole, MetricItem[]> = {
  "academy-admin": [
    {
      id: "enrolled",
      label: "Academy Enrollments",
      value: "9 Active",
      delta: "5 Students",
      deltaType: "positive",
    },
    {
      id: "fees",
      label: "Monthly Target",
      value: "₹13,800",
      delta: "Oct 2026",
      deltaType: "neutral",
    },
    {
      id: "collected",
      label: "Realized Collection",
      value: "₹3,900",
      delta: "28.3% collected",
      deltaType: "positive",
    },
    {
      id: "overdue",
      label: "Overdue (Sep 2026)",
      value: "₹1,400",
      delta: "1 Student pending",
      deltaType: "warning",
    },
  ],
  teacher: [
    {
      id: "my-students",
      label: "Assigned Enrollments",
      value: "4 Students",
      delta: "Active Batches",
      deltaType: "positive",
    },
    {
      id: "fee-target",
      label: "Subject Monthly Fee",
      value: "₹6,200",
      delta: "Oct 2026 Target",
      deltaType: "neutral",
    },
    {
      id: "fee-collected",
      label: "Subject Fee Realized",
      value: "₹2,500",
      delta: "40.3% Collected",
      deltaType: "positive",
    },
    {
      id: "fee-pending",
      label: "Subject Fee Balance",
      value: "₹3,700",
      delta: "Oct Dues",
      deltaType: "warning",
    },
  ],
  student: [
    {
      id: "enrolled-subs",
      label: "Enrolled Subjects",
      value: "2 Subjects",
      delta: "Maths & Physics",
      deltaType: "positive",
    },
    {
      id: "oct-target",
      label: "October Fee Target",
      value: "₹2,900",
      delta: "Oct 2026",
      deltaType: "neutral",
    },
    {
      id: "oct-paid",
      label: "October Cleared",
      value: "₹2,900",
      delta: "100% Cleared",
      deltaType: "positive",
    },
    {
      id: "attendance-rate",
      label: "Attendance Record",
      value: "96%",
      delta: "Consistent",
      deltaType: "positive",
    },
  ],
  parent: [
    {
      id: "linked-ward",
      label: "Linked Ward",
      value: "Taha Rahman",
      delta: "Class X • ICSE",
      deltaType: "positive",
    },
    {
      id: "ward-subs",
      label: "Ward's Subjects",
      value: "2 Enrolled",
      delta: "Maths & Physics",
      deltaType: "positive",
    },
    {
      id: "fee-status",
      label: "Oct Fee Standing",
      value: "₹2,900 Paid",
      delta: "₹0 Balance Due",
      deltaType: "positive",
    },
    {
      id: "attendance",
      label: "Monthly Attendance",
      value: "96.5%",
      delta: "2 Leaves Excused",
      deltaType: "neutral",
    },
  ],
};

const ROLE_NAV_ITEMS: Record<UserRole, string[]> = {
  "academy-admin": [
    "Overview & Fee Ledger",
    "Registration Approvals",
    "Students & Faculty Directory",
    "Academic Setup & Batches",
    "Attendance Tracking",
    "Timetable & Rooms",
    "Online Classrooms",
    "Examinations",
    "Study Materials",
    "Notices & Circulars",
    "Digital Student IDs",
    "Audit Logs",
  ],
  teacher: [
    "Overview",
    "Online Classroom",
    "My Students",
    "Subject Fee Tracking",
    "Attendance",
    "Timetable & Batches",
    "Test Series & Marks",
    "Study Materials",
    "Notices",
  ],
  student: [
    "Overview",
    "Online Classroom",
    "Enrolled Subjects",
    "Timetable & Schedule",
    "Attendance Record",
    "Tests & Marks",
    "Study Materials",
    "Notices & Circulars",
    "Fee Receipts & History",
    "Digital Student ID",
  ],
  parent: [
    "Overview",
    "Online Classroom",
    "Child's Subjects",
    "Timetable & Schedule",
    "Attendance Record",
    "Tests & Marks",
    "Study Materials",
    "Notices & Circulars",
    "Fee Receipts & Ledger",
    "Digital Student ID",
  ],
};

const ROLES_LIST: { id: UserRole; name: string }[] = [
  { id: "academy-admin", name: "Academy Admin" },
  { id: "teacher", name: "Teacher" },
  { id: "student", name: "Student" },
  { id: "parent", name: "Parent" },
];

export function DashboardShell({
  initialRole = "teacher",
}: DashboardShellProps) {
  const rolesList = ROLES_LIST;

  const { user, isAuthenticated, logout, registrationRequests } = useAuth();
  const searchParams = useSearchParams();
  const queryRole = searchParams
    ? (searchParams.get("role") as UserRole | null)
    : null;

  // STRICT DEMO ISOLATION:
  // When an authenticated session is active, the role is strictly locked to user.role.
  // URL query params like ?role=academy-admin CANNOT elevate or switch an authenticated student/teacher session.
  // Query role is only honored for guest exploration when not authenticated.
  const resolvedRole: UserRole = useMemo(() => {
    if (
      isAuthenticated &&
      user?.role &&
      ROLES_LIST.some((r) => r.id === user.role)
    ) {
      return user.role;
    }
    if (
      !isAuthenticated &&
      queryRole &&
      ROLES_LIST.some((r) => r.id === queryRole)
    ) {
      return queryRole;
    }
    return initialRole;
  }, [isAuthenticated, user?.role, queryRole, initialRole]);

  const [prevResolvedRole, setPrevResolvedRole] =
    useState<UserRole>(resolvedRole);
  const [activeRole, setActiveRole] = useState<UserRole>(resolvedRole);
  const [activeTab, setActiveTab] = useState<string>(() =>
    resolvedRole === "academy-admin" ? "Overview & Fee Ledger" : "Overview",
  );

  const pendingRegistrationsCount = useMemo(
    () =>
      (registrationRequests || []).filter((r) => r.status === "pending").length,
    [registrationRequests],
  );

  // Synchronize activeRole and activeTab when resolvedRole changes during render
  if (resolvedRole !== prevResolvedRole) {
    setPrevResolvedRole(resolvedRole);
    setActiveRole(resolvedRole);
    if (
      resolvedRole === "academy-admin" &&
      (activeTab === "Overview" || activeTab === "Enrollments & Ledgers")
    ) {
      setActiveTab("Overview & Fee Ledger");
    } else if (
      resolvedRole !== "academy-admin" &&
      (activeTab === "Overview & Fee Ledger" || activeTab === "Audit Logs")
    ) {
      setActiveTab("Overview");
    }
  }

  // Ensure activeRole cannot drift away from authenticated identity
  if (isAuthenticated && activeRole !== resolvedRole) {
    setActiveRole(resolvedRole);
  }

  // Canonical tab alias resolution for Academy Admin merged page
  const isAcademyOverviewOrLedger =
    activeRole === "academy-admin" &&
    (activeTab === "Overview & Fee Ledger" ||
      activeTab === "Overview" ||
      activeTab === "Enrollments & Ledgers" ||
      activeTab === "Academy Enrollments" ||
      activeTab === "Subject Fee Ledgers");

  if (
    activeRole === "academy-admin" &&
    isAcademyOverviewOrLedger &&
    activeTab !== "Overview & Fee Ledger"
  ) {
    setActiveTab("Overview & Fee Ledger");
  }
  if (
    activeRole !== "academy-admin" &&
    (activeTab === "Overview & Fee Ledger" || activeTab === "Audit Logs")
  ) {
    setActiveTab("Overview");
  }

  // Teacher portal state: active teacher switcher for multi-teacher demonstration
  const [selectedTeacherId, setSelectedTeacherId] =
    useState<string>("tch-azhar");

  // Reactive payment transactions ledger (persists recorded payments across browser reloads & role switches)
  const [payments, setPayments] = useDemoStorage<PaymentTransaction[]>(
    DEMO_STORAGE_KEYS.PAYMENTS,
    SAMPLE_PAYMENTS,
  );

  // Reactive students and enrollments lists
  const [students] = useDemoStorage<StudentProfile[]>(
    DEMO_STORAGE_KEYS.STUDENTS,
    SAMPLE_STUDENTS,
  );
  const [enrollments] = useDemoStorage<SubjectEnrollment[]>(
    DEMO_STORAGE_KEYS.ENROLLMENTS,
    SAMPLE_ENROLLMENTS,
  );
  const [obligations] = useDemoStorage<MonthlyFeeObligation[]>(
    DEMO_STORAGE_KEYS.OBLIGATIONS,
    SAMPLE_OBLIGATIONS,
  );
  const [faculty] = useDemoStorage<TeacherProfile[]>(
    DEMO_STORAGE_KEYS.FACULTY,
    SAMPLE_TEACHERS,
  );
  const [idCardRecords, setIdCardRecords] = useDemoStorage<StudentIdCardRecord[]>(
    DEMO_STORAGE_KEYS.STUDENT_ID_CARDS,
    SAMPLE_ID_CARDS,
  );


  // Payment Recording Modal State
  const [recordingModal, setRecordingModal] = useState<{
    isOpen: boolean;
    enrollmentId: string;
    studentName: string;
    subjectName: string;
    obligationId: string;
    feeAmount: number;
    balance: number;
  } | null>(null);

  const [cashAmountInput, setCashAmountInput] = useState<string>(" ");
  const [receiptNumberInput, setReceiptNumberInput] = useState<string>("");
  const [notesInput, setNotesInput] = useState<string>("");

  // Payment History Inspection Modal State
  const [historyModal, setHistoryModal] = useState<{
    isOpen: boolean;
    studentName: string;
    subjectName: string;
    monthLabel: string;
    feeAmount: number;
    paidAmount: number;
    balance: number;
    status: FeePaymentStatus;
    payments: PaymentTransaction[];
  } | null>(null);

  // Active demo student for Student portal (defaults to Taha Rahman - std-101)
  const [selectedStudentId, setSelectedStudentId] = useState<string>("std-101");

  // Receipt Modal State (printable single-page voucher)
  const [receiptModal, setReceiptModal] = useState<{
    isOpen: boolean;
    transaction: PaymentTransaction;
    obligation: MonthlyFeeObligation;
    student: StudentProfile;
    enrollment: SubjectEnrollment;
    remainingBalanceAfterPayment: number;
  } | null>(null);

  // Digital ID Card Modal State
  const [idCardModalStudent, setIdCardModalStudent] =
    useState<StudentProfile | null>(null);
  const [idCardModalRecord, setIdCardModalRecord] =
    useState<StudentIdCardRecord | null>(null);
  const [autoPrintIdCard, setAutoPrintIdCard] = useState<boolean>(false);

  const openIdCardModal = (
    student: StudentProfile,
    autoPrint = false,
    cardRecord?: StudentIdCardRecord,
  ) => {
    setIdCardModalStudent(student);
    setIdCardModalRecord(
      cardRecord || idCardRecords.find((c) => c.studentId === student.id) || null,
    );
    setAutoPrintIdCard(autoPrint);
  };


  // Escape key handler for dashboard payment modals
  useEffect(() => {
    if (!recordingModal && !historyModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setRecordingModal(null);
        setHistoryModal(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [recordingModal, historyModal]);

  // Active Teacher Profile (Strict isolation: only authenticated or selected teacher)
  const currentTeacher = useMemo(() => {
    if (isAuthenticated && activeRole === "teacher") {
      const linkedId = user?.linkedTeacherId || user?.profileId;
      if (linkedId) {
        const found = faculty.find((t) => t.id === linkedId);
        if (found) return found;
      }
    }
    return (
      faculty.find((t) => t.id === selectedTeacherId) ||
      faculty[0] ||
      SAMPLE_TEACHERS[0]
    );
  }, [
    isAuthenticated,
    activeRole,
    user?.linkedTeacherId,
    user?.profileId,
    selectedTeacherId,
    faculty,
  ]);

  // Compute all enrollment fee summaries reactively based on current payments state
  const allSummaries = useMemo(() => {
    return buildEnrollmentSummaries(enrollments, obligations, payments);
  }, [enrollments, obligations, payments]);

  // Teacher view: STRICT ISOLATION - ONLY enrollments assigned to this teacher!
  const teacherSummaries = useMemo(() => {
    return allSummaries.filter(
      (s) => s.enrollment.teacherId === currentTeacher.id,
    );
  }, [allSummaries, currentTeacher.id]);

  // Teacher KPIs calculated live
  const teacherKPIs = useMemo(() => {
    const studentCount = teacherSummaries.length;
    const target = teacherSummaries.reduce(
      (acc, curr) => acc + curr.currentMonthObligation.feeAmount,
      0,
    );
    const realized = teacherSummaries.reduce(
      (acc, curr) => acc + curr.currentMonthPaid,
      0,
    );
    const balance = teacherSummaries.reduce(
      (acc, curr) => acc + curr.currentMonthBalance,
      0,
    );
    return { studentCount, target, realized, balance };
  }, [teacherSummaries]);



  // Active Student Profile (Strict isolation: only this student's records)
  const currentStudent = useMemo<StudentProfile | null>(() => {
    if (isAuthenticated && activeRole === "student") {
      const linkedId = user?.linkedStudentId || user?.profileId;
      if (!linkedId) return null;
      return students.find((s) => s.id === linkedId) || null;
    }
    return (
      students.find((s) => s.id === selectedStudentId) || null
    );
  }, [
    isAuthenticated,
    activeRole,
    user,
    students,
    selectedStudentId,
  ]);

  const studentEnrollments = useMemo(() => {
    if (!currentStudent) return [];
    return enrollments.filter((e) => e.studentId === currentStudent.id);
  }, [enrollments, currentStudent]);

  const studentSummaries = useMemo(() => {
    if (!currentStudent) return [];
    return allSummaries.filter(
      (s) => s.enrollment.studentId === currentStudent.id,
    );
  }, [allSummaries, currentStudent]);

  const studentPayments = useMemo(() => {
    if (!currentStudent) return [];
    return payments.filter((p) => p.studentId === currentStudent.id);
  }, [payments, currentStudent]);

  const studentKPIs = useMemo(() => {
    const subjectsCount = studentEnrollments.length;
    const target = studentSummaries.reduce(
      (acc, curr) => acc + curr.currentMonthObligation.feeAmount,
      0,
    );
    const paid = studentSummaries.reduce(
      (acc, curr) => acc + curr.currentMonthPaid,
      0,
    );
    const balance = studentSummaries.reduce(
      (acc, curr) => acc + curr.currentMonthBalance,
      0,
    );
    return { subjectsCount, target, paid, balance };
  }, [studentEnrollments, studentSummaries]);

  // Parent Linked Student Profile (Strict isolation: only explicitly linked child)
  const parentStudent = useMemo<StudentProfile | null>(() => {
    if (isAuthenticated && activeRole === "parent") {
      const linkedIds =
        user?.linkedStudentIds ||
        (user?.linkedStudentId ? [user.linkedStudentId] : (user?.profileId ? [user.profileId] : []));
      if (linkedIds && linkedIds.length > 0) {
        return students.find((s) => linkedIds.includes(s.id)) || null;
      }
      return null;
    }
    return students.find((s) => s.id === "std-101") || null;
  }, [
    isAuthenticated,
    activeRole,
    user,
    students,
  ]);

  const parentEnrollments = useMemo(() => {
    if (!parentStudent) return [];
    return enrollments.filter((e) => e.studentId === parentStudent.id);
  }, [enrollments, parentStudent]);

  const parentSummaries = useMemo(() => {
    if (!parentStudent) return [];
    return allSummaries.filter(
      (s) => s.enrollment.studentId === parentStudent.id,
    );
  }, [allSummaries, parentStudent]);

  const parentPayments = useMemo(() => {
    if (!parentStudent) return [];
    return payments.filter((p) => p.studentId === parentStudent.id);
  }, [payments, parentStudent]);

  // Open Official Fee Receipt Modal for any transaction
  const openReceiptModal = (tx: PaymentTransaction) => {
    const obligation = obligations.find((o) => o.id === tx.obligationId) || {
      id: tx.obligationId,
      enrollmentId: tx.enrollmentId,
      studentId: tx.studentId,
      studentName: "",
      subjectName: "",
      teacherId: "",
      month: "2026-10",
      monthLabel: "October 2026",
      feeAmount: tx.amount,
      dueDate: "2026-10-15",
    };
    const enrollment = enrollments.find((e) => e.id === tx.enrollmentId) || {
      id: tx.enrollmentId,
      studentId: tx.studentId,
      studentName: "",
      classGrade: "Class X",
      subjectName: "Subject",
      teacherId: "tch-azhar",
      teacherName: "Faculty",
      batchName: "Batch Alpha",
      enrollmentDate: "2026-04-10",
      monthlyFeeAmount: tx.amount,
      status: "active" as const,
    };
    const student =
      students.find((s) => s.id === tx.studentId) ||
      currentStudent ||
      students[0] ||
      SAMPLE_STUDENTS[0];

    const txsForObligation = payments.filter(
      (p) => p.obligationId === obligation.id,
    );
    const totalPaid = txsForObligation.reduce((sum, p) => sum + p.amount, 0);
    const remaining = Math.max(0, obligation.feeAmount - totalPaid);

    setReceiptModal({
      isOpen: true,
      transaction: tx,
      obligation,
      student,
      enrollment,
      remainingBalanceAfterPayment: remaining,
    });
  };

  const currentNav = ROLE_NAV_ITEMS[activeRole] || ROLE_NAV_ITEMS["teacher"];

  // Open Cash Payment Entry Modal
  const openCashPaymentModal = (
    enrollmentId: string,
    studentName: string,
    subjectName: string,
    obligationId: string,
    feeAmount: number,
    balance: number,
  ) => {
    setRecordingModal({
      isOpen: true,
      enrollmentId,
      studentName,
      subjectName,
      obligationId,
      feeAmount,
      balance,
    });
    setCashAmountInput(balance.toString());
    setReceiptNumberInput(generateReceiptCode(enrollmentId, obligationId));
    setNotesInput("Authorized cash collected in classroom");
  };

  // Submit Cash Payment
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordingModal) return;

    const parsedAmount = parseFloat(cashAmountInput);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    const enr = enrollments.find((e) => e.id === recordingModal.enrollmentId);
    const resolvedStudentId =
      enr?.studentId ||
      (recordingModal.enrollmentId.startsWith("enr-")
        ? `std-${recordingModal.enrollmentId.split("-")[1]}`
        : recordingModal.enrollmentId);

    const newTx: PaymentTransaction = {
      id: `tx-${Date.now()}`,
      obligationId: recordingModal.obligationId,
      enrollmentId: recordingModal.enrollmentId,
      studentId: resolvedStudentId,
      amount: parsedAmount,
      paymentDate: "2026-10-10",
      paymentMethod: "cash",
      referenceId: receiptNumberInput.trim() || `CSH-MANUAL-${Date.now()}`,
      collectedByRole:
        activeRole === "academy-admin" ? "academy-admin" : "teacher",
      collectedByName:
        activeRole === "academy-admin"
          ? "Academy Admin Office"
          : currentTeacher.name,
      isGatewayVerified: false, // strictly false for manual cash entries
      notes: notesInput.trim(),
    };

    setPayments((prev) => [newTx, ...prev]);

    // Record Central Audit Entry
    recordCreate({
      action: "Record Cash Fee Payment",
      type: "financial",
      target: `Obligation #${recordingModal.obligationId} (${resolvedStudentId})`,
      details: `Recorded cash fee collection of ₹${parsedAmount.toLocaleString("en-IN")} against ${recordingModal.obligationId}. Receipt ref: ${newTx.referenceId}.`,
      performedBy:
        activeRole === "academy-admin"
          ? "Academy Admin Office"
          : currentTeacher.name,
      actorRole: activeRole,
      entityType: "payment",
      entityId: newTx.id,
      outcome: "SUCCESS",
      changedFields: ["amount", "paymentMethod", "referenceId"],
      diff: [
        { fieldName: "amount", before: 0, after: parsedAmount },
        { fieldName: "paymentMethod", after: "cash" },
        { fieldName: "referenceId", after: newTx.referenceId },
      ],
      sourcePortal: activeRole,
    });

    setRecordingModal(null);
  };

  const getStatusBadge = (status: FeePaymentStatus) => {
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
          <Badge
            variant="neutral"
            size="sm"
            style={{ color: "#FF3B30", borderColor: "rgba(255, 59, 48, 0.3)" }}
          >
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
        minHeight: "calc(100vh - 68px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Mobile Contextual Selector Strip (Visible on mobile where sidebar collapses) */}
      <div
        className="mobile-context-bar"
        style={{
          display: "none",
          backgroundColor: "var(--color-surface-muted)",
          borderBottom: "1px solid var(--color-border)",
          padding: "var(--space-2) var(--space-4)",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "var(--space-2)",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: "var(--color-neutral-dark)",
          }}
        >
          {rolesList.find((r) => r.id === activeRole)?.name} View:
        </span>
        {activeRole === "teacher" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: "9px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: "var(--color-accent)",
                backgroundColor: "rgba(0, 122, 255, 0.08)",
                padding: "2px 6px",
                borderRadius: "var(--radius-sm)",
              }}
            >
              Demo Simulation
            </span>
            <label
              htmlFor="mobile-teacher-select"
              style={{
                fontSize: "11px",
                color: "var(--color-neutral-dark)",
                whiteSpace: "nowrap",
              }}
            >
              Simulated Faculty:
            </label>
            <select
              id="mobile-teacher-select"
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              aria-label="Demo Tool: Switch simulated instructor (does not alter logged-in account)"
              title="Demonstration control: changes view isolation without changing logged-in account"
              style={{
                fontSize: "var(--text-xs)",
                padding: "4px 8px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-surface)",
                color: "var(--color-primary)",
                maxWidth: "180px",
              }}
            >
              {faculty.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.assignedSubjects?.[0] || "Faculty"})
                </option>
              ))}
            </select>
          </div>
        )}
        {activeRole === "student" && (
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            style={{
              fontSize: "var(--text-xs)",
              padding: "4px 8px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-surface)",
              color: "var(--color-primary)",
            }}
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.classGrade})
              </option>
            ))}
          </select>
        )}
        {activeRole === "parent" && (
          <span
            style={{
              fontSize: "11px",
              color: "var(--color-accent)",
              fontWeight: 600,
            }}
          >
            Ward: Taha Rahman (AA-2026-101)
          </span>
        )}
      </div>

      {/* Mobile Dashboard Navigation (Visible on screens <= 768px where sidebar collapses) */}
      <nav
        className="mobile-dashboard-nav"
        aria-label="Mobile dashboard module navigation"
        style={{
          display: "none",
          backgroundColor: "var(--color-surface)",
          borderBottom: "1px solid var(--color-border)",
          padding: "var(--space-2) var(--space-4)",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--space-2)",
            marginBottom: "6px",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--color-neutral-dark)",
            }}
          >
            Module:{" "}
            <strong style={{ color: "var(--color-primary)" }}>
              {activeTab}
            </strong>
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <label
              htmlFor="mobile-module-select"
              style={{ fontSize: "11px", color: "var(--color-neutral-dark)" }}
            >
              Jump:
            </label>
            <select
              id="mobile-module-select"
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              aria-label="Jump to dashboard module"
              style={{
                fontSize: "var(--text-xs)",
                padding: "3px 8px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-surface-muted)",
                color: "var(--color-primary)",
                fontWeight: 600,
                cursor: "pointer",
                maxWidth: "180px",
              }}
            >
              {currentNav.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Horizontally scrollable navigation strip */}
        <div
          role="tablist"
          aria-label="Dashboard modules tabs"
          className="mobile-nav-scroll-strip"
          style={{
            display: "flex",
            gap: "6px",
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            paddingBottom: "2px",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            width: "100%",
          }}
        >
          {currentNav.map((item) => {
            const isActive = activeTab === item;
            return (
              <button
                key={item}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => setActiveTab(item)}
                style={{
                  fontSize: "12px",
                  fontWeight: isActive ? 600 : 500,
                  padding: "5px 12px",
                  borderRadius: "var(--radius-full)",
                  backgroundColor: isActive
                    ? "var(--color-primary)"
                    : "var(--color-surface-muted)",
                  color: isActive ? "#FFFFFF" : "var(--color-neutral-dark)",
                  border: "1px solid",
                  borderColor: isActive
                    ? "var(--color-primary)"
                    : "var(--color-border)",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>{item}</span>
                {item === "Registration Approvals" &&
                  pendingRegistrationsCount > 0 && (
                    <span
                      style={{
                        backgroundColor: isActive
                          ? "#FFFFFF"
                          : "var(--color-warning)",
                        color: isActive ? "var(--color-primary)" : "#FFFFFF",
                        fontSize: "10px",
                        fontWeight: 700,
                        padding: "1px 6px",
                        borderRadius: "var(--radius-full)",
                      }}
                    >
                      {pendingRegistrationsCount}
                    </span>
                  )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Layout: Sidebar + Canvas */}
      <div style={{ display: "flex", flex: 1 }}>
        {/* Sidebar */}
        <aside
          role="navigation"
          aria-label="Dashboard navigation"
          style={{
            width: "250px",
            backgroundColor: "var(--color-surface)",
            borderRight: "1px solid var(--color-border)",
            padding: "var(--space-6) var(--space-4)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-5)",
          }}
          className="dashboard-sidebar"
        >
          <div>
            <span
              style={{
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--color-neutral-dark)",
                fontWeight: 600,
              }}
            >
              {isAuthenticated ? "Active Workspace" : "Workspace Preview"}
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginTop: "4px",
              }}
            >
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "var(--radius-full)",
                  backgroundColor: isAuthenticated
                    ? "var(--color-accent)"
                    : "var(--color-neutral-dark)",
                }}
              />
              <span
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: 700,
                  color: "var(--color-primary)",
                }}
              >
                {rolesList.find((r) => r.id === activeRole)?.name}{" "}
                {!isAuthenticated ? "(Guest Preview)" : ""}
              </span>
            </div>

            {/* Contextual Teacher Identity / Demo Switcher */}
            {activeRole === "teacher" && (
              <div
                style={{
                  marginTop: "var(--space-3)",
                  padding: "var(--space-3)",
                  backgroundColor: "var(--color-surface-muted)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                }}
              >
                {isAuthenticated ? (
                  <>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "var(--color-neutral-dark)",
                        textTransform: "uppercase",
                      }}
                    >
                      Authenticated Faculty
                    </span>
                    <strong
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--color-primary)",
                        display: "block",
                        marginTop: "2px",
                      }}
                    >
                      {currentTeacher.name}
                    </strong>
                    <span
                      style={{
                        fontSize: "10px",
                        color: "var(--color-neutral-dark)",
                        display: "block",
                        marginTop: "2px",
                      }}
                    >
                      Specialization:{" "}
                      {currentTeacher.assignedSubjects.join(", ")}
                    </span>
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "4px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "9px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          color: "var(--color-accent)",
                          backgroundColor: "rgba(0, 122, 255, 0.08)",
                          padding: "2px 6px",
                          borderRadius: "var(--radius-sm)",
                        }}
                      >
                        Demo Simulation
                      </span>
                      <span
                        style={{
                          fontSize: "10px",
                          color: "var(--color-neutral-dark)",
                        }}
                      >
                        Guest preview
                      </span>
                    </div>
                    <label
                      htmlFor="teacher-select"
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "var(--color-primary)",
                        display: "block",
                        marginBottom: "4px",
                      }}
                    >
                      Demo Tool — Switch Simulated Faculty:
                    </label>
                    <select
                      id="teacher-select"
                      value={selectedTeacherId}
                      onChange={(e) => setSelectedTeacherId(e.target.value)}
                      aria-label="Demo Tool: Switch simulated instructor"
                      style={{
                        width: "100%",
                        fontSize: "var(--text-xs)",
                        padding: "6px 8px",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--color-border)",
                        backgroundColor: "var(--color-surface)",
                        color: "var(--color-primary)",
                        fontWeight: 500,
                      }}
                    >
                      {faculty.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({(t.assignedSubjects || []).join(", ")})
                        </option>
                      ))}
                    </select>
                  </>
                )}
              </div>
            )}

            {/* Contextual Student Identity / Demo Switcher */}
            {activeRole === "student" && (
              <div
                style={{
                  marginTop: "var(--space-3)",
                  padding: "var(--space-3)",
                  backgroundColor: "var(--color-surface-muted)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                }}
              >
                {isAuthenticated ? (
                  <>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "var(--color-neutral-dark)",
                        textTransform: "uppercase",
                      }}
                    >
                      Authenticated Student Record
                    </span>
                    {currentStudent ? (
                      <>
                        <strong
                          style={{
                            fontSize: "var(--text-xs)",
                            color: "var(--color-primary)",
                            display: "block",
                            marginTop: "2px",
                          }}
                        >
                          {currentStudent.name}
                        </strong>
                        <span
                          style={{
                            fontSize: "10px",
                            color: "var(--color-neutral-dark)",
                            display: "block",
                            marginTop: "2px",
                          }}
                        >
                          ID: {currentStudent.id.toUpperCase()} &bull;{" "}
                          {currentStudent.classGrade} ({currentStudent.board})
                        </span>
                      </>
                    ) : (
                      <div
                        style={{
                          fontSize: "11px",
                          color: "var(--color-warning)",
                          marginTop: "2px",
                          fontWeight: 600,
                        }}
                      >
                        Unlinked Account (No Student Record)
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <label
                      htmlFor="student-select"
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "var(--color-neutral-dark)",
                        display: "block",
                        marginBottom: "4px",
                      }}
                    >
                      Demonstrate Student View:
                    </label>
                    <select
                      id="student-select"
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      style={{
                        width: "100%",
                        fontSize: "var(--text-xs)",
                        padding: "6px 8px",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--color-border)",
                        backgroundColor: "var(--color-surface)",
                        color: "var(--color-primary)",
                        fontWeight: 500,
                      }}
                    >
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.classGrade})
                        </option>
                      ))}
                    </select>
                  </>
                )}
              </div>
            )}

            {/* Contextual Parent Linkage Indicator */}
            {activeRole === "parent" && (
              <div
                style={{
                  marginTop: "var(--space-3)",
                  padding: "var(--space-3)",
                  backgroundColor: "rgba(0, 122, 255, 0.06)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid rgba(0, 122, 255, 0.15)",
                }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "var(--color-accent)",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    display: "block",
                  }}
                >
                  {isAuthenticated
                    ? "Linked Ward Account"
                    : "Demo Guardian Link"}
                </span>
                {parentStudent ? (
                  <>
                    <strong
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--color-primary)",
                        display: "block",
                        marginTop: "2px",
                      }}
                    >
                      {parentStudent.name}
                    </strong>
                    <span
                      style={{
                        fontSize: "10px",
                        color: "var(--color-neutral-dark)",
                        display: "block",
                        marginTop: "2px",
                      }}
                    >
                      Ward ID: {parentStudent.id.toUpperCase()} &bull;{" "}
                      {parentStudent.classGrade}
                    </span>
                  </>
                ) : (
                  <span
                    style={{
                      fontSize: "11px",
                      color: "var(--color-warning)",
                      display: "block",
                      marginTop: "2px",
                      fontWeight: 600,
                    }}
                  >
                    Unresolved Guardian Link
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {currentNav.map((item) => (
              <button
                key={item}
                onClick={() => setActiveTab(item)}
                style={{
                  textAlign: "left",
                  padding: "8px 12px",
                  fontSize: "var(--text-sm)",
                  borderRadius: "var(--radius-md)",
                  backgroundColor:
                    activeTab === item ? "var(--color-primary)" : "transparent",
                  color:
                    activeTab === item
                      ? "#FFFFFF"
                      : "var(--color-neutral-dark)",
                  fontWeight: activeTab === item ? 600 : 400,
                  transition: "all var(--transition-fast)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span>{item}</span>
                {item === "Registration Approvals" &&
                  pendingRegistrationsCount > 0 && (
                    <span
                      style={{
                        backgroundColor:
                          activeTab === item
                            ? "#FFFFFF"
                            : "var(--color-warning)",
                        color:
                          activeTab === item
                            ? "var(--color-primary)"
                            : "#FFFFFF",
                        fontSize: "10px",
                        fontWeight: 700,
                        padding: "1px 6px",
                        borderRadius: "var(--radius-full)",
                      }}
                    >
                      {pendingRegistrationsCount}
                    </span>
                  )}
              </button>
            ))}
          </nav>

          <div
            style={{
              marginTop: "auto",
              borderTop: "1px solid var(--color-border)",
              paddingTop: "var(--space-4)",
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-2)",
            }}
          >
            {isAuthenticated ? (
              <button
                type="button"
                onClick={async () => {
                  await logout();
                }}
                style={{
                  fontSize: "var(--text-xs)",
                  color: "#D32F2F",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  cursor: "pointer",
                  textAlign: "left",
                  padding: 0,
                  background: "none",
                  border: "none",
                }}
                aria-label="Sign out of demo session"
              >
                ← Sign Out of Demo Session
              </button>
            ) : (
              <Link
                href={`/login?role=${activeRole}`}
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-accent)",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                Sign In with Demo Persona →
              </Link>
            )}
            <Link
              href="/"
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--color-neutral-dark)",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              ← Back to Public Website
            </Link>
          </div>
        </aside>

        {/* Main Canvas */}
        <main
          className="dashboard-content-area"
          style={{
            flex: 1,
            padding: "var(--space-8)",
            backgroundColor: "var(--color-bg)",
            overflowY: "auto",
          }}
        >
          <div style={{ maxWidth: "1160px", margin: "0 auto" }}>
            {/* UX Scaffolding Guard Banner if not logged in */}
            {!isAuthenticated && (
              <div
                style={{
                  backgroundColor: "rgba(0, 122, 255, 0.06)",
                  border: "1px solid rgba(0, 122, 255, 0.2)",
                  borderRadius: "var(--radius-md)",
                  padding: "var(--space-3) var(--space-4)",
                  marginBottom: "var(--space-6)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "var(--space-2)",
                }}
                role="note"
                aria-label="Guest Preview notice"
              >
                <div
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-primary)",
                    lineHeight: 1.5,
                  }}
                >
                  <strong>Guest Preview Mode:</strong> You are viewing a
                  demonstration preview of the{" "}
                  {rolesList.find((r) => r.id === activeRole)?.name} workspace
                  as an unauthenticated guest. Sign in with an academy account
                  to access your official records.
                </div>
                <Link
                  href={`/login?role=${activeRole}`}
                  style={{
                    fontSize: "var(--text-xs)",
                    fontWeight: 600,
                    color: "var(--color-accent)",
                    whiteSpace: "nowrap",
                  }}
                >
                  Sign In to {rolesList.find((r) => r.id === activeRole)?.name}{" "}
                  →
                </Link>
              </div>
            )}
            {/* Top Workspace Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "var(--space-6)",
                flexWrap: "wrap",
                gap: "var(--space-3)",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-neutral-dark)",
                  }}
                >
                  Portals / {rolesList.find((r) => r.id === activeRole)?.name} /{" "}
                  {activeTab}
                </span>
                <h1 style={{ fontSize: "var(--text-2xl)", marginTop: "2px" }}>
                  {activeRole === "teacher"
                    ? `${currentTeacher.name} • ${activeTab}`
                    : activeRole === "academy-admin"
                      ? `Academy Admin • ${activeTab}`
                      : `${activeTab}`}
                  {!isAuthenticated && (
                    <span
                      style={{
                        fontSize: "var(--text-sm)",
                        fontWeight: 500,
                        color: "var(--color-neutral-dark)",
                        marginLeft: "var(--space-2)",
                      }}
                    >
                      (Guest Preview)
                    </span>
                  )}
                </h1>
                {activeRole === "teacher" && (
                  <span
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--color-accent)",
                      fontWeight: 500,
                    }}
                  >
                    Assigned: {currentTeacher.assignedSubjects.join(", ")}{" "}
                    &bull; {currentTeacher.batches.join(" & ")}
                  </span>
                )}
              </div>
              <Badge variant="neutral" size="md">
                Subject-Wise Architecture Mode
              </Badge>
            </div>

            {/* KPI Metrics */}
            {(activeRole !== "academy-admin" || isAcademyOverviewOrLedger) && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "var(--space-4)",
                  marginBottom: "var(--space-6)",
                }}
              >
                {activeRole === "teacher" ? (
                  <>
                    <MetricCard
                      metric={{
                        id: "t-stu",
                        label: "My Assigned Students",
                        value: `${teacherKPIs.studentCount}`,
                        delta: currentTeacher.assignedSubjects.join(", "),
                        deltaType: "positive",
                      }}
                    />
                    <MetricCard
                      metric={{
                        id: "t-tgt",
                        label: "Monthly Subject Fee Target",
                        value: `₹${teacherKPIs.target.toLocaleString()}`,
                        delta: "October 2026",
                        deltaType: "neutral",
                      }}
                    />
                    <MetricCard
                      metric={{
                        id: "t-col",
                        label: "Realized Collection",
                        value: `₹${teacherKPIs.realized.toLocaleString()}`,
                        delta: `${Math.round((teacherKPIs.realized / (teacherKPIs.target || 1)) * 100)}% Collected`,
                        deltaType: "positive",
                      }}
                    />
                    <MetricCard
                      metric={{
                        id: "t-bal",
                        label: "Subject Fee Balance",
                        value: `₹${teacherKPIs.balance.toLocaleString()}`,
                        delta: "Pending",
                        deltaType: "warning",
                      }}
                    />
                  </>
                ) : activeRole === "student" ? (
                  currentStudent ? (
                    <>
                      <MetricCard
                        metric={{
                          id: "s-subs",
                          label: "Enrolled Subjects",
                          value: `${studentKPIs.subjectsCount} Subjects`,
                          delta:
                            studentEnrollments
                              .map((e) => e.subjectName)
                              .join(" & ") || "None",
                          deltaType: "positive",
                        }}
                      />
                      <MetricCard
                        metric={{
                          id: "s-tgt",
                          label: "October Fee Obligation",
                          value: `₹${studentKPIs.target.toLocaleString()}`,
                          delta: "October 2026",
                          deltaType: "neutral",
                        }}
                      />
                      <MetricCard
                        metric={{
                          id: "s-paid",
                          label: "October Cleared",
                          value: `₹${studentKPIs.paid.toLocaleString()}`,
                          delta:
                            studentKPIs.balance === 0
                              ? "100% Cleared"
                              : `₹${studentKPIs.balance} Pending`,
                          deltaType:
                            studentKPIs.balance === 0 ? "positive" : "warning",
                        }}
                      />
                      <MetricCard
                        metric={{
                          id: "s-att",
                          label: "Academic Attendance",
                          value: "96.0%",
                          delta: "Consistent",
                          deltaType: "positive",
                        }}
                      />
                    </>
                  ) : (
                    <>
                      <MetricCard
                        metric={{
                          id: "s-rec",
                          label: "Academic Student Record",
                          value: "Unlinked",
                          delta: "Admin Action Required",
                          deltaType: "warning",
                        }}
                      />
                      <MetricCard
                        metric={{
                          id: "s-tgt",
                          label: "October Fee Obligation",
                          value: "₹0",
                          delta: "No Active Enrollments",
                          deltaType: "neutral",
                        }}
                      />
                      <MetricCard
                        metric={{
                          id: "s-paid",
                          label: "October Cleared",
                          value: "₹0",
                          delta: "Unlinked Portal",
                          deltaType: "neutral",
                        }}
                      />
                      <MetricCard
                        metric={{
                          id: "s-att",
                          label: "Academic Attendance",
                          value: "N/A",
                          delta: "Awaiting Record Binding",
                          deltaType: "neutral",
                        }}
                      />
                    </>
                  )
                ) : activeRole === "parent" ? (
                  parentStudent ? (
                    <>
                      <MetricCard
                        metric={{
                          id: "p-ward",
                          label: "Linked Ward",
                          value: parentStudent.name,
                          delta: `${parentStudent.classGrade} • ${parentStudent.board}`,
                          deltaType: "positive",
                        }}
                      />
                      <MetricCard
                        metric={{
                          id: "p-subs",
                          label: "Ward's Subjects",
                          value: `${parentEnrollments.length} Enrolled`,
                          delta:
                            parentEnrollments
                              .map((e) => e.subjectName)
                              .join(" & ") || "None",
                          deltaType: "positive",
                        }}
                      />
                      <MetricCard
                        metric={{
                          id: "p-fees",
                          label: "October Fee Standing",
                          value: "₹2,900 Paid",
                          delta: "₹0 Outstanding",
                          deltaType: "positive",
                        }}
                      />
                      <MetricCard
                        metric={{
                          id: "p-att",
                          label: "Monthly Attendance",
                          value: "96.5%",
                          delta: "2 Excused Leaves",
                          deltaType: "neutral",
                        }}
                      />
                    </>
                  ) : (
                    <>
                      <MetricCard
                        metric={{
                          id: "p-ward",
                          label: "Linked Ward",
                          value: "Unresolved",
                          delta: "Admin Link Required",
                          deltaType: "warning",
                        }}
                      />
                      <MetricCard
                        metric={{
                          id: "p-subs",
                          label: "Ward's Subjects",
                          value: "0 Enrolled",
                          delta: "Awaiting Association",
                          deltaType: "neutral",
                        }}
                      />
                      <MetricCard
                        metric={{
                          id: "p-fees",
                          label: "October Fee Standing",
                          value: "₹0",
                          delta: "No Associated Ward",
                          deltaType: "neutral",
                        }}
                      />
                      <MetricCard
                        metric={{
                          id: "p-att",
                          label: "Monthly Attendance",
                          value: "N/A",
                          delta: "No Records",
                          deltaType: "neutral",
                        }}
                      />
                    </>
                  )
                ) : (
                  ROLE_METRICS["academy-admin"].map((m) => (
                    <MetricCard key={m.id} metric={m} />
                  ))
                )}
              </div>
            )}

            {/* TEACHER ROLE INTERFACES */}
            {activeRole === "teacher" && (
              <>
                {(activeTab === "Overview" ||
                  activeTab === "My Students" ||
                  activeTab === "Subject Fee Tracking") && (
                  <Card padding="lg" style={{ marginBottom: "var(--space-8)" }}>
                    {/* Header within card */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "var(--space-4)",
                        flexWrap: "wrap",
                        gap: "var(--space-2)",
                      }}
                    >
                      <div>
                        <h2 style={{ fontSize: "var(--text-lg)" }}>
                          {activeTab === "My Students"
                            ? `My Students (${currentTeacher.assignedSubjects.join(", ")})`
                            : `Subject-Wise Monthly Fee Tracking (${currentTeacher.assignedSubjects.join(", ")})`}
                        </h2>
                        <p
                          style={{
                            fontSize: "var(--text-xs)",
                            color: "var(--color-neutral-dark)",
                            margin: "2px 0 0",
                          }}
                        >
                          Strict isolation: Only students enrolled in your
                          subjects are accessible. Multi-subject students appear
                          separately per instructor.
                        </p>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "var(--space-2)",
                          flexWrap: "wrap",
                        }}
                      >
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setActiveTab("Online Classroom")}
                        >
                          🌐 Online Classrooms
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setActiveTab("Test Series & Marks")}
                        >
                          📝 Mock Exam Engine
                        </Button>
                        <Button
                          variant={
                            activeTab === "My Students"
                              ? "primary"
                              : "secondary"
                          }
                          size="sm"
                          onClick={() => setActiveTab("My Students")}
                        >
                          My Students
                        </Button>
                        <Button
                          variant={
                            activeTab === "Subject Fee Tracking"
                              ? "primary"
                              : "secondary"
                          }
                          size="sm"
                          onClick={() => setActiveTab("Subject Fee Tracking")}
                        >
                          Subject Fee Tracking
                        </Button>
                      </div>
                    </div>

                    {/* TAB 1: MY STUDENTS TABLE */}
                    {activeTab === "My Students" && (
                      <div style={{ overflowX: "auto" }}>
                        <table
                          style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            fontSize: "var(--text-sm)",
                            textAlign: "left",
                          }}
                        >
                          <thead>
                            <tr
                              style={{
                                borderBottom: "1px solid var(--color-border)",
                                color: "var(--color-neutral-dark)",
                                fontSize: "11px",
                                textTransform: "uppercase",
                              }}
                            >
                              <th style={{ padding: "10px 12px" }}>
                                Student Name
                              </th>
                              <th style={{ padding: "10px 12px" }}>
                                Class / Board
                              </th>
                              <th style={{ padding: "10px 12px" }}>
                                Subject &amp; Batch
                              </th>
                              <th style={{ padding: "10px 12px" }}>
                                Joining Date
                              </th>
                              <th style={{ padding: "10px 12px" }}>
                                Subject Enrolled
                              </th>
                              <th style={{ padding: "10px 12px" }}>
                                Monthly Fee
                              </th>
                              <th style={{ padding: "10px 12px" }}>Status</th>
                              <th
                                style={{
                                  padding: "10px 12px",
                                  textAlign: "right",
                                }}
                              >
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {teacherSummaries.map(
                              ({
                                enrollment,
                                currentMonthObligation,
                                currentMonthBalance,
                              }) => (
                                <tr
                                  key={enrollment.id}
                                  style={{
                                    borderBottom:
                                      "1px solid var(--color-border-subtle)",
                                  }}
                                >
                                  <td
                                    style={{
                                      padding: "12px",
                                      fontWeight: 600,
                                      color: "var(--color-primary)",
                                    }}
                                  >
                                    {enrollment.studentName}
                                  </td>
                                  <td
                                    style={{
                                      padding: "12px",
                                      color: "var(--color-neutral-dark)",
                                    }}
                                  >
                                    {enrollment.classGrade}
                                  </td>
                                  <td style={{ padding: "12px" }}>
                                    <span
                                      style={{
                                        fontWeight: 600,
                                        color: "var(--color-accent)",
                                      }}
                                    >
                                      {enrollment.subjectName}
                                    </span>
                                    <div
                                      style={{
                                        fontSize: "11px",
                                        color: "var(--color-neutral-dark)",
                                      }}
                                    >
                                      {enrollment.batchName}
                                    </div>
                                  </td>
                                  <td
                                    style={{
                                      padding: "12px",
                                      color: "var(--color-neutral-dark)",
                                      fontSize: "var(--text-xs)",
                                    }}
                                  >
                                    2026-04-10
                                  </td>
                                  <td
                                    style={{
                                      padding: "12px",
                                      color: "var(--color-neutral-dark)",
                                      fontSize: "var(--text-xs)",
                                    }}
                                  >
                                    {enrollment.enrollmentDate}
                                  </td>
                                  <td
                                    style={{ padding: "12px", fontWeight: 600 }}
                                  >
                                    ₹
                                    {enrollment.monthlyFeeAmount.toLocaleString()}
                                  </td>
                                  <td style={{ padding: "12px" }}>
                                    <Badge variant="success" size="sm">
                                      Active
                                    </Badge>
                                  </td>
                                  <td
                                    style={{
                                      padding: "12px",
                                      textAlign: "right",
                                    }}
                                  >
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() =>
                                        openCashPaymentModal(
                                          enrollment.id,
                                          enrollment.studentName,
                                          enrollment.subjectName,
                                          currentMonthObligation.id,
                                          currentMonthObligation.feeAmount,
                                          currentMonthBalance,
                                        )
                                      }
                                    >
                                      Record Cash
                                    </Button>
                                  </td>
                                </tr>
                              ),
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* TAB 2: SUBJECT FEE TRACKING TABLE */}
                    {activeTab === "Overview" && (
                      <div style={{ overflowX: "auto" }}>
                        <table
                          style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            fontSize: "var(--text-sm)",
                            textAlign: "left",
                          }}
                        >
                          <thead>
                            <tr
                              style={{
                                borderBottom: "1px solid var(--color-border)",
                                color: "var(--color-neutral-dark)",
                                fontSize: "11px",
                                textTransform: "uppercase",
                              }}
                            >
                              <th style={{ padding: "10px 12px" }}>
                                Student &amp; Subject
                              </th>
                              <th style={{ padding: "10px 12px" }}>
                                Monthly Fee
                              </th>
                              <th style={{ padding: "10px 12px" }}>
                                Oct 2026 Status
                              </th>
                              <th style={{ padding: "10px 12px" }}>
                                Oct Paid / Balance
                              </th>
                              <th style={{ padding: "10px 12px" }}>
                                Sep 2026 Status
                              </th>
                              <th style={{ padding: "10px 12px" }}>
                                Sep Paid / Balance
                              </th>
                              <th
                                style={{
                                  padding: "10px 12px",
                                  textAlign: "right",
                                }}
                              >
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {teacherSummaries.map((summary) => {
                              const {
                                enrollment,
                                currentMonthObligation,
                                currentMonthPaid,
                                currentMonthBalance,
                                currentMonthStatus,
                                previousMonthPaid = 0,
                                previousMonthBalance = 0,
                                previousMonthStatus = "paid",
                              } = summary;

                              return (
                                <tr
                                  key={enrollment.id}
                                  style={{
                                    borderBottom:
                                      "1px solid var(--color-border-subtle)",
                                  }}
                                >
                                  <td style={{ padding: "12px" }}>
                                    <div
                                      style={{
                                        fontWeight: 600,
                                        color: "var(--color-primary)",
                                      }}
                                    >
                                      {enrollment.studentName}
                                    </div>
                                    <span
                                      style={{
                                        fontSize: "11px",
                                        color: "var(--color-accent)",
                                        fontWeight: 500,
                                      }}
                                    >
                                      {enrollment.subjectName} (
                                      {enrollment.classGrade})
                                    </span>
                                  </td>
                                  <td
                                    style={{ padding: "12px", fontWeight: 600 }}
                                  >
                                    ₹
                                    {enrollment.monthlyFeeAmount.toLocaleString()}
                                  </td>
                                  <td style={{ padding: "12px" }}>
                                    {getStatusBadge(currentMonthStatus)}
                                  </td>
                                  <td style={{ padding: "12px" }}>
                                    <div style={{ fontSize: "var(--text-xs)" }}>
                                      Paid:{" "}
                                      <strong
                                        style={{
                                          color: "var(--color-success)",
                                        }}
                                      >
                                        ₹{currentMonthPaid.toLocaleString()}
                                      </strong>
                                    </div>
                                    <div
                                      style={{
                                        fontSize: "11px",
                                        color:
                                          currentMonthBalance > 0
                                            ? "var(--color-warning)"
                                            : "var(--color-neutral-dark)",
                                      }}
                                    >
                                      Due: ₹
                                      {currentMonthBalance.toLocaleString()}
                                    </div>
                                  </td>
                                  <td style={{ padding: "12px" }}>
                                    {getStatusBadge(previousMonthStatus)}
                                  </td>
                                  <td style={{ padding: "12px" }}>
                                    <div style={{ fontSize: "var(--text-xs)" }}>
                                      Paid: ₹
                                      {previousMonthPaid.toLocaleString()}
                                    </div>
                                    {previousMonthBalance > 0 && (
                                      <div
                                        style={{
                                          fontSize: "11px",
                                          color: "#FF3B30",
                                          fontWeight: 600,
                                        }}
                                      >
                                        Overdue: ₹
                                        {previousMonthBalance.toLocaleString()}
                                      </div>
                                    )}
                                  </td>
                                  <td
                                    style={{
                                      padding: "12px",
                                      textAlign: "right",
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        gap: "6px",
                                        justifyContent: "flex-end",
                                      }}
                                    >
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          setHistoryModal({
                                            isOpen: true,
                                            studentName: enrollment.studentName,
                                            subjectName: enrollment.subjectName,
                                            monthLabel:
                                              currentMonthObligation.monthLabel,
                                            feeAmount:
                                              currentMonthObligation.feeAmount,
                                            paidAmount: currentMonthPaid,
                                            balance: currentMonthBalance,
                                            status: currentMonthStatus,
                                            payments:
                                              summary.currentMonthPayments,
                                          })
                                        }
                                      >
                                        History
                                      </Button>
                                      {currentMonthBalance > 0 && (
                                        <Button
                                          variant="accent"
                                          size="sm"
                                          onClick={() =>
                                            openCashPaymentModal(
                                              enrollment.id,
                                              enrollment.studentName,
                                              enrollment.subjectName,
                                              currentMonthObligation.id,
                                              currentMonthObligation.feeAmount,
                                              currentMonthBalance,
                                            )
                                          }
                                        >
                                          Record Cash
                                        </Button>
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
                )}

                {/* TEACHER ADDITIONAL MODULES */}
                {activeTab === "Subject Fee Tracking" && (
                  <FeesModule
                    role="teacher"
                    currentTeacherId={currentTeacher.id}
                  />
                )}
                {activeTab === "Attendance" && (
                  <AttendanceModule
                    role="teacher"
                    currentTeacherId={currentTeacher.id}
                  />
                )}
                {activeTab === "Timetable & Batches" && (
                  <TimetableModule
                    role="teacher"
                    currentTeacherId={currentTeacher.id}
                  />
                )}
                {(activeTab === "Test Series & Marks" ||
                  activeTab === "Test Series") && (
                  <AssessmentsModule
                    role="teacher"
                    currentTeacherId={currentTeacher.id}
                  />
                )}
                {(activeTab === "Study Materials" ||
                  activeTab === "Curriculum") && (
                  <StudyMaterialsModule
                    role="teacher"
                    currentTeacherId={currentTeacher.id}
                  />
                )}
                {activeTab === "Notices" && <NoticesModule role="teacher" />}
                {(activeTab === "Online Classroom" ||
                  activeTab === "Live Classrooms") && (
                  <ClassroomModule
                    role="teacher"
                    currentTeacherId={currentTeacher.id}
                  />
                )}
              </>
            )}

            {/* ACADEMY ADMIN ROLE INTERFACES */}
            {activeRole === "academy-admin" && (
              <>
                {(activeTab === "Registration Approvals" ||
                  activeTab === "Pending Registrations") && (
                  <RegistrationApprovalsModule />
                )}

                {isAcademyOverviewOrLedger && pendingRegistrationsCount > 0 && (
                  <div
                    style={{
                      backgroundColor: "rgba(255, 149, 0, 0.08)",
                      border: "1px solid rgba(255, 149, 0, 0.3)",
                      borderRadius: "var(--radius-md)",
                      padding: "var(--space-3) var(--space-4)",
                      marginBottom: "var(--space-5)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "var(--space-3)",
                    }}
                    role="alert"
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-3)",
                      }}
                    >
                      <span style={{ fontSize: "20px" }}>⏳</span>
                      <div>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: "var(--text-xs)",
                            color: "var(--color-primary)",
                          }}
                        >
                          {pendingRegistrationsCount} Registration Application
                          {pendingRegistrationsCount > 1 ? "s" : ""} Awaiting
                          Review
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "var(--color-neutral-dark)",
                          }}
                        >
                          New student and parent accounts cannot sign in until
                          authorized by an administrator.
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => setActiveTab("Registration Approvals")}
                      style={{ fontSize: "11px", padding: "4px 12px" }}
                    >
                      Review Applications →
                    </Button>
                  </div>
                )}

                {isAcademyOverviewOrLedger && (
                  <FeesModule role="academy-admin" />
                )}

                {/* ACADEMY ADMIN ADDITIONAL MODULES */}
                {activeTab === "Students & Faculty Directory" && (
                  <DirectoryModule
                    onOpenDigitalId={(studentOrId) => {
                      const student =
                        typeof studentOrId === "string"
                          ? students.find((st) => st.id === studentOrId) ||
                            SAMPLE_STUDENTS.find((st) => st.id === studentOrId)
                          : studentOrId;
                      if (student) {
                        setSelectedStudentId(student.id);
                        openIdCardModal(student, false);
                      }
                    }}
                    onViewFeeLedger={() =>
                      setActiveTab("Overview & Fee Ledger")
                    }
                  />
                )}
                {(activeTab === "Academic Setup & Batches" ||
                  activeTab === "Academic Setup" ||
                  activeTab === "Batches Management" ||
                  activeTab === "Faculty & Batches") && <AcademicSetupModule />}
                {activeTab === "Attendance Tracking" && (
                  <AttendanceModule role="academy-admin" />
                )}
                {activeTab === "Timetable & Rooms" && (
                  <TimetableModule role="academy-admin" />
                )}
                {(activeTab === "Online Classrooms" ||
                  activeTab === "Live Classroom Sessions") && (
                  <ClassroomModule role="academy-admin" />
                )}
                {activeTab === "Examinations" && (
                  <AssessmentsModule role="academy-admin" />
                )}
                {(activeTab === "Study Materials" ||
                  activeTab === "Curriculum & Study Materials") && (
                  <StudyMaterialsModule role="academy-admin" />
                )}
                {activeTab === "Notices & Circulars" && (
                  <NoticesModule role="academy-admin" />
                )}
                {activeTab === "Audit Logs" && <AuditLogsModule role={activeRole} />}
                {(activeTab === "Digital Student IDs" ||
                  activeTab === "Digital IDs") && (
                  <IdCardManagementModule
                    students={students}
                    enrollments={enrollments}
                    idCardRecords={idCardRecords}
                    onUpdateIdCards={setIdCardRecords}
                    onOpenPrintModal={(student, card) =>
                      openIdCardModal(student, true, card)
                    }
                    actorName="Academy Administrator"
                  />
                )}

              </>
            )}

            {/* STUDENT ROLE WORKSPACE */}
            {activeRole === "student" &&
              (!currentStudent ? (
                <Card
                  padding="lg"
                  style={{ textAlign: "center", margin: "var(--space-6) 0" }}
                >
                  <div
                    style={{ fontSize: "40px", marginBottom: "var(--space-2)" }}
                  >
                    🔒
                  </div>
                  <h3
                    style={{
                      fontSize: "var(--text-lg)",
                      fontWeight: 700,
                      margin: "0 0 var(--space-2)",
                    }}
                  >
                    Unlinked Student Portal Account
                  </h3>
                  <p
                    style={{
                      fontSize: "var(--text-sm)",
                      color: "var(--color-neutral-dark)",
                      maxWidth: "540px",
                      margin: "0 auto var(--space-4)",
                      lineHeight: 1.5,
                    }}
                  >
                    Your authenticated account (
                    {user?.email || user?.identifier || "student session"}) is
                    not currently linked to an academic student record. In
                    compliance with AROUSH Academy isolation requirements,
                    access to live classrooms, tests, marks, study materials,
                    fee receipts, and digital student IDs is strictly reserved
                    for verified academic admission records.
                  </p>
                  <div
                    style={{
                      display: "inline-flex",
                      padding: "8px 16px",
                      backgroundColor: "var(--color-surface-muted)",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--color-border)",
                      fontSize: "12px",
                      color: "var(--color-primary)",
                    }}
                  >
                    Administrative Action: Request the Academy Admin to link
                    your login account to your student admission ID in the
                    Student Directory.
                  </div>
                </Card>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-6)",
                    marginBottom: "var(--space-8)",
                  }}
                >
                  {/* Student Profile Header & ID Card Quick Access */}
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
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "var(--space-3)",
                        }}
                      >
                        <div
                          style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "var(--radius-full)",
                            backgroundColor: "rgba(0, 122, 255, 0.12)",
                            color: "var(--color-accent)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: "18px",
                          }}
                        >
                          {currentStudent.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <h2
                              style={{
                                fontSize: "var(--text-lg)",
                                fontWeight: 700,
                                margin: 0,
                              }}
                            >
                              {currentStudent.name}
                            </h2>
                            <Badge variant="success" size="sm">
                              Active Student
                            </Badge>
                          </div>
                          <div
                            style={{
                              fontSize: "var(--text-xs)",
                              color: "var(--color-neutral-dark)",
                              marginTop: "2px",
                            }}
                          >
                            ID:{" "}
                            <strong style={{ color: "var(--color-accent)" }}>
                              AA-2026-{currentStudent.id.replace("std-", "")}
                            </strong>{" "}
                            &bull; {currentStudent.classGrade} (
                            {currentStudent.board}) &bull; Enrolled since{" "}
                            {currentStudent.joiningDate}
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: "var(--space-2)",
                          flexWrap: "wrap",
                        }}
                      >
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setActiveTab("Online Classroom")}
                          type="button"
                        >
                          🔴 Online Classroom
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setActiveTab("Tests & Marks")}
                          type="button"
                        >
                          📝 Mock Exams
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openIdCardModal(currentStudent, false)}
                          type="button"
                        >
                          Preview &amp; Print Digital ID
                        </Button>
                      </div>
                    </div>
                  </Card>

                  {/* Section 1: Subject-Wise Enrollments & Monthly Fee Status */}
                  {(activeTab === "Overview" ||
                    activeTab === "Enrolled Subjects") && (
                    <Card padding="lg">
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "var(--space-4)",
                          flexWrap: "wrap",
                          gap: "var(--space-2)",
                        }}
                      >
                        <div>
                          <h3
                            style={{
                              fontSize: "var(--text-base)",
                              fontWeight: 700,
                              margin: 0,
                            }}
                          >
                            Enrolled Subjects &amp; Fee Status (
                            {studentEnrollments.length})
                          </h3>
                          <p
                            style={{
                              fontSize: "var(--text-xs)",
                              color: "var(--color-neutral-dark)",
                              margin: "2px 0 0",
                            }}
                          >
                            Each subject enrollment is managed independently
                            with its assigned instructor, batch, and fee
                            schedule.
                          </p>
                        </div>
                      </div>

                      <div style={{ overflowX: "auto" }}>
                        <table
                          style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            fontSize: "var(--text-sm)",
                            textAlign: "left",
                          }}
                        >
                          <thead>
                            <tr
                              style={{
                                borderBottom: "1px solid var(--color-border)",
                                color: "var(--color-neutral-dark)",
                                fontSize: "11px",
                                textTransform: "uppercase",
                              }}
                            >
                              <th style={{ padding: "10px 12px" }}>Subject</th>
                              <th style={{ padding: "10px 12px" }}>
                                Faculty &amp; Batch
                              </th>
                              <th style={{ padding: "10px 12px" }}>
                                Enrolled Date
                              </th>
                              <th style={{ padding: "10px 12px" }}>
                                Monthly Fee
                              </th>
                              <th style={{ padding: "10px 12px" }}>
                                Oct 2026 Status
                              </th>
                              <th style={{ padding: "10px 12px" }}>
                                Oct Paid / Due
                              </th>
                              <th style={{ padding: "10px 12px" }}>
                                Sep 2026 Status
                              </th>
                              <th
                                style={{
                                  padding: "10px 12px",
                                  textAlign: "right",
                                }}
                              >
                                Subject Actions
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
                                previousMonthPaid = 0,
                                previousMonthStatus = "paid",
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
                                      padding: "12px",
                                      fontWeight: 700,
                                      color: "var(--color-primary)",
                                    }}
                                  >
                                    {enrollment.subjectName}
                                  </td>
                                  <td style={{ padding: "12px" }}>
                                    <div
                                      style={{
                                        fontWeight: 600,
                                        color: "var(--color-accent)",
                                      }}
                                    >
                                      {enrollment.teacherName}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: "11px",
                                        color: "var(--color-neutral-dark)",
                                      }}
                                    >
                                      {enrollment.batchName}
                                    </div>
                                  </td>
                                  <td
                                    style={{
                                      padding: "12px",
                                      fontSize: "var(--text-xs)",
                                      color: "var(--color-neutral-dark)",
                                    }}
                                  >
                                    {enrollment.enrollmentDate}
                                  </td>
                                  <td
                                    style={{ padding: "12px", fontWeight: 600 }}
                                  >
                                    ₹
                                    {enrollment.monthlyFeeAmount.toLocaleString()}
                                    /mo
                                  </td>
                                  <td style={{ padding: "12px" }}>
                                    {getStatusBadge(currentMonthStatus)}
                                  </td>
                                  <td style={{ padding: "12px" }}>
                                    <span
                                      style={{
                                        fontWeight: 600,
                                        color:
                                          currentMonthPaid > 0
                                            ? "var(--color-success)"
                                            : "inherit",
                                      }}
                                    >
                                      ₹{currentMonthPaid.toLocaleString()}
                                    </span>
                                    {currentMonthBalance > 0 && (
                                      <div
                                        style={{
                                          fontSize: "11px",
                                          color: "var(--color-warning)",
                                          fontWeight: 500,
                                        }}
                                      >
                                        Bal: ₹
                                        {currentMonthBalance.toLocaleString()}{" "}
                                        (Due {currentMonthObligation.dueDate})
                                      </div>
                                    )}
                                  </td>
                                  <td style={{ padding: "12px" }}>
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                      }}
                                    >
                                      {getStatusBadge(previousMonthStatus)}
                                      <span
                                        style={{
                                          fontSize: "11px",
                                          color: "var(--color-neutral-dark)",
                                        }}
                                      >
                                        ₹{previousMonthPaid.toLocaleString()}
                                      </span>
                                    </div>
                                  </td>
                                  <td
                                    style={{
                                      padding: "12px",
                                      textAlign: "right",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        justifyContent: "flex-end",
                                        gap: "6px",
                                        alignItems: "center",
                                      }}
                                    >
                                      {currentMonthBalance > 0 && (
                                        <Button
                                          variant="primary"
                                          size="sm"
                                          onClick={() =>
                                            setActiveTab("Fee Receipts & History")
                                          }
                                          style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "5px",
                                            padding: "5px 12px",
                                            fontSize: "11px",
                                            fontWeight: 600,
                                            borderRadius: "var(--radius-sm)",
                                            backgroundColor:
                                              "var(--color-accent)",
                                            borderColor: "var(--color-accent)",
                                          }}
                                        >
                                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            <rect x="2" y="5" width="20" height="14" rx="2" />
                                            <line x1="2" y1="10" x2="22" y2="10" />
                                          </svg>
                                          <span>Pay Now · ₹{currentMonthBalance.toLocaleString("en-IN")}</span>
                                        </Button>
                                      )}
                                      <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() =>
                                          setHistoryModal({
                                            isOpen: true,
                                            studentName: enrollment.studentName,
                                            subjectName: enrollment.subjectName,
                                            monthLabel:
                                              currentMonthObligation.monthLabel,
                                            feeAmount:
                                              currentMonthObligation.feeAmount,
                                            paidAmount: currentMonthPaid,
                                            balance: currentMonthBalance,
                                            status: currentMonthStatus,
                                            payments:
                                              summary.currentMonthPayments,
                                          })
                                        }
                                      >
                                        Fee History
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  )}

                  {/* Section 2: Fee Receipts & Payment History (Overview Preview) */}
                  {activeTab === "Overview" && (
                    <Card padding="lg">
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "var(--space-4)",
                          flexWrap: "wrap",
                          gap: "var(--space-2)",
                        }}
                      >
                        <div>
                          <h3
                            style={{
                              fontSize: "var(--text-base)",
                              fontWeight: 700,
                              margin: 0,
                            }}
                          >
                            Payment History &amp; Official Fee Receipts (
                            {studentPayments.length})
                          </h3>
                          <p
                            style={{
                              fontSize: "var(--text-xs)",
                              color: "var(--color-neutral-dark)",
                              margin: "2px 0 0",
                            }}
                          >
                            Instant receipt access for all recorded classroom
                            and online payments. Unpaid obligations do not have
                            receipts.
                          </p>
                        </div>
                      </div>

                      {studentPayments.length === 0 ? (
                        <div
                          style={{
                            padding: "var(--space-6)",
                            textAlign: "center",
                            color: "var(--color-neutral-dark)",
                          }}
                        >
                          No recorded payment transactions found for this
                          student.
                        </div>
                      ) : (
                        <div style={{ overflowX: "auto" }}>
                          <table
                            style={{
                              width: "100%",
                              borderCollapse: "collapse",
                              fontSize: "var(--text-sm)",
                              textAlign: "left",
                            }}
                          >
                            <thead>
                              <tr
                                style={{
                                  borderBottom: "1px solid var(--color-border)",
                                  color: "var(--color-neutral-dark)",
                                  fontSize: "11px",
                                  textTransform: "uppercase",
                                }}
                              >
                                <th style={{ padding: "10px 12px" }}>Date</th>
                                <th style={{ padding: "10px 12px" }}>
                                  Subject Reference
                                </th>
                                <th style={{ padding: "10px 12px" }}>
                                  Receipt / Ref No
                                </th>
                                <th style={{ padding: "10px 12px" }}>Amount</th>
                                <th style={{ padding: "10px 12px" }}>
                                  Payment Method
                                </th>
                                <th style={{ padding: "10px 12px" }}>
                                  Collected By
                                </th>
                                <th
                                  style={{
                                    padding: "10px 12px",
                                    textAlign: "right",
                                  }}
                                >
                                  Receipt Action
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {studentPayments.map((tx) => {
                                const enr = enrollments.find(
                                  (e) => e.id === tx.enrollmentId,
                                );
                                return (
                                  <tr
                                    key={tx.id}
                                    style={{
                                      borderBottom:
                                        "1px solid var(--color-border-subtle)",
                                    }}
                                  >
                                    <td
                                      style={{
                                        padding: "12px",
                                        fontSize: "var(--text-xs)",
                                      }}
                                    >
                                      {tx.paymentDate}
                                    </td>
                                    <td
                                      style={{
                                        padding: "12px",
                                        fontWeight: 600,
                                      }}
                                    >
                                      {enr?.subjectName || "Subject"}
                                      <div
                                        style={{
                                          fontSize: "11px",
                                          color: "var(--color-neutral-dark)",
                                          fontWeight: 400,
                                        }}
                                      >
                                        {enr?.teacherName}
                                      </div>
                                    </td>
                                    <td
                                      style={{
                                        padding: "12px",
                                        fontFamily: "var(--font-mono)",
                                        fontSize: "11px",
                                        color: "var(--color-primary)",
                                      }}
                                    >
                                      {tx.referenceId}
                                    </td>
                                    <td
                                      style={{
                                        padding: "12px",
                                        fontWeight: 700,
                                        color: "var(--color-success)",
                                      }}
                                    >
                                      ₹{tx.amount.toLocaleString()}
                                    </td>
                                    <td style={{ padding: "12px" }}>
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "4px",
                                        }}
                                      >
                                        <Badge
                                          variant={
                                            tx.paymentMethod === "cash"
                                              ? "neutral"
                                              : "accent"
                                          }
                                          size="sm"
                                        >
                                          {tx.paymentMethod.toUpperCase()}
                                        </Badge>
                                        {!tx.isGatewayVerified && (
                                          <span
                                            style={{
                                              fontSize: "10px",
                                              color:
                                                "var(--color-neutral-dark)",
                                            }}
                                          >
                                            [Manual Entry]
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td
                                      style={{
                                        padding: "12px",
                                        fontSize: "var(--text-xs)",
                                        color: "var(--color-neutral-dark)",
                                      }}
                                    >
                                      {tx.collectedByName}
                                    </td>
                                    <td
                                      style={{
                                        padding: "12px",
                                        textAlign: "right",
                                      }}
                                    >
                                      <Button
                                        variant="accent"
                                        size="sm"
                                        onClick={() => openReceiptModal(tx)}
                                      >
                                        View &amp; Print Receipt
                                      </Button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </Card>
                  )}

                  {/* Section 3: Digital ID Card Inline Preview */}
                  {(activeTab === "Overview" ||
                    activeTab === "Digital Student ID") &&
                    (() => {
                      const studentCardRecord = idCardRecords.find(
                        (c) => c.studentId === currentStudent.id,
                      );
                      const isCardApproved =
                        studentCardRecord?.status === "approved";

                      if (!isCardApproved) {
                        return (
                          <Card padding="lg">
                            <div
                              style={{
                                textAlign: "center",
                                padding: "40px 20px",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "40px",
                                  marginBottom: "12px",
                                }}
                              >
                                🪪
                              </div>
                              <h3
                                style={{
                                  fontSize: "var(--text-lg)",
                                  fontWeight: 700,
                                  margin: "0 0 6px",
                                  color: "var(--color-primary)",
                                }}
                              >
                                Your student ID card has not been issued yet.
                              </h3>
                              <p
                                style={{
                                  fontSize: "var(--text-xs)",
                                  color: "var(--color-neutral-dark)",
                                  maxWidth: "480px",
                                  margin: "0 auto 16px",
                                  lineHeight: 1.5,
                                }}
                              >
                                {studentCardRecord?.status === "pending-approval"
                                  ? "Your official academy identity card has been submitted and is currently pending administrative approval. Once verified by the registry, your credential will appear here."
                                  : studentCardRecord?.status === "draft"
                                  ? "Your identity credentials are currently being prepared by the administration. You will be able to preview and print your verified ID once issued."
                                  : studentCardRecord?.status === "inactive"
                                  ? "Your student ID card is currently inactive or has been revoked. Please contact the administrative office at Park Circus for reissue."
                                  : "No ID card record has been authored for your enrollment yet. Please request digital credential issuance from the academy office."}
                              </p>
                              <Badge
                                variant={
                                  studentCardRecord?.status === "pending-approval"
                                    ? "warning"
                                    : studentCardRecord?.status === "draft"
                                    ? "accent"
                                    : "neutral"
                                }
                              >
                                Status:{" "}
                                {studentCardRecord?.status
                                  ? studentCardRecord.status.toUpperCase()
                                  : "NOT CREATED"}
                              </Badge>
                            </div>
                          </Card>
                        );
                      }

                      return (
                        <Card padding="lg">
                          <div style={{ marginBottom: "var(--space-4)" }}>
                            <h3
                              style={{
                                fontSize: "var(--text-base)",
                                fontWeight: 700,
                                margin: 0,
                              }}
                            >
                              Official Digital Student Identity Card
                            </h3>
                            <p
                              style={{
                                fontSize: "var(--text-xs)",
                                color: "var(--color-neutral-dark)",
                                margin: "2px 0 0",
                              }}
                            >
                              Certified AROUSH Academy credential. Valid for campus
                              entry, laboratory access, and examination sessions.
                            </p>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              justifyContent: "center",
                              padding: "var(--space-2) 0",
                            }}
                          >
                            <DigitalIdCard
                              student={currentStudent}
                              enrollments={studentEnrollments}
                              cardRecord={studentCardRecord}
                              onPrint={() =>
                                openIdCardModal(
                                  currentStudent,
                                  true,
                                  studentCardRecord,
                                )
                              }
                            />
                          </div>
                        </Card>
                      );
                    })()}


                  {/* STUDENT ADDITIONAL MODULES */}
                  {activeTab === "Online Classroom" && (
                    <ClassroomModule
                      role="student"
                      currentStudentId={currentStudent.id}
                    />
                  )}
                  {activeTab === "Timetable & Schedule" && (
                    <TimetableModule
                      role="student"
                      currentStudentId={currentStudent.id}
                    />
                  )}
                  {activeTab === "Attendance Record" && (
                    <AttendanceModule
                      role="student"
                      currentStudentId={currentStudent.id}
                    />
                  )}
                  {activeTab === "Tests & Marks" && (
                    <AssessmentsModule
                      role="student"
                      currentStudentId={currentStudent.id}
                    />
                  )}
                  {activeTab === "Study Materials" && (
                    <StudyMaterialsModule
                      role="student"
                      currentStudentId={currentStudent.id}
                    />
                  )}
                  {activeTab === "Notices & Circulars" && (
                    <NoticesModule role="student" />
                  )}
                  {activeTab === "Fee Receipts & History" && (
                    <FeesModule
                      role="student"
                      studentId={currentStudent.id}
                    />
                  )}
                </div>
              ))}

            {/* PARENT ROLE WORKSPACE */}
            {activeRole === "parent" &&
              (!parentStudent ? (
                <Card
                  padding="lg"
                  style={{ textAlign: "center", margin: "var(--space-6) 0" }}
                >
                  <div
                    style={{ fontSize: "40px", marginBottom: "var(--space-2)" }}
                  >
                    👨‍👩‍👧
                  </div>
                  <h3
                    style={{
                      fontSize: "var(--text-lg)",
                      fontWeight: 700,
                      margin: "0 0 var(--space-2)",
                    }}
                  >
                    Unresolved Guardian-to-Ward Association
                  </h3>
                  <p
                    style={{
                      fontSize: "var(--text-sm)",
                      color: "var(--color-neutral-dark)",
                      maxWidth: "540px",
                      margin: "0 auto var(--space-4)",
                      lineHeight: 1.5,
                    }}
                  >
                    Your authenticated guardian account (
                    {user?.email || user?.identifier || "parent session"}) does
                    not currently have any associated student records in the
                    academy database. Under AROUSH Academy security policies,
                    parental access to class attendance, test results, fee
                    obligations, and identity cards is strictly isolated to
                    verified children.
                  </p>
                  <div
                    style={{
                      display: "inline-flex",
                      padding: "8px 16px",
                      backgroundColor: "var(--color-surface-muted)",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--color-border)",
                      fontSize: "12px",
                      color: "var(--color-primary)",
                    }}
                  >
                    Administrative Action: Contact the Academy Admin to link
                    your guardian profile to your child&apos;s student record.
                  </div>
                </Card>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-6)",
                    marginBottom: "var(--space-8)",
                  }}
                >
                  {/* Guardian Linked Profile Banner */}
                  <Card
                    padding="md"
                    style={{ borderLeft: "4px solid var(--color-accent)" }}
                  >
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
                            gap: "6px",
                          }}
                        >
                          <Badge variant="accent" size="sm">
                            Guardian Account
                          </Badge>
                          <span
                            style={{
                              fontSize: "var(--text-xs)",
                              color: "var(--color-neutral-dark)",
                            }}
                          >
                            Demo Parent-to-Student Association
                          </span>
                        </div>
                        <h2
                          style={{
                            fontSize: "var(--text-lg)",
                            fontWeight: 700,
                            margin: "4px 0 2px",
                          }}
                        >
                          Mrs. Amina Rahman &bull; Guardian of{" "}
                          {parentStudent.name}
                        </h2>
                        <div
                          style={{
                            fontSize: "var(--text-xs)",
                            color: "var(--color-neutral-dark)",
                          }}
                        >
                          Linked Student ID:{" "}
                          <strong style={{ color: "var(--color-accent)" }}>
                            AA-2026-101
                          </strong>{" "}
                          &bull; {parentStudent.classGrade} (
                          {parentStudent.board}) &bull; Contact:{" "}
                          {parentStudent.guardianPhone}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "var(--space-2)" }}>
                        <Button
                          variant="accent"
                          size="sm"
                          onClick={() => openIdCardModal(parentStudent, true)}
                          type="button"
                        >
                          Print Student ID
                        </Button>
                      </div>
                    </div>
                  </Card>

                  {/* Section 1: Child's Enrolled Subjects & Fee Status */}
                  {(activeTab === "Overview" ||
                    activeTab === "Child's Subjects") && (
                    <Card padding="lg">
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "var(--space-4)",
                          flexWrap: "wrap",
                          gap: "var(--space-2)",
                        }}
                      >
                        <div>
                          <h3
                            style={{
                              fontSize: "var(--text-base)",
                              fontWeight: 700,
                              margin: 0,
                            }}
                          >
                            {parentStudent.name}&apos;s Enrolled Subjects &amp;
                            Fee Status ({parentEnrollments.length})
                          </h3>
                          <p
                            style={{
                              fontSize: "var(--text-xs)",
                              color: "var(--color-neutral-dark)",
                              margin: "2px 0 0",
                            }}
                          >
                            Monthly tuition status across all enrolled subject
                            faculties.
                          </p>
                        </div>
                      </div>

                      <div style={{ overflowX: "auto" }}>
                        <table
                          style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            fontSize: "var(--text-sm)",
                            textAlign: "left",
                          }}
                        >
                          <thead>
                            <tr
                              style={{
                                borderBottom: "1px solid var(--color-border)",
                                color: "var(--color-neutral-dark)",
                                fontSize: "11px",
                                textTransform: "uppercase",
                              }}
                            >
                              <th style={{ padding: "10px 12px" }}>Subject</th>
                              <th style={{ padding: "10px 12px" }}>
                                Assigned Faculty
                              </th>
                              <th style={{ padding: "10px 12px" }}>Batch</th>
                              <th style={{ padding: "10px 12px" }}>
                                Monthly Obligation
                              </th>
                              <th style={{ padding: "10px 12px" }}>
                                Oct 2026 Status
                              </th>
                              <th style={{ padding: "10px 12px" }}>
                                Oct Paid / Due
                              </th>
                              <th style={{ padding: "10px 12px" }}>
                                Sep 2026 Status
                              </th>
                              <th
                                style={{
                                  padding: "10px 12px",
                                  textAlign: "right",
                                }}
                              >
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {parentSummaries.map((summary) => {
                              const {
                                enrollment,
                                currentMonthObligation,
                                currentMonthPaid,
                                currentMonthBalance,
                                currentMonthStatus,
                                previousMonthPaid = 0,
                                previousMonthStatus = "paid",
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
                                      padding: "12px",
                                      fontWeight: 700,
                                      color: "var(--color-primary)",
                                    }}
                                  >
                                    {enrollment.subjectName}
                                  </td>
                                  <td
                                    style={{
                                      padding: "12px",
                                      fontWeight: 600,
                                      color: "var(--color-accent)",
                                    }}
                                  >
                                    {enrollment.teacherName}
                                  </td>
                                  <td
                                    style={{
                                      padding: "12px",
                                      fontSize: "var(--text-xs)",
                                      color: "var(--color-neutral-dark)",
                                    }}
                                  >
                                    {enrollment.batchName}
                                  </td>
                                  <td
                                    style={{ padding: "12px", fontWeight: 600 }}
                                  >
                                    ₹
                                    {enrollment.monthlyFeeAmount.toLocaleString()}
                                    /mo
                                  </td>
                                  <td style={{ padding: "12px" }}>
                                    {getStatusBadge(currentMonthStatus)}
                                  </td>
                                  <td style={{ padding: "12px" }}>
                                    <span
                                      style={{
                                        fontWeight: 600,
                                        color: "var(--color-success)",
                                      }}
                                    >
                                      ₹{currentMonthPaid.toLocaleString()}
                                    </span>
                                    {currentMonthBalance > 0 && (
                                      <div
                                        style={{
                                          fontSize: "11px",
                                          color: "var(--color-warning)",
                                        }}
                                      >
                                        Pending: ₹
                                        {currentMonthBalance.toLocaleString()}{" "}
                                        (Due {currentMonthObligation.dueDate})
                                      </div>
                                    )}
                                  </td>
                                  <td style={{ padding: "12px" }}>
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                      }}
                                    >
                                      {getStatusBadge(previousMonthStatus)}
                                      <span
                                        style={{
                                          fontSize: "11px",
                                          color: "var(--color-neutral-dark)",
                                        }}
                                      >
                                        ₹{previousMonthPaid.toLocaleString()}
                                      </span>
                                    </div>
                                  </td>
                                  <td
                                    style={{
                                      padding: "12px",
                                      textAlign: "right",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {currentMonthBalance > 0 ? (
                                      <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() =>
                                          setActiveTab("Fee Receipts & Ledger")
                                        }
                                        style={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: "5px",
                                          padding: "5px 12px",
                                          fontSize: "11px",
                                          fontWeight: 600,
                                          borderRadius: "var(--radius-sm)",
                                          backgroundColor:
                                            "var(--color-accent)",
                                          borderColor: "var(--color-accent)",
                                        }}
                                      >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                          <rect x="2" y="5" width="20" height="14" rx="2" />
                                          <line x1="2" y1="10" x2="22" y2="10" />
                                        </svg>
                                        <span>Pay Now · ₹{currentMonthBalance.toLocaleString("en-IN")}</span>
                                      </Button>
                                    ) : (
                                      <Badge variant="success" size="sm">
                                        ✓ Paid
                                      </Badge>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  )}

                  {/* Section 2: Fee Receipts & Payment Ledger (Overview Preview) */}
                  {activeTab === "Overview" && (
                    <Card padding="lg">
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "var(--space-4)",
                          flexWrap: "wrap",
                          gap: "var(--space-2)",
                        }}
                      >
                        <div>
                          <h3
                            style={{
                              fontSize: "var(--text-base)",
                              fontWeight: 700,
                              margin: 0,
                            }}
                          >
                            Payment Records &amp; Downloadable Receipts (
                            {parentPayments.length})
                          </h3>
                          <p
                            style={{
                              fontSize: "var(--text-xs)",
                              color: "var(--color-neutral-dark)",
                              margin: "2px 0 0",
                            }}
                          >
                            Official vouchers for completed payments. Print or
                            save as PDF directly.
                          </p>
                        </div>
                      </div>

                      <div style={{ overflowX: "auto" }}>
                        <table
                          style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            fontSize: "var(--text-sm)",
                            textAlign: "left",
                          }}
                        >
                          <thead>
                            <tr
                              style={{
                                borderBottom: "1px solid var(--color-border)",
                                color: "var(--color-neutral-dark)",
                                fontSize: "11px",
                                textTransform: "uppercase",
                              }}
                            >
                              <th style={{ padding: "10px 12px" }}>Date</th>
                              <th style={{ padding: "10px 12px" }}>Subject</th>
                              <th style={{ padding: "10px 12px" }}>
                                Receipt Reference
                              </th>
                              <th style={{ padding: "10px 12px" }}>Amount</th>
                              <th style={{ padding: "10px 12px" }}>Method</th>
                              <th style={{ padding: "10px 12px" }}>
                                Collected By
                              </th>
                              <th
                                style={{
                                  padding: "10px 12px",
                                  textAlign: "right",
                                }}
                              >
                                Download Receipt
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {parentPayments.map((tx) => {
                              const enr = enrollments.find(
                                (e) => e.id === tx.enrollmentId,
                              );
                              return (
                                <tr
                                  key={tx.id}
                                  style={{
                                    borderBottom:
                                      "1px solid var(--color-border-subtle)",
                                  }}
                                >
                                  <td
                                    style={{
                                      padding: "12px",
                                      fontSize: "var(--text-xs)",
                                    }}
                                  >
                                    {tx.paymentDate}
                                  </td>
                                  <td
                                    style={{ padding: "12px", fontWeight: 600 }}
                                  >
                                    {enr?.subjectName || "Subject"}
                                  </td>
                                  <td
                                    style={{
                                      padding: "12px",
                                      fontFamily: "var(--font-mono)",
                                      fontSize: "11px",
                                    }}
                                  >
                                    {tx.referenceId}
                                  </td>
                                  <td
                                    style={{
                                      padding: "12px",
                                      fontWeight: 700,
                                      color: "var(--color-success)",
                                    }}
                                  >
                                    ₹{tx.amount.toLocaleString()}
                                  </td>
                                  <td style={{ padding: "12px" }}>
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px",
                                      }}
                                    >
                                      <Badge
                                        variant={
                                          tx.paymentMethod === "cash"
                                            ? "neutral"
                                            : "accent"
                                        }
                                        size="sm"
                                      >
                                        {tx.paymentMethod.toUpperCase()}
                                      </Badge>
                                      {!tx.isGatewayVerified && (
                                        <span
                                          style={{
                                            fontSize: "10px",
                                            color: "var(--color-neutral-dark)",
                                          }}
                                        >
                                          [Manual Entry]
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td
                                    style={{
                                      padding: "12px",
                                      fontSize: "var(--text-xs)",
                                      color: "var(--color-neutral-dark)",
                                    }}
                                  >
                                    {tx.collectedByName}
                                  </td>
                                  <td
                                    style={{
                                      padding: "12px",
                                      textAlign: "right",
                                    }}
                                  >
                                    <Button
                                      variant="accent"
                                      size="sm"
                                      onClick={() => openReceiptModal(tx)}
                                    >
                                      Print Official Receipt
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  )}

                  {/* Section 3: Digital ID Card Preview for Guardian */}
                  {(activeTab === "Overview" ||
                    activeTab === "Digital Student ID") &&
                    (() => {
                      const wardCardRecord = idCardRecords.find(
                        (c) => c.studentId === parentStudent.id,
                      );
                      const isCardApproved =
                        wardCardRecord?.status === "approved";

                      if (!isCardApproved) {
                        return (
                          <Card padding="lg">
                            <div
                              style={{
                                textAlign: "center",
                                padding: "40px 20px",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "40px",
                                  marginBottom: "12px",
                                }}
                              >
                                🪪
                              </div>
                              <h3
                                style={{
                                  fontSize: "var(--text-lg)",
                                  fontWeight: 700,
                                  margin: "0 0 6px",
                                  color: "var(--color-primary)",
                                }}
                              >
                                No official student ID card has been issued for{" "}
                                {parentStudent.name} yet.
                              </h3>
                              <p
                                style={{
                                  fontSize: "var(--text-xs)",
                                  color: "var(--color-neutral-dark)",
                                  maxWidth: "480px",
                                  margin: "0 auto 16px",
                                  lineHeight: 1.5,
                                }}
                              >
                                {wardCardRecord?.status === "pending-approval"
                                  ? "The student ID card for your ward is awaiting final administrative verification. It will become accessible here as soon as it is approved."
                                  : wardCardRecord?.status === "draft"
                                  ? "Identity card information for your ward is currently being processed by the administrative office."
                                  : wardCardRecord?.status === "inactive"
                                  ? "The student ID card for this student is currently marked inactive or revoked."
                                  : "The academy has not yet created an identity card record for this student. Please contact the administrative office to request issuance."}
                              </p>
                              <Badge
                                variant={
                                  wardCardRecord?.status === "pending-approval"
                                    ? "warning"
                                    : wardCardRecord?.status === "draft"
                                    ? "accent"
                                    : "neutral"
                                }
                              >
                                Status:{" "}
                                {wardCardRecord?.status
                                  ? wardCardRecord.status.toUpperCase()
                                  : "NOT CREATED"}
                              </Badge>
                            </div>
                          </Card>
                        );
                      }

                      return (
                        <Card padding="lg">
                          <div style={{ marginBottom: "var(--space-4)" }}>
                            <h3
                              style={{
                                fontSize: "var(--text-base)",
                                fontWeight: 700,
                                margin: 0,
                              }}
                            >
                              {parentStudent.name}&apos;s Digital Student ID
                              Card
                            </h3>
                            <p
                              style={{
                                fontSize: "var(--text-xs)",
                                color: "var(--color-neutral-dark)",
                                margin: "2px 0 0",
                              }}
                            >
                              Official verified credential for{" "}
                              {parentStudent.name} ({parentStudent.classGrade} ·{" "}
                              {parentStudent.board}). Use browser print to save
                              as PDF.
                            </p>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              justifyContent: "center",
                              padding: "var(--space-2) 0",
                            }}
                          >
                            <DigitalIdCard
                              student={parentStudent}
                              enrollments={parentEnrollments}
                              cardRecord={wardCardRecord}
                              onPrint={() =>
                                openIdCardModal(
                                  parentStudent,
                                  true,
                                  wardCardRecord,
                                )
                              }
                            />
                          </div>
                        </Card>
                      );
                    })()}


                  {/* PARENT ADDITIONAL MODULES */}
                  {activeTab === "Online Classroom" && (
                    <ClassroomModule
                      role="parent"
                      currentStudentId={parentStudent.id}
                    />
                  )}
                  {activeTab === "Timetable & Schedule" && (
                    <TimetableModule
                      role="parent"
                      currentStudentId={parentStudent.id}
                    />
                  )}
                  {activeTab === "Attendance Record" && (
                    <AttendanceModule
                      role="parent"
                      currentStudentId={parentStudent.id}
                    />
                  )}
                  {activeTab === "Tests & Marks" && (
                    <AssessmentsModule
                      role="parent"
                      currentStudentId={parentStudent.id}
                    />
                  )}
                  {activeTab === "Study Materials" && (
                    <StudyMaterialsModule
                      role="parent"
                      currentStudentId={parentStudent.id}
                    />
                  )}
                  {activeTab === "Notices & Circulars" && (
                    <NoticesModule role="parent" />
                  )}
                  {activeTab === "Fee Receipts & Ledger" && (
                    <FeesModule
                      role="parent"
                      parentStudent={parentStudent}
                    />
                  )}
                </div>
              ))}
          </div>
        </main>
      </div>

      {/* MODAL 1: RECORD CASH PAYMENT */}
      {recordingModal && recordingModal.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setRecordingModal(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--space-4)",
            zIndex: 100,
          }}
        >
          <div
            style={{
              backgroundColor: "var(--color-surface)",
              borderRadius: "var(--radius-xl)",
              maxWidth: "520px",
              width: "100%",
              boxShadow: "var(--shadow-lg)",
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
              <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 700 }}>
                Record Authorized Cash Payment
              </h3>
              <button
                type="button"
                onClick={() => setRecordingModal(null)}
                style={{
                  fontSize: "var(--text-lg)",
                  color: "var(--color-neutral-dark)",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                padding: "var(--space-3)",
                backgroundColor: "var(--color-surface-muted)",
                borderRadius: "var(--radius-md)",
                marginBottom: "var(--space-4)",
              }}
            >
              <div style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>
                {recordingModal.studentName}
              </div>
              <div
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-neutral-dark)",
                  marginTop: "2px",
                }}
              >
                Subject:{" "}
                <strong style={{ color: "var(--color-accent)" }}>
                  {recordingModal.subjectName}
                </strong>{" "}
                &bull; Total Obligation: ₹
                {recordingModal.feeAmount.toLocaleString()}
              </div>
              <div
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-warning)",
                  fontWeight: 600,
                  marginTop: "2px",
                }}
              >
                Pending Balance: ₹{recordingModal.balance.toLocaleString()}
              </div>
            </div>

            <form
              onSubmit={handleRecordPayment}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-3)",
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: "var(--text-xs)",
                    fontWeight: 600,
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Cash Amount Collected (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={recordingModal.balance}
                  value={cashAmountInput}
                  onChange={(e) => setCashAmountInput(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-border)",
                    fontSize: "var(--text-sm)",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: "var(--text-xs)",
                    fontWeight: 600,
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Receipt / Cash Voucher ID *
                </label>
                <input
                  type="text"
                  required
                  value={receiptNumberInput}
                  onChange={(e) => setReceiptNumberInput(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-border)",
                    fontSize: "var(--text-sm)",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: "var(--text-xs)",
                    fontWeight: 600,
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Collector Notes
                </label>
                <input
                  type="text"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-border)",
                    fontSize: "var(--text-sm)",
                  }}
                />
              </div>

              <div
                style={{
                  fontSize: "11px",
                  color: "var(--color-neutral-dark)",
                  backgroundColor: "rgba(0, 122, 255, 0.06)",
                  padding: "6px 10px",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                {isAuthenticated ? (
                  <>
                    Notice: Manual inputs must not be falsely marked as
                    gateway-verified. This transaction will be logged with your
                    collector identity:{" "}
                    <strong>
                      {activeRole === "academy-admin"
                        ? "Academy Admin"
                        : currentTeacher.name}
                    </strong>
                    .
                  </>
                ) : (
                  <>
                    Demo Simulation Notice: Recorded transactions in Guest
                    Preview update local demonstration records only. Sign in
                    with an authorized account to persist official entries.
                  </>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "var(--space-2)",
                  marginTop: "var(--space-3)",
                }}
              >
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => setRecordingModal(null)}
                >
                  Cancel
                </Button>
                <Button variant="accent" size="sm" type="submit">
                  Record Transaction
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PAYMENT HISTORY INSPECTION */}
      {historyModal && historyModal.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setHistoryModal(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--space-4)",
            zIndex: 100,
          }}
        >
          <div
            style={{
              backgroundColor: "var(--color-surface)",
              borderRadius: "var(--radius-xl)",
              maxWidth: "600px",
              width: "100%",
              boxShadow: "var(--shadow-lg)",
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
                <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 700 }}>
                  Payment Audit History
                </h3>
                <span
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-neutral-dark)",
                  }}
                >
                  {historyModal.studentName} &bull; {historyModal.subjectName} (
                  {historyModal.monthLabel})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setHistoryModal(null)}
                style={{
                  fontSize: "var(--text-lg)",
                  color: "var(--color-neutral-dark)",
                  cursor: "pointer",
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
                  ₹{historyModal.feeAmount.toLocaleString()}
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
                  ₹{historyModal.paidAmount.toLocaleString()}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--color-neutral-dark)",
                  }}
                >
                  Remaining Balance
                </div>
                <div
                  style={{
                    fontSize: "var(--text-sm)",
                    fontWeight: 700,
                    color:
                      historyModal.balance > 0
                        ? "var(--color-warning)"
                        : "var(--color-neutral-dark)",
                  }}
                >
                  ₹{historyModal.balance.toLocaleString()}
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
                }}
              >
                Individual Transaction Records ({historyModal.payments.length})
              </span>

              {historyModal.payments.length === 0 ? (
                <p
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-neutral)",
                    marginTop: "8px",
                  }}
                >
                  No payment transactions recorded for this monthly obligation
                  yet.
                </p>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    marginTop: "8px",
                  }}
                >
                  {historyModal.payments.map((tx) => (
                    <div
                      key={tx.id}
                      style={{
                        padding: "10px 12px",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-md)",
                        backgroundColor: "var(--color-surface)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <strong
                            style={{
                              fontSize: "var(--text-sm)",
                              color: "var(--color-primary)",
                            }}
                          >
                            ₹{tx.amount.toLocaleString()}
                          </strong>
                          <Badge
                            variant={
                              tx.paymentMethod === "cash" ? "neutral" : "accent"
                            }
                            size="sm"
                          >
                            {tx.paymentMethod.toUpperCase()}
                          </Badge>
                          {!tx.isGatewayVerified && (
                            <span
                              style={{
                                fontSize: "10px",
                                color: "var(--color-neutral-dark)",
                              }}
                            >
                              [Manual Entry]
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "var(--color-neutral-dark)",
                            marginTop: "2px",
                          }}
                        >
                          Ref: {tx.referenceId} &bull; Collected by:{" "}
                          {tx.collectedByName}
                        </div>
                        {tx.notes && (
                          <div
                            style={{
                              fontSize: "10px",
                              color: "var(--color-neutral)",
                              marginTop: "1px",
                            }}
                          >
                            Notes: {tx.notes}
                          </div>
                        )}
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
                            fontSize: "var(--text-xs)",
                            color: "var(--color-neutral-dark)",
                          }}
                        >
                          {tx.paymentDate}
                        </span>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openReceiptModal(tx)}
                        >
                          Receipt
                        </Button>
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
                onClick={() => setHistoryModal(null)}
              >
                Close Audit Log
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: OFFICIAL PRINTABLE FEE RECEIPT */}
      {receiptModal && receiptModal.isOpen && (
        <FeeReceiptModal
          isOpen={receiptModal.isOpen}
          onClose={() => setReceiptModal(null)}
          transaction={receiptModal.transaction}
          obligation={receiptModal.obligation}
          student={receiptModal.student}
          enrollment={receiptModal.enrollment}
          remainingBalanceAfterPayment={
            receiptModal.remainingBalanceAfterPayment
          }
        />
      )}

      {/* MODAL 4: DIGITAL STUDENT ID CARD MODAL */}
      {idCardModalStudent && (
        <DigitalIdCard
          student={idCardModalStudent}
          enrollments={enrollments.filter(
            (e) => e.studentId === idCardModalStudent.id,
          )}
          cardRecord={
            idCardModalRecord ||
            idCardRecords.find((c) => c.studentId === idCardModalStudent.id)
          }
          onClose={() => {
            setIdCardModalStudent(null);
            setIdCardModalRecord(null);
            setAutoPrintIdCard(false);
          }}
          isModal={true}
          autoPrint={autoPrintIdCard}
          onAutoPrintComplete={() => setAutoPrintIdCard(false)}
        />
      )}


      <style jsx>{`
        .mobile-nav-scroll-strip::-webkit-scrollbar {
          display: none;
        }
        @media (max-width: 768px) {
          .dashboard-sidebar {
            display: none !important;
          }
          .mobile-context-bar {
            display: flex !important;
          }
          .mobile-dashboard-nav {
            display: block !important;
          }
          .dashboard-content-area {
            padding: var(--space-4) !important;
          }
        }
      `}</style>
    </div>
  );
}
