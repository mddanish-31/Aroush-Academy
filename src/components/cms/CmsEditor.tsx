"use client";

import { useEffect, useState } from "react";
import type { CmsContent } from "@/lib/cms/content";

type Path = (string | number)[];
type History = { id: string; version: number; action: string; createdAt: string };
type State = { draft: CmsContent; version: number; publishedVersion: number; history: History[] };

const groups: { label: string; path: Path }[] = [
  { label: "Site and contact", path: ["site"] },
  { label: "Hero", path: ["hero"] },
  { label: "Courses and subjects", path: ["landing", "courses"] },
  { label: "Faculty", path: ["landing", "faculty"] },
  { label: "FAQ", path: ["landing", "faqs"] },
  { label: "Gallery and media", path: ["media"] },
  { label: "Other sections", path: ["landing"] },
];

function at(value: unknown, path: Path): unknown {
  let current = value;
  for (const part of path) current = (current as Record<string | number, unknown>)[part];
  return current;
}

function setAt(value: CmsContent, path: Path, next: unknown): CmsContent {
  const copy = structuredClone(value);
  let current: Record<string | number, unknown> = copy as unknown as Record<string | number, unknown>;
  for (const part of path.slice(0, -1)) current = current[part] as Record<string | number, unknown>;
  current[path[path.length - 1]] = next;
  return copy;
}

function label(name: string) {
  return name.replaceAll("_", " ").replace(/([a-z])([A-Z])/g, "$1 $2");
}

function Fields({ value, path, onChange, name }: { value: unknown; path: Path; onChange: (path: Path, value: unknown) => void; name: string }) {
  if (Array.isArray(value)) return (
    <fieldset style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", borderRadius: "var(--radius-md)", padding: 16, marginBottom: 16, minWidth: 0 }}>
      <legend style={{ padding: "0 6px", fontWeight: 600, color: "var(--brand-navy)" }}>{label(name)}</legend>
      {value.map((item, index) => <div key={index} style={{ borderBottom: "1px solid var(--color-border-subtle)", paddingBottom: 12, marginBottom: 12 }}>
        <strong>{label(name)} {index + 1}</strong>
        <Fields value={item} path={[...path, index]} onChange={onChange} name="item" />
        {value.length > 1 && <button type="button" className="btn-secondary" style={{ marginTop: 8, fontSize: "var(--text-xs)" }} onClick={() => onChange(path, value.filter((_, current) => current !== index))}>Remove item</button>}
      </div>)}
      {value.length < 40 && value[0] && <button type="button" className="btn-soft" style={{ fontSize: "var(--text-xs)" }} onClick={() => {
        const item = structuredClone(value[0]);
        if (item && typeof item === "object" && "id" in item) item.id = crypto.randomUUID();
        onChange(path, [...value, item]);
      }}>Add item</button>}
    </fieldset>
  );
  if (value && typeof value === "object") return <div style={{ marginTop: 12 }}>
    {name !== "item" && <h3 style={{ fontSize: "1rem", marginBottom: 12 }}>{label(name)}</h3>}
    {Object.entries(value).map(([field, child]) => <Fields key={field} value={child} path={[...path, field]} onChange={onChange} name={field} />)}
  </div>;
  const id = path.join("-");
  if (typeof value === "boolean") return <label style={{ display: "block", margin: "12px 0" }}>
    <input type="checkbox" checked={value} onChange={(event) => onChange(path, event.target.checked)} /> {label(name)}
  </label>;
  const common = { id, value: String(value ?? ""), onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(path, typeof value === "number" ? Number(event.target.value) : event.target.value) };
  return <div style={{ margin: "12px 0" }}>
    <label htmlFor={id} style={{ display: "block", marginBottom: 4, fontWeight: 500, color: "var(--brand-navy)" }}>{label(name)}</label>
    {String(value).length > 90 || ["description", "summary", "answer", "bio"].includes(name)
      ? <textarea {...common} rows={4} maxLength={3000} style={{ width: "100%", padding: 10, border: "1px solid var(--color-input-border)", borderRadius: "var(--radius-md)", backgroundColor: "var(--color-surface)", color: "var(--color-primary)" }} />
      : <input {...common} type={typeof value === "number" ? "number" : "text"} maxLength={3000} style={{ width: "100%", padding: 10, border: "1px solid var(--color-input-border)", borderRadius: "var(--radius-md)", backgroundColor: "var(--color-surface)", color: "var(--color-primary)" }} />}
  </div>;
}

