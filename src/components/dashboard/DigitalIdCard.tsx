"use client";

import React from "react";
import { StudentProfile, SubjectEnrollment } from "@/types";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

export interface DigitalIdCardProps {
  student: StudentProfile;
  enrollments: SubjectEnrollment[];
  onClose?: () => void;
  onPrint?: () => void;
  isModal?: boolean;
  autoPrint?: boolean;
  onAutoPrintComplete?: () => void;
}

export function DigitalIdCard({
  student,
  enrollments,
  onClose,
  onPrint,
  isModal = false,
  autoPrint = false,
  onAutoPrintComplete,
}: DigitalIdCardProps) {
  const studentFormattedId = `AA-2026-${student.id.replace("std-", "")}`;
  const enrolledSubjectNames = enrollments.map((e) => e.subjectName).join(", ") || "General Secondary";

  // Dedicated printable presentation auto-print trigger
  React.useEffect(() => {
    if (isModal && autoPrint && typeof window !== "undefined") {
      const timer = setTimeout(() => {
        window.print();
        if (onAutoPrintComplete) {
          onAutoPrintComplete();
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isModal, autoPrint, onAutoPrintComplete]);

  // Escape key handler for modal
  React.useEffect(() => {
    if (!isModal || !onClose) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModal, onClose]);

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else if (typeof window !== "undefined") {
      window.print();
    }
  };

  const cardContent = (
    <div
      className={isModal ? "printable-document digital-id-card" : "digital-id-card digital-id-card-inline"}
      style={{
        width: "100%",
        maxWidth: "420px",
        backgroundColor: "#FFFFFF",
        borderRadius: "var(--radius-xl)",
        border: "1px solid rgba(0, 0, 0, 0.12)",
        boxShadow: "var(--shadow-lg)",
        overflow: "hidden",
        fontFamily: "var(--font-sans)",
        color: "var(--color-primary)",
        position: "relative",
      }}
    >
      {/* Top Brand Banner */}
      <div
        style={{
          backgroundColor: "#1D1D1F",
          color: "#FFFFFF",
          padding: "var(--space-4) var(--space-5)",
          textAlign: "center",
          borderBottom: "3px solid var(--color-accent)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "var(--radius-sm)",
              backgroundColor: "var(--color-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: "14px",
              color: "#FFFFFF",
            }}
          >
            A
          </div>
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: 700, letterSpacing: "0.08em", color: "#FFFFFF", margin: 0, textTransform: "uppercase" }}>
              ArousH Academy
            </h3>
            <p style={{ fontSize: "10px", color: "var(--color-neutral)", margin: 0, letterSpacing: "0.02em" }}>
              Excellence in Coaching &bull; Est. 2018 &bull; Kolkata
            </p>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div style={{ padding: "var(--space-5)" }}>
        {/* Profile & Photo Row */}
        <div style={{ display: "flex", gap: "var(--space-4)", alignItems: "flex-start", marginBottom: "var(--space-4)" }}>
          {/* Student Avatar / Photo Container */}
          <div
            style={{
              width: "96px",
              height: "112px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--color-surface-muted)",
              border: "2px solid var(--color-border)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "var(--radius-full)",
                backgroundColor: "rgba(0, 122, 255, 0.12)",
                color: "var(--color-accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "18px",
                marginBottom: "4px",
              }}
            >
              {student.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <span style={{ fontSize: "9px", color: "var(--color-neutral-dark)", fontWeight: 600, textTransform: "uppercase" }}>
              Student
            </span>
          </div>

          {/* Student Identifiers */}
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
              <Badge variant="success" size="sm">
                Active Student
              </Badge>
              <span style={{ fontSize: "10px", color: "var(--color-neutral-dark)" }}>
                {student.board}
              </span>
            </div>

            <h4 style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--color-primary)", margin: "4px 0 2px" }}>
              {student.name}
            </h4>

            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-accent)", fontWeight: 600 }}>
              ID: {studentFormattedId}
            </div>

            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", marginTop: "4px" }}>
              Grade: <strong>{student.classGrade}</strong>
            </div>

            <div style={{ fontSize: "11px", color: "var(--color-neutral-dark)", marginTop: "2px" }}>
              Admitted: {student.joiningDate}
            </div>
          </div>
        </div>

        {/* Academic Details Section */}
        <div
          style={{
            backgroundColor: "var(--color-surface-muted)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-3) var(--space-4)",
            marginBottom: "var(--space-4)",
            border: "1px solid var(--color-border)",
          }}
        >
          <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-neutral-dark)", fontWeight: 700, marginBottom: "4px" }}>
            Enrolled Subjects &amp; Batches ({enrollments.length})
          </div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-primary)", lineHeight: 1.4 }}>
            {enrolledSubjectNames}
          </div>
          <div style={{ fontSize: "11px", color: "var(--color-neutral-dark)", marginTop: "4px" }}>
            Guardian: <strong>{student.guardianName}</strong> &bull; {student.guardianPhone}
          </div>
        </div>

        {/* QR Code Demo Section & Verification Note */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-3)",
            padding: "var(--space-3)",
            border: "1px dashed var(--color-border)",
            borderRadius: "var(--radius-md)",
            backgroundColor: "#FAF9F6",
          }}
        >
          {/* Simulated QR Code SVG Grid */}
          <div
            style={{
              width: "60px",
              height: "60px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #1D1D1F",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg viewBox="0 0 40 40" width="52" height="52" style={{ display: "block" }}>
              {/* Corner 1 */}
              <rect x="2" y="2" width="10" height="10" fill="#1D1D1F" />
              <rect x="4" y="4" width="6" height="6" fill="#FFFFFF" />
              <rect x="5.5" y="5.5" width="3" height="3" fill="#1D1D1F" />
              {/* Corner 2 */}
              <rect x="28" y="2" width="10" height="10" fill="#1D1D1F" />
              <rect x="30" y="4" width="6" height="6" fill="#FFFFFF" />
              <rect x="31.5" y="5.5" width="3" height="3" fill="#1D1D1F" />
              {/* Corner 3 */}
              <rect x="2" y="28" width="10" height="10" fill="#1D1D1F" />
              <rect x="4" y="30" width="6" height="6" fill="#FFFFFF" />
              <rect x="5.5" y="31.5" width="3" height="3" fill="#1D1D1F" />
              {/* Data matrix dots */}
              <rect x="15" y="4" width="3" height="3" fill="#1D1D1F" />
              <rect x="20" y="8" width="3" height="3" fill="#1D1D1F" />
              <rect x="15" y="15" width="4" height="4" fill="#1D1D1F" />
              <rect x="22" y="15" width="3" height="3" fill="#1D1D1F" />
              <rect x="15" y="25" width="3" height="3" fill="#1D1D1F" />
              <rect x="24" y="24" width="4" height="4" fill="#1D1D1F" />
              <rect x="30" y="18" width="3" height="3" fill="#1D1D1F" />
              <rect x="32" y="28" width="4" height="4" fill="#1D1D1F" />
            </svg>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Demo Verification Placeholder
            </div>
            <div style={{ fontSize: "9px", color: "var(--color-neutral-dark)", lineHeight: 1.35, marginTop: "2px" }}>
              Offline preview only. Digital verification not claimed. Light standard layout without third-party package overhead.
            </div>
          </div>
        </div>

        {/* Footer Validity & Notice */}
        <div style={{ marginTop: "var(--space-3)", textAlign: "center" }}>
          <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-neutral-dark)" }}>
            Academic Session 2026–2027 &bull; Valid through March 31, 2027
          </div>
          <div style={{ fontSize: "8px", color: "var(--color-neutral)", marginTop: "2px", letterSpacing: "0.02em" }}>
            DEMO STUDENT ID CARD &bull; FOR ACADEMY PREVIEW ONLY &bull; NOT AN OFFICIAL GOVERNMENT ID
          </div>
        </div>
      </div>

      {/* Action Bar (hidden when printing) */}
      <div
        className="no-print"
        style={{
          borderTop: "1px solid var(--color-border)",
          padding: "var(--space-3) var(--space-4)",
          backgroundColor: "var(--color-surface-muted)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)" }}>
          Standard ID Card (85.6mm &times; 54mm equivalent)
        </span>
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          {onClose && (
            <Button variant="secondary" size="sm" onClick={onClose} type="button">
              Close
            </Button>
          )}
          <Button variant="accent" size="sm" onClick={handlePrint} type="button">
            Print / Save as PDF
          </Button>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Digital Student ID Card"
        className="printable-modal-overlay"
        onClick={(e) => {
          if (e.target === e.currentTarget && onClose) {
            onClose();
          }
        }}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "var(--space-4)",
          zIndex: 110,
        }}
      >
        {cardContent}
      </div>
    );
  }

  return cardContent;
}
