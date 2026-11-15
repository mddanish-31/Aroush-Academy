import React from "react";
import Image from "next/image";
import { Reveal } from "@/components/common/Reveal";
import type { MediaCollection } from "@/content/media";
import type { LandingContent } from "@/content/types";

export function AcademyIntro({ landing, media }: { landing: LandingContent; media: MediaCollection }) {
  const campusImage = media.campus[0];

  return (
    <section
      id="about"
      style={{
        backgroundColor: "#FFFFFF",
        padding: "clamp(64px, 8vw, 112px) 0",
        borderTop: "1px solid rgba(170, 170, 170, 0.3)",
        borderBottom: "1px solid rgba(170, 170, 170, 0.3)",
      }}
    >
      <span id="campus" style={{ display: "block", position: "relative", top: "-80px", visibility: "hidden" }} />
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
              Academic Ethos
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
              Mastering the underlying principle before tackling question papers.
            </h2>
          </div>
        </Reveal>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "clamp(36px, 6vw, 72px)",
            alignItems: "start",
          }}
        >
          <Reveal delay={60}>
            <div style={{ position: "sticky", top: "100px" }}>
              <div
                style={{
                  borderRadius: "16px",
                  overflow: "hidden",
                  backgroundColor: "#E5E5EA",
                  aspectRatio: "4 / 3",
                  position: "relative",
                }}
              >
                <Image
                  src={campusImage.url}
                  alt={campusImage.alt}
                  width={campusImage.width}
                  height={campusImage.height}
                  sizes="(max-width: 768px) 100vw, 540px"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--color-text-secondary)",
                  marginTop: "12px",
                  lineHeight: 1.5,
                }}
              >
                In-person study environment at Park Circus center, equipped for focused batch instruction.
              </p>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {landing.pillars.map((pillar, idx) => (
                <div
                  key={pillar.id}
                  style={{
                    padding: "24px 0",
                    borderTop: idx === 0 ? "1px solid rgba(170, 170, 170, 0.3)" : "none",
                    borderBottom: "1px solid rgba(170, 170, 170, 0.3)",
                    display: "grid",
                    gridTemplateColumns: "40px 1fr",
                    gap: "16px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "18px",
                      color: "var(--color-text-secondary)",
                      fontWeight: 600,
                      lineHeight: 1.4,
                    }}
                  >
                    {pillar.number}
                  </span>
                  <div>
                    <h3
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "18px",
                        fontWeight: 600,
                        color: "#1D1D1F",
                        margin: "0 0 6px 0",
                        lineHeight: 1.3,
                      }}
                    >
                      {pillar.title}
                    </h3>
                    <p
                      style={{
                        fontSize: "14px",
                        lineHeight: 1.6,
                        color: "var(--color-text-secondary)",
                        margin: 0,
                      }}
                    >
                      {pillar.summary}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
