"use client";

import React, { useState, useMemo } from "react";
import {
  UserRole,
  StudentProfile,
  TeacherProfile,
  SubjectEnrollment,
  MonthlyFeeObligation,
  PaymentTransaction,
  FeePaymentStatus,
  PaymentDestination,
  PaymentSubmission,
  FeeAdjustment,
  FeeConfigurationRule,
  VerifiedFeeReceipt,
} from "@/types";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { FeeReceiptModal } from "./FeeReceiptModal";
import { useDemoStorage, DEMO_STORAGE_KEYS, resetFeeDemoStorage } from "@/lib/demoStorage";
import {
  recordCreate,
  recordUpdate,
  recordApprove,
  recordReject,
} from "@/lib/auditService";
import {
  SAMPLE_TEACHERS,
  SAMPLE_STUDENTS,
  SAMPLE_ENROLLMENTS,
  SAMPLE_OBLIGATIONS,
  SAMPLE_PAYMENTS,
  SAMPLE_PAYMENT_DESTINATIONS,
  SAMPLE_PAYMENT_SUBMISSIONS,
  SAMPLE_FEE_ADJUSTMENTS,
  SAMPLE_FEE_RECEIPTS,
  SAMPLE_FEE_CONFIGURATIONS,
  calculateAccountBalance,
  generateUniqueReceiptNumber,
  isBillDuplicate,
  formatBillingMonthLabel,
} from "@/data/enrollmentFeeData";

export interface FeesModuleProps {
  role: UserRole;
  currentTeacherId?: string;
  studentId?: string;
  parentStudent?: StudentProfile | null;
}

