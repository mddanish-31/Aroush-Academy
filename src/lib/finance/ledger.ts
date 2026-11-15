import "server-only";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { audit_logs } from "@/db/schema/audit";
import { enrollments } from "@/db/schema/cohorts";
import { number_sequences } from "@/db/schema/config";
import { fee_adjustments, fee_allocations, fee_obligations, fee_payments, fee_receipts, payment_submissions } from "@/db/schema/finance";
import { parent_student_links, parents, students } from "@/db/schema/people";
import { getPayee } from "./payee";
import { fail, isDate, isMoney, isUuid, lockedBalance, type FinanceTx } from "./rules";

type Actor = { id: string; name: string; role: string };
type Input = Record<string, unknown>;
const validText = (value: unknown, max: number): value is string => typeof value === "string" && value.trim().length >= 2 && value.trim().length <= max;
const audit = (tx: FinanceTx, actor: Actor, action: string, id: string, details: string) => tx.insert(audit_logs).values({ performed_by_id: actor.id, performed_by_name: actor.name, actor_role: actor.role, action, action_type: "CREATE", category: "finance", target: id, entity_id: id, details, source_portal: actor.role === "academy-admin" ? "admin" : actor.role });

async function payerStudent(actor: Actor, studentId: unknown) {
  if (actor.role === "academy-admin") {
    if (studentId == null) return null;
    if (!isUuid(studentId)) return fail("invalid_request", 400);
    return studentId;
  }
  if (actor.role === "student") {
    const [own] = await db.select({ id: students.id }).from(students).where(eq(students.user_id, actor.id)).limit(1);
    if (!own || (studentId != null && studentId !== own.id)) return fail("forbidden", 403);
    return own.id;
  }
  if (actor.role === "parent") {
    if (!isUuid(studentId)) return fail("invalid_request", 400);
    const [link] = await db.select({ id: parent_student_links.id }).from(parent_student_links)
      .innerJoin(parents, eq(parents.id, parent_student_links.parent_id))
      .where(and(eq(parents.user_id, actor.id), eq(parent_student_links.student_id, studentId), eq(parent_student_links.is_verified, true))).limit(1);
    if (!link) return fail("forbidden", 403);
    return studentId;
  }
  return fail("forbidden", 403);
}

