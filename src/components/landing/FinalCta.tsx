import React from "react";
import { Button } from "../ui/Button";

export function FinalCta() {
  return (
    <section style={{ padding: "var(--space-16) 0" }}>
      <div className="container">
        <div
          style={{
            backgroundColor: "var(--color-primary)",
            borderRadius: "var(--radius-xl)",
            padding: "clamp(var(--space-8), 6vw, var(--space-16))",
            color: "var(--color-surface)",
            textAlign: "center",
            boxShadow: "var(--shadow-lg)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 14px",
              backgroundColor: "rgba(255, 255, 255, 0.12)",
              borderRadius: "var(--radius-full)",
              fontSize: "var(--text-xs)",
              fontWeight: 500,
              color: "#FFFFFF",
              marginBottom: "var(--space-4)",
            }}
          >
            <span>●</span> Admissions Open &bull; Classes V–XII
          </div>

          <h2
            style={{
              fontSize: "clamp(2rem, 4.5vw, 3.25rem)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: "#FFFFFF",
              lineHeight: 1.15,
              marginBottom: "var(--space-4)",
              maxWidth: "780px",
              margin: "0 auto var(--space-4)",
            }}
          >
            Build conceptual clarity and board exam confidence.
          </h2>

          <p
            style={{
              fontSize: "clamp(1rem, 1.8vw, 1.15rem)",
              color: "var(--color-neutral)",
              maxWidth: "640px",
              margin: "0 auto var(--space-8)",
              lineHeight: 1.6,
            }}
          >
            Join ArousH Academy at Park Circus. Learn from dedicated subject specialists with intensive mathematics routines, monthly mock testing, and personal doubt resolution.
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "var(--space-3)",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: "var(--space-8)",
            }}
          >
            <Button href="#enquiry" variant="accent" size="lg">
              Inquire for Admissions
            </Button>
            <Button href="tel:09883005641" variant="secondary" size="lg">
              Call Azhar Sir (098830 05641)
            </Button>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "var(--space-6)",
              fontSize: "var(--text-xs)",
              color: "var(--color-neutral)",
              borderTop: "1px solid rgba(255, 255, 255, 0.12)",
              paddingTop: "var(--space-6)",
            }}
          >
            <span>✓ Classes V–XII &bull; ICSE, CBSE &amp; WB Board</span>
            <span>✓ Maths 3 Days/Week with Dual Faculty</span>
            <span>✓ 1/1 Samsul Huda Road, Park Circus</span>
          </div>
        </div>
      </div>
    </section>
  );
}
