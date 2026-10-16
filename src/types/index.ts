/**
 * Shared Type Definitions for ArousH Academy
 */

export type UserRole =
  | "academy-admin"
  | "teacher"
  | "student"
  | "parent";

export type PaymentMethod = "cash" | "online";

export type FeePaymentStatus = "paid" | "partially-paid" | "unpaid" | "overdue";

export interface TeacherProfile {
  id: string;
  name: string;
  assignedSubjects: string[];
  batches: string[];
  email: string;
  status?: "active" | "inactive";
}

export type { AcademicClass, AcademicBoard, AcademicSubject } from "@/data/academicMasterData";

export interface StudentProfile {
  id: string;
  name: string;
  classGrade: string;
  board: "ICSE" | "CBSE" | "West Bengal Board";
  guardianName: string;
  guardianPhone: string;
  joiningDate: string;
  studentStatus: "active" | "inactive" | "on-leave";
  accountLinkStatus?: "unlinked" | "invited" | "linked";
  linkedUserIdentifier?: string;
}

export interface SubjectEnrollment {
  id: string;
  studentId: string;
  studentName: string;
  classGrade: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  batchName: string;
  batchId?: string;
  enrollmentDate: string;
  monthlyFeeAmount: number;
  status: "active" | "paused" | "completed";
}

export interface MonthlyFeeObligation {
  id: string;
  enrollmentId: string;
  studentId: string;
  studentName: string;
  subjectName: string;
  teacherId: string;
  month: string;
  monthLabel: string;
  feeAmount: number;
  dueDate: string;
}

export interface PaymentTransaction {
  id: string;
  obligationId: string;
  enrollmentId: string;
  studentId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  referenceId: string;
  collectedByRole: "teacher" | "academy-admin";
  collectedByName: string;
  isGatewayVerified: boolean;
  notes?: string;
}

export interface EnrollmentFeeSummary {
  enrollment: SubjectEnrollment;
  currentMonthObligation: MonthlyFeeObligation;
  currentMonthPaid: number;
  currentMonthBalance: number;
  currentMonthStatus: FeePaymentStatus;
  currentMonthPayments: PaymentTransaction[];
  previousMonthObligation?: MonthlyFeeObligation;
  previousMonthPaid?: number;
  previousMonthBalance?: number;
  previousMonthStatus?: FeePaymentStatus;
  previousMonthPayments?: PaymentTransaction[];
}

export interface PaymentDestination {
  id: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  upiId: string;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
  qrImageUrl?: string;
  isActive: boolean;
  notes?: string;
  lastUpdated: string;
  updatedBy: string;
}

export type PaymentSubmissionStatus = "pending" | "verified" | "rejected" | "cancelled";

export interface PaymentSubmission {
  id: string;
  studentId: string;
  studentName: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  enrollmentId: string;
  obligationId: string;
  monthLabel: string;
  amount: number;
  paymentMethod: "upi" | "bank_transfer" | "cash";
  referenceId?: string;
  transferDate: string;
  proofFileName?: string;
  proofFileSize?: number;
  proofFileType?: string;
  proofFileData?: string;
  status: PaymentSubmissionStatus;
  submittedAt: string;
  submittedByRole: "student" | "parent" | "academy-admin";
  submittedByName: string;
  rejectionReason?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  receiptNumber?: string;
  destinationSnapshot?: {
    upiId: string;
    accountHolderName: string;
    bankName: string;
    ifscCode: string;
  };
}

export interface FeeAdjustment {
  id: string;
  obligationId: string;
  enrollmentId: string;
  studentId: string;
  studentName?: string;
  subjectName?: string;
  monthLabel?: string;
  adjustmentType: "discount" | "waiver" | "correction" | "penalty" | "refund";
  amount: number;
  reason: string;
  authorizedBy: string;
  createdAt: string;
}

