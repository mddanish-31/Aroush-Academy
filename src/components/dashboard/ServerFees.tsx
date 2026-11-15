"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { ServerFeeAdmin } from "./ServerFeeAdmin";
import { ServerFeePayer } from "./ServerFeePayer";
import type { FeeData } from "./feeTypes";

type Role = "academy-admin" | "student" | "parent";

export function ServerFees({ role, studentId }: { role: Role; studentId?: string }) {
  const [data, setData] = useState<FeeData | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(0);
  const [pendingPage, setPendingPage] = useState(0);
  const [enrollmentPage, setEnrollmentPage] = useState(0);
  const inFlight = useRef(false);
  const retry = useRef<{ fingerprint: string; key: string } | null>(null);
  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const params = new URLSearchParams({ page: String(page), pendingPage: String(pendingPage), enrollmentPage: String(enrollmentPage) });
      if (studentId) params.set("studentId", studentId);
      const response = await fetch(`/api/fees?${params}`, { cache: "no-store", signal });
      if (!response.ok) throw new Error(response.status === 403 ? "You do not have access to this fee record." : "Unable to load fees. Try again.");
      const result: FeeData = await response.json();
      if (!signal?.aborted) { setData(result); setError(""); }
    } catch (caught) {
      if (!signal?.aborted) setError(caught instanceof Error ? caught.message : "Unable to load fees.");
    } finally { if (!signal?.aborted) setBusy(false); }
  }, [page, pendingPage, enrollmentPage, studentId]);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => load(controller.signal));
    return () => controller.abort();
  }, [load]);

  async function send(path: string, method: string, payload: Record<string, unknown>) {
    if (inFlight.current) return;
    inFlight.current = true;
    setNotice("");
    const fingerprint = JSON.stringify([path, method, { ...payload, requestKey: undefined }]);
    if (method === "POST") {
      if (retry.current?.fingerprint !== fingerprint) retry.current = { fingerprint, key: crypto.randomUUID() };
      payload.requestKey = retry.current.key;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch(path, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!response.ok) {
        const result: { reason?: string } = await response.json();
        throw new Error(result.reason === "conflict" ? "This record changed or the request was already used. Refresh and try again." : result.reason === "invalid_request" ? "Check the entered values and try again." : result.reason === "unavailable" ? "Receiving details are not configured." : "Unable to save. Try again.");
      }
      retry.current = null;
      await load();
      setNotice("Saved. Refresh if the updated ledger is not shown.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to save."); }
    finally { inFlight.current = false; setBusy(false); }
  }

  return <section aria-label="Fees" style={{ display: "grid", gap: "var(--space-4)" }}>
    <h2 style={{ fontSize: "var(--text-2xl)" }}>Fees and receipts</h2>
    {error && <p role="alert">{error} <Button variant="secondary" onClick={() => { void load(); }}>Retry</Button></p>}
    {notice && <p role="status">{notice}</p>}
    {!data && !error && <p role="status">Loading fees...</p>}
    {data && (role === "academy-admin" ? <ServerFeeAdmin data={data} busy={busy} send={send} /> : <ServerFeePayer data={data} busy={busy} studentId={studentId} send={send} page={page} />)}
    {data && role === "academy-admin" && <Card><h3>Enrollment choices</h3>
      <Button variant="secondary" disabled={busy || enrollmentPage === 0} onClick={() => setEnrollmentPage(enrollmentPage - 1)}>Previous enrollments</Button>
      <span> Page {enrollmentPage + 1} </span>
      <Button variant="secondary" disabled={busy || !data.enrollmentHasMore} onClick={() => setEnrollmentPage(enrollmentPage + 1)}>Next enrollments</Button>
      <h3>UPI review queue</h3>
      <Button variant="secondary" disabled={busy || pendingPage === 0} onClick={() => setPendingPage(pendingPage - 1)}>Previous submissions</Button>
      <span> Page {pendingPage + 1} </span>
      <Button variant="secondary" disabled={busy || !data.pendingHasMore} onClick={() => setPendingPage(pendingPage + 1)}>Next submissions</Button>
    </Card>}
    {data && <Card><div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center" }}>
      <Button variant="secondary" disabled={busy || page === 0} onClick={() => { setData(null); setPage(page - 1); }}>Previous</Button>
      <span>Page {page + 1}</span>
      <Button variant="secondary" disabled={busy || !data.hasMore} onClick={() => { setData(null); setPage(page + 1); }}>Next</Button>
    </div></Card>}
  </section>;
}
