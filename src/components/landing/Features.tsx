import React from "react";
import {
  BookOpen,
  Users,
  Compass,
  CheckCircle2,
  HelpCircle,
  ClipboardCheck,
  LucideIcon,
} from "lucide-react";
import { Reveal } from "@/components/common/Reveal";
import { landingContent } from "@/content/landing";

const ICON_MAP: Record<string, LucideIcon> = {
  BookOpen,
  Users,
  Compass,
  CheckCircle2,
  HelpCircle,
  ClipboardCheck,
};

export function Features() {
  return (
    <section
      id="method"
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
              Academic Framework
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
              Systematic teaching architecture designed for long-term retention.
            </h2>
          </div>
        </Reveal>

        <Reveal delay={60}>
          <dl
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "clamp(24px, 4vw, 48px)",
              margin: 0,
            }}
          >
            {landingContent.features.map((feat) => {
              const Icon = ICON_MAP[feat.icon] || BookOpen;

              return (
                <div
                  key={feat.id}
                  style={{
                    paddingBottom: "28px",
                    borderBottom: "1px solid rgba(170, 170, 170, 0.3)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <dt
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "18px",
                      fontWeight: 600,
                      color: "#1D1D1F",
                      margin: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <Icon size={18} strokeWidth={2} style={{ color: "#007AFF" }} />
                    <span>{feat.title}</span>
                  </dt>
                  <dd
                    style={{
                      fontSize: "14px",
                      lineHeight: 1.6,
                      color: "var(--color-text-secondary)",
                      margin: 0,
                    }}
                  >
                    {feat.description}
                  </dd>
                </div>
              );
            })}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