export interface FeeConfigurationRule {
  id: string;
  enrollmentId?: string;
  subjectName: string;
  classGrade: string;
  monthlyFee: number;
  effectiveFrom: string;
  billingDueDay: number;
  notes?: string;
  revisedFrom?: number;
  revisedAt?: string;
  revisedBy?: string;
}

export interface VerifiedFeeReceipt {
  id: string;
  receiptNumber: string;
  submissionId?: string;
  paymentTransactionId: string;
  obligationId: string;
  enrollmentId: string;
  studentId: string;
  studentName: string;
  classGrade: string;
  guardianName: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  monthLabel: string;
  amountReceived: number;
  paymentMethod: string;
  referenceId: string;
  verifiedDate: string;
  issuedBy: string;
  remainingBalanceAfterPayment: number;
}

export interface RoleDescriptor {
  role: UserRole;
  title: string;
  badge: string;
  description: string;
  targetPath: string;
  highlights: string[];
}

export interface NavLink {
  label: string;
  href: string;
  isExternal?: boolean;
}

export interface CookiePreferences {
  necessary: boolean; // Always true, cannot be disabled
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  consented: boolean;
  updatedAt?: string;
}

export interface MetricItem {
  id: string;
  label: string;
  value: string;
  delta?: string;
  deltaType?: "positive" | "negative" | "warning" | "neutral";
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: "Admissions & Accounts" | "Courses & Online Classes" | "Tests & Certifications" | "Fees & Payments" | "Digital IDs & Support";
  reviewNotes?: string;
}

export interface FeatureHighlight {
  id: string;
  title: string;
  description: string;
  category: string;
  tag: string;
}

export interface PricingTier {
  id: string;
  name: string;
  badge?: string;
  isPopular?: boolean;
  illustrativePrice: string;
  billingPeriod: string;
  targetScale: string;
  description: string;
  features: string[];
  ctaLabel: string;
  ctaHref?: string;
}

export interface OnboardingStep {
  stepNumber: number;
  title: string;
  tagline: string;
  description: string;
  keyOutcomes: string[];
}

export interface HeroContent {
  eyebrow: string;
  headline: string;
  subheadline: string;
  description: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  image: {
    src: string;
    alt: string;
    fallbackLabel: string;
  };
  floatingBadges: Array<{
    id: string;
    text: string;
    subtext?: string;
    icon: string;
  }>;
  trustStats: Array<{
    id: string;
    value: string;
    label: string;
    sublabel: string;
  }>;
}

export interface MarqueeItem {
  id: string;
  text: string;
  tag?: string;
  highlight?: boolean;
}

export interface CourseGroup {
  id: string;
  classes: string;
  badge: string;
  focusTitle: string;
  description: string;
  subjects: string[];
  scheduleNote: string;
}

export interface FacultyMember {
  id: string;
  name: string;
  role: string;
  subjects: string;
  bio: string;
  tag: string;
  avatarText: string;
}

export interface TeachingPillar {
  id: string;
  title: string;
  summary: string;
  tag: string;
}

export interface AcademyCenterInfo {
  centerName: string;
  founder: string;
  address: string;
  landmark: string;
  phones: string[];
  emails: string[];
  hoursSummary: Array<{
    days: string;
    time: string;
  }>;
}

export type DayOfWeek = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

export interface TimetableSlot {
  id: string;
  dayOfWeek: DayOfWeek;
  time: string;
  startTime?: string;
  endTime?: string;
  subjectId?: string;
  subject: string;
  batchId?: string;
  batch: string;
  classGrade: string;
  teacherId: string;
  teacherName: string;
  room?: string;
  roomId?: string;
  status?: "active" | "cancelled";
  scheduleType?: "recurring" | "specific_date";
  specificDate?: string;
  effectiveFrom?: string;
  effectiveUntil?: string;
}

export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export interface AttendanceAuditEntry {
  id: string;
  timestamp: string;
  performedBy: string;
  performedByRole: UserRole;
  previousStatus: AttendanceStatus;
  newStatus: AttendanceStatus;
  reason: string;
  previousRemarks?: string;
  newRemarks?: string;
}

