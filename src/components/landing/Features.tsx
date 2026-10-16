import React from "react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { platformFeatures } from "@/data/homepageContent";

export function Features() {
  return (
    <section id="features" style={{ padding: "var(--space-16) 0" }}>
      {/* Anchor for #why-us */}
      <span id="why-us" style={{ display: "block", position: "relative", top: "-80px", visibility: "hidden" }} />
      <div className="container">
        <div style={{ textAlign: "center", marginBottom: "var(--space-10)" }}>
          <Badge variant="accent" size="sm">
            Why Choose AROUSH Academy
          </Badge>
          <h2
            style={{
              fontSize: "clamp(1.85rem, 4vw, 2.75rem)",
              letterSpacing: "-0.02em",
              marginTop: "var(--space-3)",
              marginBottom: "var(--space-3)",
            }}
          >
            Academic discipline. Dedicated mentorship.
          </h2>
          <p style={{ maxWidth: "640px", margin: "0 auto", fontSize: "var(--text-base)", color: "var(--color-neutral-dark)" }}>
            Six core educational principles designed to give school and board exam students conceptual clarity, structured practice, and genuine confidence.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "var(--space-6)",
          }}
        >
          {platformFeatures.map((item) => (
            <Card key={item.id} padding="lg">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
                <span
                  style={{
                    fontSize: "var(--text-xs)",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--color-accent)",
                  }}
                >
                  {item.category}
                </span>
                <Badge variant="neutral" size="sm">
                  {item.tag}
                </Badge>
              </div>
              <h3 style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-2)" }}>
                {item.title}
              </h3>
              <p style={{ fontSize: "var(--text-sm)", lineHeight: 1.65, color: "var(--color-neutral-dark)", margin: 0 }}>
                {item.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
