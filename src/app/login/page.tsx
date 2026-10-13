import React, { Suspense } from "react";
import { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign In — ArousH Academy",
  description:
    "Sign in to ArousH Academy for Academy Administration, Teachers, Students, and Parents.",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: "var(--space-16)", textAlign: "center", color: "var(--color-neutral-dark)" }}>
          Loading identity gateway...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
