import React from "react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { courseGroups } from "@/data/homepageContent";

export function Courses() {
  return (
    <section id="courses" style={{ padding: "var(--space-16) 0" }}>
      <div className="container">
        {/* Section Header */}
        <div style={{ textAlign: "center", marginBottom: "var(--space-12)" }}>
          <Badge variant="neutral" size="sm">
            Curriculum &amp; Programs
          </Badge>
          <h2
            style={{
              fontSize: "clamp(1.85rem, 4vw, 2.75rem)",
              letterSpacing: "-0.025em",
              marginTop: "var(--space-3)",
              marginBottom: "var(--space-3)",
            }}
          >
            What we teach from Class V to XII.
          </h2>
          <p style={{ maxWidth: "640px", margin: "0 auto", fontSize: "var(--text-base)", color: "var(--color-neutral-dark)" }}>
            Four dedicated academic divisions covering the complete ICSE, CBSE, and West Bengal Board curricula with separate specialists for every subject.
          </p>
        </div>

        {/* 4 Course Group Cards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "var(--space-6)",
            marginBottom: "var(--space-10)",
          }}
        >
          {courseGroups.map((group) => (
            <Card
              key={group.id}
              padding="lg"
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-3)" }}>
                  <span style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--color-primary)" }}>
                    {group.classes}
                  </span>
                  <Badge variant="accent" size="sm">
                    {group.badge}
                  </Badge>
                </div>

                <h3 style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-primary)", marginBottom: "var(--space-2)" }}>
                  {group.focusTitle}
                </h3>

                <p style={{ fontSize: "var(--text-sm)", color: "var(--color-neutral-dark)", lineHeight: 1.6, marginBottom: "var(--space-4)" }}>
                  {group.description}
                </p>

                {/* Subjects Badges */}
                <div style={{ marginBottom: "var(--space-4)" }}>
                  <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-neutral-dark)" }}>
                    Subjects Covered
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "var(--space-2)" }}>
                    {group.subjects.map((sub, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: "var(--text-xs)",
                          padding: "2px 8px",
                          borderRadius: "var(--radius-sm)",
                          backgroundColor: "var(--color-surface-muted)",
                          border: "1px solid var(--color-border)",
                          color: "var(--color-primary)",
                        }}
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ borderTop: "1px solid var(--color-border-subtle)", paddingTop: "var(--space-4)", marginTop: "var(--space-2)" }}>
                <div style={{ fontSize: "11px", color: "var(--color-neutral-dark)", marginBottom: "var(--space-3)" }}>
                  {group.scheduleNote}
                </div>
                <Button href="#enquiry" variant="secondary" size="sm" style={{ width: "100%" }}>
                  Inquire for {group.classes} Batch
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Board Alignment Callout */}
        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)" }}>
            Separate batches strictly mapped to <strong>ICSE</strong>, <strong>CBSE</strong>, and <strong>West Bengal Board</strong> syllabi.
          </span>
        </div>
      </div>
    </section>
  );
}