export async function readFees(actor: Actor, studentId: unknown, page: number, pendingPage = 0, enrollmentPage = 0) {
  if ([page, pendingPage, enrollmentPage].some((item) => !Number.isInteger(item) || item < 0 || item > 10000)) return fail("invalid_request", 400);
  const scope = await payerStudent(actor, studentId);
  const rows = await db.select({ id: fee_obligations.id, enrollmentId: fee_obligations.enrollment_id, studentId: fee_obligations.student_id,
    studentName: students.name, periodKey: fee_obligations.period_key, amountPaise: fee_obligations.amount_paise, dueOn: fee_obligations.due_on,
    createdAt: fee_obligations.created_at }).from(fee_obligations).innerJoin(students, eq(students.id, fee_obligations.student_id))
    .where(scope ? eq(fee_obligations.student_id, scope) : undefined)
    .orderBy(desc(fee_obligations.created_at), desc(fee_obligations.id)).limit(31).offset(page * 30);
  const visible = rows.slice(0, 30);
  const ids = visible.map((row) => row.id);
  const [adjustments, payments, receipts, submissions, pending, availableEnrollments, payee, adjustmentTotals, allocationTotals] = await Promise.all([
    ids.length ? db.select({ id: fee_adjustments.id, obligationId: fee_adjustments.obligation_id, amountPaise: fee_adjustments.amount_paise, kind: fee_adjustments.kind, reason: fee_adjustments.reason }).from(fee_adjustments).where(inArray(fee_adjustments.obligation_id, ids)).limit(300) : [],
    ids.length ? db.select({ id: fee_payments.id, obligationId: fee_payments.obligation_id, amountPaise: fee_payments.amount_paise, method: fee_payments.method, collectedOn: fee_payments.collected_on }).from(fee_payments).where(inArray(fee_payments.obligation_id, ids)).orderBy(desc(fee_payments.created_at)).limit(300) : [],
    ids.length ? db.select({ receiptNumber: fee_receipts.receipt_number, paymentId: fee_receipts.payment_id, studentName: fee_receipts.student_name, amountPaise: fee_receipts.amount_paise, method: fee_receipts.method, collectedOn: fee_receipts.collected_on }).from(fee_receipts).innerJoin(fee_payments, eq(fee_payments.id, fee_receipts.payment_id)).where(inArray(fee_payments.obligation_id, ids)).orderBy(desc(fee_receipts.issued_at)).limit(300) : [],
    ids.length ? db.select({ id: payment_submissions.id, obligationId: payment_submissions.obligation_id, amountPaise: payment_submissions.amount_paise, referenceId: payment_submissions.reference_id, transferOn: payment_submissions.transfer_on, status: payment_submissions.status, reviewReason: payment_submissions.review_reason }).from(payment_submissions).where(inArray(payment_submissions.obligation_id, ids)).orderBy(desc(payment_submissions.created_at)).limit(300) : [],
    actor.role === "academy-admin" ? db.select({ id: payment_submissions.id, obligationId: payment_submissions.obligation_id, studentId: payment_submissions.student_id, amountPaise: payment_submissions.amount_paise, referenceId: payment_submissions.reference_id, transferOn: payment_submissions.transfer_on }).from(payment_submissions).where(eq(payment_submissions.status, "pending")).orderBy(desc(payment_submissions.created_at), desc(payment_submissions.id)).limit(51).offset(pendingPage * 50) : [],
    actor.role === "academy-admin" ? db.select({ id: enrollments.id, studentId: enrollments.student_id, studentName: students.name }).from(enrollments).innerJoin(students, eq(students.id, enrollments.student_id)).orderBy(desc(enrollments.created_at), desc(enrollments.id)).limit(101).offset(enrollmentPage * 100) : [],
    getPayee(),
    ids.length ? db.select({ obligationId: fee_adjustments.obligation_id, amount: sql<number>`sum(${fee_adjustments.amount_paise})::int` }).from(fee_adjustments).where(inArray(fee_adjustments.obligation_id, ids)).groupBy(fee_adjustments.obligation_id) : [],
    ids.length ? db.select({ obligationId: fee_allocations.obligation_id, amount: sql<number>`sum(${fee_allocations.amount_paise})::int` }).from(fee_allocations).where(inArray(fee_allocations.obligation_id, ids)).groupBy(fee_allocations.obligation_id) : [],
  ]);
  const duplicate = new Set<string>();
  if (pending.length) {
    const references = [...new Set(pending.map((item) => item.referenceId))];
    const duplicates = await db.select({ referenceId: payment_submissions.reference_id, count: sql<number>`count(*)::int` }).from(payment_submissions).where(inArray(payment_submissions.reference_id, references)).groupBy(payment_submissions.reference_id).having(sql`count(*) > 1`).limit(50);
    duplicates.forEach((item) => duplicate.add(item.referenceId));
  }
  return { obligations: visible.map((row) => ({ ...row, balancePaise: row.amountPaise - (adjustmentTotals.find((item) => item.obligationId === row.id)?.amount ?? 0) - (allocationTotals.find((item) => item.obligationId === row.id)?.amount ?? 0) })), adjustments, payments, receipts, submissions,
    pending: pending.slice(0, 50).map((item) => ({ ...item, reusedReference: duplicate.has(item.referenceId) })), pendingHasMore: pending.length > 50,
    enrollments: availableEnrollments.slice(0, 100), enrollmentHasMore: availableEnrollments.length > 100,
    payee: payee.value, payeeVersion: actor.role === "academy-admin" ? payee.version : undefined, hasMore: rows.length > 30 };
}

