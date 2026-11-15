import React from "react";
import { Reveal } from "@/components/common/Reveal";
import type { LandingContent } from "@/content/types";

export function Faculty({ landing }: { landing: LandingContent }) {
  return (
    <section
      id="faculty"
      style={{
        backgroundColor: "#F5F5F7",
        padding: "clamp(64px, 8vw, 112px) 0",
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
              Academic Faculty
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
              Dedicated mentors with separate specialists for each paper.
            </h2>
          </div>
        </Reveal>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "24px",
          }}
        >
          {landing.faculty.map((member, idx) => (
            <Reveal key={member.id} delay={idx * 60}>
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "16px",
                  border: "1px solid rgba(170, 170, 170, 0.3)",
                  padding: "28px 24px",
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      backgroundColor: "#F5F5F7",
                      border: "1px solid rgba(170, 170, 170, 0.4)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--font-display)",
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "#1D1D1F",
                      flexShrink: 0,
                    }}
                  >
                    {member.initials}
                  </div>
                  <div>
                    <h3
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "18px",
                        fontWeight: 700,
                        color: "#1D1D1F",
                        margin: "0 0 2px 0",
                        lineHeight: 1.2,
                      }}
                    >
                      {member.name}
                    </h3>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--color-text-secondary)",
                        lineHeight: 1.3,
                      }}
                    >
                      {member.role}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#1D1D1F",
                    marginBottom: "8px",
                    paddingBottom: "8px",
                    borderBottom: "1px solid rgba(170, 170, 170, 0.2)",
                  }}
                >
                  {member.subjects}
                </div>

                <p
                  style={{
                    fontSize: "13px",
                    lineHeight: 1.6,
                    color: "var(--color-text-secondary)",
                    margin: 0,
                    flexGrow: 1,
                  }}
                >
                  {member.bio}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
