import React from "react";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — AROUSH Academy",
  description: "Privacy and student data protection policy for AROUSH Academy, Park Circus, Kolkata.",
};

export default function PrivacyPage() {
  return (
    <div style={{ paddingTop: "var(--space-12)", paddingBottom: "var(--space-16)" }}>
      <div className="container-narrow">
        <div style={{ marginBottom: "var(--space-8)" }}>
          <Badge variant="accent" size="sm">
            AROUSH Academy &bull; Student &amp; Parent Privacy
          </Badge>
          <h1
            style={{
              fontSize: "clamp(2rem, 4vw, 2.75rem)",
              letterSpacing: "-0.025em",
              color: "var(--color-primary)",
              marginTop: "var(--space-2)",
              marginBottom: "var(--space-3)",
            }}
          >
            Privacy Policy
          </h1>
          <p style={{ fontSize: "var(--text-base)", color: "var(--color-neutral-dark)", lineHeight: 1.6 }}>
            Our commitment to student data confidentiality, academic record transparency, and family privacy.
          </p>
        </div>

        {/* Structured Policy Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>
          <section>
            <h2 style={{ fontSize: "var(--text-xl)", color: "var(--color-primary)", marginBottom: "var(--space-3)" }}>
              1. Academy Information &amp; Scope
            </h2>
            <p style={{ fontSize: "var(--text-sm)", lineHeight: 1.7, color: "var(--color-neutral-dark)", marginBottom: "var(--space-2)" }}>
              AROUSH Academy (founded by Azhar Sir) operates an in-person coaching center at 1/1, Samsul Huda Road, near Jeebrail International School, Park Circus, Ballygunge, Kolkata, West Bengal 700017. We provide academic coaching for ICSE, CBSE, and West Bengal Board students across Classes V–XII.
            </p>
            <p style={{ fontSize: "var(--text-sm)", lineHeight: 1.7, color: "var(--color-neutral-dark)" }}>
              This policy explains how our academic portal and administrative records handle student and guardian data.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "var(--text-xl)", color: "var(--color-primary)", marginBottom: "var(--space-3)" }}>
              2. Information We Handle
            </h2>
            <p style={{ fontSize: "var(--text-sm)", lineHeight: 1.7, color: "var(--color-neutral-dark)", marginBottom: "var(--space-3)" }}>
              To deliver academic guidance, progress monitoring, and institutional administration, we handle the following categories of records:
            </p>
            <ul style={{ paddingLeft: "var(--space-5)", fontSize: "var(--text-sm)", color: "var(--color-neutral-dark)", display: "flex", flexDirection: "column", gap: "8px", lineHeight: 1.6 }}>
              <li><strong>Student &amp; Guardian Details:</strong> Full student name, enrolled class/grade, board affiliation (ICSE/CBSE/WB), parent or guardian names, verified phone numbers, and emergency contact details.</li>
              <li><strong>Academic Performance Records:</strong> Class test scores, monthly mock examination marks, subject breakdown, attendance logs, and teacher evaluative feedback.</li>
              <li><strong>Fee &amp; Administrative Records:</strong> Installment status, fee receipt transaction IDs, payment dates, and outstanding balances. We do not store credit card or bank credentials on our website.</li>
              <li><strong>Device &amp; Session Preferences:</strong> Light/dark theme preference and essential session tokens stored locally in your browser.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: "var(--text-xl)", color: "var(--color-primary)", marginBottom: "var(--space-3)" }}>
              3. Cookies and Local Storage Policy
            </h2>
            <p style={{ fontSize: "var(--text-sm)", lineHeight: 1.7, color: "var(--color-neutral-dark)", marginBottom: "var(--space-2)" }}>
              Our website uses strictly necessary client-side storage to provide an efficient user experience:
            </p>
            <p style={{ fontSize: "var(--text-sm)", lineHeight: 1.7, color: "var(--color-neutral-dark)", marginBottom: "var(--space-2)" }}>
              &bull; <strong>Essential Session Storage:</strong> Temporary browser storage (`sessionStorage` and `localStorage`) maintains active portal navigation, role persona selection, and interface theme settings.<br />
              &bull; <strong>Zero Third-Party Advertising Trackers:</strong> We do not sell student or family information. No third-party ad networks, tracking pixels, or commercial tracking beacons are installed on this website.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "var(--text-xl)", color: "var(--color-primary)", marginBottom: "var(--space-3)" }}>
              4. Data Protection &amp; Confidentiality
            </h2>
            <p style={{ fontSize: "var(--text-sm)", lineHeight: 1.7, color: "var(--color-neutral-dark)", marginBottom: "var(--space-2)" }}>
              Student test marks and academic results are kept confidential between the student, their respective teachers, and their registered parent/guardian. Access is restricted according to the four institutional roles: Academy Admin, Teacher, Student, and Parent.
            </p>
            <p style={{ fontSize: "var(--text-sm)", lineHeight: 1.7, color: "var(--color-neutral-dark)" }}>
              Digital ID cards, examination certificates, and fee receipts are strictly tied to the verified student profile.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "var(--text-xl)", color: "var(--color-primary)", marginBottom: "var(--space-3)" }}>
              5. Guardian Rights &amp; Contact Inquiries
            </h2>
            <p style={{ fontSize: "var(--text-sm)", lineHeight: 1.7, color: "var(--color-neutral-dark)", marginBottom: "var(--space-3)" }}>
              Parents, guardians, and enrolled students may request verification, correction, or copies of their academic records at any time by contacting our administrative desk:
            </p>
            <div
              style={{
                backgroundColor: "var(--color-surface-muted)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                padding: "var(--space-4)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-2)",
                fontSize: "var(--text-sm)",
              }}
            >
              <div><strong>Center Address:</strong> 1/1, Samsul Huda Road, Park Circus, Kolkata 700017 (Near Quest Mall)</div>
              <div><strong>Direct Phone:</strong> <a href="tel:09883005641" style={{ color: "var(--color-accent)", textDecoration: "none" }}>098830 05641</a> / <a href="tel:8240816226" style={{ color: "var(--color-accent)", textDecoration: "none" }}>82408 16226</a></div>
              <div><strong>Email:</strong> <a href="mailto:aroushacademyazharsir@gmail.com" style={{ color: "var(--color-accent)", textDecoration: "none" }}>aroushacademyazharsir@gmail.com</a></div>
            </div>
            <div style={{ marginTop: "var(--space-6)" }}>
              <Link href="/" style={{ color: "var(--color-accent)", fontSize: "var(--text-sm)", textDecoration: "none", fontWeight: 600 }}>
                &larr; Return to AROUSH Academy Home
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
