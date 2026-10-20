import React from "react";
import { AlertTriangle, Check } from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { PricingTier } from "@/types";

const PLANS: PricingTier[] = [
  {
    id: "starter",
    name: "Starter Academy",
    badge: "Single Campus",
    isPopular: false,
    illustrativePrice: "₹12,000",
    billingPeriod: "/ mo (Illustrative)",
    targetScale: "Up to 300 Active Students",
    description:
      "Essential digital operating tools for localized coaching centers and independent institutes.",
    features: [
      "Academy Admin and Teacher portals",
      "Live interactive classrooms and attendance",
      "Dynamic QR Digital Student IDs",
      "Basic MCQ chapter quizzes",
      "Tuition ledger and payment records",
      "Email fee due notifications",
    ],
    ctaLabel: "Preview Starter Workflows",
    ctaHref: "/dashboard?role=teacher",
  },
  {
    id: "growth",
    name: "Growth Campus",
    badge: "Recommended",
    isPopular: true,
    illustrativePrice: "₹28,000",
    billingPeriod: "/ mo (Illustrative)",
    targetScale: "Up to 1,500 Active Students",
    description:
      "Complete end-to-end academic suite with high-stakes mock test series and parent oversight.",
    features: [
      "Everything in Starter Academy",
      "All 4 Core Roles (Admin, Teacher, Student, Parent)",
      "Proctored Board Mock Examination Engine",
      "Automated negative marking and rank lists",
      "Recorded video course catalog and formulas",
      "Automated PDF fee receipts and reminders",
      "Assisted student doubt clearing",
    ],
    ctaLabel: "Preview Growth Workflows",
    ctaHref: "/dashboard?role=student",
  },
  {
    id: "enterprise",
    name: "Enterprise Network",
    badge: "Multi-Branch",
    isPopular: false,
    illustrativePrice: "Custom",
    billingPeriod: "Tier (Illustrative)",
    targetScale: "Unlimited Campuses and Students",
    description:
      "Enterprise governance and institutional oversight for expanding coaching academy networks.",
    features: [
      "Academy Admin centralized multi-batch and branch oversight",
      "Dedicated institutional data management",
      "Custom brand domains and institutional subdomains",
      "Android mobile app packaging readiness",
      "Cryptographically verified test certificates",
      "Priority technical assistance and audit logs",
    ],
    ctaLabel: "Preview Academy Admin Console",
    ctaHref: "/dashboard?role=academy-admin",
  },
];

export function Pricing() {
  return (
    <section id="pricing" style={{ padding: "var(--space-16) 0", backgroundColor: "var(--color-surface)" }}>
      <div className="container">
        <div style={{ textAlign: "center", marginBottom: "var(--space-8)" }}>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--color-text-secondary)",
            }}
          >
            Illustrative Sample Models
          </span>
          <h2
            style={{
              fontFamily: "var(--font-fraunces), serif",
              fontSize: "clamp(1.85rem, 4vw, 2.75rem)",
              letterSpacing: "-0.02em",
              marginTop: "var(--space-3)",
              marginBottom: "var(--space-3)",
            }}
          >
            Transparent subscription frameworks.
          </h2>
          <p style={{ maxWidth: "640px", margin: "0 auto", fontSize: "var(--text-base)", color: "var(--color-text-secondary)" }}>
            Sample SaaS tiers structured around institutional scale and required capabilities.
          </p>
        </div>

        <Card
          padding="md"
          style={{
            maxWidth: "760px",
            margin: "0 auto var(--space-10)",
            backgroundColor: "var(--color-surface-muted)",
            border: "1px solid var(--color-border)",
            textAlign: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "4px" }}>
            <AlertTriangle size={14} style={{ color: "var(--color-warning)" }} />
            <strong style={{ fontSize: "var(--text-xs)", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text)" }}>
              Architecture Planning Notice - Unconfirmed Sample Figures
            </strong>
          </div>
          <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.5 }}>
            Prices and package tiers displayed below are illustrative samples for architecture and UX demonstration only. They do not constitute binding commercial offers, quotations, or agreements. Formal pricing will be reviewed on a per-academy contract basis.
          </p>
        </Card>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "var(--space-6)",
            alignItems: "stretch",
          }}
        >
          {PLANS.map((plan) => (
            <Card
              key={plan.id}
              padding="lg"
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative",
                border: plan.isPopular ? "1px solid var(--color-text)" : "1px solid var(--color-border)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-3)" }}>
                  <h3 style={{ fontSize: "var(--text-xl)" }}>{plan.name}</h3>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    {plan.badge}
                  </span>
                </div>

                <div style={{ marginBottom: "var(--space-3)" }}>
                  <span style={{ fontSize: "clamp(2rem, 3.5vw, 2.5rem)", fontWeight: 700, letterSpacing: "-0.03em", color: "var(--color-text)" }}>
                    {plan.illustrativePrice}
                  </span>
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", marginLeft: "4px" }}>
                    {plan.billingPeriod}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: "var(--text-xs)",
                    fontWeight: 600,
                    color: "var(--color-text-secondary)",
                    marginBottom: "var(--space-3)",
                  }}
                >
                  {plan.targetScale}
                </div>

                <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", lineHeight: 1.5, marginBottom: "var(--space-6)" }}>
                  {plan.description}
                </p>

                <div style={{ borderTop: "1px solid var(--color-border-subtle)", paddingTop: "var(--space-4)", marginBottom: "var(--space-6)" }}>
                  <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-secondary)" }}>
                    Included Capabilities
                  </span>
                  <ul style={{ listStyle: "none", marginTop: "var(--space-3)", display: "flex", flexDirection: "column", gap: "8px", padding: 0 }}>
                    {plan.features.map((feat, i) => (
                      <li key={i} style={{ fontSize: "var(--text-xs)", color: "var(--color-text)", display: "flex", alignItems: "flex-start", gap: "8px" }}>
                        <Check size={14} style={{ color: "var(--color-accent)", flexShrink: 0, marginTop: "2px" }} />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <Button
                  href={plan.ctaHref || "/dashboard?role=academy-admin"}
                  variant={plan.isPopular ? "primary" : "secondary"}
                  size="md"
                  style={{ width: "100%" }}
                >
                  {plan.ctaLabel}
                </Button>
                <div style={{ textAlign: "center", marginTop: "8px" }}>
                  <span style={{ fontSize: "10px", color: "var(--color-text-secondary)" }}>
                    Sample tier - Direct portal preview
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
