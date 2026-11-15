import React from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Reveal } from "@/components/common/Reveal";
import type { LandingContent } from "@/content/types";

export function FaqPreview({ landing }: { landing: LandingContent }) {
  return (
    <section
      style={{
        backgroundColor: "#F5F5F7",
        padding: "clamp(64px, 8vw, 112px) 0",
      }}
    >
      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "0 24px" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: "clamp(36px, 5vw, 64px)" }}>
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
              Academic Questions
            </span>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2rem, 4.5vw, 3.25rem)",
                lineHeight: 1.08,
                color: "#1D1D1F",
                fontWeight: 700,
                margin: "0 0 16px 0",
              }}
            >
              Frequently Asked Questions
            </h2>
            <p
              style={{
                fontSize: "15px",
                lineHeight: 1.6,
                color: "var(--color-text-secondary)",
                maxWidth: "560px",
                margin: "0 auto",
              }}
            >
              Essential information on batch allocations, dual-faculty routines, and campus visits.
            </p>
          </div>
        </Reveal>

        <Reveal delay={60}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "36px" }}>
            {landing.faqs.map((faq) => (
              <details
                key={faq.id}
                className="faq-item"
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid rgba(170, 170, 170, 0.3)",
                  borderRadius: "12px",
                  padding: "18px 20px",
                }}
              >
                <summary
                  style={{
                    fontWeight: 600,
                    fontSize: "16px",
                    color: "#1D1D1F",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                    listStyle: "none",
                  }}
                >
                  <span>{faq.question}</span>
                  <ChevronDown size={18} style={{ color: "var(--color-text-secondary)", flexShrink: 0 }} />
                </summary>
                <div
                  className="faq-answer"
                  style={{
                    marginTop: "12px",
                    paddingTop: "12px",
                    borderTop: "1px solid rgba(170, 170, 170, 0.2)",
                  }}
                >
                  <p
                    style={{
                      fontSize: "14px",
                      lineHeight: 1.6,
                      color: "var(--color-text-secondary)",
                      margin: 0,
                    }}
                  >
                    {faq.answer}
                  </p>
                </div>
              </details>
            ))}
          </div>

          <div style={{ textAlign: "center" }}>
            <Link
              href="/faq"
              className="faq-preview-all-link"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "15px",
                fontWeight: 600,
                color: "#1D1D1F",
                textDecoration: "none",
                padding: "10px 18px",
                borderRadius: "8px",
                border: "1px solid rgba(170, 170, 170, 0.4)",
                backgroundColor: "#FFFFFF",
              }}
            >
              <span>View full knowledge base and FAQ</span>
              <ArrowRight size={16} style={{ color: "#007AFF" }} />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
