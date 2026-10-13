"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { UserRole } from "@/types";
import { useAuth } from "@/lib/auth/AuthContext";
import { DEMO_ACCOUNTS } from "@/lib/auth/demoAccounts";
import {
  ROLE_DEFAULT_ROUTES,
  ROLE_DISPLAY_NAMES,
  ROLE_DESCRIPTIONS,
} from "@/lib/auth/authTypes";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

const ROLES_ORDER: UserRole[] = ["academy-admin", "teacher", "student", "parent"];

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, requestPasswordReset, quickSignInDemo, user, isAuthenticated } = useAuth();

  const queryRole = searchParams ? (searchParams.get("role") as UserRole | null) : null;
  const validQueryRole = queryRole && ROLES_ORDER.includes(queryRole) ? queryRole : null;

  const [chosenRole, setChosenRole] = useState<UserRole | null>(null);
  const selectedRole = chosenRole || validQueryRole || "student";

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forgot password sub-state
  const [isForgotPasswordView, setIsForgotPasswordView] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState("");
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);

  // Pre-fill fields when user selects a role demo pill
  const handleSelectRolePill = (role: UserRole) => {
    setChosenRole(role);
    const demo = DEMO_ACCOUNTS[role];
    setIdentifier(demo.user.identifier);
    setPassword(demo.demoPassword);
    setErrorMessage(null);
  };

  const handleQuickDemoSignIn = async (role: UserRole) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await quickSignInDemo(role);
      if (res.success && res.user) {
        router.push(ROLE_DEFAULT_ROUTES[role]);
      } else {
        setErrorMessage(res.error || "Failed to sign in with demo account.");
      }
    } catch {
      setErrorMessage("An unexpected demo sign-in error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim()) {
      setErrorMessage("Please enter your registered email address or phone number.");
      return;
    }
    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login({
        identifier: identifier.trim(),
        password,
        preferredRole: selectedRole,
      });

      if (res.success && res.user) {
        const dest = ROLE_DEFAULT_ROUTES[res.user.role] || "/dashboard";
        router.push(dest);
      } else {
        setErrorMessage(
          res.error || "Invalid credentials. Please verify your details or use one-click demo sign-in."
        );
      }
    } catch {
      setErrorMessage("Network or authentication adapter error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMessage(null);

    if (!resetIdentifier.trim()) {
      setResetMessage("Please provide your registered email address or mobile number.");
      return;
    }

    setIsResetSubmitting(true);
    try {
      const res = await requestPasswordReset({ identifier: resetIdentifier.trim() });
      setResetMessage(res.message);
    } catch {
      setResetMessage("Password reset request failed. Please try again.");
    } finally {
      setIsResetSubmitting(false);
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
      <div className="container-narrow" style={{ maxWidth: "560px" }}>
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
            <strong>DEMO ENVIRONMENT NOTICE:</strong> This frontend preview uses a client-side mock
            authentication adapter. No real credentials, JWTs, or encrypted server sessions are in use.
            Select any role below for instant demo credentials.
          </div>
        </div>

        <Card padding="lg" style={{ boxShadow: "var(--shadow-md)" }}>
          {/* Header Badge */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "var(--space-3)" }}>
            <Badge variant="accent" size="md">
              ArousH Academy &bull; Identity Gateway
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
            {isForgotPasswordView ? "Reset Your Password" : "Sign In to Your Workspace"}
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
            {isForgotPasswordView
              ? "Enter your registered email address or mobile number to receive a simulated recovery token."
              : "Access role-tailored dashboards for Academy Administration, Teachers, Students, and Parents."}
          </p>

          {/* If already authenticated, show current session indicator */}
          {isAuthenticated && user && !isForgotPasswordView && (
            <div
              style={{
                backgroundColor: "var(--color-surface-muted)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                padding: "var(--space-3) var(--space-4)",
                marginBottom: "var(--space-5)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)" }}>
                  Current Active Demo Persona:
                </div>
                <div style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>
                  {user.name} ({ROLE_DISPLAY_NAMES[user.role]})
                </div>
              </div>
              <Button href={ROLE_DEFAULT_ROUTES[user.role]} variant="accent" size="sm">
                Open Dashboard →
              </Button>
            </div>
          )}

          {/* FORGOT PASSWORD VIEW */}
          {isForgotPasswordView ? (
            <form onSubmit={handleResetSubmit} noValidate>
              <div style={{ marginBottom: "var(--space-4)" }}>
                <label
                  htmlFor="reset-identifier"
                  style={{
                    display: "block",
                    fontSize: "var(--text-xs)",
                    fontWeight: 600,
                    marginBottom: "var(--space-1)",
                    color: "var(--color-primary)",
                  }}
                >
                  Email Address or Mobile Number
                </label>
                <input
                  id="reset-identifier"
                  type="text"
                  inputMode="email"
                  autoComplete="username"
                  required
                  value={resetIdentifier}
                  onChange={(e) => setResetIdentifier(e.target.value)}
                  placeholder="e.g. taha.rahman@student.aroush.in or 9883011221"
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

              {resetMessage && (
                <div
                  style={{
                    backgroundColor: "rgba(0, 122, 255, 0.08)",
                    border: "1px solid rgba(0, 122, 255, 0.25)",
                    borderRadius: "var(--radius-md)",
                    padding: "var(--space-3)",
                    marginBottom: "var(--space-4)",
                    fontSize: "var(--text-xs)",
                    color: "var(--color-primary)",
                    lineHeight: 1.5,
                  }}
                  role="status"
                >
                  {resetMessage}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isResetSubmitting}
                  style={{ width: "100%" }}
                >
                  {isResetSubmitting ? "Generating Simulated Token..." : "Send Password Reset Instructions"}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPasswordView(false);
                    setResetMessage(null);
                  }}
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-neutral-dark)",
                    padding: "var(--space-2)",
                    textAlign: "center",
                    cursor: "pointer",
                  }}
                >
                  ← Return to Sign In
                </button>
              </div>
            </form>
          ) : (
            /* STANDARD SIGN-IN VIEW */
            <form onSubmit={handleSubmit} noValidate>
              {/* Role Selection Tabs */}
              <div style={{ marginBottom: "var(--space-4)" }}>
                <span
                  id="role-select-label"
                  style={{
                    display: "block",
                    fontSize: "var(--text-xs)",
                    fontWeight: 600,
                    marginBottom: "var(--space-2)",
                    color: "var(--color-primary)",
                  }}
                >
                  Select Target Portal Role
                </span>
                <div
                  role="radiogroup"
                  aria-labelledby="role-select-label"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "var(--space-2)",
                  }}
                >
                  {ROLES_ORDER.map((r) => {
                    const isSelected = selectedRole === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => handleSelectRolePill(r)}
                        style={{
                          padding: "8px 10px",
                          borderRadius: "var(--radius-md)",
                          border: `1px solid ${isSelected ? "var(--color-accent)" : "var(--color-border)"}`,
                          backgroundColor: isSelected ? "var(--color-accent-subtle)" : "var(--color-surface-muted)",
                          color: isSelected ? "var(--color-accent)" : "var(--color-primary)",
                          fontSize: "var(--text-xs)",
                          fontWeight: isSelected ? 600 : 500,
                          textAlign: "left",
                          cursor: "pointer",
                          transition: "all var(--transition-fast)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>{ROLE_DISPLAY_NAMES[r]}</span>
                        {isSelected && <span style={{ fontSize: "12px" }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--color-neutral-dark)",
                    marginTop: "6px",
                  }}
                >
                  {ROLE_DESCRIPTIONS[selectedRole]}
                </div>
              </div>

              {/* Identifier Input */}
              <div style={{ marginBottom: "var(--space-3)" }}>
                <label
                  htmlFor="signin-identifier"
                  style={{
                    display: "block",
                    fontSize: "var(--text-xs)",
                    fontWeight: 600,
                    marginBottom: "var(--space-1)",
                    color: "var(--color-primary)",
                  }}
                >
                  Email Address or Mobile Phone
                </label>
                <input
                  id="signin-identifier"
                  name="identifier"
                  type="text"
                  inputMode="email"
                  autoComplete="username"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. azhar.maths@aroush.academy or 9830000002"
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

              {/* Password Input with Visibility Toggle */}
              <div style={{ marginBottom: "var(--space-3)" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "var(--space-1)",
                  }}
                >
                  <label
                    htmlFor="signin-password"
                    style={{
                      fontSize: "var(--text-xs)",
                      fontWeight: 600,
                      color: "var(--color-primary)",
                    }}
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordView(true)}
                    style={{
                      fontSize: "11px",
                      color: "var(--color-accent)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    id="signin-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your account password"
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

              {/* Error Message */}
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

              {/* Submit Button */}
              <div style={{ marginBottom: "var(--space-4)" }}>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isSubmitting}
                  style={{ width: "100%" }}
                >
                  {isSubmitting ? "Authenticating..." : `Sign In as ${ROLE_DISPLAY_NAMES[selectedRole]}`}
                </Button>
              </div>

              {/* One-Click Demo Role Launcher */}
              <div
                style={{
                  borderTop: "1px solid var(--color-border)",
                  paddingTop: "var(--space-4)",
                  marginTop: "var(--space-4)",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "var(--color-neutral-dark)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "var(--space-2)",
                    textAlign: "center",
                  }}
                >
                  Quick One-Click Demo Personas
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "var(--space-2)",
                  }}
                >
                  {ROLES_ORDER.map((r) => {
                    const demo = DEMO_ACCOUNTS[r];
                    return (
                      <button
                        key={`quick-${r}`}
                        type="button"
                        onClick={() => handleQuickDemoSignIn(r)}
                        style={{
                          padding: "6px 8px",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--color-border)",
                          backgroundColor: "var(--color-surface-muted)",
                          fontSize: "11px",
                          color: "var(--color-primary)",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          textAlign: "left",
                          transition: "border-color var(--transition-fast)",
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>{demo.user.name}</span>
                        <span style={{ fontSize: "10px", color: "var(--color-neutral-dark)" }}>
                          {ROLE_DISPLAY_NAMES[r]} &bull; {demo.demoPassword}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </form>
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
              <span style={{ color: "var(--color-neutral-dark)" }}>New student or guardian? </span>
              <Link href="/register" style={{ fontWeight: 600, color: "var(--color-accent)" }}>
                Register Here →
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
