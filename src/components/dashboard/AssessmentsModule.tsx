"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  UserRole,
  AssessmentRecord,
  MockExam,
  MockExamQuestion,
  ExamAttemptResult,
  AcademicCertificateData,
} from "@/types";
import { SAMPLE_ASSESSMENTS } from "@/data/dashboardModulesData";
import { SAMPLE_MOCK_EXAMS, SAMPLE_EXAM_RESULTS } from "@/data/mockExamData";
import { SAMPLE_STUDENTS, SAMPLE_TEACHERS } from "@/data/enrollmentFeeData";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ExamCertificateModal } from "./ExamCertificateModal";
import { useDemoStorage, DEMO_STORAGE_KEYS } from "@/lib/demoStorage";

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
  // Main module sub-tab:
  // "results" = Academic Results & Certified Diplomas
  // "mock-exams" = Online Mock Examination Engine
  // "gradebook" = Class Test Evaluation Ledger
  const [activeSubTab, setActiveSubTab] = useState<"results" | "mock-exams" | "gradebook">("results");

  // State for offline class tests and online mock examinations (persisted in session)
  const [assessments, setAssessments] = useDemoStorage<AssessmentRecord[]>(
    DEMO_STORAGE_KEYS.ASSESSMENTS,
    SAMPLE_ASSESSMENTS
  );
  const [mockExams, setMockExams] = useDemoStorage<MockExam[]>(
    DEMO_STORAGE_KEYS.MOCK_EXAMS,
    SAMPLE_MOCK_EXAMS
  );
  const [examResults, setExamResults] = useDemoStorage<ExamAttemptResult[]>(
    DEMO_STORAGE_KEYS.EXAM_RESULTS,
    SAMPLE_EXAM_RESULTS
  );

  // Filter & Search
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Inspected student for results tab (Teacher & Admin can switch students; Student/Parent is locked)
  const [inspectedStudentId, setInspectedStudentId] = useState<string>(currentStudentId);

  // Certificate modal state
  const [activeCertificate, setActiveCertificate] = useState<AcademicCertificateData | null>(null);

  // Exam Workflow State (Taking Live Exam / Results)
  const [examViewState, setExamViewState] = useState<"list" | "instructions" | "taking" | "result">("list");
  const [selectedExam, setSelectedExam] = useState<MockExam | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number | null>>({});
  const [reviewFlags, setReviewFlags] = useState<Record<string, boolean>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [activeResult, setActiveResult] = useState<ExamAttemptResult | null>(null);

  // Modal dialog states
  const [isConfirmStartOpen, setIsConfirmStartOpen] = useState<boolean>(false);
  const [isConfirmSubmitOpen, setIsConfirmSubmitOpen] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Teacher Assessment Authoring Modal State
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

  // Offline class test marks recording modal state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedOfflineExamId, setSelectedOfflineExamId] = useState(assessments[0]?.id || "exam-1");
  const [studentIdInput, setStudentIdInput] = useState(SAMPLE_STUDENTS[0].id);
  const [marksInput, setMarksInput] = useState<string>("70");
  const [feedbackInput, setFeedbackInput] = useState("");

  // Guard against duplicate submission and reference for timer
  const isSubmittedRef = useRef<boolean>(false);
  const examStartTimeRef = useRef<number>(0);

  // Escape key handler for open modals
  useEffect(() => {
    if (!isAuthorModalOpen && !isRecordModalOpen && !isConfirmStartOpen && !isConfirmSubmitOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsAuthorModalOpen(false);
        setIsRecordModalOpen(false);
        setIsConfirmStartOpen(false);
        setIsConfirmSubmitOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAuthorModalOpen, isRecordModalOpen, isConfirmStartOpen, isConfirmSubmitOpen]);

  // Determine active target student
  const targetStudentId = useMemo(() => {
    if (role === "student" || role === "parent") {
      return currentStudentId;
    }
    return inspectedStudentId;
  }, [role, currentStudentId, inspectedStudentId]);

  const targetStudent = useMemo(() => {
    return SAMPLE_STUDENTS.find((s) => s.id === targetStudentId) || SAMPLE_STUDENTS[0];
  }, [targetStudentId]);

  // Role-isolated mock examinations list
  const visibleMockExams = useMemo(() => {
    return mockExams.filter((exam) => {
      if (role === "teacher") {
        if (exam.teacherId !== currentTeacherId) return false;
      } else if (role === "student" || role === "parent") {
        if (exam.classGrade !== targetStudent.classGrade) return false;
      }

      if (filterSubject !== "all" && exam.subject !== filterSubject) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = exam.title.toLowerCase().includes(q);
        const matchesSubject = exam.subject.toLowerCase().includes(q);
        const matchesBatch = exam.batchName.toLowerCase().includes(q);
        if (!matchesTitle && !matchesSubject && !matchesBatch) return false;
      }

      return true;
    });
  }, [mockExams, role, currentTeacherId, targetStudent, filterSubject, searchQuery]);

  // Offline class tests list
  const visibleOfflineAssessments = useMemo(() => {
    return assessments.filter((exam) => {
      if (role === "teacher" && exam.teacherId !== currentTeacherId) return false;
      if (filterSubject !== "all" && exam.subject !== filterSubject) return false;
      return true;
    });
  }, [assessments, role, currentTeacherId, filterSubject]);

  // --------------------------------------------------------------------------
  // ACADEMIC RESULTS CALCULATION (Deterministic, never invented)
  // --------------------------------------------------------------------------
  const studentAcademicRecords = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      subject: string;
      type: "Class Test" | "Online Mock Exam";
      date: string;
      marksObtained: number;
      totalMarks: number;
      percentage: number;
      status: "Distinction (≥75%)" | "Evaluated" | "Passed" | "Needs Improvement";
      feedback?: string;
      facultyName: string;
      isCertificateEligible: boolean;
      eligibilityReason: string;
    }> = [];

    // 1. Process evaluated physical class tests for target student
    assessments.forEach((exam) => {
      if (role === "teacher" && exam.teacherId !== currentTeacherId) return;
      if (filterSubject !== "all" && exam.subject !== filterSubject) return;

      const scoreEntry = exam.studentScores.find((sc) => sc.studentId === targetStudent.id);
      if (scoreEntry && scoreEntry.status === "evaluated") {
        const pct = Math.round((scoreEntry.marksObtained / exam.totalMarks) * 100);
        const isDistinction = pct >= 75;

        list.push({
          id: `ct-${exam.id}`,
          title: exam.title,
          subject: exam.subject,
          type: "Class Test",
          date: exam.date,
          marksObtained: scoreEntry.marksObtained,
          totalMarks: exam.totalMarks,
          percentage: pct,
          status: isDistinction ? "Distinction (≥75%)" : "Evaluated",
          feedback: scoreEntry.feedback,
          facultyName: exam.teacherId === "tch-alvi" ? "Dr. Tariq Alvi" : "Azhar Sir",
          isCertificateEligible: isDistinction,
          eligibilityReason: isDistinction
            ? `Achieved ${pct}% (Distinction criteria: ≥ 75%)`
            : `Score of ${pct}% is below the 75% merit certificate threshold`,
        });
      }
    });

    // 2. Process submitted online mock examinations for target student
    examResults.forEach((result) => {
      if (result.studentId !== targetStudent.id) return;
      const examDef = mockExams.find((e) => e.id === result.examId);
      if (!examDef) return;
      if (role === "teacher" && examDef.teacherId !== currentTeacherId) return;
      if (filterSubject !== "all" && examDef.subject !== filterSubject) return;

      const isDistinction = result.percentage >= 75;

      list.push({
        id: `mock-${result.examId}`,
        title: examDef.title,
        subject: examDef.subject,
        type: "Online Mock Exam",
        date: result.submittedAt.includes("2026") ? result.submittedAt.split(" ")[0] : "2026-10-08",
        marksObtained: result.scoreObtained,
        totalMarks: result.totalMarks,
        percentage: result.percentage,
        status: isDistinction ? "Distinction (≥75%)" : result.isPassed !== false ? "Passed" : "Needs Improvement",
        feedback: "Automated deterministic evaluation from online mock engine.",
        facultyName: examDef.teacherName,
        isCertificateEligible: isDistinction && result.isPassed !== false,
        eligibilityReason: isDistinction
          ? `Passed with ${result.percentage}% (Merit criteria: ≥ 75%)`
          : `Score of ${result.percentage}% is below the 75% merit certificate threshold`,
      });
    });

    return list;
  }, [assessments, examResults, mockExams, targetStudent, role, currentTeacherId, filterSubject]);

  // Aggregate statistics derived strictly from actual available records
  const academicSummary = useMemo(() => {
    const totalAttempted = studentAcademicRecords.length;
    if (totalAttempted === 0) {
      return {
        totalAttempted: 0,
        cumulativeObtained: 0,
        cumulativeMax: 0,
        cumulativePercentage: 0,
        subjectBreakdown: {},
        eligibleCertificatesCount: 0,
      };
    }

    const cumulativeObtained = studentAcademicRecords.reduce((acc, r) => acc + r.marksObtained, 0);
    const cumulativeMax = studentAcademicRecords.reduce((acc, r) => acc + r.totalMarks, 0);
    const cumulativePercentage = cumulativeMax > 0 ? Math.round((cumulativeObtained / cumulativeMax) * 100) : 0;
    const eligibleCertificatesCount = studentAcademicRecords.filter((r) => r.isCertificateEligible).length;

    // Subject breakdown
    const subjectBreakdown: Record<string, { obtained: number; max: number; count: number; pct: number }> = {};
    studentAcademicRecords.forEach((r) => {
      if (!subjectBreakdown[r.subject]) {
        subjectBreakdown[r.subject] = { obtained: 0, max: 0, count: 0, pct: 0 };
      }
      subjectBreakdown[r.subject].obtained += r.marksObtained;
      subjectBreakdown[r.subject].max += r.totalMarks;
      subjectBreakdown[r.subject].count += 1;
    });

    Object.keys(subjectBreakdown).forEach((subj) => {
      const item = subjectBreakdown[subj];
      item.pct = item.max > 0 ? Math.round((item.obtained / item.max) * 100) : 0;
    });

    return {
      totalAttempted,
      cumulativeObtained,
      cumulativeMax,
      cumulativePercentage,
      subjectBreakdown,
      eligibleCertificatesCount,
    };
  }, [studentAcademicRecords]);

  // Generate verified certificate data for a specific eligible record
  const handleOpenCertificate = (record: (typeof studentAcademicRecords)[0]) => {
    const certNumber = `AA-2026-MERIT-${record.subject.slice(0, 3).toUpperCase()}-${targetStudent.id.replace("std-", "")}`;
    const cert: AcademicCertificateData = {
      id: `cert-${record.id}`,
      certificateNumber: certNumber,
      certificateType: "merit",
      title: "Certificate of Academic Merit",
      studentId: targetStudent.id,
      studentName: targetStudent.name,
      classGrade: targetStudent.classGrade,
      board: targetStudent.board,
      subject: record.subject,
      assessmentName: record.title,
      assessmentDate: record.date,
      scoreObtained: record.marksObtained,
      totalMarks: record.totalMarks,
      percentage: record.percentage,
      criteriaMet: record.eligibilityReason,
      issuedDate: new Date().toISOString().split("T")[0],
      facultyName: record.facultyName,
    };
    setActiveCertificate(cert);
  };

  // Deterministic scoring calculation for live mock engine
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
        studentId: targetStudent.id,
        studentName: targetStudent.name,
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

  // Final submission handler for live mock engine
  const handleFinalSubmit = useCallback(
    (submissionType: "manual" | "timeout") => {
      if (isSubmittedRef.current || !selectedExam) return;
      isSubmittedRef.current = true;

      const result = calculateResult(selectedExam, userAnswers, submissionType);

      setExamResults((prev) => [result, ...prev.filter((r) => r.examId !== selectedExam.id)]);
      setActiveResult(result);
      setIsConfirmSubmitOpen(false);
      setExamViewState("result");

      setActionNotice(
        submissionType === "timeout"
          ? "Exam timer reached 00:00. Responses automatically submitted."
          : "Exam submitted successfully! Scorecard generated."
      );
      setTimeout(() => setActionNotice(null), 5000);
    },
    [selectedExam, userAnswers, calculateResult, setExamResults]
  );

  // Countdown timer effect
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

  // Start exam workflow
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

  const handleSelectOption = (optionIndex: number) => {
    if (!selectedExam) return;
    const currentQ = selectedExam.questions[currentQuestionIndex];
    if (!currentQ) return;

    setUserAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optionIndex,
    }));
  };

  const handleClearAnswer = () => {
    if (!selectedExam) return;
    const currentQ = selectedExam.questions[currentQuestionIndex];
    if (!currentQ) return;

    setUserAnswers((prev) => ({
      ...prev,
      [currentQ.id]: null,
    }));
  };

  const handleToggleReviewFlag = () => {
    if (!selectedExam) return;
    const currentQ = selectedExam.questions[currentQuestionIndex];
    if (!currentQ) return;

    setReviewFlags((prev) => ({
      ...prev,
      [currentQ.id]: !prev[currentQ.id],
    }));
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
      setAuthorSubject("Mathematics");
      setAuthorClassGrade("Class X");
      setAuthorBatchName("Batch Alpha (Class IX-X)");
      setAuthorDuration(20);
      setAuthorPassingMarks("8");
      setAuthorQuestions([
        {
          id: `q-new-${Date.now()}-1`,
          questionNumber: 1,
          questionText: "Sample Question: What is the discriminant formula for ax² + bx + c = 0?",
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
    for (let i = 0; i < authorQuestions.length; i++) {
      const q = authorQuestions[i];
      if (!q.questionText.trim()) {
        setAuthorError(`Question ${i + 1} text is required.`);
        return;
      }
      if (q.options.some((opt) => !opt.trim())) {
        setAuthorError(`Question ${i + 1} has blank options. All options must be filled.`);
        return;
      }
    }

    const calculatedTotalMarks = authorQuestions.reduce((acc, q) => acc + q.marks, 0);
    const parsedPassing = authorPassingMarks.trim() !== "" ? parseFloat(authorPassingMarks) : undefined;
    const teacher = SAMPLE_TEACHERS.find((t) => t.id === currentTeacherId) || SAMPLE_TEACHERS[0];

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
        `Complete all ${authorQuestions.length} questions before the ${authorDuration}-minute timer elapses.`,
        "Answers evaluated deterministically.",
      ],
      questions: authorQuestions.map((q, idx) => ({ ...q, questionNumber: idx + 1 })),
      status: "published",
    };

    if (authoringExamId) {
      setMockExams((prev) => prev.map((ex) => (ex.id === authoringExamId ? examData : ex)));
      setActionNotice(`Updated exam "${examData.title}". (Local demo state)`);
    } else {
      setMockExams((prev) => [examData, ...prev]);
      setActionNotice(`Created new mock exam "${examData.title}". (Local demo state)`);
    }

    setIsAuthorModalOpen(false);
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Offline Marks Recording
  const handleRecordOfflineMarks = (e: React.FormEvent) => {
    e.preventDefault();
    const student = SAMPLE_STUDENTS.find((s) => s.id === studentIdInput);
    if (!student) return;

    const parsedMarks = parseFloat(marksInput);
    if (isNaN(parsedMarks)) return;

    setAssessments((prev) =>
      prev.map((exam) => {
        if (exam.id === selectedOfflineExamId) {
          const updatedScores = exam.studentScores.filter((sc) => sc.studentId !== studentIdInput);
          updatedScores.push({
            studentId: studentIdInput,
            studentName: student.name,
            marksObtained: parsedMarks,
            status: "evaluated",
            feedback: feedbackInput.trim() || undefined,
          });
          return { ...exam, studentScores: updatedScores };
        }
        return exam;
      })
    );

    setIsRecordModalOpen(false);
    setFeedbackInput("");
    setActionNotice(`Recorded score of ${parsedMarks} for ${student.name} in evaluation ledger.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  // --------------------------------------------------------------------------
  // LIVE EXAM TAKING VIEWS (Instructions / Taking / Result)
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
              ← Back to Exams
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
              Official Instructions &amp; Navigation Protocol:
            </h3>
            <ul style={{ fontSize: "var(--text-xs)", lineHeight: 1.8, paddingLeft: "18px", color: "var(--color-primary)" }}>
              {selectedExam.instructions.map((inst, i) => (
                <li key={i}>{inst}</li>
              ))}
              <li><strong>Question Palette:</strong> The palette grid shows whether each question is answered (green), marked for review (purple), or unanswered (gray).</li>
              <li><strong>Answer Retention:</strong> Your chosen option is safely saved as you move between questions. You can alter or clear selections at any time prior to submission.</li>
              <li><strong>Automatic Timeout:</strong> When the countdown timer reaches 00:00, your exam will be automatically locked and submitted.</li>
            </ul>
          </div>

          <div
            style={{
              padding: "10px 14px",
              backgroundColor: "rgba(0, 122, 255, 0.06)",
              border: "1px dashed rgba(0, 122, 255, 0.3)",
              borderRadius: "var(--radius-md)",
              fontSize: "var(--text-xs)",
              color: "var(--color-neutral-dark)",
              marginBottom: "var(--space-6)",
            }}
          >
            <strong>Frontend Demo Environment:</strong> Exam attempts are evaluated locally in your browser session using deterministic typed answer keys. No telemetry or exam data is transmitted to an external server.
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)" }}>
            <Button variant="secondary" onClick={() => setExamViewState("list")}>
              Return to Catalog
            </Button>
            <Button variant="primary" onClick={() => setIsConfirmStartOpen(true)}>
              Start Exam Now →
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
                Commence Examination?
              </h3>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", lineHeight: 1.5, marginBottom: "var(--space-4)" }}>
                The <strong>{selectedExam.durationMinutes}-minute</strong> countdown timer will start immediately upon confirmation. Ensure you are ready before proceeding.
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
        <div
          style={{
            backgroundColor: "#1D1D1F",
            color: "#FFFFFF",
            borderRadius: "var(--radius-lg)",
            padding: "var(--space-3) var(--space-4)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "var(--space-3)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: "var(--text-base)" }}>
              {selectedExam.title}
            </div>
            <div style={{ fontSize: "11px", color: "var(--color-neutral)" }}>
              {selectedExam.subject} &bull; {selectedExam.batchName} &bull; Candidate: {targetStudent.name}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-sm)",
                fontWeight: 700,
                backgroundColor: isTimerCritical ? "#FF3B30" : "rgba(255, 255, 255, 0.15)",
                color: "#FFFFFF",
                padding: "6px 14px",
                borderRadius: "var(--radius-full)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
              title="Time remaining until automatic submission"
            >
              <span>⏱️</span>
              <span>{formatTimer(timeRemaining)}</span>
            </div>

            <div style={{ fontSize: "11px", color: "var(--color-neutral)", display: "flex", gap: "8px" }}>
              <span>✓ Answered: <strong>{answeredCount}</strong></span>
              <span>• Unanswered: <strong>{unansweredCount}</strong></span>
              <span>• Marked: <strong>{markedCount}</strong></span>
            </div>

            <button
              type="button"
              onClick={() => setIsConfirmSubmitOpen(true)}
              style={{
                backgroundColor: "#34C759",
                color: "#FFFFFF",
                border: "none",
                padding: "6px 14px",
                borderRadius: "var(--radius-md)",
                fontSize: "var(--text-xs)",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Submit Exam
            </button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 320px)",
            gap: "var(--space-4)",
          }}
          className="live-exam-grid"
        >
          {currentQ && (
            <Card padding="lg" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "440px" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)", borderBottom: "1px solid var(--color-border)", paddingBottom: "var(--space-3)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-primary)" }}>
                      Question {currentQuestionIndex + 1} of {totalQCount}
                    </span>
                    <Badge variant="accent" size="sm">
                      {currentQ.marks} Marks
                    </Badge>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {isCurrentMarked && (
                      <Badge variant="warning" size="sm">
                        Marked for Review
                      </Badge>
                    )}
                    <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)" }}>
                      {selectedOptionIndex !== null && selectedOptionIndex !== undefined ? "✓ Answer Saved" : "Not Answered"}
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-primary)", lineHeight: 1.6, marginBottom: "var(--space-6)" }}>
                  {currentQ.questionText}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }} role="radiogroup" aria-label={`Question ${currentQuestionIndex + 1} options`}>
                  {currentQ.options.map((optionText, optIdx) => {
                    const isSelected = selectedOptionIndex === optIdx;
                    const optionLetter = String.fromCharCode(65 + optIdx);

                    return (
                      <label
                        key={optIdx}
                        onClick={() => handleSelectOption(optIdx)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "var(--space-3)",
                          padding: "12px 16px",
                          borderRadius: "var(--radius-md)",
                          border: isSelected ? "2px solid #007AFF" : "1px solid var(--color-border)",
                          backgroundColor: isSelected ? "rgba(0, 122, 255, 0.05)" : "var(--color-surface)",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <input
                          type="radio"
                          name={`q-${currentQ.id}`}
                          checked={isSelected}
                          onChange={() => handleSelectOption(optIdx)}
                          style={{ width: "16px", height: "16px", accentColor: "#007AFF", cursor: "pointer" }}
                        />
                        <div
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "var(--radius-full)",
                            backgroundColor: isSelected ? "#007AFF" : "var(--color-surface-muted)",
                            color: isSelected ? "#FFFFFF" : "var(--color-primary)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "12px",
                            fontWeight: 700,
                          }}
                        >
                          {optionLetter}
                        </div>
                        <span style={{ fontSize: "var(--text-sm)", color: "var(--color-primary)", fontWeight: isSelected ? 600 : 400 }}>
                          {optionText}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "var(--space-6)",
                  borderTop: "1px solid var(--color-border)",
                  paddingTop: "var(--space-4)",
                  flexWrap: "wrap",
                  gap: "var(--space-2)",
                }}
              >
                <div style={{ display: "flex", gap: "var(--space-2)" }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                  >
                    ← Previous
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleToggleReviewFlag}
                  >
                    {isCurrentMarked ? "Unmark Review" : "Mark for Review"}
                  </Button>

                  {selectedOptionIndex !== null && selectedOptionIndex !== undefined && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleClearAnswer}
                      style={{ color: "#FF3B30" }}
                    >
                      Clear Answer
                    </Button>
                  )}
                </div>

                <div style={{ display: "flex", gap: "var(--space-2)" }}>
                  {currentQuestionIndex < totalQCount - 1 ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setCurrentQuestionIndex((prev) => Math.min(totalQCount - 1, prev + 1))}
                    >
                      Next Question →
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setIsConfirmSubmitOpen(true)}
                    >
                      Review &amp; Submit Exam →
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )}

          <Card padding="md">
            <h4 style={{ fontSize: "var(--text-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "var(--space-3)" }}>
              Question Palette
            </h4>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: "8px",
                marginBottom: "var(--space-4)",
              }}
            >
              {selectedExam.questions.map((q, idx) => {
                const isAns = userAnswers[q.id] !== null && userAnswers[q.id] !== undefined;
                const isMarked = reviewFlags[q.id];
                const isCurrent = currentQuestionIndex === idx;

                let bg = "var(--color-surface-muted)";
                let color = "var(--color-primary)";
                let border = "1px solid var(--color-border)";

                if (isMarked) {
                  bg = "#AF52DE";
                  color = "#FFFFFF";
                  border = "1px solid #AF52DE";
                } else if (isAns) {
                  bg = "#34C759";
                  color = "#FFFFFF";
                  border = "1px solid #34C759";
                }

                if (isCurrent) {
                  border = "2px solid #007AFF";
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentQuestionIndex(idx)}
                    style={{
                      height: "38px",
                      borderRadius: "var(--radius-sm)",
                      backgroundColor: bg,
                      color,
                      border,
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      position: "relative",
                      outline: isCurrent ? "2px solid #007AFF" : "none",
                      outlineOffset: "2px",
                    }}
                    title={`Go to Question ${idx + 1}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "var(--space-3)", fontSize: "11px", color: "var(--color-neutral-dark)", display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "12px", height: "12px", borderRadius: "2px", backgroundColor: "#34C759", display: "inline-block" }} />
                <span>Answered ({answeredCount})</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "12px", height: "12px", borderRadius: "2px", backgroundColor: "#AF52DE", display: "inline-block" }} />
                <span>Marked for Review ({markedCount})</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "12px", height: "12px", borderRadius: "2px", backgroundColor: "var(--color-surface-muted)", border: "1px solid var(--color-border)", display: "inline-block" }} />
                <span>Unanswered ({unansweredCount})</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "12px", height: "12px", borderRadius: "2px", border: "2px solid #007AFF", display: "inline-block" }} />
                <span>Current Question</span>
              </div>
            </div>
          </Card>
        </div>

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

              <div style={{ backgroundColor: "var(--color-surface-muted)", padding: "12px", borderRadius: "var(--radius-md)", marginBottom: "var(--space-4)", fontSize: "var(--text-xs)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span>Total Questions:</span>
                  <strong>{totalQCount}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span>Answered:</span>
                  <strong style={{ color: "var(--color-success)" }}>{answeredCount}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span>Unanswered:</span>
                  <strong style={{ color: unansweredCount > 0 ? "#FF3B30" : "inherit" }}>{unansweredCount}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Marked for Review:</span>
                  <strong>{markedCount}</strong>
                </div>
              </div>

              {unansweredCount > 0 && (
                <div style={{ fontSize: "11px", color: "#FF9500", backgroundColor: "rgba(255, 149, 0, 0.1)", padding: "8px 12px", borderRadius: "var(--radius-sm)", marginBottom: "var(--space-4)" }}>
                  ⚠️ Warning: You have {unansweredCount} unanswered question(s). Unanswered questions receive 0 marks.
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)" }}>
                <Button variant="secondary" size="sm" onClick={() => setIsConfirmSubmitOpen(false)}>
                  Return to Exam
                </Button>
                <Button variant="primary" size="sm" onClick={() => handleFinalSubmit("manual")}>
                  Confirm &amp; Submit Now
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
                <Badge variant="accent" size="sm">Mock Exam Result</Badge>
                <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)" }}>Submitted: {activeResult.submittedAt}</span>
                <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)" }}>
                  ({activeResult.submissionType === "timeout" ? "Auto-Submitted on Time Expiry" : "Submitted Manually"})
                </span>
              </div>
              <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--color-primary)", margin: 0 }}>
                {exam ? exam.title : "Examination Performance Review"}
              </h2>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", marginTop: "4px" }}>
                Candidate: <strong>{activeResult.studentName}</strong> &bull; Total Time Taken: {Math.floor(activeResult.timeTakenSeconds / 60)}m {activeResult.timeTakenSeconds % 60}s
              </p>
            </div>

            <Button variant="secondary" size="sm" onClick={() => setExamViewState("list")}>
              ← Back to Mock Exams
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
              <div style={{ fontSize: "10px", color: "var(--color-neutral-dark)", textTransform: "uppercase" }}>Score Obtained</div>
              <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--color-accent)" }}>
                {activeResult.scoreObtained} / {activeResult.totalMarks}
              </div>
              <div style={{ fontSize: "11px", color: "var(--color-neutral-dark)", marginTop: "2px" }}>
                {activeResult.percentage}% Score
              </div>
            </div>

            <div style={{ backgroundColor: "rgba(52, 199, 89, 0.08)", padding: "14px", borderRadius: "var(--radius-md)", textAlign: "center", border: "1px solid rgba(52, 199, 89, 0.2)" }}>
              <div style={{ fontSize: "10px", color: "var(--color-neutral-dark)", textTransform: "uppercase" }}>Correct Answers</div>
              <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "#34C759" }}>
                {activeResult.correctCount}
              </div>
              <div style={{ fontSize: "11px", color: "var(--color-neutral-dark)", marginTop: "2px" }}>
                of {activeResult.totalQuestions} Questions
              </div>
            </div>

            <div style={{ backgroundColor: "rgba(255, 59, 48, 0.08)", padding: "14px", borderRadius: "var(--radius-md)", textAlign: "center", border: "1px solid rgba(255, 59, 48, 0.2)" }}>
              <div style={{ fontSize: "10px", color: "var(--color-neutral-dark)", textTransform: "uppercase" }}>Incorrect</div>
              <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "#FF3B30" }}>
                {activeResult.incorrectCount}
              </div>
              <div style={{ fontSize: "11px", color: "var(--color-neutral-dark)", marginTop: "2px" }}>
                0 marks awarded
              </div>
            </div>

            <div style={{ backgroundColor: "var(--color-surface-muted)", padding: "14px", borderRadius: "var(--radius-md)", textAlign: "center" }}>
              <div style={{ fontSize: "10px", color: "var(--color-neutral-dark)", textTransform: "uppercase" }}>Unanswered</div>
              <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--color-primary)" }}>
                {activeResult.unansweredCount}
              </div>
              <div style={{ fontSize: "11px", color: "var(--color-neutral-dark)", marginTop: "2px" }}>
                Skipped
              </div>
            </div>

            <div style={{ backgroundColor: "var(--color-surface-muted)", padding: "14px", borderRadius: "var(--radius-md)", textAlign: "center" }}>
              <div style={{ fontSize: "10px", color: "var(--color-neutral-dark)", textTransform: "uppercase" }}>Status Outcome</div>
              {activeResult.passingMarks !== undefined ? (
                <>
                  <div style={{ fontSize: "var(--text-base)", fontWeight: 700, color: activeResult.isPassed ? "#34C759" : "#FF9500" }}>
                    {activeResult.isPassed ? "PASSED" : "NEEDS IMPROVEMENT"}
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--color-neutral-dark)", marginTop: "2px" }}>
                    Pass criteria: ≥ {activeResult.passingMarks} marks
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-accent)" }}>
                    EVALUATED
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--color-neutral-dark)", marginTop: "2px" }}>
                    Diagnostic review (No threshold)
                  </div>
                </>
              )}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-2)" }}>
            <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, margin: 0 }}>
              Question-by-Question Solution Review &amp; Explanations
            </h3>
            {exam && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleOpenInstructions(exam)}
              >
                Retake Exam (Demo)
              </Button>
            )}
          </div>
        </Card>

        {exam && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            {exam.questions.map((q, idx) => {
              const userChoice = activeResult.answers[q.id];
              const isCorrect = userChoice === q.correctOptionIndex;
              const isUnanswered = userChoice === null || userChoice === undefined;

              return (
                <Card
                  key={q.id}
                  padding="md"
                  style={{
                    borderLeft: isCorrect ? "4px solid #34C759" : isUnanswered ? "4px solid var(--color-neutral)" : "4px solid #FF3B30",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-2)", flexWrap: "wrap", gap: "var(--space-2)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "var(--text-sm)", fontWeight: 700 }}>
                        Question {idx + 1}
                      </span>
                      <Badge variant="neutral" size="sm">
                        {q.marks} Marks
                      </Badge>
                    </div>

                    <Badge
                      variant={isCorrect ? "success" : isUnanswered ? "neutral" : "warning"}
                      size="sm"
                    >
                      {isCorrect ? `✓ Correct (+${q.marks} Marks)` : isUnanswered ? "— Unanswered (0 Marks)" : "✗ Incorrect (0 Marks)"}
                    </Badge>
                  </div>

                  <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-primary)", marginBottom: "var(--space-3)" }}>
                    {q.questionText}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "var(--space-3)" }}>
                    {q.options.map((opt, optIdx) => {
                      const isOptionCorrect = optIdx === q.correctOptionIndex;
                      const isOptionSelected = optIdx === userChoice;
                      const letter = String.fromCharCode(65 + optIdx);

                      let optBg = "var(--color-surface)";
                      let optBorder = "1px solid var(--color-border)";
                      let optLabel = null;

                      if (isOptionCorrect) {
                        optBg = "rgba(52, 199, 89, 0.1)";
                        optBorder = "1px solid #34C759";
                        optLabel = <span style={{ fontSize: "10px", color: "#34C759", fontWeight: 700, marginLeft: "auto" }}>✓ Correct Answer</span>;
                      } else if (isOptionSelected) {
                        optBg = "rgba(255, 59, 48, 0.1)";
                        optBorder = "1px solid #FF3B30";
                        optLabel = <span style={{ fontSize: "10px", color: "#FF3B30", fontWeight: 700, marginLeft: "auto" }}>✗ Your Selection</span>;
                      }

                      return (
                        <div
                          key={optIdx}
                          style={{
                            padding: "8px 12px",
                            borderRadius: "var(--radius-sm)",
                            backgroundColor: optBg,
                            border: optBorder,
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "var(--text-xs)",
                          }}
                        >
                          <span style={{ fontWeight: 700 }}>{letter}.</span>
                          <span>{opt}</span>
                          {optLabel}
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <div
                      style={{
                        backgroundColor: "var(--color-surface-muted)",
                        padding: "8px 12px",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "11px",
                        color: "var(--color-primary)",
                        lineHeight: 1.5,
                      }}
                    >
                      <strong>Diagnostic Explanation:</strong> {q.explanation}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // MAIN MODULE DASHBOARD
  // --------------------------------------------------------------------------
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      {/* Toast Notice */}
      {actionNotice && (
        <div
          style={{
            backgroundColor: "#34C759",
            color: "#FFFFFF",
            padding: "8px 16px",
            borderRadius: "var(--radius-md)",
            fontSize: "var(--text-xs)",
            fontWeight: 600,
            textAlign: "center",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          {actionNotice}
        </div>
      )}

      {/* Header Card */}
      <Card padding="md">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--space-3)" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "4px" }}>
              <h2 style={{ fontSize: "var(--text-lg)" }}>
                {role === "parent"
                  ? "Ward's Academic Results, Test Series & Certificates"
                  : role === "student"
                  ? "Academic Results, Mock Exams & Certified Honors"
                  : role === "teacher"
                  ? "Faculty Examination Roster & Results Ledger"
                  : "Academy Academic Results & Examination Directorate"}
              </h2>
              <Badge variant="accent" size="sm">
                Session 2026–27
              </Badge>
            </div>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)" }}>
              Inspect student performance across physical class tests and online mock examinations, calculate cumulative percentages from verified records, and generate merit certificates.
            </p>
          </div>

          <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
            {role === "teacher" && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleOpenAuthorModal()}
              >
                + Create Mock Exam
              </Button>
            )}

            {(role === "teacher" || role === "academy-admin") && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsRecordModalOpen(true)}
              >
                + Record Class Test Marks
              </Button>
            )}
          </div>
        </div>

        {/* Sub-Tabs Switcher */}
        <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-4)", borderTop: "1px solid var(--color-border)", paddingTop: "var(--space-3)", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setActiveSubTab("results")}
            style={{
              padding: "6px 14px",
              borderRadius: "var(--radius-full)",
              fontSize: "var(--text-xs)",
              fontWeight: activeSubTab === "results" ? 700 : 500,
              backgroundColor: activeSubTab === "results" ? "var(--color-primary)" : "var(--color-surface-muted)",
              color: activeSubTab === "results" ? "#FFFFFF" : "var(--color-primary)",
              border: "1px solid var(--color-border)",
              cursor: "pointer",
            }}
          >
            🏆 Academic Results &amp; Certificates ({studentAcademicRecords.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("mock-exams")}
            style={{
              padding: "6px 14px",
              borderRadius: "var(--radius-full)",
              fontSize: "var(--text-xs)",
              fontWeight: activeSubTab === "mock-exams" ? 700 : 500,
              backgroundColor: activeSubTab === "mock-exams" ? "var(--color-primary)" : "var(--color-surface-muted)",
              color: activeSubTab === "mock-exams" ? "#FFFFFF" : "var(--color-primary)",
              border: "1px solid var(--color-border)",
              cursor: "pointer",
            }}
          >
            📝 Online Mock Examination Engine ({visibleMockExams.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("gradebook")}
            style={{
              padding: "6px 14px",
              borderRadius: "var(--radius-full)",
              fontSize: "var(--text-xs)",
              fontWeight: activeSubTab === "gradebook" ? 700 : 500,
              backgroundColor: activeSubTab === "gradebook" ? "var(--color-primary)" : "var(--color-surface-muted)",
              color: activeSubTab === "gradebook" ? "#FFFFFF" : "var(--color-primary)",
              border: "1px solid var(--color-border)",
              cursor: "pointer",
            }}
          >
            📊 Class Tests &amp; Gradebook ({visibleOfflineAssessments.length})
          </button>
        </div>
      </Card>

      {/* Filter and Student Selector Bar */}
      <Card padding="sm">
        <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", alignItems: "center", flex: 1 }}>
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
                  padding: "5px 8px",
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
              </select>
            </div>

            {/* Search Input */}
            <div style={{ minWidth: "220px", flex: "1 1 200px" }}>
              <input
                type="text"
                placeholder="Search assessments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  fontSize: "var(--text-xs)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border)",
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* Student Selector for Teachers & Admin */}
          {(role === "teacher" || role === "academy-admin") && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", fontWeight: 600 }}>
                Inspected Candidate:
              </span>
              <select
                value={inspectedStudentId}
                onChange={(e) => setInspectedStudentId(e.target.value)}
                style={{
                  fontSize: "var(--text-xs)",
                  padding: "5px 8px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-surface)",
                  fontWeight: 600,
                }}
              >
                {SAMPLE_STUDENTS.map((std) => (
                  <option key={std.id} value={std.id}>
                    {std.name} ({std.classGrade} &bull; {std.board})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </Card>

      {/* ==================================================================== */}
      {/* TAB 1: ACADEMIC RESULTS & CERTIFICATES (Task 10 Core)                 */}
      {/* ==================================================================== */}
      {activeSubTab === "results" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          {/* Candidate Profile & Cumulative Academic Summary Banner */}
          <Card padding="lg" style={{ borderLeft: "4px solid #007AFF" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, margin: 0 }}>
                    {targetStudent.name} &bull; Verified Academic Performance
                  </h3>
                  <Badge variant="accent" size="sm">
                    {targetStudent.classGrade}
                  </Badge>
                  <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)" }}>
                    {targetStudent.board} &bull; Guardian: {targetStudent.guardianName}
                  </span>
                </div>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", margin: 0 }}>
                  Cumulative results computed strictly from active classroom assessments and mock examination submissions.
                </p>
              </div>

              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "10px", color: "var(--color-neutral-dark)", textTransform: "uppercase" }}>Qualified Certificates</span>
                <div style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--color-success)" }}>
                  {academicSummary.eligibleCertificatesCount} Earned
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
                  {academicSummary.totalAttempted}
                </div>
              </div>

              <div style={{ backgroundColor: "var(--color-surface-muted)", padding: "12px", borderRadius: "var(--radius-md)", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "var(--color-neutral-dark)", textTransform: "uppercase" }}>Cumulative Marks</div>
                <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--color-accent)" }}>
                  {academicSummary.cumulativeObtained} / {academicSummary.cumulativeMax}
                </div>
              </div>

              <div style={{ backgroundColor: "var(--color-surface-muted)", padding: "12px", borderRadius: "var(--radius-md)", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "var(--color-neutral-dark)", textTransform: "uppercase" }}>Overall Average</div>
                <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: academicSummary.cumulativePercentage >= 75 ? "var(--color-success)" : "var(--color-primary)" }}>
                  {academicSummary.cumulativePercentage}%
                </div>
              </div>

              {/* Subject breakdowns */}
              {Object.keys(academicSummary.subjectBreakdown).map((subj) => {
                const item = academicSummary.subjectBreakdown[subj];
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

          {/* Academic Results History Ledger */}
          <Card padding="md">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-3)", flexWrap: "wrap", gap: "var(--space-2)" }}>
              <div>
                <h4 style={{ fontSize: "var(--text-sm)", fontWeight: 700, margin: 0 }}>
                  Detailed Assessment Records &amp; Scorecards ({studentAcademicRecords.length})
                </h4>
                <p style={{ fontSize: "11px", color: "var(--color-neutral-dark)", margin: "2px 0 0" }}>
                  Itemized list of physical periodic tests and online mock exams with marks obtained, maximum marks, and certificate eligibility.
                </p>
              </div>
            </div>

            {studentAcademicRecords.length === 0 ? (
              <div style={{ padding: "var(--space-6)", textAlign: "center", color: "var(--color-neutral-dark)", fontSize: "var(--text-xs)" }}>
                No completed test records found for candidate {targetStudent.name} under the selected filters.
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
                      <th style={{ padding: "8px 12px" }}>Academic Standing</th>
                      <th style={{ padding: "8px 12px", textAlign: "right" }}>Certificate Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentAcademicRecords.map((record) => (
                      <tr key={record.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                        <td style={{ padding: "10px 12px" }}>
                          <Badge variant="accent" size="sm">
                            {record.subject}
                          </Badge>
                        </td>
                        <td style={{ padding: "10px 12px", fontWeight: 600, color: "var(--color-primary)" }}>
                          {record.title}
                          {record.feedback && (
                            <div style={{ fontSize: "10px", color: "var(--color-neutral-dark)", fontWeight: 400, marginTop: "2px" }}>
                              Feedback: {record.feedback}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <Badge variant="neutral" size="sm">
                            {record.type}
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
                        <td style={{ padding: "10px 12px", textAlign: "right" }}>
                          {record.isCertificateEligible ? (
                            <button
                              type="button"
                              onClick={() => handleOpenCertificate(record)}
                              style={{
                                padding: "4px 10px",
                                borderRadius: "var(--radius-sm)",
                                fontSize: "11px",
                                fontWeight: 700,
                                backgroundColor: "rgba(52, 199, 89, 0.1)",
                                color: "#34C759",
                                border: "1px solid rgba(52, 199, 89, 0.3)",
                                cursor: "pointer",
                              }}
                            >
                              🎓 View Certificate →
                            </button>
                          ) : (
                            <span style={{ fontSize: "10px", color: "var(--color-neutral)", fontStyle: "italic" }}>
                              Ineligible (Score &lt; 75%)
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Qualified Certificates Showcase */}
          <Card padding="md">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-3)", flexWrap: "wrap", gap: "var(--space-2)" }}>
              <div>
                <h4 style={{ fontSize: "var(--text-sm)", fontWeight: 700, margin: 0 }}>
                  Earned Academic Merit Certificates ({academicSummary.eligibleCertificatesCount})
                </h4>
                <p style={{ fontSize: "11px", color: "var(--color-neutral-dark)", margin: "2px 0 0" }}>
                  Certificates are awarded strictly for qualifying examination performances with Distinction (&ge; 75% marks). Sample certificates include a DEMO watermark and print stylesheet.
                </p>
              </div>
            </div>

            {academicSummary.eligibleCertificatesCount === 0 ? (
              <div style={{ padding: "var(--space-6)", textAlign: "center", color: "var(--color-neutral-dark)", fontSize: "var(--text-xs)" }}>
                No certificates unlocked yet. A minimum score of 75% on periodic exams is required.
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "var(--space-3)" }}>
                {studentAcademicRecords
                  .filter((r) => r.isCertificateEligible)
                  .map((record) => (
                    <div
                      key={record.id}
                      style={{
                        padding: "14px",
                        borderRadius: "var(--radius-md)",
                        backgroundColor: "var(--color-surface)",
                        border: "1px solid #007AFF",
                        boxShadow: "var(--shadow-sm)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        gap: "10px",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                          <span style={{ fontSize: "10px", fontWeight: 800, color: "#007AFF", letterSpacing: "0.5px" }}>
                            ★ CERTIFICATE OF MERIT
                          </span>
                          <Badge variant="success" size="sm">
                            {record.percentage}% Distinction
                          </Badge>
                        </div>

                        <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-primary)" }}>
                          {record.title}
                        </div>
                        <div style={{ fontSize: "10px", color: "var(--color-neutral-dark)", marginTop: "2px" }}>
                          {record.subject} &bull; Score: {record.marksObtained}/{record.totalMarks} Marks &bull; Date: {record.date}
                        </div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--color-border)", paddingTop: "8px" }}>
                        <span style={{ fontSize: "10px", color: "var(--color-neutral-dark)" }}>
                          Audited: {record.eligibilityReason}
                        </span>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenCertificate(record)}
                        >
                          Print / PDF →
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: ONLINE MOCK EXAMS ENGINE                                      */}
      {/* ==================================================================== */}
      {activeSubTab === "mock-exams" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "var(--space-4)" }}>
          {visibleMockExams.length === 0 ? (
            <div
              style={{
                gridColumn: "1 / -1",
                padding: "var(--space-8)",
                textAlign: "center",
                backgroundColor: "var(--color-surface)",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--color-border)",
                color: "var(--color-neutral-dark)",
                fontSize: "var(--text-sm)",
              }}
            >
              <p>No mock examinations match the selected filter criteria.</p>
              <Button
                variant="secondary"
                size="sm"
                style={{ marginTop: "var(--space-3)" }}
                onClick={() => {
                  setFilterSubject("all");
                  setSearchQuery("");
                }}
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            visibleMockExams.map((exam) => {
              const attempt = examResults.find((r) => r.examId === exam.id && r.studentId === targetStudent.id);

              return (
                <div
                  key={exam.id}
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
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        <Badge variant="accent" size="sm">{exam.subject}</Badge>
                        <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)", fontWeight: 500 }}>
                          {exam.classGrade}
                        </span>
                      </div>
                      <Badge variant={attempt ? "success" : "neutral"} size="sm">
                        {attempt ? `✓ Attempted (${attempt.percentage}%)` : "Not Attempted"}
                      </Badge>
                    </div>

                    <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-primary)", marginBottom: "4px" }}>
                      {exam.title}
                    </h3>

                    <div style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", lineHeight: 1.5 }}>
                      <div>⏱️ Duration: <strong>{exam.durationMinutes} Minutes</strong> &bull; <strong>{exam.questions.length} Questions</strong></div>
                      <div>🎯 Total Marks: <strong>{exam.totalMarks}</strong> &bull; Passing: <strong>{exam.passingMarks !== undefined ? `${exam.passingMarks} Marks` : "Diagnostic"}</strong></div>
                      <div>🏷️ {exam.batchName} &bull; Faculty: <strong>{exam.teacherName}</strong></div>
                    </div>

                    {attempt && (
                      <div
                        style={{
                          marginTop: "var(--space-3)",
                          padding: "8px 12px",
                          borderRadius: "var(--radius-sm)",
                          backgroundColor: attempt.isPassed !== false ? "rgba(52, 199, 89, 0.08)" : "rgba(255, 149, 0, 0.08)",
                          border: "1px solid rgba(0,0,0,0.06)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-primary)" }}>
                            Last Score: {attempt.scoreObtained} / {attempt.totalMarks} ({attempt.percentage}%)
                          </div>
                          <div style={{ fontSize: "10px", color: "var(--color-neutral-dark)" }}>
                            {attempt.correctCount} Correct &bull; {attempt.incorrectCount} Incorrect
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedExam(exam);
                            setActiveResult(attempt);
                            setExamViewState("result");
                          }}
                          style={{
                            fontSize: "11px",
                            color: "var(--color-accent)",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontWeight: 600,
                          }}
                        >
                          Review →
                        </button>
                      </div>
                    )}
                  </div>

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
                    <div style={{ display: "flex", gap: "6px" }}>
                      {role === "teacher" && (
                        <button
                          type="button"
                          onClick={() => handleOpenAuthorModal(exam)}
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
                          Edit Exam
                        </button>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: "6px" }}>
                      {role === "teacher" || role === "academy-admin" ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenInstructions(exam)}
                        >
                          Preview Exam Experience →
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenInstructions(exam)}
                        >
                          {attempt ? "Retake Exam →" : "Start Mock Exam →"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: RECORDED CLASS TESTS & GRADEBOOK                             */}
      {/* ==================================================================== */}
      {activeSubTab === "gradebook" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {visibleOfflineAssessments.length === 0 ? (
            <Card padding="lg" style={{ textAlign: "center", color: "var(--color-neutral-dark)" }}>
              No class test records found for this filter.
            </Card>
          ) : (
            visibleOfflineAssessments.map((exam) => {
              const studentScore = exam.studentScores.find((sc) => sc.studentId === targetStudent.id);

              return (
                <div
                  key={exam.id}
                  style={{
                    backgroundColor: "var(--color-surface)",
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--color-border)",
                    padding: "var(--space-5)",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "4px" }}>
                        <Badge variant="accent" size="sm">{exam.subject}</Badge>
                        <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)" }}>{exam.date}</span>
                      </div>
                      <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-primary)" }}>
                        {exam.title}
                      </h3>
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)" }}>
                        {exam.batch} &bull; Total Marks: {exam.totalMarks}
                      </span>
                    </div>

                    {(role === "student" || role === "parent") && studentScore && (
                      <div
                        style={{
                          padding: "var(--space-2) var(--space-4)",
                          backgroundColor: "rgba(52, 199, 89, 0.1)",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid rgba(52, 199, 89, 0.3)",
                          textAlign: "right",
                        }}
                      >
                        <span style={{ fontSize: "10px", color: "var(--color-neutral-dark)", textTransform: "uppercase" }}>Score Obtained</span>
                        <div style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--color-success)" }}>
                          {studentScore.marksObtained} / {exam.totalMarks}
                        </div>
                        <span style={{ fontSize: "10px", color: "var(--color-neutral-dark)" }}>
                          {Math.round((studentScore.marksObtained / exam.totalMarks) * 100)}%
                        </span>
                      </div>
                    )}
                  </div>

                  {role === "student" || role === "parent" ? (
                    studentScore ? (
                      <div
                        style={{
                          backgroundColor: "var(--color-surface-muted)",
                          borderRadius: "var(--radius-md)",
                          padding: "var(--space-3)",
                          marginTop: "var(--space-2)",
                          border: "1px solid var(--color-border)",
                        }}
                      >
                        <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-primary)" }}>
                          Faculty Diagnostic Review:
                        </span>
                        <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", marginTop: "2px", lineHeight: 1.5 }}>
                          {studentScore.feedback || "Good progress; continue consistent numerical practice."}
                        </p>
                      </div>
                    ) : (
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", fontStyle: "italic", marginTop: "var(--space-2)" }}>
                        Score pending publication or absent.
                      </div>
                    )
                  ) : (
                    <div style={{ marginTop: "var(--space-3)", overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "var(--text-xs)" }}>
                        <thead>
                          <tr style={{ backgroundColor: "var(--color-surface-muted)", borderBottom: "1px solid var(--color-border)" }}>
                            <th style={{ padding: "8px 12px", fontWeight: 600 }}>Student Name</th>
                            <th style={{ padding: "8px 12px", fontWeight: 600 }}>Marks Obtained</th>
                            <th style={{ padding: "8px 12px", fontWeight: 600 }}>Percentage</th>
                            <th style={{ padding: "8px 12px", fontWeight: 600 }}>Status</th>
                            <th style={{ padding: "8px 12px", fontWeight: 600 }}>Teacher Comments</th>
                          </tr>
                        </thead>
                        <tbody>
                          {exam.studentScores.map((sc) => (
                            <tr key={sc.studentId} style={{ borderBottom: "1px solid var(--color-border)" }}>
                              <td style={{ padding: "8px 12px", fontWeight: 600 }}>{sc.studentName}</td>
                              <td style={{ padding: "8px 12px", fontWeight: 700, color: "var(--color-accent)" }}>
                                {sc.marksObtained} / {exam.totalMarks}
                              </td>
                              <td style={{ padding: "8px 12px" }}>
                                {Math.round((sc.marksObtained / exam.totalMarks) * 100)}%
                              </td>
                              <td style={{ padding: "8px 12px" }}>
                                <Badge variant="success" size="sm">{sc.status}</Badge>
                              </td>
                              <td style={{ padding: "8px 12px", color: "var(--color-neutral-dark)" }}>
                                {sc.feedback || "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TEACHER AUTHORING / EDITING MODAL */}
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
                    placeholder="e.g. Class X Mathematics Midterm Mock Test"
                    style={{ width: "100%", padding: "6px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "var(--text-xs)" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, marginBottom: "4px" }}>Subject</label>
                  <select
                    value={authorSubject}
                    onChange={(e) => setAuthorSubject(e.target.value)}
                    style={{ width: "100%", padding: "6px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "var(--text-xs)", backgroundColor: "var(--color-surface)" }}
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
                    style={{ width: "100%", padding: "6px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "var(--text-xs)", backgroundColor: "var(--color-surface)" }}
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
                    placeholder="Leave blank if none"
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
                      placeholder="Step-by-step diagnostic explanation / derivation..."
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

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--color-border)", paddingTop: "var(--space-3)" }}>
                <span style={{ fontSize: "10px", color: "var(--color-neutral-dark)" }}>
                  Local demo state: Changes update in-memory catalog.
                </span>
                <div style={{ display: "flex", gap: "var(--space-2)" }}>
                  <Button type="button" variant="secondary" size="sm" onClick={() => setIsAuthorModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm">
                    {authoringExamId ? "Update Exam" : "Publish Mock Exam"}
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* OFFLINE MARKS RECORDING MODAL */}
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
            backgroundColor: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "var(--space-4)",
          }}
        >
          <div
            style={{
              backgroundColor: "var(--color-surface)",
              borderRadius: "var(--radius-lg)",
              maxWidth: "480px",
              width: "100%",
              padding: "var(--space-6)",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, marginBottom: "var(--space-2)" }}>
              Record Class Test Evaluation
            </h3>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", marginBottom: "var(--space-4)" }}>
              Add a student score to the physical periodic examination evaluation ledger.
            </p>

            <form onSubmit={handleRecordOfflineMarks}>
              <div style={{ marginBottom: "var(--space-3)" }}>
                <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "4px" }}>Select Examination Series:</label>
                <select
                  value={selectedOfflineExamId}
                  onChange={(e) => setSelectedOfflineExamId(e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "var(--text-xs)" }}
                >
                  {visibleOfflineAssessments.map((ex) => (
                    <option key={ex.id} value={ex.id}>{ex.title} ({ex.subject} &bull; Max {ex.totalMarks})</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "var(--space-3)" }}>
                <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "4px" }}>Student:</label>
                <select
                  value={studentIdInput}
                  onChange={(e) => setStudentIdInput(e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "var(--text-xs)" }}
                >
                  {SAMPLE_STUDENTS.map((std) => (
                    <option key={std.id} value={std.id}>{std.name} ({std.classGrade})</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "var(--space-3)" }}>
                <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "4px" }}>Marks Obtained:</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={marksInput}
                  onChange={(e) => setMarksInput(e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "var(--text-xs)" }}
                />
              </div>

              <div style={{ marginBottom: "var(--space-4)" }}>
                <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: "4px" }}>Teacher Diagnostic Feedback:</label>
                <input
                  type="text"
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  placeholder="e.g. Excellent conceptual clarity in theorems"
                  style={{ width: "100%", padding: "8px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "var(--text-xs)" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)" }}>
                <Button type="button" variant="secondary" size="sm" onClick={() => setIsRecordModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Save Evaluation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE CERTIFICATE MODAL */}
      {activeCertificate && (
        <ExamCertificateModal
          isOpen={Boolean(activeCertificate)}
          onClose={() => setActiveCertificate(null)}
          certificate={activeCertificate}
        />
      )}
    </div>
  );
}
