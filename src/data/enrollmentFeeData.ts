import type {
  TeacherProfile,
  StudentProfile,
  SubjectEnrollment,
  MonthlyFeeObligation,
  PaymentTransaction,
  EnrollmentFeeSummary,
  FeePaymentStatus,
  PaymentDestination,
  PaymentSubmission,
  FeeAdjustment,
  FeeConfigurationRule,
  VerifiedFeeReceipt,
} from "@/types";

export const SAMPLE_TEACHERS: TeacherProfile[] = [
  {
    id: "tch-azhar",
    name: "Azhar Sir",
    assignedSubjects: ["Mathematics"],
    batches: ["Batch Alpha (Class IX-X)", "Batch Higher Secondary (Class XI-XII)"],
    email: "azhar.maths@aroush.academy",
    status: "active",
  },
  {
    id: "tch-alvi",
    name: "Dr. Tariq Alvi",
    assignedSubjects: ["Physics", "Chemistry"],
    batches: ["Batch Science (Class IX-X)"],
    email: "tariq.alvi@aroush.academy",
    status: "active",
  },
  {
    id: "tch-roy",
    name: "Prof. N. Roy",
    assignedSubjects: ["Accountancy", "Economics"],
    batches: ["Batch Commerce (Class XI-XII)"],
    email: "n.roy@aroush.academy",
    status: "active",
  },
];

export const SAMPLE_STUDENTS: StudentProfile[] = [
  {
    id: "std-101",
    name: "Taha Rahman",
    classGrade: "Class X",
    board: "ICSE",
    guardianName: "Tariq Rahman",
    guardianPhone: "098830 11221",
    joiningDate: "2026-04-10",
    studentStatus: "active",
  },
  {
    id: "std-102",
    name: "Ananya Verma",
    classGrade: "Class X",
    board: "CBSE",
    guardianName: "Sunita Verma",
    guardianPhone: "098830 22334",
    joiningDate: "2026-04-12",
    studentStatus: "active",
  },
  {
    id: "std-103",
    name: "Zayd Al-Mansoor",
    classGrade: "Class XII",
    board: "West Bengal Board",
    guardianName: "Bilal Mansoor",
    guardianPhone: "098830 33445",
    joiningDate: "2026-05-02",
    studentStatus: "active",
  },
  {
    id: "std-104",
    name: "Fatima Sheikh",
    classGrade: "Class XII",
    board: "CBSE",
    guardianName: "Nasir Sheikh",
    guardianPhone: "098830 44556",
    joiningDate: "2026-05-15",
    studentStatus: "active",
  },
  {
    id: "std-105",
    name: "Rohan Mukherjee",
    classGrade: "Class IX",
    board: "ICSE",
    guardianName: "Amit Mukherjee",
    guardianPhone: "098830 55667",
    joiningDate: "2026-06-01",
    studentStatus: "active",
  },
];

/**
 * Distinct student-subject enrollment relationships.
 * A student enrolled in multiple subjects appears with separate teachers.
 */
