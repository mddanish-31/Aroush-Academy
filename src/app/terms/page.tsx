import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { termsDoc } from "@/content/legal";

export const metadata: Metadata = {
  title: "Terms of Use and Conditions",
  description: "Current portal use information for ArousH Academy. Academy-approved legal terms are pending.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  return (
    <div style={{ paddingTop: "var(--space-12)", paddingBottom: "var(--space-16)" }}>
      <div className="container-narrow">
        <div style={{ marginBottom: "var(--space-8)" }}>
          <span style={{ fontSize: "var(--text-xs)", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-secondary)", fontWeight: 600 }}>
            Legal and Governance
          </span>
          <h1
            style={{
              fontSize: "clamp(2rem, 4vw, 2.75rem)",
              letterSpacing: "-0.025em",
              color: "var(--color-primary)",
              marginTop: "var(--space-2)",
              marginBottom: "var(--space-3)",
            }}
          >
            {termsDoc.title}
          </h1>
          <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", marginBottom: "var(--space-2)" }}>
            Last updated: {termsDoc.lastUpdated}
          </p>
          <p style={{ fontSize: "var(--text-base)", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
            {termsDoc.summary}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>
          {termsDoc.sections.map((section) => (
            <section key={section.id} id={section.id}>
              <h2 style={{ fontSize: "var(--text-xl)", color: "var(--color-primary)", marginBottom: "var(--space-3)" }}>
                {section.heading}
              </h2>
              {section.paragraphs.map((p, idx) => (
                <p
                  key={idx}
                  style={{
                    fontSize: "var(--text-sm)",
                    lineHeight: 1.7,
                    color: "var(--color-text-secondary)",
                    marginBottom: "var(--space-2)",
                  }}
                >
                  {p}
                </p>
              ))}
              {section.listItems && (
                <ul
                  style={{
                    paddingLeft: "var(--space-5)",
                    fontSize: "var(--text-sm)",
                    color: "var(--color-text-secondary)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    lineHeight: 1.6,
                    marginTop: "var(--space-2)",
                  }}
                >
                  {section.listItems.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <div style={{ marginTop: "var(--space-10)", paddingTop: "var(--space-6)", borderTop: "1px solid var(--color-divider-subtle)" }}>
          <Link
            href="/"
            style={{
              color: "var(--brand-navy)",
              fontSize: "var(--text-sm)",
              textDecoration: "underline",
              textDecorationColor: "var(--brand-teal)",
              textUnderlineOffset: "3px",
              fontWeight: 600,
            }}
          >
            &larr; Return to ArousH Academy Home
          </Link>
        </div>
      </div>
    </div>
  );
}
