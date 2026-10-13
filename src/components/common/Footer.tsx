"use client";

import React from "react";
import Link from "next/link";
import { openCookiePreferences } from "./CookieConsent";

export function Footer() {
  return (
    <footer
      role="contentinfo"
      style={{
        backgroundColor: "var(--color-surface)",
        borderTop: "1px solid var(--color-border)",
        marginTop: "var(--space-16)",
        paddingTop: "var(--space-16)",
        paddingBottom: "var(--space-12)",
      }}
    >
      <div className="container">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "var(--space-8)",
            marginBottom: "var(--space-12)",
          }}
        >
          {/* Brand Info */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
              <span
                style={{
                  width: "26px",
                  height: "26px",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "var(--color-primary)",
                  color: "var(--color-surface)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "13px",
                }}
              >
                A
              </span>
              <strong style={{ fontSize: "var(--text-base)", color: "var(--color-primary)" }}>ArousH Academy</strong>
            </div>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-neutral-dark)", lineHeight: 1.6, marginBottom: "var(--space-4)" }}>
              Premier academic coaching for Classes V–XII across ICSE, CBSE, and West Bengal Board curricula. Concept-first teaching with dedicated subject specialists and intensive mathematics under Azhar Sir.
            </p>
            <div
              style={{
                fontSize: "11px",
                color: "var(--color-neutral-dark)",
                backgroundColor: "var(--color-surface-muted)",
                padding: "8px 12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-border)",
                lineHeight: 1.4,
              }}
            >
              1/1 Samsul Huda Road, Park Circus, Ballygunge, Kolkata 700017 (Near Quest Mall)
            </div>
          </div>

          {/* Academy Navigation */}
          <div>
            <h4 style={{ fontSize: "var(--text-xs)", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-neutral-dark)", marginBottom: "var(--space-3)" }}>
              Academy Navigation
            </h4>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              <li>
                <Link href="/#about" style={{ fontSize: "var(--text-sm)", color: "var(--color-neutral-dark)" }}>
                  About ArousH Academy
                </Link>
              </li>
              <li>
                <Link href="/#courses" style={{ fontSize: "var(--text-sm)", color: "var(--color-neutral-dark)" }}>
                  Courses (Classes V–XII)
                </Link>
              </li>
              <li>
                <Link href="/#features" style={{ fontSize: "var(--text-sm)", color: "var(--color-neutral-dark)" }}>
                  Why Choose Us
                </Link>
              </li>
              <li>
                <Link href="/#faculty" style={{ fontSize: "var(--text-sm)", color: "var(--color-neutral-dark)" }}>
                  Faculty &amp; Teaching Team
                </Link>
              </li>
              <li>
                <Link href="/#enquiry" style={{ fontSize: "var(--text-sm)", color: "var(--color-neutral-dark)" }}>
                  Admission Inquiries
                </Link>
              </li>
              <li>
                <Link href="/faq" style={{ fontSize: "var(--text-sm)", color: "var(--color-neutral-dark)" }}>
                  Frequently Asked Questions
                </Link>
              </li>
            </ul>
          </div>

          {/* Role Portals Direct Links */}
          <div>
            <h4 style={{ fontSize: "var(--text-xs)", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-neutral-dark)", marginBottom: "var(--space-3)" }}>
              Portal Access
            </h4>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              <li>
                <Link href="/login" style={{ fontSize: "var(--text-sm)", color: "var(--color-neutral-dark)" }}>
                  Student Portal Sign In
                </Link>
              </li>
              <li>
                <Link href="/login" style={{ fontSize: "var(--text-sm)", color: "var(--color-neutral-dark)" }}>
                  Parent Oversight Sign In
                </Link>
              </li>
              <li>
                <Link href="/login" style={{ fontSize: "var(--text-sm)", color: "var(--color-neutral-dark)" }}>
                  Teacher Workspace Sign In
                </Link>
              </li>
              <li>
                <Link href="/login" style={{ fontSize: "var(--text-sm)", color: "var(--color-neutral-dark)" }}>
                  Academy Admin Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Legal */}
          <div>
            <h4 style={{ fontSize: "var(--text-xs)", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-neutral-dark)", marginBottom: "var(--space-3)" }}>
              Contact &amp; Admissions
            </h4>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              <li>
                <a href="tel:09883005641" style={{ fontSize: "var(--text-sm)", color: "var(--color-primary)", fontWeight: 500, textDecoration: "none" }}>
                  📞 098830 05641
                </a>
              </li>
              <li>
                <a href="tel:8240816226" style={{ fontSize: "var(--text-sm)", color: "var(--color-primary)", fontWeight: 500, textDecoration: "none" }}>
                  📞 82408 16226
                </a>
              </li>
              <li>
                <a href="mailto:aroushacademyazharsir@gmail.com" style={{ fontSize: "var(--text-sm)", color: "var(--color-accent)", textDecoration: "none" }}>
                  ✉️ Email Admissions
                </a>
              </li>
              <li style={{ marginTop: "var(--space-2)" }}>
                <Link href="/privacy" style={{ fontSize: "var(--text-sm)", color: "var(--color-neutral-dark)" }}>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={openCookiePreferences}
                  style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--color-accent)",
                    padding: 0,
                    textAlign: "left",
                    cursor: "pointer",
                    background: "none",
                    border: "none",
                  }}
                >
                  Cookie Preferences
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Line */}
        <div
          style={{
            paddingTop: "var(--space-6)",
            borderTop: "1px solid var(--color-border)",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "var(--space-4)",
            fontSize: "var(--text-xs)",
            color: "var(--color-neutral)",
          }}
        >
          <span>&copy; 2026 ArousH Academy (Azhar Sir). All rights reserved.</span>
          <span>1/1 Samsul Huda Road, Park Circus, Kolkata &bull; ICSE, CBSE &amp; WB Board Coaching</span>
        </div>
      </div>
    </footer>
  );
}
