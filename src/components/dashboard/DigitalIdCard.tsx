"use client";

import React, { useState, useEffect, useMemo } from "react";
import QRCode from "qrcode-svg";
import { StudentProfile, SubjectEnrollment, StudentIdCardRecord } from "@/types";
import { Button } from "../ui/Button";

export interface DigitalIdCardProps {
  student: StudentProfile;
  enrollments: SubjectEnrollment[];
  cardRecord?: StudentIdCardRecord;
  onClose?: () => void;
  onPrint?: () => void;
  isModal?: boolean;
  autoPrint?: boolean;
  onAutoPrintComplete?: () => void;
}

export function DigitalIdCard({
  student,
  enrollments,
  cardRecord,
  onClose,
  onPrint,
  isModal = false,
  autoPrint = false,
  onAutoPrintComplete,
}: DigitalIdCardProps) {
  const [activeSide, setActiveSide] = useState<"front" | "back">("front");

  // Format student identifiers dynamically from the active record or linked cardRecord
  const cardStatus = cardRecord?.status || "approved";
  const isOfficiallyIssued = cardStatus === "approved";
  const studentFormattedId = cardRecord?.studentFormattedId || `AA-2026-${student.id.replace("std-", "")}`;
  const academicSession = cardRecord?.session || "2026–2027";
  const photoUrl = cardRecord?.photoUrl;

  let validThruDateStr = "31 MAR 2027";
  if (cardRecord?.validThru) {
    try {
      const d = new Date(cardRecord.validThru);
      if (!isNaN(d.getTime())) {
        validThruDateStr = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
      }
    } catch {
      validThruDateStr = "31 MAR 2027";
    }
  }


  const enrolledSubjectNames = useMemo(() => {
    if (cardRecord?.enrolledSubjects && cardRecord.enrolledSubjects.length > 0) {
      return cardRecord.enrolledSubjects;
    }
    if (!enrollments || enrollments.length === 0) return ["General Curriculum"];
    return Array.from(new Set(enrollments.map((e) => e.subjectName)));
  }, [cardRecord, enrollments]);

  const studentInitials = useMemo(() => {
    return student.name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [student.name]);

  // Safe verification URL payload for demonstration without exposing sensitive data
  const verificationUrl = isOfficiallyIssued
    ? `https://aroush.academy/verify/id?studentId=${encodeURIComponent(student.id)}&session=${encodeURIComponent(academicSession)}`
    : `https://aroush.academy/verify/id?studentId=${encodeURIComponent(student.id)}&status=${encodeURIComponent(cardStatus)}&preview=true`;

  // Generate crisp, mathematical vector QR code SVG synchronously with zero external HTTP requests
  const qrSvgMarkup = useMemo(() => {
    try {
      const qr = new QRCode({
        content: verificationUrl,
        padding: 0,
        width: 68,
        height: 68,
        color: "#0B0C0E",
        background: "#FFFFFF",
        ecl: "M",
      });
      // Extract raw svg string
      return qr.svg();
    } catch {
      return "";
    }
  }, [verificationUrl]);


  // Auto-print effect when triggered from parent modal
  useEffect(() => {
    if (isModal && autoPrint && typeof window !== "undefined") {
      const timer = setTimeout(() => {
        window.print();
        if (onAutoPrintComplete) {
          onAutoPrintComplete();
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isModal, autoPrint, onAutoPrintComplete]);

  // Escape key handler when displayed in modal mode
  useEffect(() => {
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

  /* -------------------------------------------------------------------------- */
  /* Reusable Sub-Components: Gold Smartcard Chip & Barcode & Hologram Foil     */
  /* -------------------------------------------------------------------------- */
  const SmartChipIcon = () => (
    <svg width="24" height="20" viewBox="0 0 24 20" fill="none" style={{ flexShrink: 0 }}>
      <rect x="0.5" y="0.5" width="23" height="19" rx="3.5" fill="url(#chipGoldGrad)" stroke="#B38728" strokeWidth="0.8" />
      {/* Contact Pads */}
      <line x1="1" y1="7" x2="8" y2="7" stroke="#7A5813" strokeWidth="0.8" />
      <line x1="1" y1="13" x2="8" y2="13" stroke="#7A5813" strokeWidth="0.8" />
      <line x1="16" y1="7" x2="23" y2="7" stroke="#7A5813" strokeWidth="0.8" />
      <line x1="16" y1="13" x2="23" y2="13" stroke="#7A5813" strokeWidth="0.8" />
      <rect x="8" y="4" width="8" height="12" rx="2" fill="none" stroke="#7A5813" strokeWidth="0.8" />
      <line x1="12" y1="4" x2="12" y2="16" stroke="#7A5813" strokeWidth="0.8" />
      <defs>
        <linearGradient id="chipGoldGrad" x1="0" y1="0" x2="24" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F9E29B" />
          <stop offset="0.5" stopColor="#D4AF37" />
          <stop offset="1" stopColor="#AA771C" />
        </linearGradient>
      </defs>
    </svg>
  );

  const HologramSeal = () => (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "2px 6px",
        borderRadius: "4px",
        background: "linear-gradient(135deg, rgba(168,85,247,0.3) 0%, rgba(59,130,246,0.3) 50%, rgba(16,185,129,0.3) 100%)",
        border: "1px solid rgba(255,255,255,0.22)",
        backdropFilter: "blur(4px)",
      }}
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#93C5FD" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
      <span style={{ fontSize: "8px", fontWeight: 700, letterSpacing: "0.08em", color: "#E0F2FE", textTransform: "uppercase" }}>
        SECURE ID
      </span>
    </div>
  );

  const BarcodeGraphic = () => (
    <div style={{ textAlign: "center", marginTop: "12px" }}>
      <svg width="220" height="34" viewBox="0 0 220 34" style={{ display: "inline-block", maxWidth: "100%" }}>
        {/* Repeating Code-128 barcode simulation */}
        {[
          3, 1, 2, 4, 1, 3, 1, 1, 4, 2, 1, 2, 3, 1, 1, 2, 4, 1, 3, 2, 1, 1, 4, 1,
          2, 3, 1, 2, 1, 4, 2, 1, 3, 1, 2, 1, 4, 1, 3, 2, 1, 1, 3, 2, 1, 4, 1, 2,
        ].map((w, idx) => {
          let xOffset = 6;
          for (let i = 0; i < idx; i++) {
            xOffset += [
              3, 1, 2, 4, 1, 3, 1, 1, 4, 2, 1, 2, 3, 1, 1, 2, 4, 1, 3, 2, 1, 1, 4, 1,
              2, 3, 1, 2, 1, 4, 2, 1, 3, 1, 2, 1, 4, 1, 3, 2, 1, 1, 3, 2, 1, 4, 1, 2,
            ][i] * 2.2;
          }
          if (idx % 2 === 0) {
            return (
              <rect
                key={idx}
                x={xOffset}
                y="2"
                width={w * 1.6}
                height="30"
                fill="#D1D5DB"
              />
            );
          }
          return null;
        })}
      </svg>
      <div style={{ fontSize: "8.5px", letterSpacing: "0.15em", color: "#9CA3AF", fontFamily: "monospace", marginTop: "2px" }}>
        *{studentFormattedId}*
      </div>
    </div>
  );

  /* -------------------------------------------------------------------------- */
  /* Front Face of the Card                                                     */
  /* -------------------------------------------------------------------------- */
  const renderFrontFace = (isPrintVersion = false) => (
    <div
      className={`id-card-face id-card-front ${isPrintVersion ? "id-card-print-face" : ""}`}
      style={{
        width: "100%",
        maxWidth: "340px",
        minHeight: "530px",
        borderRadius: "18px",
        background: isPrintVersion
          ? "#FFFFFF"
          : "linear-gradient(165deg, #1b1c20 0%, #121316 45%, #0a0b0d 100%)",
        border: isPrintVersion ? "1.5px solid #111827" : "1px solid rgba(255, 255, 255, 0.14)",
        boxShadow: isPrintVersion
          ? "none"
          : "0 22px 45px -10px rgba(0, 0, 0, 0.8), inset 0 1px 1px rgba(255, 255, 255, 0.16), inset 0 -1px 0 rgba(0, 0, 0, 0.6)",
        position: "relative",
        padding: "16px 20px 18px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxSizing: "border-box",
        overflow: "hidden",
        color: isPrintVersion ? "#111827" : "#F3F4F6",
      }}
    >
      {/* Background Subtle Geometric Watermark */}
      {!isPrintVersion && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "-40px",
            right: "-40px",
            width: "220px",
            height: "220px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0, 122, 255, 0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Top Punch Slot (Realistic badge cutout) */}
      <div
        className="no-print"
        aria-hidden="true"
        style={{
          width: "42px",
          height: "9px",
          borderRadius: "5px",
          backgroundColor: isPrintVersion ? "#E5E7EB" : "#050607",
          border: isPrintVersion ? "1px solid #9CA3AF" : "1px solid rgba(255, 255, 255, 0.16)",
          boxShadow: isPrintVersion ? "none" : "inset 0 2px 4px rgba(0, 0, 0, 0.9)",
          margin: "0 auto 12px",
          flexShrink: 0,
        }}
      />

      {/* Card Header: Academy Monogram + Brand + Security Foil */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: "10px",
          borderBottom: isPrintVersion
            ? "2px solid #007AFF"
            : "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Academy Monogram Badge */}
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #007AFF 0%, #0051B3 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: "17px",
              color: "#FFFFFF",
              boxShadow: "0 2px 6px rgba(0, 122, 255, 0.35)",
              flexShrink: 0,
            }}
          >
            A
          </div>
          <div>
            <h3
              style={{
                fontSize: "13px",
                fontWeight: 800,
                letterSpacing: "0.12em",
                color: isPrintVersion ? "#111827" : "#FFFFFF",
                margin: 0,
                textTransform: "uppercase",
                lineHeight: 1.2,
              }}
            >
              ArousH Academy
            </h3>
            <p
              style={{
                fontSize: "8px",
                color: isPrintVersion ? "#4B5563" : "#9CA3AF",
                margin: "1px 0 0",
                letterSpacing: "0.06em",
                fontWeight: 500,
                textTransform: "uppercase",
              }}
            >
              Park Circus · Kolkata · Est. 2018
            </p>
          </div>
        </div>

        {/* Security Hologram Micro-Badge */}
        {!isPrintVersion ? (
          <HologramSeal />
        ) : (
          <div
            style={{
              fontSize: "8.5px",
              fontWeight: 700,
              color: "#007AFF",
              border: "1px solid #007AFF",
              padding: "2px 6px",
              borderRadius: "4px",
            }}
          >
            OFFICIAL ID
          </div>
        )}
      </div>

      {/* Middle Row: Student Photo Frame & Primary Information */}
      <div style={{ display: "flex", gap: "14px", alignItems: "center", margin: "14px 0" }}>
        {/* Student Photo Container */}
        <div
          style={{
            width: "82px",
            height: "98px",
            borderRadius: "10px",
            background: isPrintVersion
              ? "#F3F4F6"
              : "linear-gradient(150deg, #22252e 0%, #13151a 100%)",
            border: isPrintVersion ? "1.5px solid #007AFF" : "1.5px solid rgba(0, 122, 255, 0.45)",
            boxShadow: isPrintVersion ? "none" : "0 4px 12px rgba(0, 0, 0, 0.4)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Avatar / Photo Container */}
          {photoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={photoUrl}
              alt={student.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: isPrintVersion
                  ? "rgba(0, 122, 255, 0.12)"
                  : "radial-gradient(circle, rgba(0, 122, 255, 0.25) 0%, rgba(0, 122, 255, 0.05) 100%)",
                border: "1px solid rgba(0, 122, 255, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "17px",
                color: isPrintVersion ? "#007AFF" : "#60A5FA",
                letterSpacing: "0.05em",
              }}
            >
              {studentInitials}
            </div>
          )}

          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: isPrintVersion ? "#111827" : "#007AFF",
              color: "#FFFFFF",
              fontSize: "7.5px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textAlign: "center",
              padding: "2px 0",
              textTransform: "uppercase",
            }}
          >
            STUDENT
          </div>
        </div>

        {/* Student Identifiers Section */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Active Status Indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor:
                  cardStatus === "approved"
                    ? "#10B981"
                    : cardStatus === "pending-approval"
                    ? "#F59E0B"
                    : cardStatus === "draft"
                    ? "#3B82F6"
                    : "#EF4444",
                display: "inline-block",
                boxShadow: cardStatus === "approved" ? "0 0 6px #10B981" : "none",
              }}
            />
            <span
              style={{
                fontSize: "8.5px",
                fontWeight: 700,
                color:
                  cardStatus === "approved"
                    ? isPrintVersion ? "#059669" : "#34D399"
                    : cardStatus === "pending-approval"
                    ? "#F59E0B"
                    : cardStatus === "draft"
                    ? "#60A5FA"
                    : "#F87171",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              {cardStatus === "approved"
                ? "Active · Issued"
                : cardStatus === "pending-approval"
                ? "Pending Review"
                : cardStatus === "draft"
                ? "Draft Preview"
                : cardStatus === "inactive"
                ? "Inactive"
                : cardStatus}
            </span>
          </div>

          {/* Student Full Name */}
          <h4
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: isPrintVersion ? "#111827" : "#FFFFFF",
              margin: "0 0 3px",
              letterSpacing: "-0.01em",
              lineHeight: 1.25,
              wordBreak: "break-word",
            }}
          >
            {student.name}
          </h4>

          {/* Student ID */}
          <div
            style={{
              display: "inline-block",
              fontSize: "11px",
              fontWeight: 700,
              color: "#007AFF",
              letterSpacing: "0.04em",
              fontFamily: "monospace",
            }}
          >
            {studentFormattedId}
          </div>

          {/* Class & Board Row */}
          <div
            style={{
              fontSize: "11px",
              color: isPrintVersion ? "#374151" : "#D1D5DB",
              marginTop: "4px",
              fontWeight: 500,
            }}
          >
            <strong style={{ color: isPrintVersion ? "#111827" : "#FFFFFF" }}>{student.classGrade}</strong> ·{" "}
            <span style={{ color: isPrintVersion ? "#4B5563" : "#9CA3AF" }}>{student.board}</span>
          </div>

          {/* Academic Session */}
          <div
            style={{
              fontSize: "9.5px",
              color: isPrintVersion ? "#4B5563" : "#9CA3AF",
              marginTop: "2px",
            }}
          >
            Session: <span style={{ fontWeight: 600, color: isPrintVersion ? "#111827" : "#D1D5DB" }}>{academicSession}</span>
          </div>
        </div>
      </div>

      {/* Enrolled Subjects Micro-Strip */}
      <div
        style={{
          background: isPrintVersion ? "#F9FAFB" : "rgba(255, 255, 255, 0.04)",
          borderRadius: "8px",
          padding: "7px 10px",
          border: isPrintVersion ? "1px solid #E5E7EB" : "1px solid rgba(255, 255, 255, 0.07)",
          margin: "4px 0 12px",
        }}
      >
        <div
          style={{
            fontSize: "8px",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: isPrintVersion ? "#6B7280" : "#9CA3AF",
            fontWeight: 700,
            marginBottom: "3px",
          }}
        >
          Enrolled Subjects ({enrolledSubjectNames.length})
        </div>
        <div
          style={{
            fontSize: "10px",
            color: isPrintVersion ? "#1F2937" : "#E5E7EB",
            lineHeight: 1.35,
            whiteSpace: "normal",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {enrolledSubjectNames.slice(0, 4).join(" · ")}
          {enrolledSubjectNames.length > 4 && ` · +${enrolledSubjectNames.length - 4} more`}
        </div>
      </div>

      {/* Bottom Area: Scannable QR Code Tile + Verification Details */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "8px 10px",
          borderRadius: "10px",
          background: isPrintVersion ? "#F3F4F6" : "rgba(255, 255, 255, 0.03)",
          border: isPrintVersion ? "1px solid #D1D5DB" : "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        {/* Scannable High-Contrast QR Code Tile */}
        <div
          style={{
            width: "68px",
            height: "68px",
            backgroundColor: "#FFFFFF",
            borderRadius: "6px",
            padding: "2px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: isPrintVersion ? "none" : "0 2px 8px rgba(0, 0, 0, 0.35)",
            border: "1px solid #111827",
            overflow: "hidden",
          }}
          dangerouslySetInnerHTML={{ __html: qrSvgMarkup }}
        />

        {/* Verification Metadata & Smart Chip Graphic */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "3px" }}>
            <span
              style={{
                fontSize: "8.5px",
                fontWeight: 700,
                color: isPrintVersion ? "#111827" : "#FFFFFF",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              Academy QR Check
            </span>
            <SmartChipIcon />
          </div>

          <div
            style={{
              fontSize: "8px",
              color: isPrintVersion ? "#4B5563" : "#9CA3AF",
              lineHeight: 1.3,
            }}
          >
            Scan with smartphone or terminal reader to verify student status.
          </div>

          <div
            style={{
              fontSize: "8.5px",
              fontWeight: 600,
              color: "#007AFF",
              marginTop: "4px",
              letterSpacing: "0.02em",
            }}
          >
            Valid Thru: {validThruDateStr}
          </div>
        </div>
      </div>

      {/* Card Micro Footer */}
      <div
        style={{
          marginTop: "10px",
          paddingTop: "6px",
          borderTop: isPrintVersion ? "1px solid #E5E7EB" : "1px solid rgba(255, 255, 255, 0.06)",
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontSize: "7.5px",
            letterSpacing: "0.08em",
            color: isPrintVersion ? "#6B7280" : "#6B7280",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          Official Academy Identity Document · Kolkata
        </span>
      </div>
    </div>
  );

  /* -------------------------------------------------------------------------- */
  /* Reverse / Back Face of the Card                                            */
  /* -------------------------------------------------------------------------- */
  const renderBackFace = (isPrintVersion = false) => (
    <div
      className={`id-card-face id-card-back ${isPrintVersion ? "id-card-print-face" : ""}`}
      style={{
        width: "100%",
        maxWidth: "340px",
        minHeight: "530px",
        borderRadius: "18px",
        background: isPrintVersion
          ? "#FFFFFF"
          : "linear-gradient(165deg, #1b1c20 0%, #121316 45%, #0a0b0d 100%)",
        border: isPrintVersion ? "1.5px solid #111827" : "1px solid rgba(255, 255, 255, 0.14)",
        boxShadow: isPrintVersion
          ? "none"
          : "0 22px 45px -10px rgba(0, 0, 0, 0.8), inset 0 1px 1px rgba(255, 255, 255, 0.16), inset 0 -1px 0 rgba(0, 0, 0, 0.6)",
        position: "relative",
        padding: "16px 20px 18px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxSizing: "border-box",
        overflow: "hidden",
        color: isPrintVersion ? "#111827" : "#F3F4F6",
      }}
    >
      {/* Top Punch Slot */}
      <div
        className="no-print"
        aria-hidden="true"
        style={{
          width: "42px",
          height: "9px",
          borderRadius: "5px",
          backgroundColor: isPrintVersion ? "#E5E7EB" : "#050607",
          border: isPrintVersion ? "1px solid #9CA3AF" : "1px solid rgba(255, 255, 255, 0.16)",
          boxShadow: isPrintVersion ? "none" : "inset 0 2px 4px rgba(0, 0, 0, 0.9)",
          margin: "0 auto 8px",
          flexShrink: 0,
        }}
      />

      {/* Magnetic Stripe Aesthetic Strip */}
      <div
        style={{
          height: "32px",
          backgroundColor: isPrintVersion ? "#111827" : "#08090B",
          margin: "0 -20px 12px",
          borderTop: isPrintVersion ? "none" : "1px solid rgba(255, 255, 255, 0.08)",
          borderBottom: isPrintVersion ? "none" : "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          padding: "0 16px",
        }}
      >
        <span style={{ fontSize: "7px", letterSpacing: "0.15em", color: "#6B7280", fontFamily: "monospace" }}>
          ISO/IEC 7810 ID-1 COMPATIBLE
        </span>
      </div>

      {/* Emergency Contact & Guardian Information */}
      <div
        style={{
          background: isPrintVersion ? "#F9FAFB" : "rgba(255, 255, 255, 0.03)",
          borderRadius: "8px",
          padding: "10px 12px",
          border: isPrintVersion ? "1px solid #E5E7EB" : "1px solid rgba(255, 255, 255, 0.06)",
          marginBottom: "10px",
        }}
      >
        <div
          style={{
            fontSize: "8.5px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: "#007AFF",
            textTransform: "uppercase",
            marginBottom: "6px",
          }}
        >
          Guardian &amp; Emergency Contact
        </div>
        <div style={{ fontSize: "11px", color: isPrintVersion ? "#111827" : "#FFFFFF", fontWeight: 600 }}>
          {cardRecord?.guardianName || student.guardianName}
        </div>
        <div style={{ fontSize: "10px", color: isPrintVersion ? "#4B5563" : "#9CA3AF", marginTop: "2px" }}>
          Phone: <strong style={{ color: isPrintVersion ? "#111827" : "#D1D5DB" }}>{cardRecord?.guardianPhone || student.guardianPhone}</strong>
        </div>
        {cardRecord?.emergencyContact && cardRecord.emergencyContact !== (cardRecord.guardianPhone || student.guardianPhone) && (
          <div style={{ fontSize: "9.5px", color: isPrintVersion ? "#4B5563" : "#9CA3AF", marginTop: "2px" }}>
            Emergency: <strong style={{ color: isPrintVersion ? "#111827" : "#D1D5DB" }}>{cardRecord.emergencyContact}</strong>
          </div>
        )}
        <div style={{ fontSize: "9px", color: isPrintVersion ? "#6B7280" : "#6B7280", marginTop: "4px" }}>
          Admitted: {student.joiningDate} · ID: {studentFormattedId}
        </div>
      </div>

      {/* Academy Campus & Support Information */}
      <div style={{ margin: "4px 0 10px" }}>
        <div
          style={{
            fontSize: "8.5px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: isPrintVersion ? "#111827" : "#FFFFFF",
            textTransform: "uppercase",
            marginBottom: "3px",
          }}
        >
          Campus &amp; Registry Office
        </div>
        <div style={{ fontSize: "9px", color: isPrintVersion ? "#4B5563" : "#9CA3AF", lineHeight: 1.4 }}>
          {cardRecord?.campusName || "AROUSH Academy"} · Park Circus Center<br />
          {cardRecord?.campusAddress || "48/2 Circus Avenue, Park Circus, Kolkata, West Bengal 700017"}<br />
          Helpline: {cardRecord?.campusPhone || "+91 98830 11221"} · {cardRecord?.campusEmail || "contact@aroush.academy"}
        </div>
      </div>

      {/* Terms and Regulations */}
      <div
        style={{
          fontSize: "7.8px",
          color: isPrintVersion ? "#4B5563" : "#6B7280",
          lineHeight: 1.35,
          borderTop: isPrintVersion ? "1px solid #E5E7EB" : "1px solid rgba(255, 255, 255, 0.06)",
          paddingTop: "6px",
        }}
      >
        <p style={{ margin: "0 0 3px" }}>
          1. This card is non-transferable and remains the property of AROUSH Academy.
        </p>
        <p style={{ margin: "0 0 3px" }}>
          2. Must be presented upon entry to classrooms, libraries, and exam halls.
        </p>
        <p style={{ margin: 0 }}>
          3. If lost or found, please return immediately to the Academy office.
        </p>
      </div>

      {/* Registrar Authorization & Signatory */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          paddingTop: "6px",
          marginTop: "6px",
        }}
      >
        <div>
          <div style={{ fontSize: "7px", color: isPrintVersion ? "#6B7280" : "#6B7280", textTransform: "uppercase" }}>
            Security Seal
          </div>
          <div style={{ fontSize: "8px", fontWeight: 700, color: "#007AFF" }}>
            VERIFIED CREDENTIAL
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontFamily: "cursive, sans-serif",
              fontSize: "12px",
              color: isPrintVersion ? "#1E3A8A" : "#93C5FD",
              lineHeight: 1,
              letterSpacing: "0.05em",
            }}
          >
            M. D. Danish
          </div>
          <div
            style={{
              fontSize: "7.5px",
              color: isPrintVersion ? "#4B5563" : "#9CA3AF",
              borderTop: isPrintVersion ? "1px solid #9CA3AF" : "1px solid rgba(255, 255, 255, 0.2)",
              paddingTop: "2px",
              marginTop: "2px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Authorized Registrar
          </div>
        </div>
      </div>

      {/* Barcode Strip */}
      <BarcodeGraphic />
    </div>
  );

  /* -------------------------------------------------------------------------- */
  /* Main Container: Lanyard Strap + Clasp + Hanging Card Mockup                */
  /* -------------------------------------------------------------------------- */
  const previewScreen = (
    <div
      className={isModal ? "printable-document digital-id-card-wrapper" : "digital-id-card-wrapper digital-id-card-inline"}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        fontFamily: "var(--font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
      }}
    >
      {/* ----------------- SCREEN ONLY: REALISTIC HANGING LANYARD ASSEMBLY ----------------- */}
      <div
        className="no-print id-card-lanyard-assembly"
        aria-hidden="true"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginBottom: "-12px",
          zIndex: 2,
        }}
      >
        {/* Lanyard Fabric Ribbon running down from top */}
        <div
          style={{
            width: "32px",
            height: "54px",
            background: "linear-gradient(90deg, #131417 0%, #202227 30%, #292b32 50%, #202227 70%, #131417 100%)",
            borderLeft: "1px dashed rgba(255, 255, 255, 0.16)",
            borderRight: "1px dashed rgba(255, 255, 255, 0.16)",
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.6)",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Subtle printed ribbon brand line */}
          <span
            style={{
              writingMode: "vertical-rl",
              textOrientation: "mixed",
              transform: "rotate(180deg)",
              fontSize: "6px",
              fontWeight: 800,
              letterSpacing: "0.2em",
              color: "rgba(255, 255, 255, 0.35)",
              textTransform: "uppercase",
              userSelect: "none",
            }}
          >
            ARROUSH
          </span>
        </div>

        {/* Metal Swivel Clasp Assembly */}
        {/* Metal Crimp Sleeve */}
        <div
          style={{
            width: "36px",
            height: "10px",
            borderRadius: "2px",
            background: "linear-gradient(180deg, #E4E4E7 0%, #A1A1AA 40%, #71717A 80%, #D4D4D8 100%)",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.5)",
            border: "0.5px solid #52525B",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Rivet in center */}
          <div
            style={{
              width: "4px",
              height: "4px",
              borderRadius: "50%",
              backgroundColor: "#3F3F46",
              boxShadow: "inset 0 1px 1px rgba(0,0,0,0.8)",
            }}
          />
        </div>

        {/* Metallic Swivel Lobster Hook entering the slot */}
        <div
          style={{
            width: "14px",
            height: "18px",
            border: "3px solid #D4D4D8",
            borderTop: "none",
            borderRadius: "0 0 7px 7px",
            background: "transparent",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.5)",
            marginTop: "-1px",
          }}
        />
      </div>

      {/* Status Warning Watermark Banner for unapproved cards */}
      {!isOfficiallyIssued && (
        <div
          className="no-print"
          style={{
            marginBottom: "14px",
            padding: "6px 14px",
            borderRadius: "999px",
            backgroundColor:
              cardStatus === "pending-approval"
                ? "#FEF3C7"
                : cardStatus === "draft"
                ? "#EFF6FF"
                : "#FEE2E2",
            border: `1px solid ${
              cardStatus === "pending-approval"
                ? "#F59E0B"
                : cardStatus === "draft"
                ? "#3B82F6"
                : "#EF4444"
            }`,
            color:
              cardStatus === "pending-approval"
                ? "#92400E"
                : cardStatus === "draft"
                ? "#1E40AF"
                : "#991B1B",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.06)",
          }}
        >
          <span>ℹ️</span>
          <span>
            {cardStatus === "draft"
              ? "Draft Preview — Not Officially Issued"
              : cardStatus === "pending-approval"
              ? "Pending Approval — Not Officially Issued"
              : cardStatus === "rejected"
              ? `Rejected — Reason: ${cardRecord?.rejectionReason || "Requirements not met"}`
              : "Inactive / Deactivated Credential"}
          </span>
        </div>
      )}

      {/* ----------------- SCREEN ONLY: CARD VIEW WITH ACTIVE FACE ----------------- */}
      <div className="no-print" style={{ zIndex: 1, position: "relative" }}>
        {activeSide === "front" ? renderFrontFace(false) : renderBackFace(false)}
      </div>

      {/* ----------------- SCREEN ONLY: CONTROL BAR (FLIP + PRINT) ----------------- */}
      <div
        className="no-print id-card-controls-bar"
        style={{
          width: "100%",
          maxWidth: "380px",
          marginTop: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          alignItems: "center",
        }}
      >
        {/* Front / Back Side Switcher */}
        <div
          style={{
            display: "inline-flex",
            backgroundColor: "var(--color-surface-muted, #F3F4F6)",
            borderRadius: "999px",
            padding: "3px",
            border: "1px solid var(--color-border, #E5E7EB)",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveSide("front")}
            style={{
              padding: "6px 16px",
              borderRadius: "999px",
              fontSize: "12px",
              fontWeight: activeSide === "front" ? 700 : 500,
              backgroundColor: activeSide === "front" ? "#007AFF" : "transparent",
              color: activeSide === "front" ? "#FFFFFF" : "var(--color-neutral-dark, #4B5563)",
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            🪪 Card Front
          </button>
          <button
            type="button"
            onClick={() => setActiveSide("back")}
            style={{
              padding: "6px 16px",
              borderRadius: "999px",
              fontSize: "12px",
              fontWeight: activeSide === "back" ? 700 : 500,
              backgroundColor: activeSide === "back" ? "#007AFF" : "transparent",
              color: activeSide === "back" ? "#FFFFFF" : "var(--color-neutral-dark, #4B5563)",
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            🔄 Reverse Side
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "8px", width: "100%", justifyContent: "center" }}>
          {onClose && (
            <Button variant="secondary" size="sm" onClick={onClose} type="button">
              Close
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setActiveSide((prev) => (prev === "front" ? "back" : "front"))}
            type="button"
          >
            Flip Card
          </Button>
          <Button variant="accent" size="sm" onClick={handlePrint} type="button">
            Print / Save as PDF
          </Button>
        </div>

        {/* Verification & Offline Notice */}
        <div
          style={{
            fontSize: "11px",
            color: "var(--color-neutral-dark, #6B7280)",
            textAlign: "center",
            lineHeight: 1.4,
            maxWidth: "340px",
          }}
        >
          Standard CR-80 physical format (85.6mm &times; 54mm equivalent). Dynamic QR code encodes secure verification URL for camera inspection.
        </div>
      </div>

      {/* ----------------- PRINT ONLY: DEDICATED HIGH-CONTRAST DUAL-SIDE SHEET ----------------- */}
      <div
        className="digital-id-card-print-sheet"
        style={{
          display: "none", // Displayed only via @media print in globals.css
        }}
      >
        <div className="id-card-print-block">
          {renderFrontFace(true)}
          <div className="id-card-cut-label">Front Side (Cut along outer border)</div>
        </div>
        <div className="id-card-print-block">
          {renderBackFace(true)}
          <div className="id-card-cut-label">Reverse Side (Cut along outer border)</div>
        </div>
      </div>
    </div>
  );

  /* Modal Wrapper when isModal === true */
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
          backgroundColor: "rgba(0, 0, 0, 0.65)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "var(--space-4)",
          zIndex: 110,
          overflowY: "auto",
        }}
      >
        {previewScreen}
      </div>
    );
  }

  return previewScreen;
}