export const SAMPLE_ENROLLMENTS: SubjectEnrollment[] = [
  {
    id: "enr-101-math",
    studentId: "std-101",
    studentName: "Taha Rahman",
    classGrade: "Class X",
    subjectName: "Mathematics",
    teacherId: "tch-azhar",
    teacherName: "Azhar Sir",
    batchName: "Batch Alpha (Class IX-X)",
    enrollmentDate: "2026-04-10",
    monthlyFeeAmount: 1500,
    status: "active",
  },
  {
    id: "enr-101-phys",
    studentId: "std-101",
    studentName: "Taha Rahman",
    classGrade: "Class X",
    subjectName: "Physics",
    teacherId: "tch-alvi",
    teacherName: "Dr. Tariq Alvi",
    batchName: "Batch Science (Class IX-X)",
    enrollmentDate: "2026-04-10",
    monthlyFeeAmount: 1400,
    status: "active",
  },
  {
    id: "enr-102-math",
    studentId: "std-102",
    studentName: "Ananya Verma",
    classGrade: "Class X",
    subjectName: "Mathematics",
    teacherId: "tch-azhar",
    teacherName: "Azhar Sir",
    batchName: "Batch Alpha (Class IX-X)",
    enrollmentDate: "2026-04-12",
    monthlyFeeAmount: 1500,
    status: "active",
  },
  {
    id: "enr-102-chem",
    studentId: "std-102",
    studentName: "Ananya Verma",
    classGrade: "Class X",
    subjectName: "Chemistry",
    teacherId: "tch-alvi",
    teacherName: "Dr. Tariq Alvi",
    batchName: "Batch Science (Class IX-X)",
    enrollmentDate: "2026-04-12",
    monthlyFeeAmount: 1400,
    status: "active",
  },
  {
    id: "enr-103-math",
    studentId: "std-103",
    studentName: "Zayd Al-Mansoor",
    classGrade: "Class XII",
    subjectName: "Mathematics",
    teacherId: "tch-azhar",
    teacherName: "Azhar Sir",
    batchName: "Batch Higher Secondary (Class XI-XII)",
    enrollmentDate: "2026-05-02",
    monthlyFeeAmount: 1800,
    status: "active",
  },
  {
    id: "enr-103-acc",
    studentId: "std-103",
    studentName: "Zayd Al-Mansoor",
    classGrade: "Class XII",
    subjectName: "Accountancy",
    teacherId: "tch-roy",
    teacherName: "Prof. N. Roy",
    batchName: "Batch Commerce (Class XI-XII)",
    enrollmentDate: "2026-05-02",
    monthlyFeeAmount: 1800,
    status: "active",
  },
  {
    id: "enr-104-acc",
    studentId: "std-104",
    studentName: "Fatima Sheikh",
    classGrade: "Class XII",
    subjectName: "Accountancy",
    teacherId: "tch-roy",
    teacherName: "Prof. N. Roy",
    batchName: "Batch Commerce (Class XI-XII)",
    enrollmentDate: "2026-05-15",
    monthlyFeeAmount: 1800,
    status: "active",
  },
  {
    id: "enr-104-econ",
    studentId: "std-104",
    studentName: "Fatima Sheikh",
    classGrade: "Class XII",
    subjectName: "Economics",
    teacherId: "tch-roy",
    teacherName: "Prof. N. Roy",
    batchName: "Batch Commerce (Class XI-XII)",
    enrollmentDate: "2026-05-15",
    monthlyFeeAmount: 1600,
    status: "active",
  },
  {
    id: "enr-105-math",
    studentId: "std-105",
    studentName: "Rohan Mukherjee",
    classGrade: "Class IX",
    subjectName: "Mathematics",
    teacherId: "tch-azhar",
    teacherName: "Azhar Sir",
    batchName: "Batch Alpha (Class IX-X)",
    enrollmentDate: "2026-06-01",
    monthlyFeeAmount: 1400,
    status: "active",
  },
];

/**
 * Monthly fee obligations for each enrollment across Oct 2026 (current) & Sep 2026 (previous).
 */
