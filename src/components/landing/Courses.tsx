import React from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/common/Reveal";
import type { MediaCollection } from "@/content/media";
import type { LandingContent } from "@/content/types";

export function Courses({ landing, media }: { landing: LandingContent; media: MediaCollection }) {
  return (
    <section
      id="courses"
      style={{
        backgroundColor: "var(--brand-beige)",
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
              Academic Divisions
            </span>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2rem, 4.5vw, 3.25rem)",
                lineHeight: 1.08,
                color: "var(--brand-navy)",
                fontWeight: 700,
                maxWidth: "24ch",
                margin: 0,
              }}
            >
              Structured divisions tailored to official board standards.
            </h2>
          </div>
        </Reveal>

        <div
          className="courses-gallery-viewport"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "48px",
            touchAction: "pan-x pan-y pinch-zoom",
            overscrollBehaviorX: "contain",
          }}
        >
          {landing.courses.map((course, idx) => {
            const mediaItem = media.courses[course.mediaKey];
            const isReversed = idx % 2 === 1;

            return (
              <Reveal key={course.id} delay={idx * 60}>
                <div
                  id={course.id}
                  className="course-card-wrapper"
                  style={{
                    backgroundColor: "var(--color-surface)",
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--color-border)",
                    boxShadow: "var(--shadow-sm)",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: isReversed ? "row-reverse" : "row",
                    alignItems: "stretch",
                  }}
                >
                  <div
                    className="course-photo-col"
                    style={{
                      width: "35%",
                      minHeight: "280px",
                      position: "relative",
                      backgroundColor: "var(--brand-sky)",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    <Image
                      src={mediaItem.url}
                      alt={mediaItem.alt}
                      width={mediaItem.width}
                      height={mediaItem.height}
                      sizes="(max-width: 768px) 100vw, 420px"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </div>

                  <div
                    className="course-content-col"
                    style={{
                      width: "65%",
                      padding: "clamp(24px, 3.5vw, 44px)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                    }}
                  >
                    <div style={{ marginBottom: "6px" }}>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "var(--color-text-secondary)",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        {course.classes} &bull; {course.boards}
                      </span>
                    </div>

                    <h3
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "clamp(1.25rem, 2vw, 1.65rem)",
                        fontWeight: 600,
                        color: "var(--color-text-secondary)",
                        margin: "0 0 8px 0",
                        lineHeight: 1.2,
                      }}
                    >
                      {course.title}
                    </h3>

                    {(() => {
                      const verifiedList = course.subjects.filter((s) => s.verified);
                      if (verifiedList.length === 0) {
                        return (
                          <div
                            style={{
                              fontFamily: "var(--font-display)",
                              fontSize: "clamp(1.2rem, 2vw, 1.6rem)",
                              fontWeight: 600,
                              color: "var(--brand-navy)",
                              lineHeight: 1.2,
                              margin: "0 0 14px 0",
                            }}
                          >
                            <span style={{ color: "var(--color-text-secondary)", marginRight: "12px" }}>
                              {course.classes}
                            </span>
                            <a
                              href="#enquiry"
                              style={{
                                color: "var(--brand-navy)",
                                textDecoration: "underline",
                                textDecorationColor: "var(--brand-teal)",
                                textUnderlineOffset: "3px",
                              }}
                            >
                              Ask us about this class
                            </a>
                          </div>
                        );
                      }
                      return (
                        <div
                          style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "clamp(1.5rem, 2.5vw, 2.15rem)",
                            fontWeight: 700,
                            color: "var(--brand-navy)",
                            lineHeight: 1.2,
                            margin: "0 0 14px 0",
                          }}
                        >
                          {verifiedList.map((s) => s.name).join(", ")}
                        </div>
                      );
                    })()}

                    <p
                      style={{
                        fontSize: "14px",
                        lineHeight: 1.6,
                        color: "var(--color-text-secondary)",
                        margin: "0 0 20px 0",
                      }}
                    >
                      {course.description}
                    </p>

                    <div>
                      <a
                        href="#enquiry"
                        className="course-enquiry-link"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          color: "var(--brand-navy)",
                          fontSize: "14px",
                          fontWeight: 600,
                          textDecoration: "underline",
                          textDecorationColor: "var(--brand-teal)",
                          textUnderlineOffset: "3px",
                        }}
                      >
                        <span>{course.ctaLabel}</span>
                        <ArrowRight size={16} style={{ color: "var(--brand-teal)" }} />
                      </a>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>

    </section>
  );
}
