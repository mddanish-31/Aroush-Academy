import React from "react";
import { Reveal } from "@/components/common/Reveal";
import { landingContent } from "@/content/landing";

export function HowItWorks() {
  return (
    <section
      id="mock-tests"
      style={{
        backgroundColor: "#FFFFFF",
        padding: "clamp(64px, 8vw, 112px) 0",
        borderTop: "1px solid rgba(170, 170, 170, 0.3)",
        borderBottom: "1px solid rgba(170, 170, 170, 0.3)",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
        <Reveal>
          <div style={{ marginBottom: "clamp(36px, 5vw, 64px)" }}>
            <span
              style={{
                fontSize: "12px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--color-text-secondary)",
                fontWeight: 600,
                display: "inline-block",
                marginBottom: "12px",
              }}
            >
              Academic Trajectory
            </span>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2rem, 4.5vw, 3.25rem)",
                lineHeight: 1.08,
                color: "#1D1D1F",
                fontWeight: 700,
                maxWidth: "24ch",
                margin: 0,
              }}
            >
              A measured, four-stage progression from induction to examination.
            </h2>
          </div>
        </Reveal>

        <Reveal delay={60}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "32px",
              position: "relative",
            }}
          >
            {landingContent.timeline.map((step) => (
              <div
                key={step.number}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  paddingTop: "24px",
                  borderTop: "1px solid rgba(170, 170, 170, 0.35)",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "-5px",
                    left: "0",
                    width: "9px",
                    height: "9px",
                    borderRadius: "50%",
                    backgroundColor: "#1D1D1F",
                  }}
                />

                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "28px",
                    fontWeight: 700,
                    color: "#1D1D1F",
                    lineHeight: 1,
                    marginBottom: "12px",
                  }}
                >
                  {step.number}
                </span>

                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "18px",
                    fontWeight: 600,
                    color: "#1D1D1F",
                    margin: "0 0 8px 0",
                    lineHeight: 1.25,
                  }}
                >
                  {step.title}
                </h3>

                <p
                  style={{
                    fontSize: "14px",
                    lineHeight: 1.6,
                    color: "var(--color-text-secondary)",
                    margin: 0,
                  }}
                >
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
