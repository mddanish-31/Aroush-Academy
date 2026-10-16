import React from "react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { RoleDescriptor } from "@/types";

const ROLES: RoleDescriptor[] = [
  {
    role: "student",
    title: "Student Portal",
    badge: "Learner Access",
    description:
      "Enrolled students check weekly batch timetables, review monthly mock test marks, download practice study materials, and access digital student IDs.",
    targetPath: "/login",
    highlights: [
      "Weekly Batch Timetable",
      "Mock Test Marks & Scorecards",
      "Chapter Study Materials & Notes",
      "Digital Student ID Pass",
    ],
  },
  {
    role: "parent",
    title: "Parent Oversight",
    badge: "Guardian Access",
    description:
      "Parents monitor monthly attendance records, ward's test performances, academy circulars, and transparent fee payment records with downloadable receipts.",
    targetPath: "/login",
    highlights: [
      "Monthly Attendance Logs",
      "Ward's Academic Test Reports",
      "Fee Payment Receipts & History",
      "Direct Academy Circulars",
    ],
  },
  {
    role: "teacher",
    title: "Faculty Workspace",
    badge: "Instructor Access",
    description:
      "Subject specialists manage assigned batch rosters, log classroom attendance registers, record test marks, and distribute chapter materials.",
    targetPath: "/login",
    highlights: [
      "Assigned Batch Rosters",
      "Daily Attendance Registers",
      "Class Test Marks Entry",
      "Study Materials Sharing",
    ],
  },
  {
    role: "academy-admin",
    title: "Academy Administration",
    badge: "Center Operations",
    description:
      "Operational leadership manages student admissions, faculty batch assignments, subject fee ledgers, and institutional records.",
    targetPath: "/login",
    highlights: [
      "Student & Faculty Directory",
      "Batch & Timetable Scheduling",
      "Tuition Collection Ledgers",
      "Campus Operations & Notices",
    ],
  },
];

export function RolesOverview() {
  return (
    <section id="roles" style={{ padding: "var(--space-16) 0", backgroundColor: "var(--color-surface)" }}>
      {/* Anchor for #portals */}
      <span id="portals" style={{ display: "block", position: "relative", top: "-80px", visibility: "hidden" }} />
      <div className="container">
        <div style={{ textAlign: "center", marginBottom: "var(--space-10)" }}>
          <Badge variant="accent" size="sm">
            Enrolled Student &amp; Parent Access
          </Badge>
          <h2
            style={{
              fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
              letterSpacing: "-0.02em",
              marginTop: "var(--space-3)",
              marginBottom: "var(--space-3)",
            }}
          >
            Connected digital portals for our academy community.
          </h2>
          <p style={{ maxWidth: "640px", margin: "0 auto", fontSize: "var(--text-base)", color: "var(--color-neutral-dark)", lineHeight: 1.6 }}>
            Alongside classroom teaching at Park Circus, enrolled students and parents can sign in to view class timetables, monthly mock test scorecards, and fee records.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "var(--space-6)",
          }}
        >
          {ROLES.map((r) => (
            <Card key={r.role} padding="lg">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-3)" }}>
                <h3 style={{ fontSize: "var(--text-lg)" }}>{r.title}</h3>
                <Badge variant="neutral" size="sm">
                  {r.badge}
                </Badge>
              </div>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-neutral-dark)", marginBottom: "var(--space-4)", lineHeight: 1.55 }}>
                {r.description}
              </p>

              <div style={{ marginBottom: "var(--space-5)" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-neutral-dark)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Key Capabilities
                </span>
                <ul style={{ listStyle: "none", marginTop: "var(--space-2)", display: "flex", flexDirection: "column", gap: "6px" }}>
                  {r.highlights.map((h, i) => (
                    <li key={i} style={{ fontSize: "var(--text-xs)", color: "var(--color-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ color: "var(--color-accent)", fontSize: "10px" }}>✓</span>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>

              <Button href={r.targetPath} variant="secondary" size="sm" style={{ width: "100%" }}>
                Sign In to {r.title} →
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
