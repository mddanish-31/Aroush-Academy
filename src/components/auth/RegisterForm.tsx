"use client";

import React, { useState } from "react";
import Link from "next/link";
import { UserRole } from "@/types";
import { useAuth } from "@/lib/auth/AuthContext";
import { ROLE_DISPLAY_NAMES, RegistrationRequest } from "@/lib/auth/authTypes";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export function RegisterForm() {
  const { register } = useAuth();

  const [selectedRole, setSelectedRole] = useState<"student" | "parent" | "teacher" | "academy-admin">("student");
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [classGrade, setClassGrade] = useState("Class X");
  const [wardName, setWardName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedRequest, setSubmittedRequest] = useState<RegistrationRequest | null>(null);

  const isStaffRole = selectedRole === "academy-admin" || selectedRole === "teacher";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (isStaffRole) {
      setErrorMessage(
        "Self-registration is restricted for institutional roles (Academy Admin, Teacher). Staff accounts must be provisioned directly by Academy Management."
      );
      return;
    }

    if (!name.trim() || name.trim().length < 2) {
      setErrorMessage("Please enter your full legal name.");
      return;
    }
    if (!identifier.trim()) {
      setErrorMessage("Please enter your email address or 10-digit mobile number.");
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Password and confirmation password do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await register({
        name: name.trim(),
        identifier: identifier.trim(),
        password,
        role: selectedRole,
        classGrade: selectedRole === "student" ? classGrade : undefined,
        wardName: selectedRole === "parent" ? wardName.trim() : undefined,
      });

      if (res.success && res.request) {
        // Truthful Admin Approval Workflow:
        // Do NOT automatically authenticate or redirect to dashboard.
        // Show pending confirmation screen.
        setSubmittedRequest(res.request);
      } else {
        setErrorMessage(res.error || "Registration failed. Please check the inputs.");
      }
    } catch {
      setErrorMessage("An unexpected registration error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        paddingTop: "var(--space-12)",
        paddingBottom: "var(--space-20)",
        minHeight: "85vh",
        display: "flex",
        alignItems: "center",
      }}
    >
      <div className="container-narrow" style={{ maxWidth: "580px" }}>
        {/* Unmistakable Demo Warning Banner */}
        <div
          style={{
            backgroundColor: "rgba(255, 149, 0, 0.08)",
            border: "1px solid rgba(255, 149, 0, 0.3)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-3) var(--space-4)",
            marginBottom: "var(--space-6)",
            display: "flex",
            alignItems: "flex-start",
            gap: "var(--space-3)",
          }}
          role="note"
          aria-label="Demo environment notice"
        >
          <span style={{ fontSize: "16px", lineHeight: 1 }} aria-hidden="true">
            ⚠️
          </span>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-primary)", lineHeight: 1.5 }}>
            <strong>DEMO REGISTRATION NOTICE:</strong> Registered accounts are saved to client-side
            demo storage for prototype evaluation. Real student admissions and identity verification are
            processed by the academy office at Park Circus.
          </div>
        </div>

        <Card padding="lg" style={{ boxShadow: "var(--shadow-md)" }}>
          {submittedRequest ? (
            <div style={{ textAlign: "center", padding: "var(--space-2) 0" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "var(--space-3)" }}>
                <Badge variant="warning" size="md">
                  Status: Pending Academy Admin Approval
                </Badge>
              </div>

              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(255, 149, 0, 0.12)",
                  color: "var(--color-warning)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "26px",
                  margin: "0 auto var(--space-4)",
                }}
                aria-hidden="true"
              >
                ⏳
              </div>

              <h1
                style={{
                  fontSize: "var(--text-2xl)",
                  fontWeight: 700,
                  marginBottom: "var(--space-2)",
                  letterSpacing: "-0.02em",
                }}
              >
                Registration Submitted
              </h1>

              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-neutral-dark)",
                  lineHeight: 1.6,
                  maxWidth: "480px",
                  margin: "0 auto var(--space-5)",
                }}
              >
                Thank you, <strong>{submittedRequest.name}</strong>. Your account application has been received and is currently awaiting approval by the Academy Administrator.
              </p>

              {/* Applicant Details Summary */}
              <div
                style={{
                  backgroundColor: "var(--color-surface-muted)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "var(--space-4)",
                  marginBottom: "var(--space-5)",
                  textAlign: "left",
                  fontSize: "var(--text-xs)",
                }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
                  <div>
                    <span style={{ color: "var(--color-neutral-dark)", display: "block", marginBottom: "2px" }}>
                      Application ID:
                    </span>
                    <strong style={{ fontFamily: "monospace", fontSize: "var(--text-xs)" }}>
                      {submittedRequest.id}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--color-neutral-dark)", display: "block", marginBottom: "2px" }}>
                      Requested Role:
                    </span>
                    <strong style={{ textTransform: "capitalize" }}>
                      {submittedRequest.role === "student" ? "Student" : "Parent / Guardian"}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--color-neutral-dark)", display: "block", marginBottom: "2px" }}>
                      Registered Identifier:
                    </span>
                    <strong>{submittedRequest.identifier}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--color-neutral-dark)", display: "block", marginBottom: "2px" }}>
                      Submission Time:
                    </span>
                    <span>{submittedRequest.submittedAt}</span>
                  </div>
                  {submittedRequest.classGrade && (
                    <div>
                      <span style={{ color: "var(--color-neutral-dark)", display: "block", marginBottom: "2px" }}>
                        Class / Grade:
                      </span>
                      <span>{submittedRequest.classGrade}</span>
                    </div>
                  )}
                  {submittedRequest.wardName && (
                    <div>
                      <span style={{ color: "var(--color-neutral-dark)", display: "block", marginBottom: "2px" }}>
                        Linked Student (Ward):
                      </span>
                      <span>{submittedRequest.wardName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Truthful Administrative Notice */}
              <div
                style={{
                  backgroundColor: "rgba(0, 113, 227, 0.06)",
                  border: "1px solid rgba(0, 113, 227, 0.2)",
                  borderRadius: "var(--radius-md)",
                  padding: "var(--space-3) var(--space-4)",
                  marginBottom: "var(--space-5)",
                  textAlign: "left",
                  fontSize: "var(--text-xs)",
                  color: "var(--color-primary)",
                  lineHeight: 1.5,
                }}
                role="note"
              >
                <strong>Admin Approval Required:</strong> In accordance with ArousH Academy policy, newly registered student and parent accounts cannot sign in until an Academy Administrator reviews and authorizes the application.
                <div style={{ marginTop: "var(--space-2)", color: "var(--color-neutral-dark)" }}>
                  <em>Demo Verification:</em> Log in as Academy Admin (<code>admin@aroushacademy.in</code> / <code>admin2026</code>) and navigate to <strong>Registration Approvals</strong> to approve this application. Once approved, you can return to the sign-in screen and log in with this account.
                </div>
              </div>

              {/* Navigation Action Buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                <Button href="/login" variant="primary" size="md" style={{ width: "100%" }}>
                  Proceed to Sign In Page →
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSubmittedRequest(null);
                    setName("");
                    setIdentifier("");
                    setPassword("");
                    setConfirmPassword("");
                  }}
                  style={{ width: "100%" }}
                >
                  Submit Another Application
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "var(--space-3)" }}>
                <Badge variant="accent" size="md">
                  ArousH Academy &bull; Student & Guardian Enrollment
                </Badge>
              </div>

              <h1
                style={{
                  fontSize: "var(--text-2xl)",
                  textAlign: "center",
                  marginBottom: "var(--space-2)",
                  letterSpacing: "-0.02em",
                }}
              >
                Create Your Academy Account
              </h1>

              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-neutral-dark)",
                  textAlign: "center",
                  marginBottom: "var(--space-6)",
                  lineHeight: 1.5,
                }}
              >
                Select your account type to create a student workspace or parent oversight profile.
              </p>

              <form onSubmit={handleSubmit} noValidate>
            {/* Account Type Selector */}
            <div style={{ marginBottom: "var(--space-4)" }}>
              <span
                id="reg-role-label"
                style={{
                  display: "block",
                  fontSize: "var(--text-xs)",
                  fontWeight: 600,
                  marginBottom: "var(--space-2)",
                  color: "var(--color-primary)",
                }}
              >
                Select Account Type
              </span>
              <div
                role="radiogroup"
                aria-labelledby="reg-role-label"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "var(--space-2)",
                }}
              >
                {(
                  [
                    { id: "student", label: "Student", desc: "For learners attending courses" },
                    { id: "parent", label: "Parent / Guardian", desc: "For fee receipts & progress monitoring" },
                    { id: "teacher", label: "Faculty / Teacher", desc: "Restricted staff registration" },
                    { id: "academy-admin", label: "Academy Admin", desc: "Restricted administrative roster" },
                  ] as const
                ).map((item) => {
                  const isSelected = selectedRole === item.id;
                  const isRestricted = item.id === "teacher" || item.id === "academy-admin";
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => {
                        setSelectedRole(item.id);
                        setErrorMessage(null);
                      }}
                      style={{
                        padding: "8px 10px",
                        borderRadius: "var(--radius-md)",
                        border: `1px solid ${
                          isSelected
                            ? isRestricted
                              ? "var(--color-warning)"
                              : "var(--color-accent)"
                            : "var(--color-border)"
                        }`,
                        backgroundColor: isSelected
                          ? isRestricted
                            ? "rgba(255, 149, 0, 0.08)"
                            : "var(--color-accent-subtle)"
                          : "var(--color-surface-muted)",
                        color: isSelected
                          ? isRestricted
                            ? "var(--color-warning)"
                            : "var(--color-accent)"
                          : "var(--color-primary)",
                        fontSize: "var(--text-xs)",
                        textAlign: "left",
                        cursor: "pointer",
                        transition: "all var(--transition-fast)",
                      }}
                    >
                      <div style={{ fontWeight: 600, display: "flex", justifyContent: "space-between" }}>
                        <span>{item.label}</span>
                        {isRestricted && (
                          <span style={{ fontSize: "10px", opacity: 0.8 }}>Restricted</span>
                        )}
                      </div>
                      <div style={{ fontSize: "10px", color: "var(--color-neutral-dark)", marginTop: "2px" }}>
                        {item.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RESTRICTED NOTICE IF TEACHER OR ADMIN SELECTED */}
            {isStaffRole ? (
              <div
                style={{
                  backgroundColor: "rgba(255, 149, 0, 0.08)",
                  border: "1px solid rgba(255, 149, 0, 0.3)",
                  borderRadius: "var(--radius-md)",
                  padding: "var(--space-4)",
                  marginBottom: "var(--space-5)",
                }}
              >
                <div style={{ fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--color-primary)", marginBottom: "var(--space-1)" }}>
                  Institutional Account Provisioning Required
                </div>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", lineHeight: 1.5, marginBottom: "var(--space-3)" }}>
                  Public self-registration is strictly restricted for <strong>{ROLE_DISPLAY_NAMES[selectedRole as UserRole]}</strong> accounts.
                  Faculty and administrative staff credentials must be provisioned directly by Academy Management at the Park Circus center.
                </p>
                <div style={{ display: "flex", gap: "var(--space-2)" }}>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setSelectedRole("student")}
                  >
                    Switch to Student Registration
                  </Button>
                  <Button href="/login" variant="ghost" size="sm">
                    Open Staff Demo Sign In →
                  </Button>
                </div>
              </div>
            ) : (
              /* ACTIVE STUDENT / PARENT REGISTRATION FIELDS */
              <>
                {/* Full Name */}
                <div style={{ marginBottom: "var(--space-3)" }}>
                  <label
                    htmlFor="reg-name"
                    style={{
                      display: "block",
                      fontSize: "var(--text-xs)",
                      fontWeight: 600,
                      marginBottom: "var(--space-1)",
                      color: "var(--color-primary)",
                    }}
                  >
                    Full Legal Name
                  </label>
                  <input
                    id="reg-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Zayd Al-Mansoor"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--color-border)",
                      backgroundColor: "var(--color-surface)",
                      fontSize: "var(--text-sm)",
                      color: "var(--color-primary)",
                      outline: "none",
                    }}
                  />
                </div>

                {/* Email or Mobile Number */}
                <div style={{ marginBottom: "var(--space-3)" }}>
                  <label
                    htmlFor="reg-identifier"
                    style={{
                      display: "block",
                      fontSize: "var(--text-xs)",
                      fontWeight: 600,
                      marginBottom: "var(--space-1)",
                      color: "var(--color-primary)",
                    }}
                  >
                    Email Address or 10-Digit Mobile Number
                  </label>
                  <input
                    id="reg-identifier"
                    name="identifier"
                    type="text"
                    inputMode="email"
                    autoComplete="username"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. zayd.student@gmail.com or 09883033445"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--color-border)",
                      backgroundColor: "var(--color-surface)",
                      fontSize: "var(--text-sm)",
                      color: "var(--color-primary)",
                      outline: "none",
                    }}
                  />
                </div>

                {/* Role Specific Additional Fields */}
                {selectedRole === "student" && (
                  <div style={{ marginBottom: "var(--space-3)" }}>
                    <label
                      htmlFor="reg-class"
                      style={{
                        display: "block",
                        fontSize: "var(--text-xs)",
                        fontWeight: 600,
                        marginBottom: "var(--space-1)",
                        color: "var(--color-primary)",
                      }}
                    >
                      Enrolling Class / Grade
                    </label>
                    <select
                      id="reg-class"
                      value={classGrade}
                      onChange={(e) => setClassGrade(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--color-border)",
                        backgroundColor: "var(--color-surface)",
                        fontSize: "var(--text-sm)",
                        color: "var(--color-primary)",
                        outline: "none",
                      }}
                    >
                      <option value="Class IX">Class IX (ICSE / CBSE)</option>
                      <option value="Class X">Class X (ICSE / CBSE)</option>
                      <option value="Class XI">Class XI (Science / Commerce)</option>
                      <option value="Class XII">Class XII (Science / Commerce)</option>
                    </select>
                  </div>
                )}

                {selectedRole === "parent" && (
                  <div style={{ marginBottom: "var(--space-3)" }}>
                    <label
                      htmlFor="reg-ward"
                      style={{
                        display: "block",
                        fontSize: "var(--text-xs)",
                        fontWeight: 600,
                        marginBottom: "var(--space-1)",
                        color: "var(--color-primary)",
                      }}
                    >
                      Enrolled Student / Ward Name
                    </label>
                    <input
                      id="reg-ward"
                      type="text"
                      value={wardName}
                      onChange={(e) => setWardName(e.target.value)}
                      placeholder="e.g. Taha Rahman"
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--color-border)",
                        backgroundColor: "var(--color-surface)",
                        fontSize: "var(--text-sm)",
                        color: "var(--color-primary)",
                        outline: "none",
                      }}
                    />
                  </div>
                )}

                {/* Password Fields */}
                <div style={{ marginBottom: "var(--space-3)" }}>
                  <label
                    htmlFor="reg-password"
                    style={{
                      display: "block",
                      fontSize: "var(--text-xs)",
                      fontWeight: 600,
                      marginBottom: "var(--space-1)",
                      color: "var(--color-primary)",
                    }}
                  >
                    Password (min 6 characters)
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      id="reg-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a secure password"
                      style={{
                        width: "100%",
                        padding: "10px 42px 10px 14px",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--color-border)",
                        backgroundColor: "var(--color-surface)",
                        fontSize: "var(--text-sm)",
                        color: "var(--color-primary)",
                        outline: "none",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--color-neutral-dark)",
                        fontSize: "12px",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "4px",
                      }}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: "var(--space-4)" }}>
                  <label
                    htmlFor="reg-confirm-password"
                    style={{
                      display: "block",
                      fontSize: "var(--text-xs)",
                      fontWeight: 600,
                      marginBottom: "var(--space-1)",
                      color: "var(--color-primary)",
                    }}
                  >
                    Confirm Password
                  </label>
                  <input
                    id="reg-confirm-password"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--color-border)",
                      backgroundColor: "var(--color-surface)",
                      fontSize: "var(--text-sm)",
                      color: "var(--color-primary)",
                      outline: "none",
                    }}
                  />
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <div
                    style={{
                      backgroundColor: "rgba(255, 59, 48, 0.08)",
                      border: "1px solid rgba(255, 59, 48, 0.25)",
                      borderRadius: "var(--radius-md)",
                      padding: "var(--space-2) var(--space-3)",
                      marginBottom: "var(--space-4)",
                      fontSize: "var(--text-xs)",
                      color: "#D32F2F",
                      lineHeight: 1.4,
                    }}
                    role="alert"
                  >
                    {errorMessage}
                  </div>
                )}

                {/* Submit Action */}
                <div style={{ marginBottom: "var(--space-4)" }}>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={isSubmitting}
                    style={{ width: "100%" }}
                  >
                    {isSubmitting
                      ? "Creating Demo Account..."
                      : `Register as ${selectedRole === "student" ? "Student" : "Parent"}`}
                  </Button>
                </div>
              </>
            )}
          </form>
            </>
          )}

          {/* Bottom Navigation Links */}
          <div
            style={{
              borderTop: "1px solid var(--color-border)",
              marginTop: "var(--space-5)",
              paddingTop: "var(--space-4)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "var(--text-xs)",
            }}
          >
            <Link href="/" style={{ color: "var(--color-neutral-dark)" }}>
              ← Public Home
            </Link>
            <div>
              <span style={{ color: "var(--color-neutral-dark)" }}>Already registered? </span>
              <Link href="/login" style={{ fontWeight: 600, color: "var(--color-accent)" }}>
                Sign In →
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