export const SAMPLE_OBLIGATIONS: MonthlyFeeObligation[] = [
  // Current Month: October 2026
  {
    id: "ob-101-math-2026-10",
    enrollmentId: "enr-101-math",
    studentId: "std-101",
    studentName: "Taha Rahman",
    subjectName: "Mathematics",
    teacherId: "tch-azhar",
    month: "2026-10",
    monthLabel: "October 2026",
    feeAmount: 1500,
    dueDate: "2026-10-15",
  },
  {
    id: "ob-101-phys-2026-10",
    enrollmentId: "enr-101-phys",
    studentId: "std-101",
    studentName: "Taha Rahman",
    subjectName: "Physics",
    teacherId: "tch-alvi",
    month: "2026-10",
    monthLabel: "October 2026",
    feeAmount: 1400,
    dueDate: "2026-10-15",
  },
  {
    id: "ob-102-math-2026-10",
    enrollmentId: "enr-102-math",
    studentId: "std-102",
    studentName: "Ananya Verma",
    subjectName: "Mathematics",
    teacherId: "tch-azhar",
    month: "2026-10",
    monthLabel: "October 2026",
    feeAmount: 1500,
    dueDate: "2026-10-15",
  },
  {
    id: "ob-102-chem-2026-10",
    enrollmentId: "enr-102-chem",
    studentId: "std-102",
    studentName: "Ananya Verma",
    subjectName: "Chemistry",
    teacherId: "tch-alvi",
    month: "2026-10",
    monthLabel: "October 2026",
    feeAmount: 1400,
    dueDate: "2026-10-15",
  },
  {
    id: "ob-103-math-2026-10",
    enrollmentId: "enr-103-math",
    studentId: "std-103",
    studentName: "Zayd Al-Mansoor",
    subjectName: "Mathematics",
    teacherId: "tch-azhar",
    month: "2026-10",
    monthLabel: "October 2026",
    feeAmount: 1800,
    dueDate: "2026-10-15",
  },
  {
    id: "ob-103-acc-2026-10",
    enrollmentId: "enr-103-acc",
    studentId: "std-103",
    studentName: "Zayd Al-Mansoor",
    subjectName: "Accountancy",
    teacherId: "tch-roy",
    month: "2026-10",
    monthLabel: "October 2026",
    feeAmount: 1800,
    dueDate: "2026-10-15",
  },
  {
    id: "ob-104-acc-2026-10",
    enrollmentId: "enr-104-acc",
    studentId: "std-104",
    studentName: "Fatima Sheikh",
    subjectName: "Accountancy",
    teacherId: "tch-roy",
    month: "2026-10",
    monthLabel: "October 2026",
    feeAmount: 1800,
    dueDate: "2026-10-15",
  },
  {
    id: "ob-104-econ-2026-10",
    enrollmentId: "enr-104-econ",
    studentId: "std-104",
    studentName: "Fatima Sheikh",
    subjectName: "Economics",
    teacherId: "tch-roy",
    month: "2026-10",
    monthLabel: "October 2026",
    feeAmount: 1600,
    dueDate: "2026-10-15",
  },
  {
    id: "ob-105-math-2026-10",
    enrollmentId: "enr-105-math",
    studentId: "std-105",
    studentName: "Rohan Mukherjee",
    subjectName: "Mathematics",
    teacherId: "tch-azhar",
    month: "2026-10",
    monthLabel: "October 2026",
    feeAmount: 1400,
    dueDate: "2026-10-15",
  },

  // Previous Month: September 2026
  {
    id: "ob-101-math-2026-09",
    enrollmentId: "enr-101-math",
    studentId: "std-101",
    studentName: "Taha Rahman",
    subjectName: "Mathematics",
    teacherId: "tch-azhar",
    month: "2026-09",
    monthLabel: "September 2026",
    feeAmount: 1500,
    dueDate: "2026-09-15",
  },
  {
    id: "ob-102-math-2026-09",
    enrollmentId: "enr-102-math",
    studentId: "std-102",
    studentName: "Ananya Verma",
    subjectName: "Mathematics",
    teacherId: "tch-azhar",
    month: "2026-09",
    monthLabel: "September 2026",
    feeAmount: 1500,
    dueDate: "2026-09-15",
  },
  {
    id: "ob-103-math-2026-09",
    enrollmentId: "enr-103-math",
    studentId: "std-103",
    studentName: "Zayd Al-Mansoor",
    subjectName: "Mathematics",
    teacherId: "tch-azhar",
    month: "2026-09",
    monthLabel: "September 2026",
    feeAmount: 1800,
    dueDate: "2026-09-15",
  },
  {
    id: "ob-104-acc-2026-09",
    enrollmentId: "enr-104-acc",
    studentId: "std-104",
    studentName: "Fatima Sheikh",
    subjectName: "Accountancy",
    teacherId: "tch-roy",
    month: "2026-09",
    monthLabel: "September 2026",
    feeAmount: 1800,
    dueDate: "2026-09-15",
  },
  {
    id: "ob-105-math-2026-09",
    enrollmentId: "enr-105-math",
    studentId: "std-105",
    studentName: "Rohan Mukherjee",
    subjectName: "Mathematics",
    teacherId: "tch-azhar",
    month: "2026-09",
    monthLabel: "September 2026",
    feeAmount: 1400,
    dueDate: "2026-09-15",
  },
];

/**
 * Individual payment transactions.
 * Supports partial payments and multiple records for one monthly fee obligation.
 */
