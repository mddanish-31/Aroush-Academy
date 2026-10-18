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
        paddingTop: "clamp(48px, 8vw, 96px)",
        paddingBottom: "clamp(40px, 6vw, 72px)",
        backgroundColor: "#F5F5F7",
        overflow: "hidden",
      }}
    >
      <div
        style={{
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
            fontSize: "clamp(2.5rem, 6.5vw, 5.25rem)",
            lineHeight: 1.02,
            textWrap: "balance",
            maxWidth: "16ch",
            color: "#1D1D1F",
            fontWeight: 700,
            margin: "0 auto 20px",
          }}
        >
          {hero.headline}
        </h1>

        <p
          className="hero-enter-subheadline"
          style={{
            maxWidth: "56ch",
            color: "rgba(29, 29, 31, 0.72)",
            fontSize: "clamp(1.05rem, 2vw, 1.25rem)",
            lineHeight: 1.5,
            margin: "0 auto 36px",
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
            gap: "20px",
          }}
        >
          <a
            href={hero.primaryCta.href}
            className="btn-primary"
            style={{
              padding: "14px 28px",
              borderRadius: "10px",
              fontSize: "16px",
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
              fontSize: "16px",
              fontWeight: 600,
              textDecoration: "none",
              padding: "12px 16px",
            }}
          >
            <span>{hero.secondaryCta.label}</span>
            <ArrowRight size={18} style={{ color: "#007AFF" }} />
          </a>
        </div>
      </div>

      <HeroGallery items={hero.gallery} />
    </section>
  );
}
