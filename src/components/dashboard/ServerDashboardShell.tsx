"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/lib/auth/AuthContext";
import { ROLE_DISPLAY_NAMES } from "@/lib/auth/authTypes";
import type { UserRole } from "@/types";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { ServerAttendance } from "./ServerAttendance";
import { ServerAccount } from "./ServerAccount";
import { ServerSetup } from "./ServerSetup";
import { ServerAssignments } from "./ServerAssignments";
import { ServerFees } from "./ServerFees";
import { ServerAcademic } from "./ServerAcademic";

const RegistrationsModule = dynamic(() =>
  import("./RegistrationsModule").then((module) => module.RegistrationsModule)
);

export function ServerDashboardShell({ navigation }: { navigation: Record<UserRole, string[]> }) {
  const { serverAuth, refreshIdentity, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [selectedChildId, setSelectedChildId] = useState("");

  let message = "";
  if (serverAuth.status === "loading") message = "Loading your workspace...";
  if (serverAuth.status === "unauthenticated") message = "Sign in to access your workspace.";
  if (serverAuth.status === "error") message = "Your account could not be loaded or signed out. Your session may still be active. Please try again.";
  if (serverAuth.status === "authenticated" && serverAuth.user.profileStatus === "missing") {
    message = "Your account setup is incomplete. Contact the academy.";
  }

  if (message || serverAuth.status !== "authenticated") {
    return (
      <div style={{ padding: "var(--space-6)", maxWidth: "760px", margin: "0 auto" }}>
        <Card>
          <h1 style={{ fontSize: "var(--text-2xl)", marginBottom: "var(--space-4)" }}>Your workspace</h1>
          <p role={serverAuth.status === "error" ? "alert" : "status"}>{message}</p>
          <div style={{ marginTop: "var(--space-4)" }}>
            {serverAuth.status === "error" && (
              <Button onClick={() => { void refreshIdentity(); }}>Try again</Button>
            )}
            {serverAuth.status === "unauthenticated" && <Button href="/login">Sign in</Button>}
            {serverAuth.status === "authenticated" && <Button onClick={() => { void logout(); }}>Sign out</Button>}
          </div>
        </Card>
      </div>
    );
  }

  const { user } = serverAuth;
  const tabs = [...navigation[user.role].filter((item) => user.role !== "teacher" || item !== "Subject Fee Tracking"), ...(user.role === "teacher" || user.role === "student" || user.role === "parent" ? ["Student remarks"] : []), "Account"];
  const tab = activeTab && tabs.includes(activeTab) ? activeTab : tabs[0];
  const child = user.children.find((profile) => profile.id === selectedChildId) ?? user.children[0];
  const profile = user.role === "parent" ? child : user.profile;

  return (
    <div className="server-workspace">
      <aside className="server-navigation" aria-label="Workspace navigation">
        <p style={{ fontWeight: 600, marginBottom: "var(--space-4)" }}>{ROLE_DISPLAY_NAMES[user.role]}</p>
        <nav style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          {tabs.map((item) => (
            <button
              key={item}
              type="button"
              aria-current={tab === item ? "page" : undefined}
              onClick={() => setActiveTab(item)}
              style={{
                textAlign: "left", padding: "var(--space-3)", borderRadius: "var(--radius-md)",
                backgroundColor: tab === item ? "var(--color-primary)" : "transparent",
                color: tab === item ? "var(--color-surface)" : "var(--color-primary)",
                cursor: "pointer",
              }}
            >{item}</button>
          ))}
        </nav>
      </aside>
      <div className="server-content">
        <header style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap", marginBottom: "var(--space-6)" }}>
          <div style={{ minWidth: 0, overflowWrap: "anywhere" }}>
            <h1 style={{ fontSize: "var(--text-2xl)" }}>{user.profile?.name ?? user.name}</h1>
            <p>{ROLE_DISPLAY_NAMES[user.role]}</p>
          </div>
          <Button variant="secondary" onClick={() => { void logout(); }}>Sign out</Button>
        </header>
        {user.role === "parent" && (
          <div style={{ marginBottom: "var(--space-6)" }}>
            <label htmlFor="workspace-child" style={{ display: "block", marginBottom: "var(--space-2)" }}>Child</label>
            <select
              id="workspace-child"
              value={child?.id ?? ""}
              onChange={(event) => setSelectedChildId(event.target.value)}
              style={{ padding: "var(--space-3)", width: "100%", maxWidth: "400px", border: "1px solid var(--color-input-border)", borderRadius: "var(--radius-md)", backgroundColor: "var(--color-surface)" }}
            >
              {user.children.map((linkedChild) => <option key={linkedChild.id} value={linkedChild.id}>{linkedChild.name}</option>)}
            </select>
          </div>
        )}
        {tab === "Account" ? <ServerAccount admin={user.role === "academy-admin"} />
          : user.role === "academy-admin" && tab === "Website Content" ? <Card><h2>Website content</h2><p>Edit drafts, preview changes and publish the public website.</p><Button href="/developer">Open content editor</Button></Card>
          : user.role === "academy-admin" && tab === "Overview & Fee Ledger" ? <ServerFees role="academy-admin" />
          : user.role === "student" && tab === "Fee Receipts & History" && profile ? <ServerFees role="student" studentId={profile.id} />
          : user.role === "parent" && tab === "Fee Receipts & Ledger" && profile ? <ServerFees key={profile.id} role="parent" studentId={profile.id} />
          : user.role === "academy-admin" && (tab === "Academic Setup & Batches" || tab === "Students & Faculty Directory") ? <ServerSetup />
          : user.role === "teacher" && tab === "My Students" ? <ServerAssignments role="teacher" />
          : user.role === "student" && tab === "Enrolled Subjects" ? <ServerAssignments role="student" />
          : user.role === "parent" && tab === "Child's Subjects" && profile ? <ServerAssignments key={profile.id} role="parent" studentId={profile.id} />
          : (user.role === "student" || user.role === "parent") && tab === "Attendance Record" && profile
          ? <ServerAttendance key={profile.id} studentId={profile.id} />
          : user.role === "teacher" && tab === "Attendance" ? <ServerAcademic role="teacher" view="attendance" />
          : user.role !== "developer" && (user.role === "academy-admin" && tab === "Timetable & Rooms" || user.role === "teacher" && tab === "Timetable & Batches" || user.role === "student" && tab === "Timetable & Schedule" || user.role === "parent" && tab === "Timetable & Schedule") ? <ServerAcademic key={profile?.id ?? user.id} role={user.role} studentId={user.role === "parent" ? profile?.id : undefined} view="timetable" />
          : user.role !== "developer" && (tab === "Study Materials" || tab === "Notices & Circulars" || tab === "Notices") ? <ServerAcademic key={profile?.id ?? user.id} role={user.role} studentId={user.role === "parent" ? profile?.id : undefined} view="posts" />
          : user.role !== "developer" && (tab === "Test Series & Marks" || tab === "Tests & Marks") ? <ServerAcademic key={profile?.id ?? user.id} role={user.role} studentId={user.role === "parent" ? profile?.id : undefined} view="results" />
          : user.role !== "developer" && tab === "Student remarks" ? <ServerAcademic key={profile?.id ?? user.id} role={user.role} studentId={user.role === "parent" ? profile?.id : undefined} view="remarks" />
          : user.role === "academy-admin" && (tab === "Registrations" || tab === "Registration Approvals") ? <RegistrationsModule /> : (
          <Card>
            <h2 style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-3)" }}>{tab}</h2>
            {profile && (
              <div style={{ marginBottom: "var(--space-4)", overflowWrap: "anywhere" }}>
                <p>{profile.name}</p>
                {profile.admissionNumber && <p>Admission number: {profile.admissionNumber}</p>}
              </div>
            )}
            <p role="status">{tab.startsWith("Overview")
              ? "Attendance, fees, results and other academic records are currently unavailable."
              : "This module is currently unavailable for your account."}</p>
          </Card>
        )}
      </div>
      <style jsx>{`
        .server-workspace { display: flex; min-height: calc(100vh - 68px); }
        .server-navigation { width: 260px; flex-shrink: 0; padding: var(--space-6); border-right: 1px solid var(--color-border); background: var(--color-surface); }
        .server-content { flex: 1; min-width: 0; padding: var(--space-8); }
        @media (max-width: 768px) {
          .server-workspace { flex-direction: column; }
          .server-navigation { width: 100%; border-right: 0; border-bottom: 1px solid var(--color-border); padding: var(--space-4); }
          .server-navigation nav { flex-direction: row !important; overflow-x: auto; }
          .server-navigation button { white-space: nowrap; }
          .server-content { padding: var(--space-4); }
        }
      `}</style>
    </div>
  );
}
