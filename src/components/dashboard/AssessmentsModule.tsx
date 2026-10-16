"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  UserRole,
  AssessmentRecord,
  AssessmentType,
  AssessmentStatus,
  MockExam,
  MockExamQuestion,
  ExamAttemptResult,
  AcademicCertificateData,
  IssuedCertificateRecord,
  CertificatePolicy,
  StudentProfile,
  TeacherProfile,
  BatchDefinition,
  SubjectEnrollment,
} from "@/types";
import {
  SAMPLE_ASSESSMENTS,
  SAMPLE_ISSUED_CERTIFICATES,
  SAMPLE_BATCHES,
} from "@/data/dashboardModulesData";
import { SAMPLE_MOCK_EXAMS, SAMPLE_EXAM_RESULTS } from "@/data/mockExamData";
import { SAMPLE_STUDENTS, SAMPLE_TEACHERS, SAMPLE_ENROLLMENTS } from "@/data/enrollmentFeeData";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ExamCertificateModal } from "./ExamCertificateModal";
import { useDemoStorage, DEMO_STORAGE_KEYS } from "@/lib/demoStorage";
import {
  recordCreate,
  recordUpdate,
  recordAuditEvent,
} from "@/lib/auditService";

interface AssessmentsModuleProps {
  role: UserRole;
  currentTeacherId?: string;
  currentStudentId?: string;
}