export interface AttendanceRecord {
  id: string;
  sessionId?: string;
  studentId: string;
  studentName: string;
  subject: string;
  subjectId?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  status: AttendanceStatus;
  teacherId: string;
  batch: string;
  batchId?: string;
  remarks?: string;
  recordedBy?: string;
  recordedByRole?: UserRole;
  createdAt?: string;
  updatedAt?: string;
  auditTrail?: AttendanceAuditEntry[];
}

export type AssessmentType =
  | "regular-class-test"
  | "periodic-unit-test"
  | "board-mock-test"
  | "online-mock-exam";

export type AssessmentStatus = "draft" | "scheduled" | "completed" | "published";

export interface CertificatePolicy {
  enabled: boolean;
  minPercentage: number;
  certificateTitle?: string;
  certificateType?: "merit" | "mock-completion";
}

export interface AssessmentRecord {
  id: string;
  title: string;
  subject: string;
  batch: string;
  classGrade: string;
  date: string;
  totalMarks: number;
  teacherId: string;
  type?: AssessmentType;
  status?: AssessmentStatus;
  certificatePolicy?: CertificatePolicy;
  studentScores: Array<{
    studentId: string;
    studentName: string;
    marksObtained: number;
    status: "evaluated" | "absent" | "pending";
    feedback?: string;
  }>;
  linkedMockExamId?: string;
}

export interface IssuedCertificateRecord {
  id: string;
  certificateNumber: string;
  certificateType: "merit" | "mock-completion";
  title: string;
  studentId: string;
  studentName: string;
  classGrade: string;
  board: string;
  subject: string;
  assessmentId: string;
  assessmentName: string;
  assessmentDate: string;
  scoreObtained: number;
  totalMarks: number;
  percentage: number;
  criteriaMet: string;
  issuedDate: string;
  issuedBy: string;
  issuedByRole: UserRole;
  facultyName: string;
  status: "issued" | "revoked";
  revokedDate?: string;
  revokedBy?: string;
  revocationReason?: string;
}

export type StudyMaterialType =
  | "PDF Notes"
  | "Worksheet"
  | "Practice Paper"
  | "Formula Sheet"
  | "Assignment"
  | "Handout"
  | (string & {});

export type MaterialPublicationStatus = "draft" | "published";

export interface StudyMaterialItem {
  id: string;
  title: string;
  subject: string;
  classGrade: string;
  batchName?: string;
  type: StudyMaterialType;
  size: string;
  uploadedBy: string;
  teacherId: string;
  date: string;
  createdAt?: string;
  content?: string;
  description?: string;
  status?: MaterialPublicationStatus;
  fileName?: string;
  fileType?: string;
  fileSizeBytes?: number;
  fileUrl?: string;
  hasPhysicalFile?: boolean;
  isSimulatedUpload?: boolean;
  storageRef?: string;
}

export interface NoticeItem {
  id: string;
  title: string;
  category: "Academic" | "Examination" | "Holiday" | "Administration";
  date: string;
  content: string;
  author: string;
  priority: "normal" | "urgent";
  targetRoles: UserRole[];
}

export interface BatchDefinition {
  id: string;
  name: string;
  subject: string;
  classGrade: string;
  teacherId: string;
  teacherName: string;
  capacity: number;
  enrolledCount: number;
  schedule: string;
  monthlyFee: number;
  status: "active" | "full" | "upcoming";
}

export type AuditActionType =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "APPROVE"
  | "REJECT"
  | "CANCEL"
  | "LOGIN"
  | "LOGOUT"
  | "RESTORE"
  | "EXPORT";

export type AuditCategory = "financial" | "enrollment" | "security" | "system";

export type AuditOutcome = "SUCCESS" | "FAILURE";

