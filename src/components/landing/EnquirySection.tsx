"use client";

import React, { useState } from "react";
import { Phone, Mail, MapPin, AlertCircle, CheckCircle2 } from "lucide-react";
import { Reveal } from "@/components/common/Reveal";
import { submitEnquiry } from "@/content/enquiry";
import type { EnquiryResult } from "@/content/enquiry";
import type { SiteSettings } from "@/content/types";

export function EnquirySection({ siteSettings }: { siteSettings: SiteSettings }) {
  const [formData, setFormData] = useState({
    studentName: "",
    contactNumber: "",
    targetClass: "Class IX",
    targetBoard: "ICSE",
    notes: "",
    honeypot: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<EnquiryResult | null>(null);

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    const name = formData.studentName.trim();
    const phone = formData.contactNumber.trim().replace(/\D/g, "");

    if (!name || name.length < 2) {
      nextErrors.studentName = "Please enter the student's full name (at least 2 characters).";
    }

    if (!phone || phone.length < 10) {
      nextErrors.contactNumber = "Please enter a valid phone number (at least 10 digits).";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitResult(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitEnquiry(formData);
      setSubmitResult(res);
    } catch {
      setSubmitResult({
        success: false,
        fallbackNeeded: true,
        message: "An unexpected error occurred. Please contact our admissions desk directly by phone or email.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="enquiry"
      style={{
        backgroundColor: "var(--color-surface)",
        padding: "clamp(64px, 8vw, 112px) 0",
        borderTop: "1px solid var(--color-border)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <span id="contact" style={{ display: "block", position: "relative", top: "-80px", visibility: "hidden" }} />
      <span id="visit" style={{ display: "block", position: "relative", top: "-80px", visibility: "hidden" }} />
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
        <Reveal>
          <div style={{ marginBottom: "clamp(36px, 5vw, 64px)" }}>
            <span
              style={{
                fontSize: "12px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--color-text-secondary)",
                fontWeight: 600,
                display: "inline-block",
                marginBottom: "12px",
              }}
            >
              Admissions Enquiry
            </span>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2rem, 4.5vw, 3.25rem)",
                lineHeight: 1.08,
                color: "var(--brand-navy)",
                fontWeight: 700,
                maxWidth: "24ch",
                margin: 0,
              }}
            >
              Come and observe a lecture before making a decision.
            </h2>
          </div>
        </Reveal>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "clamp(36px, 6vw, 64px)",
            alignItems: "start",
          }}
        >
          <Reveal delay={60}>
            <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
              <p
                style={{
                  fontSize: "15px",
                  lineHeight: 1.6,
                  color: "var(--color-text-secondary)",
                  margin: 0,
                }}
              >
                In-person academic consultations are held at our Park Circus campus with Azhar Sir to review syllabus requirements and discuss student goals.
              </p>

              <div
                style={{
                  padding: "24px",
                  borderRadius: "var(--radius-lg)",
                  backgroundColor: "var(--brand-sky-soft)",
                  border: "1px solid var(--color-border)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <MapPin size={18} style={{ color: "var(--brand-teal)", flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--brand-navy)", display: "block", marginBottom: "2px" }}>
                      Campus Location
                    </span>
                    <span style={{ fontSize: "14px", color: "var(--color-text-secondary)", lineHeight: 1.5, display: "block" }}>
                      {siteSettings.address}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <Phone size={18} style={{ color: "var(--brand-teal)", flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--brand-navy)", display: "block", marginBottom: "2px" }}>
                      Direct Contact Numbers
                    </span>
                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "2px" }}>
                      <a
                        href={`tel:${siteSettings.phone.replace(/\s/g, "")}`}
                        style={{ fontSize: "14px", color: "var(--brand-navy)", fontWeight: 600, textDecoration: "underline", textDecorationColor: "var(--brand-teal)" }}
                      >
                        {siteSettings.phone}
                      </a>
                      {siteSettings.phoneSecondary && (
                        <a
                          href={`tel:${siteSettings.phoneSecondary.replace(/\s/g, "")}`}
                          style={{ fontSize: "14px", color: "var(--brand-navy)", fontWeight: 600, textDecoration: "underline", textDecorationColor: "var(--brand-teal)" }}
                        >
                          {siteSettings.phoneSecondary}
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <Mail size={18} style={{ color: "var(--brand-teal)", flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--brand-navy)", display: "block", marginBottom: "2px" }}>
                      Email Admissions Desk
                    </span>
                    <a
                      href={`mailto:${siteSettings.email}`}
                      style={{ fontSize: "14px", color: "var(--brand-navy)", fontWeight: 600, textDecoration: "underline", textDecorationColor: "var(--brand-teal)", display: "block", marginTop: "2px" }}
                    >
                      {siteSettings.email}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div
              style={{
                backgroundColor: "var(--brand-beige)",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--color-border)",
                padding: "clamp(24px, 4vw, 36px)",
              }}
            >
              {submitResult ? (
                <div
                  role="status"
                  aria-live="polite"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      color: "var(--brand-navy)",
                      fontWeight: 600,
                      fontSize: "16px",
                    }}
                  >
                    {submitResult.success ? (
                      <CheckCircle2 size={20} style={{ color: "var(--brand-teal)" }} />
                    ) : (
                      <AlertCircle size={20} style={{ color: "var(--brand-teal)" }} />
                    )}
                    <span>{submitResult.success ? "Enquiry Received" : "Notice"}</span>
                  </div>

                  <p
                    style={{
                      fontSize: "14px",
                      lineHeight: 1.6,
                      color: "var(--color-text-secondary)",
                      margin: 0,
                    }}
                  >
                    {submitResult.message}
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setSubmitResult(null);
                      setFormData({
                        studentName: "",
                        contactNumber: "",
                        targetClass: "Class IX",
                        targetBoard: "ICSE",
                        notes: "",
                        honeypot: "",
                      });
                    }}
                    style={{
                      alignSelf: "flex-start",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "var(--brand-navy)",
                      background: "none",
                      border: "none",
                      padding: 0,
                      textDecoration: "underline",
                      textDecorationColor: "var(--brand-teal)",
                      cursor: "pointer",
                      marginTop: "8px",
                    }}
                  >
                    Submit another enquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                  <div style={{ position: "absolute", left: "-9999px", opacity: 0 }} aria-hidden="true">
                    <label htmlFor="enquiry-website">Leave blank</label>
                    <input
                      id="enquiry-website"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={formData.honeypot}
                      onChange={(e) => setFormData({ ...formData, honeypot: e.target.value })}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="student-name"
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "var(--brand-navy)",
                        marginBottom: "6px",
                      }}
                    >
                      Student Full Name *
                    </label>
                    <input
                      id="student-name"
                      type="text"
                      required
                      placeholder="e.g. Farhan Ahmed"
                      value={formData.studentName}
                      aria-invalid={!!errors.studentName}
                      aria-describedby={errors.studentName ? "student-name-error" : undefined}
                      onChange={(e) => {
                        setFormData({ ...formData, studentName: e.target.value });
                        if (errors.studentName) {
                          setErrors({ ...errors, studentName: "" });
                        }
                      }}
                      style={{
                        width: "100%",
                        height: "42px",
                        padding: "0 14px",
                        borderRadius: "8px",
                        border: errors.studentName ? "1.5px solid var(--color-danger)" : "1px solid var(--color-input-border)",
                        backgroundColor: "var(--color-surface)",
                        color: "var(--brand-navy)",
                        fontSize: "14px",
                        boxSizing: "border-box",
                      }}
                    />
                    {errors.studentName && (
                      <span
                        id="student-name-error"
                        role="alert"
                        style={{
                          fontSize: "12px",
                          color: "var(--color-danger)",
                          fontWeight: 500,
                          marginTop: "4px",
                          display: "block",
                        }}
                      >
                        {errors.studentName}
                      </span>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="contact-number"
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "var(--brand-navy)",
                        marginBottom: "6px",
                      }}
                    >
                      Parent / Guardian Contact Number *
                    </label>
                    <input
                      id="contact-number"
                      type="tel"
                      required
                      placeholder="10-digit mobile number"
                      value={formData.contactNumber}
                      aria-invalid={!!errors.contactNumber}
                      aria-describedby={errors.contactNumber ? "contact-number-error" : undefined}
                      onChange={(e) => {
                        setFormData({ ...formData, contactNumber: e.target.value });
                        if (errors.contactNumber) {
                          setErrors({ ...errors, contactNumber: "" });
                        }
                      }}
                      style={{
                        width: "100%",
                        height: "42px",
                        padding: "0 14px",
                        borderRadius: "8px",
                        border: errors.contactNumber ? "1.5px solid var(--color-danger)" : "1px solid var(--color-input-border)",
                        backgroundColor: "var(--color-surface)",
                        color: "var(--brand-navy)",
                        fontSize: "14px",
                        boxSizing: "border-box",
                      }}
                    />
                    {errors.contactNumber && (
                      <span
                        id="contact-number-error"
                        role="alert"
                        style={{
                          fontSize: "12px",
                          color: "var(--color-danger)",
                          fontWeight: 500,
                          marginTop: "4px",
                          display: "block",
                        }}
                      >
                        {errors.contactNumber}
                      </span>
                    )}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label
                        htmlFor="target-class"
                        style={{
                          display: "block",
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "var(--brand-navy)",
                          marginBottom: "6px",
                        }}
                      >
                        Target Class
                      </label>
                      <select
                        id="target-class"
                        value={formData.targetClass}
                        onChange={(e) => setFormData({ ...formData, targetClass: e.target.value })}
                        style={{
                          width: "100%",
                          height: "42px",
                          padding: "0 10px",
                          borderRadius: "8px",
                          border: "1px solid var(--color-input-border)",
                          backgroundColor: "var(--color-surface)",
                          color: "var(--brand-navy)",
                          fontSize: "14px",
                          boxSizing: "border-box",
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
                      <label
                        htmlFor="target-board"
                        style={{
                          display: "block",
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "var(--brand-navy)",
                          marginBottom: "6px",
                        }}
                      >
                        Board
                      </label>
                      <select
                        id="target-board"
                        value={formData.targetBoard}
                        onChange={(e) => setFormData({ ...formData, targetBoard: e.target.value })}
                        style={{
                          width: "100%",
                          height: "42px",
                          padding: "0 10px",
                          borderRadius: "8px",
                          border: "1px solid var(--color-input-border)",
                          backgroundColor: "var(--color-surface)",
                          color: "var(--brand-navy)",
                          fontSize: "14px",
                          boxSizing: "border-box",
                        }}
                      >
                        <option value="ICSE">ICSE</option>
                        <option value="CBSE">CBSE</option>
                        <option value="West Bengal Board">West Bengal Board</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="enquiry-notes"
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "var(--brand-navy)",
                        marginBottom: "6px",
                      }}
                    >
                      Academic Focus / Notes (Optional)
                    </label>
                    <textarea
                      id="enquiry-notes"
                      rows={3}
                      placeholder="e.g. Focus needed in ICSE Mathematics and Physics"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid var(--color-input-border)",
                        backgroundColor: "var(--color-surface)",
                        color: "var(--brand-navy)",
                        fontSize: "14px",
                        resize: "vertical",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary"
                    style={{
                      height: "44px",
                      width: "100%",
                      justifyContent: "center",
                      fontSize: "15px",
                      fontWeight: 600,
                      marginTop: "6px",
                    }}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Admissions Enquiry"}
                  </button>
                </form>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
