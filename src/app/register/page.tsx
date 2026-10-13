import React, { Suspense } from "react";
import { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Create Account — ArousH Academy",
  description:
    "Student and Guardian account registration for ArousH Academy. Faculty and Administration accounts require institutional authorization.",
};

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: "var(--space-16)", textAlign: "center", color: "var(--color-neutral-dark)" }}>
          Loading registration portal...
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