export interface AuditFieldChange {
  fieldName: string;
  before?: unknown;
  after?: unknown;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  performedBy: string;
  actorRole?: UserRole | "system";
  action: string;
  actionType?: AuditActionType;
  target: string;
  entityType?: string;
  entityId?: string;
  details: string;
  type: AuditCategory;
  outcome?: AuditOutcome;
  changedFields?: string[];
  diff?: AuditFieldChange[];
  sourcePortal?: UserRole | "system";
  correlationId?: string;
}

export type MeetingProvider = "google-meet" | "zoom" | "other";

export type ClassroomSessionStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
  | "upcoming"
  | "live-demo";

export interface ClassroomSession {
  id: string;
  timetableSlotId?: string;
  batchId?: string;
  batchName: string;
  subject: string;
  subjectId?: string;
  classGrade: string;
  teacherId: string;
  teacherName: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes?: number;
  topic: string;
  instructions?: string[] | string;
  status: ClassroomSessionStatus;
  meetingProvider?: MeetingProvider;
  meetingUrl?: string;
  meetingLinkDemo?: string;
  recordingAvailable?: boolean;
  notes?: string;
}

export interface ClassroomChatMessage {
  id: string;
  sessionId: string;
  senderName: string;
  senderRole: UserRole;
  senderId: string;
  text: string;
  timestamp: string;
  isSystem?: boolean;
}

export interface ClassroomParticipant {
  id: string;
  name: string;
  role: UserRole;
  isOnline: boolean;
  isAudioMuted: boolean;
  isVideoEnabled: boolean;
  isHandRaised: boolean;
  isCurrentPresenter?: boolean;
}

export interface MockExamQuestion {
  id: string;
  questionNumber: number;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  marks: number;
  explanation?: string;
}

export interface MockExam {
  id: string;
  title: string;
  subject: string;
  classGrade: string;
  batchName: string;
  teacherId: string;
  teacherName: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks?: number;
  questions: MockExamQuestion[];
  instructions: string[];
  status: "published" | "draft";
}

export interface ExamAttemptResult {
  examId: string;
  studentId: string;
  studentName: string;
  totalQuestions: number;
  totalMarks: number;
  scoreObtained: number;
  percentage: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  passingMarks?: number;
  isPassed?: boolean;
  timeTakenSeconds: number;
  submittedAt: string;
  submissionType: "manual" | "timeout";
  answers: Record<string, number | null>;
  reviewFlags: Record<string, boolean>;
}

export interface AcademicCertificateData {
  id: string;
  certificateNumber: string;
  certificateType: "merit" | "mock-completion";
  title: string;
  studentId: string;
  studentName: string;
  classGrade: string;
  board: string;
  subject: string;
  assessmentName: string;
  assessmentDate: string;
  scoreObtained: number;
  totalMarks: number;
  percentage: number;
  criteriaMet: string;
  issuedDate: string;
  facultyName: string;
}

export type StudentIdCardStatus =
  | "draft"
  | "pending-approval"
  | "approved"
  | "rejected"
  | "expired"
  | "inactive";

export interface IdCardHistoryEntry {
  id: string;
  timestamp: string;
  action:
    | "created"
    | "updated"
    | "submitted"
    | "approved"
    | "rejected"
    | "reissued"
    | "renewed"
    | "deactivated";
  actorRole: UserRole;
  actorName: string;
  notes?: string;
}

export interface StudentIdCardRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentFormattedId: string;
  photoUrl?: string;
  classGrade: string;
  board: string;
  session: string;
  joiningDate: string;
  enrolledSubjects: string[];
  batches: string[];
  guardianName: string;
  guardianPhone: string;
  emergencyContact?: string;
  campusName: string;
  campusAddress: string;
  campusPhone: string;
  campusEmail: string;
  validFrom: string;
  validThru: string;
  status: StudentIdCardStatus;
  createdAt: string;
  updatedAt: string;
  issuedAt?: string;
  issuedBy?: string;
  rejectionReason?: string;
  deactivationReason?: string;
  history: IdCardHistoryEntry[];
}