export function CmsEditor({ admin }: { admin: boolean }) {
  const [state, setState] = useState<State | null>(null);
  const [draft, setDraft] = useState<CmsContent | null>(null);
  const [section, setSection] = useState(0);
  const [status, setStatus] = useState("Loading content...");
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [developerName, setDeveloperName] = useState("");
  const [developerEmail, setDeveloperEmail] = useState("");
  const [activation, setActivation] = useState("");
  const [provisionStatus, setProvisionStatus] = useState("");

  async function load() {
    const response = await fetch("/api/cms", { cache: "no-store" });
    if (!response.ok) { setStatus("Content could not be loaded. Try again."); return; }
    const data = await response.json() as State;
    setState(data);
    setDraft(data.draft);
    setDirty(false);
    setStatus(data.version === data.publishedVersion ? "Published" : "Unpublished draft");
  }

  useEffect(() => {
    void fetch("/api/cms", { cache: "no-store" }).then(async (response) => {
      if (!response.ok) throw new Error("Content unavailable");
      const data = await response.json() as State;
      setState(data);
      setDraft(data.draft);
      setDirty(false);
      setStatus(data.version === data.publishedVersion ? "Published" : "Unpublished draft");
    }).catch(() => setStatus("Content could not be loaded. Try again."));
  }, []);

  async function act(action: "save" | "publish" | "rollback", revisionId?: string) {
    if (!state || !draft || busy) return;
    setBusy(true);
    setStatus(action === "save" ? "Saving..." : action === "publish" ? "Publishing..." : "Restoring...");
    try {
      const response = await fetch("/api/cms", { method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, version: state.version, draft, revisionId }) });
      if (response.status === 409) { setStatus("Edit conflict. Reload the latest version before saving."); return; }
      if (!response.ok) { setStatus("Save failed. Your unsaved edits remain here."); return; }
      await load();
      setStatus(action === "save" ? "Saved as unpublished draft" : action === "publish" ? "Published" : "Previous version restored and published");
    } catch { setStatus("Save failed. Your unsaved edits remain here."); }
    finally { setBusy(false); }
  }

  async function provision(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setActivation("");
    setProvisionStatus("Creating inactive account...");
    try {
      const response = await fetch("/api/admin/developers", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: developerName, email: developerEmail }) });
      const data = await response.json();
      if (!response.ok) { setProvisionStatus(response.status === 409 ? "Identifier already belongs to an account." : "Developer could not be provisioned."); return; }
      setActivation(data.activationToken);
      setProvisionStatus("Inactive developer account created. Complete an identity-checked handoff of this one-time code within 24 hours.");
      setDeveloperName("");
      setDeveloperEmail("");
    } catch { setProvisionStatus("Developer could not be provisioned."); }
    finally { setBusy(false); }
  }

  if (!draft || !state) return <p role="status">{status} <button type="button" onClick={() => void load()}>Try again</button></p>;
  const selected = groups[section];
  return <main className="container-narrow" style={{ padding: "48px 20px", maxWidth: 960 }}>
    <h1 style={{ fontFamily: "var(--font-display)" }}>Website content</h1>
    <p>Draft, preview, and publish the public website. Changes to receiving accounts, student records, and fees are outside this portal.</p>
    <p role="status" aria-live="polite">{status}</p>
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "24px 0" }}>
      <button type="button" className="btn-primary" disabled={busy} onClick={() => void act("save")}>Save draft</button>
      <button type="button" className="btn-accent" disabled={busy || dirty || state.version === state.publishedVersion} onClick={() => void act("publish")}>Publish saved draft</button>
      <a href="/developer/preview" className="btn-secondary" target="_blank" rel="noopener noreferrer">Preview saved draft</a>
    </div>
    <p>Image uploads are unavailable. Use existing approved Unsplash image URLs or local public paths. No payment or private file content belongs here.</p>
    <label htmlFor="cms-section" style={{ fontWeight: 600, color: "var(--brand-navy)" }}>Section</label>
    <select id="cms-section" value={section} onChange={(event) => setSection(Number(event.target.value))} style={{ display: "block", width: "100%", padding: 10, marginTop: 4, marginBottom: 20, border: "1px solid var(--color-input-border)", borderRadius: "var(--radius-md)", backgroundColor: "var(--color-surface)", color: "var(--color-primary)" }}>
      {groups.map((group, index) => <option key={group.label} value={index}>{group.label}</option>)}
    </select>
    <Fields value={at(draft, selected.path)} path={selected.path} onChange={(path, value) => {
      setDraft((current) => current ? setAt(current, path, value) : current);
      setDirty(true);
      setStatus("Unsaved changes");
    }} name={selected.label} />
    <h2 style={{ marginTop: 40 }}>History</h2>
    {state.history.length === 0 ? <p>No saved revisions yet.</p> : <ul>
      {state.history.map((entry) => <li key={entry.id} style={{ marginBottom: 10 }}>
        Version {entry.version}, {entry.action}, {new Date(entry.createdAt).toLocaleString()}
        {entry.action !== "save" && <button type="button" className="btn-secondary" disabled={busy || dirty} onClick={() => void act("rollback", entry.id)} style={{ marginLeft: 12, fontSize: "var(--text-xs)" }}>Restore</button>}
      </li>)}
    </ul>}
    {admin && <section style={{ marginTop: 48, borderTop: "1px solid var(--color-border)", paddingTop: 24 }}>
      <h2>Developer access</h2>
      <p>Create a content-only account. The recipient must use the one-time activation code to set a password.</p>
      <form onSubmit={(event) => void provision(event)} style={{ marginTop: 12 }}>
        <label htmlFor="developer-name" style={{ fontWeight: 500, color: "var(--brand-navy)" }}>Name</label>
        <input id="developer-name" required minLength={2} maxLength={100} value={developerName} onChange={(event) => setDeveloperName(event.target.value)} style={{ display: "block", padding: 10, width: "100%", marginTop: 4, marginBottom: 12, border: "1px solid var(--color-input-border)", borderRadius: "var(--radius-md)", backgroundColor: "var(--color-surface)", color: "var(--color-primary)" }} />
        <label htmlFor="developer-email" style={{ fontWeight: 500, color: "var(--brand-navy)" }}>Email</label>
        <input id="developer-email" type="email" required value={developerEmail} onChange={(event) => setDeveloperEmail(event.target.value)} style={{ display: "block", padding: 10, width: "100%", marginTop: 4, marginBottom: 12, border: "1px solid var(--color-input-border)", borderRadius: "var(--radius-md)", backgroundColor: "var(--color-surface)", color: "var(--color-primary)" }} />
        <button type="submit" className="btn-primary" disabled={busy}>Create inactive developer</button>
      </form>
      <p role="status">{provisionStatus}</p>
      {activation && <div><p>One-time activation code, shown only now:</p><output style={{ overflowWrap: "anywhere" }}>{activation}</output></div>}
    </section>}
  </main>;
}
