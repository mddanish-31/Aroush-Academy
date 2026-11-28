import React from "react";
import { Reveal } from "@/components/common/Reveal";

export function FinalCta() {
  return (
    <section
      style={{
        backgroundColor: "var(--brand-sky-subtle)",
        padding: "clamp(64px, 8vw, 104px) 0",
        borderTop: "1px solid var(--color-border)",
      }}
    >
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "0 24px", textAlign: "center" }}>
        <Reveal>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              lineHeight: 1.1,
              color: "var(--brand-navy)",
              fontWeight: 700,
              margin: "0 0 16px 0",
            }}
          >
            Start with conceptual clarity this academic year.
          </h2>

          <p
            style={{
              fontSize: "16px",
              lineHeight: 1.6,
              color: "var(--color-text-secondary)",
              maxWidth: "540px",
              margin: "0 auto 32px auto",
            }}
          >
            Schedule a consultation at our Park Circus campus and observe a lecture before enrolling.
          </p>

          <a
            href="#enquiry"
            className="btn-primary"
            style={{
              padding: "14px 28px",
              borderRadius: "10px",
              fontSize: "16px",
              fontWeight: 600,
              display: "inline-flex",
            }}
          >
            Inquire for admissions
          </a>
        </Reveal>
      </div>
    </section>
  );
}
