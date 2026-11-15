import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { LandingContent } from "@/content/types";

export function WhatWeTeach({ landing }: { landing: LandingContent }) {
  return (
    <section
      id="what-we-teach"
      style={{
        backgroundColor: "#F5F5F7",
        padding: "clamp(48px, 6vw, 84px) 0 clamp(40px, 5vw, 64px)",
        borderBottom: "1px solid rgba(170, 170, 170, 0.35)",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
        <div style={{ marginBottom: "clamp(32px, 4vw, 48px)" }}>
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
            Subject Directory
          </span>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem, 4.2vw, 3.25rem)",
              lineHeight: 1.08,
              color: "#1D1D1F",
              fontWeight: 700,
              maxWidth: "24ch",
              margin: 0,
            }}
          >
            What We Teach
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "clamp(36px, 5vw, 56px)" }}>
          {landing.courses.map((course) => (
            <div key={course.id}>
              <div
                style={{
                  paddingBottom: "12px",
                  borderBottom: "1px solid #1D1D1F",
                  marginBottom: "4px",
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                <h3
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "#1D1D1F",
                    margin: 0,
                  }}
                >
                  {course.title} ({course.classes})
                </h3>
                <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                  {course.boards}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                {(() => {
                  const verifiedList = course.subjects.filter((s) => s.verified);
                  if (verifiedList.length === 0) {
                    return (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "clamp(16px, 2.2vw, 24px) 0",
                          borderBottom: "1px solid rgba(170, 170, 170, 0.35)",
                          flexWrap: "wrap",
                          gap: "12px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "15px",
                            color: "var(--color-text-secondary)",
                          }}
                        >
                          {course.classes}
                        </span>
                        <a
                          href="#enquiry"
                          style={{
                            fontSize: "15px",
                            fontWeight: 600,
                            color: "#1D1D1F",
                            textDecoration: "underline",
                            textDecorationColor: "#007AFF",
                            textUnderlineOffset: "3px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <span>Ask us about this class</span>
                          <ArrowRight size={16} style={{ color: "#007AFF" }} />
                        </a>
                      </div>
                    );
                  }
                  return verifiedList.map((subject) => (
                    <Link
                      key={`${course.id}-${subject.name}`}
                      href={`#${course.id}`}
                      className="what-we-teach-row"
                      data-subject={subject.name}
                      data-course={course.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "clamp(16px, 2.2vw, 24px) 0",
                        borderBottom: "1px solid rgba(170, 170, 170, 0.35)",
                        textDecoration: "none",
                        transition: "transform 200ms ease-out",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "clamp(24px, 3.2vw, 42px)",
                          fontWeight: 600,
                          color: "#1D1D1F",
                          lineHeight: 1.15,
                        }}
                      >
                        {subject.name}
                      </span>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          flexShrink: 0,
                        }}
                      >
                        <span
                          className="what-we-teach-meta"
                          style={{
                            fontSize: "13px",
                            color: "var(--color-text-secondary)",
                          }}
                        >
                          {course.classes}
                        </span>
                        <ArrowRight
                          size={18}
                          className="what-we-teach-arrow"
                          style={{
                            color: "#007AFF",
                            transition: "transform 200ms ease-out, opacity 200ms ease-out",
                          }}
                        />
                      </div>
                    </Link>
                  ));
                })()}
              </div>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
}
