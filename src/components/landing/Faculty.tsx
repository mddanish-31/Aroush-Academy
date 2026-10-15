import React from "react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { facultyMembers } from "@/data/homepageContent";

export function Faculty() {
  return (
    <section id="faculty" style={{ padding: "var(--space-16) 0", backgroundColor: "var(--color-surface)" }}>
      <div className="container">
        {/* Section Header */}
        <div style={{ textAlign: "center", marginBottom: "var(--space-12)" }}>
          <Badge variant="neutral" size="sm">
            Subject Specialists
          </Badge>
          <h2
            style={{
              fontSize: "clamp(1.85rem, 4vw, 2.75rem)",
              letterSpacing: "-0.025em",
              marginTop: "var(--space-3)",
              marginBottom: "var(--space-3)",
            }}
          >
            The people at the board.
          </h2>
          <p style={{ maxWidth: "620px", margin: "0 auto", fontSize: "var(--text-base)", color: "var(--color-neutral-dark)" }}>
            No single instructor carries the whole syllabus. Every discipline is taught by teachers who specialize strictly in that paper.
          </p>
        </div>

        {/* Faculty Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "var(--space-6)",
          }}
        >
          {facultyMembers.map((member) => (
            <Card key={member.id} padding="lg">
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", marginBottom: "var(--space-4)" }}>
                {/* Monogram Fallback Avatar */}
                <div
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "var(--radius-full)",
                    backgroundColor: "var(--color-primary)",
                    color: "var(--color-surface)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "var(--text-base)",
                    flexShrink: 0,
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  {member.avatarText}
                </div>

                <div>
                  <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-primary)", margin: 0 }}>
                    {member.name}
                  </h3>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--color-accent)", fontWeight: 500, marginTop: "2px" }}>
                    {member.role}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: "var(--space-3)" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-neutral-dark)" }}>
                  Subject Discipline
                </span>
                <div style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-primary)", marginTop: "2px" }}>
                  {member.subjects}
                </div>
              </div>

              <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", lineHeight: 1.65, margin: 0 }}>
                {member.bio}
              </p>

              <div style={{ marginTop: "var(--space-4)", paddingTop: "var(--space-3)", borderTop: "1px solid var(--color-border-subtle)" }}>
                <Badge variant="neutral" size="sm">
                  {member.tag}
                </Badge>
              </div>
            </Card>
          ))}
        </div>

        {/* Descriptive Footer Notice */}
        <p style={{ textAlign: "center", fontSize: "12px", color: "var(--color-neutral-dark)", marginTop: "var(--space-8)" }}>
          Our academic model pairs dedicated subject specialists with Azhar Sir&apos;s conceptual foundation across all batches.
        </p>
      </div>
    </section>
  );
}