async function postPayment(tx: FinanceTx, actor: Actor, obligationId: string, amount: number, method: "cash" | "upi", collectedOn: string, requestKey: string, submissionId?: string, referenceId?: string) {
  const { obligation, balance } = await lockedBalance(tx, obligationId);
  if (amount > balance) return fail("conflict", 409);
  const [student] = await tx.select({ name: students.name }).from(students).where(eq(students.id, obligation.student_id)).limit(1);
  if (!student) return fail("not_found", 404);
  const [payment] = await tx.insert(fee_payments).values({ obligation_id: obligationId, student_id: obligation.student_id, amount_paise: amount, method, collected_on: collectedOn, request_key: requestKey, collected_by_id: actor.id, submission_id: submissionId, reference_id: referenceId }).returning({ id: fee_payments.id });
  await tx.insert(fee_allocations).values({ payment_id: payment.id, obligation_id: obligationId, amount_paise: amount });
  const year = Number(collectedOn.slice(0, 4));
  const [sequence] = await tx.insert(number_sequences).values({ kind: "fee-receipt", year, last_value: 1 }).onConflictDoUpdate({ target: [number_sequences.kind, number_sequences.year], set: { last_value: sql`${number_sequences.last_value} + 1`, updated_at: sql`now()` } }).returning({ value: number_sequences.last_value });
  const receiptNumber = `FEE-${year}-${String(sequence.value).padStart(6, "0")}`;
  await tx.insert(fee_receipts).values({ payment_id: payment.id, receipt_number: receiptNumber, student_id: obligation.student_id, student_name: student.name, amount_paise: amount, method, collected_on: collectedOn, issued_by_id: actor.id });
  await audit(tx, actor, "fee_payment_posted", payment.id, `${method} ${amount} paise; receipt ${receiptNumber}; obligation ${obligationId}`);
  return { paymentId: payment.id, receiptNumber, studentName: student.name, amountPaise: amount, method, collectedOn };
}

