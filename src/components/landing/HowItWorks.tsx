import React from "react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { OnboardingStep } from "@/types";

const STEPS: OnboardingStep[] = [
  {
    stepNumber: 1,
    title: "Admission Enquiry & Consultation",
    tagline: "Academic Assessment at Park Circus",
    description:
      "Submit an online inquiry or visit our center near Quest Mall to discuss the student's current school, board syllabus, and specific subject requirements.",
    keyOutcomes: [
      "School syllabus and board focus evaluated",
      "Direct consultation with Azhar Sir",
      "Batch schedule and availability options",
    ],
  },
  {
    stepNumber: 2,
    title: "Batch & Board Alignment",
    tagline: "Targeted Classroom Environment",
    description:
      "Students are enrolled in appropriate Class V–XII batches strictly mapped to their respective board curriculum (ICSE, CBSE, or West Bengal Board).",
    keyOutcomes: [
      "Board-specific batch scheduling",
      "Subject enrollment and study material access",
      "Student registration and timetable mapping",
    ],
  },
  {
    stepNumber: 3,
    title: "Concept-First Classroom Learning",
    tagline: "Dedicated Subject Specialists",
    description:
      "Weekly classes emphasize conceptual understanding and formula derivation first, supported by intensive dual-faculty mathematics three days a week.",
    keyOutcomes: [
      "Separate subject specialist for every paper",
      "Dual-faculty mathematics coaching",
      "Dedicated doubt-clearing sessions",
    ],
  },
  {
    stepNumber: 4,
    title: "Monthly Mock Tests & Progress",
    tagline: "Continuous Exam Readiness",
    description:
      "Scheduled monthly examinations simulate real board conditions, identifying weak chapters early with transparent performance visibility for parents.",
    keyOutcomes: [
      "Board-pattern monthly test papers",
      "Structured chapter revision cycles",
      "Regular parent communication on progress",
    ],
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" style={{ padding: "var(--space-16) 0" }}>
      <div className="container">
        <div style={{ textAlign: "center", marginBottom: "var(--space-12)" }}>
          <Badge variant="accent" size="sm">
            Student Journey &bull; Classes V–XII
          </Badge>
          <h2
            style={{
              fontSize: "clamp(1.85rem, 4vw, 2.75rem)",
              letterSpacing: "-0.02em",
              marginTop: "var(--space-3)",
              marginBottom: "var(--space-3)",
            }}
          >
            How students learn and succeed in four steps.
          </h2>
          <p style={{ maxWidth: "640px", margin: "0 auto", fontSize: "var(--text-base)", color: "var(--color-neutral-dark)", lineHeight: 1.6 }}>
            A disciplined, supportive path from initial academic evaluation to board examination excellence under Azhar Sir.
          </p>
        </div>

        {/* 4-Step Progressive Timeline Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "var(--space-6)",
            marginBottom: "var(--space-10)",
          }}
        >
          {STEPS.map((step) => (
            <Card key={step.stepNumber} padding="lg" style={{ position: "relative" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "var(--space-4)",
                }}
              >
                <span
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "var(--radius-full)",
                    backgroundColor: "var(--color-primary)",
                    color: "var(--color-surface)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "var(--text-sm)",
                  }}
                >
                  0{step.stepNumber}
                </span>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--color-accent)", fontWeight: 600 }}>
                  Phase {step.stepNumber}
                </span>
              </div>

              <h3 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-2)" }}>
                {step.title}
              </h3>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--color-accent)", fontWeight: 500, marginBottom: "var(--space-3)" }}>
                {step.tagline}
              </p>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-neutral-dark)", lineHeight: 1.6, marginBottom: "var(--space-4)" }}>
                {step.description}
              </p>

              <div style={{ borderTop: "1px solid var(--color-border-subtle)", paddingTop: "var(--space-3)" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-neutral-dark)" }}>
                  Key Milestones
                </span>
                <ul style={{ listStyle: "none", marginTop: "6px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  {step.keyOutcomes.map((out, idx) => (
                    <li key={idx} style={{ fontSize: "var(--text-xs)", color: "var(--color-primary)", display: "flex", alignItems: "flex-start", gap: "6px" }}>
                      <span style={{ color: "var(--color-success)", fontSize: "12px", lineHeight: "14px" }}>✓</span>
                      <span>{out}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          ))}
        </div>

        {/* Transition CTA */}
        <div style={{ textAlign: "center" }}>
          <Button href="#enquiry" variant="accent" size="md">
            Inquire About Admissions Today →
          </Button>
        </div>
      </div>
    </section>
  );
}
