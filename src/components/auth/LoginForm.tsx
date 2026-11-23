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
} from "@/lib/auth/authTypes";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Check, Eye, EyeOff } from "lucide-react";

const ROLES_ORDER: UserRole[] = ["academy-admin", "teacher", "student", "parent"];
const isServerAuthMode =
  process.env.NEXT_PUBLIC_AUTH_MODE === "server" ||
  process.env.NODE_ENV === "production";
const isDemoAuthMode = !isServerAuthMode;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, requestPasswordReset, quickSignInDemo, user, isAuthenticated } = useAuth();

  const queryRole = searchParams ? (searchParams.get("role") as UserRole | null) : null;
  const validQueryRole = queryRole && ROLES_ORDER.includes(queryRole) ? queryRole : null;

  const [chosenRole, setChosenRole] = useState<UserRole | null>(null);
  const selectedRole = chosenRole || validQueryRole || "student";

  const [isRoleSelectorOpen, setIsRoleSelectorOpen] = useState(false);
  const [identifier, setIdentifier] = useState(() => {
    if (isDemoAuthMode) {
      const demo = DEMO_ACCOUNTS[selectedRole];
      return demo ? demo.user.identifier : "";
    }
    return "";
  });
  const [password, setPassword] = useState(() => {
    if (isDemoAuthMode) {
      const demo = DEMO_ACCOUNTS[selectedRole];
      return demo ? demo.demoPassword : "";
    }
    return "";
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isForgotPasswordView, setIsForgotPasswordView] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState("");
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);
  const [prevSelectedRole, setPrevSelectedRole] = useState(selectedRole);
  if (prevSelectedRole !== selectedRole) {
    setPrevSelectedRole(selectedRole);
    if (isDemoAuthMode) {
      const demo = DEMO_ACCOUNTS[selectedRole];
      if (demo) {
        setIdentifier(demo.user.identifier);
        setPassword(demo.demoPassword);
      }
    }
  }

  const handleSelectRolePill = (role: UserRole) => {
    setChosenRole(role);
    if (isDemoAuthMode) {
      const demo = DEMO_ACCOUNTS[role];
      if (demo) {
        setIdentifier(demo.user.identifier);
        setPassword(demo.demoPassword);
      }
    }
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
          res.error || (isServerAuthMode ? "Sign in failed. Check your details and try again." : "Invalid credentials. Please verify your details or use one-click demo sign-in.")
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

  const showDemoHelper =
    isDemoAuthMode ||
    process.env.NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS === "true" ||
    (process.env.NODE_ENV !== "production" &&
      process.env.NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS !== "false");

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
      <div className="container-narrow" style={{ maxWidth: "520px" }}>
        <Card padding="lg" style={{ boxShadow: "var(--shadow-md)" }}>
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
            ArousH Academy &bull; Identity Gateway
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
              marginBottom: "var(--space-4)",
              lineHeight: 1.5,
            }}
          >
            {isForgotPasswordView
              ? isServerAuthMode
                ? "Automatic recovery is unavailable. Contact the academy for manual identity verification and a one-time code."
                : "Enter your registered email address or mobile number to receive a simulated recovery token."
              : "Access role-tailored dashboards for Academy Administration, Teachers, Students, and Parents."}
          </p>

          {isAuthenticated && user && !isForgotPasswordView && (
            <div
              style={{
                backgroundColor: "var(--color-surface-muted)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                padding: "var(--space-3) var(--space-4)",
                marginBottom: "var(--space-4)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)" }}>
                   {isServerAuthMode ? "Current account:" : "Current Active Demo Persona:"}
                </div>
                <div style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>
                  {user.name} ({ROLE_DISPLAY_NAMES[user.role]})
                </div>
              </div>
              <Button href={ROLE_DEFAULT_ROUTES[user.role]} variant="accent" size="sm">
                Open Dashboard &rarr;
              </Button>
            </div>
          )}

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
                  {isResetSubmitting ? "Checking..." : "Request recovery help"}
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
                  &larr; Return to Sign In
                </button>
              </div>
              <p><Link href="/activate">Already have a one-time code? Set your password</Link></p>
            </form>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              {isDemoAuthMode && <div
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
                  Role: <strong data-testid="selected-role-name">{ROLE_DISPLAY_NAMES[selectedRole]}</strong>
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
              </div>}

              {isDemoAuthMode && isRoleSelectorOpen && (
                <div
                  role="radiogroup"
                  aria-label="Choose role"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "var(--space-2)",
                    marginBottom: "var(--space-4)",
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
                        onClick={() => {
                          handleSelectRolePill(r);
                          setIsRoleSelectorOpen(false);
                        }}
                        style={{
                          padding: "8px 10px",
                          borderRadius: "var(--radius-md)",
                          border: `1px solid ${isSelected ? "#1D1D1F" : "var(--color-border)"}`,
                          backgroundColor: isSelected ? "#1D1D1F" : "var(--color-surface-muted)",
                          color: isSelected ? "#FFFFFF" : "var(--color-primary)",
                          fontSize: "var(--text-xs)",
                          fontWeight: isSelected ? 600 : 500,
                          textAlign: "left",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <span style={{ color: isSelected ? "#FFFFFF" : "#1D1D1F" }}>
                          {ROLE_DISPLAY_NAMES[r]}
                        </span>
                        {isSelected && <Check size={14} aria-hidden="true" style={{ color: "#FFFFFF" }} />}
                      </button>
                    );
                  })}
                </div>
              )}

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
                      color: "#1D1D1F",
                      textDecoration: "underline",
                      textDecorationColor: "#007AFF",
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
                    placeholder="Enter account security key"
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
                    aria-label={showPassword ? "Hide password key" : "Show password key"}
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
                  {isSubmitting ? "Signing in..." : isServerAuthMode ? "Sign in" : `Sign In as ${ROLE_DISPLAY_NAMES[selectedRole]}`}
                </Button>
              </div>

              {showDemoHelper && (
                <details
                  style={{
                    marginBottom: "var(--space-4)",
                    padding: "10px 12px",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "rgba(29, 29, 31, 0.03)",
                    border: "1px solid rgba(170, 170, 170, 0.35)",
                  }}
                >
                  <summary
                    style={{
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#1D1D1F",
                    }}
                  >
                    Demo Accounts & Quick Sign In
                  </summary>
                  <div style={{ marginTop: "var(--space-3)" }}>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--color-neutral-dark)",
                        marginBottom: "var(--space-2)",
                        lineHeight: 1.4,
                      }}
                    >
                      {isServerAuthMode
                        ? "Demo accounts. Select any role below to sign in or view saved credentials:"
                        : "Mock adapter preview. Select any role below for instant demo credentials:"}
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
                        if (!demo) return null;
                        return (
                          <button
                            key={`quick-${r}`}
                            type="button"
                            onClick={() => handleQuickDemoSignIn(r)}
                            style={{
                              padding: "8px",
                              borderRadius: "var(--radius-md)",
                              border: "1px solid var(--color-border)",
                              backgroundColor: "var(--color-surface)",
                              textAlign: "left",
                              cursor: "pointer",
                              display: "flex",
                              flexDirection: "column",
                              gap: "2px",
                            }}
                          >
                            <span style={{ fontSize: "11px", fontWeight: 600, color: "#1D1D1F" }}>
                              {demo.user.name}
                            </span>
                            <span style={{ fontSize: "10px", color: "#48484A", overflowWrap: "anywhere" }}>
                              {demo.user.identifier}
                            </span>
                            <span style={{ fontSize: "10px", color: "#48484A" }}>
                              {ROLE_DISPLAY_NAMES[r]} &bull; {demo.demoPassword}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </details>
              )}
            </form>
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
              <span style={{ color: "var(--color-neutral-dark)" }}>New student or guardian? </span>
              <Link
                href="/register"
                style={{
                  fontWeight: 600,
                  color: "#1D1D1F",
                  textDecoration: "underline",
                  textDecorationColor: "#007AFF",
                  textUnderlineOffset: "3px",
                }}
              >
                Register Here &rarr;
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