export const SAMPLE_PAYMENTS: PaymentTransaction[] = [
  // Taha Rahman Oct Math paid in full via Cash
  {
    id: "tx-801",
    obligationId: "ob-101-math-2026-10",
    enrollmentId: "enr-101-math",
    studentId: "std-101",
    amount: 1500,
    paymentDate: "2026-10-04",
    paymentMethod: "cash",
    referenceId: "CSH-2026-1004-01",
    collectedByRole: "teacher",
    collectedByName: "Azhar Sir",
    isGatewayVerified: false,
    notes: "Cash received in classroom session",
  },
  // Ananya Verma Oct Math partially paid (₹1000 of ₹1500)
  {
    id: "tx-803",
    obligationId: "ob-102-math-2026-10",
    enrollmentId: "enr-102-math",
    studentId: "std-102",
    amount: 1000,
    paymentDate: "2026-10-06",
    paymentMethod: "cash",
    referenceId: "CSH-2026-1006-02",
    collectedByRole: "teacher",
    collectedByName: "Azhar Sir",
    isGatewayVerified: false,
    notes: "Installment 1 of 2 received by teacher",
  },
  // Fatima Sheikh Sep Accountancy had two split payments (₹1000 + ₹800)
  {
    id: "tx-804",
    obligationId: "ob-104-acc-2026-09",
    enrollmentId: "enr-104-acc",
    studentId: "std-104",
    amount: 1000,
    paymentDate: "2026-09-05",
    paymentMethod: "online",
    referenceId: "UPI-REF-77312",
    collectedByRole: "academy-admin",
    collectedByName: "Academy Admin Office",
    isGatewayVerified: false,
    notes: "Initial partial payment",
  },
  {
    id: "tx-805",
    obligationId: "ob-104-acc-2026-09",
    enrollmentId: "enr-104-acc",
    studentId: "std-104",
    amount: 800,
    paymentDate: "2026-09-18",
    paymentMethod: "cash",
    referenceId: "CSH-2026-0918-05",
    collectedByRole: "teacher",
    collectedByName: "Prof. N. Roy",
    isGatewayVerified: false,
    notes: "Remaining balance cleared in cash",
  },
  // Taha Rahman Sep Math paid in full
  {
    id: "tx-806",
    obligationId: "ob-101-math-2026-09",
    enrollmentId: "enr-101-math",
    studentId: "std-101",
    amount: 1500,
    paymentDate: "2026-09-08",
    paymentMethod: "cash",
    referenceId: "CSH-2026-0908-01",
    collectedByRole: "teacher",
    collectedByName: "Azhar Sir",
    isGatewayVerified: false,
    notes: "Full month fee cleared",
  },
  // Ananya Verma Sep Math paid in full
  {
    id: "tx-807",
    obligationId: "ob-102-math-2026-09",
    enrollmentId: "enr-102-math",
    studentId: "std-102",
    amount: 1500,
    paymentDate: "2026-09-10",
    paymentMethod: "online",
    referenceId: "UPI-REF-66219",
    collectedByRole: "academy-admin",
    collectedByName: "Academy Admin Office",
    isGatewayVerified: false,
    notes: "Cleared on time",
  },
  // Zayd Al-Mansoor Sep Math paid in full
  {
    id: "tx-808",
    obligationId: "ob-103-math-2026-09",
    enrollmentId: "enr-103-math",
    studentId: "std-103",
    amount: 1800,
    paymentDate: "2026-09-12",
    paymentMethod: "cash",
    referenceId: "CSH-2026-0912-03",
    collectedByRole: "teacher",
    collectedByName: "Azhar Sir",
    isGatewayVerified: false,
    notes: "Cash collected",
  },
];

/**
 * Calculates payment status and balance for an obligation given a set of payments.
 */
export function calculateObligationStatus(
  obligation: MonthlyFeeObligation,
  payments: PaymentTransaction[]
): {
  paidAmount: number;
  balance: number;
  status: FeePaymentStatus;
  matchingPayments: PaymentTransaction[];
} {
  const matchingPayments = payments.filter((p) => p.obligationId === obligation.id);
  const paidAmount = matchingPayments.reduce((acc, curr) => acc + curr.amount, 0);
  const balance = Math.max(0, obligation.feeAmount - paidAmount);

  let status: FeePaymentStatus = "unpaid";
  if (paidAmount >= obligation.feeAmount) {
    status = "paid";
  } else if (paidAmount > 0) {
    status = "partially-paid";
  } else {
    // Check if overdue against dueDate (assuming current date is 2026-10-10)
    // Sep 15 is in the past, so Sep unpaid is overdue
    if (new Date(obligation.dueDate) < new Date("2026-10-10")) {
      status = "overdue";
    } else {
      status = "unpaid";
    }
  }

  return { paidAmount, balance, status, matchingPayments };
}

/**
 * Compiles complete summary for a list of enrollments with both Oct 2026 & Sep 2026 status.
 */