export async function createFee(input: Input, actor: Actor) {
  if (actor.role === "academy-admin" && input.action === "obligation") {
    if (!isUuid(input.enrollmentId) || !isUuid(input.requestKey) || !validText(input.periodKey, 80) || !isMoney(input.amountPaise) || !isDate(input.dueOn)) return fail("invalid_request", 400);
    return { item: await db.transaction(async (tx) => {
      const [enrollment] = await tx.select({ studentId: enrollments.student_id }).from(enrollments).where(eq(enrollments.id, input.enrollmentId as string)).for("share").limit(1);
      if (!enrollment) return fail("not_found", 404);
      const [item] = await tx.insert(fee_obligations).values({ enrollment_id: input.enrollmentId as string, student_id: enrollment.studentId, period_key: (input.periodKey as string).trim(), amount_paise: input.amountPaise as number, due_on: input.dueOn as string, request_key: input.requestKey as string, created_by_id: actor.id }).returning();
      await audit(tx, actor, "fee_obligation_created", item.id, `${item.amount_paise} paise; period ${item.period_key}`);
      return item;
    }) };
  }
  if (actor.role === "academy-admin" && input.action === "cash") {
    if (!isUuid(input.obligationId) || !isUuid(input.requestKey) || !isMoney(input.amountPaise) || !isDate(input.collectedOn)) return fail("invalid_request", 400);
    if (!(await getPayee()).value?.name) return fail("unavailable", 503);
    return { receipt: await db.transaction((tx) => postPayment(tx, actor, input.obligationId as string, input.amountPaise as number, "cash", input.collectedOn as string, input.requestKey as string)) };
  }
  if (actor.role === "academy-admin" && input.action === "adjustment") {
    if (!isUuid(input.obligationId) || !isUuid(input.requestKey) || !isMoney(input.amountPaise) || !["discount", "waiver"].includes(String(input.kind)) || !validText(input.reason, 500)) return fail("invalid_request", 400);
    return { item: await db.transaction(async (tx) => {
      const { balance } = await lockedBalance(tx, input.obligationId as string);
      if (input.amountPaise as number > balance) return fail("conflict", 409);
      const [item] = await tx.insert(fee_adjustments).values({ obligation_id: input.obligationId as string, amount_paise: input.amountPaise as number, kind: input.kind as string, reason: (input.reason as string).trim(), request_key: input.requestKey as string, authorized_by_id: actor.id }).returning();
      await audit(tx, actor, "fee_adjustment_created", item.id, `${item.kind} ${item.amount_paise} paise; ${item.reason}`);
      return item;
    }) };
  }
  if ((actor.role === "student" || actor.role === "parent") && input.action === "submit") {
    if (!isUuid(input.obligationId) || !isUuid(input.requestKey) || !isMoney(input.amountPaise) || !isDate(input.transferOn) || !validText(input.referenceId, 100) || !/^[A-Za-z0-9/-]{2,100}$/.test(input.referenceId)) return fail("invalid_request", 400);
    if (!(await getPayee()).value?.upiId) return fail("unavailable", 503);
    const scope = await payerStudent(actor, input.studentId);
    return { item: await db.transaction(async (tx) => {
      const { obligation, balance } = await lockedBalance(tx, input.obligationId as string);
      if (obligation.student_id !== scope) return fail("forbidden", 403);
      if (input.amountPaise as number > balance) return fail("conflict", 409);
      const [item] = await tx.insert(payment_submissions).values({ obligation_id: obligation.id, student_id: obligation.student_id, amount_paise: input.amountPaise as number, reference_id: (input.referenceId as string).trim().toUpperCase(), transfer_on: input.transferOn as string, request_key: input.requestKey as string, submitted_by_id: actor.id }).returning();
      await audit(tx, actor, "upi_submission_pending", item.id, `Reference submitted for manual review; obligation ${obligation.id}`);
      return item;
    }) };
  }
  if (actor.role !== "academy-admin") return fail("forbidden", 403);
  return fail("invalid_request", 400);
}

export async function reviewSubmission(input: Input, actor: Actor) {
  if (actor.role !== "academy-admin") return fail("forbidden", 403);
  if (!isUuid(input.id) || (input.decision !== "verify" && input.decision !== "reject") ||
    (input.decision === "verify" && input.confirmVerification !== true) ||
    (input.decision === "reject" && !validText(input.reason, 500))) return fail("invalid_request", 400);
  return db.transaction(async (tx) => {
    const [target] = await tx.select({ obligationId: payment_submissions.obligation_id }).from(payment_submissions).where(eq(payment_submissions.id, input.id as string)).limit(1);
    if (!target) return fail("not_found", 404);
    const { obligation, balance } = await lockedBalance(tx, target.obligationId);
    const [submission] = await tx.select().from(payment_submissions).where(eq(payment_submissions.id, input.id as string)).for("update").limit(1);
    if (!submission || submission.status !== "pending" || obligation.student_id !== submission.student_id) return fail("conflict", 409);
    if (input.decision === "verify" && submission.amount_paise > balance) return fail("conflict", 409);
    const receipt = input.decision === "verify"
      ? await postPayment(tx, actor, submission.obligation_id, submission.amount_paise, "upi", submission.transfer_on, submission.request_key, submission.id, submission.reference_id)
      : null;
    await tx.update(payment_submissions).set({ status: receipt ? "verified" : "rejected", reviewed_by_id: actor.id, reviewed_at: sql`now()`, review_reason: receipt ? null : (input.reason as string).trim() }).where(eq(payment_submissions.id, submission.id));
    await audit(tx, actor, receipt ? "upi_submission_verified" : "upi_submission_rejected", submission.id, receipt ? `Manually verified; receipt ${receipt.receiptNumber}` : (input.reason as string).trim());
    return { receipt, status: receipt ? "verified" : "rejected" };
  });
}
