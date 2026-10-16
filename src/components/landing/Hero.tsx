"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { heroContent } from "@/data/homepageContent";

export function Hero() {
  const [imageError, setImageError] = useState(false);

  return (
    <section
      style={{
        paddingTop: "clamp(var(--space-8), 4vw, var(--space-16))",
        paddingBottom: "clamp(var(--space-10), 5vw, var(--space-16))",
        backgroundColor: "var(--color-bg)",
        overflow: "hidden",
      }}
    >
      <div className="container">
        {/* Split Layout: Left Text & CTAs, Right Classroom Image & Badges */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "clamp(var(--space-8), 4vw, var(--space-12))",
            alignItems: "center",
          }}
        >
          {/* Left Column: Academy Eyebrow, Philosophy Headline, Description, CTAs */}
          <div>
            <div style={{ marginBottom: "var(--space-4)" }}>
              <Badge variant="accent" size="sm">
                {heroContent.eyebrow}
              </Badge>
            </div>

            <h1
              style={{
                fontSize: "clamp(2.4rem, 5.2vw, 3.85rem)",
                fontWeight: 700,
                letterSpacing: "-0.035em",
                lineHeight: 1.12,
                color: "var(--color-primary)",
                marginBottom: "var(--space-4)",
              }}
            >
              {heroContent.headline}
            </h1>

            <p
              style={{
                fontSize: "clamp(1rem, 1.8vw, 1.15rem)",
                color: "var(--color-neutral-dark)",
                lineHeight: 1.6,
                marginBottom: "var(--space-6)",
                maxWidth: "580px",
              }}
            >
              {heroContent.description}
            </p>

            {/* CTAs */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "var(--space-3)",
                alignItems: "center",
                marginBottom: "var(--space-8)",
              }}
            >
              <Button href={heroContent.primaryCta.href} variant="accent" size="lg">
                {heroContent.primaryCta.label}
              </Button>
              <Button href={heroContent.secondaryCta.href} variant="secondary" size="lg">
                {heroContent.secondaryCta.label}
              </Button>
            </div>

            {/* Trust Stats Pills */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(115px, 1fr))",
                gap: "var(--space-3)",
                paddingTop: "var(--space-4)",
                borderTop: "1px solid var(--color-border)",
              }}
            >
              {heroContent.trustStats.map((stat) => (
                <div key={stat.id}>
                  <div style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-primary)" }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-neutral-dark)", marginTop: "2px" }}>
                    {stat.label}
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--color-neutral)", marginTop: "1px" }}>
                    {stat.sublabel}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Classroom Photograph with Aspect Ratio & Floating Badges */}
          <div style={{ position: "relative" }}>
            {/* Visual Classroom Frame */}
            <div
              style={{
                position: "relative",
                aspectRatio: "4 / 3",
                width: "100%",
                maxWidth: "580px",
                margin: "0 auto",
                borderRadius: "var(--radius-xl)",
                overflow: "hidden",
                boxShadow: "var(--shadow-lg)",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-surface)",
              }}
            >
              {!imageError ? (
                <Image
                  src={heroContent.image.src}
                  alt={heroContent.image.alt}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 580px"
                  style={{ objectFit: "cover" }}
                  onError={() => setImageError(true)}
                />
              ) : (
                /* Sensible Image Fallback */
                <div
                  style={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "var(--space-8)",
                    backgroundColor: "var(--color-surface-muted)",
                    color: "var(--color-neutral-dark)",
                    textAlign: "center",
                  }}
                >
                  <span style={{ fontSize: "40px", marginBottom: "var(--space-2)" }}>🏫</span>
                  <strong style={{ fontSize: "var(--text-base)", color: "var(--color-primary)" }}>
                    {heroContent.image.fallbackLabel}
                  </strong>
                  <p style={{ fontSize: "var(--text-xs)", marginTop: "var(--space-2)" }}>
                    1/1 Samsul Huda Road &bull; Park Circus, Kolkata
                  </p>
                </div>
              )}

              {/* Decorative Subtle Gradient Overlay at bottom */}
              <div
                style={{
                  position: "absolute",
                  inset: "auto 0 0 0",
                  height: "35%",
                  background: "linear-gradient(to top, rgba(29, 29, 31, 0.45), transparent)",
                  pointerEvents: "none",
                }}
              />
            </div>

            {/* Floating Educational Badges */}
            <div
              className="floating-badge-top"
              style={{
                position: "absolute",
                top: "-12px",
                left: "16px",
                backgroundColor: "rgba(255, 255, 255, 0.94)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                padding: "8px 14px",
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-md)",
                border: "1px solid var(--color-border)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span style={{ fontSize: "16px" }}>{heroContent.floatingBadges[0].icon}</span>
              <div>
                <div style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-primary)" }}>
                  {heroContent.floatingBadges[0].text}
                </div>
                <div style={{ fontSize: "10px", color: "var(--color-neutral-dark)" }}>
                  {heroContent.floatingBadges[0].subtext}
                </div>
              </div>
            </div>

            <div
              className="floating-badge-bottom"
              style={{
                position: "absolute",
                bottom: "-16px",
                right: "16px",
                backgroundColor: "rgba(255, 255, 255, 0.94)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                padding: "8px 14px",
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-md)",
                border: "1px solid var(--color-border)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span style={{ fontSize: "16px" }}>{heroContent.floatingBadges[1].icon}</span>
              <div>
                <div style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-primary)" }}>
                  {heroContent.floatingBadges[1].text}
                </div>
                <div style={{ fontSize: "10px", color: "var(--color-accent)", fontWeight: 500 }}>
                  {heroContent.floatingBadges[1].subtext}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 540px) {
          .floating-badge-top,
          .floating-badge-bottom {
            position: static !important;
            margin-top: 10px !important;
          }
        }
      `}</style>
    </section>
  );
}