export function buildEnrollmentSummaries(
  enrollments: SubjectEnrollment[],
  obligations: MonthlyFeeObligation[] = SAMPLE_OBLIGATIONS,
  payments: PaymentTransaction[] = SAMPLE_PAYMENTS
): EnrollmentFeeSummary[] {
  return enrollments.map((enrollment) => {
    // Current month obligation (Oct 2026)
    const currentOb = obligations.find(
      (o) => o.enrollmentId === enrollment.id && o.month === "2026-10"
    ) || {
      id: `ob-${enrollment.id}-2026-10`,
      enrollmentId: enrollment.id,
      studentId: enrollment.studentId,
      studentName: enrollment.studentName,
      subjectName: enrollment.subjectName,
      teacherId: enrollment.teacherId,
      month: "2026-10",
      monthLabel: "October 2026",
      feeAmount: enrollment.monthlyFeeAmount,
      dueDate: "2026-10-15",
    };

    const currentCalc = calculateObligationStatus(currentOb, payments);

    // Previous month obligation (Sep 2026)
    const prevOb = obligations.find(
      (o) => o.enrollmentId === enrollment.id && o.month === "2026-09"
    );

    let prevCalc = undefined;
    if (prevOb) {
      prevCalc = calculateObligationStatus(prevOb, payments);
    }

    return {
      enrollment,
      currentMonthObligation: currentOb,
      currentMonthPaid: currentCalc.paidAmount,
      currentMonthBalance: currentCalc.balance,
      currentMonthStatus: currentCalc.status,
      currentMonthPayments: currentCalc.matchingPayments,
      previousMonthObligation: prevOb,
      previousMonthPaid: prevCalc?.paidAmount,
      previousMonthBalance: prevCalc?.balance,
      previousMonthStatus: prevCalc?.status,
      previousMonthPayments: prevCalc?.matchingPayments,
    };
  });
}

