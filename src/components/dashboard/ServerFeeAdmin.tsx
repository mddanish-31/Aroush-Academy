"use client";

import type { FormEvent } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { kolkataToday, parseRupees, rupees, type FeeData } from "./feeTypes";

type Props = { data: FeeData; busy: boolean; send: (path: string, method: string, payload: Record<string, unknown>) => Promise<void> };
const field = (event: FormEvent<HTMLFormElement>) => new FormData(event.currentTarget);
const amount = (data: FormData) => parseRupees(String(data.get("amount") ?? ""));

export function ServerFeeAdmin({ data, busy, send }: Props) {
  const submit = (event: FormEvent<HTMLFormElement>, action: string) => {
    event.preventDefault();
    const values = field(event);
    const amountPaise = amount(values);
    if (!amountPaise) { event.currentTarget.querySelector<HTMLInputElement>('input[name="amount"]')?.setCustomValidity("Enter an amount greater than zero, with up to two decimal places."); event.currentTarget.reportValidity(); return; }
    const requestKey = crypto.randomUUID();
    if (action === "obligation") void send("/api/fees", "POST", { action, enrollmentId: values.get("enrollment"), periodKey: values.get("period"), dueOn: values.get("date"), amountPaise, requestKey });
    if (action === "cash") void send("/api/fees", "POST", { action, obligationId: values.get("obligation"), collectedOn: values.get("date"), amountPaise, requestKey });
    if (action === "adjustment") void send("/api/fees", "POST", { action, obligationId: values.get("obligation"), kind: values.get("kind"), reason: values.get("reason"), amountPaise, requestKey });
  };
  return <>
    <Card><h3>Central receiving details</h3><p>Only an administrator can change receiving details. Re-enter your password to save.</p>
      <form onSubmit={(event) => { event.preventDefault(); const values = field(event); event.currentTarget.querySelector<HTMLInputElement>('input[name="password"]')!.value = ""; void send("/api/fees/payee", "PUT", { name: values.get("name"), upiId: values.get("upi"), phone: values.get("phone"), adminPassword: values.get("password"), version: data.payeeVersion ?? null }); }} style={{ display: "grid", gap: "var(--space-3)" }}>
        <label>Approved payee name <input name="name" required minLength={2} maxLength={100} defaultValue={data.payee?.name ?? ""} /></label>
        <label>UPI ID <input name="upi" maxLength={128} defaultValue={data.payee?.upiId ?? ""} placeholder="Optional" /></label>
        <label>Payment phone (+91) <input name="phone" maxLength={13} defaultValue={data.payee?.phone ?? ""} placeholder="Optional" /></label>
        <label>Administrator password <input name="password" type="password" required autoComplete="current-password" /></label>
        <Button type="submit" disabled={busy}>Save receiving details</Button>
      </form>
    </Card>
    <Card><h3>Create obligation</h3><p>Enter the amount, period and due date explicitly. This does not schedule recurring billing.</p>
      <form onSubmit={(event) => submit(event, "obligation")} style={{ display: "grid", gap: "var(--space-3)" }}>
        <label>Enrollment <select name="enrollment" required defaultValue=""><option value="" disabled>Select enrollment</option>{data.enrollments.map((item) => <option value={item.id} key={item.id}>{item.studentName} ({item.id.slice(0, 8)})</option>)}</select></label>
        <label>Period <input name="period" required minLength={2} maxLength={80} /></label>
        <label>Amount in rupees <input name="amount" required inputMode="decimal" onInput={(event) => event.currentTarget.setCustomValidity("")} /></label>
        <label>Due date (Asia/Kolkata) <input name="date" type="date" required defaultValue={kolkataToday()} /></label>
        <Button type="submit" disabled={busy || !data.enrollments.length}>Create obligation</Button>
      </form>
    </Card>
    {data.obligations.length === 0 ? <Card><p role="status">No obligations on this page.</p></Card> : <Card><h3>Obligations and dues</h3><ul>{data.obligations.map((item) => <li key={item.id}>{item.studentName}: {item.periodKey}, due {item.dueOn}, {rupees(item.balancePaise)} remaining of {rupees(item.amountPaise)}</li>)}</ul></Card>}
    <Card><h3>Record cash collection</h3><p>{data.payee?.name ? `Central payee: ${data.payee.name}` : "Configure the approved payee name before recording cash."}</p>
      <form onSubmit={(event) => submit(event, "cash")} style={{ display: "grid", gap: "var(--space-3)" }}>
        <ObligationSelect data={data} />
        <label>Collected amount in rupees <input name="amount" required inputMode="decimal" onInput={(event) => event.currentTarget.setCustomValidity("")} /></label>
        <label>Collection date (Asia/Kolkata) <input name="date" type="date" required defaultValue={kolkataToday()} /></label>
        <Button type="submit" disabled={busy || !data.payee?.name || !data.obligations.some((item) => item.balancePaise > 0)}>Issue cash receipt</Button>
      </form>
    </Card>
    <Card><h3>Discount or waiver</h3><p>Provide an explicit reason. Posted adjustments cannot be removed.</p>
      <form onSubmit={(event) => submit(event, "adjustment")} style={{ display: "grid", gap: "var(--space-3)" }}>
        <ObligationSelect data={data} />
        <label>Type <select name="kind"><option value="discount">Discount</option><option value="waiver">Waiver</option></select></label>
        <label>Amount in rupees <input name="amount" required inputMode="decimal" onInput={(event) => event.currentTarget.setCustomValidity("")} /></label>
        <label>Reason <input name="reason" required minLength={2} maxLength={500} /></label>
        <Button type="submit" disabled={busy || !data.obligations.some((item) => item.balancePaise > 0)}>Record adjustment</Button>
      </form>
    </Card>
    <Card><h3>Pending UPI review</h3>{data.pending.length ? <ul>{data.pending.map((item) => <li key={item.id} style={{ padding: "var(--space-3) 0", borderBottom: "1px solid var(--color-border)" }}>
      <p>{rupees(item.amountPaise)}, reference {item.referenceId}, transfer date {item.transferOn}{item.reusedReference ? ". Reference reused - investigate before approving." : ""}</p>
      <p>Do not approve based only on a reference, screenshot or UPI app return. Check the receiving account independently.</p>
      <label><input type="checkbox" id={`verify-${item.id}`} onChange={(event) => event.currentTarget.setCustomValidity("")} /> I checked settlement in the receiving account</label>
      <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
        <Button disabled={busy} onClick={() => { const check = document.querySelector<HTMLInputElement>(`#verify-${item.id}`)!; if (!check.checked) { check.setCustomValidity("Confirm that settlement was checked independently."); check.reportValidity(); return; } void send("/api/fees", "PATCH", { id: item.id, decision: "verify", confirmVerification: true }); }}>Verify and issue receipt</Button>
        <label>Rejection reason <input id={`reason-${item.id}`} maxLength={500} onInput={(event) => event.currentTarget.setCustomValidity("")} /></label>
        <Button variant="secondary" disabled={busy} onClick={() => { const input = document.querySelector<HTMLInputElement>(`#reason-${item.id}`)!; const reason = input.value.trim(); if (reason.length < 2) { input.setCustomValidity("Enter a rejection reason with at least two characters."); input.reportValidity(); return; } void send("/api/fees", "PATCH", { id: item.id, decision: "reject", reason }); }}>Reject</Button>
      </div>
    </li>)}</ul> : <p role="status">No submissions awaiting review.</p>}</Card>
    <Card><h3>Receipts</h3>{data.receipts.length ? <ul>{data.receipts.map((item) => <li key={item.receiptNumber}>{item.receiptNumber}: {item.studentName}, {rupees(item.amountPaise)}, {item.method}, {item.collectedOn}</li>)}</ul> : <p>No receipts on this page.</p>}</Card>
    {data.adjustments.length > 0 && <Card><h3>Adjustment history</h3><ul>{data.adjustments.map((item) => <li key={item.id}>{item.kind}: {rupees(item.amountPaise)}, {item.reason}</li>)}</ul></Card>}
  </>;
}

function ObligationSelect({ data }: { data: FeeData }) {
  return <label>Obligation <select name="obligation" required defaultValue=""><option value="" disabled>Select obligation</option>{data.obligations.filter((item) => item.balancePaise > 0).map((item) => <option key={item.id} value={item.id}>{item.studentName}: {item.periodKey}, due {rupees(item.balancePaise)}</option>)}</select></label>;
}
