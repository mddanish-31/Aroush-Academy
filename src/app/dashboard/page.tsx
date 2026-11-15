import React, { Suspense } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getCurrentUser } from "@/lib/auth/guard";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Workspace - ArousH Academy",
  description: "Academy account workspace.",
  robots: { index: false, follow: false },
};

async function ProtectedDashboard() {
  if (process.env.NEXT_PUBLIC_AUTH_MODE === "server" || process.env.NODE_ENV === "production") {
    let user;
    try {
      user = await getCurrentUser();
    } catch {
      return <main role="alert" style={{ padding: "var(--space-6)" }}>Your workspace could not be loaded. Please try again later.</main>;
    }
    if (!user) redirect("/login");
    if (user.role === "developer") redirect("/developer");
  }
  return <DashboardShell />;
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: "var(--space-12)", textAlign: "center", color: "var(--color-neutral-dark)" }}>
          Loading role workspace...
        </div>
      }
    >
      <ProtectedDashboard />
    </Suspense>
  );
}
