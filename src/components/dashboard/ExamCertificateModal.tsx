"use client";

import React from "react";
import { AcademicCertificateData } from "@/types";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";

export interface ExamCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: AcademicCertificateData;
  isIssued?: boolean;
}

export function ExamCertificateModal({
  isOpen,
  onClose,
  certificate,
  isIssued = false,
}: ExamCertificateModalProps) {
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Academic Merit Certificate"
      className="printable-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-4)",
        zIndex: 120,
      }}
    >
      <div
        className="printable-document exam-certificate-document"
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "var(--radius-lg)",
          maxWidth: "760px",
          width: "100%",
          maxHeight: "92vh",
          overflowY: "auto",
          padding: "var(--space-8)",
          boxShadow: "var(--shadow-lg)",
          position: "relative",
          border: "8px solid #F5F5F7",
          outline: isIssued ? "2px solid #34C759" : "2px solid #007AFF",
          outlineOffset: "-4px",
        }}
      >
        {/* Distinction Banner: Officially Issued vs Sample Preview */}
        <div
          style={{
            backgroundColor: isIssued ? "#34C759" : "#FF9500",
            color: "#FFFFFF",
            textAlign: "center",
            padding: "4px 12px",
            fontSize: "11px",
            fontWeight: 800,
            letterSpacing: "1px",
            textTransform: "uppercase",
            borderRadius: "var(--radius-sm)",
            marginBottom: "var(--space-4)",
          }}
        >
          {isIssued ? "★ OFFICIALLY ISSUED CERTIFICATE (SESSION RECORD) ★" : "★ SAMPLE PREVIEW / NOT OFFICIALLY ISSUED ★"}
        </div>

        {/* Certificate Header & Crest */}
        <div style={{ textAlign: "center", marginBottom: "var(--space-6)" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "var(--radius-full)",
              backgroundColor: "rgba(0, 122, 255, 0.1)",
              color: "#007AFF",
              fontSize: "22px",
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto var(--space-2)",
              border: "2px solid #007AFF",
            }}
          >
            AA
          </div>

          <div
            style={{
              fontSize: "var(--text-xs)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "2px",
              color: "var(--color-neutral-dark)",
              marginBottom: "2px",
            }}
          >
            ArousH Academy of Coaching &amp; Excellence
          </div>
          <div style={{ fontSize: "11px", color: "var(--color-neutral-dark)", marginBottom: "var(--space-3)" }}>
            Park Circus Academic Center &bull; Est. 2018 &bull; Kolkata
          </div>

          <h1
            style={{
              fontSize: "var(--text-2xl)",
              fontWeight: 800,
              color: "var(--color-primary)",
              letterSpacing: "0.5px",
              margin: 0,
              textTransform: "uppercase",
            }}
          >
            {certificate.title}
          </h1>
          <div style={{ width: "80px", height: "3px", backgroundColor: "#007AFF", margin: "8px auto 0" }} />
        </div>

        {/* Certificate Body */}
        <div style={{ textAlign: "center", marginBottom: "var(--space-6)", lineHeight: 1.8 }}>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-neutral-dark)", margin: "0 0 4px" }}>
            This is proudly awarded in recognition of distinguished academic achievement to:
          </p>

          <div
            style={{
              fontSize: "var(--text-xl)",
              fontWeight: 800,
              color: "#007AFF",
              margin: "var(--space-2) 0",
              fontFamily: "var(--font-sans)",
            }}
          >
            {certificate.studentName}
          </div>

          <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", margin: 0 }}>
            Candidate ID: <strong style={{ color: "var(--color-primary)" }}>AA-2026-{certificate.studentId.replace("std-", "")}</strong> &bull; Class: <strong style={{ color: "var(--color-primary)" }}>{certificate.classGrade} ({certificate.board})</strong>
          </p>

          <div
            style={{
              marginTop: "var(--space-4)",
              backgroundColor: "var(--color-surface-muted)",
              padding: "var(--space-4)",
              borderRadius: "var(--radius-md)",
              display: "inline-block",
              maxWidth: "600px",
              width: "100%",
            }}
          >
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-primary)", margin: 0, lineHeight: 1.6 }}>
              For securing an exceptional score of{" "}
              <strong style={{ color: "var(--color-success)", fontSize: "var(--text-sm)" }}>
                {certificate.scoreObtained} out of {certificate.totalMarks} marks ({certificate.percentage}%)
              </strong>{" "}
              in{" "}
              <strong>{certificate.assessmentName}</strong> ({certificate.subject}) conducted on{" "}
              <strong>{certificate.assessmentDate}</strong>.
            </p>
          </div>
        </div>

        {/* Eligibility Verification Box */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 14px",
            backgroundColor: "rgba(52, 199, 89, 0.08)",
            border: "1px solid rgba(52, 199, 89, 0.25)",
            borderRadius: "var(--radius-sm)",
            fontSize: "11px",
            color: "var(--color-primary)",
            marginBottom: "var(--space-6)",
            flexWrap: "wrap",
            gap: "6px",
          }}
        >
          <div>
            <strong>Verified Eligibility Rule:</strong> {certificate.criteriaMet}
          </div>
          <Badge variant="success" size="sm">
            Audited &amp; Qualified
          </Badge>
        </div>

        {/* Signatures & Seal Section */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "var(--space-4)",
            textAlign: "center",
            borderTop: "1px solid var(--color-border)",
            paddingTop: "var(--space-4)",
            marginBottom: "var(--space-4)",
          }}
        >
          <div>
            <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-primary)" }}>
              {certificate.facultyName}
            </div>
            <div style={{ fontSize: "10px", color: "var(--color-neutral-dark)", marginTop: "2px" }}>
              Lead Evaluator / Faculty Head
            </div>
          </div>

          <div>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "var(--radius-full)",
                border: "1px dashed #007AFF",
                margin: "0 auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "9px",
                fontWeight: 700,
                color: "#007AFF",
              }}
            >
              SEAL
            </div>
            <div style={{ fontSize: "9px", color: "var(--color-neutral-dark)", marginTop: "2px" }}>
              Academic Directorate
            </div>
          </div>

          <div>
            <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-primary)" }}>
              Central Examination Office
            </div>
            <div style={{ fontSize: "10px", color: "var(--color-neutral-dark)", marginTop: "2px" }}>
              Certified Date: {certificate.issuedDate}
            </div>
          </div>
        </div>

        {/* Verification Tracking Number & Disclaimer */}
        <div
          style={{
            fontSize: "10px",
            color: "var(--color-neutral-dark)",
            textAlign: "center",
            lineHeight: 1.5,
            borderTop: "1px solid var(--color-border)",
            paddingTop: "var(--space-2)",
          }}
        >
          <div>Certificate Reference: <strong>{certificate.certificateNumber}</strong></div>
          <div style={{ marginTop: "2px" }}>
            Notice: This certificate is a sample frontend demonstration rendered from active academy test ledgers. Official physical certificates are issued with holographic security seals.
          </div>
        </div>

        {/* Actions Row (Hidden when printing via .no-print) */}
        <div
          className="no-print"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "var(--space-6)",
            borderTop: "1px solid var(--color-border)",
            paddingTop: "var(--space-4)",
            gap: "var(--space-3)",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)" }}>
            Tip: Use browser print dialog to save as PDF or print hardcopy.
          </span>

          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <Button variant="secondary" size="sm" onClick={onClose} type="button">
              Close Preview
            </Button>
            <Button variant="primary" size="sm" onClick={handlePrint} type="button">
              🖨️ Print / Save as PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
