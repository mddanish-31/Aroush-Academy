import React from "react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { teachingPillars, academyCenterInfo } from "@/data/homepageContent";

export function AcademyIntro() {
  return (
    <section id="about" style={{ padding: "var(--space-16) 0", backgroundColor: "var(--color-surface)" }}>
      {/* Anchor for backward compatibility with #academy links */}
      <span id="academy" style={{ display: "block", position: "relative", top: "-80px", visibility: "hidden" }} />
      <div className="container">
        {/* Section Heading */}
        <div style={{ textAlign: "center", marginBottom: "var(--space-12)" }}>
          <Badge variant="accent" size="sm">
            Inside ArousH Academy &bull; Park Circus
          </Badge>
          <h2
            style={{
              fontSize: "clamp(1.85rem, 4vw, 2.75rem)",
              letterSpacing: "-0.025em",
              marginTop: "var(--space-3)",
              marginBottom: "var(--space-3)",
            }}
          >
            Clear the concept. Understand the logic.
          </h2>
          <p style={{ maxWidth: "680px", margin: "0 auto", fontSize: "var(--text-base)", color: "var(--color-neutral-dark)", lineHeight: 1.6 }}>
            The learning center at 1/1 Samsul Huda Road, Park Circus, combines rigorous classroom teaching, dedicated subject specialists, and structured academic preparation for school and board examinations.
          </p>
        </div>

        {/* 6 Teaching Method Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "var(--space-6)",
            marginBottom: "var(--space-12)",
          }}
        >
          {teachingPillars.map((pillar) => (
            <Card key={pillar.id} padding="lg">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-3)" }}>
                <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-accent)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {pillar.tag}
                </span>
                <span style={{ color: "var(--color-neutral)", fontSize: "14px" }}>✦</span>
              </div>
              <h3 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-2)" }}>
                {pillar.title}
              </h3>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-neutral-dark)", lineHeight: 1.6, margin: 0 }}>
                {pillar.summary}
              </p>
            </Card>
          ))}
        </div>

        {/* Center Details Banner */}
        <Card
          padding="lg"
          style={{
            backgroundColor: "var(--color-surface-muted)",
            border: "1px solid var(--color-border)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "var(--space-6)",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "var(--space-2)" }}>
                <Badge variant="neutral" size="sm">
                  Physical Campus
                </Badge>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)" }}>
                  Walking distance from Quest Mall
                </span>
              </div>
              <h4 style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-2)" }}>
                {academyCenterInfo.centerName}
              </h4>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-neutral-dark)", lineHeight: 1.6, marginBottom: "var(--space-4)" }}>
                {academyCenterInfo.address}
              </p>
              <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
                <Button href={`tel:${academyCenterInfo.phones[0]}`} variant="secondary" size="sm">
                  📞 Call {academyCenterInfo.phones[0]}
                </Button>
                <Button href="#enquiry" variant="accent" size="sm">
                  Send Admission Inquiry
                </Button>
              </div>
            </div>

            {/* Operating Hours Mini-Grid */}
            <div
              style={{
                backgroundColor: "var(--color-surface)",
                padding: "var(--space-5)",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--color-border)",
              }}
            >
              <span style={{ fontSize: "var(--text-xs)", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-neutral-dark)", fontWeight: 600 }}>
                Center Operating Hours
              </span>
              <ul style={{ listStyle: "none", marginTop: "var(--space-3)", display: "flex", flexDirection: "column", gap: "6px" }}>
                {academyCenterInfo.hoursSummary.map((h, i) => (
                  <li
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "var(--text-xs)",
                      color: "var(--color-primary)",
                      paddingBottom: "4px",
                      borderBottom: "1px solid var(--color-border-subtle)",
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>{h.days}</span>
                    <span style={{ color: "var(--color-neutral-dark)" }}>{h.time}</span>
                  </li>
                ))}
              </ul>
              <div style={{ fontSize: "10px", color: "var(--color-neutral)", marginTop: "8px" }}>
                Batch-specific hours allocated upon admission verification.
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
