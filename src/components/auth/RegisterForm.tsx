"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { RegistrationRequest } from "@/lib/auth/authTypes";
import { normalizeIdentifier } from "@/lib/auth/identifier";
import { useMotion } from "@/lib/motion/MotionProvider";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Clock, Check, Eye, EyeOff } from "lucide-react";

interface AcademicOption {
  id: string;
  name: string;
}

interface ServerFieldErrors {
  name?: string;
  identifier?: string;
  class_id?: string;
  board_id?: string;
  password?: string;
  guardian_name?: string;
  guardian_identifier?: string;
  guardian_email?: string;
  guardian_password?: string;
}

function ServerRegisterForm() {
  const { motion } = useMotion();
  const transitionValue =
    motion === "reduced"
      ? "none"
      : "border-color 150ms ease-out, background-color 150ms ease-out";

  const [classes, setClasses] = useState<AcademicOption[]>([]);
  const [boards, setBoards] = useState<AcademicOption[]>([]);
  const [isLoadingAcademics, setIsLoadingAcademics] = useState(true);

  const [studentName, setStudentName] = useState("");
  const [studentIdentifier, setStudentIdentifier] = useState("");
  const [classId, setClassId] = useState("");
  const [boardId, setBoardId] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianIdentifier, setGuardianIdentifier] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");
  const [guardianPassword, setGuardianPassword] = useState("");

  const [showStudentPassword, setShowStudentPassword] = useState(false);
  const [showGuardianPassword, setShowGuardianPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<ServerFieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    let active = true;
    const loadAcademics = async () => {
      try {
        const res = await fetch("/api/public/academics", {
          method: "GET",
          credentials: "same-origin",
        });
        if (!active) {
          return;
        }
        if (res.ok) {
          const data = await res.json().catch(() => null);
          if (data && Array.isArray(data.classes) && Array.isArray(data.boards)) {
            setClasses(data.classes);
            setBoards(data.boards);
          }
        }
      } catch {
      } finally {
        if (active) {
          setIsLoadingAcademics(false);
        }
      }
    };
    loadAcademics();
    return () => {
      active = false;
    };
  }, []);

  const validateFields = (): ServerFieldErrors => {
    const errors: ServerFieldErrors = {};
    const trimmedStudent = studentName.trim();
    const trimmedGuardian = guardianName.trim();

    if (trimmedStudent.length < 2 || trimmedStudent.length > 100) {
      errors.name = "Student name must be between 2 and 100 characters.";
    }

    const normStudent = normalizeIdentifier(studentIdentifier);
    if (!normStudent || studentIdentifier.trim().length > 255) {
      errors.identifier = "Enter a valid student phone number or email address.";
    }

    if (!classId) {
      errors.class_id = "Select an academic class.";
    }

    if (!boardId) {
      errors.board_id = "Select an academic board.";
    }

    if (studentPassword.length < 12 || studentPassword.length > 200) {
      errors.password = "Student password must be between 12 and 200 characters.";
    }

    if (trimmedGuardian.length < 2 || trimmedGuardian.length > 100) {
      errors.guardian_name = "Guardian name must be between 2 and 100 characters.";
    }

    const normGuardian = normalizeIdentifier(guardianIdentifier);
    if (!normGuardian || guardianIdentifier.trim().length > 255) {
      errors.guardian_identifier = "Enter a valid guardian phone number or email address.";
    } else if (normStudent && normGuardian === normStudent) {
      errors.guardian_identifier = "Guardian phone or email must differ from the student identifier.";
    }

    const trimmedGuardianEmail = guardianEmail.trim();
    if (
      trimmedGuardianEmail !== "" &&
      (!trimmedGuardianEmail.includes("@") || trimmedGuardianEmail.length > 255)
    ) {
      errors.guardian_email = "Enter a valid guardian email address or leave blank.";
    }

    if (guardianPassword.length < 12 || guardianPassword.length > 200) {
      errors.guardian_password = "Guardian password must be between 12 and 200 characters.";
    }

    return errors;
  };

  const handleServerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const errors = validateFields();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          name: studentName.trim(),
          identifier: studentIdentifier.trim(),
          password: studentPassword,
          class_id: classId,
          board_id: boardId,
          guardian_name: guardianName.trim(),
          guardian_identifier: guardianIdentifier.trim(),
          guardian_email: guardianEmail.trim() ? guardianEmail.trim() : null,
          guardian_password: guardianPassword,
        }),
      });

      if (res.status === 429) {
        setServerError("Too many registration attempts. Please try again later.");
        return;
      }

      const data = await res.json().catch(() => null);
      if (!res.ok || !data || !data.ok) {
        setServerError("Registration request could not be processed. Please check your details and try again.");
        return;
      }

      setIsSubmitted(true);
    } catch {
      setServerError("Registration request could not be processed. Please check your details and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputBaseStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--color-border)",
    backgroundColor: "var(--color-surface)",
    fontSize: "var(--text-sm)",
    color: "var(--color-primary)",
    outline: "none",
    transition: transitionValue,
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "var(--text-xs)",
    fontWeight: 600,
    marginBottom: "var(--space-1)",
    color: "var(--color-primary)",
  };

  const fieldErrorStyle: React.CSSProperties = {
    marginTop: "4px",
    fontSize: "var(--text-xs)",
    color: "var(--color-danger)",
    lineHeight: 1.4,
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
      <div className="container-narrow" style={{ maxWidth: "640px", width: "100%" }}>
        <Card padding="lg" style={{ boxShadow: "var(--shadow-md)" }}>
          {isSubmitted ? (
            <div style={{ textAlign: "center", padding: "var(--space-4) 0" }} role="status">
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--color-surface-muted)",
                  border: "1px solid var(--color-border)",
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
                  color: "var(--color-primary)",
                }}
              >
                Request received, the academy will approve your account
              </h1>

              <p
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--color-neutral-dark)",
                  maxWidth: "460px",
                  margin: "0 auto var(--space-4)",
                  lineHeight: 1.5,
                }}
              >
                Your student and guardian admission request has been recorded. You will be able to sign in once the academy administrator approves your registration.
              </p>
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
                ArousH Academy - Student & Guardian Enrollment
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
                  marginBottom: "var(--space-5)",
                  lineHeight: 1.5,
                }}
              >
                Complete student and guardian details below to submit your admission request.
              </p>

              <form onSubmit={handleServerSubmit} noValidate>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: "var(--space-3)",
                    marginBottom: "var(--space-3)",
                  }}
                >
                  <div>
                    <label htmlFor="server-reg-student-name" style={labelStyle}>
                      Student Name
                    </label>
                    <input
                      id="server-reg-student-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      aria-invalid={!!fieldErrors.name}
                      aria-describedby={fieldErrors.name ? "server-reg-student-name-error" : undefined}
                      placeholder="Full legal name"
                      style={inputBaseStyle}
                    />
                    {fieldErrors.name && (
                      <div id="server-reg-student-name-error" style={fieldErrorStyle} role="alert">
                        {fieldErrors.name}
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="server-reg-student-identifier" style={labelStyle}>
                      Student Phone or Email
                    </label>
                    <input
                      id="server-reg-student-identifier"
                      name="identifier"
                      type="text"
                      inputMode="email"
                      autoComplete="username"
                      required
                      value={studentIdentifier}
                      onChange={(e) => setStudentIdentifier(e.target.value)}
                      aria-invalid={!!fieldErrors.identifier}
                      aria-describedby={fieldErrors.identifier ? "server-reg-student-identifier-error" : undefined}
                      placeholder="10-digit mobile or email"
                      style={inputBaseStyle}
                    />
                    {fieldErrors.identifier && (
                      <div id="server-reg-student-identifier-error" style={fieldErrorStyle} role="alert">
                        {fieldErrors.identifier}
                      </div>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: "var(--space-3)",
                    marginBottom: "var(--space-3)",
                  }}
                >
                  <div>
                    <label htmlFor="server-reg-class" style={labelStyle}>
                      Class
                    </label>
                    <select
                      id="server-reg-class"
                      name="class_id"
                      required
                      disabled={isLoadingAcademics}
                      value={classId}
                      onChange={(e) => setClassId(e.target.value)}
                      aria-invalid={!!fieldErrors.class_id}
                      aria-describedby={fieldErrors.class_id ? "server-reg-class-error" : undefined}
                      style={inputBaseStyle}
                    >
                      <option value="">Select class</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.class_id && (
                      <div id="server-reg-class-error" style={fieldErrorStyle} role="alert">
                        {fieldErrors.class_id}
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="server-reg-board" style={labelStyle}>
                      Board
                    </label>
                    <select
                      id="server-reg-board"
                      name="board_id"
                      required
                      disabled={isLoadingAcademics}
                      value={boardId}
                      onChange={(e) => setBoardId(e.target.value)}
                      aria-invalid={!!fieldErrors.board_id}
                      aria-describedby={fieldErrors.board_id ? "server-reg-board-error" : undefined}
                      style={inputBaseStyle}
                    >
                      <option value="">Select board</option>
                      {boards.map((brd) => (
                        <option key={brd.id} value={brd.id}>
                          {brd.name}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.board_id && (
                      <div id="server-reg-board-error" style={fieldErrorStyle} role="alert">
                        {fieldErrors.board_id}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: "var(--space-4)" }}>
                  <label htmlFor="server-reg-student-password" style={labelStyle}>
                    Student Password (minimum 12 characters)
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      id="server-reg-student-password"
                      name="password"
                      type={showStudentPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={studentPassword}
                      onChange={(e) => setStudentPassword(e.target.value)}
                      aria-invalid={!!fieldErrors.password}
                      aria-describedby={fieldErrors.password ? "server-reg-student-password-error" : undefined}
                      placeholder="At least 12 characters"
                      style={{ ...inputBaseStyle, paddingRight: "76px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowStudentPassword((prev) => !prev)}
                      aria-label={showStudentPassword ? "Hide student password" : "Show student password"}
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--color-primary)",
                        padding: "4px 6px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "11px",
                        fontWeight: 600,
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      {showStudentPassword ? <EyeOff size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
                      <span>{showStudentPassword ? "Hide" : "Show"}</span>
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <div id="server-reg-student-password-error" style={fieldErrorStyle} role="alert">
                      {fieldErrors.password}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    borderTop: "1px solid var(--color-border)",
                    paddingTop: "var(--space-4)",
                    marginBottom: "var(--space-3)",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: "var(--space-3)",
                  }}
                >
                  <div>
                    <label htmlFor="server-reg-guardian-name" style={labelStyle}>
                      Guardian Name
                    </label>
                    <input
                      id="server-reg-guardian-name"
                      name="guardian_name"
                      type="text"
                      autoComplete="name"
                      required
                      value={guardianName}
                      onChange={(e) => setGuardianName(e.target.value)}
                      aria-invalid={!!fieldErrors.guardian_name}
                      aria-describedby={fieldErrors.guardian_name ? "server-reg-guardian-name-error" : undefined}
                      placeholder="Parent or guardian full name"
                      style={inputBaseStyle}
                    />
                    {fieldErrors.guardian_name && (
                      <div id="server-reg-guardian-name-error" style={fieldErrorStyle} role="alert">
                        {fieldErrors.guardian_name}
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="server-reg-guardian-identifier" style={labelStyle}>
                      Guardian Phone or Email
                    </label>
                    <input
                      id="server-reg-guardian-identifier"
                      name="guardian_identifier"
                      type="text"
                      inputMode="email"
                      autoComplete="tel"
                      required
                      value={guardianIdentifier}
                      onChange={(e) => setGuardianIdentifier(e.target.value)}
                      aria-invalid={!!fieldErrors.guardian_identifier}
                      aria-describedby={fieldErrors.guardian_identifier ? "server-reg-guardian-identifier-error" : undefined}
                      placeholder="10-digit mobile or email"
                      style={inputBaseStyle}
                    />
                    {fieldErrors.guardian_identifier && (
                      <div id="server-reg-guardian-identifier-error" style={fieldErrorStyle} role="alert">
                        {fieldErrors.guardian_identifier}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: "var(--space-3)" }}>
                  <label htmlFor="server-reg-guardian-email" style={labelStyle}>
                    Guardian Email (Optional)
                  </label>
                  <input
                    id="server-reg-guardian-email"
                    name="guardian_email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={guardianEmail}
                    onChange={(e) => setGuardianEmail(e.target.value)}
                    aria-invalid={!!fieldErrors.guardian_email}
                    aria-describedby={fieldErrors.guardian_email ? "server-reg-guardian-email-error" : undefined}
                    placeholder="Optional email for notifications"
                    style={inputBaseStyle}
                  />
                  {fieldErrors.guardian_email && (
                    <div id="server-reg-guardian-email-error" style={fieldErrorStyle} role="alert">
                      {fieldErrors.guardian_email}
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: "var(--space-4)" }}>
                  <label htmlFor="server-reg-guardian-password" style={labelStyle}>
                    Guardian Password (minimum 12 characters)
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      id="server-reg-guardian-password"
                      name="guardian_password"
                      type={showGuardianPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={guardianPassword}
                      onChange={(e) => setGuardianPassword(e.target.value)}
                      aria-invalid={!!fieldErrors.guardian_password}
                      aria-describedby={fieldErrors.guardian_password ? "server-reg-guardian-password-error" : undefined}
                      placeholder="At least 12 characters"
                      style={{ ...inputBaseStyle, paddingRight: "76px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowGuardianPassword((prev) => !prev)}
                      aria-label={showGuardianPassword ? "Hide guardian password" : "Show guardian password"}
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--color-primary)",
                        padding: "4px 6px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "11px",
                        fontWeight: 600,
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      {showGuardianPassword ? <EyeOff size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
                      <span>{showGuardianPassword ? "Hide" : "Show"}</span>
                    </button>
                  </div>
                  {fieldErrors.guardian_password && (
                    <div id="server-reg-guardian-password-error" style={fieldErrorStyle} role="alert">
                      {fieldErrors.guardian_password}
                    </div>
                  )}
                </div>

                {serverError && (
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
                    {serverError}
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
                    {isSubmitting ? "Submitting Enrollment Request..." : "Submit Enrollment Application"}
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

export function RegisterForm() {
  if (process.env.NEXT_PUBLIC_AUTH_MODE === "server") {
    return <ServerRegisterForm />;
  }
  return <DemoRegisterForm />;
}

function DemoRegisterForm() {
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