export function FeesModule({
  role,
  currentTeacherId = "tch-azhar",
  studentId = "std-101",
  parentStudent,
}: FeesModuleProps) {
  // Shared Demo Storage
  const [payments, setPayments] = useDemoStorage<PaymentTransaction[]>(
    DEMO_STORAGE_KEYS.PAYMENTS,
    SAMPLE_PAYMENTS
  );
  const [obligations, setObligations] = useDemoStorage<MonthlyFeeObligation[]>(
    DEMO_STORAGE_KEYS.OBLIGATIONS,
    SAMPLE_OBLIGATIONS
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
  const [destinations, setDestinations] = useDemoStorage<PaymentDestination[]>(
    DEMO_STORAGE_KEYS.PAYMENT_DESTINATIONS,
    SAMPLE_PAYMENT_DESTINATIONS
  );
  const [submissions, setSubmissions] = useDemoStorage<PaymentSubmission[]>(
    DEMO_STORAGE_KEYS.PAYMENT_SUBMISSIONS,
    SAMPLE_PAYMENT_SUBMISSIONS
  );
  const [adjustments, setAdjustments] = useDemoStorage<FeeAdjustment[]>(
    DEMO_STORAGE_KEYS.FEE_ADJUSTMENTS,
    SAMPLE_FEE_ADJUSTMENTS
  );
  const [receipts, setReceipts] = useDemoStorage<VerifiedFeeReceipt[]>(
    DEMO_STORAGE_KEYS.FEE_RECEIPTS,
    SAMPLE_FEE_RECEIPTS
  );
  const [configurations, setConfigurations] = useDemoStorage<FeeConfigurationRule[]>(
    DEMO_STORAGE_KEYS.FEE_CONFIGURATIONS,
    SAMPLE_FEE_CONFIGURATIONS
  );

  // Derived active billing period
  const currentBillingMonth = useMemo(() => {
    if (!obligations || obligations.length === 0) return "2026-10";
    const sorted = Array.from(new Set(obligations.map((o) => o.month))).sort();
    return sorted[sorted.length - 1] || "2026-10";
  }, [obligations]);

  const prevBillingMonth = useMemo(() => {
    if (!obligations || obligations.length === 0) return "2026-09";
    const sorted = Array.from(new Set(obligations.map((o) => o.month))).sort();
    return sorted.length > 1 ? sorted[sorted.length - 2] : "2026-09";
  }, [obligations]);

  // Admin Sub-Tab State
  const [adminTab, setAdminTab] = useState<
    "overview" | "review" | "ledgers" | "config" | "destinations" | "receipts"
  >("overview");

  // Filters for Admin
  const [reviewStatusFilter, setReviewStatusFilter] = useState<string>("all");
  const [reviewSubjectFilter, setReviewSubjectFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Ledger Sub-Tab Student Selection
  const [selectedLedgerStudentId, setSelectedLedgerStudentId] = useState<string>(
    studentId || "std-101"
  );

  // Modals State
  const [submissionDetailModal, setSubmissionDetailModal] = useState<PaymentSubmission | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState<string>("");
  const [isRejecting, setIsRejecting] = useState<boolean>(false);

  // Adjustment Modal State
  const [adjustmentModal, setAdjustmentModal] = useState<{
    isOpen: boolean;
    obligation: MonthlyFeeObligation;
    enrollment: SubjectEnrollment;
  } | null>(null);
  const [adjType, setAdjType] = useState<FeeAdjustment["adjustmentType"]>("discount");
  const [adjAmount, setAdjAmount] = useState<string>("");
  const [adjReason, setAdjReason] = useState<string>("");

  // Payment Destination Edit Modal (Admin Only)
  const [editingDestination, setEditingDestination] = useState<PaymentDestination | null>(null);
  const [destFormUpi, setDestFormUpi] = useState<string>("");
  const [destFormHolder, setDestFormHolder] = useState<string>("");
  const [destFormBank, setDestFormBank] = useState<string>("");
  const [destFormAccount, setDestFormAccount] = useState<string>("");
  const [destFormIfsc, setDestFormIfsc] = useState<string>("");
  const [destFormBranch, setDestFormBranch] = useState<string>("");
  const [destFormConfirmed, setDestFormConfirmed] = useState<boolean>(false);
  const [destQrPreview, setDestQrPreview] = useState<string>("");
  const [destFormError, setDestFormError] = useState<string>("");

  // Student/Parent Online Payment Submission Modal
  const [payModal, setPayModal] = useState<{
    isOpen: boolean;
    obligation: MonthlyFeeObligation;
    enrollment: SubjectEnrollment;
    balance: number;
  } | null>(null);
  const [payAmountInput, setPayAmountInput] = useState<string>("");
  const [payMethodInput, setPayMethodInput] = useState<"upi" | "bank_transfer">("upi");
  const [payRefInput, setPayRefInput] = useState<string>("");
  const [payDateInput, setPayDateInput] = useState<string>("2026-10-16");
  const [payProofFile, setPayProofFile] = useState<{ name: string; size: number; dataUrl: string } | null>(null);
  const [payFormError, setPayFormError] = useState<string>("");
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [copiedBank, setCopiedBank] = useState<boolean>(false);
  const [copiedAccount, setCopiedAccount] = useState<boolean>(false);
  const [copiedIfsc, setCopiedIfsc] = useState<boolean>(false);

  // Receipt Modal State
  const [activeReceiptModal, setActiveReceiptModal] = useState<{
    isOpen: boolean;
    receipt: VerifiedFeeReceipt;
    transaction: PaymentTransaction;
    obligation: MonthlyFeeObligation;
    student: StudentProfile;
    enrollment: SubjectEnrollment;
  } | null>(null);

  // Fee Revision Modal (Admin)
  const [revisionModal, setRevisionModal] = useState<FeeConfigurationRule | null>(null);
  const [revisedFeeInput, setRevisedFeeInput] = useState<string>("");
  const [revisionDateInput, setRevisionDateInput] = useState<string>("2026-11-01");
  const [revisionReasonInput, setRevisionReasonInput] = useState<string>("");

  // Bill Generation Modal (Admin)
  const [isGenerateBillsOpen, setIsGenerateBillsOpen] = useState<boolean>(false);
  const [generateMonthInput, setGenerateMonthInput] = useState<string>("2026-11");
  const [generationFeedback, setGenerationFeedback] = useState<string>("");

  // Demo Reseed / Reset Modal & Toast
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);
  const [resetNotification, setResetNotification] = useState<string>("");

  // Target Student for Student or Parent Role
  const effectiveStudent = useMemo(() => {
    if (role === "student") {
      return students.find((s) => s.id === studentId) || students[0];
    }
    if (role === "parent") {
      return parentStudent || students[0];
    }
    return students.find((s) => s.id === selectedLedgerStudentId) || students[0];
  }, [role, studentId, parentStudent, students, selectedLedgerStudentId]);

  // Student's Enrollments
  const studentEnrollments = useMemo(() => {
    if (!effectiveStudent) return [];
    return enrollments.filter((e) => e.studentId === effectiveStudent.id);
  }, [effectiveStudent, enrollments]);

  // Teacher's Enrollments
  const teacherEnrollments = useMemo(() => {
    return enrollments.filter((e) => e.teacherId === currentTeacherId);
  }, [enrollments, currentTeacherId]);

  // Derived KPI Metrics
  const adminKPIs = useMemo(() => {
    let totalCharged = 0;
    let realizedCollections = 0;
    let overdueCount = 0;

    for (const ob of obligations) {
      const calc = calculateAccountBalance(ob, payments, adjustments);
      totalCharged += calc.netCharge;
      realizedCollections += calc.paidAmount;
      if (calc.status === "overdue") {
        overdueCount++;
      }
    }

    const pendingSubmissions = submissions.filter((s) => s.status === "pending");
    const pendingAmount = pendingSubmissions.reduce((sum, s) => sum + s.amount, 0);
    const outstandingDues = Math.max(0, totalCharged - realizedCollections);

    return {
      totalCharged,
      realizedCollections,
      outstandingDues,
      pendingCount: pendingSubmissions.length,
      pendingAmount,
      overdueCount,
    };
  }, [obligations, payments, adjustments, submissions]);

  const teacherKPIs = useMemo(() => {
    let target = 0;
    let realized = 0;
    let balance = 0;
    const studentSet = new Set<string>();

    for (const enr of teacherEnrollments) {
      studentSet.add(enr.studentId);
      const currentOb = obligations.find(
        (o) => o.enrollmentId === enr.id && o.month === currentBillingMonth
      );
      if (currentOb) {
        const calc = calculateAccountBalance(currentOb, payments, adjustments);
        target += calc.netCharge;
        realized += calc.paidAmount;
        balance += calc.balance;
      }
    }

    return {
      studentCount: studentSet.size,
      target,
      realized,
      balance,
    };
  }, [teacherEnrollments, obligations, payments, adjustments, currentBillingMonth]);

  const studentKPIs = useMemo(() => {
    let target = 0;
    let paid = 0;
    let balance = 0;

    for (const enr of studentEnrollments) {
      const currentOb = obligations.find(
        (o) => o.enrollmentId === enr.id && o.month === currentBillingMonth
      );
      if (currentOb) {
        const calc = calculateAccountBalance(currentOb, payments, adjustments);
        target += calc.netCharge;
        paid += calc.paidAmount;
        balance += calc.balance;
      }
    }

    return {
      subjectsCount: studentEnrollments.length,
      target,
      paid,
      balance,
    };
  }, [studentEnrollments, obligations, payments, adjustments, currentBillingMonth]);

  // Status Badge Helper
  const renderStatusBadge = (status: FeePaymentStatus) => {
    switch (status) {
      case "paid":
        return <Badge variant="success" size="sm">Paid</Badge>;
      case "partially-paid":
        return <Badge variant="warning" size="sm">Partial</Badge>;
      case "overdue":
        return (
          <Badge
            variant="neutral"
            size="sm"
            style={{ color: "#FF3B30", borderColor: "rgba(255, 59, 48, 0.3)", backgroundColor: "rgba(255, 59, 48, 0.08)" }}
          >
            Overdue
          </Badge>
        );
      case "unpaid":
      default:
        return <Badge variant="neutral" size="sm">Unpaid</Badge>;
    }
  };

  // -------------------------------------------------------------
  // ADMIN ACTIONS: Payment Approval & Rejection
  // -------------------------------------------------------------
  const handleApproveSubmission = (subm: PaymentSubmission) => {
    if (role !== "academy-admin") return;
    if (subm.status !== "pending") return;

    const submMonth = subm.obligationId.match(/\d{4}-\d{2}/)?.[0] || currentBillingMonth;
    const receiptNo = generateUniqueReceiptNumber(receipts, submMonth);
    const txId = `tx-${Date.now()}`;
    const verifiedDate = new Date().toISOString().slice(0, 10);
    const finalRef = subm.referenceId || receiptNo;

    // Resolve the actual student and enrollment associated with the submission
    const actualStudent = students.find((s) => s.id === subm.studentId);
    const actualEnrollment =
      enrollments.find((e) => e.id === subm.enrollmentId) ||
      enrollments.find(
        (e) =>
          e.studentId === subm.studentId &&
          e.subjectName.toLowerCase() === subm.subjectName.toLowerCase()
      );

    // 1. Create verified payment transaction
    const newTx: PaymentTransaction = {
      id: txId,
      obligationId: subm.obligationId,
      enrollmentId: subm.enrollmentId || actualEnrollment?.id || "",
      studentId: subm.studentId,
      amount: subm.amount,
      paymentDate: subm.transferDate || verifiedDate,
      paymentMethod: subm.paymentMethod === "cash" ? "cash" : "online",
      referenceId: finalRef,
      collectedByRole: "academy-admin",
      collectedByName: "Academy Admin Office",
      isGatewayVerified: false,
      notes: `Verified ${subm.paymentMethod.toUpperCase()} proof (${subm.proofFileName || "Screenshot Attached"})`,
    };

    // Calculate balance remaining
    const obligation = obligations.find((o) => o.id === subm.obligationId);
    const currentCalc = obligation
      ? calculateAccountBalance(obligation, [...payments, newTx], adjustments)
      : { balance: 0 };

    // 2. Create verified receipt using actual student and enrollment metadata
    const newReceipt: VerifiedFeeReceipt = {
      id: `rec-${Date.now()}`,
      receiptNumber: receiptNo,
      submissionId: subm.id,
      paymentTransactionId: txId,
      obligationId: subm.obligationId,
      enrollmentId: subm.enrollmentId || actualEnrollment?.id || "",
      studentId: subm.studentId,
      studentName: subm.studentName,
      classGrade: actualStudent?.classGrade || actualEnrollment?.classGrade || "Class X",
      guardianName: actualStudent?.guardianName || "Guardian",
      subjectName: subm.subjectName,
      teacherId: subm.teacherId || actualEnrollment?.teacherId || "",
      teacherName: subm.teacherName || actualEnrollment?.teacherName || "",
      monthLabel: subm.monthLabel,
      amountReceived: subm.amount,
      paymentMethod: subm.paymentMethod,
      referenceId: finalRef,
      verifiedDate,
      issuedBy: "Academy Admin Office",
      remainingBalanceAfterPayment: currentCalc.balance,
    };

    // 3. Update submission record
    const updatedSubmissions = submissions.map((s) =>
      s.id === subm.id
        ? {
            ...s,
            status: "verified" as const,
            verifiedAt: new Date().toISOString(),
            verifiedBy: "Academy Admin Office",
            receiptNumber: receiptNo,
          }
        : s
    );

    setPayments((prev) => [newTx, ...prev]);
    setReceipts((prev) => [newReceipt, ...prev]);
    setSubmissions(updatedSubmissions);

    // 4. Central Audit Log
    recordApprove({
      action: "Approve Fee Payment Submission",
      target: `Receipt ${receiptNo} for ${subm.studentName} (${subm.subjectName})`,
      details: `Approved payment submission ${subm.id} of ₹${subm.amount.toLocaleString("en-IN")}. Ref: ${subm.referenceId}. Issued receipt ${receiptNo}.`,
      performedBy: "Academy Admin Office",
      actorRole: "academy-admin",
      entityType: "fee_payment",
      entityId: newTx.id,
      outcome: "SUCCESS",
      changedFields: ["status", "receiptNumber", "balance"],
      diff: [
        { fieldName: "status", before: "pending", after: "verified" },
        { fieldName: "receiptNumber", before: null, after: receiptNo },
        { fieldName: "amountReceived", before: 0, after: subm.amount },
      ],
      sourcePortal: "academy-admin",
    });

    setSubmissionDetailModal(null);
  };

  const handleRejectSubmission = () => {
    if (role !== "academy-admin") return;
    if (!submissionDetailModal || !rejectReasonInput.trim()) return;

    const reason = rejectReasonInput.trim();
    const subm = submissionDetailModal;

    const updatedSubmissions = submissions.map((s) =>
      s.id === subm.id
        ? {
            ...s,
            status: "rejected" as const,
            rejectionReason: reason,
          }
        : s
    );

    setSubmissions(updatedSubmissions);

    // Central Audit Log
    recordReject({
      action: "Reject Fee Payment Submission",
      target: `Submission ${subm.id} (${subm.studentName} - ${subm.subjectName})`,
      details: `Rejected submission of ₹${subm.amount.toLocaleString("en-IN")} with UTR ${subm.referenceId}. Reason: ${reason}.`,
      performedBy: "Academy Admin Office",
      actorRole: "academy-admin",
      entityType: "payment_submission",
      entityId: subm.id,
      outcome: "SUCCESS",
      changedFields: ["status", "rejectionReason"],
      diff: [
        { fieldName: "status", before: "pending", after: "rejected" },
        { fieldName: "rejectionReason", before: null, after: reason },
      ],
      sourcePortal: "academy-admin",
    });

    setSubmissionDetailModal(null);
    setIsRejecting(false);
    setRejectReasonInput("");
  };

  // -------------------------------------------------------------
  // ADMIN ACTIONS: Traceable Fee Adjustment
  // -------------------------------------------------------------
  const handleSaveAdjustment = () => {
    if (!adjustmentModal) return;
    const amountNum = parseFloat(adjAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;
    if (!adjReason.trim()) return;

    const { obligation, enrollment } = adjustmentModal;

    const newAdjustment: FeeAdjustment = {
      id: `adj-${Date.now()}`,
      obligationId: obligation.id,
      enrollmentId: enrollment.id,
      studentId: enrollment.studentId,
      studentName: enrollment.studentName,
      subjectName: enrollment.subjectName,
      monthLabel: obligation.monthLabel,
      adjustmentType: adjType,
      amount: amountNum,
      reason: adjReason.trim(),
      authorizedBy: "Academy Admin Office",
      createdAt: new Date().toISOString(),
    };

    setAdjustments((prev) => [newAdjustment, ...prev]);

    recordCreate({
      action: "Authorize Fee Adjustment",
      target: `${obligation.monthLabel} (${enrollment.studentName} - ${enrollment.subjectName})`,
      details: `Granted ${adjType} of ₹${amountNum.toLocaleString("en-IN")}. Reason: ${adjReason.trim()}.`,
      performedBy: "Academy Admin Office",
      actorRole: "academy-admin",
      entityType: "fee_adjustment",
      entityId: newAdjustment.id,
      outcome: "SUCCESS",
      changedFields: ["adjustmentType", "amount", "reason"],
      diff: [
        { fieldName: "adjustmentType", after: adjType },
        { fieldName: "amount", before: 0, after: amountNum },
        { fieldName: "reason", after: adjReason.trim() },
      ],
      sourcePortal: "academy-admin",
    });

    setAdjustmentModal(null);
    setAdjAmount("");
    setAdjReason("");
  };

  // -------------------------------------------------------------
  // ADMIN ACTIONS: Payment Destination Configuration (Admin Only)
  // -------------------------------------------------------------
  const handleOpenEditDestination = (dest: PaymentDestination) => {
    if (role !== "academy-admin") return;
    setEditingDestination(dest);
    setDestFormUpi(dest.upiId);
    setDestFormHolder(dest.accountHolderName);
    setDestFormBank(dest.bankName);
    setDestFormAccount(dest.accountNumber);
    setDestFormIfsc(dest.ifscCode);
    setDestFormBranch(dest.branchName);
    setDestQrPreview(dest.qrImageUrl || "");
    setDestFormConfirmed(false);
    setDestFormError("");
  };

  const handleSaveDestination = () => {
    if (role !== "academy-admin" || !editingDestination) return;

    if (!destFormUpi.trim() || !destFormHolder.trim() || !destFormBank.trim() || !destFormAccount.trim() || !destFormIfsc.trim()) {
      setDestFormError("Please complete all required banking and UPI destination fields.");
      return;
    }

    if (!destFormConfirmed) {
      setDestFormError("Please confirm institutional verification of these receiving details.");
      return;
    }

    const updated: PaymentDestination = {
      ...editingDestination,
      upiId: destFormUpi.trim(),
      accountHolderName: destFormHolder.trim(),
      bankName: destFormBank.trim(),
      accountNumber: destFormAccount.trim(),
      ifscCode: destFormIfsc.trim().toUpperCase(),
      branchName: destFormBranch.trim(),
      qrImageUrl: destQrPreview,
      lastUpdated: new Date().toISOString().slice(0, 10),
      updatedBy: "Academy Admin Office",
    };

    setDestinations((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));

    recordUpdate({
      action: "Update Subject Payment Destination",
      target: `${updated.subjectName} (${updated.teacherName})`,
      details: `Updated receiving UPI ID (${updated.upiId}) and bank account for ${updated.subjectName}.`,
      performedBy: "Academy Admin Office",
      actorRole: "academy-admin",
      entityType: "payment_destination",
      entityId: updated.id,
      outcome: "SUCCESS",
      changedFields: ["upiId", "bankName", "accountHolderName"],
      diff: [
        { fieldName: "upiId", before: editingDestination.upiId, after: updated.upiId },
        { fieldName: "bankName", before: editingDestination.bankName, after: updated.bankName },
      ],
      sourcePortal: "academy-admin",
    });

    setEditingDestination(null);
  };

  const handleToggleDestinationActive = (dest: PaymentDestination) => {
    if (role !== "academy-admin") return;
    const nextState = !dest.isActive;
    setDestinations((prev) =>
      prev.map((d) => (d.id === dest.id ? { ...d, isActive: nextState } : d))
    );

    recordUpdate({
      action: nextState ? "Activate Payment Destination" : "Deactivate Payment Destination",
      target: `${dest.subjectName} (${dest.teacherName})`,
      details: `${nextState ? "Activated" : "Deactivated"} payment destination for ${dest.subjectName}.`,
      performedBy: "Academy Admin Office",
      actorRole: "academy-admin",
      entityType: "payment_destination",
      entityId: dest.id,
      outcome: "SUCCESS",
      changedFields: ["isActive"],
      diff: [{ fieldName: "isActive", before: dest.isActive, after: nextState }],
      sourcePortal: "academy-admin",
    });
  };

  // -------------------------------------------------------------
  // ADMIN ACTIONS: Fee Revisions & Bill Generation
  // -------------------------------------------------------------
  const handleSaveFeeRevision = () => {
    if (role !== "academy-admin" || !revisionModal) return;
    const newFee = parseFloat(revisedFeeInput);
    if (isNaN(newFee) || newFee <= 0) return;

    const updated = {
      ...revisionModal,
      monthlyFee: newFee,
      revisedFrom: revisionModal.monthlyFee,
      revisedAt: revisionDateInput,
      revisedBy: "Academy Admin Office",
      notes: revisionReasonInput.trim() || revisionModal.notes,
    };

    setConfigurations((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));

    recordUpdate({
      action: "Revise Subject Fee Rule",
      target: `${updated.classGrade} - ${updated.subjectName}`,
      details: `Revised monthly fee from ₹${revisionModal.monthlyFee} to ₹${newFee} effective ${revisionDateInput}. Reason: ${revisionReasonInput.trim()}`,
      performedBy: "Academy Admin Office",
      actorRole: "academy-admin",
      entityType: "fee_configuration",
      entityId: updated.id,
      outcome: "SUCCESS",
      changedFields: ["monthlyFee", "effectiveFrom"],
      diff: [
        { fieldName: "monthlyFee", before: revisionModal.monthlyFee, after: newFee },
        { fieldName: "effectiveFrom", after: revisionDateInput },
      ],
      sourcePortal: "academy-admin",
    });

    setRevisionModal(null);
    setRevisedFeeInput("");
    setRevisionReasonInput("");
  };

  const handleGenerateNextMonthBills = () => {
    if (role !== "academy-admin") return;
    const month = generateMonthInput; // e.g. "2026-11"
    const monthLabel = formatBillingMonthLabel(month);
    const dueDate = `${month}-15`;

    let createdCount = 0;
    const newObligations: MonthlyFeeObligation[] = [];

    for (const enr of enrollments) {
      if (enr.status !== "active") continue;
      if (isBillDuplicate(enr.studentId, enr.subjectName, month, obligations)) {
        continue;
      }

      // Check joining date policy: student cannot be billed before enrollment date
      const enrollmentMonth = enr.enrollmentDate.slice(0, 7);
      if (enrollmentMonth > month) {
        continue; // Do not charge prior to enrollment
      }

      const newOb: MonthlyFeeObligation = {
        id: `ob-${enr.id}-${month}`,
        enrollmentId: enr.id,
        studentId: enr.studentId,
        studentName: enr.studentName,
        subjectName: enr.subjectName,
        teacherId: enr.teacherId,
        month,
        monthLabel,
        feeAmount: enr.monthlyFeeAmount,
        dueDate,
      };

      newObligations.push(newOb);
      createdCount++;
    }

    if (newObligations.length > 0) {
      setObligations((prev) => [...prev, ...newObligations]);

      recordCreate({
        action: "Generate Monthly Fee Bills",
        target: `Billing Cycle ${monthLabel}`,
        details: `Generated ${createdCount} subject fee bills for cycle ${monthLabel}. Duplicate charges safely skipped.`,
        performedBy: "Academy Admin Office",
        actorRole: "academy-admin",
        entityType: "fee_billing_cycle",
        outcome: "SUCCESS",
        changedFields: ["billsGeneratedCount", "billingMonth"],
        diff: [{ fieldName: "createdCount", before: 0, after: createdCount }],
        sourcePortal: "academy-admin",
      });

      setGenerationFeedback(`Successfully generated ${createdCount} fee bills for ${monthLabel}.`);
    } else {
      setGenerationFeedback(`All eligible bills for ${monthLabel} already exist. No duplicate charges generated.`);
    }

    setIsGenerateBillsOpen(false);
  };

  // -------------------------------------------------------------
  // STUDENT / PARENT: Online Payment Submission Workflow
  // -------------------------------------------------------------
  const handleOpenPayModal = (
    obligation: MonthlyFeeObligation,
    enrollment: SubjectEnrollment,
    balance: number
  ) => {
    setPayModal({ isOpen: true, obligation, enrollment, balance });
    setPayAmountInput(String(balance));
    setPayMethodInput("upi");
    setPayRefInput("");
    setPayProofFile(null);
    setPayFormError("");
    setCopiedUpi(false);
    setCopiedBank(false);
    setCopiedAccount(false);
    setCopiedIfsc(false);
  };

  const handleCopyAccountNumber = (accountNumber: string) => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(accountNumber);
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    }
  };

  const handleCopyIfsc = (ifsc: string) => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(ifsc);
      setCopiedIfsc(true);
      setTimeout(() => setCopiedIfsc(false), 2000);
    }
  };

  const handleCopyBankDetails = (dest: PaymentDestination) => {
    if (typeof navigator !== "undefined") {
      const bankDetails = `Aroush Academy Fee Account:\nAccount Holder: ${dest.accountHolderName}\nBank: ${dest.bankName} (${dest.branchName})\nAccount Number: ${dest.accountNumber}\nIFSC Code: ${dest.ifscCode}`;
      navigator.clipboard.writeText(bankDetails);
      setCopiedBank(true);
      setTimeout(() => setCopiedBank(false), 2000);
    }
  };

  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    const allowedExts = [".png", ".jpg", ".jpeg", ".webp"];
    const fileExt = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    const isAllowedType = allowedTypes.includes(file.type.toLowerCase()) || allowedExts.includes(fileExt);

    if (!isAllowedType) {
      setPayFormError("Please select a valid image file (PNG, JPEG, or WebP).");
      return;
    }

    if (file.size <= 0 || file.size > 2 * 1024 * 1024) {
      setPayFormError("Screenshot image exceeds 2 MB limit. Please select a smaller file.");
      return;
    }

    setPayFormError("");
    const reader = new FileReader();
    reader.onload = () => {
      setPayProofFile({
        name: file.name,
        size: file.size,
        dataUrl: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitTransfer = () => {
    if (!payModal) return;

    const amountNum = parseFloat(payAmountInput);
    if (isNaN(amountNum) || amountNum <= 0) {
      setPayFormError("Please enter a valid positive payment amount.");
      return;
    }

    if (amountNum > payModal.balance) {
      setPayFormError(`Amount exceeds outstanding balance (₹${payModal.balance.toLocaleString("en-IN")}).`);
      return;
    }

    // Screenshot proof is mandatory
    if (!payProofFile) {
      setPayFormError("Please upload a payment screenshot of your successful transaction.");
      return;
    }

    // Check for duplicate pending submission for this obligation
    const isDupPending = submissions.some(
      (s) => s.obligationId === payModal.obligation.id && s.status === "pending"
    );
    if (isDupPending) {
      setPayFormError("A payment submission for this billing period is already pending Admin verification.");
      return;
    }

    const { obligation, enrollment } = payModal;
    const dest = destinations.find(
      (d) =>
        d.subjectName.toLowerCase() === enrollment.subjectName.toLowerCase() &&
        d.isActive &&
        (!enrollment.teacherId || d.teacherId === enrollment.teacherId)
    ) || destinations.find(
      (d) => d.subjectName.toLowerCase() === enrollment.subjectName.toLowerCase() && d.isActive
    );

    if (!dest) {
      setPayFormError("Payment details are not configured. Please contact the Academy Office.");
      return;
    }

    const newSubm: PaymentSubmission = {
      id: `subm-${Date.now()}`,
      studentId: enrollment.studentId,
      studentName: enrollment.studentName,
      subjectName: enrollment.subjectName,
      teacherId: enrollment.teacherId,
      teacherName: enrollment.teacherName,
      enrollmentId: enrollment.id,
      obligationId: obligation.id,
      monthLabel: obligation.monthLabel,
      amount: amountNum,
      paymentMethod: payMethodInput,
      referenceId: payRefInput.trim() || undefined,
      transferDate: payDateInput || new Date().toISOString().slice(0, 10),
      status: "pending",
      submittedAt: new Date().toISOString(),
      submittedByRole: role === "parent" ? "parent" : "student",
      submittedByName:
        role === "parent"
          ? effectiveStudent?.guardianName || "Guardian"
          : effectiveStudent?.name || "Student",
      proofFileName: payProofFile.name,
      proofFileSize: payProofFile.size,
      proofFileType: "image",
      proofFileData: payProofFile.dataUrl,
      destinationSnapshot: {
        upiId: dest.upiId,
        accountHolderName: dest.accountHolderName,
        bankName: dest.bankName,
        ifscCode: dest.ifscCode,
      },
    };

    setSubmissions((prev) => [newSubm, ...prev]);

    recordCreate({
      action: "Submit Fee Payment for Verification",
      target: `${obligation.monthLabel} (${enrollment.studentName} - ${enrollment.subjectName})`,
      details: `Submitted ${payMethodInput === "upi" ? "UPI payment" : "Bank Transfer"} screenshot proof (₹${amountNum.toLocaleString("en-IN")}, File: ${payProofFile.name}). Awaiting Academy Admin verification.`,
      performedBy:
        role === "parent"
          ? effectiveStudent?.guardianName || "Guardian"
          : effectiveStudent?.name || "Student",
      actorRole: role === "parent" ? "parent" : "student",
      entityType: "payment_submission",
      entityId: newSubm.id,
      outcome: "SUCCESS",
      changedFields: ["amount", "status", "proofFileName"],
      diff: [
        { fieldName: "amount", before: 0, after: amountNum },
        { fieldName: "status", after: "pending" },
      ],
      sourcePortal: role === "parent" ? "parent" : "student",
    });

    setPayModal(null);
  };

  // Helper to open receipt voucher directly from obligation
  const handleOpenReceiptForObligation = (
    obligation: MonthlyFeeObligation,
    enrollment: SubjectEnrollment,
    calc: ReturnType<typeof calculateAccountBalance>
  ) => {
    const existingReceipt = receipts.find(
      (r) =>
        r.enrollmentId === enrollment.id &&
        (r.obligationId === obligation.id || r.monthLabel === obligation.monthLabel)
    );
    if (existingReceipt) {
      handleOpenReceiptVoucher(existingReceipt);
      return;
    }

    const tx = payments.find((p) => p.obligationId === obligation.id) || {
      id: `tx-auto-${obligation.id}`,
      obligationId: obligation.id,
      enrollmentId: enrollment.id,
      studentId: enrollment.studentId,
      amount: calc.paidAmount,
      paymentDate: "2026-10-04",
      paymentMethod: "cash" as const,
      referenceId: `CSH-${obligation.id.slice(-6)}`,
      collectedByRole: "teacher" as const,
      collectedByName: enrollment.teacherName,
      isGatewayVerified: false,
      notes: "Tuition settlement",
    };

    const syntheticReceipt: VerifiedFeeReceipt = {
      id: `rec-auto-${obligation.id}`,
      receiptNumber: generateUniqueReceiptNumber(receipts),
      paymentTransactionId: tx.id,
      obligationId: obligation.id,
      enrollmentId: enrollment.id,
      studentId: enrollment.studentId,
      studentName: enrollment.studentName,
      classGrade: enrollment.classGrade,
      guardianName: effectiveStudent?.guardianName || "Guardian",
      subjectName: enrollment.subjectName,
      teacherId: enrollment.teacherId,
      teacherName: enrollment.teacherName,
      monthLabel: obligation.monthLabel,
      amountReceived: calc.paidAmount,
      paymentMethod: tx.paymentMethod === "online" ? "online" : "cash",
      referenceId: tx.referenceId,
      verifiedDate: tx.paymentDate,
      issuedBy: "Academy Admin Office",
      remainingBalanceAfterPayment: calc.balance,
    };

    handleOpenReceiptVoucher(syntheticReceipt);
  };

  // Helper to open receipt voucher
  const handleOpenReceiptVoucher = (rec: VerifiedFeeReceipt) => {
    const ob = obligations.find((o) => o.id === rec.obligationId) || {
      id: rec.obligationId,
      enrollmentId: rec.enrollmentId,
      studentId: rec.studentId,
      studentName: rec.studentName,
      subjectName: rec.subjectName,
      teacherId: rec.teacherId,
      month: rec.obligationId.match(/\d{4}-\d{2}/)?.[0] || currentBillingMonth,
      monthLabel: rec.monthLabel,
      feeAmount: rec.amountReceived,
      dueDate: `${rec.obligationId.match(/\d{4}-\d{2}/)?.[0] || currentBillingMonth}-15`,
    };

    const st = students.find((s) => s.id === rec.studentId) || {
      id: rec.studentId,
      name: rec.studentName,
      classGrade: rec.classGrade,
      board: "ICSE",
      guardianName: rec.guardianName,
      guardianPhone: "098830 11221",
      joiningDate: "2026-04-10",
      studentStatus: "active",
    };

    const enr = enrollments.find((e) => e.id === rec.enrollmentId) || {
      id: rec.enrollmentId,
      studentId: rec.studentId,
      studentName: rec.studentName,
      classGrade: rec.classGrade,
      subjectName: rec.subjectName,
      teacherId: rec.teacherId,
      teacherName: rec.teacherName,
      batchName: "Batch Alpha",
      enrollmentDate: "2026-04-10",
      monthlyFeeAmount: rec.amountReceived,
      status: "active",
    };

    const tx: PaymentTransaction = {
      id: rec.paymentTransactionId,
      obligationId: rec.obligationId,
      enrollmentId: rec.enrollmentId,
      studentId: rec.studentId,
      amount: rec.amountReceived,
      paymentDate: rec.verifiedDate,
      paymentMethod: rec.paymentMethod === "cash" ? "cash" : "online",
      referenceId: rec.referenceId,
      collectedByRole: "academy-admin",
      collectedByName: rec.issuedBy,
      isGatewayVerified: false,
    };

    setActiveReceiptModal({
      isOpen: true,
      receipt: rec,
      transaction: tx,
      obligation: ob,
      student: st,
      enrollment: enr,
    });
  };

  // Safe Demo Reset / Reseed Action
  const handleConfirmResetFeeDemo = () => {
    resetFeeDemoStorage();
    setPayments(SAMPLE_PAYMENTS);
    setObligations(SAMPLE_OBLIGATIONS);
    setDestinations(SAMPLE_PAYMENT_DESTINATIONS);
    setSubmissions(SAMPLE_PAYMENT_SUBMISSIONS);
    setAdjustments(SAMPLE_FEE_ADJUSTMENTS);
    setReceipts(SAMPLE_FEE_RECEIPTS);
    setConfigurations(SAMPLE_FEE_CONFIGURATIONS);

    recordUpdate({
      action: "Reset Demo Fee Data",
      target: "Tuition Fee Demo System",
      details: "Restored seed balances: Mathematics paid (₹0 due), Physics unpaid (₹1,400 due with Pay Now button).",
      performedBy:
        role === "academy-admin"
          ? "Academy Administrator"
          : role === "parent"
          ? effectiveStudent?.guardianName || "Guardian"
          : effectiveStudent?.name || "Student",
      actorRole: role,
      entityType: "system",
      outcome: "SUCCESS",
    });

    setShowResetConfirmModal(false);
    setResetNotification("Fee demo data has been safely reset to initial defaults.");
    setTimeout(() => setResetNotification(""), 4000);
  };

  // -------------------------------------------------------------
  // RENDER: Role-Specific Views
  // -------------------------------------------------------------
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      {/* SECTION 1: HEADER & ROLE CONTEXT */}
      <Card padding="md" style={{ borderLeft: "4px solid var(--color-accent)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-3)" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 700, margin: 0 }}>
                {role === "academy-admin"
                  ? "Academy Financial Control & Subject-Wise Fee Management"
                  : role === "teacher"
                  ? "Faculty Subject Fee Tracking"
                  : role === "parent"
                  ? `Ward Fee Account & Receipts — ${effectiveStudent?.name || "Student"}`
                  : `My Enrolled Subject Fees & Receipts — ${effectiveStudent?.name || "Student"}`}
              </h2>
              <Badge variant="accent" size="sm">
                Subject-Wise Isolation
              </Badge>
            </div>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", margin: "4px 0 0" }}>
              {role === "academy-admin"
                ? "Full administrative control: separate subject ledgers, manual transfer reconciliation, admin-only QR destinations, and audit logs."
                : role === "teacher"
                ? "Faculty view: Track subject collections for assigned students. Payment destinations and approvals are restricted to Administration."
                : "Independent accounts for each subject. Payments remain Pending Verification until reconciled by the Admin Office."}
            </p>
          </div>

          <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)" }}>
              Active Cycle: <strong>{formatBillingMonthLabel(currentBillingMonth)}</strong>
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowResetConfirmModal(true)}
              title="Reset fee demo data back to initial seed state"
              style={{ fontSize: "11px", padding: "4px 10px", display: "flex", alignItems: "center", gap: "4px" }}
            >
              <span>↺</span> Reset Fee Demo Data
            </Button>
          </div>
        </div>

        {resetNotification && (
          <div
            style={{
              marginTop: "var(--space-3)",
              padding: "8px 12px",
              backgroundColor: "rgba(52, 199, 89, 0.12)",
              border: "1px solid rgba(52, 199, 89, 0.3)",
              borderRadius: "var(--radius-sm)",
              color: "var(--color-success)",
              fontSize: "12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>✓ {resetNotification}</span>
            <button
              onClick={() => setResetNotification("")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: 700 }}
            >
              ✕
            </button>
          </div>
        )}
      </Card>

      {/* SECTION 2: METRICS BAR */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "var(--space-3)",
        }}
      >
        {role === "academy-admin" ? (
          <>
            <Card padding="md">
              <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)", textTransform: "uppercase", fontWeight: 600 }}>
                Total Fees Charged
              </span>
              <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, marginTop: "4px" }}>
                ₹{adminKPIs.totalCharged.toLocaleString("en-IN")}
              </div>
              <span style={{ fontSize: "10px", color: "var(--color-neutral-dark)" }}>
                Across all active subjects
              </span>
            </Card>

            <Card padding="md">
              <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)", textTransform: "uppercase", fontWeight: 600 }}>
                Verified Collections
              </span>
              <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--color-success)", marginTop: "4px" }}>
                ₹{adminKPIs.realizedCollections.toLocaleString("en-IN")}
              </div>
              <span style={{ fontSize: "10px", color: "var(--color-success)" }}>
                Reconciled &amp; verified money
              </span>
            </Card>

            <Card padding="md">
              <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)", textTransform: "uppercase", fontWeight: 600 }}>
                Outstanding Dues
              </span>
              <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--color-warning)", marginTop: "4px" }}>
                ₹{adminKPIs.outstandingDues.toLocaleString("en-IN")}
              </div>
              <span style={{ fontSize: "10px", color: "var(--color-neutral-dark)" }}>
                {adminKPIs.overdueCount} overdue bills
              </span>
            </Card>

            <Card padding="md" style={{ backgroundColor: adminKPIs.pendingCount > 0 ? "rgba(255, 149, 0, 0.08)" : undefined }}>
              <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)", textTransform: "uppercase", fontWeight: 600 }}>
                Pending Verification
              </span>
              <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--color-warning)", marginTop: "4px" }}>
                {adminKPIs.pendingCount} Submissions
              </div>
              <span style={{ fontSize: "10px", color: "var(--color-neutral-dark)" }}>
                ₹{adminKPIs.pendingAmount.toLocaleString("en-IN")} awaiting review
              </span>
            </Card>
          </>
        ) : role === "teacher" ? (
          <>
            <Card padding="md">
              <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)", textTransform: "uppercase", fontWeight: 600 }}>
                Assigned Students
              </span>
              <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, marginTop: "4px" }}>
                {teacherKPIs.studentCount} Students
              </div>
              <span style={{ fontSize: "10px", color: "var(--color-neutral-dark)" }}>
                In assigned batches
              </span>
            </Card>

            <Card padding="md">
              <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)", textTransform: "uppercase", fontWeight: 600 }}>
                Monthly Target (Oct)
              </span>
              <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, marginTop: "4px" }}>
                ₹{teacherKPIs.target.toLocaleString("en-IN")}
              </div>
              <span style={{ fontSize: "10px", color: "var(--color-neutral-dark)" }}>
                Assigned subject obligations
              </span>
            </Card>

            <Card padding="md">
              <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)", textTransform: "uppercase", fontWeight: 600 }}>
                Realized Collection
              </span>
              <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--color-success)", marginTop: "4px" }}>
                ₹{teacherKPIs.realized.toLocaleString("en-IN")}
              </div>
              <span style={{ fontSize: "10px", color: "var(--color-success)" }}>
                Verified by Admin
              </span>
            </Card>

            <Card padding="md">
              <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)", textTransform: "uppercase", fontWeight: 600 }}>
                Pending Balance
              </span>
              <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--color-warning)", marginTop: "4px" }}>
                ₹{teacherKPIs.balance.toLocaleString("en-IN")}
              </div>
              <span style={{ fontSize: "10px", color: "var(--color-neutral-dark)" }}>
                To be collected
              </span>
            </Card>
          </>
        ) : (
          <>
            <Card padding="md">
              <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)", textTransform: "uppercase", fontWeight: 600 }}>
                Enrolled Subjects
              </span>
              <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, marginTop: "4px" }}>
                {studentKPIs.subjectsCount} Subjects
              </div>
              <span style={{ fontSize: "10px", color: "var(--color-neutral-dark)" }}>
                Independent accounts
              </span>
            </Card>

            <Card padding="md">
              <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)", textTransform: "uppercase", fontWeight: 600 }}>
                October Obligation
              </span>
              <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, marginTop: "4px" }}>
                ₹{studentKPIs.target.toLocaleString("en-IN")}
              </div>
              <span style={{ fontSize: "10px", color: "var(--color-neutral-dark)" }}>
                Total payable
              </span>
            </Card>

            <Card padding="md">
              <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)", textTransform: "uppercase", fontWeight: 600 }}>
                Verified Paid
              </span>
              <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--color-success)", marginTop: "4px" }}>
                ₹{studentKPIs.paid.toLocaleString("en-IN")}
              </div>
              <span style={{ fontSize: "10px", color: "var(--color-success)" }}>
                Receipts issued
              </span>
            </Card>

            <Card padding="md">
              <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)", textTransform: "uppercase", fontWeight: 600 }}>
                Outstanding Due
              </span>
              <div
                style={{
                  fontSize: "var(--text-xl)",
                  fontWeight: 700,
                  color: studentKPIs.balance > 0 ? "var(--color-warning)" : "var(--color-success)",
                  marginTop: "4px",
                }}
              >
                ₹{studentKPIs.balance.toLocaleString("en-IN")}
              </div>
              <span style={{ fontSize: "10px", color: "var(--color-neutral-dark)" }}>
                {studentKPIs.balance === 0 ? "All cleared" : "Action required"}
              </span>
            </Card>
          </>
        )}
      </div>

      {/* SECTION 3: ACADEMY ADMIN WORKSPACE */}
      {role === "academy-admin" && (
        <Card padding="lg">
          {/* Sub-Tab Navigation Strip */}
          <div
            style={{
              display: "flex",
              gap: "var(--space-2)",
              borderBottom: "1px solid var(--color-border)",
              paddingBottom: "var(--space-3)",
              marginBottom: "var(--space-4)",
              flexWrap: "wrap",
            }}
          >
            {[
              { id: "overview", label: "Overview & Analytics" },
              {
                id: "review",
                label: `Payment Review (${submissions.filter((s) => s.status === "pending").length} Pending)`,
              },
              { id: "ledgers", label: "Student Fee Ledgers" },
              { id: "config", label: "Fee Configuration & Billing" },
              { id: "destinations", label: "Payment Destinations (Admin Only)" },
              { id: "receipts", label: "Receipts & Reports" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setAdminTab(t.id as typeof adminTab)}
                style={{
                  padding: "6px 12px",
                  fontSize: "var(--text-xs)",
                  fontWeight: adminTab === t.id ? 700 : 500,
                  borderRadius: "var(--radius-md)",
                  border: "none",
                  backgroundColor: adminTab === t.id ? "var(--color-primary)" : "transparent",
                  color: adminTab === t.id ? "#FFFFFF" : "var(--color-neutral-dark)",
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ADMIN SUB-TAB 1: OVERVIEW & ANALYTICS */}
          {adminTab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
              {/* Subject Breakdown */}
              <div>
                <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, margin: "0 0 var(--space-2)" }}>
                  Subject-Wise Tuition Collection Summary
                </h3>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-xs)", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--color-border)", color: "var(--color-neutral-dark)", textTransform: "uppercase" }}>
                        <th style={{ padding: "8px 10px" }}>Subject</th>
                        <th style={{ padding: "8px 10px" }}>Active Enrollments</th>
                        <th style={{ padding: "8px 10px" }}>Total Obligation</th>
                        <th style={{ padding: "8px 10px" }}>Realized Collections</th>
                        <th style={{ padding: "8px 10px" }}>Pending Dues</th>
                        <th style={{ padding: "8px 10px" }}>Collection Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {["Mathematics", "Physics", "Chemistry", "Accountancy", "Economics"].map((sub) => {
                        const matchingEnr = enrollments.filter((e) => e.subjectName.toLowerCase() === sub.toLowerCase());
                        let subObligation = 0;
                        let subPaid = 0;

                        for (const enr of matchingEnr) {
                          const ob = obligations.find((o) => o.enrollmentId === enr.id && o.month === currentBillingMonth);
                          if (ob) {
                            const calc = calculateAccountBalance(ob, payments, adjustments);
                            subObligation += calc.netCharge;
                            subPaid += calc.paidAmount;
                          }
                        }

                        const due = Math.max(0, subObligation - subPaid);
                        const rate = subObligation > 0 ? Math.round((subPaid / subObligation) * 100) : 0;

                        return (
                          <tr key={sub} style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                            <td style={{ padding: "10px", fontWeight: 700, color: "var(--color-primary)" }}>{sub}</td>
                            <td style={{ padding: "10px" }}>{matchingEnr.length} Students</td>
                            <td style={{ padding: "10px", fontWeight: 600 }}>₹{subObligation.toLocaleString("en-IN")}</td>
                            <td style={{ padding: "10px", color: "var(--color-success)", fontWeight: 600 }}>₹{subPaid.toLocaleString("en-IN")}</td>
                            <td style={{ padding: "10px", color: due > 0 ? "var(--color-warning)" : "var(--color-neutral-dark)", fontWeight: 600 }}>
                              ₹{due.toLocaleString("en-IN")}
                            </td>
                            <td style={{ padding: "10px" }}>
                              <Badge variant={rate >= 70 ? "success" : rate >= 30 ? "warning" : "neutral"} size="sm">
                                {rate}%
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Faculty Breakdown */}
              <div>
                <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, margin: "0 0 var(--space-2)" }}>
                  Faculty-Wise Realization Status
                </h3>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-xs)", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--color-border)", color: "var(--color-neutral-dark)", textTransform: "uppercase" }}>
                        <th style={{ padding: "8px 10px" }}>Faculty Member</th>
                        <th style={{ padding: "8px 10px" }}>Assigned Subjects</th>
                        <th style={{ padding: "8px 10px" }}>Assigned Students</th>
                        <th style={{ padding: "8px 10px" }}>Monthly Target</th>
                        <th style={{ padding: "8px 10px" }}>Realized</th>
                        <th style={{ padding: "8px 10px" }}>Outstanding</th>
                      </tr>
                    </thead>
                    <tbody>
                      {faculty.map((f) => {
                        const facEnrollments = enrollments.filter((e) => e.teacherId === f.id);
                        let facTarget = 0;
                        let facPaid = 0;

                        for (const enr of facEnrollments) {
                          const ob = obligations.find((o) => o.enrollmentId === enr.id && o.month === currentBillingMonth);
                          if (ob) {
                            const calc = calculateAccountBalance(ob, payments, adjustments);
                            facTarget += calc.netCharge;
                            facPaid += calc.paidAmount;
                          }
                        }

                        const due = Math.max(0, facTarget - facPaid);

                        return (
                          <tr key={f.id} style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                            <td style={{ padding: "10px", fontWeight: 700 }}>{f.name}</td>
                            <td style={{ padding: "10px", color: "var(--color-accent)" }}>{f.assignedSubjects.join(", ")}</td>
                            <td style={{ padding: "10px" }}>{facEnrollments.length}</td>
                            <td style={{ padding: "10px", fontWeight: 600 }}>₹{facTarget.toLocaleString("en-IN")}</td>
                            <td style={{ padding: "10px", color: "var(--color-success)", fontWeight: 600 }}>₹{facPaid.toLocaleString("en-IN")}</td>
                            <td style={{ padding: "10px", color: due > 0 ? "var(--color-warning)" : "var(--color-neutral-dark)", fontWeight: 600 }}>
                              ₹{due.toLocaleString("en-IN")}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Searchable Student Fee Accounts */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-2)", flexWrap: "wrap", gap: "var(--space-2)" }}>
                  <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, margin: 0 }}>
                    Searchable Student Fee Accounts
                  </h3>
                  <input
                    type="text"
                    placeholder="Search by student name, grade, or guardian..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ padding: "6px 12px", fontSize: "11px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", minWidth: "260px" }}
                  />
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-xs)", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--color-border)", color: "var(--color-neutral-dark)", textTransform: "uppercase" }}>
                        <th style={{ padding: "8px 10px" }}>Student Name</th>
                        <th style={{ padding: "8px 10px" }}>Grade / Board</th>
                        <th style={{ padding: "8px 10px" }}>Guardian</th>
                        <th style={{ padding: "8px 10px" }}>Enrolled Subjects</th>
                        <th style={{ padding: "8px 10px" }}>Total Oct Fee</th>
                        <th style={{ padding: "8px 10px" }}>Total Oct Paid</th>
                        <th style={{ padding: "8px 10px" }}>Oct Balance</th>
                        <th style={{ padding: "8px 10px", textAlign: "right" }}>Inspect Ledger</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students
                        .filter(
                          (s) =>
                            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            s.classGrade.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            s.guardianName.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((s) => {
                          const sEnr = enrollments.filter((e) => e.studentId === s.id);
                          let stTarget = 0;
                          let stPaid = 0;

                          for (const enr of sEnr) {
                            const ob = obligations.find((o) => o.enrollmentId === enr.id && o.month === currentBillingMonth);
                            if (ob) {
                              const calc = calculateAccountBalance(ob, payments, adjustments);
                              stTarget += calc.netCharge;
                              stPaid += calc.paidAmount;
                            }
                          }

                          const stDue = Math.max(0, stTarget - stPaid);

                          return (
                            <tr key={s.id} style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                              <td style={{ padding: "10px", fontWeight: 700 }}>{s.name}</td>
                              <td style={{ padding: "10px" }}>{s.classGrade} ({s.board})</td>
                              <td style={{ padding: "10px", color: "var(--color-neutral-dark)" }}>{s.guardianName}</td>
                              <td style={{ padding: "10px", color: "var(--color-accent)", fontWeight: 500 }}>
                                {sEnr.map((e) => e.subjectName).join(", ")}
                              </td>
                              <td style={{ padding: "10px", fontWeight: 600 }}>₹{stTarget.toLocaleString("en-IN")}</td>
                              <td style={{ padding: "10px", color: "var(--color-success)", fontWeight: 600 }}>
                                ₹{stPaid.toLocaleString("en-IN")}
                              </td>
                              <td style={{ padding: "10px", color: stDue > 0 ? "var(--color-warning)" : "var(--color-success)", fontWeight: 600 }}>
                                ₹{stDue.toLocaleString("en-IN")}
                              </td>
                              <td style={{ padding: "10px", textAlign: "right" }}>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedLedgerStudentId(s.id);
                                    setAdminTab("ledgers");
                                  }}
                                  style={{ fontSize: "10px", padding: "2px 8px" }}
                                >
                                  View Ledger →
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ADMIN SUB-TAB 2: PAYMENT REVIEW */}
          {adminTab === "review" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-3)", flexWrap: "wrap", gap: "var(--space-2)" }}>
                <div>
                  <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, margin: 0 }}>
                    Online Transfer &amp; UPI Verification Ledger
                  </h3>
                  <p style={{ fontSize: "11px", color: "var(--color-neutral-dark)", margin: "2px 0 0" }}>
                    Manual bank reconciliation queue. Submissions remain Pending Verification until approved by an administrator.
                  </p>
                </div>

                <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
                  <select
                    value={reviewStatusFilter}
                    onChange={(e) => setReviewStatusFilter(e.target.value)}
                    style={{ padding: "4px 8px", fontSize: "11px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending Only</option>
                    <option value="verified">Verified Only</option>
                    <option value="rejected">Rejected Only</option>
                  </select>

                  <select
                    value={reviewSubjectFilter}
                    onChange={(e) => setReviewSubjectFilter(e.target.value)}
                    style={{ padding: "4px 8px", fontSize: "11px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}
                  >
                    <option value="all">All Subjects</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Accountancy">Accountancy</option>
                    <option value="Economics">Economics</option>
                  </select>
                </div>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-xs)", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--color-border)", color: "var(--color-neutral-dark)", textTransform: "uppercase" }}>
                      <th style={{ padding: "8px 10px" }}>Subm ID &amp; Date</th>
                      <th style={{ padding: "8px 10px" }}>Student &amp; Subject</th>
                      <th style={{ padding: "8px 10px" }}>Billing Period</th>
                      <th style={{ padding: "8px 10px" }}>Amount</th>
                      <th style={{ padding: "8px 10px" }}>Method &amp; UTR</th>
                      <th style={{ padding: "8px 10px" }}>Status</th>
                      <th style={{ padding: "8px 10px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions
                      .filter((s) => reviewStatusFilter === "all" || s.status === reviewStatusFilter)
                      .filter((s) => reviewSubjectFilter === "all" || s.subjectName.toLowerCase() === reviewSubjectFilter.toLowerCase())
                      .map((subm) => (
                        <tr key={subm.id} style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                          <td style={{ padding: "10px" }}>
                            <div style={{ fontWeight: 600 }}>{subm.id}</div>
                            <span style={{ fontSize: "10px", color: "var(--color-neutral-dark)" }}>{subm.transferDate}</span>
                          </td>
                          <td style={{ padding: "10px" }}>
                            <div style={{ fontWeight: 700 }}>{subm.studentName}</div>
                            <span style={{ fontSize: "11px", color: "var(--color-accent)" }}>{subm.subjectName} ({subm.teacherName})</span>
                          </td>
                          <td style={{ padding: "10px" }}>{subm.monthLabel}</td>
                          <td style={{ padding: "10px", fontWeight: 700, color: "var(--color-primary)" }}>
                            ₹{subm.amount.toLocaleString("en-IN")}
                          </td>
                          <td style={{ padding: "10px" }}>
                            <Badge variant={subm.paymentMethod === "upi" ? "accent" : "neutral"} size="sm">
                              {subm.paymentMethod.toUpperCase()}
                            </Badge>
                            <div style={{ fontSize: "10px", fontFamily: "monospace", marginTop: "2px" }}>
                              {subm.referenceId}
                            </div>
                          </td>
                          <td style={{ padding: "10px" }}>
                            <Badge
                              variant={subm.status === "verified" ? "success" : subm.status === "rejected" ? "neutral" : "warning"}
                              size="sm"
                              style={
                                subm.status === "rejected"
                                  ? { color: "#FF3B30", borderColor: "rgba(255, 59, 48, 0.3)", backgroundColor: "rgba(255, 59, 48, 0.08)" }
                                  : undefined
                              }
                            >
                              {subm.status.toUpperCase()}
                            </Badge>
                          </td>
                          <td style={{ padding: "10px", textAlign: "right" }}>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setSubmissionDetailModal(subm);
                                setIsRejecting(false);
                                setRejectReasonInput("");
                              }}
                            >
                              Inspect / Review
                            </Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ADMIN SUB-TAB 3: STUDENT FEE LEDGERS */}
          {adminTab === "ledgers" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)", flexWrap: "wrap", gap: "var(--space-2)" }}>
                <div>
                  <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, margin: 0 }}>
                    Subject-Wise Student Fee Accounts
                  </h3>
                  <p style={{ fontSize: "11px", color: "var(--color-neutral-dark)", margin: "2px 0 0" }}>
                    Inspect individual subject ledgers, historical charges from enrollment date, and authorize traceable adjustments.
                  </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                  <label htmlFor="admin-ledger-student-select" style={{ fontSize: "11px", color: "var(--color-neutral-dark)" }}>
                    Select Student:
                  </label>
                  <select
                    id="admin-ledger-student-select"
                    value={selectedLedgerStudentId}
                    onChange={(e) => setSelectedLedgerStudentId(e.target.value)}
                    style={{ padding: "6px 12px", fontSize: "var(--text-xs)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.classGrade}) — Enrolled {s.joiningDate}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Student Details Banner */}
              <div
                style={{
                  backgroundColor: "var(--color-surface-muted)",
                  padding: "var(--space-3) var(--space-4)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                  marginBottom: "var(--space-4)",
                  display: "flex",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "var(--space-2)",
                  fontSize: "var(--text-xs)",
                }}
              >
                <div>
                  Student ID: <strong>AA-2026-{effectiveStudent?.id.replace("std-", "")}</strong> &bull; Grade: <strong>{effectiveStudent?.classGrade} ({effectiveStudent?.board})</strong>
                </div>
                <div>
                  Guardian: <strong>{effectiveStudent?.guardianName}</strong> &bull; Enrolled Since: <strong>{effectiveStudent?.joiningDate}</strong>
                </div>
              </div>

              {/* Subject Ledgers */}
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                {studentEnrollments.map((enr) => {
                  // Find all obligations for this enrollment
                  const enrObligations = obligations.filter((o) => o.enrollmentId === enr.id);

                  return (
                    <Card key={enr.id} padding="md" style={{ border: "1px solid var(--color-border)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-3)", flexWrap: "wrap" }}>
                        <div>
                          <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-accent)" }}>
                            {enr.subjectName}
                          </span>
                          <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)", marginLeft: "8px" }}>
                            Instructor: <strong>{enr.teacherName}</strong> &bull; Monthly Rate: <strong>₹{enr.monthlyFeeAmount}/mo</strong> &bull; Joined: {enr.enrollmentDate}
                          </span>
                        </div>
                      </div>

                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", textAlign: "left" }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid var(--color-border)", color: "var(--color-neutral-dark)", textTransform: "uppercase" }}>
                            <th style={{ padding: "6px 8px" }}>Billing Period</th>
                            <th style={{ padding: "6px 8px" }}>Original Charge</th>
                            <th style={{ padding: "6px 8px" }}>Adjustments</th>
                            <th style={{ padding: "6px 8px" }}>Net Payable</th>
                            <th style={{ padding: "6px 8px" }}>Verified Paid</th>
                            <th style={{ padding: "6px 8px" }}>Balance Due</th>
                            <th style={{ padding: "6px 8px" }}>Status</th>
                            <th style={{ padding: "6px 8px", textAlign: "right" }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {enrObligations.map((ob) => {
                            const calc = calculateAccountBalance(ob, payments, adjustments);
                            return (
                              <tr key={ob.id} style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                                <td style={{ padding: "8px", fontWeight: 600 }}>{ob.monthLabel} (Due {ob.dueDate})</td>
                                <td style={{ padding: "8px" }}>₹{calc.originalFee.toLocaleString("en-IN")}</td>
                                <td style={{ padding: "8px", color: calc.totalAdjustments > 0 ? "var(--color-success)" : "inherit" }}>
                                  {calc.totalAdjustments > 0 ? `-₹${calc.totalAdjustments.toLocaleString("en-IN")}` : "₹0"}
                                </td>
                                <td style={{ padding: "8px", fontWeight: 600 }}>₹{calc.netCharge.toLocaleString("en-IN")}</td>
                                <td style={{ padding: "8px", color: "var(--color-success)", fontWeight: 600 }}>
                                  ₹{calc.paidAmount.toLocaleString("en-IN")}
                                </td>
                                <td style={{ padding: "8px", color: calc.balance > 0 ? "var(--color-warning)" : "inherit", fontWeight: 600 }}>
                                  ₹{calc.balance.toLocaleString("en-IN")}
                                </td>
                                <td style={{ padding: "8px" }}>{renderStatusBadge(calc.status)}</td>
                                <td style={{ padding: "8px", textAlign: "right" }}>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setAdjustmentModal({ isOpen: true, obligation: ob, enrollment: enr })}
                                    style={{ fontSize: "10px", padding: "2px 8px" }}
                                  >
                                    + Add Adjustment
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* ADMIN SUB-TAB 4: FEE CONFIGURATION & BILLING */}
          {adminTab === "config" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-2)" }}>
                <div>
                  <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, margin: 0 }}>
                    Subject Fee Schedules &amp; Recurring Billing Rules
                  </h3>
                  <p style={{ fontSize: "11px", color: "var(--color-neutral-dark)", margin: "2px 0 0" }}>
                    Configure standard monthly fees per subject/grade level. Fee revisions preserve historical records.
                  </p>
                </div>

                <div style={{ display: "flex", gap: "var(--space-2)" }}>
                  <Button variant="primary" size="sm" onClick={() => setIsGenerateBillsOpen(true)}>
                    + Generate Next Billing Cycle
                  </Button>
                </div>
              </div>

              {generationFeedback && (
                <div style={{ padding: "8px 12px", backgroundColor: "rgba(0, 122, 255, 0.08)", borderRadius: "var(--radius-sm)", fontSize: "11px", color: "var(--color-primary)" }}>
                  {generationFeedback}
                </div>
              )}

              {/* Fee Rules Table */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-xs)", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--color-border)", color: "var(--color-neutral-dark)", textTransform: "uppercase" }}>
                      <th style={{ padding: "8px 10px" }}>Rule ID</th>
                      <th style={{ padding: "8px 10px" }}>Grade / Class</th>
                      <th style={{ padding: "8px 10px" }}>Subject</th>
                      <th style={{ padding: "8px 10px" }}>Monthly Fee</th>
                      <th style={{ padding: "8px 10px" }}>Due Day</th>
                      <th style={{ padding: "8px 10px" }}>Effective From</th>
                      <th style={{ padding: "8px 10px" }}>Notes / History</th>
                      <th style={{ padding: "8px 10px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {configurations.map((cfg) => (
                      <tr key={cfg.id} style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                        <td style={{ padding: "10px", fontFamily: "monospace" }}>{cfg.id}</td>
                        <td style={{ padding: "10px", fontWeight: 600 }}>{cfg.classGrade}</td>
                        <td style={{ padding: "10px", color: "var(--color-accent)", fontWeight: 600 }}>{cfg.subjectName}</td>
                        <td style={{ padding: "10px", fontWeight: 700 }}>₹{cfg.monthlyFee.toLocaleString("en-IN")}/mo</td>
                        <td style={{ padding: "10px" }}>{cfg.billingDueDay}th of month</td>
                        <td style={{ padding: "10px" }}>{cfg.effectiveFrom}</td>
                        <td style={{ padding: "10px", color: "var(--color-neutral-dark)", fontSize: "11px" }}>
                          {cfg.notes}
                          {cfg.revisedFrom && (
                            <div style={{ color: "var(--color-accent)", fontSize: "10px", marginTop: "2px" }}>
                              Revised from ₹{cfg.revisedFrom} on {cfg.revisedAt}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "10px", textAlign: "right" }}>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setRevisionModal(cfg);
                              setRevisedFeeInput(String(cfg.monthlyFee));
                            }}
                          >
                            Revise Fee
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Joining Policy Box */}
              <div
                style={{
                  borderLeft: "4px solid var(--color-accent)",
                  backgroundColor: "rgba(0, 122, 255, 0.04)",
                  padding: "var(--space-3) var(--space-4)",
                  borderRadius: "0 var(--radius-sm) var(--radius-sm) 0",
                  fontSize: "11px",
                  lineHeight: 1.5,
                }}
              >
                <strong>Institutional Joining Date Policy:</strong>
                <br />
                &bull; Students joining on or before the 15th of the month are charged standard full tuition (100%).
                <br />
                &bull; Students joining after the 15th receive a 50% pro-rata orientation fee for their initial month.
                <br />
                &bull; Under no circumstances are charges backdated to periods before the student&apos;s verified enrollment date.
              </div>
            </div>
          )}

          {/* ADMIN SUB-TAB 5: PAYMENT DESTINATIONS (ADMIN ONLY) */}
          {adminTab === "destinations" && (
            <div>
              <div
                style={{
                  backgroundColor: "rgba(255, 149, 0, 0.08)",
                  border: "1px solid rgba(255, 149, 0, 0.3)",
                  borderRadius: "var(--radius-md)",
                  padding: "var(--space-3) var(--space-4)",
                  marginBottom: "var(--space-4)",
                  fontSize: "11px",
                  lineHeight: 1.5,
                  color: "var(--color-primary)",
                }}
              >
                <strong>Security Guard:</strong> Only Academy Administrators can configure and publish receiving payment destinations.
                Faculty members, students, and parents cannot upload, modify, or replace any UPI QR or bank account detail.
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--space-4)" }}>
                {destinations.map((dest) => (
                  <Card key={dest.id} padding="md" style={{ border: "1px solid var(--color-border)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-2)" }}>
                        <div>
                          <h4 style={{ fontSize: "var(--text-base)", fontWeight: 700, margin: 0 }}>{dest.subjectName}</h4>
                          <span style={{ fontSize: "11px", color: "var(--color-accent)" }}>Faculty: {dest.teacherName}</span>
                        </div>
                        <Badge variant={dest.isActive ? "success" : "neutral"} size="sm">
                          {dest.isActive ? "ACTIVE" : "DISABLED"}
                        </Badge>
                      </div>

                      <div style={{ fontSize: "11px", display: "flex", flexDirection: "column", gap: "4px", margin: "var(--space-3) 0", padding: "var(--space-3)", backgroundColor: "var(--color-surface-muted)", borderRadius: "var(--radius-sm)" }}>
                        <div>
                          UPI ID: <strong style={{ color: "var(--color-primary)" }}>{dest.upiId}</strong>
                        </div>
                        <div>
                          Account Holder: <strong>{dest.accountHolderName}</strong>
                        </div>
                        <div>
                          Bank: <strong>{dest.bankName}</strong> ({dest.branchName})
                        </div>
                        <div>
                          Account No: <strong>{dest.accountNumber}</strong> &bull; IFSC: <strong>{dest.ifscCode}</strong>
                        </div>
                        <div style={{ fontSize: "10px", color: "var(--color-neutral-dark)", marginTop: "4px" }}>
                          Last Updated: {dest.lastUpdated} by {dest.updatedBy}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-3)", borderTop: "1px solid var(--color-border-subtle)", paddingTop: "var(--space-2)" }}>
                      <Button variant="secondary" size="sm" onClick={() => handleOpenEditDestination(dest)} style={{ flex: 1 }}>
                        Configure / Replace QR
                      </Button>
                      <Button
                        variant={dest.isActive ? "secondary" : "primary"}
                        size="sm"
                        onClick={() => handleToggleDestinationActive(dest)}
                      >
                        {dest.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* ADMIN SUB-TAB 6: RECEIPTS & REPORTS */}
          {adminTab === "receipts" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-3)", flexWrap: "wrap", gap: "var(--space-2)" }}>
                <div>
                  <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, margin: 0 }}>
                    Official Fee Receipts Ledger ({receipts.length})
                  </h3>
                  <p style={{ fontSize: "11px", color: "var(--color-neutral-dark)", margin: "2px 0 0" }}>
                    Uniquely numbered receipts generated exclusively upon payment verification.
                  </p>
                </div>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-xs)", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--color-border)", color: "var(--color-neutral-dark)", textTransform: "uppercase" }}>
                      <th style={{ padding: "8px 10px" }}>Receipt No</th>
                      <th style={{ padding: "8px 10px" }}>Student &amp; Class</th>
                      <th style={{ padding: "8px 10px" }}>Subject</th>
                      <th style={{ padding: "8px 10px" }}>Period</th>
                      <th style={{ padding: "8px 10px" }}>Amount Received</th>
                      <th style={{ padding: "8px 10px" }}>Verified Date</th>
                      <th style={{ padding: "8px 10px" }}>Tx Reference</th>
                      <th style={{ padding: "8px 10px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipts.map((rec) => (
                      <tr key={rec.id} style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                        <td style={{ padding: "10px", fontWeight: 700, color: "var(--color-primary)" }}>{rec.receiptNumber}</td>
                        <td style={{ padding: "10px" }}>
                          <div style={{ fontWeight: 600 }}>{rec.studentName}</div>
                          <span style={{ fontSize: "10px", color: "var(--color-neutral-dark)" }}>{rec.classGrade}</span>
                        </td>
                        <td style={{ padding: "10px", color: "var(--color-accent)" }}>{rec.subjectName}</td>
                        <td style={{ padding: "10px" }}>{rec.monthLabel}</td>
                        <td style={{ padding: "10px", fontWeight: 700, color: "var(--color-success)" }}>
                          ₹{rec.amountReceived.toLocaleString("en-IN")}
                        </td>
                        <td style={{ padding: "10px" }}>{rec.verifiedDate}</td>
                        <td style={{ padding: "10px", fontFamily: "monospace", fontSize: "10px" }}>{rec.referenceId}</td>
                        <td style={{ padding: "10px", textAlign: "right" }}>
                          <Button variant="secondary" size="sm" onClick={() => handleOpenReceiptVoucher(rec)}>
                            View / Print Voucher
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* SECTION 4: TEACHER VIEW */}
      {role === "teacher" && (
        <Card padding="lg">
          <div style={{ marginBottom: "var(--space-4)" }}>
            <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, margin: 0 }}>
              My Assigned Students — Subject Fee Ledger
            </h3>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", margin: "2px 0 0" }}>
              Read-only subject payment records for students enrolled in your faculty batches.
            </p>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-xs)", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border)", color: "var(--color-neutral-dark)", textTransform: "uppercase" }}>
                  <th style={{ padding: "8px 10px" }}>Student Name</th>
                  <th style={{ padding: "8px 10px" }}>Class &amp; Batch</th>
                  <th style={{ padding: "8px 10px" }}>Subject</th>
                  <th style={{ padding: "8px 10px" }}>Monthly Rate</th>
                  <th style={{ padding: "8px 10px" }}>Oct 2026 Status</th>
                  <th style={{ padding: "8px 10px" }}>Oct Paid / Due</th>
                  <th style={{ padding: "8px 10px" }}>Sep 2026 Status</th>
                </tr>
              </thead>
              <tbody>
                {teacherEnrollments.map((enr) => {
                  const currentOb = obligations.find((o) => o.enrollmentId === enr.id && o.month === currentBillingMonth);
                  const prevOb = obligations.find((o) => o.enrollmentId === enr.id && o.month === prevBillingMonth);

                  const currentCalc = currentOb
                    ? calculateAccountBalance(currentOb, payments, adjustments)
                    : { paidAmount: 0, balance: 0, status: "unpaid" as FeePaymentStatus };

                  const prevCalc = prevOb
                    ? calculateAccountBalance(prevOb, payments, adjustments)
                    : { status: "paid" as FeePaymentStatus };

                  return (
                    <tr key={enr.id} style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                      <td style={{ padding: "10px", fontWeight: 700 }}>{enr.studentName}</td>
                      <td style={{ padding: "10px" }}>
                        <div>{enr.classGrade}</div>
                        <span style={{ fontSize: "10px", color: "var(--color-neutral-dark)" }}>{enr.batchName}</span>
                      </td>
                      <td style={{ padding: "10px", color: "var(--color-accent)", fontWeight: 600 }}>{enr.subjectName}</td>
                      <td style={{ padding: "10px", fontWeight: 600 }}>₹{enr.monthlyFeeAmount.toLocaleString("en-IN")}</td>
                      <td style={{ padding: "10px" }}>{renderStatusBadge(currentCalc.status)}</td>
                      <td style={{ padding: "10px" }}>
                        <span style={{ color: "var(--color-success)", fontWeight: 600 }}>₹{currentCalc.paidAmount}</span>
                        {currentCalc.balance > 0 && (
                          <span style={{ color: "var(--color-warning)", marginLeft: "6px" }}>
                            (₹{currentCalc.balance} due)
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "10px" }}>{renderStatusBadge(prevCalc.status)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* SECTION 5: STUDENT & PARENT VIEW */}
      {(role === "student" || role === "parent") && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          {/* Enrolled Subjects & Pay Action */}
          <Card padding="lg">
            <div style={{ marginBottom: "var(--space-4)" }}>
              <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, margin: 0 }}>
                {role === "parent" ? "Ward's Enrolled Subject Accounts" : "My Enrolled Subject Accounts"}
              </h3>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", margin: "2px 0 0" }}>
                Each subject account is managed separately with its assigned faculty, monthly obligations, and official receipts.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "var(--space-4)" }}>
              {studentEnrollments.map((enr) => {
                const enrObs = obligations.filter((o) => o.enrollmentId === enr.id);
                const currentOb =
                  enrObs.find((o) => o.month === currentBillingMonth) ||
                  enrObs[enrObs.length - 1] || {
                    id: `ob-${enr.id}-${currentBillingMonth}`,
                    enrollmentId: enr.id,
                    studentId: enr.studentId,
                    studentName: enr.studentName,
                    subjectName: enr.subjectName,
                    teacherId: enr.teacherId,
                    month: currentBillingMonth,
                    monthLabel: formatBillingMonthLabel(currentBillingMonth),
                    feeAmount: enr.monthlyFeeAmount,
                    dueDate: `${currentBillingMonth}-15`,
                  };

                const calc = calculateAccountBalance(currentOb, payments, adjustments);
                const pendingSubm = submissions.find(
                  (s) => (s.obligationId === currentOb.id || s.enrollmentId === enr.id) && s.status === "pending"
                );
                const rejectedSubm = submissions.find(
                  (s) => (s.obligationId === currentOb.id || s.enrollmentId === enr.id) && s.status === "rejected"
                );
                const matchingReceipt = receipts.find(
                  (r) => r.enrollmentId === enr.id && (r.obligationId === currentOb.id || r.monthLabel === currentOb.monthLabel)
                );

                return (
                  <Card key={enr.id} padding="md" style={{ border: "1px solid var(--color-border)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-2)" }}>
                        <div>
                          <h4 style={{ fontSize: "var(--text-base)", fontWeight: 700, margin: 0, color: "var(--color-accent)" }}>
                            {enr.subjectName}
                          </h4>
                          <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)" }}>
                            Instructor: <strong>{enr.teacherName}</strong>
                          </span>
                        </div>
                        {pendingSubm ? (
                          <Badge variant="warning" size="sm">Pending Verification</Badge>
                        ) : (
                          renderStatusBadge(calc.status)
                        )}
                      </div>

                      <div style={{ fontSize: "11px", margin: "var(--space-3) 0", display: "flex", flexDirection: "column", gap: "3px" }}>
                        <div>Billing Period: <strong>{currentOb.monthLabel}</strong></div>
                        <div>Monthly Obligation: <strong>₹{calc.originalFee.toLocaleString("en-IN")}</strong></div>
                        {calc.totalAdjustments > 0 && (
                          <div style={{ color: "var(--color-success)" }}>
                            Applied Waiver: -₹{calc.totalAdjustments.toLocaleString("en-IN")}
                          </div>
                        )}
                        <div>Verified Paid: <strong style={{ color: "var(--color-success)" }}>₹{calc.paidAmount.toLocaleString("en-IN")}</strong></div>
                        <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: calc.balance > 0 ? "var(--color-warning)" : "var(--color-success)", marginTop: "4px" }}>
                          Balance Due: ₹{calc.balance.toLocaleString("en-IN")}
                        </div>
                        <div style={{ fontSize: "10px", color: "var(--color-neutral-dark)" }}>
                          Due Date: {currentOb.dueDate}
                        </div>
                      </div>

                      {pendingSubm && (
                        <div style={{ padding: "6px 8px", backgroundColor: "rgba(255, 149, 0, 0.1)", border: "1px solid rgba(255, 149, 0, 0.3)", borderRadius: "var(--radius-sm)", fontSize: "10px", color: "#D97706", marginBottom: "var(--space-2)" }}>
                          <strong>⏳ Payment Submitted:</strong> ₹{pendingSubm.amount.toLocaleString("en-IN")} (Ref: {pendingSubm.referenceId}) is awaiting Admin reconciliation. Balance will update upon verification.
                        </div>
                      )}

                      {!pendingSubm && rejectedSubm && (
                        <div style={{ padding: "6px 8px", backgroundColor: "rgba(255, 59, 48, 0.08)", border: "1px solid rgba(255, 59, 48, 0.25)", borderRadius: "var(--radius-sm)", fontSize: "10px", color: "#DC2626", marginBottom: "var(--space-2)" }}>
                          <strong>⚠️ Last Transfer Rejected:</strong> {rejectedSubm.rejectionReason}
                        </div>
                      )}
                    </div>

                    <div style={{ marginTop: "var(--space-3)", borderTop: "1px solid var(--color-border-subtle)", paddingTop: "var(--space-3)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-2)" }}>
                      {calc.balance > 0 ? (
                        <>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontSize: "10px", color: "var(--color-neutral-dark)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.5px" }}>
                              Outstanding Due
                            </span>
                            <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-warning)" }}>
                              ₹{calc.balance.toLocaleString("en-IN")}
                            </span>
                          </div>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleOpenPayModal(currentOb, enr, calc.balance)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "6px 14px",
                              fontSize: "12px",
                              fontWeight: 600,
                              borderRadius: "var(--radius-sm)",
                              backgroundColor: "var(--color-accent)",
                              borderColor: "var(--color-accent)",
                              cursor: "pointer",
                            }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <rect x="2" y="5" width="20" height="14" rx="2" />
                              <line x1="2" y1="10" x2="22" y2="10" />
                            </svg>
                            <span>Pay Now · ₹{calc.balance.toLocaleString("en-IN")}</span>
                          </Button>
                        </>
                      ) : (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                          <Badge variant="success" size="sm">✓ Paid</Badge>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              matchingReceipt
                                ? handleOpenReceiptVoucher(matchingReceipt)
                                : handleOpenReceiptForObligation(currentOb, enr, calc)
                            }
                            style={{ fontSize: "11px", padding: "4px 10px" }}
                          >
                            View Receipt
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </Card>

          {/* Payment Submissions Queue & Status */}
          <Card padding="lg">
            <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, margin: "0 0 var(--space-3)" }}>
              My Transfer Submissions ({submissions.filter((s) => s.studentId === effectiveStudent?.id).length})
            </h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-xs)", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)", color: "var(--color-neutral-dark)", textTransform: "uppercase" }}>
                    <th style={{ padding: "8px 10px" }}>Subm ID &amp; Date</th>
                    <th style={{ padding: "8px 10px" }}>Subject</th>
                    <th style={{ padding: "8px 10px" }}>Billing Period</th>
                    <th style={{ padding: "8px 10px" }}>Amount</th>
                    <th style={{ padding: "8px 10px" }}>Reference / UTR</th>
                    <th style={{ padding: "8px 10px" }}>Verification Status</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions
                    .filter((s) => s.studentId === effectiveStudent?.id)
                    .map((subm) => (
                      <tr key={subm.id} style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                        <td style={{ padding: "10px" }}>
                          <div style={{ fontWeight: 600 }}>{subm.id}</div>
                          <span style={{ fontSize: "10px", color: "var(--color-neutral-dark)" }}>{subm.transferDate}</span>
                        </td>
                        <td style={{ padding: "10px", fontWeight: 600 }}>{subm.subjectName}</td>
                        <td style={{ padding: "10px" }}>{subm.monthLabel}</td>
                        <td style={{ padding: "10px", fontWeight: 700 }}>₹{subm.amount.toLocaleString("en-IN")}</td>
                        <td style={{ padding: "10px", fontFamily: "monospace" }}>{subm.referenceId}</td>
                        <td style={{ padding: "10px" }}>
                          {subm.status === "verified" ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <Badge variant="success" size="sm">VERIFIED</Badge>
                              {subm.receiptNumber && (
                                <span style={{ fontSize: "10px", color: "var(--color-primary)", fontWeight: 600 }}>
                                  {subm.receiptNumber}
                                </span>
                              )}
                            </div>
                          ) : subm.status === "rejected" ? (
                            <div>
                              <Badge variant="neutral" size="sm" style={{ color: "#FF3B30", borderColor: "rgba(255, 59, 48, 0.3)" }}>
                                REJECTED
                              </Badge>
                              {subm.rejectionReason && (
                                <div style={{ fontSize: "10px", color: "#FF3B30", marginTop: "2px" }}>
                                  Reason: {subm.rejectionReason}
                                </div>
                              )}
                            </div>
                          ) : (
                            <Badge variant="warning" size="sm">PENDING VERIFICATION</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Official Fee Receipts */}
          <Card padding="lg">
            <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, margin: "0 0 var(--space-3)" }}>
              Official Fee Receipts &amp; Vouchers
            </h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-xs)", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)", color: "var(--color-neutral-dark)", textTransform: "uppercase" }}>
                    <th style={{ padding: "8px 10px" }}>Receipt No</th>
                    <th style={{ padding: "8px 10px" }}>Subject</th>
                    <th style={{ padding: "8px 10px" }}>Period</th>
                    <th style={{ padding: "8px 10px" }}>Amount Received</th>
                    <th style={{ padding: "8px 10px" }}>Verified Date</th>
                    <th style={{ padding: "8px 10px" }}>Reference</th>
                    <th style={{ padding: "8px 10px", textAlign: "right" }}>Voucher</th>
                  </tr>
                </thead>
                <tbody>
                  {receipts
                    .filter((r) => r.studentId === effectiveStudent?.id)
                    .map((rec) => (
                      <tr key={rec.id} style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                        <td style={{ padding: "10px", fontWeight: 700, color: "var(--color-primary)" }}>{rec.receiptNumber}</td>
                        <td style={{ padding: "10px", color: "var(--color-accent)", fontWeight: 600 }}>{rec.subjectName}</td>
                        <td style={{ padding: "10px" }}>{rec.monthLabel}</td>
                        <td style={{ padding: "10px", fontWeight: 700, color: "var(--color-success)" }}>
                          ₹{rec.amountReceived.toLocaleString("en-IN")}
                        </td>
                        <td style={{ padding: "10px" }}>{rec.verifiedDate}</td>
                        <td style={{ padding: "10px", fontFamily: "monospace", fontSize: "10px" }}>{rec.referenceId}</td>
                        <td style={{ padding: "10px", textAlign: "right" }}>
                          <Button variant="secondary" size="sm" onClick={() => handleOpenReceiptVoucher(rec)}>
                            View / Print Receipt
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: Payment Review & Approval/Rejection (Admin Only) */}
      {/* ------------------------------------------------------------- */}
      {submissionDetailModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--space-4)",
            zIndex: 100,
          }}
        >
          <Card padding="lg" style={{ maxWidth: "540px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 700, margin: "0 0 var(--space-2)" }}>
              Inspect Payment Submission — {submissionDetailModal.id}
            </h3>

            <div style={{ fontSize: "var(--text-xs)", display: "flex", flexDirection: "column", gap: "6px", margin: "var(--space-3) 0", padding: "var(--space-3)", backgroundColor: "var(--color-surface-muted)", borderRadius: "var(--radius-md)" }}>
              <div>Student: <strong>{submissionDetailModal.studentName}</strong> (ID: {submissionDetailModal.studentId})</div>
              <div>Subject: <strong style={{ color: "var(--color-accent)" }}>{submissionDetailModal.subjectName}</strong> &bull; Faculty: {submissionDetailModal.teacherName}</div>
              <div>Period: <strong>{submissionDetailModal.monthLabel}</strong></div>
              <div>Declared Amount: <strong style={{ color: "var(--color-primary)", fontSize: "var(--text-sm)" }}>₹{submissionDetailModal.amount.toLocaleString("en-IN")}</strong></div>
              <div>
                Payment Mode:{" "}
                <Badge variant="accent" size="sm">
                  {submissionDetailModal.paymentMethod === "upi" ? "UPI Payment" : "Bank Transfer"}
                </Badge>
              </div>
              <div>
                Transaction Reference:{" "}
                <strong style={{ fontFamily: "monospace" }}>
                  {submissionDetailModal.referenceId || "Screenshot Proof (No Manual UTR)"}
                </strong>
              </div>
              <div>Transfer Date: {submissionDetailModal.transferDate} &bull; Submitted At: {submissionDetailModal.submittedAt}</div>
              <div>Submitted By: {submissionDetailModal.submittedByName} ({submissionDetailModal.submittedByRole})</div>
              {submissionDetailModal.rejectionReason && (
                <div style={{ color: "#FF3B30", fontWeight: 600 }}>Rejection Reason: {submissionDetailModal.rejectionReason}</div>
              )}
            </div>

            {/* Uploaded Payment Screenshot Proof Inspection */}
            {submissionDetailModal.proofFileData ? (
              <div style={{ margin: "var(--space-3) 0", padding: "10px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", backgroundColor: "#FFFFFF" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-primary)", marginBottom: "6px", display: "flex", justifyContent: "space-between" }}>
                  <span>📷 Attached Payment Screenshot Proof:</span>
                  <span style={{ color: "var(--color-neutral-dark)", fontWeight: 400 }}>{submissionDetailModal.proofFileName}</span>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={submissionDetailModal.proofFileData}
                  alt="Payment Proof Screenshot"
                  style={{ width: "100%", maxHeight: "260px", objectFit: "contain", borderRadius: "var(--radius-sm)", display: "block" }}
                />
              </div>
            ) : submissionDetailModal.proofFileName ? (
              <div style={{ padding: "8px 12px", backgroundColor: "var(--color-surface-muted)", borderRadius: "var(--radius-sm)", border: "1px dashed var(--color-border)", fontSize: "11px", color: "var(--color-neutral-dark)", margin: "var(--space-2) 0" }}>
                📷 Attached Screenshot File: <strong>{submissionDetailModal.proofFileName}</strong>
              </div>
            ) : null}

            {/* Rejection Form Input */}
            {isRejecting ? (
              <div style={{ margin: "var(--space-3) 0" }}>
                <label style={{ fontSize: "11px", fontWeight: 600, display: "block", marginBottom: "4px", color: "#FF3B30" }}>
                  Provide Rejection Reason (Required):
                </label>
                <textarea
                  value={rejectReasonInput}
                  onChange={(e) => setRejectReasonInput(e.target.value)}
                  placeholder="e.g. Transaction UTR not reflected in institute bank statement; please verify and resubmit."
                  rows={3}
                  style={{ width: "100%", padding: "8px", fontSize: "11px", borderRadius: "var(--radius-sm)", border: "1px solid #FF3B30" }}
                />
              </div>
            ) : null}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-4)" }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSubmissionDetailModal(null);
                  setIsRejecting(false);
                }}
              >
                Close
              </Button>

              {submissionDetailModal.status === "pending" && !isRejecting && (
                <>
                  <Button variant="secondary" size="sm" onClick={() => setIsRejecting(true)} style={{ color: "#FF3B30", borderColor: "rgba(255, 59, 48, 0.3)" }}>
                    Reject Submission...
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => handleApproveSubmission(submissionDetailModal)}>
                    ✓ Approve &amp; Generate Receipt
                  </Button>
                </>
              )}

              {isRejecting && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleRejectSubmission}
                  disabled={!rejectReasonInput.trim()}
                  style={{ backgroundColor: "#FF3B30", color: "#FFFFFF", borderColor: "#FF3B30" }}
                >
                  Confirm Rejection
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: Student/Parent Online Payment Flow (10-Step Wizard) */}
      {/* ------------------------------------------------------------- */}
      {payModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--space-4)",
            zIndex: 100,
          }}
        >
          <Card padding="lg" style={{ maxWidth: "520px", width: "100%", maxHeight: "92vh", overflowY: "auto", borderRadius: "var(--radius-lg)", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            {/* Header with Title and Close Action */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-3)" }}>
              <div>
                <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 700, margin: 0, color: "var(--color-primary)" }}>
                  Pay Tuition Fee
                </h3>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", margin: "3px 0 0" }}>
                  <strong>{payModal.enrollment.subjectName}</strong> &bull; {payModal.enrollment.studentName} ({payModal.enrollment.classGrade}) &bull; {payModal.obligation.monthLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPayModal(null)}
                aria-label="Close"
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-neutral-dark)",
                  fontSize: "18px",
                  lineHeight: 1,
                  padding: "4px 8px",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                ✕
              </button>
            </div>

            {/* Prominent Outstanding Amount */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 16px",
                backgroundColor: "var(--color-surface-muted)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                marginBottom: "var(--space-4)",
              }}
            >
              <div>
                <span style={{ fontSize: "10px", color: "var(--color-neutral-dark)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.5px", display: "block" }}>
                  Outstanding Amount Due
                </span>
                <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)" }}>
                  Period: <strong>{payModal.obligation.monthLabel}</strong>
                </span>
              </div>
              <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-accent)" }}>
                ₹{payModal.balance.toLocaleString("en-IN")}
              </div>
            </div>

            {/* Admin Destination Resolution & Method Selection */}
            {(() => {
              const dest = destinations.find(
                (d) =>
                  d.subjectName.toLowerCase() === payModal.enrollment.subjectName.toLowerCase() &&
                  d.isActive &&
                  (!payModal.enrollment.teacherId || d.teacherId === payModal.enrollment.teacherId)
              ) || destinations.find(
                (d) => d.subjectName.toLowerCase() === payModal.enrollment.subjectName.toLowerCase() && d.isActive
              );

              if (!dest) {
                return (
                  <div>
                    <div style={{ padding: "14px", backgroundColor: "rgba(255, 59, 48, 0.08)", border: "1px solid rgba(255, 59, 48, 0.3)", borderRadius: "var(--radius-md)", color: "#FF3B30", fontSize: "12px", lineHeight: 1.5, margin: "var(--space-3) 0" }}>
                      <strong>Payment details are not configured. Please contact the Academy Office.</strong>
                      <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--color-neutral-dark)" }}>
                        No verified institutional payment destination has been published by Academy Admin for {payModal.enrollment.subjectName}. Online submission is disabled until authorized account details are published.
                      </p>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "var(--space-4)" }}>
                      <Button variant="secondary" size="sm" onClick={() => setPayModal(null)}>
                        Close
                      </Button>
                    </div>
                  </div>
                );
              }

              return (
                <div>
                  {/* Step 1: Select Payment Method */}
                  <div style={{ marginBottom: "var(--space-3)" }}>
                    <label
                      htmlFor="payment-method-select"
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "var(--color-primary)",
                        display: "block",
                        marginBottom: "4px",
                      }}
                    >
                      Payment Method:
                    </label>
                    <select
                      id="payment-method-select"
                      name="paymentMethod"
                      aria-label="Payment Method"
                      value={payMethodInput}
                      onChange={(e) => setPayMethodInput(e.target.value as "upi" | "bank_transfer")}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        fontSize: "12px",
                        fontWeight: 500,
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--color-border)",
                        backgroundColor: "var(--color-surface)",
                        color: "var(--color-primary)",
                        cursor: "pointer",
                        marginBottom: "var(--space-2)",
                        outline: "none",
                      }}
                    >
                      <option value="upi">UPI Transfer (Google Pay, PhonePe, Paytm)</option>
                      <option value="bank_transfer">Direct Bank Transfer (NEFT / IMPS / RTGS)</option>
                    </select>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-2)" }}>
                      {/* UPI Option */}
                      <button
                        type="button"
                        onClick={() => setPayMethodInput("upi")}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "10px 12px",
                          borderRadius: "var(--radius-md)",
                          border: payMethodInput === "upi" ? "2px solid var(--color-accent)" : "1px solid var(--color-border)",
                          backgroundColor: payMethodInput === "upi" ? "rgba(0, 122, 255, 0.06)" : "var(--color-surface)",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: payMethodInput === "upi" ? "var(--color-accent)" : "rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "center", color: payMethodInput === "upi" ? "#FFFFFF" : "var(--color-primary)", flexShrink: 0 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                            <line x1="12" y1="18" x2="12.01" y2="18"/>
                          </svg>
                        </div>
                        <div>
                          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-primary)" }}>UPI Transfer</div>
                          <div style={{ fontSize: "10px", color: "var(--color-neutral-dark)" }}>QR &bull; GPay &bull; PhonePe</div>
                        </div>
                      </button>

                      {/* Bank Transfer Option */}
                      <button
                        type="button"
                        onClick={() => setPayMethodInput("bank_transfer")}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "10px 12px",
                          borderRadius: "var(--radius-md)",
                          border: payMethodInput === "bank_transfer" ? "2px solid var(--color-accent)" : "1px solid var(--color-border)",
                          backgroundColor: payMethodInput === "bank_transfer" ? "rgba(0, 122, 255, 0.06)" : "var(--color-surface)",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: payMethodInput === "bank_transfer" ? "var(--color-accent)" : "rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "center", color: payMethodInput === "bank_transfer" ? "#FFFFFF" : "var(--color-primary)", flexShrink: 0 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polygon points="12 2 2 7 22 7 12 2"/>
                            <rect x="4" y="10" width="16" height="10"/>
                            <line x1="12" y1="10" x2="12" y2="20"/>
                          </svg>
                        </div>
                        <div>
                          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-primary)" }}>Direct Bank Transfer</div>
                          <div style={{ fontSize: "10px", color: "var(--color-neutral-dark)" }}>NEFT &bull; IMPS &bull; RTGS</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Step 2: Method-Specific Instructions */}
                  {payMethodInput === "upi" ? (
                    <div style={{ padding: "12px", backgroundColor: "var(--color-surface-muted)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", marginBottom: "var(--space-3)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-primary)" }}>
                          Admin-Verified UPI Destination ({dest.subjectName}):
                        </span>
                        <span style={{ fontSize: "10px", color: "var(--color-neutral-dark)" }}>
                          Faculty: {dest.teacherName}
                        </span>
                      </div>

                      {/* QR Code when configured */}
                      {dest.qrImageUrl ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "10px", backgroundColor: "#FFFFFF", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", margin: "6px 0 10px" }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={dest.qrImageUrl}
                            alt={`${dest.subjectName} UPI QR Code`}
                            style={{ width: "140px", height: "140px", objectFit: "contain", display: "block" }}
                          />
                          <span style={{ fontSize: "10px", color: "var(--color-neutral-dark)", marginTop: "4px" }}>
                            Admin-Configured QR &bull; Scan using any UPI app
                          </span>
                        </div>
                      ) : null}

                      {/* UPI ID Row */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", padding: "6px 8px", backgroundColor: "#FFFFFF", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", margin: "6px 0" }}>
                        <div style={{ fontSize: "11px", overflow: "hidden", textOverflow: "ellipsis" }}>
                          UPI ID: <strong style={{ color: "var(--color-accent)" }}>{dest.upiId}</strong>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            if (typeof navigator !== "undefined") {
                              navigator.clipboard.writeText(dest.upiId);
                              setCopiedUpi(true);
                              setTimeout(() => setCopiedUpi(false), 2000);
                            }
                          }}
                          style={{ fontSize: "10px", padding: "3px 8px", flexShrink: 0 }}
                        >
                          {copiedUpi ? "✓ Copied" : "Copy UPI ID"}
                        </Button>
                      </div>

                      {/* Open in UPI App Deep-link */}
                      <a
                        href={`upi://pay?pa=${encodeURIComponent(dest.upiId)}&pn=${encodeURIComponent(dest.accountHolderName)}&am=${encodeURIComponent(payAmountInput || payModal.balance)}&cu=INR&tn=${encodeURIComponent(`Aroush Academy ${payModal.enrollment.subjectName} Fee`)}`}
                        style={{
                          display: "block",
                          textAlign: "center",
                          padding: "7px 12px",
                          backgroundColor: "var(--color-accent)",
                          color: "#FFFFFF",
                          borderRadius: "var(--radius-sm)",
                          fontSize: "11px",
                          fontWeight: 600,
                          textDecoration: "none",
                          margin: "8px 0 6px",
                        }}
                      >
                        🚀 Open in UPI App
                      </a>

                      <p style={{ fontSize: "10px", color: "var(--color-neutral-dark)", margin: "4px 0 0", lineHeight: 1.4 }}>
                        <strong>Payment Guidance:</strong> If paying on this phone, tap &ldquo;Open in UPI App&rdquo; or copy the UPI ID. If using another phone or computer, scan the QR code above.
                      </p>
                    </div>
                  ) : (
                    <div style={{ padding: "12px", backgroundColor: "var(--color-surface-muted)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", marginBottom: "var(--space-3)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-primary)" }}>
                          Admin-Verified Bank Account ({dest.subjectName}):
                        </span>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleCopyBankDetails(dest)}
                          style={{ fontSize: "10px", padding: "3px 8px" }}
                        >
                          {copiedBank ? "✓ Copied Details" : "Copy All Details"}
                        </Button>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "11px", backgroundColor: "#FFFFFF", padding: "10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}>
                        <div>
                          <span style={{ color: "var(--color-neutral-dark)", fontSize: "10px", display: "block" }}>Beneficiary Name</span>
                          <strong>{dest.accountHolderName}</strong>
                        </div>
                        <div>
                          <span style={{ color: "var(--color-neutral-dark)", fontSize: "10px", display: "block" }}>Bank &amp; Branch</span>
                          <strong>{dest.bankName}</strong> ({dest.branchName})
                        </div>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                            <span style={{ color: "var(--color-neutral-dark)", fontSize: "10px" }}>Account Number</span>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleCopyAccountNumber(dest.accountNumber)}
                              style={{ fontSize: "9px", padding: "1px 5px", lineHeight: 1.2 }}
                            >
                              {copiedAccount ? "✓ Copied" : "Copy"}
                            </Button>
                          </div>
                          <strong style={{ fontFamily: "monospace", fontSize: "12px" }}>{dest.accountNumber}</strong>
                        </div>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                            <span style={{ color: "var(--color-neutral-dark)", fontSize: "10px" }}>IFSC Code</span>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleCopyIfsc(dest.ifscCode)}
                              style={{ fontSize: "9px", padding: "1px 5px", lineHeight: 1.2 }}
                            >
                              {copiedIfsc ? "✓ Copied" : "Copy"}
                            </Button>
                          </div>
                          <strong style={{ fontFamily: "monospace", fontSize: "12px" }}>{dest.ifscCode}</strong>
                        </div>
                      </div>

                      <p style={{ fontSize: "10px", color: "var(--color-neutral-dark)", margin: "6px 0 0", lineHeight: 1.4 }}>
                        <strong>NEFT / IMPS / RTGS Instructions:</strong> Transfer the fee using your mobile banking or net banking application. Enter the verified beneficiary account number and IFSC code above. After successful transfer, upload the transaction confirmation screenshot below.
                      </p>
                    </div>
                  )}

                  {/* Step 3: Mandatory Screenshot Proof Upload */}
                  <div style={{ margin: "var(--space-3) 0" }}>
                    <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-primary)", display: "block", marginBottom: "3px" }}>
                      Upload Payment Screenshot (Required) <span style={{ color: "var(--color-accent)" }}>*</span>:
                    </label>
                    <p style={{ fontSize: "10px", color: "var(--color-neutral-dark)", margin: "0 0 6px" }}>
                      Upload a clear screenshot of the completed transfer showing the transaction status (PNG, JPEG, WebP, max 2 MB).
                    </p>

                    {!payProofFile ? (
                      <div
                        onClick={() => document.getElementById("pay-screenshot-file-input")?.click()}
                        style={{
                          border: "1.5px dashed var(--color-border)",
                          borderRadius: "var(--radius-md)",
                          padding: "16px 12px",
                          textAlign: "center",
                          backgroundColor: "rgba(0,0,0,0.01)",
                          cursor: "pointer",
                          transition: "border-color 0.15s ease",
                        }}
                      >
                        <input
                          id="pay-screenshot-file-input"
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          style={{ display: "none" }}
                          onChange={handleProofFileChange}
                        />
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <polyline points="21 15 16 10 5 21"/>
                          </svg>
                          <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-accent)" }}>
                            Click to Upload Payment Screenshot
                          </span>
                          <span style={{ fontSize: "9px", color: "var(--color-neutral-dark)" }}>
                            PNG, JPEG, or WebP &bull; Max 2 MB
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", backgroundColor: "var(--color-surface-muted)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={payProofFile.dataUrl}
                            alt="Screenshot Preview"
                            style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}
                          />
                          <div>
                            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-primary)", wordBreak: "break-all" }}>
                              {payProofFile.name}
                            </div>
                            <span style={{ fontSize: "9px", color: "var(--color-neutral-dark)" }}>
                              {(payProofFile.size / 1024).toFixed(1)} KB &bull; Screenshot attached
                            </span>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <input
                            id="pay-screenshot-replace-input"
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            style={{ display: "none" }}
                            onChange={handleProofFileChange}
                          />
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => document.getElementById("pay-screenshot-replace-input")?.click()}
                            style={{ fontSize: "10px", padding: "2px 6px" }}
                          >
                            Replace
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setPayProofFile(null)}
                            style={{ fontSize: "10px", padding: "2px 6px", color: "#FF3B30", borderColor: "rgba(255, 59, 48, 0.3)" }}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Step 4: Amount & Transfer Date */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-2)", margin: "var(--space-3) 0" }}>
                    <div>
                      <label style={{ fontSize: "11px", fontWeight: 600, display: "block", marginBottom: "3px" }}>
                        Amount (₹):
                      </label>
                      <input
                        type="number"
                        value={payAmountInput}
                        onChange={(e) => setPayAmountInput(e.target.value)}
                        max={payModal.balance}
                        style={{ width: "100%", padding: "6px 8px", fontSize: "12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "11px", fontWeight: 600, display: "block", marginBottom: "3px" }}>
                        Payment Date:
                      </label>
                      <input
                        type="date"
                        value={payDateInput}
                        onChange={(e) => setPayDateInput(e.target.value)}
                        style={{ width: "100%", padding: "6px 8px", fontSize: "12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}
                      />
                    </div>
                  </div>

                  {/* Optional Reference field (secondary) */}
                  <div style={{ marginBottom: "var(--space-3)" }}>
                    <label style={{ fontSize: "11px", fontWeight: 600, display: "block", marginBottom: "2px", color: "var(--color-neutral-dark)" }}>
                      Bank UTR / Reference ID (Optional):
                    </label>
                    <input
                      type="text"
                      placeholder="Optional if clearly visible in the uploaded screenshot"
                      value={payRefInput}
                      onChange={(e) => setPayRefInput(e.target.value)}
                      style={{ width: "100%", padding: "5px 8px", fontSize: "11px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}
                    />
                  </div>

                  {/* Demo Verification Notice */}
                  <div style={{ fontSize: "10px", color: "var(--color-neutral-dark)", backgroundColor: "var(--color-surface-muted)", padding: "6px 10px", borderRadius: "var(--radius-sm)", marginBottom: "var(--space-3)", lineHeight: 1.4 }}>
                    ℹ️ <strong>Verification Notice:</strong> Submissions are manually verified by the Academy Admin against the institution&rsquo;s bank account. Outstanding balance is reduced only after Admin verification.
                  </div>

                  {payFormError && (
                    <div style={{ color: "#FF3B30", fontSize: "11px", fontWeight: 600, marginBottom: "var(--space-2)" }}>
                      {payFormError}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-3)" }}>
                    <Button variant="secondary" size="sm" onClick={() => setPayModal(null)}>
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSubmitTransfer}
                      disabled={!dest || !payProofFile || !payAmountInput}
                      style={{
                        backgroundColor: "var(--color-accent)",
                        borderColor: "var(--color-accent)",
                        fontWeight: 600,
                        padding: "6px 14px",
                      }}
                    >
                      Submit for Verification
                    </Button>
                  </div>
                </div>
              );
            })()}
          </Card>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 3: Traceable Adjustment Modal (Admin Only) */}
      {/* ------------------------------------------------------------- */}
      {adjustmentModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--space-4)",
            zIndex: 100,
          }}
        >
          <Card padding="lg" style={{ maxWidth: "480px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 700, margin: "0 0 var(--space-2)" }}>
              Authorize Traceable Fee Adjustment
            </h3>
            <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)", display: "block", marginBottom: "var(--space-3)" }}>
              Student: <strong>{adjustmentModal.enrollment.studentName}</strong> &bull; Subject: <strong>{adjustmentModal.enrollment.subjectName}</strong> &bull; Period: <strong>{adjustmentModal.obligation.monthLabel}</strong>
            </span>

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, display: "block", marginBottom: "2px" }}>
                  Adjustment Type:
                </label>
                <select
                  value={adjType}
                  onChange={(e) => setAdjType(e.target.value as FeeAdjustment["adjustmentType"])}
                  style={{ width: "100%", padding: "6px 8px", fontSize: "12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}
                >
                  <option value="discount">Merit / Sibling Discount (Reduces balance)</option>
                  <option value="waiver">Administrative Fee Waiver (Reduces balance)</option>
                  <option value="correction">Billing Correction (Adjusts balance)</option>
                  <option value="refund">Refund (Credit balance adjustment)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, display: "block", marginBottom: "2px" }}>
                  Amount (₹):
                </label>
                <input
                  type="number"
                  placeholder="e.g. 200"
                  value={adjAmount}
                  onChange={(e) => setAdjAmount(e.target.value)}
                  style={{ width: "100%", padding: "6px 8px", fontSize: "12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, display: "block", marginBottom: "2px" }}>
                  Reason / Authorization Justification:
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Merit scholarship waiver approved by Academic Committee"
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  style={{ width: "100%", padding: "6px 8px", fontSize: "12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-4)" }}>
              <Button variant="secondary" size="sm" onClick={() => setAdjustmentModal(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveAdjustment} disabled={!adjAmount || !adjReason.trim()}>
                Save Adjustment
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 4: Payment Destination Edit Modal (Admin Only) */}
      {/* ------------------------------------------------------------- */}
      {editingDestination && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--space-4)",
            zIndex: 100,
          }}
        >
          <Card padding="lg" style={{ maxWidth: "520px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 700, margin: "0 0 2px" }}>
              Configure Receiving Destination — {editingDestination.subjectName}
            </h3>
            <span style={{ fontSize: "11px", color: "var(--color-accent)", display: "block", marginBottom: "var(--space-3)" }}>
              Assigned Faculty: {editingDestination.teacherName}
            </span>

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              <label style={{ fontSize: "11px", fontWeight: 600 }}>Receiving UPI ID:</label>
              <input
                type="text"
                value={destFormUpi}
                onChange={(e) => setDestFormUpi(e.target.value)}
                style={{ padding: "6px 8px", fontSize: "12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}
              />

              <label style={{ fontSize: "11px", fontWeight: 600 }}>Account Holder Name:</label>
              <input
                type="text"
                value={destFormHolder}
                onChange={(e) => setDestFormHolder(e.target.value)}
                style={{ padding: "6px 8px", fontSize: "12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}
              />

              <label style={{ fontSize: "11px", fontWeight: 600 }}>Bank Name:</label>
              <input
                type="text"
                value={destFormBank}
                onChange={(e) => setDestFormBank(e.target.value)}
                style={{ padding: "6px 8px", fontSize: "12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}
              />

              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "var(--space-2)" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 600 }}>Account Number:</label>
                  <input
                    type="text"
                    value={destFormAccount}
                    onChange={(e) => setDestFormAccount(e.target.value)}
                    style={{ width: "100%", padding: "6px 8px", fontSize: "12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 600 }}>IFSC Code:</label>
                  <input
                    type="text"
                    value={destFormIfsc}
                    onChange={(e) => setDestFormIfsc(e.target.value.toUpperCase())}
                    style={{ width: "100%", padding: "6px 8px", fontSize: "12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}
                  />
                </div>
              </div>

              <label style={{ fontSize: "11px", fontWeight: 600 }}>Branch Name:</label>
              <input
                type="text"
                value={destFormBranch}
                onChange={(e) => setDestFormBranch(e.target.value)}
                style={{ padding: "6px 8px", fontSize: "12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}
              />

              <label style={{ fontSize: "11px", fontWeight: 600 }}>Upload / Replace QR Image (PNG/JPEG, max 2MB):</label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
                    const allowedExts = [".png", ".jpg", ".jpeg", ".webp"];
                    const fileExt = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
                    if (!allowedTypes.includes(file.type.toLowerCase()) && !allowedExts.includes(fileExt)) {
                      setDestFormError("Please select a valid image file (PNG, JPEG, or WebP).");
                      return;
                    }
                    if (file.size > 2 * 1024 * 1024) {
                      setDestFormError("QR image exceeds 2MB limit.");
                      return;
                    }
                    setDestFormError("");
                    const reader = new FileReader();
                    reader.onload = () => {
                      setDestQrPreview(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                style={{ fontSize: "11px" }}
              />

              <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "var(--space-2) 0" }}>
                <input
                  type="checkbox"
                  id="confirm-dest-cb"
                  checked={destFormConfirmed}
                  onChange={(e) => setDestFormConfirmed(e.target.checked)}
                />
                <label htmlFor="confirm-dest-cb" style={{ fontSize: "11px", color: "var(--color-primary)" }}>
                  I confirm that I have verified these banking details and QR code with the assigned faculty.
                </label>
              </div>

              {destFormError && (
                <div style={{ color: "#FF3B30", fontSize: "11px", fontWeight: 600 }}>{destFormError}</div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-4)" }}>
              <Button variant="secondary" size="sm" onClick={() => setEditingDestination(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveDestination}>
                Save Destination
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 5: Fee Revision Modal (Admin Only) */}
      {/* ------------------------------------------------------------- */}
      {revisionModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--space-4)",
            zIndex: 100,
          }}
        >
          <Card padding="lg" style={{ maxWidth: "460px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 700, margin: "0 0 2px" }}>
              Revise Monthly Fee — {revisionModal.classGrade} {revisionModal.subjectName}
            </h3>
            <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)", display: "block", marginBottom: "var(--space-3)" }}>
              Current Fee: <strong>₹{revisionModal.monthlyFee}/mo</strong>. Revisions take effect on future billing periods.
            </span>

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              <label style={{ fontSize: "11px", fontWeight: 600 }}>New Monthly Fee (₹):</label>
              <input
                type="number"
                value={revisedFeeInput}
                onChange={(e) => setRevisedFeeInput(e.target.value)}
                style={{ padding: "6px 8px", fontSize: "12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}
              />

              <label style={{ fontSize: "11px", fontWeight: 600 }}>Effective Date:</label>
              <input
                type="date"
                value={revisionDateInput}
                onChange={(e) => setRevisionDateInput(e.target.value)}
                style={{ padding: "6px 8px", fontSize: "12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}
              />

              <label style={{ fontSize: "11px", fontWeight: 600 }}>Revision Reason:</label>
              <textarea
                rows={2}
                placeholder="e.g. Annual academic fee revision approved by management"
                value={revisionReasonInput}
                onChange={(e) => setRevisionReasonInput(e.target.value)}
                style={{ padding: "6px 8px", fontSize: "12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-4)" }}>
              <Button variant="secondary" size="sm" onClick={() => setRevisionModal(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveFeeRevision} disabled={!revisedFeeInput}>
                Confirm Revision
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 6: Bill Generation Modal (Admin Only) */}
      {/* ------------------------------------------------------------- */}
      {isGenerateBillsOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--space-4)",
            zIndex: 100,
          }}
        >
          <Card padding="lg" style={{ maxWidth: "460px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 700, margin: "0 0 2px" }}>
              Generate Next Monthly Billing Cycle
            </h3>
            <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)", display: "block", marginBottom: "var(--space-3)" }}>
              Generates bills for all active subject enrollments. Duplicate bills are prevented.
            </span>

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              <label style={{ fontSize: "11px", fontWeight: 600 }}>Billing Cycle (YYYY-MM):</label>
              <input
                type="month"
                value={generateMonthInput}
                onChange={(e) => setGenerateMonthInput(e.target.value)}
                style={{ padding: "6px 8px", fontSize: "12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-4)" }}>
              <Button variant="secondary" size="sm" onClick={() => setIsGenerateBillsOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleGenerateNextMonthBills}>
                Generate Bills
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 7: Fee Receipt Voucher Modal (FeeReceiptModal) */}
      {/* ------------------------------------------------------------- */}
      {activeReceiptModal && (
        <FeeReceiptModal
          isOpen={activeReceiptModal.isOpen}
          onClose={() => setActiveReceiptModal(null)}
          receipt={activeReceiptModal.receipt}
          transaction={activeReceiptModal.transaction}
          obligation={activeReceiptModal.obligation}
          student={activeReceiptModal.student}
          enrollment={activeReceiptModal.enrollment}
          remainingBalanceAfterPayment={activeReceiptModal.receipt.remainingBalanceAfterPayment}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 8: Reset Fee Demo Data Confirmation Modal */}
      {/* ------------------------------------------------------------- */}
      {showResetConfirmModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--space-4)",
            zIndex: 100,
          }}
        >
          <Card padding="lg" style={{ maxWidth: "500px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 700, margin: "0 0 6px" }}>
              Reset Fee Demo Data?
            </h3>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", margin: "0 0 var(--space-3)", lineHeight: 1.5 }}>
              This restores standard demo records across student, parent, teacher, and admin fee accounts without altering attendance or timetable:
            </p>

            <div style={{ backgroundColor: "var(--color-surface-muted)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", padding: "10px 12px", margin: "0 0 var(--space-4)", fontSize: "11px", lineHeight: 1.6 }}>
              <div>&bull; <strong>Mathematics:</strong> Fully Paid (₹0 Due, official receipt accessible).</div>
              <div>&bull; <strong>Physics:</strong> Unpaid (<strong>₹1,400 Outstanding Due</strong> with visible <strong>Pay Now</strong> button).</div>
              <div>&bull; <strong>Transfer Submissions:</strong> Restored to initial queue (0 student submissions).</div>
              <div>&bull; <strong>Admin Destinations:</strong> Retains active verified UPI destinations &amp; QR codes.</div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)" }}>
              <Button variant="secondary" size="sm" onClick={() => setShowResetConfirmModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmResetFeeDemo}
                style={{ backgroundColor: "var(--color-accent)", borderColor: "var(--color-accent)", fontWeight: 600 }}
              >
                Confirm &amp; Reset Demo State
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
