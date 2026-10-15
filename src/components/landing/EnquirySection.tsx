"use client";

import React, { useState } from "react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { academyCenterInfo } from "@/data/homepageContent";

export function EnquirySection() {
  const [formData, setFormData] = useState({
    studentName: "",
    contactNumber: "",
    targetClass: "Class IX",
    targetBoard: "ICSE",
    notes: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    const cleanName = formData.studentName.trim();
    const cleanPhone = formData.contactNumber.trim();

    if (!cleanName || cleanName.length < 2) {
      setErrorMessage("Please enter the student's full name (at least 2 characters).");
      return;
    }

    const digitsOnly = cleanPhone.replace(/\D/g, "");
    if (digitsOnly.length < 10) {
      setErrorMessage("Please enter a valid phone number (at least 10 digits).");
      return;
    }

    setSubmitted(true);
  };

  return (
    <section id="enquiry" style={{ padding: "var(--space-16) 0" }}>
      {/* Anchor for #contact */}
      <span id="contact" style={{ display: "block", position: "relative", top: "-80px", visibility: "hidden" }} />
      <div className="container">
        <div style={{ textAlign: "center", marginBottom: "var(--space-12)" }}>
          <Badge variant="accent" size="sm">
            Admissions &bull; Park Circus Campus
          </Badge>
          <h2
            style={{
              fontSize: "clamp(1.85rem, 4vw, 2.75rem)",
              letterSpacing: "-0.02em",
              marginTop: "var(--space-3)",
              marginBottom: "var(--space-3)",
            }}
          >
            Come and see a class before you decide.
          </h2>
          <p style={{ maxWidth: "640px", margin: "0 auto", fontSize: "var(--text-base)", color: "var(--color-neutral-dark)", lineHeight: 1.6 }}>
            Walk in during our weekly operating hours, call Azhar Sir directly, or submit student details below to check batch availability.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "var(--space-8)",
            alignItems: "start",
          }}
        >
          {/* Left Column: Direct Campus Details */}
          <Card padding="lg" style={{ backgroundColor: "var(--color-surface)" }}>
            <h3 style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-4)" }}>
              Direct Academy Contact
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-neutral-dark)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Campus Address
                </span>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--color-primary)", marginTop: "3px", lineHeight: 1.5 }}>
                  {academyCenterInfo.address}
                </p>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--color-accent)", fontWeight: 500 }}>
                  📍 {academyCenterInfo.landmark}
                </span>
              </div>

              <div>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-neutral-dark)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Direct Phone Lines
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", marginTop: "4px" }}>
                  {academyCenterInfo.phones.map((phone, i) => (
                    <a
                      key={i}
                      href={`tel:${phone.replace(/\s+/g, "")}`}
                      style={{
                        fontSize: "var(--text-sm)",
                        fontWeight: 600,
                        color: "var(--color-primary)",
                        padding: "6px 12px",
                        backgroundColor: "var(--color-surface-muted)",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--color-border)",
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      📞 {phone}
                    </a>
                  ))}
                </div>
              </div>

              <div>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-neutral-dark)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Email Communications
                </span>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--color-primary)", marginTop: "3px" }}>
                  <a href={`mailto:${academyCenterInfo.emails[0]}`} style={{ color: "var(--color-accent)" }}>
                    {academyCenterInfo.emails[0]}
                  </a>
                </p>
              </div>
            </div>

            <div
              style={{
                padding: "var(--space-3) var(--space-4)",
                backgroundColor: "var(--color-surface-muted)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                fontSize: "var(--text-xs)",
                color: "var(--color-neutral-dark)",
                lineHeight: 1.5,
              }}
            >
              Classes V–XII &bull; ICSE, CBSE &amp; West Bengal Board &bull; Maths 3 days/week with dual teachers.
            </div>
          </Card>

          {/* Right Column: Admission Inquiry Form */}
          <Card padding="lg">
            <h3 style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-1)" }}>
              Admission &amp; Batch Inquiry
            </h3>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", marginBottom: "var(--space-5)" }}>
              Leave student details below to check batch timing options and syllabus schedules.
            </p>

            {submitted ? (
              <div
                style={{
                  padding: "var(--space-6)",
                  backgroundColor: "rgba(52, 199, 89, 0.08)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid rgba(52, 199, 89, 0.25)",
                  textAlign: "center",
                }}
              >
                <span style={{ fontSize: "36px" }}>📋</span>
                <h4 style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-primary)", marginTop: "var(--space-2)", marginBottom: "var(--space-1)" }}>
                  Inquiry Details Recorded
                </h4>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", lineHeight: 1.5, marginBottom: "var(--space-4)" }}>
                  Thank you, <strong>{formData.studentName}</strong>. Your inquiry for <strong>{formData.targetClass} ({formData.targetBoard})</strong> has been registered in this browser session.
                </p>

                <div
                  style={{
                    padding: "var(--space-3) var(--space-4)",
                    backgroundColor: "var(--color-surface)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-border)",
                    fontSize: "11px",
                    color: "var(--color-neutral-dark)",
                    textAlign: "left",
                    lineHeight: 1.5,
                    marginBottom: "var(--space-4)",
                  }}
                >
                  <strong style={{ color: "var(--color-primary)", display: "block", marginBottom: "2px" }}>
                    Next Step for Admissions:
                  </strong>
                  To confirm immediate batch availability or consult with Azhar Sir directly, please contact our admissions office:
                </div>

                <div style={{ display: "flex", gap: "var(--space-2)", justifyContent: "center", flexWrap: "wrap", marginBottom: "var(--space-4)" }}>
                  <Button href="tel:09883005641" variant="accent" size="sm">
                    📞 Call 098830 05641
                  </Button>
                  <Button href="tel:8240816226" variant="secondary" size="sm">
                    📞 Call 82408 16226
                  </Button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({
                      studentName: "",
                      contactNumber: "",
                      targetClass: "Class IX",
                      targetBoard: "ICSE",
                      notes: "",
                    });
                  }}
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-accent)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Submit another inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                {errorMessage && (
                  <div
                    style={{
                      padding: "8px 12px",
                      backgroundColor: "rgba(255, 59, 48, 0.1)",
                      border: "1px solid rgba(255, 59, 48, 0.3)",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "var(--text-xs)",
                      color: "#D70015",
                      fontWeight: 500,
                    }}
                  >
                    ⚠️ {errorMessage}
                  </div>
                )}

                <div>
                  <label htmlFor="student-name" style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-primary)", display: "block", marginBottom: "4px" }}>
                    Student Full Name *
                  </label>
                  <input
                    id="student-name"
                    type="text"
                    required
                    placeholder="e.g. Taha Rahman"
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--color-border)",
                      fontSize: "var(--text-sm)",
                      backgroundColor: "var(--color-surface)",
                      color: "var(--color-primary)",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="contact-num" style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-primary)", display: "block", marginBottom: "4px" }}>
                    Parent / Contact Phone Number *
                  </label>
                  <input
                    id="contact-num"
                    type="tel"
                    required
                    placeholder="e.g. 098830 05641"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--color-border)",
                      fontSize: "var(--text-sm)",
                      backgroundColor: "var(--color-surface)",
                      color: "var(--color-primary)",
                      outline: "none",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
                  <div>
                    <label htmlFor="target-class" style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-primary)", display: "block", marginBottom: "4px" }}>
                      Academic Class
                    </label>
                    <select
                      id="target-class"
                      value={formData.targetClass}
                      onChange={(e) => setFormData({ ...formData, targetClass: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--color-border)",
                        fontSize: "var(--text-sm)",
                        backgroundColor: "var(--color-surface)",
                        color: "var(--color-primary)",
                        outline: "none",
                      }}
                    >
                      <option value="Class V">Class V</option>
                      <option value="Class VI">Class VI</option>
                      <option value="Class VII">Class VII</option>
                      <option value="Class VIII">Class VIII</option>
                      <option value="Class IX">Class IX</option>
                      <option value="Class X">Class X</option>
                      <option value="Class XI">Class XI</option>
                      <option value="Class XII">Class XII</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="target-board" style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-primary)", display: "block", marginBottom: "4px" }}>
                      Education Board
                    </label>
                    <select
                      id="target-board"
                      value={formData.targetBoard}
                      onChange={(e) => setFormData({ ...formData, targetBoard: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--color-border)",
                        fontSize: "var(--text-sm)",
                        backgroundColor: "var(--color-surface)",
                        color: "var(--color-primary)",
                        outline: "none",
                      }}
                    >
                      <option value="ICSE">ICSE</option>
                      <option value="CBSE">CBSE</option>
                      <option value="West Bengal Board">West Bengal Board</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="notes" style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-primary)", display: "block", marginBottom: "4px" }}>
                    Subjects Needed / Preferred Timings
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    placeholder="e.g. Interested in Maths 3-day batch and Science mock tests..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--color-border)",
                      fontSize: "var(--text-sm)",
                      backgroundColor: "var(--color-surface)",
                      color: "var(--color-primary)",
                      outline: "none",
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                <Button type="submit" variant="accent" size="md" style={{ width: "100%" }}>
                  Submit Admission Inquiry
                </Button>

                <p style={{ fontSize: "11px", color: "var(--color-neutral-dark)", textAlign: "center", margin: 0 }}>
                  Inquiries are reviewed directly by Azhar Sir and admissions staff at Park Circus.
                </p>
              </form>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
}
