import React from "react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

interface TopFaq {
  question: string;
  answer: string;
  category: string;
}

const TOP_FAQS: TopFaq[] = [
  {
    category: "Curriculum & Boards",
    question: "Which classes and boards are taught at ArousH Academy?",
    answer: "We offer comprehensive subject coaching for Classes V through XII across ICSE, CBSE, and West Bengal Board curricula. Each board's syllabus is covered strictly according to its official curriculum guidelines with separate batches.",
  },
  {
    category: "Teaching Methodology",
    question: "How does the dual-faculty mathematics coaching work?",
    answer: "Mathematics classes are scheduled 3 days a week and shared between two instructors, led by Azhar Sir. This dual-teacher approach ensures students receive multiple pedagogical angles on challenging concepts, rigorous formula derivations, and thorough question breakdown.",
  },
  {
    category: "Assessments & Revision",
    question: "Are mock examinations conducted regularly?",
    answer: "Yes. Full monthly mock tests strictly following board examination patterns are conducted to assess conceptual absorption. Weak areas are identified early so targeted revisions take place well before final board exams.",
  },
  {
    category: "Admissions & Campus",
    question: "How do I visit the Park Circus center or check batch availability?",
    answer: "You can submit an inquiry through our admissions form, call Azhar Sir directly at 098830 05641 or 82408 16226, or visit our campus at 1/1 Samsul Huda Road, Park Circus (near Quest Mall) during operating hours.",
  },
];

export function FaqPreview() {
  return (
    <section style={{ padding: "var(--space-16) 0" }}>
      <div className="container-narrow">
        <div style={{ textAlign: "center", marginBottom: "var(--space-10)" }}>
          <Badge variant="accent" size="sm">
            Admissions &amp; Academics FAQ
          </Badge>
          <h2
            style={{
              fontSize: "clamp(1.85rem, 4vw, 2.75rem)",
              letterSpacing: "-0.02em",
              marginTop: "var(--space-3)",
              marginBottom: "var(--space-3)",
            }}
          >
            Frequently Asked Questions
          </h2>
          <p style={{ maxWidth: "600px", margin: "0 auto", fontSize: "var(--text-base)", color: "var(--color-neutral-dark)", lineHeight: 1.6 }}>
            Common questions regarding our coaching methodology, multi-board curricula, monthly mock testing, and admissions.
          </p>
        </div>

        {/* Accordion list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", marginBottom: "var(--space-8)" }}>
          {TOP_FAQS.map((faq, idx) => (
            <details
              key={idx}
              style={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                padding: "var(--space-4)",
                cursor: "pointer",
                transition: "box-shadow var(--transition-fast)",
              }}
            >
              <summary
                style={{
                  fontWeight: 600,
                  fontSize: "var(--text-base)",
                  color: "var(--color-primary)",
                  listStyle: "none",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>{faq.question}</span>
                <span style={{ color: "var(--color-neutral)", fontSize: "var(--text-sm)", marginLeft: "var(--space-2)" }}>▼</span>
              </summary>
              <div style={{ marginTop: "var(--space-3)", paddingTop: "var(--space-3)", borderTop: "1px solid var(--color-border-subtle)", cursor: "default" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-accent)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {faq.category}
                </span>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--color-neutral-dark)", lineHeight: 1.6, marginTop: "4px", margin: "4px 0 0" }}>
                  {faq.answer}
                </p>
              </div>
            </details>
          ))}
        </div>

        {/* Link to Dedicated Full FAQ Page */}
        <div style={{ textAlign: "center" }}>
          <Button href="/faq" variant="secondary" size="md">
            View Complete Knowledge Base &amp; FAQ Route →
          </Button>
        </div>
      </div>
    </section>
  );
}