export const SAMPLE_UPI_QR_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><rect width="200" height="200" fill="%23FFFFFF"/><rect x="20" y="20" width="50" height="50" fill="%23000000"/><rect x="26" y="26" width="38" height="38" fill="%23FFFFFF"/><rect x="32" y="32" width="26" height="26" fill="%23000000"/><rect x="130" y="20" width="50" height="50" fill="%23000000"/><rect x="136" y="26" width="38" height="38" fill="%23FFFFFF"/><rect x="142" y="32" width="26" height="26" fill="%23000000"/><rect x="20" y="130" width="50" height="50" fill="%23000000"/><rect x="26" y="136" width="38" height="38" fill="%23FFFFFF"/><rect x="32" y="142" width="26" height="26" fill="%23000000"/><rect x="85" y="25" width="10" height="20" fill="%23000000"/><rect x="105" y="25" width="10" height="10" fill="%23000000"/><rect x="85" y="55" width="30" height="10" fill="%23000000"/><rect x="25" y="85" width="20" height="10" fill="%23000000"/><rect x="55" y="85" width="10" height="30" fill="%23000000"/><rect x="85" y="85" width="30" height="30" fill="%23007AFF"/><rect x="90" y="90" width="20" height="20" fill="%23FFFFFF"/><text x="100" y="104" font-family="sans-serif" font-size="10" font-weight="bold" fill="%23007AFF" text-anchor="middle">UPI</text><rect x="130" y="85" width="15" height="15" fill="%23000000"/><rect x="160" y="85" width="20" height="10" fill="%23000000"/><rect x="85" y="130" width="10" height="30" fill="%23000000"/><rect x="105" y="145" width="25" height="15" fill="%23000000"/><rect x="145" y="130" width="20" height="20" fill="%23000000"/><rect x="130" y="165" width="40" height="15" fill="%23000000"/></svg>`;

/**
 * Admin-configured payment destinations for each subject and faculty.
 * Strictly configured and managed by Academy Admin.
 */
export const SAMPLE_PAYMENT_DESTINATIONS: PaymentDestination[] = [
  {
    id: "dest-math-azhar",
    subjectName: "Mathematics",
    teacherId: "tch-azhar",
    teacherName: "Azhar Sir",
    upiId: "azhar.maths@okaxis",
    accountHolderName: "Aroush Academy - Azhar Sir Faculty Account",
    bankName: "State Bank of India",
    accountNumber: "••••••••5812",
    ifscCode: "SBIN0001234",
    branchName: "Park Circus Branch, Kolkata",
    qrImageUrl: SAMPLE_UPI_QR_SVG,
    isActive: true,
    notes: "Verified official faculty tuition receiving destination for Mathematics batches.",
    lastUpdated: "2026-10-01",
    updatedBy: "Academy Admin Office",
  },
  {
    id: "dest-phys-alvi",
    subjectName: "Physics",
    teacherId: "tch-alvi",
    teacherName: "Dr. Tariq Alvi",
    upiId: "tariq.alvi@okhdfcbank",
    accountHolderName: "Aroush Academy - Science Faculty Account",
    bankName: "HDFC Bank",
    accountNumber: "••••••••9934",
    ifscCode: "HDFC0000456",
    branchName: "CIT Road Branch, Kolkata",
    qrImageUrl: SAMPLE_UPI_QR_SVG,
    isActive: true,
    notes: "Approved destination for Physics coursework.",
    lastUpdated: "2026-10-01",
    updatedBy: "Academy Admin Office",
  },
  {
    id: "dest-chem-alvi",
    subjectName: "Chemistry",
    teacherId: "tch-alvi",
    teacherName: "Dr. Tariq Alvi",
    upiId: "tariq.alvi@okhdfcbank",
    accountHolderName: "Aroush Academy - Science Faculty Account",
    bankName: "HDFC Bank",
    accountNumber: "••••••••9934",
    ifscCode: "HDFC0000456",
    branchName: "CIT Road Branch, Kolkata",
    isActive: true,
    notes: "Approved destination for Chemistry coursework.",
    lastUpdated: "2026-10-01",
    updatedBy: "Academy Admin Office",
  },
  {
    id: "dest-acc-roy",
    subjectName: "Accountancy",
    teacherId: "tch-roy",
    teacherName: "Prof. N. Roy",
    upiId: "nroy.commerce@okicici",
    accountHolderName: "Aroush Academy - Commerce Faculty Account",
    bankName: "ICICI Bank",
    accountNumber: "••••••••7721",
    ifscCode: "ICIC0000128",
    branchName: "Mullick Bazar Branch, Kolkata",
    isActive: true,
    notes: "Commerce batch tuition destination.",
    lastUpdated: "2026-10-01",
    updatedBy: "Academy Admin Office",
  },
  {
    id: "dest-econ-roy",
    subjectName: "Economics",
    teacherId: "tch-roy",
    teacherName: "Prof. N. Roy",
    upiId: "nroy.commerce@okicici",
    accountHolderName: "Aroush Academy - Commerce Faculty Account",
    bankName: "ICICI Bank",
    accountNumber: "••••••••7721",
    ifscCode: "ICIC0000128",
    branchName: "Mullick Bazar Branch, Kolkata",
    isActive: true,
    notes: "Economics batch tuition destination.",
    lastUpdated: "2026-10-01",
    updatedBy: "Academy Admin Office",
  },
];

/**
 * Sample payment submissions tracking online UPI and Bank Transfer submissions
 * from students and parents.
 */
export const SAMPLE_PAYMENT_SUBMISSIONS: PaymentSubmission[] = [
  {
    id: "subm-2026-10-001",
    studentId: "std-102",
    studentName: "Ananya Verma",
    subjectName: "Mathematics",
    teacherId: "tch-azhar",
    teacherName: "Azhar Sir",
    enrollmentId: "enr-102-math",
    obligationId: "ob-102-math-2026-10",
    monthLabel: "October 2026",
    amount: 500,
    paymentMethod: "upi",
    referenceId: "UPI202610129845",
    transferDate: "2026-10-12",
    status: "pending",
    submittedAt: "2026-10-12T10:30:00.000Z",
    submittedByRole: "student",
    submittedByName: "Ananya Verma",
    destinationSnapshot: {
      upiId: "azhar.maths@okaxis",
      accountHolderName: "Aroush Academy - Azhar Sir Faculty Account",
      bankName: "State Bank of India",
      ifscCode: "SBIN0001234",
    },
  },
  {
    id: "subm-2026-10-002",
    studentId: "std-105",
    studentName: "Rohan Mukherjee",
    subjectName: "Mathematics",
    teacherId: "tch-azhar",
    teacherName: "Azhar Sir",
    enrollmentId: "enr-105-math",
    obligationId: "ob-105-math-2026-10",
    monthLabel: "October 2026",
    amount: 1400,
    paymentMethod: "upi",
    referenceId: "UPI-DUP-REF-105",
    transferDate: "2026-10-09",
    status: "rejected",
    submittedAt: "2026-10-09T14:15:00.000Z",
    submittedByRole: "student",
    submittedByName: "Rohan Mukherjee",
    rejectionReason: "Transaction reference UTR could not be verified in the bank statement. Please verify and submit the correct UTR.",
    destinationSnapshot: {
      upiId: "azhar.maths@okaxis",
      accountHolderName: "Aroush Academy - Azhar Sir Faculty Account",
      bankName: "State Bank of India",
      ifscCode: "SBIN0001234",
    },
  },
  {
    id: "subm-2026-09-004",
    studentId: "std-102",
    studentName: "Ananya Verma",
    subjectName: "Mathematics",
    teacherId: "tch-azhar",
    teacherName: "Azhar Sir",
    enrollmentId: "enr-102-math",
    obligationId: "ob-102-math-2026-09",
    monthLabel: "September 2026",
    amount: 1500,
    paymentMethod: "upi",
    referenceId: "UPI-REF-66219",
    transferDate: "2026-09-10",
    status: "verified",
    submittedAt: "2026-09-10T12:00:00.000Z",
    submittedByRole: "student",
    submittedByName: "Ananya Verma",
    verifiedAt: "2026-09-10T15:30:00.000Z",
    verifiedBy: "Academy Admin Office",
    receiptNumber: "REC-2026-09-002",
  },
];

/**
 * Sample fee adjustments (discounts, fee waivers, administrative corrections).
 */
export const SAMPLE_FEE_ADJUSTMENTS: FeeAdjustment[] = [
  {
    id: "adj-2026-10-001",
    obligationId: "ob-104-econ-2026-10",
    enrollmentId: "enr-104-econ",
    studentId: "std-104",
    studentName: "Fatima Sheikh",
    subjectName: "Economics",
    monthLabel: "October 2026",
    adjustmentType: "discount",
    amount: 200,
    reason: "Merit-based sibling discount approved by Academy Admin",
    authorizedBy: "Academy Admin Office",
    createdAt: "2026-10-02T10:00:00.000Z",
  },
];

/**
 * Sample verified receipts.
 */
export const SAMPLE_FEE_RECEIPTS: VerifiedFeeReceipt[] = [
  {
    id: "rec-2026-10-001",
    receiptNumber: "REC-2026-10-001",
    paymentTransactionId: "tx-801",
    obligationId: "ob-101-math-2026-10",
    enrollmentId: "enr-101-math",
    studentId: "std-101",
    studentName: "Taha Rahman",
    classGrade: "Class X",
    guardianName: "Mrs. Amina Rahman",
    subjectName: "Mathematics",
    teacherId: "tch-azhar",
    teacherName: "Azhar Sir",
    monthLabel: "October 2026",
    amountReceived: 1500,
    paymentMethod: "cash",
    referenceId: "CSH-2026-1004-01",
    verifiedDate: "2026-10-04",
    issuedBy: "Academy Admin Office",
    remainingBalanceAfterPayment: 0,
  },
  {
    id: "rec-2026-09-002",
    receiptNumber: "REC-2026-09-002",
    submissionId: "subm-2026-09-004",
    paymentTransactionId: "tx-807",
    obligationId: "ob-102-math-2026-09",
    enrollmentId: "enr-102-math",
    studentId: "std-102",
    studentName: "Ananya Verma",
    classGrade: "Class X",
    guardianName: "Sunita Verma",
    subjectName: "Mathematics",
    teacherId: "tch-azhar",
    teacherName: "Azhar Sir",
    monthLabel: "September 2026",
    amountReceived: 1500,
    paymentMethod: "online",
    referenceId: "UPI-REF-66219",
    verifiedDate: "2026-09-10",
    issuedBy: "Academy Admin Office",
    remainingBalanceAfterPayment: 0,
  },
  {
    id: "rec-2026-10-003",
    receiptNumber: "REC-2026-10-003",
    paymentTransactionId: "tx-801",
    obligationId: "ob-101-math-2026-10",
    enrollmentId: "enr-101-math",
    studentId: "std-101",
    studentName: "Taha Rahman",
    classGrade: "Class X",
    guardianName: "Tariq Rahman",
    subjectName: "Mathematics",
    teacherId: "tch-azhar",
    teacherName: "Azhar Sir",
    monthLabel: "October 2026",
    amountReceived: 1500,
    paymentMethod: "cash",
    referenceId: "CSH-2026-1004-01",
    verifiedDate: "2026-10-04",
    issuedBy: "Azhar Sir",
    remainingBalanceAfterPayment: 0,
  },
];

/**
 * Standard fee configurations per subject and grade level.
 */
export const SAMPLE_FEE_CONFIGURATIONS: FeeConfigurationRule[] = [
  {
    id: "cfg-class10-math",
    subjectName: "Mathematics",
    classGrade: "Class X",
    monthlyFee: 1500,
    effectiveFrom: "2026-04-01",
    billingDueDay: 15,
    notes: "Standard monthly fee for Class X Mathematics (ICSE/CBSE).",
  },
  {
    id: "cfg-class10-phys",
    subjectName: "Physics",
    classGrade: "Class X",
    monthlyFee: 1400,
    effectiveFrom: "2026-04-01",
    billingDueDay: 15,
    notes: "Class X Physics lab + theory.",
  },
  {
    id: "cfg-class10-chem",
    subjectName: "Chemistry",
    classGrade: "Class X",
    monthlyFee: 1400,
    effectiveFrom: "2026-04-01",
    billingDueDay: 15,
    notes: "Class X Chemistry coursework.",
  },
  {
    id: "cfg-class12-math",
    subjectName: "Mathematics",
    classGrade: "Class XII",
    monthlyFee: 1800,
    effectiveFrom: "2026-04-01",
    billingDueDay: 15,
    notes: "Higher secondary advanced Mathematics.",
  },
  {
    id: "cfg-class12-acc",
    subjectName: "Accountancy",
    classGrade: "Class XII",
    monthlyFee: 1800,
    effectiveFrom: "2026-04-01",
    billingDueDay: 15,
    notes: "Higher secondary Commerce Accountancy.",
  },
  {
    id: "cfg-class12-econ",
    subjectName: "Economics",
    classGrade: "Class XII",
    monthlyFee: 1600,
    effectiveFrom: "2026-04-01",
    billingDueDay: 15,
    notes: "Higher secondary Economics.",
  },
  {
    id: "cfg-class9-math",
    subjectName: "Mathematics",
    classGrade: "Class IX",
    monthlyFee: 1400,
    effectiveFrom: "2026-04-01",
    billingDueDay: 15,
    notes: "Foundation Mathematics for Class IX.",
  },
];

/**
 * Calculates net balance and status considering obligations, verified payments, and adjustments.
 */
export function calculateAccountBalance(
  obligation: MonthlyFeeObligation,
  payments: PaymentTransaction[],
  adjustments: FeeAdjustment[] = []
): {
  originalFee: number;
  totalAdjustments: number;
  netCharge: number;
  paidAmount: number;
  balance: number;
  status: FeePaymentStatus;
  matchingPayments: PaymentTransaction[];
  matchingAdjustments: FeeAdjustment[];
} {
  const matchingPayments = payments.filter((p) => p.obligationId === obligation.id);
  const matchingAdjustments = adjustments.filter((a) => a.obligationId === obligation.id);

  const originalFee = obligation.feeAmount;
  const totalAdjustments = matchingAdjustments.reduce((sum, a) => sum + a.amount, 0);
  const netCharge = Math.max(0, originalFee - totalAdjustments);

  const paidAmount = matchingPayments.reduce((sum, p) => sum + p.amount, 0);
  const balance = Math.max(0, netCharge - paidAmount);

  let status: FeePaymentStatus = "unpaid";
  if (paidAmount >= netCharge && netCharge >= 0) {
    status = "paid";
  } else if (paidAmount > 0) {
    status = "partially-paid";
  } else {
    // Current date threshold
    const dueDate = new Date(obligation.dueDate);
    const now = new Date("2026-10-10");
    if (dueDate < now) {
      status = "overdue";
    } else {
      status = "unpaid";
    }
  }

  return {
    originalFee,
    totalAdjustments,
    netCharge,
    paidAmount,
    balance,
    status,
    matchingPayments,
    matchingAdjustments,
  };
}

/**
 * Generates a collision-resistant unique receipt number.
 */
export function generateUniqueReceiptNumber(existingReceipts: VerifiedFeeReceipt[]): string {
  const yearMonth = "2026-10";
  let maxSeq = 0;
  for (const r of existingReceipts) {
    const match = r.receiptNumber.match(/REC-\d{4}-\d{2}-(\d+)/);
    if (match) {
      const seq = parseInt(match[1], 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  }
  const nextSeq = String(maxSeq + 1).padStart(3, "0");
  return `REC-${yearMonth}-${nextSeq}`;
}

/**
 * Calculates initial billing fee according to the Aroush Academy mid-month joining policy:
 * - Students joining on or before the 15th of the month are charged full fee (100%).
 * - Students joining after the 15th of the month receive a 50% pro-rata orientation fee.
 */
export function calculateMidMonthFee(
  joiningDateStr: string,
  standardFee: number
): { fee: number; policyApplied: string } {
  try {
    const date = new Date(joiningDateStr);
    const day = date.getDate();
    if (isNaN(day)) {
      return { fee: standardFee, policyApplied: "Standard full monthly fee (invalid date format fallback)" };
    }
    if (day > 15) {
      const discounted = Math.round(standardFee * 0.5);
      return {
        fee: discounted,
        policyApplied: `Mid-month joining on day ${day} (after 15th): 50% pro-rata orientation fee applied.`,
      };
    }
    return {
      fee: standardFee,
      policyApplied: `Standard full monthly fee (joined on or before 15th: day ${day}).`,
    };
  } catch {
    return { fee: standardFee, policyApplied: "Standard monthly fee" };
  }
}

/**
 * Checks if a bill already exists for the given student, subject, and month.
 */
export function isBillDuplicate(
  studentId: string,
  subjectName: string,
  month: string,
  obligations: MonthlyFeeObligation[]
): boolean {
  return obligations.some(
    (o) => o.studentId === studentId && o.subjectName.toLowerCase() === subjectName.toLowerCase() && o.month === month
  );
}

