import React from "react";
import { marqueeItems } from "@/data/homepageContent";

export function Marquee() {
  // Render strip twice for seamless infinite CSS loop
  return (
    <div
      className="marquee-wrapper"
      role="region"
      aria-label="Academy Highlights Marquee"
    >
      <div className="marquee-strip" aria-hidden="false">
        {marqueeItems.map((item) => (
          <div
            key={item.id}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "var(--text-sm)",
              fontWeight: item.highlight ? 600 : 500,
              color: item.highlight ? "var(--color-primary)" : "var(--color-neutral-dark)",
            }}
          >
            <span style={{ color: "var(--color-accent)", fontSize: "10px" }}>●</span>
            <span>{item.text}</span>
            {item.tag && (
              <span
                style={{
                  fontSize: "10px",
                  padding: "1px 6px",
                  borderRadius: "var(--radius-full)",
                  backgroundColor: item.highlight ? "var(--color-accent-subtle)" : "var(--color-surface-muted)",
                  color: item.highlight ? "var(--color-accent)" : "var(--color-neutral-dark)",
                  fontWeight: 600,
                }}
              >
                {item.tag}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="marquee-strip" aria-hidden="true">
        {marqueeItems.map((item) => (
          <div
            key={`dup-${item.id}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "var(--text-sm)",
              fontWeight: item.highlight ? 600 : 500,
              color: item.highlight ? "var(--color-primary)" : "var(--color-neutral-dark)",
            }}
          >
            <span style={{ color: "var(--color-accent)", fontSize: "10px" }}>●</span>
            <span>{item.text}</span>
            {item.tag && (
              <span
                style={{
                  fontSize: "10px",
                  padding: "1px 6px",
                  borderRadius: "var(--radius-full)",
                  backgroundColor: item.highlight ? "var(--color-accent-subtle)" : "var(--color-surface-muted)",
                  color: item.highlight ? "var(--color-accent)" : "var(--color-neutral-dark)",
                  fontWeight: 600,
                }}
              >
                {item.tag}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