export function AssessmentsModule({
  role,
  currentTeacherId = "tch-azhar",
  currentStudentId = "std-101",
}: AssessmentsModuleProps) {
  // --------------------------------------------------------------------------
  // TOP-LEVEL SUBTABS: Overview, Tests & Marks, Results & Reports, Certificate Management
  // --------------------------------------------------------------------------
  const [activeTab, setActiveTab] = useState<"overview" | "tests" | "results" | "certificates">("overview");

  // Shared persistent storage
  const [assessments, setAssessments] = useDemoStorage<AssessmentRecord[]>(
    DEMO_STORAGE_KEYS.ASSESSMENTS,
    SAMPLE_ASSESSMENTS
  );
  const [mockExams, setMockExams] = useDemoStorage<MockExam[]>(
    DEMO_STORAGE_KEYS.MOCK_EXAMS,
    SAMPLE_MOCK_EXAMS
  );
  const [, setExamResults] = useDemoStorage<ExamAttemptResult[]>(
    DEMO_STORAGE_KEYS.EXAM_RESULTS,
    SAMPLE_EXAM_RESULTS
  );
  const [issuedCertificates, setIssuedCertificates] = useDemoStorage<IssuedCertificateRecord[]>(
    DEMO_STORAGE_KEYS.ISSUED_CERTIFICATES,
    SAMPLE_ISSUED_CERTIFICATES
  );
  const [allowTeacherCertControl, setAllowTeacherCertControl] = useDemoStorage<boolean>(
    DEMO_STORAGE_KEYS.TEACHER_CERT_PERMISSION,
    true
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
  const [enrollments] = useDemoStorage<SubjectEnrollment[]>(
    DEMO_STORAGE_KEYS.ENROLLMENTS,
    SAMPLE_ENROLLMENTS
  );

  // Search & Filter State
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [filterBatch, setFilterBatch] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Inspected student for results and certificate views (Admin & Teacher can switch; Student/Parent is locked)
  const [inspectedStudentId, setInspectedStudentId] = useState<string>(currentStudentId);

  // Feedback toast notice
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4000);
  }, []);

  // Certificate Modal State
  const [activeCertificate, setActiveCertificate] = useState<AcademicCertificateData | null>(null);
  const [activeCertIsIssued, setActiveCertIsIssued] = useState<boolean>(false);

  // Active student reference
  const targetStudentId = useMemo(() => {
    if (role === "student" || role === "parent") return currentStudentId;
    return inspectedStudentId;
  }, [role, currentStudentId, inspectedStudentId]);

  const targetStudent = useMemo(() => {
    if (!targetStudentId) return null;
    return students.find((s) => s.id === targetStudentId) || null;
  }, [students, targetStudentId]);

  // Current logged in teacher reference
  const currentTeacher = useMemo(() => {
    return faculty.find((t) => t.id === currentTeacherId) || faculty[0] || null;
  }, [faculty, currentTeacherId]);

  // Teacher-scoped enrollments and student list
  const teacherEnrollments = useMemo(() => {
    if (role === "teacher") {
      return enrollments.filter((e) => e.teacherId === currentTeacherId);
    }
    return enrollments;
  }, [enrollments, role, currentTeacherId]);

  const teacherStudents = useMemo(() => {
    if (role === "teacher") {
      const studentIds = new Set(teacherEnrollments.map((e) => e.studentId));
      return students.filter((s) => studentIds.has(s.id));
    }
    return students;
  }, [students, role, teacherEnrollments]);

  // Teacher permission check: whether this teacher is permitted to configure certificates
  const canTeacherConfigureCert = useMemo(() => {
    if (role === "academy-admin") return true;
    if (role === "teacher") return Boolean(allowTeacherCertControl);
    return false;
  }, [role, allowTeacherCertControl]);

  // --------------------------------------------------------------------------
  // LIVE EXAM TAKING & INTERACTIVE MOCK ENGINE STATE
  // --------------------------------------------------------------------------
  const [examViewState, setExamViewState] = useState<"list" | "instructions" | "taking" | "result">("list");
  const [selectedExam, setSelectedExam] = useState<MockExam | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number | null>>({});
  const [reviewFlags, setReviewFlags] = useState<Record<string, boolean>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [activeResult, setActiveResult] = useState<ExamAttemptResult | null>(null);

  const [isConfirmStartOpen, setIsConfirmStartOpen] = useState<boolean>(false);
  const [isConfirmSubmitOpen, setIsConfirmSubmitOpen] = useState<boolean>(false);
  const isSubmittedRef = useRef<boolean>(false);
  const examStartTimeRef = useRef<number>(0);

  // Teacher Question Bank Authoring Modal State
  const [isAuthorModalOpen, setIsAuthorModalOpen] = useState<boolean>(false);
  const [authoringExamId, setAuthoringExamId] = useState<string | null>(null);
  const [authorTitle, setAuthorTitle] = useState<string>("");
  const [authorSubject, setAuthorSubject] = useState<string>("Mathematics");
  const [authorClassGrade, setAuthorClassGrade] = useState<string>("Class X");
  const [authorBatchName, setAuthorBatchName] = useState<string>("Batch Alpha (Class IX-X)");
  const [authorDuration, setAuthorDuration] = useState<number>(20);
  const [authorPassingMarks, setAuthorPassingMarks] = useState<string>("8");
  const [authorQuestions, setAuthorQuestions] = useState<MockExamQuestion[]>([]);
  const [authorError, setAuthorError] = useState<string | null>(null);

  // --------------------------------------------------------------------------
  // ASSESSMENT CREATION & EDITING MODAL STATE
  // --------------------------------------------------------------------------
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState<boolean>(false);
  const [editingAssessmentId, setEditingAssessmentId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState<string>("");
  const [formSubject, setFormSubject] = useState<string>("Mathematics");
  const [formBatch, setFormBatch] = useState<string>("Batch Alpha (Class IX-X)");
  const [formClassGrade, setFormClassGrade] = useState<string>("Class X");
  const [formDate, setFormDate] = useState<string>("2026-10-25");
  const [formTotalMarks, setFormTotalMarks] = useState<number>(50);
  const [formTeacherId, setFormTeacherId] = useState<string>(currentTeacherId);
  const [formType, setFormType] = useState<AssessmentType>("regular-class-test");
  const [formStatus, setFormStatus] = useState<AssessmentStatus>("draft");
  // Certificate policy in assessment form: DEFAULT DISABLED FOR NEW ASSESSMENTS
  const [formCertEnabled, setFormCertEnabled] = useState<boolean>(false);
  const [formCertMinPercentage, setFormCertMinPercentage] = useState<number>(75);
  const [formCertTitle, setFormCertTitle] = useState<string>("");
  const [formCertType, setFormCertType] = useState<"merit" | "mock-completion">("merit");
  const [formError, setFormError] = useState<string | null>(null);

  // --------------------------------------------------------------------------
  // MARKS RECORDING & EDITING MODAL STATE
  // --------------------------------------------------------------------------
  const [isRecordModalOpen, setIsRecordModalOpen] = useState<boolean>(false);
  const [recordExamId, setRecordExamId] = useState<string>(assessments[0]?.id || "exam-1");
  const [recordStudentId, setRecordStudentId] = useState<string>(() => students[0]?.id || "std-101");
  const [recordMarksInput, setRecordMarksInput] = useState<string>("45");
  const [recordFeedbackInput, setRecordFeedbackInput] = useState<string>("");
  const [recordStatusInput, setRecordStatusInput] = useState<"evaluated" | "absent" | "pending">("evaluated");
  const [recordError, setRecordError] = useState<string | null>(null);

  // --------------------------------------------------------------------------
  // CERTIFICATE ISSUANCE CONFIRMATION MODAL STATE
  // --------------------------------------------------------------------------
  const [isConfirmIssueOpen, setIsConfirmIssueOpen] = useState<boolean>(false);
  const [pendingIssueCandidate, setPendingIssueCandidate] = useState<{
    assessment: AssessmentRecord;
    student: { id: string; name: string; classGrade: string; board: string };
    marksObtained: number;
    totalMarks: number;
    percentage: number;
  } | null>(null);

  // Revocation Modal State
  const [isConfirmRevokeOpen, setIsConfirmRevokeOpen] = useState<boolean>(false);
  const [pendingRevokeCert, setPendingRevokeCert] = useState<IssuedCertificateRecord | null>(null);
  const [revokeReasonInput, setRevokeReasonInput] = useState<string>("Score recalculated / Administrative review");

  // Escape key handler for dialogs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsAssessmentModalOpen(false);
        setIsRecordModalOpen(false);
        setIsAuthorModalOpen(false);
        setIsConfirmIssueOpen(false);
        setIsConfirmRevokeOpen(false);
        setIsConfirmStartOpen(false);
        setIsConfirmSubmitOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // --------------------------------------------------------------------------
  // ROLE-FILTERED ASSESSMENTS
  // --------------------------------------------------------------------------
  const visibleAssessments = useMemo(() => {
    return assessments.filter((exam) => {
      // Role scope
      if (role === "teacher") {
        // Teacher can view their own assessments or assessments relevant to their subject
        // For editing, strict ownership is enforced. For viewing catalog, teacher can view their subject/assigned assessments.
        if (exam.teacherId !== currentTeacherId && !currentTeacher?.assignedSubjects.includes(exam.subject)) {
          return false;
        }
      } else if (role === "student" || role === "parent") {
        // Students and parents only see published or completed assessments for their class grade
        if (!targetStudent) return false;
        if (exam.classGrade !== targetStudent.classGrade) return false;
        if (exam.status !== "published" && exam.status !== "completed") return false;

        // Scoped strictly to student's enrolled subjects or exams where they have recorded results
        const studentEnrollments = enrollments.filter(
          (e) => e.studentId === targetStudent.id && (e.status || "active") === "active"
        );
        if (studentEnrollments.length > 0) {
          const isEnrolledInSubject = studentEnrollments.some((e) => {
            const sName = e.subjectName.toLowerCase().trim();
            const exSub = exam.subject.toLowerCase().trim();
            return sName === exSub || exSub.includes(sName) || sName.includes(exSub);
          });
          const hasScoreRecorded = exam.studentScores.some(
            (s) => s.studentId === targetStudent.id
          );
          if (!isEnrolledInSubject && !hasScoreRecorded) return false;
        }
      }

      // Filter by subject
      if (filterSubject !== "all" && exam.subject !== filterSubject) return false;

      // Filter by batch
      if (filterBatch !== "all" && exam.batch !== filterBatch) return false;

      // Filter by assessment type
      if (filterType !== "all" && (exam.type || "regular-class-test") !== filterType) return false;

      // Filter by status
      if (filterStatus !== "all" && (exam.status || "published") !== filterStatus) return false;

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = exam.title.toLowerCase().includes(q);
        const matchesSubj = exam.subject.toLowerCase().includes(q);
        const matchesBatch = exam.batch.toLowerCase().includes(q);
        if (!matchesTitle && !matchesSubj && !matchesBatch) return false;
      }

      return true;
    });
  }, [assessments, role, currentTeacherId, currentTeacher, targetStudent, enrollments, filterSubject, filterBatch, filterType, filterStatus, searchQuery]);

  // --------------------------------------------------------------------------
  // OVERVIEW METRICS (Strictly derived from actual assessment records)
  // --------------------------------------------------------------------------
  const overviewMetrics = useMemo(() => {
    const totalAssessments = visibleAssessments.length;

    // Upcoming tests: scheduled or date >= current date and status not completed/published
    const todayStr = "2026-10-15";
    const upcomingCount = visibleAssessments.filter(
      (a) => a.status === "scheduled" || (a.date >= todayStr && a.status === "draft")
    ).length;

    // Pending publication: draft or completed but not published
    const pendingPublicationCount = visibleAssessments.filter(
      (a) => a.status === "draft" || a.status === "completed"
    ).length;

    // Certificates issued: active issued certificates in the system
    const activeIssuedCount = issuedCertificates.filter((c) => {
      if (c.status !== "issued") return false;
      if (role === "student" || role === "parent") {
        return targetStudent ? c.studentId === targetStudent.id : false;
      }
      if (role === "teacher") {
        const matchingExam = assessments.find((a) => a.id === c.assessmentId);
        return matchingExam ? matchingExam.teacherId === currentTeacherId : true;
      }
      return true;
    }).length;

    return {
      totalAssessments,
      upcomingCount,
      pendingPublicationCount,
      activeIssuedCount,
    };
  }, [visibleAssessments, issuedCertificates, role, targetStudent, assessments, currentTeacherId]);

  // --------------------------------------------------------------------------
  // ACADEMIC RESULTS CALCULATION FOR RESULTS & REPORTS TAB
  // --------------------------------------------------------------------------
  const studentResultsLedger = useMemo(() => {
    if (!targetStudent) return [];

    const records: Array<{
      id: string;
      assessmentId: string;
      title: string;
      subject: string;
      type: AssessmentType;
      date: string;
      marksObtained: number;
      totalMarks: number;
      percentage: number;
      status: "Distinction" | "First Class" | "Passed" | "Needs Improvement";
      feedback?: string;
      facultyName: string;
      teacherId: string;
      isPublished: boolean;
      certPolicyEnabled: boolean;
      certThreshold: number;
      isEligibleForCert: boolean;
      issuedCertificate?: IssuedCertificateRecord;
    }> = [];

    assessments.forEach((exam) => {
      // Role scoping for results
      if (role === "student" || role === "parent") {
        if (exam.status !== "published" && exam.status !== "completed") return; // Students/parents can view published or completed results
      } else if (role === "teacher") {
        if (exam.teacherId !== currentTeacherId && !currentTeacher?.assignedSubjects.includes(exam.subject)) {
          return;
        }
      }

      if (filterSubject !== "all" && exam.subject !== filterSubject) return;

      const scoreEntry = exam.studentScores.find((sc) => sc.studentId === targetStudent.id);
      if (scoreEntry && scoreEntry.status === "evaluated") {
        const pct = exam.totalMarks > 0 ? Math.round((scoreEntry.marksObtained / exam.totalMarks) * 100) : 0;
        const certPolicy = exam.certificatePolicy || { enabled: false, minPercentage: 75 };
        const isEligible = Boolean(certPolicy.enabled && pct >= certPolicy.minPercentage);

        // Check if certificate was officially issued
        const issuedCert = issuedCertificates.find(
          (c) => c.assessmentId === exam.id && c.studentId === targetStudent.id && c.status === "issued"
        );

        let standing: "Distinction" | "First Class" | "Passed" | "Needs Improvement" = "Passed";
        if (pct >= 85) standing = "Distinction";
        else if (pct >= 70) standing = "First Class";
        else if (pct < 40) standing = "Needs Improvement";

        const teacher = faculty.find((t) => t.id === exam.teacherId);

        records.push({
          id: `res-${exam.id}`,
          assessmentId: exam.id,
          title: exam.title,
          subject: exam.subject,
          type: exam.type || "regular-class-test",
          date: exam.date,
          marksObtained: scoreEntry.marksObtained,
          totalMarks: exam.totalMarks,
          percentage: pct,
          status: standing,
          feedback: scoreEntry.feedback,
          facultyName: teacher ? teacher.name : "Lead Faculty",
          teacherId: exam.teacherId,
          isPublished: exam.status === "published",
          certPolicyEnabled: Boolean(certPolicy.enabled),
          certThreshold: certPolicy.minPercentage,
          isEligibleForCert: isEligible,
          issuedCertificate: issuedCert,
        });
      }
    });

    return records;
  }, [assessments, role, currentTeacherId, currentTeacher, filterSubject, targetStudent, issuedCertificates, faculty]);

  // Aggregate results summary derived strictly from studentResultsLedger
  const resultsSummary = useMemo(() => {
    const totalCount = studentResultsLedger.length;
    if (totalCount === 0) {
      return {
        totalEvaluated: 0,
        totalMarksObtained: 0,
        totalMarksMax: 0,
        cumulativePercentage: 0,
        subjectStats: {} as Record<string, { obtained: number; max: number; pct: number; count: number }>,
      };
    }

    const totalMarksObtained = studentResultsLedger.reduce((acc, r) => acc + r.marksObtained, 0);
    const totalMarksMax = studentResultsLedger.reduce((acc, r) => acc + r.totalMarks, 0);
    const cumulativePercentage = totalMarksMax > 0 ? Math.round((totalMarksObtained / totalMarksMax) * 100) : 0;

    const subjectStats: Record<string, { obtained: number; max: number; pct: number; count: number }> = {};
    studentResultsLedger.forEach((r) => {
      if (!subjectStats[r.subject]) {
        subjectStats[r.subject] = { obtained: 0, max: 0, pct: 0, count: 0 };
      }
      subjectStats[r.subject].obtained += r.marksObtained;
      subjectStats[r.subject].max += r.totalMarks;
      subjectStats[r.subject].count += 1;
    });

    Object.keys(subjectStats).forEach((subj) => {
      const s = subjectStats[subj];
      s.pct = s.max > 0 ? Math.round((s.obtained / s.max) * 100) : 0;
    });

    return {
      totalEvaluated: totalCount,
      totalMarksObtained,
      totalMarksMax,
      cumulativePercentage,
      subjectStats,
    };
  }, [studentResultsLedger]);

  // --------------------------------------------------------------------------
  // CERTIFICATE MANAGEMENT QUEUE & ELIGIBILITY AUDIT
  // --------------------------------------------------------------------------
  const certificateAssessments = useMemo(() => {
    return assessments.filter((exam) => {
      // Must have certificates enabled
      if (!exam.certificatePolicy?.enabled) return false;
      if (role === "teacher" && exam.teacherId !== currentTeacherId) return false;
      return true;
    });
  }, [assessments, role, currentTeacherId]);

  // Selected assessment for certificate queue
  const [selectedCertAssessmentId, setSelectedCertAssessmentId] = useState<string>(
    certificateAssessments[0]?.id || "exam-4"
  );

  const activeCertAssessment = useMemo(() => {
    return assessments.find((a) => a.id === selectedCertAssessmentId) || certificateAssessments[0] || assessments[0];
  }, [assessments, selectedCertAssessmentId, certificateAssessments]);

  // Eligible students for activeCertAssessment
  const certAuditList = useMemo(() => {
    if (!activeCertAssessment || !activeCertAssessment.certificatePolicy?.enabled) {
      return [];
    }

    const threshold = activeCertAssessment.certificatePolicy.minPercentage;

    return activeCertAssessment.studentScores.map((score) => {
      const student = students.find((s) => s.id === score.studentId) || {
        id: score.studentId,
        name: score.studentName,
        classGrade: activeCertAssessment.classGrade,
        board: "ICSE",
      };

      const pct = activeCertAssessment.totalMarks > 0
        ? Math.round((score.marksObtained / activeCertAssessment.totalMarks) * 100)
        : 0;
      const isEligible = score.status === "evaluated" && pct >= threshold;

      const issuedCert = issuedCertificates.find(
        (c) => c.assessmentId === activeCertAssessment.id && c.studentId === score.studentId && c.status === "issued"
      );

      const revokedCert = issuedCertificates.find(
        (c) => c.assessmentId === activeCertAssessment.id && c.studentId === score.studentId && c.status === "revoked"
      );

      return {
        student,
        marksObtained: score.marksObtained,
        totalMarks: activeCertAssessment.totalMarks,
        percentage: pct,
        isEligible,
        status: score.status,
        issuedCert,
        revokedCert,
      };
    });
  }, [activeCertAssessment, issuedCertificates, students]);

  // --------------------------------------------------------------------------
  // CERTIFICATE ISSUANCE & REVOCATION HANDLERS
  // --------------------------------------------------------------------------
  const handleOpenIssueConfirm = (candidate: {
    student: { id: string; name: string; classGrade: string; board: string };
    marksObtained: number;
    totalMarks: number;
    percentage: number;
  }) => {
    if (!activeCertAssessment) return;
    setPendingIssueCandidate({
      assessment: activeCertAssessment,
      ...candidate,
    });
    setIsConfirmIssueOpen(true);
  };

  const handleConfirmIssueCertificate = () => {
    if (!pendingIssueCandidate) return;
    const { assessment, student, marksObtained, totalMarks, percentage } = pendingIssueCandidate;

    // Prevent duplicate active issuance
    const alreadyIssued = issuedCertificates.some(
      (c) => c.assessmentId === assessment.id && c.studentId === student.id && c.status === "issued"
    );
    if (alreadyIssued) {
      showToast(`A certificate has already been issued to ${student.name} for this assessment.`);
      setIsConfirmIssueOpen(false);
      return;
    }

    const certPolicy = assessment.certificatePolicy;
    const certNum = `AA-2026-${assessment.subject.slice(0, 3).toUpperCase()}-${student.id.replace("std-", "")}-${Date.now().toString().slice(-4)}`;
    const teacher = faculty.find((t) => t.id === assessment.teacherId) || currentTeacher;

    const newCert: IssuedCertificateRecord = {
      id: `cert-${assessment.id}-${student.id}-${Date.now()}`,
      certificateNumber: certNum,
      certificateType: certPolicy?.certificateType || "merit",
      title: certPolicy?.certificateTitle || "Certificate of Academic Distinction",
      studentId: student.id,
      studentName: student.name,
      classGrade: student.classGrade,
      board: student.board,
      subject: assessment.subject,
      assessmentId: assessment.id,
      assessmentName: assessment.title,
      assessmentDate: assessment.date,
      scoreObtained: marksObtained,
      totalMarks,
      percentage,
      criteriaMet: `Scored ${percentage}% (Configured Policy Requirement: ≥ ${certPolicy?.minPercentage || 75}%)`,
      issuedDate: new Date().toISOString().split("T")[0],
      issuedBy: role === "academy-admin" ? "Directorate of Examinations" : currentTeacher.name,
      issuedByRole: role,
      facultyName: teacher.name,
      status: "issued",
    };

    setIssuedCertificates((prev) => [newCert, ...prev]);

    recordCreate({
      action: "Issue Examination Certificate",
      type: "enrollment",
      target: `${student.name} · ${certNum}`,
      details: `Issued academic certificate #${certNum} to ${student.name} for ${assessment.title} (Score: ${percentage}%). Issued by: ${newCert.issuedBy}.`,
      performedBy: role === "academy-admin" ? "Academy Administrator" : currentTeacher.name,
      actorRole: role,
      entityType: "certificate",
      entityId: newCert.id,
      outcome: "SUCCESS",
      changedFields: ["status", "certificateNumber", "percentage"],
      sourcePortal: role,
    });

    setIsConfirmIssueOpen(false);
    setPendingIssueCandidate(null);
    showToast(`Issued Certificate ${certNum} to ${student.name}!`);
  };

  const handleOpenRevokeConfirm = (cert: IssuedCertificateRecord) => {
    setPendingRevokeCert(cert);
    setRevokeReasonInput("Administrative score adjustment / Faculty review");
    setIsConfirmRevokeOpen(true);
  };

  const handleConfirmRevoke = () => {
    if (!pendingRevokeCert) return;
    setIssuedCertificates((prev) =>
      prev.map((c) =>
        c.id === pendingRevokeCert.id
          ? {
              ...c,
              status: "revoked",
              revokedDate: new Date().toISOString().split("T")[0],
              revokedBy: role === "academy-admin" ? "Academy Administrator" : (currentTeacher ? currentTeacher.name : "Teacher"),
              revocationReason: revokeReasonInput.trim() || "Policy correction",
            }
          : c
      )
    );

    recordAuditEvent({
      action: "Revoke Examination Certificate",
      actionType: "CANCEL",
      type: "enrollment",
      target: `${pendingRevokeCert.studentName} · ${pendingRevokeCert.certificateNumber}`,
      details: `Revoked certificate #${pendingRevokeCert.certificateNumber} for ${pendingRevokeCert.studentName}. Reason: ${revokeReasonInput.trim() || "Policy correction"}.`,
      performedBy: role === "academy-admin" ? "Academy Administrator" : (currentTeacher ? currentTeacher.name : "Teacher"),
      actorRole: role,
      entityType: "certificate",
      entityId: pendingRevokeCert.id,
      outcome: "SUCCESS",
      changedFields: ["status", "revocationReason"],
      diff: [{ fieldName: "status", before: "issued", after: "revoked" }],
      sourcePortal: role,
    });

    setIsConfirmRevokeOpen(false);
    showToast(`Revoked certificate ${pendingRevokeCert.certificateNumber}. Status updated to Revoked.`);
    setPendingRevokeCert(null);
  };

  const handlePreviewCertificateModal = (cert: IssuedCertificateRecord | AcademicCertificateData, isIssued = true) => {
    setActiveCertificate(cert);
    setActiveCertIsIssued(isIssued);
  };

  // --------------------------------------------------------------------------
  // QUICK STATUS TOGGLE (Publish / Unpublish)
  // --------------------------------------------------------------------------
  const handleTogglePublishStatus = (exam: AssessmentRecord, newStatus: AssessmentStatus) => {
    setAssessments((prev) =>
      prev.map((a) => (a.id === exam.id ? { ...a, status: newStatus } : a))
    );
    recordUpdate({
      action: newStatus === "published" ? "Publish Assessment" : "Unpublish Assessment",
      type: "enrollment",
      target: `${exam.title} · ${exam.subject}`,
      details: `${newStatus === "published" ? "Published" : "Unpublished"} assessment "${exam.title}" (${exam.subject}). Status changed to ${newStatus}.`,
      performedBy: role === "academy-admin" ? "Academy Administrator" : (currentTeacher?.name || "Teacher"),
      actorRole: role,
      entityType: "assessment",
      entityId: exam.id,
      outcome: "SUCCESS",
      changedFields: ["status"],
      diff: [{ fieldName: "status", before: exam.status || "draft", after: newStatus }],
      sourcePortal: role,
    });
    showToast(
      newStatus === "published"
        ? `Published assessment "${exam.title}". Now visible to enrolled students.`
        : `Unpublished assessment "${exam.title}". Reverted to draft.`
    );
  };

  // --------------------------------------------------------------------------
  // ASSESSMENT CREATION & EDITING HANDLERS
  // --------------------------------------------------------------------------
  const handleOpenCreateAssessmentModal = (examToEdit?: AssessmentRecord) => {
    if (examToEdit) {
      setEditingAssessmentId(examToEdit.id);
      setFormTitle(examToEdit.title);
      setFormSubject(examToEdit.subject);
      setFormBatch(examToEdit.batch);
      setFormClassGrade(examToEdit.classGrade);
      setFormDate(examToEdit.date);
      setFormTotalMarks(examToEdit.totalMarks);
      setFormTeacherId(examToEdit.teacherId);
      setFormType(examToEdit.type || "regular-class-test");
      setFormStatus(examToEdit.status || "draft");
      const policy = examToEdit.certificatePolicy;
      setFormCertEnabled(Boolean(policy?.enabled));
      setFormCertMinPercentage(policy?.minPercentage ?? 75);
      setFormCertTitle(policy?.certificateTitle || "");
      setFormCertType(policy?.certificateType || "merit");
    } else {
      setEditingAssessmentId(null);
      setFormTitle("");
      setFormSubject(currentTeacher?.assignedSubjects[0] || "Mathematics");
      setFormBatch(currentTeacher?.batches[0] || "Batch Alpha (Class IX-X)");
      setFormClassGrade("Class X");
      setFormDate(new Date().toISOString().split("T")[0]);
      setFormTotalMarks(50);
      setFormTeacherId(role === "teacher" ? currentTeacherId : "tch-azhar");
      setFormType("regular-class-test");
      setFormStatus("draft");
      // Default: certificates DISABLED for new assessments
      setFormCertEnabled(false);
      setFormCertMinPercentage(75);
      setFormCertTitle("Certificate of Academic Distinction");
      setFormCertType("merit");
    }
    setFormError(null);
    setIsAssessmentModalOpen(true);
  };

  const handleSaveAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError("Assessment title is required.");
      return;
    }
    if (formTotalMarks <= 0 || isNaN(formTotalMarks)) {
      setFormError("Maximum marks must be greater than 0.");
      return;
    }
    if (formCertEnabled && (formCertMinPercentage < 1 || formCertMinPercentage > 100)) {
      setFormError("Certificate qualifying threshold must be between 1% and 100%.");
      return;
    }

    // Role check: Teacher can only create/edit for their permitted subjects/batches
    if (role === "teacher") {
      if (formTeacherId !== currentTeacherId) {
        setFormError("You can only assign assessments to yourself.");
        return;
      }
    }

    const certPolicy: CertificatePolicy = {
      enabled: formCertEnabled,
      minPercentage: formCertMinPercentage,
      certificateTitle: formCertTitle.trim() || undefined,
      certificateType: formCertType,
    };

    if (editingAssessmentId) {
      setAssessments((prev) =>
        prev.map((a) => {
          if (a.id === editingAssessmentId) {
            return {
              ...a,
              title: formTitle.trim(),
              subject: formSubject,
              batch: formBatch,
              classGrade: formClassGrade,
              date: formDate,
              totalMarks: formTotalMarks,
              teacherId: formTeacherId,
              type: formType,
              status: formStatus,
              certificatePolicy: certPolicy,
            };
          }
          return a;
        })
      );
      recordUpdate({
        action: "Update Assessment",
        type: "enrollment",
        target: `${formTitle.trim()} · ${formSubject}`,
        details: `Updated assessment definition for ${formSubject} (${formBatch}). Total Marks: ${formTotalMarks}, Status: ${formStatus}.`,
        performedBy: role === "academy-admin" ? "Academy Administrator" : (currentTeacher?.name || "Teacher"),
        actorRole: role,
        entityType: "assessment",
        entityId: editingAssessmentId,
        outcome: "SUCCESS",
        changedFields: ["title", "subject", "batch", "totalMarks", "status", "certificatePolicy"],
        sourcePortal: role,
      });
      showToast(`Updated assessment "${formTitle.trim()}".`);
    } else {
      const newAssessment: AssessmentRecord = {
        id: `exam-${Date.now()}`,
        title: formTitle.trim(),
        subject: formSubject,
        batch: formBatch,
        classGrade: formClassGrade,
        date: formDate,
        totalMarks: formTotalMarks,
        teacherId: formTeacherId,
        type: formType,
        status: formStatus,
        certificatePolicy: certPolicy,
        studentScores: [],
      };
      setAssessments((prev) => [newAssessment, ...prev]);
      recordCreate({
        action: "Create Assessment",
        type: "enrollment",
        target: `${formTitle.trim()} · ${formSubject}`,
        details: `Created new assessment for ${formSubject} (${formBatch}). Max Marks: ${formTotalMarks}, Grade: ${formClassGrade}.`,
        performedBy: role === "academy-admin" ? "Academy Administrator" : (currentTeacher?.name || "Teacher"),
        actorRole: role,
        entityType: "assessment",
        entityId: newAssessment.id,
        outcome: "SUCCESS",
        changedFields: ["title", "subject", "batch", "totalMarks", "type", "status"],
        sourcePortal: role,
      });
      showToast(`Created new assessment "${formTitle.trim()}".`);
    }

    setIsAssessmentModalOpen(false);
  };

  // --------------------------------------------------------------------------
  // MARKS RECORDING HANDLER
  // --------------------------------------------------------------------------
  const handleOpenRecordMarksModal = (assessment?: AssessmentRecord) => {
    if (assessment) {
      setRecordExamId(assessment.id);
    } else if (visibleAssessments.length > 0) {
      setRecordExamId(visibleAssessments[0].id);
    }
    setRecordStudentId(teacherStudents[0]?.id || students[0]?.id || "std-101");
    setRecordMarksInput("40");
    setRecordFeedbackInput("");
    setRecordStatusInput("evaluated");
    setRecordError(null);
    setIsRecordModalOpen(true);
  };

  const handleSaveMarks = (e: React.FormEvent) => {
    e.preventDefault();
    const targetExam = assessments.find((a) => a.id === recordExamId);
    if (!targetExam) return;

    // Role verification
    if (role === "teacher" && targetExam.teacherId !== currentTeacherId) {
      setRecordError("Permission denied: You can only record marks for assessments assigned to you.");
      return;
    }

    const marksNum = parseFloat(recordMarksInput);
    if (isNaN(marksNum) || marksNum < 0) {
      setRecordError("Please enter a valid non-negative mark.");
      return;
    }
    if (marksNum > targetExam.totalMarks) {
      setRecordError(`Marks obtained (${marksNum}) cannot exceed maximum marks (${targetExam.totalMarks}).`);
      return;
    }

    const student = students.find((s) => s.id === recordStudentId);
    if (!student) return;

    setAssessments((prev) =>
      prev.map((exam) => {
        if (exam.id === recordExamId) {
          const updatedScores = exam.studentScores.filter((sc) => sc.studentId !== recordStudentId);
          updatedScores.push({
            studentId: recordStudentId,
            studentName: student.name,
            marksObtained: marksNum,
            status: recordStatusInput,
            feedback: recordFeedbackInput.trim() || undefined,
          });
          return {
            ...exam,
            studentScores: updatedScores,
          };
        }
        return exam;
      })
    );

    setIsRecordModalOpen(false);
    recordUpdate({
      action: "Record Student Marks",
      type: "enrollment",
      target: `${student.name} · ${targetExam.title}`,
      details: `Recorded marks ${marksNum}/${targetExam.totalMarks} (${recordStatusInput}) for ${student.name} in ${targetExam.title}.`,
      performedBy: role === "academy-admin" ? "Academy Administrator" : (currentTeacher?.name || "Teacher"),
      actorRole: role,
      entityType: "marks",
      entityId: `marks-${targetExam.id}-${student.id}`,
      outcome: "SUCCESS",
      changedFields: ["marksObtained", "status", "feedback"],
      diff: [{ fieldName: "marksObtained", before: "unrecorded", after: String(marksNum) }],
      sourcePortal: role,
    });
    showToast(`Recorded score of ${marksNum}/${targetExam.totalMarks} for ${student.name}.`);
  };

  // --------------------------------------------------------------------------
  // LIVE MOCK ENGINE WORKFLOW (MCQ Taker with Timer & Palette)
  // --------------------------------------------------------------------------
  const calculateResult = useCallback(
    (exam: MockExam, answers: Record<string, number | null>, submissionType: "manual" | "timeout"): ExamAttemptResult => {
      let scoreObtained = 0;
      let correctCount = 0;
      let incorrectCount = 0;
      let unansweredCount = 0;

      exam.questions.forEach((q) => {
        const chosen = answers[q.id];
        if (chosen === undefined || chosen === null) {
          unansweredCount++;
        } else if (chosen === q.correctOptionIndex) {
          correctCount++;
          scoreObtained += q.marks;
        } else {
          incorrectCount++;
        }
      });

      const percentage = exam.totalMarks > 0 ? Math.round((scoreObtained / exam.totalMarks) * 100) : 0;
      const isPassed = exam.passingMarks !== undefined ? scoreObtained >= exam.passingMarks : undefined;
      const timeTaken = Math.max(1, Math.round((Date.now() - examStartTimeRef.current) / 1000));

      return {
        examId: exam.id,
        studentId: targetStudent?.id || "",
        studentName: targetStudent?.name || "Candidate",
        totalQuestions: exam.questions.length,
        totalMarks: exam.totalMarks,
        scoreObtained,
        percentage,
        correctCount,
        incorrectCount,
        unansweredCount,
        passingMarks: exam.passingMarks,
        isPassed,
        timeTakenSeconds: timeTaken,
        submittedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        submissionType,
        answers,
        reviewFlags,
      };
    },
    [targetStudent, reviewFlags]
  );

  const handleFinalSubmit = useCallback(
    (submissionType: "manual" | "timeout") => {
      if (isSubmittedRef.current || !selectedExam) return;
      isSubmittedRef.current = true;

      const result = calculateResult(selectedExam, userAnswers, submissionType);

      // Persist to examResults
      setExamResults((prev) => [result, ...prev.filter((r) => r.examId !== selectedExam.id)]);
      setActiveResult(result);
      setIsConfirmSubmitOpen(false);
      setExamViewState("result");

      // Also sync score into corresponding assessment in `assessments` if linked
      const stdId = targetStudent?.id || "";
      const stdName = targetStudent?.name || "Candidate";
      if (!stdId) return;
      setAssessments((prev) =>
        prev.map((exam) => {
          if (exam.linkedMockExamId === selectedExam.id || exam.id === selectedExam.id) {
            const updatedScores = exam.studentScores.filter((sc) => sc.studentId !== stdId);
            updatedScores.push({
              studentId: stdId,
              studentName: stdName,
              marksObtained: result.scoreObtained,
              status: "evaluated",
              feedback: `Automated mock exam submission (${result.percentage}%).`,
            });
            return { ...exam, studentScores: updatedScores };
          }
          return exam;
        })
      );

      recordCreate({
        action: "Submit Mock Examination",
        type: "enrollment",
        target: `${stdName} · ${selectedExam.title}`,
        details: `Online examination attempt submitted. Score: ${result.scoreObtained}/${selectedExam.totalMarks} (${result.percentage}%), Correct: ${result.correctCount}/${result.totalQuestions}, Type: ${submissionType}.`,
        performedBy: stdName,
        actorRole: "student",
        entityType: "mock-attempt",
        entityId: `attempt-${selectedExam.id}-${stdId}`,
        outcome: "SUCCESS",
        changedFields: ["scoreObtained", "percentage", "correctCount", "submissionType"],
        sourcePortal: "student",
      });

      showToast(
        submissionType === "timeout"
          ? "Exam timer reached 00:00. Responses auto-submitted."
          : "Exam submitted successfully! Scorecard generated."
      );
    },
    [selectedExam, userAnswers, calculateResult, setExamResults, setAssessments, targetStudent, showToast]
  );

  // Timer Effect
  useEffect(() => {
    if (examViewState !== "taking" || !selectedExam) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!isSubmittedRef.current) {
            handleFinalSubmit("timeout");
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examViewState, selectedExam, handleFinalSubmit]);

  const formatTimer = (totalSecs: number) => {
    const safeSecs = Math.max(0, totalSecs);
    const mins = Math.floor(safeSecs / 60);
    const secs = safeSecs % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleOpenInstructions = (exam: MockExam) => {
    setSelectedExam(exam);
    setExamViewState("instructions");
  };

  const handleStartExamConfirmed = () => {
    if (!selectedExam) return;
    setIsConfirmStartOpen(false);
    isSubmittedRef.current = false;
    examStartTimeRef.current = Date.now();

    const initialAnswers: Record<string, number | null> = {};
    const initialFlags: Record<string, boolean> = {};
    selectedExam.questions.forEach((q) => {
      initialAnswers[q.id] = null;
      initialFlags[q.id] = false;
    });

    setUserAnswers(initialAnswers);
    setReviewFlags(initialFlags);
    setCurrentQuestionIndex(0);
    setTimeRemaining(selectedExam.durationMinutes * 60);
    setExamViewState("taking");
  };

  // Teacher Authoring Modal Handlers
  const handleOpenAuthorModal = (examToEdit?: MockExam) => {
    if (examToEdit) {
      setAuthoringExamId(examToEdit.id);
      setAuthorTitle(examToEdit.title);
      setAuthorSubject(examToEdit.subject);
      setAuthorClassGrade(examToEdit.classGrade);
      setAuthorBatchName(examToEdit.batchName);
      setAuthorDuration(examToEdit.durationMinutes);
      setAuthorPassingMarks(examToEdit.passingMarks !== undefined ? String(examToEdit.passingMarks) : "");
      setAuthorQuestions([...examToEdit.questions]);
    } else {
      setAuthoringExamId(null);
      setAuthorTitle("");
      setAuthorSubject(currentTeacher.assignedSubjects[0] || "Mathematics");
      setAuthorClassGrade("Class X");
      setAuthorBatchName(currentTeacher.batches[0] || "Batch Alpha (Class IX-X)");
      setAuthorDuration(20);
      setAuthorPassingMarks("8");
      setAuthorQuestions([
        {
          id: `q-new-${Date.now()}-1`,
          questionNumber: 1,
          questionText: "Sample Question: What is the discriminant formula for quadratic equation ax² + bx + c = 0?",
          options: ["b² - 4ac", "b² + 4ac", "-b / 2a", "2a / b"],
          correctOptionIndex: 0,
          marks: 4,
          explanation: "The discriminant is D = b² - 4ac.",
        },
      ]);
    }
    setAuthorError(null);
    setIsAuthorModalOpen(true);
  };

  const handleSaveAuthorExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorTitle.trim()) {
      setAuthorError("Exam title cannot be empty.");
      return;
    }
    if (authorQuestions.length === 0) {
      setAuthorError("An exam must have at least one question.");
      return;
    }

    const calculatedTotalMarks = authorQuestions.reduce((acc, q) => acc + q.marks, 0);
    const parsedPassing = authorPassingMarks.trim() !== "" ? parseFloat(authorPassingMarks) : undefined;
    const teacher = faculty.find((t) => t.id === currentTeacherId) || faculty[0] || SAMPLE_TEACHERS[0];

    const examData: MockExam = {
      id: authoringExamId || `mock-custom-${Date.now()}`,
      title: authorTitle.trim(),
      subject: authorSubject,
      classGrade: authorClassGrade,
      batchName: authorBatchName,
      teacherId: teacher.id,
      teacherName: teacher.name,
      durationMinutes: Math.max(1, authorDuration),
      totalMarks: calculatedTotalMarks,
      passingMarks: parsedPassing,
      instructions: [
        `Official mock exam for ${authorSubject} (${authorClassGrade}).`,
        `Complete all ${authorQuestions.length} questions before the ${authorDuration}-minute timer expires.`,
        "Answers evaluated deterministically.",
      ],
      questions: authorQuestions.map((q, idx) => ({ ...q, questionNumber: idx + 1 })),
      status: "published",
    };

    if (authoringExamId) {
      setMockExams((prev) => prev.map((ex) => (ex.id === authoringExamId ? examData : ex)));
      recordUpdate({
        action: "Update Mock Exam",
        type: "enrollment",
        target: `${examData.title} · ${examData.subject}`,
        details: `Updated mock exam questions and timing (${examData.durationMinutes}m, ${examData.questions.length} questions, ${examData.totalMarks} marks).`,
        performedBy: role === "academy-admin" ? "Academy Administrator" : (currentTeacher?.name || "Teacher"),
        actorRole: role,
        entityType: "mock-exam",
        entityId: examData.id,
        outcome: "SUCCESS",
        changedFields: ["title", "durationMinutes", "totalMarks", "questions"],
        sourcePortal: role,
      });
      showToast(`Updated mock exam "${examData.title}".`);
    } else {
      setMockExams((prev) => [examData, ...prev]);
      // Also add an entry in assessments with online-mock-exam type so it integrates into assessment management
      const linkedRecord: AssessmentRecord = {
        id: `exam-online-${Date.now()}`,
        title: examData.title,
        subject: examData.subject,
        batch: examData.batchName,
        classGrade: examData.classGrade,
        date: new Date().toISOString().split("T")[0],
        totalMarks: examData.totalMarks,
        teacherId: examData.teacherId,
        type: "online-mock-exam",
        status: "published",
        linkedMockExamId: examData.id,
        certificatePolicy: {
          enabled: false,
          minPercentage: 75,
          certificateTitle: "Online Mock Examination Certificate",
        },
        studentScores: [],
      };
      setAssessments((prev) => [linkedRecord, ...prev]);
      recordCreate({
        action: "Author Mock Exam",
        type: "enrollment",
        target: `${examData.title} · ${examData.subject}`,
        details: `Published new online mock exam for ${examData.subject} (${examData.classGrade}). Duration: ${examData.durationMinutes}m, Total Marks: ${examData.totalMarks}.`,
        performedBy: role === "academy-admin" ? "Academy Administrator" : (currentTeacher?.name || "Teacher"),
        actorRole: role,
        entityType: "mock-exam",
        entityId: examData.id,
        outcome: "SUCCESS",
        changedFields: ["title", "subject", "durationMinutes", "totalMarks", "status"],
        sourcePortal: role,
      });
      showToast(`Published mock exam "${examData.title}" and integrated into assessments.`);
    }

    setIsAuthorModalOpen(false);
  };

  // --------------------------------------------------------------------------
  // LIVE EXAM VIEWS (Instructions / Taking / Result)
  // --------------------------------------------------------------------------
  if (examViewState === "instructions" && selectedExam) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <Card padding="lg" style={{ borderLeft: "4px solid var(--color-accent)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "6px" }}>
                <Badge variant="accent" size="sm">{selectedExam.subject}</Badge>
                <Badge variant="neutral" size="sm">{selectedExam.classGrade}</Badge>
                <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)" }}>{selectedExam.batchName}</span>
              </div>
              <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--color-primary)", margin: 0 }}>
                {selectedExam.title}
              </h2>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", marginTop: "4px" }}>
                Instructor: <strong>{selectedExam.teacherName}</strong> &bull; Examination Blueprint & Candidate Rules
              </p>
            </div>

            <Button variant="secondary" size="sm" onClick={() => setExamViewState("list")}>
              ← Back to Assessment Desk
            </Button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "var(--space-3)",
              marginBottom: "var(--space-6)",
            }}
          >
            <div style={{ backgroundColor: "var(--color-surface-muted)", padding: "12px", borderRadius: "var(--radius-md)", textAlign: "center" }}>
              <div style={{ fontSize: "10px", color: "var(--color-neutral-dark)", textTransform: "uppercase" }}>Duration</div>
              <div style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--color-primary)" }}>
                {selectedExam.durationMinutes} Mins
              </div>
            </div>

            <div style={{ backgroundColor: "var(--color-surface-muted)", padding: "12px", borderRadius: "var(--radius-md)", textAlign: "center" }}>
              <div style={{ fontSize: "10px", color: "var(--color-neutral-dark)", textTransform: "uppercase" }}>Questions</div>
              <div style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--color-primary)" }}>
                {selectedExam.questions.length} MCQs
              </div>
            </div>

            <div style={{ backgroundColor: "var(--color-surface-muted)", padding: "12px", borderRadius: "var(--radius-md)", textAlign: "center" }}>
              <div style={{ fontSize: "10px", color: "var(--color-neutral-dark)", textTransform: "uppercase" }}>Maximum Marks</div>
              <div style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--color-accent)" }}>
                {selectedExam.totalMarks} Marks
              </div>
            </div>

            <div style={{ backgroundColor: "var(--color-surface-muted)", padding: "12px", borderRadius: "var(--radius-md)", textAlign: "center" }}>
              <div style={{ fontSize: "10px", color: "var(--color-neutral-dark)", textTransform: "uppercase" }}>Passing Criteria</div>
              <div style={{ fontSize: "var(--text-base)", fontWeight: 700, color: selectedExam.passingMarks !== undefined ? "var(--color-success)" : "var(--color-neutral-dark)" }}>
                {selectedExam.passingMarks !== undefined ? `${selectedExam.passingMarks} Marks (${Math.round((selectedExam.passingMarks / selectedExam.totalMarks) * 100)}%)` : "Diagnostic Only"}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: "var(--space-6)" }}>
            <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, marginBottom: "var(--space-2)" }}>
              Official Instructions:
            </h3>
            <ul style={{ fontSize: "var(--text-xs)", lineHeight: 1.8, paddingLeft: "18px", color: "var(--color-primary)" }}>
              {selectedExam.instructions.map((inst, i) => (
                <li key={i}>{inst}</li>
              ))}
              <li><strong>Question Palette:</strong> The palette grid shows whether each question is answered (green), marked for review (purple), or unanswered (gray).</li>
              <li><strong>Automatic Timeout:</strong> When the countdown timer reaches 00:00, responses are automatically submitted.</li>
            </ul>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)" }}>
            <Button variant="secondary" onClick={() => setExamViewState("list")}>
              Return to Catalog
            </Button>
            <Button variant="primary" onClick={() => setIsConfirmStartOpen(true)}>
              Start Mock Exam →
            </Button>
          </div>
        </Card>

        {isConfirmStartOpen && (
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsConfirmStartOpen(false);
            }}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "var(--space-4)",
            }}
          >
            <Card padding="lg" style={{ maxWidth: "440px", width: "100%" }}>
              <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, marginBottom: "var(--space-2)" }}>
                Begin Online Examination?
              </h3>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", lineHeight: 1.5, marginBottom: "var(--space-4)" }}>
                The <strong>{selectedExam.durationMinutes}-minute</strong> countdown timer will start immediately upon confirmation.
              </p>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)" }}>
                <Button variant="secondary" size="sm" onClick={() => setIsConfirmStartOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleStartExamConfirmed}>
                  Yes, Begin Exam
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    );
  }

  if (examViewState === "taking" && selectedExam) {
    const currentQ = selectedExam.questions[currentQuestionIndex];
    const totalQCount = selectedExam.questions.length;
    const answeredCount = Object.values(userAnswers).filter((ans) => ans !== null && ans !== undefined).length;
    const unansweredCount = totalQCount - answeredCount;
    const markedCount = Object.values(reviewFlags).filter(Boolean).length;
    const isCurrentMarked = currentQ ? reviewFlags[currentQ.id] : false;
    const selectedOptionIndex = currentQ ? userAnswers[currentQ.id] : null;
    const isTimerCritical = timeRemaining < 120;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        {/* Exam Navigation Bar */}
        <div
          style={{
            backgroundColor: "#1D1D1F",
            color: "#FFFFFF",
            borderRadius: "var(--radius-lg)",
            padding: "var(--space-4) var(--space-6)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "var(--space-3)",
          }}
        >
          <div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", textTransform: "uppercase" }}>
              {selectedExam.subject} &bull; {selectedExam.classGrade}
            </div>
            <div style={{ fontSize: "var(--text-base)", fontWeight: 700 }}>
              {selectedExam.title}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
            <div
              style={{
                backgroundColor: isTimerCritical ? "#FF3B30" : "rgba(255,255,255,0.15)",
                padding: "6px 14px",
                borderRadius: "var(--radius-md)",
                fontSize: "var(--text-lg)",
                fontWeight: 800,
                letterSpacing: "1px",
              }}
            >
              ⏱️ {formatTimer(timeRemaining)}
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsConfirmSubmitOpen(true)}
              style={{ backgroundColor: "#34C759", border: "none" }}
            >
              Finish &amp; Submit Exam
            </Button>
          </div>
        </div>

        {/* Question Panel & Palette */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "var(--space-4)" }}>
          {/* Main Question Card */}
          {currentQ && (
            <Card padding="lg">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
                <span style={{ fontSize: "var(--text-sm)", fontWeight: 700 }}>
                  Question {currentQuestionIndex + 1} of {totalQCount}
                </span>
                <Badge variant="accent" size="sm">
                  {currentQ.marks} Marks
                </Badge>
              </div>

              <div style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-primary)", marginBottom: "var(--space-6)", lineHeight: 1.6 }}>
                {currentQ.questionText}
              </div>

              {/* Options */}
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", marginBottom: "var(--space-6)" }}>
                {currentQ.options.map((opt, optIdx) => {
                  const isSelected = selectedOptionIndex === optIdx;
                  const letter = String.fromCharCode(65 + optIdx);

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => setUserAnswers((prev) => ({ ...prev, [currentQ.id]: optIdx }))}
                      style={{
                        padding: "12px 16px",
                        borderRadius: "var(--radius-md)",
                        border: isSelected ? "2px solid #007AFF" : "1px solid var(--color-border)",
                        backgroundColor: isSelected ? "rgba(0, 122, 255, 0.08)" : "var(--color-surface)",
                        textAlign: "left",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        fontSize: "var(--text-sm)",
                      }}
                    >
                      <span
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "var(--radius-full)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: isSelected ? "#007AFF" : "var(--color-surface-muted)",
                          color: isSelected ? "#FFFFFF" : "var(--color-primary)",
                          fontWeight: 700,
                          fontSize: "12px",
                        }}
                      >
                        {letter}
                      </span>
                      <span style={{ fontWeight: isSelected ? 600 : 400 }}>{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Navigation Actions */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--color-border)", paddingTop: "var(--space-4)" }}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setUserAnswers((prev) => ({ ...prev, [currentQ.id]: null }))}
                >
                  Clear Selection
                </Button>

                <div style={{ display: "flex", gap: "var(--space-2)" }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setReviewFlags((prev) => ({ ...prev, [currentQ.id]: !prev[currentQ.id] }))}
                  >
                    {isCurrentMarked ? "✓ Marked for Review" : "Mark for Review"}
                  </Button>

                  {currentQuestionIndex > 0 && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                    >
                      ← Previous
                    </Button>
                  )}

                  {currentQuestionIndex < totalQCount - 1 ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                    >
                      Next Question →
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setIsConfirmSubmitOpen(true)}
                    >
                      Review &amp; Submit →
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Question Palette */}
          <Card padding="md">
            <h4 style={{ fontSize: "var(--text-xs)", fontWeight: 700, textTransform: "uppercase", marginBottom: "var(--space-3)" }}>
              Question Palette
            </h4>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px", marginBottom: "var(--space-4)" }}>
              {selectedExam.questions.map((q, idx) => {
                const isCurrent = idx === currentQuestionIndex;
                const isAns = userAnswers[q.id] !== null && userAnswers[q.id] !== undefined;
                const isMrk = reviewFlags[q.id];

                let bg = "var(--color-surface-muted)";
                let color = "var(--color-primary)";
                if (isAns) {
                  bg = "#34C759";
                  color = "#FFFFFF";
                } else if (isMrk) {
                  bg = "#AF52DE";
                  color = "#FFFFFF";
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentQuestionIndex(idx)}
                    style={{
                      height: "36px",
                      borderRadius: "var(--radius-sm)",
                      backgroundColor: bg,
                      color,
                      border: isCurrent ? "2px solid #007AFF" : "1px solid var(--color-border)",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div style={{ fontSize: "11px", color: "var(--color-neutral-dark)", display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "2px", backgroundColor: "#34C759" }} />
                <span>Answered ({answeredCount})</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "2px", backgroundColor: "#AF52DE" }} />
                <span>Marked for Review ({markedCount})</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "2px", backgroundColor: "var(--color-surface-muted)", border: "1px solid var(--color-border)" }} />
                <span>Unanswered ({unansweredCount})</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Confirm Submit Dialog */}
        {isConfirmSubmitOpen && (
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsConfirmSubmitOpen(false);
            }}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "var(--space-4)",
            }}
          >
            <Card padding="lg" style={{ maxWidth: "480px", width: "100%" }}>
              <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, marginBottom: "var(--space-2)" }}>
                Confirm Final Examination Submission
              </h3>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", lineHeight: 1.5, marginBottom: "var(--space-4)" }}>
                Are you sure you wish to submit your mock examination now? You will not be able to modify your answers once submitted.
              </p>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)" }}>
                <Button variant="secondary" size="sm" onClick={() => setIsConfirmSubmitOpen(false)}>
                  Return to Exam
                </Button>
                <Button variant="primary" size="sm" onClick={() => handleFinalSubmit("manual")}>
                  Confirm &amp; Submit
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    );
  }

  if (examViewState === "result" && activeResult) {
    const exam = mockExams.find((e) => e.id === activeResult.examId) || selectedExam;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <Card padding="lg" style={{ borderTop: "4px solid var(--color-accent)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "6px" }}>
                <Badge variant="accent" size="sm">Mock Exam Scorecard</Badge>
                <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)" }}>Submitted: {activeResult.submittedAt}</span>
              </div>
              <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--color-primary)", margin: 0 }}>
                {exam ? exam.title : "Performance Review"}
              </h2>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", marginTop: "4px" }}>
                Candidate: <strong>{activeResult.studentName}</strong> &bull; Total Time Taken: {Math.floor(activeResult.timeTakenSeconds / 60)}m {activeResult.timeTakenSeconds % 60}s
              </p>
            </div>

            <Button variant="secondary" size="sm" onClick={() => setExamViewState("list")}>
              ← Back to Assessment Desk
            </Button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
              gap: "var(--space-3)",
              marginBottom: "var(--space-6)",
            }}
          >
            <div style={{ backgroundColor: "var(--color-surface-muted)", padding: "14px", borderRadius: "var(--radius-md)", textAlign: "center" }}>
              <div style={{ fontSize: "10px", color: "var(--color-neutral-dark)", textTransform: "uppercase" }}>Score</div>
              <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--color-accent)" }}>
                {activeResult.scoreObtained} / {activeResult.totalMarks}
              </div>
              <div style={{ fontSize: "11px", color: "var(--color-neutral-dark)", marginTop: "2px" }}>
                {activeResult.percentage}% Score
              </div>
            </div>

            <div style={{ backgroundColor: "rgba(52, 199, 89, 0.08)", padding: "14px", borderRadius: "var(--radius-md)", textAlign: "center", border: "1px solid rgba(52, 199, 89, 0.2)" }}>
              <div style={{ fontSize: "10px", color: "var(--color-neutral-dark)", textTransform: "uppercase" }}>Correct</div>
              <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "#34C759" }}>
                {activeResult.correctCount} / {activeResult.totalQuestions}
              </div>
            </div>

            <div style={{ backgroundColor: "rgba(255, 59, 48, 0.08)", padding: "14px", borderRadius: "var(--radius-md)", textAlign: "center", border: "1px solid rgba(255, 59, 48, 0.2)" }}>
              <div style={{ fontSize: "10px", color: "var(--color-neutral-dark)", textTransform: "uppercase" }}>Incorrect</div>
              <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "#FF3B30" }}>
                {activeResult.incorrectCount}
              </div>
            </div>

            <div style={{ backgroundColor: "var(--color-surface-muted)", padding: "14px", borderRadius: "var(--radius-md)", textAlign: "center" }}>
              <div style={{ fontSize: "10px", color: "var(--color-neutral-dark)", textTransform: "uppercase" }}>Outcome</div>
              <div style={{ fontSize: "var(--text-base)", fontWeight: 700, color: activeResult.isPassed ? "#34C759" : "var(--color-primary)" }}>
                {activeResult.isPassed !== undefined ? (activeResult.isPassed ? "PASSED" : "NEEDS PRACTICE") : "EVALUATED"}
              </div>
            </div>
          </div>

          <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, marginBottom: "var(--space-3)" }}>
            Diagnostic Solution Review &amp; Explanations
          </h3>

          {exam && (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {exam.questions.map((q, idx) => {
                const userChoice = activeResult.answers[q.id];
                const isCorrect = userChoice === q.correctOptionIndex;
                const isUnanswered = userChoice === null || userChoice === undefined;

                return (
                  <Card
                    key={q.id}
                    padding="sm"
                    style={{
                      borderLeft: isCorrect ? "4px solid #34C759" : isUnanswered ? "4px solid var(--color-neutral)" : "4px solid #FF3B30",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontSize: "var(--text-xs)", fontWeight: 700 }}>Question {idx + 1}</span>
                      <Badge variant={isCorrect ? "success" : isUnanswered ? "neutral" : "warning"} size="sm">
                        {isCorrect ? `✓ Correct (+${q.marks})` : isUnanswered ? "— Unanswered (0)" : "✗ Incorrect (0)"}
                      </Badge>
                    </div>
                    <p style={{ fontSize: "var(--text-xs)", fontWeight: 600, margin: "0 0 6px" }}>{q.questionText}</p>
                    {q.explanation && (
                      <div style={{ fontSize: "11px", color: "var(--color-neutral-dark)", backgroundColor: "var(--color-surface-muted)", padding: "6px 10px", borderRadius: "var(--radius-sm)" }}>
                        <strong>Explanation:</strong> {q.explanation}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // MAIN ORGANIZED DASHBOARD (Overview, Tests & Marks, Results & Reports, Certificate Management)
  // --------------------------------------------------------------------------
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      {/* Toast Notice */}
      {actionNotice && (
        <div
          role="status"
          style={{
            backgroundColor: "#1D1D1F",
            color: "#FFFFFF",
            padding: "10px 16px",
            borderRadius: "var(--radius-md)",
            fontSize: "var(--text-xs)",
            fontWeight: 600,
            textAlign: "center",
            boxShadow: "var(--shadow-md)",
            borderLeft: "4px solid #34C759",
          }}
        >
          {actionNotice}
        </div>
      )}

      {/* Main Module Header & Organized Navigation Tabs */}
      <Card padding="md">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--space-3)" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "4px" }}>
              <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 700, margin: 0 }}>
                {role === "parent"
                  ? "Ward's Assessment Management & Performance Reports"
                  : role === "student"
                  ? "Academic Assessments & Examination Records"
                  : role === "teacher"
                  ? "Faculty Assessment Desk & Examination Ledger"
                  : "Academy Assessment Management & Examination Directorate"}
              </h2>
              <Badge variant="accent" size="sm">
                Session 2026–27
              </Badge>
            </div>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", margin: 0 }}>
              Practical coaching-academy assessment system with configurable certificate policies, marks recording, and student progress reports.
            </p>
          </div>

          {/* Quick Actions for Admin and Teachers */}
          <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
            {(role === "teacher" || role === "academy-admin") && (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleOpenCreateAssessmentModal()}
                >
                  + Create Assessment
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleOpenRecordMarksModal()}
                >
                  + Record Marks
                </Button>
              </>
            )}
            {role === "teacher" && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleOpenAuthorModal()}
              >
                + Create Mock Exam
              </Button>
            )}
          </div>
        </div>

        {/* Clean 4-Area Navigation Subtabs */}
        <div
          style={{
            display: "flex",
            gap: "var(--space-2)",
            marginTop: "var(--space-4)",
            borderTop: "1px solid var(--color-border)",
            paddingTop: "var(--space-3)",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            style={{
              padding: "6px 14px",
              borderRadius: "var(--radius-full)",
              fontSize: "var(--text-xs)",
              fontWeight: activeTab === "overview" ? 700 : 500,
              backgroundColor: activeTab === "overview" ? "var(--color-primary)" : "var(--color-surface-muted)",
              color: activeTab === "overview" ? "#FFFFFF" : "var(--color-primary)",
              border: "1px solid var(--color-border)",
              cursor: "pointer",
            }}
          >
            📊 Overview
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("tests")}
            style={{
              padding: "6px 14px",
              borderRadius: "var(--radius-full)",
              fontSize: "var(--text-xs)",
              fontWeight: activeTab === "tests" ? 700 : 500,
              backgroundColor: activeTab === "tests" ? "var(--color-primary)" : "var(--color-surface-muted)",
              color: activeTab === "tests" ? "#FFFFFF" : "var(--color-primary)",
              border: "1px solid var(--color-border)",
              cursor: "pointer",
            }}
          >
            📝 Tests &amp; Marks ({visibleAssessments.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("results")}
            style={{
              padding: "6px 14px",
              borderRadius: "var(--radius-full)",
              fontSize: "var(--text-xs)",
              fontWeight: activeTab === "results" ? 700 : 500,
              backgroundColor: activeTab === "results" ? "var(--color-primary)" : "var(--color-surface-muted)",
              color: activeTab === "results" ? "#FFFFFF" : "var(--color-primary)",
              border: "1px solid var(--color-border)",
              cursor: "pointer",
            }}
          >
            📈 Results &amp; Reports ({studentResultsLedger.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("certificates")}
            style={{
              padding: "6px 14px",
              borderRadius: "var(--radius-full)",
              fontSize: "var(--text-xs)",
              fontWeight: activeTab === "certificates" ? 700 : 500,
              backgroundColor: activeTab === "certificates" ? "var(--color-primary)" : "var(--color-surface-muted)",
              color: activeTab === "certificates" ? "#FFFFFF" : "var(--color-primary)",
              border: "1px solid var(--color-border)",
              cursor: "pointer",
            }}
          >
            🎓 Certificate Management ({certificateAssessments.length} Active Policies)
          </button>
        </div>
      </Card>

      {/* Filter and Candidate Selector Strip */}
      <Card padding="sm">
        <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", alignItems: "center", flex: 1 }}>
            {/* Subject Filter */}
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)", fontWeight: 600 }}>Subject:</span>
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                style={{ fontSize: "11px", padding: "4px 8px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}
              >
                <option value="all">All Subjects</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Accountancy">Accountancy</option>
              </select>
            </div>

            {/* Batch Filter */}
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)", fontWeight: 600 }}>Batch:</span>
              <select
                value={filterBatch}
                onChange={(e) => setFilterBatch(e.target.value)}
                style={{ fontSize: "11px", padding: "4px 8px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}
              >
                <option value="all">All Batches</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.name}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Test Type Filter */}
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)", fontWeight: 600 }}>Type:</span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                style={{ fontSize: "11px", padding: "4px 8px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}
              >
                <option value="all">All Categories</option>
                <option value="regular-class-test">Regular Class Test</option>
                <option value="periodic-unit-test">Periodic Unit Test</option>
                <option value="board-mock-test">Board Preparation Mock</option>
                <option value="online-mock-exam">Online Mock Exam</option>
              </select>
            </div>

            {/* Status Filter */}
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)", fontWeight: 600 }}>Status:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ fontSize: "11px", padding: "4px 8px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="published">Published</option>
              </select>
            </div>

            {/* Search Input */}
            <div style={{ minWidth: "160px", flex: "1 1 140px" }}>
              <input
                type="text"
                placeholder="Search assessments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "4px 8px",
                  fontSize: "11px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border)",
                }}
              />
            </div>
          </div>

          {/* Student Selector for Teachers & Admin */}
          {(role === "teacher" || role === "academy-admin") && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)", fontWeight: 600 }}>
                Candidate View:
              </span>
              <select
                value={inspectedStudentId}
                onChange={(e) => setInspectedStudentId(e.target.value)}
                style={{
                  fontSize: "11px",
                  padding: "4px 8px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border)",
                  fontWeight: 600,
                }}
              >
                {(role === "teacher" ? teacherStudents : students).map((std) => (
                  <option key={std.id} value={std.id}>
                    {std.name} ({std.classGrade})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </Card>

      {/* ==================================================================== */}
      {/* AREA 1: OVERVIEW                                                     */}
      {/* ==================================================================== */}
      {activeTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {/* Top Useful Metrics Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--space-3)" }}>
            <Card padding="md">
              <div style={{ fontSize: "10px", color: "var(--color-neutral-dark)", textTransform: "uppercase", fontWeight: 700 }}>
                Total Assessments
              </div>
              <div style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--color-primary)", marginTop: "4px" }}>
                {overviewMetrics.totalAssessments}
              </div>
              <div style={{ fontSize: "11px", color: "var(--color-neutral-dark)", marginTop: "2px" }}>
                Active curriculum assessments
              </div>
            </Card>

            <Card padding="md">
              <div style={{ fontSize: "10px", color: "var(--color-neutral-dark)", textTransform: "uppercase", fontWeight: 700 }}>
                Upcoming Tests
              </div>
              <div style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "#007AFF", marginTop: "4px" }}>
                {overviewMetrics.upcomingCount}
              </div>
              <div style={{ fontSize: "11px", color: "var(--color-neutral-dark)", marginTop: "2px" }}>
                Scheduled or upcoming dates
              </div>
            </Card>

            <Card padding="md">
              <div style={{ fontSize: "10px", color: "var(--color-neutral-dark)", textTransform: "uppercase", fontWeight: 700 }}>
                Pending Publication
              </div>
              <div style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "#FF9500", marginTop: "4px" }}>
                {overviewMetrics.pendingPublicationCount}
              </div>
              <div style={{ fontSize: "11px", color: "var(--color-neutral-dark)", marginTop: "2px" }}>
                Drafts or pending results
              </div>
            </Card>

            <Card padding="md">
              <div style={{ fontSize: "10px", color: "var(--color-neutral-dark)", textTransform: "uppercase", fontWeight: 700 }}>
                Certificates Issued
              </div>
              <div style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--color-success)", marginTop: "4px" }}>
                {overviewMetrics.activeIssuedCount}
              </div>
              <div style={{ fontSize: "11px", color: "var(--color-neutral-dark)", marginTop: "2px" }}>
                Verified honors awarded
              </div>
            </Card>
          </div>

          {/* Admin / Teacher Permissions Notice */}
          {role === "academy-admin" && (
            <Card padding="sm" style={{ borderLeft: "4px solid #007AFF" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-2)" }}>
                <div>
                  <strong style={{ fontSize: "var(--text-xs)" }}>Faculty Certificate Policy Authorization:</strong>
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", marginLeft: "6px" }}>
                    Control whether authorized teachers may toggle certificate issuance policies on their assigned tests.
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Badge variant={allowTeacherCertControl ? "success" : "neutral"} size="sm">
                    {allowTeacherCertControl ? "Teachers Permitted" : "Admin Only"}
                  </Badge>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const nextState = !allowTeacherCertControl;
                      setAllowTeacherCertControl(nextState);
                      recordUpdate({
                        action: "Update Certificate Policy Permission",
                        type: "system",
                        target: "Teacher Certificate Permission",
                        details: `Changed teacher certificate configuration permission to: ${nextState ? "Permitted" : "Restricted to Admin"}.`,
                        performedBy: "Academy Administrator",
                        actorRole: "academy-admin",
                        entityType: "setting",
                        entityId: "setting-teacher-cert-control",
                        outcome: "SUCCESS",
                        diff: [{ fieldName: "allowTeacherCertControl", before: String(allowTeacherCertControl), after: String(nextState) }],
                        sourcePortal: "academy-admin",
                      });
                      showToast(`Teacher certificate configuration is now ${nextState ? "Permitted" : "Restricted to Admin"}.`);
                    }}
                  >
                    {allowTeacherCertControl ? "Restrict to Admin" : "Allow Teachers"}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Overview Quick Glance Table */}
          <Card padding="md">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-3)" }}>
              <div>
                <h3 style={{ fontSize: "var(--text-sm)", fontWeight: 700, margin: 0 }}>
                  Recent Assessments &amp; Evaluation Status
                </h3>
                <p style={{ fontSize: "11px", color: "var(--color-neutral-dark)", margin: "2px 0 0" }}>
                  Overview of assessment schedule, format, and configured certificate policy status.
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setActiveTab("tests")}>
                View All Tests →
              </Button>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-xs)", textAlign: "left" }}>
                <thead>
                  <tr style={{ backgroundColor: "var(--color-surface-muted)", borderBottom: "1px solid var(--color-border)", color: "var(--color-neutral-dark)" }}>
                    <th style={{ padding: "8px 12px" }}>Title &amp; Format</th>
                    <th style={{ padding: "8px 12px" }}>Subject</th>
                    <th style={{ padding: "8px 12px" }}>Batch</th>
                    <th style={{ padding: "8px 12px" }}>Date</th>
                    <th style={{ padding: "8px 12px" }}>Status</th>
                    <th style={{ padding: "8px 12px" }}>Certificate Policy</th>
                    <th style={{ padding: "8px 12px", textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleAssessments.slice(0, 5).map((exam) => {
                    const certEnabled = Boolean(exam.certificatePolicy?.enabled);
                    const threshold = exam.certificatePolicy?.minPercentage ?? 75;

                    return (
                      <tr key={exam.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ fontWeight: 600, color: "var(--color-primary)" }}>{exam.title}</div>
                          <div style={{ fontSize: "10px", color: "var(--color-neutral-dark)", textTransform: "capitalize" }}>
                            {(exam.type || "regular-class-test").replace(/-/g, " ")} &bull; Max {exam.totalMarks} Marks
                          </div>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <Badge variant="accent" size="sm">{exam.subject}</Badge>
                        </td>
                        <td style={{ padding: "10px 12px", color: "var(--color-neutral-dark)" }}>
                          {exam.batch}
                        </td>
                        <td style={{ padding: "10px 12px", color: "var(--color-neutral-dark)" }}>
                          {exam.date}
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <Badge
                            variant={exam.status === "published" ? "success" : exam.status === "draft" ? "neutral" : "accent"}
                            size="sm"
                          >
                            {exam.status || "published"}
                          </Badge>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          {certEnabled ? (
                            <Badge variant="success" size="sm">
                              Certificates Enabled (≥{threshold}%)
                            </Badge>
                          ) : (
                            <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)", fontStyle: "italic" }}>
                              Certificates Disabled (Class Test)
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "right" }}>
                          {(role === "teacher" || role === "academy-admin") ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleOpenRecordMarksModal(exam)}
                            >
                              Marks Ledger
                            </Button>
                          ) : exam.type === "online-mock-exam" ? (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => {
                                const mock = mockExams.find((m) => m.id === exam.linkedMockExamId || m.id === exam.id);
                                if (mock) handleOpenInstructions(mock);
                              }}
                            >
                              Take Exam →
                            </Button>
                          ) : (
                            <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)" }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ==================================================================== */}
      {/* AREA 2: TESTS & MARKS MANAGEMENT                                    */}
      {/* ==================================================================== */}
      {activeTab === "tests" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-2)" }}>
            <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, margin: 0 }}>
              Assessment Catalog &amp; Marks Management ({visibleAssessments.length})
            </h3>
            <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)" }}>
              {role === "teacher" ? `Showing assessments managed by ${currentTeacher.name}` : "Showing academy assessment records"}
            </span>
          </div>

          {visibleAssessments.length === 0 ? (
            <Card padding="lg" style={{ textAlign: "center", color: "var(--color-neutral-dark)" }}>
              <p>No assessments match the current filter criteria.</p>
              <Button
                variant="secondary"
                size="sm"
                style={{ marginTop: "var(--space-2)" }}
                onClick={() => {
                  setFilterSubject("all");
                  setFilterBatch("all");
                  setFilterType("all");
                  setFilterStatus("all");
                  setSearchQuery("");
                }}
              >
                Reset Filters
              </Button>
            </Card>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "var(--space-4)" }}>
              {visibleAssessments.map((exam) => {
                const isTeacherOwner = role === "teacher" && exam.teacherId === currentTeacherId;
                const canEdit = role === "academy-admin" || isTeacherOwner;
                const certEnabled = Boolean(exam.certificatePolicy?.enabled);
                const certThreshold = exam.certificatePolicy?.minPercentage ?? 75;
                const evaluatedCount = exam.studentScores.filter((s) => s.status === "evaluated").length;

                return (
                  <div
                    key={exam.id}
                    style={{
                      backgroundColor: "var(--color-surface)",
                      borderRadius: "var(--radius-lg)",
                      border: "1px solid var(--color-border)",
                      padding: "var(--space-4)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "var(--space-3)",
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    <div>
                      {/* Badge header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          <Badge variant="accent" size="sm">{exam.subject}</Badge>
                          <Badge
                            variant={
                              exam.type === "board-mock-test"
                                ? "warning"
                                : exam.type === "online-mock-exam"
                                ? "success"
                                : "neutral"
                            }
                            size="sm"
                          >
                            {(exam.type || "regular-class-test").replace(/-/g, " ")}
                          </Badge>
                        </div>
                        <Badge
                          variant={exam.status === "published" ? "success" : exam.status === "draft" ? "neutral" : "accent"}
                          size="sm"
                        >
                          {exam.status || "published"}
                        </Badge>
                      </div>

                      <h4 style={{ fontSize: "var(--text-base)", fontWeight: 700, margin: "0 0 6px", color: "var(--color-primary)" }}>
                        {exam.title}
                      </h4>

                      <div style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", lineHeight: 1.6 }}>
                        <div>📅 Date: <strong>{exam.date}</strong> &bull; Total Marks: <strong>{exam.totalMarks}</strong></div>
                        <div>🏷️ {exam.batch} &bull; Class: <strong>{exam.classGrade}</strong></div>
                        <div>
                          👨‍🏫 Evaluator: <strong>{exam.teacherId === "tch-azhar" ? "Azhar Sir" : exam.teacherId === "tch-alvi" ? "Dr. Tariq Alvi" : "Prof. N. Roy"}</strong>
                        </div>
                      </div>

                      {/* Certificate Policy Banner for this test */}
                      <div
                        style={{
                          marginTop: "var(--space-3)",
                          padding: "6px 10px",
                          borderRadius: "var(--radius-sm)",
                          backgroundColor: certEnabled ? "rgba(52, 199, 89, 0.08)" : "var(--color-surface-muted)",
                          border: certEnabled ? "1px solid rgba(52, 199, 89, 0.3)" : "1px solid var(--color-border)",
                          fontSize: "11px",
                        }}
                      >
                        {certEnabled ? (
                          <div style={{ color: "#34C759", fontWeight: 600 }}>
                            🎓 Certificate Policy: <strong>Active (≥{certThreshold}%)</strong>
                            <div style={{ fontSize: "10px", color: "var(--color-neutral-dark)", fontWeight: 400 }}>
                              {exam.certificatePolicy?.certificateTitle || "Merit Certificate"}
                            </div>
                          </div>
                        ) : (
                          <div style={{ color: "var(--color-neutral-dark)" }}>
                            🔒 Certificates: <strong>Disabled</strong> (Standard Marks Only)
                          </div>
                        )}
                      </div>

                      {/* Evaluated Student Scores count */}
                      <div style={{ fontSize: "11px", color: "var(--color-neutral-dark)", marginTop: "6px" }}>
                        Evaluation Progress: <strong>{evaluatedCount} evaluated score(s)</strong> recorded
                      </div>
                    </div>

                    {/* Action Buttons Row */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderTop: "1px solid var(--color-border)",
                        paddingTop: "var(--space-3)",
                        gap: "var(--space-2)",
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        {canEdit && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenCreateAssessmentModal(exam)}
                              style={{
                                fontSize: "11px",
                                color: "var(--color-neutral-dark)",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontWeight: 600,
                                padding: "4px",
                              }}
                            >
                              Edit Settings
                            </button>
                            {exam.status === "published" ? (
                              <button
                                type="button"
                                onClick={() => handleTogglePublishStatus(exam, "draft")}
                                style={{
                                  fontSize: "11px",
                                  color: "var(--color-warning, #FF9500)",
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  fontWeight: 600,
                                  padding: "4px",
                                }}
                                title="Unpublish this assessment to make it a draft (hidden from students)"
                              >
                                Unpublish
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleTogglePublishStatus(exam, "published")}
                                style={{
                                  fontSize: "11px",
                                  color: "var(--color-success, #34C759)",
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  fontWeight: 600,
                                  padding: "4px",
                                }}
                                title="Publish this assessment to make it visible to enrolled students"
                              >
                                Publish →
                              </button>
                            )}
                          </>
                        )}
                      </div>

                      <div style={{ display: "flex", gap: "6px" }}>
                        {exam.type === "online-mock-exam" ? (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              const mock = mockExams.find((m) => m.id === exam.linkedMockExamId || m.id === exam.id);
                              if (mock) handleOpenInstructions(mock);
                              else showToast("Mock examination details not found.");
                            }}
                          >
                            {role === "student" ? "Take Mock Exam →" : "Preview Exam Engine →"}
                          </Button>
                        ) : canEdit ? (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleOpenRecordMarksModal(exam)}
                          >
                            Enter Marks →
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setActiveTab("results")}
                          >
                            View Result →
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* AREA 3: RESULTS & REPORTS                                            */}
      {/* ==================================================================== */}
      {activeTab === "results" && (
        !targetStudent ? (
          <Card padding="lg" style={{ textAlign: "center", color: "var(--color-neutral-dark)", margin: "var(--space-4) 0" }}>
            <h4 style={{ fontSize: "var(--text-base)", fontWeight: 600, marginBottom: "var(--space-2)" }}>No Student Linked</h4>
            <p style={{ fontSize: "var(--text-xs)", margin: 0 }}>
              There is currently no student record associated with this account to display assessment results.
            </p>
          </Card>
        ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {/* Candidate Profile & Cumulative Academic Summary Banner */}
          <Card padding="lg" style={{ borderLeft: "4px solid #007AFF" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, margin: 0 }}>
                    {targetStudent.name} &bull; Academic Assessment Record
                  </h3>
                  <Badge variant="accent" size="sm">{targetStudent.classGrade}</Badge>
                  <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)" }}>
                    {targetStudent.board} &bull; Guardian: {targetStudent.guardianName}
                  </span>
                </div>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", margin: 0 }}>
                  Evaluated scores across regular class tests, periodic unit tests, and board preparation mocks.
                </p>
              </div>

              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "10px", color: "var(--color-neutral-dark)", textTransform: "uppercase" }}>Overall Average</span>
                <div style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: resultsSummary.cumulativePercentage >= 75 ? "var(--color-success)" : "var(--color-primary)" }}>
                  {resultsSummary.cumulativePercentage}%
                </div>
              </div>
            </div>

            {/* Performance KPI Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                gap: "var(--space-3)",
                marginBottom: "var(--space-4)",
              }}
            >
              <div style={{ backgroundColor: "var(--color-surface-muted)", padding: "12px", borderRadius: "var(--radius-md)", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "var(--color-neutral-dark)", textTransform: "uppercase" }}>Evaluated Tests</div>
                <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--color-primary)" }}>
                  {resultsSummary.totalEvaluated}
                </div>
              </div>

              <div style={{ backgroundColor: "var(--color-surface-muted)", padding: "12px", borderRadius: "var(--radius-md)", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "var(--color-neutral-dark)", textTransform: "uppercase" }}>Marks Obtained</div>
                <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--color-accent)" }}>
                  {resultsSummary.totalMarksObtained} / {resultsSummary.totalMarksMax}
                </div>
              </div>

              {/* Subject Breakdown cards */}
              {Object.keys(resultsSummary.subjectStats).map((subj) => {
                const item = resultsSummary.subjectStats[subj];
                return (
                  <div key={subj} style={{ backgroundColor: "rgba(0, 122, 255, 0.05)", border: "1px solid rgba(0, 122, 255, 0.2)", padding: "12px", borderRadius: "var(--radius-md)", textAlign: "center" }}>
                    <div style={{ fontSize: "10px", color: "var(--color-neutral-dark)", textTransform: "uppercase" }}>{subj}</div>
                    <div style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-primary)" }}>
                      {item.obtained}/{item.max} ({item.pct}%)
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Detailed Itemized Results Table */}
          <Card padding="md">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-3)" }}>
              <div>
                <h4 style={{ fontSize: "var(--text-sm)", fontWeight: 700, margin: 0 }}>
                  Itemized Assessment Scorecard ({studentResultsLedger.length})
                </h4>
                <p style={{ fontSize: "11px", color: "var(--color-neutral-dark)", margin: "2px 0 0" }}>
                  Detailed results showing marks obtained, calculated percentages, faculty diagnostics, and publication status.
                </p>
              </div>
            </div>

            {studentResultsLedger.length === 0 ? (
              <div style={{ padding: "var(--space-6)", textAlign: "center", color: "var(--color-neutral-dark)", fontSize: "var(--text-xs)" }}>
                No evaluated test records available for {targetStudent.name} under the selected filters.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-xs)", textAlign: "left" }}>
                  <thead>
                    <tr style={{ backgroundColor: "var(--color-surface-muted)", borderBottom: "1px solid var(--color-border)", color: "var(--color-neutral-dark)" }}>
                      <th style={{ padding: "8px 12px" }}>Subject</th>
                      <th style={{ padding: "8px 12px" }}>Assessment Title</th>
                      <th style={{ padding: "8px 12px" }}>Format</th>
                      <th style={{ padding: "8px 12px" }}>Date</th>
                      <th style={{ padding: "8px 12px" }}>Marks Obtained</th>
                      <th style={{ padding: "8px 12px" }}>Percentage</th>
                      <th style={{ padding: "8px 12px" }}>Standing</th>
                      <th style={{ padding: "8px 12px" }}>Teacher Feedback</th>
                      <th style={{ padding: "8px 12px", textAlign: "right" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentResultsLedger.map((record) => (
                      <tr key={record.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                        <td style={{ padding: "10px 12px" }}>
                          <Badge variant="accent" size="sm">{record.subject}</Badge>
                        </td>
                        <td style={{ padding: "10px 12px", fontWeight: 600, color: "var(--color-primary)" }}>
                          {record.title}
                          {record.certPolicyEnabled && (
                            <div style={{ fontSize: "10px", color: "#34C759", fontWeight: 600, marginTop: "2px" }}>
                              ★ Certificate Qualified (Policy ≥ {record.certThreshold}%)
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <Badge variant="neutral" size="sm">
                            {record.type.replace(/-/g, " ")}
                          </Badge>
                        </td>
                        <td style={{ padding: "10px 12px", color: "var(--color-neutral-dark)" }}>
                          {record.date}
                        </td>
                        <td style={{ padding: "10px 12px", fontWeight: 700, color: "var(--color-primary)" }}>
                          {record.marksObtained} / {record.totalMarks}
                        </td>
                        <td style={{ padding: "10px 12px", fontWeight: 700, color: record.percentage >= 75 ? "var(--color-success)" : "inherit" }}>
                          {record.percentage}%
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <Badge variant={record.percentage >= 75 ? "success" : "neutral"} size="sm">
                            {record.status}
                          </Badge>
                        </td>
                        <td style={{ padding: "10px 12px", color: "var(--color-neutral-dark)", maxWidth: "200px" }}>
                          {record.feedback || "—"}
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "right" }}>
                          {record.issuedCertificate ? (
                            <button
                              type="button"
                              onClick={() => handlePreviewCertificateModal(record.issuedCertificate!)}
                              style={{
                                padding: "3px 8px",
                                borderRadius: "var(--radius-sm)",
                                fontSize: "10px",
                                fontWeight: 700,
                                backgroundColor: "rgba(52, 199, 89, 0.1)",
                                color: "#34C759",
                                border: "1px solid rgba(52, 199, 89, 0.3)",
                                cursor: "pointer",
                              }}
                            >
                              🎓 View Issued Cert
                            </button>
                          ) : (
                            <Badge variant={record.isPublished ? "success" : "neutral"} size="sm">
                              {record.isPublished ? "Published" : "Draft"}
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
        )
      )}

      {/* ==================================================================== */}
      {/* AREA 4: CERTIFICATE MANAGEMENT                                       */}
      {/* ==================================================================== */}
      {activeTab === "certificates" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
          {/* Certificate Policy Guidance Notice */}
          <Card padding="md" style={{ borderLeft: "4px solid #34C759" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--space-2)" }}>
              <div>
                <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, margin: "0 0 4px" }}>
                  Coaching Assessment Certificate Directorate
                </h3>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", margin: 0, lineHeight: 1.5 }}>
                  Certificates are <strong>NOT automatically issued</strong> for every class test. Each assessment has an independently configurable policy.
                  Board-preparation mock tests and designated honors tests can have certificate issuance enabled with custom percentage thresholds.
                </p>
              </div>

              {role === "academy-admin" && (
                <Badge variant={allowTeacherCertControl ? "success" : "neutral"} size="sm">
                  Faculty Config: {allowTeacherCertControl ? "Enabled" : "Admin Only"}
                </Badge>
              )}
            </div>
          </Card>

          {/* Assessment Policy Selector Bar */}
          <Card padding="sm">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-3)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "var(--text-xs)", fontWeight: 700 }}>
                  Select Assessment Policy:
                </span>
                <select
                  value={selectedCertAssessmentId}
                  onChange={(e) => setSelectedCertAssessmentId(e.target.value)}
                  style={{
                    fontSize: "var(--text-xs)",
                    padding: "6px 10px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-border)",
                    fontWeight: 600,
                  }}
                >
                  {certificateAssessments.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.title} ({ex.subject} &bull; Policy: ≥{ex.certificatePolicy?.minPercentage}%)
                    </option>
                  ))}
                  {certificateAssessments.length === 0 && (
                    <option value="">No assessments currently have certificates enabled</option>
                  )}
                </select>
              </div>

              {activeCertAssessment && canTeacherConfigureCert && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleOpenCreateAssessmentModal(activeCertAssessment)}
                >
                  ⚙️ Configure Assessment Policy
                </Button>
              )}
            </div>
          </Card>

          {/* Active Assessment Certificate Policy Detail */}
          {activeCertAssessment && activeCertAssessment.certificatePolicy?.enabled ? (
            <Card padding="md">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    <Badge variant="success" size="sm">Certificates Enabled</Badge>
                    <Badge variant="accent" size="sm">{activeCertAssessment.subject}</Badge>
                    <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)" }}>{activeCertAssessment.batch}</span>
                  </div>
                  <h4 style={{ fontSize: "var(--text-base)", fontWeight: 700, margin: 0, color: "var(--color-primary)" }}>
                    {activeCertAssessment.title}
                  </h4>
                  <div style={{ fontSize: "11px", color: "var(--color-neutral-dark)", marginTop: "4px" }}>
                    Certificate Title: <strong>{activeCertAssessment.certificatePolicy.certificateTitle || "Certificate of Academic Distinction"}</strong> &bull; Minimum Qualifying Score: <strong style={{ color: "var(--color-success)" }}>≥ {activeCertAssessment.certificatePolicy.minPercentage}%</strong>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "10px", color: "var(--color-neutral-dark)", textTransform: "uppercase" }}>Policy Rule</div>
                  <div style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-primary)" }}>
                    Threshold: ≥ {activeCertAssessment.certificatePolicy.minPercentage}%
                  </div>
                </div>
              </div>

              {/* Eligible Candidates & Issuance Queue Table */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-xs)", textAlign: "left" }}>
                  <thead>
                    <tr style={{ backgroundColor: "var(--color-surface-muted)", borderBottom: "1px solid var(--color-border)", color: "var(--color-neutral-dark)" }}>
                      <th style={{ padding: "8px 12px" }}>Candidate Name</th>
                      <th style={{ padding: "8px 12px" }}>Class / Board</th>
                      <th style={{ padding: "8px 12px" }}>Score Obtained</th>
                      <th style={{ padding: "8px 12px" }}>Percentage</th>
                      <th style={{ padding: "8px 12px" }}>Eligibility Audit</th>
                      <th style={{ padding: "8px 12px" }}>Issuance State</th>
                      <th style={{ padding: "8px 12px", textAlign: "right" }}>Authorized Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {certAuditList.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: "16px", textAlign: "center", color: "var(--color-neutral-dark)" }}>
                          No student marks recorded for this assessment yet.
                        </td>
                      </tr>
                    ) : (
                      certAuditList.map((item) => (
                        <tr key={item.student.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                          <td style={{ padding: "10px 12px", fontWeight: 600 }}>
                            {item.student.name}
                          </td>
                          <td style={{ padding: "10px 12px", color: "var(--color-neutral-dark)" }}>
                            {item.student.classGrade} ({item.student.board})
                          </td>
                          <td style={{ padding: "10px 12px", fontWeight: 700 }}>
                            {item.marksObtained} / {item.totalMarks}
                          </td>
                          <td style={{ padding: "10px 12px", fontWeight: 700, color: item.isEligible ? "var(--color-success)" : "inherit" }}>
                            {item.percentage}%
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            {item.isEligible ? (
                              <Badge variant="success" size="sm">
                                ✓ Qualified (≥{activeCertAssessment.certificatePolicy!.minPercentage}%)
                              </Badge>
                            ) : (
                              <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)", fontStyle: "italic" }}>
                                Ineligible (&lt; {activeCertAssessment.certificatePolicy!.minPercentage}%)
                              </span>
                            )}
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            {item.issuedCert ? (
                              <Badge variant="success" size="sm">
                                ★ Issued ({item.issuedCert.certificateNumber})
                              </Badge>
                            ) : item.revokedCert ? (
                              <Badge variant="warning" size="sm">
                                Revoked
                              </Badge>
                            ) : item.isEligible ? (
                              <Badge variant="accent" size="sm">
                                Pending Issuance
                              </Badge>
                            ) : (
                              <span style={{ fontSize: "10px", color: "var(--color-neutral-dark)" }}>Not Offered</span>
                            )}
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "right" }}>
                            {item.issuedCert ? (
                              <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handlePreviewCertificateModal(item.issuedCert!)}
                                >
                                  Print / PDF
                                </Button>
                                {(role === "academy-admin" || (role === "teacher" && canTeacherConfigureCert)) && (
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    style={{ color: "#FF3B30" }}
                                    onClick={() => handleOpenRevokeConfirm(item.issuedCert!)}
                                  >
                                    Revoke
                                  </Button>
                                )}
                              </div>
                            ) : item.isEligible ? (
                              (role === "academy-admin" || (role === "teacher" && canTeacherConfigureCert)) ? (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleOpenIssueConfirm(item)}
                                >
                                  Confirm &amp; Issue →
                                </Button>
                              ) : (
                                <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)" }}>Awaiting Admin</span>
                              )
                            ) : (
                              <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)" }}>—</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Card padding="lg" style={{ textAlign: "center", color: "var(--color-neutral-dark)" }}>
              <p>No assessment selected or certificates are disabled for the selected assessment.</p>
              {(role === "academy-admin" || role === "teacher") && (
                <Button
                  variant="primary"
                  size="sm"
                  style={{ marginTop: "var(--space-2)" }}
                  onClick={() => handleOpenCreateAssessmentModal()}
                >
                  + Create Assessment with Certificates Enabled
                </Button>
              )}
            </Card>
          )}

          {/* Official Issued Certificates Ledger */}
          <Card padding="md">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-3)", flexWrap: "wrap", gap: "var(--space-2)" }}>
              <div>
                <h4 style={{ fontSize: "var(--text-sm)", fontWeight: 700, margin: 0 }}>
                  Official Certificates Ledger ({issuedCertificates.length})
                </h4>
                <p style={{ fontSize: "11px", color: "var(--color-neutral-dark)", margin: "2px 0 0" }}>
                  Record of verified certificates issued during this academic session.
                </p>
              </div>
            </div>

            {issuedCertificates.length === 0 ? (
              <div style={{ padding: "var(--space-6)", textAlign: "center", color: "var(--color-neutral-dark)", fontSize: "var(--text-xs)" }}>
                No certificates have been issued yet. Configure an assessment certificate policy and issue to qualifying candidates.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-xs)", textAlign: "left" }}>
                  <thead>
                    <tr style={{ backgroundColor: "var(--color-surface-muted)", borderBottom: "1px solid var(--color-border)", color: "var(--color-neutral-dark)" }}>
                      <th style={{ padding: "8px 12px" }}>Certificate ID</th>
                      <th style={{ padding: "8px 12px" }}>Candidate</th>
                      <th style={{ padding: "8px 12px" }}>Assessment</th>
                      <th style={{ padding: "8px 12px" }}>Score &amp; %</th>
                      <th style={{ padding: "8px 12px" }}>Issued Date</th>
                      <th style={{ padding: "8px 12px" }}>Issued By</th>
                      <th style={{ padding: "8px 12px" }}>Status</th>
                      <th style={{ padding: "8px 12px", textAlign: "right" }}>Document</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issuedCertificates.map((cert) => (
                      <tr key={cert.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                        <td style={{ padding: "10px 12px", fontWeight: 700, color: "#007AFF" }}>
                          {cert.certificateNumber}
                        </td>
                        <td style={{ padding: "10px 12px", fontWeight: 600 }}>
                          {cert.studentName}
                          <div style={{ fontSize: "10px", color: "var(--color-neutral-dark)", fontWeight: 400 }}>
                            {cert.classGrade} &bull; {cert.board}
                          </div>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <div>{cert.assessmentName}</div>
                          <div style={{ fontSize: "10px", color: "var(--color-neutral-dark)" }}>{cert.subject}</div>
                        </td>
                        <td style={{ padding: "10px 12px", fontWeight: 700, color: "var(--color-success)" }}>
                          {cert.scoreObtained}/{cert.totalMarks} ({cert.percentage}%)
                        </td>
                        <td style={{ padding: "10px 12px", color: "var(--color-neutral-dark)" }}>
                          {cert.issuedDate}
                        </td>
                        <td style={{ padding: "10px 12px", color: "var(--color-neutral-dark)" }}>
                          {cert.issuedBy}
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <Badge variant={cert.status === "issued" ? "success" : "warning"} size="sm">
                            {cert.status === "issued" ? "Active / Issued" : "Revoked"}
                          </Badge>
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "right" }}>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handlePreviewCertificateModal(cert, cert.status === "issued")}
                          >
                            Preview / PDF →
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 1: CREATE / EDIT ASSESSMENT & CERTIFICATE POLICY                */}
      {/* ==================================================================== */}
      {isAssessmentModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAssessmentModalOpen(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "var(--space-4)",
          }}
        >
          <Card padding="lg" style={{ maxWidth: "600px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-3)" }}>
              <div>
                <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, margin: 0 }}>
                  {editingAssessmentId ? "Edit Assessment & Policy" : "Create New Assessment"}
                </h3>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", margin: "2px 0 0" }}>
                  Configure assessment parameters, schedule, maximum marks, and certificate eligibility policy.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAssessmentModalOpen(false)}
                style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "var(--color-neutral-dark)" }}
              >
                ✕
              </button>
            </div>

            {formError && (
              <div style={{ backgroundColor: "rgba(255, 59, 48, 0.1)", border: "1px solid rgba(255, 59, 48, 0.3)", borderRadius: "var(--radius-sm)", padding: "8px 12px", fontSize: "11px", color: "#FF3B30", marginBottom: "var(--space-3)" }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveAssessment}>
              <div style={{ marginBottom: "var(--space-3)" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, marginBottom: "4px" }}>Test Title *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Class X Mathematics Quadratic Equations Unit Test"
                  style={{ width: "100%", padding: "6px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "var(--text-xs)" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)", marginBottom: "var(--space-3)" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, marginBottom: "4px" }}>Category / Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as AssessmentType)}
                    style={{ width: "100%", padding: "6px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "var(--text-xs)" }}
                  >
                    <option value="regular-class-test">Regular Class Test (No Cert Default)</option>
                    <option value="periodic-unit-test">Periodic Unit Test</option>
                    <option value="board-mock-test">Board Preparation Mock Test</option>
                    <option value="online-mock-exam">Online Mock Examination</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, marginBottom: "4px" }}>Subject</label>
                  <select
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    style={{ width: "100%", padding: "6px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "var(--text-xs)" }}
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Accountancy">Accountancy</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)", marginBottom: "var(--space-3)" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, marginBottom: "4px" }}>Batch / Class</label>
                  <select
                    value={formBatch}
                    onChange={(e) => {
                      setFormBatch(e.target.value);
                      const matching = batches.find((b) => b.name === e.target.value);
                      if (matching) setFormClassGrade(matching.classGrade);
                    }}
                    style={{ width: "100%", padding: "6px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "var(--text-xs)" }}
                  >
                    {batches.map((b) => (
                      <option key={b.id} value={b.name}>{b.name} ({b.classGrade})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, marginBottom: "4px" }}>Examination Date</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    style={{ width: "100%", padding: "6px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "var(--text-xs)" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, marginBottom: "4px" }}>Maximum Marks *</label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    required
                    value={formTotalMarks}
                    onChange={(e) => setFormTotalMarks(parseInt(e.target.value) || 0)}
                    style={{ width: "100%", padding: "6px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "var(--text-xs)" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, marginBottom: "4px" }}>Assigned Teacher</label>
                  <select
                    value={formTeacherId}
                    onChange={(e) => setFormTeacherId(e.target.value)}
                    disabled={role === "teacher"} // Teacher cannot reassign to other teachers
                    style={{ width: "100%", padding: "6px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "var(--text-xs)" }}
                  >
                    {faculty.map((t) => (
                      <option key={t.id} value={t.id}>{t.name} ({t.assignedSubjects.join(", ")})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, marginBottom: "4px" }}>Result Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as AssessmentStatus)}
                    style={{ width: "100%", padding: "6px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "var(--text-xs)" }}
                  >
                    <option value="draft">Draft (Unpublished)</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>

              {/* CRITICAL: Configurable Certificate Policy Section */}
              <div
                style={{
                  backgroundColor: formCertEnabled ? "rgba(52, 199, 89, 0.06)" : "var(--color-surface-muted)",
                  border: formCertEnabled ? "1px solid rgba(52, 199, 89, 0.3)" : "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "var(--space-3)",
                  marginBottom: "var(--space-4)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <input
                    type="checkbox"
                    id="formCertEnabled"
                    checked={formCertEnabled}
                    disabled={!canTeacherConfigureCert}
                    onChange={(e) => setFormCertEnabled(e.target.checked)}
                    style={{ width: "16px", height: "16px", accentColor: "#34C759", cursor: "pointer" }}
                  />
                  <label htmlFor="formCertEnabled" style={{ fontSize: "var(--text-xs)", fontWeight: 700, cursor: "pointer" }}>
                    Enable Certificate Issuance Policy for this Assessment
                  </label>
                </div>

                {!canTeacherConfigureCert && (
                  <div style={{ fontSize: "10px", color: "#FF9500", marginBottom: "6px" }}>
                    ⚠️ Note: Certificate policy configuration has been restricted by the Academy Administrator.
                  </div>
                )}

                {formCertEnabled && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)", marginTop: "var(--space-2)" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 600, marginBottom: "4px" }}>
                        Minimum Qualifying Percentage (%):
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        required={formCertEnabled}
                        value={formCertMinPercentage}
                        onChange={(e) => setFormCertMinPercentage(parseInt(e.target.value) || 0)}
                        style={{ width: "100%", padding: "5px 8px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "var(--text-xs)" }}
                      />
                      <span style={{ fontSize: "10px", color: "var(--color-neutral-dark)" }}>
                        e.g. 75% for merit, 80% for board preparation distinction.
                      </span>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 600, marginBottom: "4px" }}>
                        Certificate Title / Honor:
                      </label>
                      <input
                        type="text"
                        value={formCertTitle}
                        onChange={(e) => setFormCertTitle(e.target.value)}
                        placeholder="e.g. Certificate of Academic Distinction"
                        style={{ width: "100%", padding: "5px 8px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "var(--text-xs)" }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)" }}>
                <Button type="button" variant="secondary" size="sm" onClick={() => setIsAssessmentModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  {editingAssessmentId ? "Save Changes" : "Create Assessment"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: RECORD / EDIT STUDENT MARKS                                  */}
      {/* ==================================================================== */}
      {isRecordModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsRecordModalOpen(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "var(--space-4)",
          }}
        >
          <Card padding="lg" style={{ maxWidth: "480px", width: "100%" }}>
            <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, marginBottom: "var(--space-2)" }}>
              Record Assessment Marks
            </h3>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", marginBottom: "var(--space-4)" }}>
              Enter student score and diagnostic feedback. Percentages and certificate eligibility will update automatically.
            </p>

            {recordError && (
              <div style={{ backgroundColor: "rgba(255, 59, 48, 0.1)", border: "1px solid rgba(255, 59, 48, 0.3)", borderRadius: "var(--radius-sm)", padding: "8px 12px", fontSize: "11px", color: "#FF3B30", marginBottom: "var(--space-3)" }}>
                {recordError}
              </div>
            )}

            <form onSubmit={handleSaveMarks}>
              <div style={{ marginBottom: "var(--space-3)" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, marginBottom: "4px" }}>Target Assessment:</label>
                <select
                  value={recordExamId}
                  onChange={(e) => setRecordExamId(e.target.value)}
                  style={{ width: "100%", padding: "6px 8px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "var(--text-xs)" }}
                >
                  {visibleAssessments.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.title} ({ex.subject} &bull; Max {ex.totalMarks})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "var(--space-3)" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, marginBottom: "4px" }}>Student:</label>
                <select
                  value={recordStudentId}
                  onChange={(e) => setRecordStudentId(e.target.value)}
                  style={{ width: "100%", padding: "6px 8px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "var(--text-xs)" }}
                >
                  {teacherStudents.map((std) => (
                    <option key={std.id} value={std.id}>
                      {std.name} ({std.classGrade} &bull; {std.board})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)", marginBottom: "var(--space-3)" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, marginBottom: "4px" }}>Marks Obtained *</label>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    required
                    value={recordMarksInput}
                    onChange={(e) => setRecordMarksInput(e.target.value)}
                    style={{ width: "100%", padding: "6px 8px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "var(--text-xs)" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, marginBottom: "4px" }}>Evaluation State</label>
                  <select
                    value={recordStatusInput}
                    onChange={(e) => setRecordStatusInput(e.target.value as "evaluated" | "absent" | "pending")}
                    style={{ width: "100%", padding: "6px 8px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "var(--text-xs)" }}
                  >
                    <option value="evaluated">Evaluated</option>
                    <option value="absent">Absent</option>
                    <option value="pending">Pending Review</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: "var(--space-4)" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, marginBottom: "4px" }}>Teacher Diagnostic Feedback</label>
                <input
                  type="text"
                  value={recordFeedbackInput}
                  onChange={(e) => setRecordFeedbackInput(e.target.value)}
                  placeholder="e.g. Excellent conceptual rigor; practice numerical calculations"
                  style={{ width: "100%", padding: "6px 8px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "var(--text-xs)" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)" }}>
                <Button type="button" variant="secondary" size="sm" onClick={() => setIsRecordModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Save Marks Entry
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 3: CONFIRM CERTIFICATE ISSUANCE                                 */}
      {/* ==================================================================== */}
      {isConfirmIssueOpen && pendingIssueCandidate && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsConfirmIssueOpen(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "var(--space-4)",
          }}
        >
          <Card padding="lg" style={{ maxWidth: "480px", width: "100%" }}>
            <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, marginBottom: "var(--space-2)", color: "#007AFF" }}>
              🎓 Confirm Official Certificate Issuance
            </h3>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", lineHeight: 1.5, marginBottom: "var(--space-3)" }}>
              You are about to issue an official academic achievement certificate in accordance with this assessment&apos;s verified policy.
            </p>

            <div style={{ backgroundColor: "var(--color-surface-muted)", padding: "12px", borderRadius: "var(--radius-md)", fontSize: "var(--text-xs)", marginBottom: "var(--space-4)", display: "flex", flexDirection: "column", gap: "6px" }}>
              <div>Candidate: <strong>{pendingIssueCandidate.student.name}</strong> ({pendingIssueCandidate.student.classGrade})</div>
              <div>Assessment: <strong>{pendingIssueCandidate.assessment.title}</strong></div>
              <div>Score: <strong>{pendingIssueCandidate.marksObtained} / {pendingIssueCandidate.totalMarks} ({pendingIssueCandidate.percentage}%)</strong></div>
              <div>Policy Threshold: <strong style={{ color: "var(--color-success)" }}>≥ {pendingIssueCandidate.assessment.certificatePolicy?.minPercentage}%</strong></div>
              <div>Certificate Title: <strong>{pendingIssueCandidate.assessment.certificatePolicy?.certificateTitle || "Certificate of Academic Distinction"}</strong></div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)" }}>
              <Button variant="secondary" size="sm" onClick={() => setIsConfirmIssueOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleConfirmIssueCertificate}>
                Confirm &amp; Issue Certificate
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 4: CONFIRM CERTIFICATE REVOCATION                               */}
      {/* ==================================================================== */}
      {isConfirmRevokeOpen && pendingRevokeCert && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsConfirmRevokeOpen(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "var(--space-4)",
          }}
        >
          <Card padding="lg" style={{ maxWidth: "480px", width: "100%" }}>
            <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, marginBottom: "var(--space-2)", color: "#FF3B30" }}>
              Revoke Issued Certificate?
            </h3>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", lineHeight: 1.5, marginBottom: "var(--space-3)" }}>
              Are you sure you wish to revoke certificate <strong>{pendingRevokeCert.certificateNumber}</strong> for <strong>{pendingRevokeCert.studentName}</strong>?
              The certificate will be recorded as Revoked in the ledger.
            </p>

            <div style={{ marginBottom: "var(--space-4)" }}>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 600, marginBottom: "4px" }}>
                Revocation Reason / Administrative Justification:
              </label>
              <input
                type="text"
                value={revokeReasonInput}
                onChange={(e) => setRevokeReasonInput(e.target.value)}
                style={{ width: "100%", padding: "6px 8px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "var(--text-xs)" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)" }}>
              <Button variant="secondary" size="sm" onClick={() => setIsConfirmRevokeOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" style={{ backgroundColor: "#FF3B30", border: "none" }} onClick={handleConfirmRevoke}>
                Confirm Revocation
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 5: TEACHER QUESTION BANK & MOCK EXAM AUTHORING                 */}
      {/* ==================================================================== */}
      {isAuthorModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAuthorModalOpen(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "var(--space-4)",
          }}
        >
          <Card padding="lg" style={{ maxWidth: "680px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-3)" }}>
              <div>
                <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, margin: 0 }}>
                  {authoringExamId ? "Edit Mock Examination & MCQ Bank" : "Create New Online Mock Examination"}
                </h3>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", margin: "2px 0 0" }}>
                  Configure syllabus parameters, duration, questions, deterministic answer key, and explanations.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAuthorModalOpen(false)}
                style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "var(--color-neutral-dark)" }}
              >
                ✕
              </button>
            </div>

            {authorError && (
              <div style={{ backgroundColor: "rgba(255, 59, 48, 0.1)", border: "1px solid rgba(255, 59, 48, 0.3)", borderRadius: "var(--radius-sm)", padding: "8px 12px", fontSize: "11px", color: "#FF3B30", marginBottom: "var(--space-3)" }}>
                {authorError}
              </div>
            )}

            <form onSubmit={handleSaveAuthorExam}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)", marginBottom: "var(--space-3)" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, marginBottom: "4px" }}>Exam Title *</label>
                  <input
                    type="text"
                    required
                    value={authorTitle}
                    onChange={(e) => setAuthorTitle(e.target.value)}
                    placeholder="e.g. Class X Mathematics Speed Mock Trial"
                    style={{ width: "100%", padding: "6px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "var(--text-xs)" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, marginBottom: "4px" }}>Subject</label>
                  <select
                    value={authorSubject}
                    onChange={(e) => setAuthorSubject(e.target.value)}
                    style={{ width: "100%", padding: "6px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "var(--text-xs)" }}
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Accountancy">Accountancy</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, marginBottom: "4px" }}>Class Grade</label>
                  <select
                    value={authorClassGrade}
                    onChange={(e) => setAuthorClassGrade(e.target.value)}
                    style={{ width: "100%", padding: "6px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "var(--text-xs)" }}
                  >
                    <option value="Class X">Class X</option>
                    <option value="Class XII">Class XII</option>
                    <option value="Class IX">Class IX</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, marginBottom: "4px" }}>Duration (Minutes) *</label>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    required
                    value={authorDuration}
                    onChange={(e) => setAuthorDuration(parseInt(e.target.value) || 1)}
                    style={{ width: "100%", padding: "6px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "var(--text-xs)" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, marginBottom: "4px" }}>Passing Marks (Optional)</label>
                  <input
                    type="number"
                    min={0}
                    value={authorPassingMarks}
                    onChange={(e) => setAuthorPassingMarks(e.target.value)}
                    placeholder="Leave blank if diagnostic"
                    style={{ width: "100%", padding: "6px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "var(--text-xs)" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--color-border)", paddingTop: "var(--space-3)", marginBottom: "var(--space-3)" }}>
                <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, textTransform: "uppercase" }}>
                  Questions ({authorQuestions.length}) &bull; Total Marks: {authorQuestions.reduce((a, b) => a + b.marks, 0)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthorQuestions((prev) => [
                      ...prev,
                      {
                        id: `q-custom-${Date.now()}-${prev.length + 1}`,
                        questionNumber: prev.length + 1,
                        questionText: "",
                        options: ["Option A", "Option B", "Option C", "Option D"],
                        correctOptionIndex: 0,
                        marks: 4,
                        explanation: "",
                      },
                    ]);
                  }}
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "var(--color-accent)",
                    background: "none",
                    border: "1px solid rgba(0, 122, 255, 0.3)",
                    padding: "4px 8px",
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
                  }}
                >
                  + Add Question
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", marginBottom: "var(--space-4)" }}>
                {authorQuestions.map((q, qIndex) => (
                  <div
                    key={q.id}
                    style={{
                      backgroundColor: "var(--color-surface-muted)",
                      padding: "12px",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontSize: "var(--text-xs)", fontWeight: 700 }}>
                        Question {qIndex + 1}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <label style={{ fontSize: "11px", color: "var(--color-neutral-dark)" }}>Marks:</label>
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={q.marks}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            setAuthorQuestions((prev) =>
                              prev.map((item, idx) => (idx === qIndex ? { ...item, marks: val } : item))
                            );
                          }}
                          style={{ width: "50px", padding: "2px 6px", fontSize: "11px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}
                        />
                        {authorQuestions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setAuthorQuestions((prev) => prev.filter((_, idx) => idx !== qIndex));
                            }}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#FF3B30",
                              fontSize: "11px",
                              cursor: "pointer",
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>

                    <textarea
                      rows={2}
                      value={q.questionText}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAuthorQuestions((prev) =>
                          prev.map((item, idx) => (idx === qIndex ? { ...item, questionText: val } : item))
                        );
                      }}
                      placeholder="Enter question statement..."
                      style={{
                        width: "100%",
                        padding: "6px 8px",
                        fontSize: "var(--text-xs)",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--color-border)",
                        marginBottom: "8px",
                        fontFamily: "inherit",
                      }}
                    />

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "8px" }}>
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <input
                            type="radio"
                            name={`correct-${q.id}`}
                            checked={q.correctOptionIndex === optIdx}
                            onChange={() => {
                              setAuthorQuestions((prev) =>
                                prev.map((item, idx) => (idx === qIndex ? { ...item, correctOptionIndex: optIdx } : item))
                              );
                            }}
                            title="Mark as correct answer"
                            style={{ accentColor: "#34C759" }}
                          />
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAuthorQuestions((prev) =>
                                prev.map((item, idx) => {
                                  if (idx !== qIndex) return item;
                                  const updatedOpts = [...item.options];
                                  updatedOpts[optIdx] = val;
                                  return { ...item, options: updatedOpts };
                                })
                              );
                            }}
                            placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                            style={{
                              flex: 1,
                              padding: "4px 8px",
                              fontSize: "11px",
                              borderRadius: "var(--radius-sm)",
                              border: q.correctOptionIndex === optIdx ? "1px solid #34C759" : "1px solid var(--color-border)",
                              backgroundColor: q.correctOptionIndex === optIdx ? "rgba(52, 199, 89, 0.08)" : "#FFFFFF",
                            }}
                          />
                        </div>
                      ))}
                    </div>

                    <input
                      type="text"
                      value={q.explanation || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAuthorQuestions((prev) =>
                          prev.map((item, idx) => (idx === qIndex ? { ...item, explanation: val } : item))
                        );
                      }}
                      placeholder="Diagnostic solution / explanation..."
                      style={{
                        width: "100%",
                        padding: "4px 8px",
                        fontSize: "11px",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--color-border)",
                      }}
                    />
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)" }}>
                <Button type="button" variant="secondary" size="sm" onClick={() => setIsAuthorModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  {authoringExamId ? "Update Exam" : "Publish Mock Exam"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 6: PRINTABLE CERTIFICATE VIEW                                   */}
      {/* ==================================================================== */}
      {activeCertificate && (
        <ExamCertificateModal
          isOpen={Boolean(activeCertificate)}
          onClose={() => setActiveCertificate(null)}
          certificate={activeCertificate}
          isIssued={activeCertIsIssued}
        />
      )}
    </div>
  );
}
