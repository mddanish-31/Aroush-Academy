"use client";

import React, { useState, useEffect, useMemo } from "react";
import QRCode from "qrcode-svg";
import { Info } from "lucide-react";
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

  
  const cardStatus = cardRecord?.status || "approved";
  const isOfficiallyIssued = cardStatus === "approved";
  const studentFormattedId = cardRecord?.studentFormattedId || `AA-2026-${student.id.replace("std-", "")}`;
  const academicSession = cardRecord?.session || "2026-2027";
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

  
  const verificationUrl = isOfficiallyIssued
    ? `https://aroush.academy/verify/id?studentId=${encodeURIComponent(student.id)}&session=${encodeURIComponent(academicSession)}`
    : `https://aroush.academy/verify/id?studentId=${encodeURIComponent(student.id)}&status=${encodeURIComponent(cardStatus)}&preview=true`;

  
  const qrSvgMarkup = useMemo(() => {
    try {
      const qr = new QRCode({
        content: verificationUrl,
        padding: 0,
        width: 68,
        height: 68,
        color: "#2F4156",
        background: "#FFFFFF",
        ecl: "M",
      });
      
      return qr.svg();
    } catch {
      return "";
    }
  }, [verificationUrl]);


  
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

  
  
  
  const SmartChipIcon = () => (
    <svg width="24" height="20" viewBox="0 0 24 20" fill="none" style={{ flexShrink: 0 }}>
      <rect x="0.5" y="0.5" width="23" height="19" rx="3.5" fill="url(#chipGoldGrad)" stroke="#567B8D" strokeWidth="0.8" />
      <line x1="1" y1="7" x2="8" y2="7" stroke="#2F4156" strokeWidth="0.8" />
      <line x1="1" y1="13" x2="8" y2="13" stroke="#2F4156" strokeWidth="0.8" />
      <line x1="16" y1="7" x2="23" y2="7" stroke="#2F4156" strokeWidth="0.8" />
      <line x1="16" y1="13" x2="23" y2="13" stroke="#2F4156" strokeWidth="0.8" />
      <rect x="8" y="4" width="8" height="12" rx="2" fill="none" stroke="#2F4156" strokeWidth="0.8" />
      <line x1="12" y1="4" x2="12" y2="16" stroke="#2F4156" strokeWidth="0.8" />
      <defs>
        <linearGradient id="chipGoldGrad" x1="0" y1="0" x2="24" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F5F0EB" />
          <stop offset="0.5" stopColor="#C8D9E6" />
          <stop offset="1" stopColor="#8FA6B8" />
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
        background: "var(--brand-sky-subtle)",
        border: "1px solid var(--brand-sky)",
        backdropFilter: "blur(4px)",
      }}
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--brand-sky)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
      <span style={{ fontSize: "8px", fontWeight: 700, letterSpacing: "0.08em", color: "var(--brand-white)", textTransform: "uppercase" }}>
        SECURE ID
      </span>
    </div>
  );

  const BarcodeGraphic = () => (
    <div style={{ textAlign: "center", marginTop: "12px" }}>
      <svg width="220" height="34" viewBox="0 0 220 34" style={{ display: "inline-block", maxWidth: "100%" }}>
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
                fill="var(--brand-navy)"
              />
            );
          }
          return null;
        })}
      </svg>
      <div style={{ fontSize: "8.5px", letterSpacing: "0.15em", color: "var(--color-text-secondary)", fontFamily: "monospace", marginTop: "2px" }}>
        *{studentFormattedId}*
      </div>
    </div>
  );

  
  
  
  const renderFrontFace = (isPrintVersion = false) => (
    <div
      className={`id-card-face id-card-front ${isPrintVersion ? "id-card-print-face" : ""}`}
      style={{
        width: "100%",
        maxWidth: "340px",
        minHeight: "530px",
        borderRadius: "16px",
        background: isPrintVersion
          ? "var(--brand-white)"
          : "var(--brand-navy)",
        border: isPrintVersion ? "1.5px solid var(--brand-navy)" : "1px solid var(--brand-teal)",
        boxShadow: isPrintVersion
          ? "var(--shadow-lg)"
          : "var(--shadow-lg)",
        position: "relative",
        padding: "16px 20px 18px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxSizing: "border-box",
        overflow: "hidden",
        color: isPrintVersion ? "var(--brand-navy)" : "var(--brand-white)",
      }}
    >
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
            backgroundColor: "transparent",
            pointerEvents: "none",
          }}
        />
      )}

      <div
        className="no-print"
        aria-hidden="true"
        style={{
          width: "42px",
          height: "9px",
          borderRadius: "5px",
          backgroundColor: isPrintVersion ? "var(--brand-beige)" : "var(--brand-navy-active)",
          border: isPrintVersion ? "1px solid var(--brand-teal)" : "1px solid var(--brand-sky)",
          boxShadow: "none",
          margin: "0 auto 12px",
          flexShrink: 0,
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: "10px",
          borderBottom: isPrintVersion
            ? "2px solid var(--brand-teal)"
            : "1px solid var(--brand-teal)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "var(--brand-navy)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: "17px",
              color: "var(--brand-white)",
              boxShadow: "var(--shadow-sm)",
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
                color: isPrintVersion ? "var(--brand-navy)" : "var(--brand-white)",
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
                color: isPrintVersion ? "var(--color-text-secondary)" : "var(--brand-sky)",
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

        {!isPrintVersion ? (
          <HologramSeal />
        ) : (
          <div
            style={{
              fontSize: "8.5px",
              fontWeight: 700,
              color: "var(--brand-navy)",
              border: "1px solid var(--brand-teal)",
              backgroundColor: "var(--brand-sky-subtle)",
              padding: "2px 6px",
              borderRadius: "4px",
            }}
          >
            OFFICIAL ID
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: "14px", alignItems: "center", margin: "14px 0" }}>
        <div
          style={{
            width: "82px",
            height: "98px",
            borderRadius: "10px",
            background: isPrintVersion
              ? "var(--brand-beige)"
              : "var(--brand-navy-hover)",
            border: isPrintVersion ? "1.5px solid var(--brand-teal)" : "1.5px solid var(--brand-sky)",
            boxShadow: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {photoUrl ? (
            
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
                  ? "var(--brand-white)"
                  : "var(--brand-navy)",
                border: isPrintVersion
                  ? "1px solid var(--color-border)"
                  : "1px solid var(--brand-sky)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "17px",
                color: isPrintVersion ? "var(--brand-navy)" : "var(--brand-sky)",
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
              backgroundColor: isPrintVersion ? "var(--brand-navy)" : "var(--brand-teal)",
              color: "var(--brand-white)",
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

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor:
                  cardStatus === "approved"
                    ? "var(--color-success)"
                    : cardStatus === "pending-approval"
                    ? "var(--color-warning)"
                    : cardStatus === "draft"
                    ? "var(--brand-teal)"
                    : "var(--color-danger)",
                display: "inline-block",
              }}
            />
            <span
              style={{
                fontSize: "8.5px",
                fontWeight: 700,
                color:
                  isPrintVersion
                    ? "var(--brand-navy)"
                    : cardStatus === "approved"
                    ? "var(--brand-sky)"
                    : cardStatus === "pending-approval"
                    ? "var(--brand-beige)"
                    : cardStatus === "draft"
                    ? "var(--brand-sky)"
                    : "var(--brand-beige)",
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

          <h4
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: isPrintVersion ? "var(--brand-navy)" : "var(--brand-white)",
              margin: "0 0 3px",
              letterSpacing: "-0.01em",
              lineHeight: 1.25,
              wordBreak: "break-word",
            }}
          >
            {student.name}
          </h4>

          <div
            style={{
              display: "inline-block",
              fontSize: "11px",
              fontWeight: 700,
              color: isPrintVersion ? "var(--brand-teal)" : "var(--brand-sky)",
              letterSpacing: "0.04em",
              fontFamily: "monospace",
            }}
          >
            {studentFormattedId}
          </div>

          <div
            style={{
              fontSize: "11px",
              color: isPrintVersion ? "var(--color-text-secondary)" : "var(--brand-sky)",
              marginTop: "4px",
              fontWeight: 500,
            }}
          >
            <strong style={{ color: isPrintVersion ? "var(--brand-navy)" : "var(--brand-white)" }}>{student.classGrade}</strong> ·{" "}
            <span style={{ color: isPrintVersion ? "var(--color-text-secondary)" : "var(--brand-sky)" }}>{student.board}</span>
          </div>

          <div
            style={{
              fontSize: "9.5px",
              color: isPrintVersion ? "var(--color-text-secondary)" : "var(--brand-sky)",
              marginTop: "2px",
            }}
          >
            Session: <span style={{ fontWeight: 600, color: isPrintVersion ? "var(--brand-navy)" : "var(--brand-white)" }}>{academicSession}</span>
          </div>
        </div>
      </div>

      <div
        style={{
          background: isPrintVersion ? "var(--brand-beige)" : "var(--brand-navy-hover)",
          borderRadius: "8px",
          padding: "7px 10px",
          border: isPrintVersion ? "1px solid var(--color-border)" : "1px solid var(--brand-teal)",
          margin: "4px 0 12px",
        }}
      >
        <div
          style={{
            fontSize: "8px",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: isPrintVersion ? "var(--color-text-secondary)" : "var(--brand-sky)",
            fontWeight: 700,
            marginBottom: "3px",
          }}
        >
          Enrolled Subjects ({enrolledSubjectNames.length})
        </div>
        <div
          style={{
            fontSize: "10px",
            color: isPrintVersion ? "var(--brand-navy)" : "var(--brand-white)",
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

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "8px 10px",
          borderRadius: "10px",
          background: isPrintVersion ? "var(--brand-sky-soft)" : "var(--brand-navy-hover)",
          border: isPrintVersion ? "1px solid var(--color-border)" : "1px solid var(--brand-teal)",
        }}
      >
        <div
          style={{
            width: "68px",
            height: "68px",
            backgroundColor: "var(--brand-white)",
            borderRadius: "6px",
            padding: "2px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "none",
            border: "1px solid var(--brand-navy)",
            overflow: "hidden",
          }}
          dangerouslySetInnerHTML={{ __html: qrSvgMarkup }}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "3px" }}>
            <span
              style={{
                fontSize: "8.5px",
                fontWeight: 700,
                color: isPrintVersion ? "var(--brand-navy)" : "var(--brand-white)",
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
              color: isPrintVersion ? "var(--color-text-secondary)" : "var(--brand-sky)",
              lineHeight: 1.3,
            }}
          >
            Scan with smartphone or terminal reader to verify student status.
          </div>

          <div
            style={{
              fontSize: "8.5px",
              fontWeight: 600,
              color: isPrintVersion ? "var(--brand-teal)" : "var(--brand-sky)",
              marginTop: "4px",
              letterSpacing: "0.02em",
            }}
          >
            Valid Thru: {validThruDateStr}
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: "10px",
          paddingTop: "6px",
          borderTop: isPrintVersion ? "1px solid var(--color-border)" : "1px solid var(--brand-teal)",
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontSize: "7.5px",
            letterSpacing: "0.08em",
            color: isPrintVersion ? "var(--color-text-secondary)" : "var(--brand-sky)",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          Official Academy Identity Document · Kolkata
        </span>
      </div>
    </div>
  );

  
  
  
  const renderBackFace = (isPrintVersion = false) => (
    <div
      className={`id-card-face id-card-back ${isPrintVersion ? "id-card-print-face" : ""}`}
      style={{
        width: "100%",
        maxWidth: "340px",
        minHeight: "530px",
        borderRadius: "16px",
        background: isPrintVersion
          ? "var(--brand-white)"
          : "var(--brand-navy)",
        border: isPrintVersion ? "1.5px solid var(--brand-navy)" : "1px solid var(--brand-teal)",
        boxShadow: "var(--shadow-lg)",
        position: "relative",
        padding: "16px 20px 18px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxSizing: "border-box",
        overflow: "hidden",
        color: isPrintVersion ? "var(--brand-navy)" : "var(--brand-white)",
      }}
    >
      <div
        className="no-print"
        aria-hidden="true"
        style={{
          width: "42px",
          height: "9px",
          borderRadius: "5px",
          backgroundColor: isPrintVersion ? "var(--brand-beige)" : "var(--brand-navy-active)",
          border: isPrintVersion ? "1px solid var(--brand-teal)" : "1px solid var(--brand-sky)",
          boxShadow: "none",
          margin: "0 auto 8px",
          flexShrink: 0,
        }}
      />

      <div
        style={{
          height: "32px",
          backgroundColor: "var(--brand-navy)",
          margin: "0 -20px 12px",
          borderTop: "1px solid var(--brand-teal)",
          borderBottom: "1px solid var(--brand-teal)",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          padding: "0 16px",
        }}
      >
        <span style={{ fontSize: "7px", letterSpacing: "0.15em", color: "var(--brand-sky)", fontFamily: "monospace" }}>
          ISO/IEC 7810 ID-1 COMPATIBLE
        </span>
      </div>

      <div
        style={{
          background: isPrintVersion ? "var(--brand-beige)" : "var(--brand-navy-hover)",
          borderRadius: "8px",
          padding: "10px 12px",
          border: isPrintVersion ? "1px solid var(--color-border)" : "1px solid var(--brand-teal)",
          marginBottom: "10px",
        }}
      >
        <div
          style={{
            fontSize: "8.5px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: isPrintVersion ? "var(--brand-teal)" : "var(--brand-sky)",
            textTransform: "uppercase",
            marginBottom: "6px",
          }}
        >
          Guardian &amp; Emergency Contact
        </div>
        <div style={{ fontSize: "11px", color: isPrintVersion ? "var(--brand-navy)" : "var(--brand-white)", fontWeight: 600 }}>
          {cardRecord?.guardianName || student.guardianName}
        </div>
        <div style={{ fontSize: "10px", color: isPrintVersion ? "var(--color-text-secondary)" : "var(--brand-sky)", marginTop: "2px" }}>
          Phone: <strong style={{ color: isPrintVersion ? "var(--brand-navy)" : "var(--brand-white)" }}>{cardRecord?.guardianPhone || student.guardianPhone}</strong>
        </div>
        {cardRecord?.emergencyContact && cardRecord.emergencyContact !== (cardRecord.guardianPhone || student.guardianPhone) && (
          <div style={{ fontSize: "9.5px", color: isPrintVersion ? "var(--color-text-secondary)" : "var(--brand-sky)", marginTop: "2px" }}>
            Emergency: <strong style={{ color: isPrintVersion ? "var(--brand-navy)" : "var(--brand-white)" }}>{cardRecord.emergencyContact}</strong>
          </div>
        )}
        <div style={{ fontSize: "9px", color: isPrintVersion ? "var(--color-text-secondary)" : "var(--brand-sky)", marginTop: "4px" }}>
          Admitted: {student.joiningDate} · ID: {studentFormattedId}
        </div>
      </div>

      <div style={{ margin: "4px 0 10px" }}>
        <div
          style={{
            fontSize: "8.5px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: isPrintVersion ? "var(--brand-navy)" : "var(--brand-white)",
            textTransform: "uppercase",
            marginBottom: "3px",
          }}
        >
          Campus &amp; Registry Office
        </div>
        <div style={{ fontSize: "9px", color: isPrintVersion ? "var(--color-text-secondary)" : "var(--brand-sky)", lineHeight: 1.4 }}>
          {cardRecord?.campusName || "AROUSH Academy"} · Park Circus Center<br />
          {cardRecord?.campusAddress || "48/2 Circus Avenue, Park Circus, Kolkata, West Bengal 700017"}<br />
          Helpline: {cardRecord?.campusPhone || "+91 98830 11221"} · {cardRecord?.campusEmail || "contact@aroush.academy"}
        </div>
      </div>

      <div
        style={{
          fontSize: "7.8px",
          color: isPrintVersion ? "var(--color-text-secondary)" : "var(--brand-sky)",
          lineHeight: 1.35,
          borderTop: isPrintVersion ? "1px solid var(--color-border)" : "1px solid var(--brand-teal)",
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
          <div style={{ fontSize: "7px", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
            Security Seal
          </div>
          <div style={{ fontSize: "8px", fontWeight: 700, color: "var(--brand-navy)" }}>
            VERIFIED CREDENTIAL
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontFamily: "cursive, sans-serif",
              fontSize: "12px",
              color: isPrintVersion ? "var(--brand-teal)" : "var(--brand-sky)",
              lineHeight: 1,
              letterSpacing: "0.05em",
            }}
          >
            M. D. Danish
          </div>
          <div
            style={{
              fontSize: "7.5px",
              color: isPrintVersion ? "var(--color-text-secondary)" : "var(--brand-sky)",
              borderTop: isPrintVersion ? "1px solid var(--color-input-border)" : "1px solid var(--brand-teal)",
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

      <BarcodeGraphic />
    </div>
  );

  
  
  
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
        <div
          style={{
            width: "32px",
            height: "54px",
            background: "var(--brand-navy)",
            borderLeft: "1px dashed var(--brand-sky)",
            borderRight: "1px dashed var(--brand-sky)",
            boxShadow: "var(--shadow-md)",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        />

        <div
          style={{
            width: "36px",
            height: "10px",
            borderRadius: "2px",
            background: "var(--brand-sky)",
            boxShadow: "var(--shadow-sm)",
            border: "0.5px solid var(--brand-teal)",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "4px",
              height: "4px",
              borderRadius: "50%",
              backgroundColor: "var(--brand-navy)",
            }}
          />
        </div>

        <div
          style={{
            width: "14px",
            height: "18px",
            border: "3px solid var(--brand-teal)",
            borderTop: "none",
            borderRadius: "0 0 7px 7px",
            background: "transparent",
            boxShadow: "var(--shadow-sm)",
            marginTop: "-1px",
          }}
        />
      </div>

      {!isOfficiallyIssued && (
        <div
          className="no-print"
          style={{
            marginBottom: "14px",
            padding: "6px 14px",
            borderRadius: "var(--radius-md)",
            backgroundColor:
              cardStatus === "pending-approval"
                ? "var(--color-warning-bg)"
                : cardStatus === "draft"
                ? "var(--brand-sky-subtle)"
                : "var(--color-danger-bg)",
            border: `1px solid ${
              cardStatus === "pending-approval"
                ? "var(--color-warning-border)"
                : cardStatus === "draft"
                ? "var(--color-border)"
                : "var(--color-danger-border)"
            }`,
            color:
              cardStatus === "pending-approval"
                ? "var(--color-warning)"
                : cardStatus === "draft"
                ? "var(--brand-navy)"
                : "var(--color-danger)",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <Info size={14} aria-hidden="true" />
          <span>
            {cardStatus === "draft"
              ? "Draft Preview - Not Officially Issued"
              : cardStatus === "pending-approval"
              ? "Pending Approval - Not Officially Issued"
              : cardStatus === "rejected"
              ? `Rejected - Reason: ${cardRecord?.rejectionReason || "Requirements not met"}`
              : "Inactive / Deactivated Credential"}
          </span>
        </div>
      )}

      <div className="no-print" style={{ zIndex: 1, position: "relative" }}>
        {activeSide === "front" ? renderFrontFace(true) : renderBackFace(true)}
      </div>

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
        <div
          style={{
            display: "inline-flex",
            backgroundColor: "var(--color-surface-muted)",
            borderRadius: "var(--radius-md)",
            padding: "3px",
            border: "1px solid var(--color-border)",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveSide("front")}
            style={{
              padding: "6px 16px",
              borderRadius: "var(--radius-sm)",
              fontSize: "12px",
              fontWeight: activeSide === "front" ? 700 : 500,
              backgroundColor: activeSide === "front" ? "var(--color-primary)" : "transparent",
              color: activeSide === "front" ? "var(--brand-white)" : "var(--color-primary)",
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            Card Front
          </button>
          <button
            type="button"
            onClick={() => setActiveSide("back")}
            style={{
              padding: "6px 16px",
              borderRadius: "var(--radius-sm)",
              fontSize: "12px",
              fontWeight: activeSide === "back" ? 700 : 500,
              backgroundColor: activeSide === "back" ? "var(--color-primary)" : "transparent",
              color: activeSide === "back" ? "var(--brand-white)" : "var(--color-primary)",
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            Reverse Side
          </button>
        </div>

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

        <div
          style={{
            fontSize: "11px",
            color: "var(--color-neutral-dark)",
            textAlign: "center",
            lineHeight: 1.4,
            maxWidth: "340px",
          }}
        >
          Standard CR-80 physical format (85.6mm &times; 54mm equivalent). Dynamic QR code encodes secure verification URL for camera inspection.
        </div>
      </div>

      <div
        className="digital-id-card-print-sheet"
        style={{
          display: "none", 
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
          backgroundColor: "var(--color-overlay)",
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

