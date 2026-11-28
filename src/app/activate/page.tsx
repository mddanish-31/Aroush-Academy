"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function ActivatePage() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return <main style={{ maxWidth: 560, margin: "var(--space-8) auto", padding: "var(--space-4)" }}>
    <Card><h1>Set up your password</h1>
      <p>Enter the one-time code given to you after identity verification. Activation codes expire after 24 hours; recovery codes expire after 30 minutes.</p>
      <form onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setMessage("");
        const form = event.currentTarget;
        try {
          const response = await fetch("/api/auth/credential", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
            body: JSON.stringify(Object.fromEntries(new FormData(form))) });
          if (!response.ok) throw new Error("Code invalid, expired or already used. Contact the academy for help.");
          form.reset();
          setMessage("Password set. Sign in with your account identifier.");
        } catch (error) { setMessage(error instanceof Error ? error.message : "Could not set password."); }
        finally { setBusy(false); }
      }} style={{ display: "grid", gap: "var(--space-4)", marginTop: "var(--space-5)" }}>
        <label>Code type<br /><select name="purpose" required style={{ width: "100%", padding: "var(--space-3)", border: "1px solid var(--color-input-border)", backgroundColor: "var(--color-surface)", color: "var(--color-primary)", borderRadius: "var(--radius-md)" }}>
          <option value="activation">New account activation</option><option value="recovery">Password recovery</option>
        </select></label>
        <label>One-time code<br /><input name="token" required autoComplete="off" style={{ width: "100%", padding: "var(--space-3)", border: "1px solid var(--color-input-border)", backgroundColor: "var(--color-surface)", color: "var(--color-primary)", borderRadius: "var(--radius-md)" }} /></label>
        <label>New password (at least 12 characters)<br /><input name="password" type="password" required minLength={12} autoComplete="new-password" style={{ width: "100%", padding: "var(--space-3)", border: "1px solid var(--color-input-border)", backgroundColor: "var(--color-surface)", color: "var(--color-primary)", borderRadius: "var(--radius-md)" }} /></label>
        <Button type="submit" disabled={busy}>Set password</Button>
      </form>
      {message && <p role="status" style={{ marginTop: "var(--space-4)" }}>{message}</p>}
      <p style={{ marginTop: "var(--space-4)" }}><Link href="/login">Return to sign in</Link></p>
    </Card>
  </main>;
}
