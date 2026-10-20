import React from "react";
import { ArrowRight } from "lucide-react";
import { HeroGallery } from "./HeroGallery";
import type { HeroContent } from "@/content/types";

interface HeroProps {
  hero: HeroContent;
}

export function Hero({ hero }: HeroProps) {
  return (
    <section
      style={{
        position: "relative",
        paddingTop: "clamp(24px, 3.5vw, 36px)",
        paddingBottom: "clamp(24px, 3vw, 36px)",
        backgroundColor: "#F5F5F7",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "clamp(465px, 33vw, 470px)",
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: "none",
          backgroundImage: `
            radial-gradient(circle, rgba(29, 29, 31, 0.08) 1.5px, transparent 1.5px),
            linear-gradient(to right, rgba(29, 29, 31, 0.045) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(29, 29, 31, 0.045) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px, 48px 48px, 48px 48px",
          backgroundPosition: "-0.5px -0.5px, 0 0, 0 0",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 35%, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 65%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 35%, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 65%, transparent 100%)",
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 24px",
          textAlign: "center",
        }}
      >
        <h1
          className="hero-enter-headline"
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: "clamp(2.25rem, 5.2vw, 4.5rem)",
            lineHeight: 1.06,
            letterSpacing: "-0.015em",
            maxWidth: "24ch",
            color: "#1D1D1F",
            margin: "0 auto 14px",
          }}
        >
          <span style={{ display: "inline-block" }}>Clear the concept.</span>{" "}
          <span style={{ display: "inline-block" }}>Then decode the question.</span>
        </h1>

        <p
          className="hero-enter-subheadline"
          style={{
            maxWidth: "60ch",
            color: "rgba(29, 29, 31, 0.72)",
            fontSize: "clamp(0.95rem, 1.5vw, 1.125rem)",
            lineHeight: 1.45,
            margin: "0 auto 20px",
          }}
        >
          {hero.subheadline}
        </p>

        <div
          className="hero-enter-actions"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <a
            href={hero.primaryCta.href}
            className="btn-primary"
            style={{
              padding: "11px 24px",
              borderRadius: "10px",
              fontSize: "15px",
              fontWeight: 600,
            }}
          >
            {hero.primaryCta.label}
          </a>

          <a
            href={hero.secondaryCta.href}
            style={{
              color: "#1D1D1F",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "15px",
              fontWeight: 600,
              textDecoration: "none",
              padding: "10px 14px",
            }}
          >
            <span>{hero.secondaryCta.label}</span>
            <ArrowRight size={18} style={{ color: "#007AFF" }} />
          </a>
        </div>

        <p
          className="hero-enter-subjects"
          style={{
            marginTop: "16px",
            fontSize: "13px",
            color: "var(--color-text-secondary)",
            letterSpacing: "0.01em",
            marginBottom: "0",
          }}
        >
          Mathematics, Physics, Chemistry, Biology, English, Accountancy, Economics, Computer Science
        </p>
      </div>

      <HeroGallery items={hero.gallery} />
    </section>
  );
}
