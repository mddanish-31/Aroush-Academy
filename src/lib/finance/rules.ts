import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { fee_adjustments, fee_allocations, fee_obligations } from "@/db/schema/finance";

export type FinanceTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export class FinanceError extends Error {
  constructor(public reason: "invalid_request" | "conflict" | "not_found" | "unavailable" | "forbidden", public status: 400 | 403 | 404 | 409 | 503) { super(reason); }
}

export const fail = (reason: FinanceError["reason"], status: FinanceError["status"]): never => { throw new FinanceError(reason, status); };
export const isUuid = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export const isMoney = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) > 0 && Number(value) <= 100000000;
export const isDate = (value: unknown): value is string => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value && value >= "2000-01-01" && value <= "2100-12-31";
export const academyToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

export async function lockedBalance(tx: FinanceTx, obligationId: string) {
  const [obligation] = await tx.select().from(fee_obligations).where(eq(fee_obligations.id, obligationId)).for("update").limit(1);
  if (!obligation) return fail("not_found", 404);
  const [adjustment] = await tx.select({ amount: sql<number>`coalesce(sum(${fee_adjustments.amount_paise}), 0)::int` }).from(fee_adjustments).where(eq(fee_adjustments.obligation_id, obligationId));
  const [allocation] = await tx.select({ amount: sql<number>`coalesce(sum(${fee_allocations.amount_paise}), 0)::int` }).from(fee_allocations).where(eq(fee_allocations.obligation_id, obligationId));
  return { obligation, balance: obligation.amount_paise - adjustment.amount - allocation.amount };
}

export function financeFailure(error: unknown) {
  if (error instanceof FinanceError) return error;
  const dbError = error as { code?: string; cause?: { code?: string } };
  if (dbError.code === "23505" || dbError.cause?.code === "23505") return new FinanceError("conflict", 409);
  if (dbError.code === "23503" || dbError.cause?.code === "23503" || dbError.code === "23514" || dbError.cause?.code === "23514") return new FinanceError("invalid_request", 400);
  return null;
}
