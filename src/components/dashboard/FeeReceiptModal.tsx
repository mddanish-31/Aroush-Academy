"use client";

import React from "react";
import { PaymentTransaction, MonthlyFeeObligation, StudentProfile, SubjectEnrollment } from "@/types";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

export interface FeeReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: PaymentTransaction;
  obligation: MonthlyFeeObligation;
  student: StudentProfile;
  enrollment: SubjectEnrollment;
  remainingBalanceAfterPayment: number;
}

export function FeeReceiptModal({
  isOpen,
  onClose,
  transaction,
  obligation,
  student,
  enrollment,
  remainingBalanceAfterPayment,
}: FeeReceiptModalProps) {
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

  const studentFormattedId = `AA-2026-${student.id.replace("std-", "")}`;

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Fee Payment Receipt"
      className="printable-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
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
      <div
        className="printable-document fee-receipt-voucher"
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "var(--radius-xl)",
          maxWidth: "580px",
          width: "100%",
          boxShadow: "var(--shadow-lg)",
          border: "1px solid rgba(0, 0, 0, 0.12)",
          overflow: "hidden",
          fontFamily: "var(--font-sans)",
          color: "var(--color-primary)",
        }}
      >
        {/* Receipt Header Banner */}
        <div
          style={{
            backgroundColor: "#1D1D1F",
            color: "#FFFFFF",
            padding: "var(--space-5) var(--space-6)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            borderBottom: "3px solid var(--color-accent)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "4px",
                  backgroundColor: "var(--color-accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "12px",
                  color: "#FFFFFF",
                }}
              >
                A
              </div>
              <h2 style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "0.06em", color: "#FFFFFF", margin: 0, textTransform: "uppercase" }}>
                ArousH Academy
              </h2>
            </div>
            <p style={{ fontSize: "11px", color: "var(--color-neutral)", margin: "4px 0 0" }}>
              Govt. Regd. Coaching Institute &bull; Park Circus / CIT Road, Kolkata
            </p>
          </div>

          <div style={{ textAlign: "right" }}>
            <span
              style={{
                display: "inline-block",
                padding: "3px 8px",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                borderRadius: "var(--radius-sm)",
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                color: "#FFFFFF",
                textTransform: "uppercase",
              }}
            >
              Fee Receipt Voucher
            </span>
            <div style={{ fontSize: "11px", color: "var(--color-neutral)", marginTop: "4px" }}>
              Receipt No: <strong style={{ color: "#FFFFFF" }}>{transaction.referenceId}</strong>
            </div>
          </div>
        </div>

        {/* Receipt Meta Strip */}
        <div
          style={{
            backgroundColor: "var(--color-surface-muted)",
            padding: "var(--space-3) var(--space-6)",
            borderBottom: "1px solid var(--color-border)",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "var(--space-2)",
            fontSize: "11px",
          }}
        >
          <div>
            <span style={{ color: "var(--color-neutral-dark)", display: "block" }}>Payment Date</span>
            <strong>{transaction.paymentDate}</strong>
          </div>
          <div>
            <span style={{ color: "var(--color-neutral-dark)", display: "block" }}>Fee Obligation Period</span>
            <strong>{obligation.monthLabel}</strong>
          </div>
          <div>
            <span style={{ color: "var(--color-neutral-dark)", display: "block" }}>Tx Reference ID</span>
            <strong>{transaction.id}</strong>
          </div>
        </div>

        {/* Student & Enrollment Info */}
        <div style={{ padding: "var(--space-5) var(--space-6)" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr",
              gap: "var(--space-4)",
              marginBottom: "var(--space-4)",
              paddingBottom: "var(--space-4)",
              borderBottom: "1px dashed var(--color-border)",
            }}
          >
            <div>
              <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-neutral-dark)", fontWeight: 700 }}>
                Student Details
              </span>
              <div style={{ fontSize: "var(--text-base)", fontWeight: 700, marginTop: "2px" }}>
                {student.name}
              </div>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)" }}>
                Student ID: <strong>{studentFormattedId}</strong> &bull; {student.classGrade} ({student.board})
              </div>
              <div style={{ fontSize: "11px", color: "var(--color-neutral-dark)", marginTop: "2px" }}>
                Guardian: {student.guardianName} ({student.guardianPhone})
              </div>
            </div>

            <div>
              <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-neutral-dark)", fontWeight: 700 }}>
                Subject &amp; Faculty Details
              </span>
              <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginTop: "2px", color: "var(--color-accent)" }}>
                {enrollment.subjectName}
              </div>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)" }}>
                Faculty: <strong>{enrollment.teacherName}</strong>
              </div>
              <div style={{ fontSize: "11px", color: "var(--color-neutral-dark)", marginTop: "2px" }}>
                Batch: {enrollment.batchName}
              </div>
            </div>
          </div>

          {/* Payment Breakdown Table */}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-xs)", marginBottom: "var(--space-4)" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", color: "var(--color-neutral-dark)", fontSize: "10px", textTransform: "uppercase" }}>
                <th style={{ textAlign: "left", padding: "6px 0" }}>Description</th>
                <th style={{ textAlign: "center", padding: "6px 0" }}>Method</th>
                <th style={{ textAlign: "right", padding: "6px 0" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                <td style={{ padding: "10px 0" }}>
                  <strong>Monthly Tuition Fee — {obligation.monthLabel}</strong>
                  <div style={{ fontSize: "10px", color: "var(--color-neutral-dark)" }}>
                    Total Obligation: ₹{obligation.feeAmount.toLocaleString()} &bull; Due Date: {obligation.dueDate}
                  </div>
                </td>
                <td style={{ textAlign: "center", padding: "10px 0" }}>
                  <Badge variant={transaction.paymentMethod === "cash" ? "neutral" : "accent"} size="sm">
                    {transaction.paymentMethod.toUpperCase()}
                  </Badge>
                </td>
                <td style={{ textAlign: "right", padding: "10px 0", fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-success)" }}>
                  ₹{transaction.amount.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Balance & Collector Summary */}
          <div
            style={{
              backgroundColor: "var(--color-surface-muted)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-3) var(--space-4)",
              marginBottom: "var(--space-4)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: "11px", color: "var(--color-neutral-dark)" }}>
                Collected By: <strong>{transaction.collectedByName}</strong> ({transaction.collectedByRole === "teacher" ? "Faculty" : "Admin Office"})
              </div>
              {transaction.notes && (
                <div style={{ fontSize: "10px", color: "var(--color-neutral-dark)", marginTop: "2px" }}>
                  Notes: {transaction.notes}
                </div>
              )}
            </div>

            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "10px", color: "var(--color-neutral-dark)", display: "block" }}>
                Remaining Balance for {obligation.monthLabel}
              </span>
              <strong style={{ fontSize: "var(--text-sm)", color: remainingBalanceAfterPayment > 0 ? "var(--color-warning)" : "var(--color-success)" }}>
                {remainingBalanceAfterPayment > 0 ? `₹${remainingBalanceAfterPayment.toLocaleString()} Pending` : "₹0 (Fully Cleared)"}
              </strong>
            </div>
          </div>

          {/* Verification & Legal Audit Disclaimers */}
          <div
            style={{
              borderLeft: "3px solid var(--color-accent)",
              padding: "6px 12px",
              backgroundColor: "rgba(0, 122, 255, 0.04)",
              borderRadius: "0 var(--radius-sm) var(--radius-sm) 0",
              fontSize: "10px",
              color: "var(--color-neutral-dark)",
              lineHeight: 1.4,
            }}
          >
            <strong>Official Record Notice:</strong>
            {transaction.paymentMethod === "cash"
              ? " Authorized cash payment received in classroom session and recorded in academy ledger."
              : " Online transaction recorded from parent UPI/NEFT submission (Manual Entry • Not validated by an automated payment gateway)."}
            <br />
            This is an illustrative digital receipt generated from ArousH Academy session records. Computer-generated voucher; no physical signature required.
          </div>
        </div>

        {/* Action Buttons (Hidden when printing) */}
        <div
          className="no-print"
          style={{
            borderTop: "1px solid var(--color-border)",
            padding: "var(--space-3) var(--space-6)",
            backgroundColor: "var(--color-surface-muted)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)" }}>
            Printable Single-Page Voucher
          </span>
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <Button variant="secondary" size="sm" onClick={onClose} type="button">
              Close
            </Button>
            <Button variant="accent" size="sm" onClick={handlePrint} type="button">
              Print / Save as PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
