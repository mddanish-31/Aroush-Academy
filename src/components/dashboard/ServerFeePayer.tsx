"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { kolkataToday, parseRupees, rupees, type FeeData, type Obligation } from "./feeTypes";

type Props = { data: FeeData; busy: boolean; studentId?: string; page: number; send: (path: string, method: string, payload: Record<string, unknown>) => Promise<void> };

function UpiInstructions({ item, data, studentId, page, busy, send }: Props & { item: Obligation }) {
  const [amount, setAmount] = useState((item.balancePaise / 100).toFixed(2));
  const [copyMessage, setCopyMessage] = useState("");
  const amountPaise = parseRupees(amount);
  const valid = !!amountPaise && amountPaise <= item.balancePaise;
  const qrParams = new URLSearchParams({ obligationId: item.id, amountPaise: String(amountPaise), page: String(page) });
  if (studentId) qrParams.set("studentId", studentId);
  const qrUrl = `/api/fees/qr?${qrParams}`;
  const appUrl = data.payee?.upiId && amountPaise ? `upi://pay?${new URLSearchParams({ pa: data.payee.upiId, pn: data.payee.name, am: (amountPaise / 100).toFixed(2), cu: "INR" })}` : "";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid) return;
    const values = new FormData(event.currentTarget);
    void send("/api/fees", "POST", { action: "submit", studentId, obligationId: item.id, amountPaise, transferOn: values.get("transferOn"), referenceId: values.get("referenceId"), requestKey: crypto.randomUUID() });
  }

  return <div style={{ display: "grid", gap: "var(--space-3)" }}>
    <p>Payee: {data.payee?.name}. Verify these receiving details before paying. A UPI app return does not mean the fee is settled.</p>
    <p>UPI ID: {data.payee?.upiId} <Button size="sm" variant="secondary" onClick={async () => { try { await navigator.clipboard.writeText(data.payee?.upiId ?? ""); setCopyMessage("UPI ID copied."); } catch { setCopyMessage("Could not copy. Select and copy the UPI ID manually."); } }}>Copy UPI ID</Button></p>
    {data.payee?.phone && <p>Payment phone: {data.payee.phone}</p>}
    <label>Intended amount in rupees <input aria-label="Intended amount in rupees" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} /></label>
    {!valid && <p role="alert">Enter an amount above zero and no greater than the balance.</p>}
    {valid && <div style={{ display: "grid", gap: "var(--space-3)", justifyItems: "start" }}>
      <Image src={qrUrl} unoptimized alt={`UPI QR for ${data.payee?.name} and ${rupees(amountPaise)}`} width={256} height={256} style={{ maxWidth: "100%", height: "auto" }} />
      <a href={`${qrUrl}&download=1`}>Download QR</a>
      <a href={appUrl}>Open in UPI app for {rupees(amountPaise)}</a>
    </div>}
    {copyMessage && <p role="status">{copyMessage}</p>}
    <form onSubmit={submit} style={{ display: "grid", gap: "var(--space-3)" }}>
      <p>After transferring, submit a reference for manual review. No proof upload is available.</p>
      <label>Transfer date (Asia/Kolkata) <input type="date" name="transferOn" required defaultValue={kolkataToday()} /></label>
      <label>UPI reference <input name="referenceId" required minLength={2} maxLength={100} /></label>
      <Button type="submit" disabled={busy || !valid}>Submit for review</Button>
    </form>
  </div>;
}

export function ServerFeePayer({ data, busy, studentId, page, send }: Props) {
  return <>
    {!data.obligations.length && <Card><p role="status">No fee obligations on this page.</p></Card>}
    {data.obligations.map((item) => <Card key={item.id}>
      <h3>{item.periodKey}</h3><p>{item.studentName}, due {item.dueOn}. Balance {rupees(item.balancePaise)} of {rupees(item.amountPaise)}.</p>
      {item.balancePaise > 0 && (data.payee?.upiId ? <UpiInstructions item={item} data={data} busy={busy} studentId={studentId} page={page} send={send} /> : <p>UPI payments are unavailable until the academy configures receiving details. Ask the administrator about cash collection.</p>)}
      {data.submissions.filter((submission) => submission.obligationId === item.id).map((submission) => <p key={submission.id}>UPI reference {submission.referenceId}: {submission.status}{submission.reviewReason ? `, ${submission.reviewReason}` : ""}. {rupees(submission.amountPaise)}. {submission.status === "pending" ? "Not yet settled in this ledger." : ""}</p>)}
      {data.payments.filter((payment) => payment.obligationId === item.id).map((payment) => <p key={payment.id}>Collected {rupees(payment.amountPaise)} by {payment.method} on {payment.collectedOn}.</p>)}
      {data.adjustments.filter((adjustment) => adjustment.obligationId === item.id).map((adjustment) => <p key={adjustment.id}>{adjustment.kind}: {rupees(adjustment.amountPaise)}. {adjustment.reason}</p>)}
    </Card>)}
    <Card><h3>Receipts</h3>{data.receipts.length ? <ul>{data.receipts.map((receipt) => <li key={receipt.receiptNumber}>{receipt.receiptNumber}: {receipt.studentName}, {rupees(receipt.amountPaise)} by {receipt.method} on {receipt.collectedOn}</li>)}</ul> : <p role="status">No receipts on this page.</p>}</Card>
  </>;
}
