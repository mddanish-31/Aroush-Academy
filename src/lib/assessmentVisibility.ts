import type { AssessmentRecord, StudentProfile, SubjectEnrollment } from "@/types";

export function isAssessmentVisibleToStudent(
  exam: AssessmentRecord,
  student: StudentProfile | null | undefined,
  enrollments: SubjectEnrollment[],
): boolean {
  if (!exam || !student) {
    return false;
  }
  if (exam.status !== "published") {
    return false;
  }
  if (exam.classGrade !== student.classGrade) {
    return false;
  }
  const examSubject = exam.subject.trim().toLowerCase();
  return (enrollments || []).some(
    (e) =>
      e.studentId === student.id &&
      (e.status || "active") === "active" &&
      e.subjectName.trim().toLowerCase() === examSubject,
  );
}

export function isEligibleForCertificate(
  exam: AssessmentRecord,
  marksObtained: number,
): boolean {
  if (!exam || exam.status !== "published" || !exam.certificatePolicy?.enabled) {
    return false;
  }
  const pct =
    exam.totalMarks > 0
      ? Math.round((marksObtained / exam.totalMarks) * 100)
      : 0;
  return pct >= exam.certificatePolicy.minPercentage;
}
