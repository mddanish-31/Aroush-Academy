import { MockExam, ExamAttemptResult } from "@/types";

/**
 * Standard Mock Examination Definitions for ArousH Academy
 * Deterministic scoring keys and ICSE/CBSE curriculum aligned questions
 */
export const SAMPLE_MOCK_EXAMS: MockExam[] = [
  {
    id: "mock-math-101",
    title: "ICSE Class X Mathematics Periodic Mock Exam 1",
    subject: "Mathematics",
    classGrade: "Class X",
    batchName: "Batch Alpha (Class IX-X)",
    teacherId: "tch-azhar",
    teacherName: "Azhar Sir",
    durationMinutes: 20,
    totalMarks: 20,
    passingMarks: 8, // 40% passing threshold
    status: "published",
    instructions: [
      "This examination consists of 5 multiple choice questions carrying 4 marks each.",
      "Select the single best option (A, B, C, or D) for each problem.",
      "Use 'Previous' and 'Next' or the Question Palette on the right to navigate between questions.",
      "You can toggle 'Mark for Review' to easily revisit any uncertain problem before submitting.",
      "Use 'Clear Answer' if you wish to reset your selection on the current question.",
      "The countdown timer will automatically submit your exam when time expires.",
      "Demo Mode Notice: All responses are evaluated deterministically in-browser. No answers are stored on a remote server.",
    ],
    questions: [
      {
        id: "q-math-1",
        questionNumber: 1,
        questionText: "What is the nature of the roots of the quadratic equation 2x² - 4x + 3 = 0?",
        options: [
          "Real and equal roots",
          "Real and distinct roots",
          "No real roots (Complex conjugate roots)",
          "Rational and unequal roots",
        ],
        correctOptionIndex: 2,
        marks: 4,
        explanation:
          "For equation ax² + bx + c = 0, discriminant D = b² - 4ac. Here a = 2, b = -4, c = 3. D = (-4)² - 4(2)(3) = 16 - 24 = -8 < 0. Since D < 0, the equation has no real roots.",
      },
      {
        id: "q-math-2",
        questionNumber: 2,
        questionText: "If the distance between the points (4, p) and (1, 0) is 5 units, the value of p is:",
        options: ["±4", "±5", "±3", "4 only"],
        correctOptionIndex: 0,
        marks: 4,
        explanation:
          "Distance formula: d = √[(x2 - x1)² + (y2 - y1)²]. 5 = √[(1 - 4)² + (0 - p)²] ⇒ 25 = (-3)² + p² ⇒ 25 = 9 + p² ⇒ p² = 16 ⇒ p = ±4.",
      },
      {
        id: "q-math-3",
        questionNumber: 3,
        questionText: "Evaluate the trigonometric ratio: (sin 30° + cos 60°) / tan 45°",
        options: ["0.5", "1.0", "1.5", "2.0"],
        correctOptionIndex: 1,
        marks: 4,
        explanation:
          "Standard trigonometric values: sin 30° = 1/2, cos 60° = 1/2, tan 45° = 1. Therefore, (1/2 + 1/2) / 1 = 1 / 1 = 1.0.",
      },
      {
        id: "q-math-4",
        questionNumber: 4,
        questionText: "The sum of the roots of the quadratic equation 3x² - 9x + 5 = 0 is:",
        options: ["5/3", "-3", "3", "-5/3"],
        correctOptionIndex: 2,
        marks: 4,
        explanation:
          "For any quadratic ax² + bx + c = 0, sum of roots α + β = -b/a = -(-9)/3 = 9/3 = 3.",
      },
      {
        id: "q-math-5",
        questionNumber: 5,
        questionText: "The coordinates of the midpoint of the line segment joining A(-2, 8) and B(-6, -4) are:",
        options: ["(-4, 2)", "(-8, 4)", "(2, -4)", "(-4, 6)"],
        correctOptionIndex: 0,
        marks: 4,
        explanation:
          "Midpoint coordinates = ((x1 + x2)/2, (y1 + y2)/2) = ((-2 + -6)/2, (8 + -4)/2) = (-8/2, 4/2) = (-4, 2).",
      },
    ],
  },
  {
    id: "mock-phys-102",
    title: "Class X Physics Mechanics, Optics & Electricity Mock Test",
    subject: "Physics",
    classGrade: "Class X",
    batchName: "Batch Science (Class IX-X)",
    teacherId: "tch-alvi",
    teacherName: "Dr. Tariq Alvi",
    durationMinutes: 15,
    totalMarks: 16,
    passingMarks: 6, // ~37.5% passing threshold
    status: "published",
    instructions: [
      "This test covers geometric optics, refractive index, and DC circuits.",
      "4 multiple choice questions, each carrying 4 marks.",
      "Answer retention is active across all navigation steps.",
      "Submit before the 15-minute countdown elapses or the engine will submit automatically.",
    ],
    questions: [
      {
        id: "q-phys-1",
        questionNumber: 1,
        questionText:
          "A ray of light enters glass from air. If refractive index of glass is 1.5 and speed in air is 3.0 × 10⁸ m/s, the speed of light in glass is:",
        options: [
          "2.0 × 10⁸ m/s",
          "2.25 × 10⁸ m/s",
          "1.5 × 10⁸ m/s",
          "3.0 × 10⁸ m/s",
        ],
        correctOptionIndex: 0,
        marks: 4,
        explanation:
          "Refractive index μ = c / v ⇒ v = c / μ = (3.0 × 10⁸) / 1.5 = 2.0 × 10⁸ m/s.",
      },
      {
        id: "q-phys-2",
        questionNumber: 2,
        questionText:
          "Two resistors of 6 Ω and 3 Ω are connected in parallel across a voltage source. Their equivalent resistance is:",
        options: ["9.0 Ω", "2.0 Ω", "4.5 Ω", "18.0 Ω"],
        correctOptionIndex: 1,
        marks: 4,
        explanation:
          "Parallel formula: 1/R_eq = 1/R1 + 1/R2 = 1/6 + 1/3 = 3/6 = 1/2 ⇒ R_eq = 2.0 Ω.",
      },
      {
        id: "q-phys-3",
        questionNumber: 3,
        questionText: "The optical power of a convex lens having a focal length of +50 cm is:",
        options: ["+2.0 D", "+0.5 D", "-2.0 D", "+5.0 D"],
        correctOptionIndex: 0,
        marks: 4,
        explanation:
          "Focal length f = +50 cm = +0.5 m. Power P = 1 / f(in meters) = 1 / 0.5 = +2.0 Dioptres.",
      },
      {
        id: "q-phys-4",
        questionNumber: 4,
        questionText: "Which of the following is the SI unit of electric potential difference?",
        options: ["Ampere", "Ohm", "Volt", "Joule"],
        correctOptionIndex: 2,
        marks: 4,
        explanation:
          "Electric potential difference is measured in Volts (V), where 1 Volt = 1 Joule per Coulomb.",
      },
    ],
  },
  {
    id: "mock-math-103",
    title: "Class XII Higher Mathematics Calculus Diagnostics",
    subject: "Mathematics",
    classGrade: "Class XII",
    batchName: "Batch Higher Secondary (Class XI-XII)",
    teacherId: "tch-azhar",
    teacherName: "Azhar Sir",
    durationMinutes: 25,
    totalMarks: 20,
    passingMarks: undefined, // Intentionally undefined to demonstrate that pass/fail is NOT invented when unconfigured!
    status: "published",
    instructions: [
      "Diagnostic test on differentiation, limits, and continuity for Class XII.",
      "No passing threshold is defined for this diagnostic review; full breakdown will be shown.",
      "Step-by-step calculus proofs are displayed in post-exam review.",
    ],
    questions: [
      {
        id: "q-calc-1",
        questionNumber: 1,
        questionText: "Evaluate the limit: lim (x → 0) [sin(5x) / x]",
        options: ["0", "1", "5", "Undefined"],
        correctOptionIndex: 2,
        marks: 5,
        explanation: "lim (x → 0) [sin(kx) / x] = k. Here k = 5, so the limit evaluates to 5.",
      },
      {
        id: "q-calc-2",
        questionNumber: 2,
        questionText: "The derivative of f(x) = sin(x²) with respect to x is:",
        options: ["cos(x²)", "2x cos(x²)", "2x sin(x)", "-2x cos(x²)"],
        correctOptionIndex: 1,
        marks: 5,
        explanation: "By chain rule: d/dx[sin(u)] = cos(u) · du/dx. For u = x², du/dx = 2x. Thus 2x cos(x²).",
      },
      {
        id: "q-calc-3",
        questionNumber: 3,
        questionText: "At what point does the curve y = x² - 4x + 5 have a horizontal tangent?",
        options: ["(2, 1)", "(4, 5)", "(0, 5)", "(1, 2)"],
        correctOptionIndex: 0,
        marks: 5,
        explanation: "Horizontal tangent means dy/dx = 0. dy/dx = 2x - 4 = 0 ⇒ x = 2. When x = 2, y = 4 - 8 + 5 = 1.",
      },
      {
        id: "q-calc-4",
        questionNumber: 4,
        questionText: "If f(x) = |x|, then at x = 0 the function is:",
        options: [
          "Continuous and differentiable",
          "Continuous but not differentiable",
          "Discontinuous but differentiable",
          "Neither continuous nor differentiable",
        ],
        correctOptionIndex: 1,
        marks: 5,
        explanation:
          "f(x) = |x| is continuous everywhere, but the left derivative is -1 and right derivative is +1 at x = 0, so it is not differentiable at x = 0.",
      },
    ],
  },
];

/**
 * Sample Pre-Recorded Mock Exam Attempts (For Taha Rahman std-101)
 */
export const SAMPLE_EXAM_RESULTS: ExamAttemptResult[] = [
  {
    examId: "mock-phys-102",
    studentId: "std-101",
    studentName: "Taha Rahman",
    totalQuestions: 4,
    totalMarks: 16,
    scoreObtained: 12,
    percentage: 75,
    correctCount: 3,
    incorrectCount: 1,
    unansweredCount: 0,
    passingMarks: 6,
    isPassed: true,
    timeTakenSeconds: 524, // 8m 44s
    submittedAt: "2026-10-08 04:45 PM",
    submissionType: "manual",
    answers: {
      "q-phys-1": 0, // Correct
      "q-phys-2": 1, // Correct
      "q-phys-3": 1, // Selected 1 (+0.5 D) instead of 0 (+2.0 D)
      "q-phys-4": 2, // Correct
    },
    reviewFlags: {
      "q-phys-3": true,
    },
  },
];
