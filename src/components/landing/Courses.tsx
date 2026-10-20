import React from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/common/Reveal";
import { MEDIA } from "@/content/media";
import { landingContent } from "@/content/landing";

export function Courses() {
  return (
    <section
      id="courses"
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
              What We Teach
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
          {landingContent.courses.map((course, idx) => {
            const mediaItem = MEDIA.courses[course.mediaKey];
            const isReversed = idx % 2 === 1;

            return (
              <Reveal key={course.id} delay={idx * 60}>
                <div
                  id={course.id === "course-v-viii" ? "courses-v-viii" : course.id === "course-ix-x" ? "courses-ix-x" : "courses-xi-xii"}
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "20px",
                    border: "1px solid rgba(170, 170, 170, 0.3)",
                    overflow: "hidden",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      order: isReversed ? 2 : 1,
                      aspectRatio: "16 / 10",
                      position: "relative",
                      backgroundColor: "#E5E5EA",
                      overflow: "hidden",
                    }}
                  >
                    <Image
                      src={mediaItem.url}
                      alt={mediaItem.alt}
                      width={mediaItem.width}
                      height={mediaItem.height}
                      sizes="(max-width: 768px) 100vw, 600px"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </div>

                  <div
                    style={{
                      order: isReversed ? 1 : 2,
                      padding: "clamp(28px, 4vw, 48px)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                    }}
                  >
                    <div style={{ marginBottom: "8px" }}>
                      <span
                        style={{
                          fontSize: "13px",
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
                        fontSize: "clamp(1.5rem, 2.5vw, 2rem)",
                        fontWeight: 700,
                        color: "#1D1D1F",
                        margin: "0 0 12px 0",
                        lineHeight: 1.15,
                      }}
                    >
                      {course.title}
                    </h3>

                    <p
                      style={{
                        fontSize: "15px",
                        lineHeight: 1.6,
                        color: "var(--color-text-secondary)",
                        margin: "0 0 20px 0",
                      }}
                    >
                      {course.description}
                    </p>

                    <div
                      style={{
                        padding: "14px 0",
                        borderTop: "1px solid rgba(170, 170, 170, 0.25)",
                        borderBottom: "1px solid rgba(170, 170, 170, 0.25)",
                        marginBottom: "24px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#1D1D1F",
                          display: "block",
                          marginBottom: "4px",
                        }}
                      >
                        Core Subjects Taught
                      </span>
                      <p
                        style={{
                          fontSize: "14px",
                          color: "var(--color-text-secondary)",
                          margin: 0,
                          lineHeight: 1.5,
                        }}
                      >
                        {course.subjects.join(", ")}
                      </p>
                    </div>

                    <div>
                      <a
                        href="#enquiry"
                        className="course-enquiry-link"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          color: "#1D1D1F",
                          fontSize: "15px",
                          fontWeight: 600,
                          textDecoration: "none",
                          borderBottom: "1.5px solid transparent",
                          paddingBottom: "2px",
                        }}
                      >
                        <span>{course.ctaLabel}</span>
                        <ArrowRight size={16} style={{ color: "#007AFF" }} />
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
