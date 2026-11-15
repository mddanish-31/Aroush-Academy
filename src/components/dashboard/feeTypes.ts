export type Obligation = { id: string; enrollmentId: string; studentId: string; studentName: string; periodKey: string; amountPaise: number; dueOn: string; balancePaise: number };
export type Receipt = { receiptNumber: string; paymentId: string; studentName: string; amountPaise: number; method: string; collectedOn: string };
export type Submission = { id: string; obligationId: string; studentId?: string; amountPaise: number; referenceId: string; transferOn: string; status?: string; reviewReason?: string | null; reusedReference?: boolean };
export type FeeData = {
  obligations: Obligation[];
  receipts: Receipt[];
  submissions: Submission[];
  pending: Submission[];
  adjustments: { id: string; obligationId: string; kind: string; amountPaise: number; reason: string }[];
  payments: { id: string; obligationId: string; method: string; amountPaise: number; collectedOn: string }[];
  enrollments: { id: string; studentId: string; studentName: string }[];
  payee: { name: string; upiId: string | null; phone: string | null } | null;
  payeeVersion?: string | null;
  hasMore: boolean;
  pendingHasMore: boolean;
  enrollmentHasMore: boolean;
};

export const rupees = (paise: number) => `₹${(paise / 100).toFixed(2)}`;
export function parseRupees(value: string) {
  if (!/^(?:0|[1-9]\d{0,6})(?:\.\d{1,2})?$/.test(value)) return null;
  const [whole, fraction = ""] = value.split(".");
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return amount > 0 && amount <= 100000000 ? amount : null;
}
export const kolkataToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
