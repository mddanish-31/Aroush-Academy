"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { Phone, Mail, MapPin } from "lucide-react";
import { openCookiePreferences } from "./CookieConsent";
import { MotionToggle } from "@/lib/motion/MotionProvider";
import { siteSettings } from "@/content/site";
import { MEDIA } from "@/content/media";

export function Footer() {
  const photoCredits = useMemo(() => {
    const list: string[] = [];
    MEDIA.heroGallery.forEach((m) => m.credit && list.push(m.credit));
    MEDIA.campus.forEach((m) => m.credit && list.push(m.credit));
    Object.values(MEDIA.courses).forEach((m) => m.credit && list.push(m.credit));
    if (MEDIA.og.credit) list.push(MEDIA.og.credit);
    return Array.from(new Set(list)).sort().join(", ");
  }, []);

  return (
    <footer
      role="contentinfo"
      style={{
        backgroundColor: "#FFFFFF",
        borderTop: "1px solid rgba(170, 170, 170, 0.35)",
        marginTop: "var(--space-16)",
        paddingTop: "var(--space-16)",
        paddingBottom: "var(--space-12)",
      }}
    >
      <div className="container">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "var(--space-8)",
            marginBottom: "var(--space-12)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
              <span
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "6px",
                  backgroundColor: "#1D1D1F",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "14px",
                }}
              >
                A
              </span>
              <strong style={{ fontSize: "var(--text-base)", color: "#1D1D1F" }}>
                {siteSettings.siteName}
              </strong>
            </div>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", lineHeight: 1.6, marginBottom: "var(--space-4)" }}>
              Premier academic coaching for Class V-XII across ICSE, CBSE, and West Bengal Board curricula. Concept-first teaching with dedicated subject specialists and intensive mathematics under Azhar Sir.
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
                fontSize: "12px",
                color: "var(--color-text-secondary)",
                lineHeight: 1.5,
              }}
            >
              <MapPin size={16} strokeWidth={2} style={{ color: "#007AFF", flexShrink: 0, marginTop: "2px" }} />
              <span>{siteSettings.address}</span>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: "var(--text-xs)", textTransform: "uppercase", letterSpacing: "0.08em", color: "#1D1D1F", fontWeight: 600, marginBottom: "var(--space-3)" }}>
              Programs
            </h3>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              <li>
                <Link href="/#course-v-viii" className="nav-link" style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                  Class V-VIII (Foundation)
                </Link>
              </li>
              <li>
                <Link href="/#course-ix-x" className="nav-link" style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                  Class IX-X (Board Intensive)
                </Link>
              </li>
              <li>
                <Link href="/#course-xi-xii" className="nav-link" style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                  Class XI-XII (Commerce &amp; Science)
                </Link>
              </li>
              <li>
                <Link href="/#course-xi-xii" className="nav-link" style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                  Class XI-XII (Humanities &amp; Arts)
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 style={{ fontSize: "var(--text-xs)", textTransform: "uppercase", letterSpacing: "0.08em", color: "#1D1D1F", fontWeight: 600, marginBottom: "var(--space-3)" }}>
              Academy
            </h3>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              <li>
                <Link href="/#about" className="nav-link" style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                  About ArousH Academy
                </Link>
              </li>
              <li>
                <Link href="/#method" className="nav-link" style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                  Teaching Methodology
                </Link>
              </li>
              <li>
                <Link href="/#faculty" className="nav-link" style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                  Faculty Specialists
                </Link>
              </li>
              <li>
                <Link href="/#enquiry" className="nav-link" style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                  Admission Enquiries
                </Link>
              </li>
              <li>
                <Link href="/faq" className="nav-link" style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                  Frequently Asked Questions
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 style={{ fontSize: "var(--text-xs)", textTransform: "uppercase", letterSpacing: "0.08em", color: "#1D1D1F", fontWeight: 600, marginBottom: "var(--space-3)" }}>
              Legal and Contact
            </h3>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              <li>
                <Link href="/privacy" className="nav-link" style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="nav-link" style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                  Terms of Use and Conditions
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={openCookiePreferences}
                  style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--color-text-secondary)",
                    padding: 0,
                    textAlign: "left",
                    cursor: "pointer",
                    background: "none",
                    border: "none",
                    transition: "color 200ms ease-out",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#1D1D1F")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}
                >
                  Cookie Settings
                </button>
              </li>
              <li style={{ marginTop: "var(--space-2)" }}>
                <a
                  href={`tel:${siteSettings.phone.replace(/\s+/g, "")}`}
                  style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "var(--text-sm)", color: "#1D1D1F", textDecoration: "none" }}
                >
                  <Phone size={14} style={{ color: "#007AFF" }} />
                  <span>{siteSettings.phone}</span>
                </a>
              </li>
              {siteSettings.phoneSecondary && (
                <li>
                  <a
                    href={`tel:${siteSettings.phoneSecondary.replace(/\s+/g, "")}`}
                    style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "var(--text-sm)", color: "#1D1D1F", textDecoration: "none" }}
                  >
                    <Phone size={14} style={{ color: "#007AFF" }} />
                    <span>{siteSettings.phoneSecondary}</span>
                  </a>
                </li>
              )}
              <li>
                <a
                  href={`mailto:${siteSettings.email}`}
                  style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "var(--text-sm)", color: "#1D1D1F", textDecoration: "none" }}
                >
                  <Mail size={14} style={{ color: "#007AFF" }} />
                  <span style={{ textDecoration: "underline", textDecorationColor: "#007AFF", textUnderlineOffset: "3px" }}>Email Admissions</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div
          style={{
            paddingTop: "var(--space-6)",
            borderTop: "1px solid rgba(170, 170, 170, 0.35)",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "var(--space-3)",
            fontSize: "12px",
            color: "var(--color-text-secondary)",
          }}
        >
          <span>&copy; 2026 ArousH Academy (Azhar Sir). All rights reserved.</span>
          <span>Photos: Unsplash ({photoCredits})</span>
          <MotionToggle />
        </div>
      </div>
    </footer>
  );
}
