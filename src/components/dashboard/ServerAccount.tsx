"use client";

import { useEffect, useState } from "react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

export function ServerAccount({ admin }: { admin: boolean }) {
  const [accounts, setAccounts] = useState<{ id: string; name: string; identifier: string; role: string; status: string }[]>([]);
  const [message, setMessage] = useState("");
  const [handoff, setHandoff] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!admin) return;
    const controller = new AbortController();
    fetch("/api/admin/accounts", { signal: controller.signal, cache: "no-store" })
      .then((response) => response.json()).then((result) => { if (result.ok) setAccounts(result.accounts); }).catch(() => {});
    return () => controller.abort();
  }, [admin]);

  async function submit(event: React.FormEvent<HTMLFormElement>, url: string) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setHandoff("");
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form));
    try {
      const response = await fetch(url, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error("Request could not be completed. Check details or try again later.");
      form.reset();
      if (result.activationToken || result.token) {
        setHandoff(result.activationToken ?? result.token);
        setMessage("Code shown once. Verify the recipient's identity manually before handing it over. It is not sent automatically.");
      } else {
        setMessage("Password changed. Existing sessions were revoked. Sign in again.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Request unavailable.");
    } finally {
      setBusy(false);
    }
  }

  const field = { padding: "var(--space-3)", border: "1px solid var(--color-input-border)", borderRadius: "var(--radius-sm)", width: "100%", maxWidth: 420, background: "var(--color-surface)" };
  return <div style={{ display: "grid", gap: "var(--space-4)" }}>
    <Card><h2>Change password</h2>
      <form onSubmit={(event) => { void submit(event, "/api/auth/change-password"); }} style={{ display: "grid", gap: "var(--space-3)", marginTop: "var(--space-3)" }}>
        <label>Current password<br /><input style={field} required type="password" name="currentPassword" autoComplete="current-password" /></label>
        <label>New password (at least 12 characters)<br /><input style={field} required minLength={12} type="password" name="newPassword" autoComplete="new-password" /></label>
        <Button type="submit" disabled={busy}>Change password</Button>
      </form>
    </Card>
    {admin && <>
       <Card><h2>Provision a teacher account</h2><p>Creates an inactive database account and teacher profile. Assign subject qualifications under Academic Setup &amp; Batches after the account holder activates their password.</p>
        <form onSubmit={(event) => { void submit(event, "/api/admin/teachers"); }} style={{ display: "grid", gap: "var(--space-3)", marginTop: "var(--space-3)" }}>
          <label>Teacher name<br /><input style={field} required name="name" /></label>
          <label>Email<br /><input style={field} required type="email" name="email" /></label>
          <label>Phone (optional)<br /><input style={field} type="tel" name="phone" /></label>
          <Button type="submit" disabled={busy}>Create teacher</Button>
        </form>
      </Card>
      <Card><h2>Credential handoff</h2><p>First verify the account holder&apos;s identity offline. Re-enter your admin password to issue a single-use code. Recovery lasts 30 minutes; activation lasts 24 hours. No message is sent automatically.</p>
        <form onSubmit={(event) => { void submit(event, "/api/admin/recovery"); }} style={{ display: "grid", gap: "var(--space-3)", marginTop: "var(--space-3)" }}>
          <label>Code type<br /><select name="purpose" style={field}><option value="recovery">Password recovery</option><option value="activation">Reissue activation</option></select></label>
          <label>Account<br /><select name="userId" required style={field} defaultValue=""><option value="">Select account</option>
            {accounts.map((account) => <option value={account.id} key={account.id}>{account.name} - {account.role} - {account.status} - {account.identifier}</option>)}
          </select></label>
          <label>Admin password<br /><input style={field} required type="password" name="adminPassword" autoComplete="current-password" /></label>
          <Button type="submit" disabled={busy}>Issue one-time code</Button>
        </form>
      </Card>
    </>}
    {message && <p role="status">{message}</p>}
    {handoff && <p style={{ overflowWrap: "anywhere" }}>One-time code: <strong>{handoff}</strong>. Enter at <a href="/activate">Set up password</a>. This code will not be shown again.</p>}
  </div>;
}
