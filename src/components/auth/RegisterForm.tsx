"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { RegistrationRequest } from "@/lib/auth/authTypes";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Clock, Check, Eye, EyeOff } from "lucide-react";

export function RegisterForm() {
  const { register } = useAuth();
  const searchParams = useSearchParams();

  const queryRole = searchParams ? searchParams.get("role") : null;
  const initialRole = queryRole === "parent" || queryRole === "student" ? queryRole : "student";

  const [selectedRole, setSelectedRole] = useState<"student" | "parent">(initialRole);
  const [isRoleSelectorOpen, setIsRoleSelectorOpen] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

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
        paddingTop: "clamp(20px, 3vw, 36px)",
        paddingBottom: "var(--space-16)",
        minHeight: "80vh",
        display: "flex",
        alignItems: "center",
      }}
    >
      <div className="container-narrow" style={{ maxWidth: "540px" }}>
        <Card padding="lg" style={{ boxShadow: "var(--shadow-md)" }}>
          {submittedRequest ? (
            <div style={{ textAlign: "center", padding: "var(--space-2) 0" }}>
              <div
                style={{
                  textAlign: "center",
                  fontSize: "12px",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--color-text-secondary)",
                  marginBottom: "var(--space-3)",
                }}
              >
                Status: Pending Academy Admin Approval
              </div>

              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(29, 29, 31, 0.06)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto var(--space-4)",
                }}
                aria-hidden="true"
              >
                <Clock size={28} style={{ color: "#1D1D1F" }} />
              </div>

              <h1
                style={{
                  fontSize: "var(--text-2xl)",
                  fontWeight: 700,
                  marginBottom: "var(--space-2)",
                  letterSpacing: "-0.02em",
                }}
              >
                Application Submitted Successfully
              </h1>

              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-neutral-dark)",
                  maxWidth: "440px",
                  margin: "0 auto var(--space-6)",
                  lineHeight: 1.5,
                }}
              >
                Your registration application has been logged into the demo enrollment queue. In production,
                the Academy Admin inspects student credentials and activates academic access.
              </p>

              <div
                style={{
                  backgroundColor: "var(--color-surface-muted)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "var(--space-4)",
                  textAlign: "left",
                  fontSize: "var(--text-xs)",
                  marginBottom: "var(--space-5)",
                }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
                  <div>
                    <span style={{ color: "var(--color-neutral-dark)", display: "block" }}>Application ID</span>
                    <strong style={{ fontFamily: "var(--font-mono)", fontSize: "11px" }}>
                      {submittedRequest.id}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--color-neutral-dark)", display: "block" }}>Target Role</span>
                    <strong style={{ textTransform: "capitalize" }}>{submittedRequest.role}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--color-neutral-dark)", display: "block" }}>Full Name</span>
                    <strong>{submittedRequest.name}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--color-neutral-dark)", display: "block" }}>Identifier</span>
                    <span style={{ fontFamily: "var(--font-mono)" }}>{submittedRequest.identifier}</span>
                  </div>
                  {submittedRequest.classGrade && (
                    <div>
                      <span style={{ color: "var(--color-neutral-dark)", display: "block" }}>Class / Division</span>
                      <strong>{submittedRequest.classGrade}</strong>
                    </div>
                  )}
                  {submittedRequest.wardName && (
                    <div>
                      <span style={{ color: "var(--color-neutral-dark)", display: "block" }}>Student Ward</span>
                      <strong>{submittedRequest.wardName}</strong>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                <Button href="/login" variant="primary" size="md" style={{ width: "100%" }}>
                  Proceed to Sign In Page &rarr;
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
              <div
                style={{
                  textAlign: "center",
                  fontSize: "12px",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--color-text-secondary)",
                  marginBottom: "var(--space-2)",
                }}
              >
                ArousH Academy &bull; Student & Guardian Enrollment
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
                  marginBottom: "var(--space-4)",
                  lineHeight: 1.5,
                }}
              >
                Select your account type to create a student workspace or parent oversight profile.
              </p>

              <form onSubmit={handleSubmit} noValidate>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "var(--space-3)",
                    padding: "6px 10px",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "var(--color-surface-muted)",
                  }}
                >
                  <span style={{ fontSize: "var(--text-xs)", color: "#1D1D1F" }}>
                    Account Type: <strong data-testid="selected-reg-role">{selectedRole === "parent" ? "Parent / Guardian" : "Student"}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsRoleSelectorOpen((prev) => !prev)}
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#1D1D1F",
                      textDecoration: "underline",
                      textDecorationColor: "#007AFF",
                      textUnderlineOffset: "2px",
                      cursor: "pointer",
                    }}
                  >
                    Change role
                  </button>
                </div>

                {isRoleSelectorOpen && (
                  <div
                    role="radiogroup"
                    aria-label="Select Account Type"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "var(--space-2)",
                      marginBottom: "var(--space-4)",
                    }}
                  >
                    {[
                      { id: "student", label: "Student", desc: "For learners attending courses" },
                      { id: "parent", label: "Parent / Guardian", desc: "For progress & fee records" },
                    ].map((item) => {
                      const isSelected = selectedRole === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() => {
                            setSelectedRole(item.id as "student" | "parent");
                            setIsRoleSelectorOpen(false);
                            setErrorMessage(null);
                          }}
                          style={{
                            padding: "8px 10px",
                            borderRadius: "var(--radius-md)",
                            border: `1px solid ${isSelected ? "#1D1D1F" : "var(--color-border)"}`,
                            backgroundColor: isSelected ? "#1D1D1F" : "var(--color-surface-muted)",
                            color: isSelected ? "#FFFFFF" : "var(--color-primary)",
                            fontSize: "var(--text-xs)",
                            textAlign: "left",
                            cursor: "pointer",
                          }}
                        >
                          <div style={{ fontWeight: 600, display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: isSelected ? "#FFFFFF" : "#1D1D1F" }}>{item.label}</span>
                            {isSelected && <Check size={14} aria-hidden="true" style={{ color: "#FFFFFF" }} />}
                          </div>
                          <div style={{ fontSize: "10px", color: isSelected ? "#E5E5EA" : "var(--color-neutral-dark)", marginTop: "2px" }}>
                            {item.desc}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

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
                    Email Address or 10-Digit Mobile Phone
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
                    placeholder="e.g. zayd.mansoor@gmail.com or 9830012345"
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
                      Target Academic Standard / Grade
                    </label>
                    <select
                      id="reg-class"
                      name="classGrade"
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
                      <option value="Class V">Class V (Middle School Foundation)</option>
                      <option value="Class VI">Class VI (Middle School Foundation)</option>
                      <option value="Class VII">Class VII (Middle School Foundation)</option>
                      <option value="Class VIII">Class VIII (Foundation Final Year)</option>
                      <option value="Class IX">Class IX (Board Foundation)</option>
                      <option value="Class X">Class X (Secondary Board Intensive)</option>
                      <option value="Class XI">Class XI (Higher Secondary Stream)</option>
                      <option value="Class XII">Class XII (Senior Secondary Board)</option>
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
                      Student Ward Name
                    </label>
                    <input
                      id="reg-ward"
                      name="wardName"
                      type="text"
                      required
                      value={wardName}
                      onChange={(e) => setWardName(e.target.value)}
                      placeholder="e.g. Arjun Das (Class X)"
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
                    Account Password (Min 6 characters)
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
                      placeholder="Create secure password"
                      style={{
                        width: "100%",
                        padding: "10px 38px 10px 14px",
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
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--color-neutral-dark)",
                        padding: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: "var(--space-3)" }}>
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
                    Confirm Account Password
                  </label>
                  <input
                    id="reg-confirm-password"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat chosen password"
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

                {errorMessage && (
                  <div
                    style={{
                      backgroundColor: "rgba(255, 59, 48, 0.08)",
                      border: "1px solid rgba(255, 59, 48, 0.3)",
                      borderRadius: "var(--radius-md)",
                      padding: "var(--space-3)",
                      marginBottom: "var(--space-4)",
                      fontSize: "var(--text-xs)",
                      color: "var(--color-danger)",
                      lineHeight: 1.5,
                    }}
                    role="alert"
                  >
                    {errorMessage}
                  </div>
                )}

                <div style={{ marginBottom: "var(--space-4)" }}>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={isSubmitting}
                    style={{ width: "100%" }}
                  >
                    {isSubmitting ? "Submitting Application..." : "Submit Enrollment Application"}
                  </Button>
                </div>
              </form>
            </>
          )}

          <div
            style={{
              borderTop: "1px solid var(--color-border)",
              paddingTop: "var(--space-4)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "var(--text-xs)",
              flexWrap: "wrap",
              gap: "var(--space-2)",
            }}
          >
            <Link href="/" style={{ color: "var(--color-neutral-dark)" }}>
              &larr; Public Home
            </Link>
            <div>
              <span style={{ color: "var(--color-neutral-dark)" }}>Already registered? </span>
              <Link
                href="/login"
                style={{
                  fontWeight: 600,
                  color: "#1D1D1F",
                  textDecoration: "underline",
                  textDecorationColor: "#007AFF",
                  textUnderlineOffset: "3px",
                }}
              >
                Sign In &rarr;
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
