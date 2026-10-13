import React from "react";
import { Badge } from "@/components/ui/Badge";
import { FaqItem } from "@/types";

export const metadata = {
  title: "Frequently Asked Questions — ArousH Academy",
  description: "Comprehensive FAQ covering admissions, curriculum, dual-faculty maths, mock tests, and parent oversight at ArousH Academy, Park Circus.",
};

const FAQ_ITEMS: FaqItem[] = [
  {
    id: "admissions-1",
    category: "Admissions & Accounts",
    question: "How do admissions and batch placements work at ArousH Academy?",
    answer: "Admissions begin with an academic consultation with Azhar Sir to assess the student's current school syllabus, board requirements, and focus areas. Students are then enrolled into Class V–XII batches strictly matched to their board curriculum.",
  },
  {
    id: "admissions-2",
    category: "Admissions & Accounts",
    question: "Where is the coaching center located and what are the center hours?",
    answer: "ArousH Academy is located at 1/1, Samsul Huda Road, near Jeebrail International School, Park Circus, Ballygunge, Kolkata 700017 (within walking distance of Quest Mall). The center is open throughout the week with allocated weekday evening and weekend batches.",
  },
  {
    id: "classes-1",
    category: "Courses & Online Classes",
    question: "Which school boards and classes do you teach?",
    answer: "We offer complete curriculum coaching for Class V through XII across ICSE, CBSE, and West Bengal Board. Each board syllabus is taught in separate dedicated batches strictly following official curriculum guidelines.",
  },
  {
    id: "classes-2",
    category: "Courses & Online Classes",
    question: "Which subjects are covered for Higher Secondary (Class XI & XII)?",
    answer: "For Classes XI & XII, we provide specialized coaching in Accountancy, Economics, Mathematics, Computer Science, and Humanities papers with dedicated subject specialists for each discipline.",
  },
  {
    id: "classes-3",
    category: "Courses & Online Classes",
    question: "How does the dual-faculty mathematics coaching system work?",
    answer: "Mathematics classes are scheduled 3 days a week and shared between two instructors, led by Azhar Sir. This dual-teacher system ensures complex theorems and algebraic derivations are explained from multiple pedagogical angles.",
  },
  {
    id: "tests-1",
    category: "Tests & Certifications",
    question: "How frequently are mock examinations and tests conducted?",
    answer: "Full monthly mock examinations strictly simulating official board question patterns are conducted throughout the academic session. Completed papers are analyzed to identify weak topics early with ample time for structured revision.",
  },
  {
    id: "tests-2",
    category: "Tests & Certifications",
    question: "Are doubt-clearing sessions held separately from regular lectures?",
    answer: "Yes. Time is reserved specifically each week for student questions and revision so that unresolved conceptual points from earlier chapters never accumulate into board exam anxiety.",
  },
  {
    id: "fees-1",
    category: "Fees & Payments",
    question: "How are fee schedules and tuition receipts handled?",
    answer: "Tuition fees are structured transparently per enrolled subject. Enrolled parents receive clear monthly receipts and ledger updates accessible directly through the portal.",
  },
  {
    id: "ids-1",
    category: "Digital IDs & Support",
    question: "How do students and parents access batch schedules and scorecards?",
    answer: "Enrolled families receive secure portal access to view weekly timetables, monthly mock exam marks, attendance records, study materials, and digital student passes.",
  },
];

export default function FaqPage() {
  const categories = Array.from(new Set(FAQ_ITEMS.map((item) => item.category)));

  return (
    <div style={{ paddingTop: "var(--space-12)", paddingBottom: "var(--space-16)" }}>
      <div className="container-narrow">
        <div style={{ marginBottom: "var(--space-8)" }}>
          <Badge variant="accent" size="sm">
            Admissions &amp; Academic Guidance
          </Badge>
          <h1
            style={{
              fontSize: "clamp(2rem, 4vw, 3rem)",
              letterSpacing: "-0.02em",
              marginTop: "var(--space-2)",
              marginBottom: "var(--space-3)",
            }}
          >
            Frequently Asked Questions
          </h1>
          <p style={{ fontSize: "var(--text-base)", color: "var(--color-neutral-dark)", lineHeight: 1.6 }}>
            Clear answers about our coaching programs, board syllabi, faculty structure, monthly mock testing, and admissions at Park Circus.
          </p>
        </div>

        {/* Categorized native <details> accordion lists */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-10)" }}>
          {categories.map((category) => (
            <div key={category}>
              <h2
                style={{
                  fontSize: "var(--text-lg)",
                  fontWeight: 600,
                  color: "var(--color-primary)",
                  paddingBottom: "var(--space-2)",
                  borderBottom: "1px solid var(--color-border)",
                  marginBottom: "var(--space-4)",
                }}
              >
                {category}
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                {FAQ_ITEMS.filter((item) => item.category === category).map((item) => (
                  <details
                    key={item.id}
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
                      <span>{item.question}</span>
                      <span style={{ color: "var(--color-neutral)", fontSize: "var(--text-sm)", marginLeft: "var(--space-2)" }}>▼</span>
                    </summary>

                    <div style={{ marginTop: "var(--space-3)", paddingTop: "var(--space-3)", borderTop: "1px solid var(--color-border-subtle)", cursor: "default" }}>
                      <p style={{ fontSize: "var(--text-sm)", color: "var(--color-neutral-dark)", lineHeight: 1.6, margin: 0 }}>
                        {item.answer}
                      </p>
                      {item.reviewNotes && (
                        <div
                          style={{
                            marginTop: "var(--space-2)",
                            padding: "6px 10px",
                            backgroundColor: "var(--color-surface-muted)",
                            borderRadius: "var(--radius-sm)",
                            fontSize: "var(--text-xs)",
                            color: "var(--color-warning)",
                            fontWeight: 500,
                          }}
                        >
                          Notice: {item.reviewNotes}
                        </div>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
